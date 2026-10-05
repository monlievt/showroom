"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession, destroySession, getSession } from "@/lib/auth/session";
import { rateLimiter } from "@/lib/security/rate-limiter";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function loginAction(formData: {
  identifier: string; // username, phone, or name
  pin?: string;
  password?: string;
  role: "OWNER" | "ADMIN" | "STAFF_ADMIN" | "SALES" | "INVESTOR";
}) {
  try {
    const { identifier, role } = formData;
    const inputPassword = (formData.password || formData.pin || "").trim();

    if (!identifier || !inputPassword) {
      return { success: false, error: "Nomor HP / Username dan kata sandi wajib diisi" };
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // ── PROTEKSI BRUTE-FORCE RATE LIMITING ──
    const limitCheck = rateLimiter.check(`login:${cleanIdentifier}`, 5, 5 * 60 * 1000, 15 * 60 * 1000);
    if (!limitCheck.allowed) {
      return {
        success: false,
        error: `Terlalu banyak percobaan login yang gagal. Akun/IP dibekukan sementara demi keamanan. Silakan coba lagi dalam ${Math.ceil((limitCheck.retryAfterSec || 60) / 60)} menit.`,
      };
    }

    // ── CARI USER PROFILE DI DATABASE ──
    let userProfile = null;

    if (role === "INVESTOR") {
      const cleanPhone = identifier.replace(/\D/g, "");
      const investor = await prisma.investor.findFirst({
        where: {
          OR: [
            { phone: { contains: cleanPhone.slice(-8) } },
            { name: { contains: identifier } },
            { id: identifier },
          ],
        },
        include: {
          userProfile: true,
        },
      });

      if (!investor) {
        return {
          success: false,
          error: "Data investor dengan nomor telepon / nama tersebut tidak ditemukan.",
        };
      }

      userProfile = investor.userProfile;
      if (!userProfile) {
        userProfile = await prisma.userProfile.create({
          data: {
            authUserId: `investor-${investor.id}`,
            role: "INVESTOR",
            fullName: investor.name,
            phone: investor.phone,
            investorId: investor.id,
          },
        });
      }
    } else {
      // Cari akun berdasarkan authUserId (termasuk alias default) atau nomor telepon
      const aliasMap: Record<string, string[]> = {
        owner: ["admin-owner-001", "owner"],
        admin_garasi: ["staff-admin-001", "admin_garasi"],
        sales01: ["sales-field-001", "sales01"],
      };
      const possibleAuthIds = [cleanIdentifier, ...(aliasMap[cleanIdentifier] || [])];

      userProfile = await prisma.userProfile.findFirst({
        where: {
          OR: [
            { authUserId: { in: possibleAuthIds } },
            { phone: identifier },
            { phone: cleanIdentifier },
          ],
        },
      });
    }

    // ── CEK STATUS AKTIF AKUN ──
    if (userProfile && !userProfile.isActive) {
      return {
        success: false,
        error: "Akun ini telah dinonaktifkan oleh administrator. Hubungi Owner untuk aktivasi.",
      };
    }

    // ── VERIFIKASI KATA SANDI (DATABASE BCRYPT / ENVIRONMENT VARIABLE FALLBACK) ──
    let isPasswordValid = false;

    // 1. Cek jika user memiliki passwordHash tersimpan di database
    if (userProfile?.passwordHash) {
      isPasswordValid = bcrypt.compareSync(inputPassword, userProfile.passwordHash);
    }

    // 2. Fallback: Cek konfigurasi env (AUTH_PASSWORD_... atau MASTER_PASSWORD)
    if (!isPasswordValid) {
      const masterPassword = process.env.MASTER_PASSWORD || process.env.MASTER_PIN;
      const rolePasswordMap: Record<string, string | undefined> = {
        OWNER: process.env.AUTH_PASSWORD_OWNER,
        ADMIN: process.env.AUTH_PASSWORD_OWNER,
        STAFF_ADMIN: process.env.AUTH_PASSWORD_STAFF,
        SALES: process.env.AUTH_PASSWORD_SALES,
        INVESTOR: process.env.AUTH_PASSWORD_INVESTOR,
      };

      const targetRole = userProfile ? userProfile.role : role;
      const targetPassword = rolePasswordMap[targetRole];
      isPasswordValid = Boolean(
        (targetPassword && inputPassword === targetPassword) ||
        (masterPassword && inputPassword === masterPassword)
      );
    }

    if (!isPasswordValid) {
      return {
        success: false,
        error: `Password salah. Sisa percobaan: ${limitCheck.remaining}.`,
      };
    }

    // Login sukses: reset penghitung kegagalan
    rateLimiter.reset(`login:${cleanIdentifier}`);

    // Jika userProfile belum ada (misal login pertama kali via role fallback), buatkan profilnya
    if (!userProfile) {
      const defaultNames: Record<string, string> = {
        OWNER: "Owner Nur Mobil",
        ADMIN: "Admin Nur Mobil",
        STAFF_ADMIN: "Staff Operasional & Garasi",
        SALES: "Tim Sales Nur Mobil",
      };

      userProfile = await prisma.userProfile.create({
        data: {
          authUserId: cleanIdentifier,
          role: role,
          fullName: defaultNames[role] || "Pengguna Sistem",
          phone: identifier.match(/^\d+$/) ? identifier : null,
          passwordHash: bcrypt.hashSync(inputPassword, 10),
          isActive: true,
        },
      });
    } else if (!userProfile.passwordHash) {
      // Simpan hash password ke DB jika sebelumnya belum tersimpan
      await prisma.userProfile.update({
        where: { id: userProfile.id },
        data: { passwordHash: bcrypt.hashSync(inputPassword, 10) },
      });
    }

    // ── BUAT SESI LOGIN SESUAI ROLE PROFIL DI DATABASE ──
    const effectiveRole = userProfile.role;
    await createSession({
      userId: userProfile.id,
      authUserId: userProfile.authUserId,
      role: effectiveRole,
      fullName: userProfile.fullName,
      phone: userProfile.phone,
    });

    let redirectUrl = "/admin";
    if (effectiveRole === "STAFF_ADMIN") {
      redirectUrl = "/admin/inventory";
    } else if (effectiveRole === "SALES") {
      redirectUrl = "/admin/inventory?status=READY_FOR_SALE";
    } else if (effectiveRole === "INVESTOR") {
      redirectUrl = userProfile.investorId ? `/investor?id=${userProfile.investorId}` : "/investor";
    }

    return { success: true, redirectUrl };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal melakukan proses login" };
  }
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function getCurrentUserAction() {
  return await getSession();
}
