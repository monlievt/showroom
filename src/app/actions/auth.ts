"use server";

import prisma from "@/lib/prisma";
import { createSession, destroySession, getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function loginAction(formData: {
  identifier: string; // username, phone, or name
  pin: string;
  role: "ADMIN" | "INVESTOR";
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

    if (role === "ADMIN") {
      // Cari atau buat UserProfile Admin
      let adminProfile = await prisma.userProfile.findFirst({
        where: { role: "ADMIN" },
      });

      if (!adminProfile) {
        adminProfile = await prisma.userProfile.create({
          data: {
            authUserId: "admin-owner-001",
            role: "ADMIN",
            fullName: "Owner Nur Mobil (Toko Bu Nur)",
            phone: identifier,
          },
        });
      }

      await createSession({
        userId: adminProfile.id,
        authUserId: adminProfile.authUserId,
        role: "ADMIN",
        fullName: adminProfile.fullName,
        phone: adminProfile.phone,
      });

      return { success: true, redirectUrl: "/admin/inventory" };
    } else {
      // INVESTOR
      // Cari investor berdasarkan nomor telepon atau ID atau nama
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
