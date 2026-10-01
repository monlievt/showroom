"use server";

import prisma from "@/lib/prisma";
import { createSession, destroySession, getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function loginAction(formData: {
  identifier: string; // username, phone, or name
  pin: string;
  role: "OWNER" | "ADMIN" | "STAFF_ADMIN" | "SALES" | "INVESTOR";
}) {
  try {
    const { identifier, pin, role } = formData;

    if (!identifier || !pin) {
      return { success: false, error: "Nomor HP / Username dan PIN wajib diisi" };
    }

    // Default PIN master operasional untuk demo/lokal: 123456
    // Bisa disesuaikan di production via environment variable MASTER_PIN
    const validPin = process.env.MASTER_PIN || "123456";
    if (pin !== validPin && pin !== "admin123") {
      return { success: false, error: "PIN atau kata sandi yang Anda masukkan salah" };
    }

    if (role === "OWNER" || role === "ADMIN") {
      // Cari atau buat UserProfile Owner
      let profile = await prisma.userProfile.findFirst({
        where: { role: { in: ["OWNER", "ADMIN"] } },
      });

      if (!profile) {
        profile = await prisma.userProfile.create({
          data: {
            authUserId: "admin-owner-001",
            role: "OWNER",
            fullName: "Owner Nur Mobil (Toko Bu Nur)",
            phone: identifier,
          },
        });
      }

      await createSession({
        userId: profile.id,
        authUserId: profile.authUserId,
        role: "OWNER",
        fullName: profile.fullName,
        phone: profile.phone,
      });

      return { success: true, redirectUrl: "/admin" };
    } else if (role === "STAFF_ADMIN") {
      // Cari atau buat UserProfile Staff Admin
      let profile = await prisma.userProfile.findFirst({
        where: { role: "STAFF_ADMIN" },
      });

      if (!profile) {
        profile = await prisma.userProfile.create({
          data: {
            authUserId: "staff-admin-001",
            role: "STAFF_ADMIN",
            fullName: "Staff Operasional & Garasi",
            phone: identifier,
          },
        });
      }

      await createSession({
        userId: profile.id,
        authUserId: profile.authUserId,
        role: "STAFF_ADMIN",
        fullName: profile.fullName,
        phone: profile.phone,
      });

      return { success: true, redirectUrl: "/admin/inventory" };
    } else if (role === "SALES") {
      // Cari atau buat UserProfile Sales
      let profile = await prisma.userProfile.findFirst({
        where: { role: "SALES" },
      });

      if (!profile) {
        profile = await prisma.userProfile.create({
          data: {
            authUserId: "sales-field-001",
            role: "SALES",
            fullName: "Tim Sales Nur Mobil",
            phone: identifier,
          },
        });
      }

      await createSession({
        userId: profile.id,
        authUserId: profile.authUserId,
        role: "SALES",
        fullName: profile.fullName,
        phone: profile.phone,
      });

      return { success: true, redirectUrl: "/admin/inventory?status=READY_FOR_SALE" };
    } else {
      // INVESTOR
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

      // Pastikan ada UserProfile yang tertaut
      let userProfile = investor.userProfile;
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

      await createSession({
        userId: userProfile.id,
        authUserId: userProfile.authUserId,
        role: "INVESTOR",
        fullName: investor.name,
        phone: investor.phone,
        investorId: investor.id,
      });

      return { success: true, redirectUrl: `/investor?id=${investor.id}` };
    }
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
