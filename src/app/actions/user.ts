"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requireRole } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";

export interface UserItem {
  id: string;
  authUserId: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  investorId: string | null;
  hasPassword: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mengambil seluruh daftar pengguna sistem (Hanya Owner & Admin)
 */
export async function getUsersListAction(): Promise<{
  success: boolean;
  data?: UserItem[];
  investors?: Array<{ id: string; name: string; phone: string | null }>;
  error?: string;
}> {
  try {
    await requireRole(["OWNER", "ADMIN"]);

    const [users, investors] = await Promise.all([
      prisma.userProfile.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          authUserId: true,
          fullName: true,
          phone: true,
          role: true,
          isActive: true,
          investorId: true,
          passwordHash: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.investor.findMany({
        select: {
          id: true,
          name: true,
          phone: true,
        },
        orderBy: { name: "asc" },
      }),
    ]);

    const sanitizedUsers: UserItem[] = users.map((u) => ({
      id: u.id,
      authUserId: u.authUserId,
      fullName: u.fullName,
      phone: u.phone,
      role: u.role,
      isActive: u.isActive,
      investorId: u.investorId,
      hasPassword: Boolean(u.passwordHash),
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    return {
      success: true,
      data: sanitizedUsers,
      investors: investors.map((i) => ({ id: i.id, name: i.name, phone: i.phone })),
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal memuat daftar pengguna" };
  }
}

/**
 * Menambahkan pengguna baru (Hanya Owner & Admin)
 */
export async function createUserAction(formData: {
  authUserId: string;
  fullName: string;
  phone?: string;
  role: "OWNER" | "ADMIN" | "STAFF_ADMIN" | "SALES" | "INVESTOR";
  password: string;
  investorId?: string;
}) {
  try {
    const session = await requireRole(["OWNER", "ADMIN"]);

    const cleanUsername = formData.authUserId.trim().toLowerCase().replace(/\s+/g, "_");
    if (!cleanUsername || cleanUsername.length < 3) {
      return { success: false, error: "Username minimal 3 karakter (tanpa spasi)." };
    }

    if (!formData.fullName.trim()) {
      return { success: false, error: "Nama lengkap wajib diisi." };
    }

    if (!formData.password || formData.password.trim().length < 8) {
      return { success: false, error: "Password minimal 8 karakter." };
    }

    // Cek apakah username sudah dipakai
    const existing = await prisma.userProfile.findFirst({
      where: {
        OR: [
          { authUserId: cleanUsername },
          ...(formData.phone ? [{ phone: formData.phone.trim() }] : []),
        ],
      },
    });

    if (existing) {
      if (existing.authUserId === cleanUsername) {
        return { success: false, error: `Username '${cleanUsername}' sudah terdaftar. Gunakan username lain.` };
      }
      return { success: false, error: `Nomor telepon '${formData.phone}' sudah digunakan oleh akun lain.` };
    }

    let linkedInvestorId = formData.investorId;
    // Jika role INVESTOR dan belum ada investorId, buat data Investor otomatis
    if (formData.role === "INVESTOR" && !linkedInvestorId) {
      const newInvestor = await prisma.investor.create({
        data: {
          name: formData.fullName.trim(),
          phone: formData.phone?.trim() || cleanUsername,
          type: "THIRD_PARTY",
        },
      });
      linkedInvestorId = newInvestor.id;
    }

    const passwordHash = bcrypt.hashSync(formData.password.trim(), 10);

    const newUser = await prisma.userProfile.create({
      data: {
        authUserId: cleanUsername,
        fullName: formData.fullName.trim(),
        phone: formData.phone?.trim() || null,
        role: formData.role,
        passwordHash,
        isActive: true,
        investorId: linkedInvestorId || null,
      },
    });

    // Catat ke Jejak Audit
    await prisma.auditLog.create({
      data: {
        actorUserId: session.authUserId,
        action: "CREATE_USER",
        entityType: "USER",
        entityId: newUser.id,
        afterData: {
          authUserId: newUser.authUserId,
          fullName: newUser.fullName,
          role: newUser.role,
          phone: newUser.phone,
          investorId: newUser.investorId,
        },
      },
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin/settings");

    return { success: true, message: `Pengguna '${newUser.fullName}' berhasil ditambahkan.` };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal membuat pengguna baru" };
  }
}

/**
 * Mengubah data pengguna, role, status aktif, atau reset password (Hanya Owner & Admin)
 */
export async function updateUserAction(formData: {
  id: string;
  fullName: string;
  phone?: string;
  role: "OWNER" | "ADMIN" | "STAFF_ADMIN" | "SALES" | "INVESTOR";
  isActive: boolean;
  newPassword?: string;
  investorId?: string;
}) {
  try {
    const session = await requireRole(["OWNER", "ADMIN"]);

    const existing = await prisma.userProfile.findUnique({
      where: { id: formData.id },
    });

    if (!existing) {
      return { success: false, error: "Pengguna tidak ditemukan." };
    }

    // Proteksi akun Owner Utama agar tidak terkunci/berubah peran
    const isPrimaryOwner = existing.authUserId === "admin-owner-001" || existing.authUserId === "owner";
    if (isPrimaryOwner) {
      if (!formData.isActive) {
        return { success: false, error: "Akun Owner Utama tidak dapat dinonaktifkan." };
      }
      if (formData.role !== "OWNER") {
        return { success: false, error: "Peran Akun Owner Utama tidak dapat diubah." };
      }
    }

    const updateData: {
      fullName: string;
      phone: string | null;
      role: UserRole;
      isActive: boolean;
      passwordHash?: string;
      investorId?: string | null;
    } = {
      fullName: formData.fullName.trim(),
      phone: formData.phone?.trim() || null,
      role: formData.role,
      isActive: formData.isActive,
    };

    if (formData.role === "INVESTOR") {
      if (formData.investorId) {
        updateData.investorId = formData.investorId;
      }
    } else if (existing.investorId) {
      updateData.investorId = null;
    }

    if (formData.newPassword && formData.newPassword.trim()) {
      if (formData.newPassword.trim().length < 8) {
        return { success: false, error: "Password baru minimal 8 karakter." };
      }
      updateData.passwordHash = bcrypt.hashSync(formData.newPassword.trim(), 10);
    }

    const updated = await prisma.userProfile.update({
      where: { id: formData.id },
      data: updateData,
    });

    // Catat ke Jejak Audit
    await prisma.auditLog.create({
      data: {
        actorUserId: session.authUserId,
        action: "UPDATE_USER",
        entityType: "USER",
        entityId: updated.id,
        beforeData: {
          fullName: existing.fullName,
          role: existing.role,
          isActive: existing.isActive,
          phone: existing.phone,
        },
        afterData: {
          fullName: updated.fullName,
          role: updated.role,
          isActive: updated.isActive,
          phone: updated.phone,
          passwordChanged: Boolean(formData.newPassword),
        },
      },
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin/settings");

    return { success: true, message: `Data pengguna '${updated.fullName}' berhasil diperbarui.` };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal memperbarui pengguna" };
  }
}

/**
 * Menghapus pengguna dari sistem (Hanya Owner & Admin)
 */
export async function deleteUserAction(id: string) {
  try {
    const session = await requireRole(["OWNER", "ADMIN"]);

    const targetUser = await prisma.userProfile.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return { success: false, error: "Pengguna tidak ditemukan." };
    }

    // Proteksi akun Owner Utama
    if (targetUser.authUserId === "admin-owner-001" || targetUser.authUserId === "owner") {
      return { success: false, error: "Akun Owner Utama tidak dapat dihapus." };
    }

    // Tidak boleh menghapus akun diri sendiri yang sedang login
    if (targetUser.id === session.userId || targetUser.authUserId === session.authUserId) {
      return { success: false, error: "Anda tidak dapat menghapus akun Anda sendiri saat sedang login." };
    }

    // Jika terhubung dengan data investor, cegah atau lepaskan relasi
    if (targetUser.investorId) {
      return {
        success: false,
        error: "Pengguna ini tertaut dengan data Investor. Nonaktifkan status akun jika tidak ingin digunakan lagi.",
      };
    }

    await prisma.userProfile.delete({
      where: { id },
    });

    // Catat ke Jejak Audit
    await prisma.auditLog.create({
      data: {
        actorUserId: session.authUserId,
        action: "DELETE_USER",
        entityType: "USER",
        entityId: id,
        beforeData: {
          authUserId: targetUser.authUserId,
          fullName: targetUser.fullName,
          role: targetUser.role,
        },
      },
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin/settings");

    return { success: true, message: `Pengguna '${targetUser.fullName}' berhasil dihapus.` };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menghapus pengguna" };
  }
}
