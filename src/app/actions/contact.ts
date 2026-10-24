"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import {
  WhatsAppAdminContact,
  DEFAULT_WHATSAPP_ADMINS,
  normalizeWhatsAppNumber,
} from "@/lib/utils/whatsapp";

const SETTING_KEY = "PUBLIC_WHATSAPP_ADMINS";

/**
 * Mengambil daftar kontak WhatsApp Admin untuk tampilan publik.
 * Otomatis memfilter hanya kontak yang berstatus aktif (isActive: true).
 */
export async function getPublicWhatsAppContactsAction(): Promise<WhatsAppAdminContact[]> {
  try {
    const delegate = (prisma as any)?.systemSetting;
    if (delegate?.findUnique) {
      const record = await delegate.findUnique({
        where: { key: SETTING_KEY },
      });

      if (record?.value) {
        const parsed = JSON.parse(record.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const activeOnly = parsed.filter(
            (c: WhatsAppAdminContact) => c.isActive !== false && c.phone && c.phone.trim().length > 0
          );
          if (activeOnly.length > 0) {
            return activeOnly;
          }
        }
      }
    }
  } catch (error) {
    console.error("[getPublicWhatsAppContactsAction] Gagal membaca setting kontak WA:", error);
  }

  // Fallback ke kontak default
  return DEFAULT_WHATSAPP_ADMINS.filter((c) => c.isActive);
}

/**
 * Mengambil SEMUA kontak WhatsApp Admin untuk panel konfigurasi admin (termasuk yang nonaktif).
 */
export async function getAllWhatsAppContactsAction(): Promise<{
  success: boolean;
  data: WhatsAppAdminContact[];
  error?: string;
}> {
  try {
    await requireRole(["OWNER", "ADMIN"]);

    const delegate = (prisma as any)?.systemSetting;
    if (delegate?.findUnique) {
      const record = await delegate.findUnique({
        where: { key: SETTING_KEY },
      });

      if (record?.value) {
        const parsed = JSON.parse(record.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return { success: true, data: parsed };
        }
      }
    }

    return { success: true, data: DEFAULT_WHATSAPP_ADMINS };
  } catch (error: any) {
    console.error("[getAllWhatsAppContactsAction] Gagal:", error);
    return {
      success: false,
      data: DEFAULT_WHATSAPP_ADMINS,
      error: error?.message || "Gagal memuat kontak WhatsApp admin.",
    };
  }
}

/**
 * Menyimpan daftar kontak WhatsApp Admin dari panel admin.
 */
export async function saveWhatsAppContactsAction(
  contacts: WhatsAppAdminContact[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(["OWNER", "ADMIN"]);

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return { success: false, error: "Minimal harus ada 1 nomor kontak admin." };
    }

    // Validasi data kontak
    const sanitized: WhatsAppAdminContact[] = contacts.map((c, idx) => {
      if (!c.name || !c.name.trim()) {
        throw new Error(`Nama kontak pada urutan ke-${idx + 1} tidak boleh kosong.`);
      }
      if (!c.phone || !c.phone.trim()) {
        throw new Error(`Nomor telepon untuk ${c.name} tidak boleh kosong.`);
      }

      // Normalisasi nomor HP
      const clean = normalizeWhatsAppNumber(c.phone);
      if (clean.length < 9) {
        throw new Error(`Format nomor telepon ${c.phone} untuk ${c.name} tidak valid.`);
      }

      return {
        id: c.id || `admin-${Date.now()}-${idx}`,
        name: c.name.trim(),
        role: (c.role || "Admin Showroom").trim(),
        phone: clean,
        isPrimary: Boolean(c.isPrimary),
        isActive: c.isActive !== false,
      };
    });

    // Pastikan minimal ada 1 admin yang isPrimary jika ada kontak aktif
    const hasActive = sanitized.some((c) => c.isActive);
    const hasPrimary = sanitized.some((c) => c.isPrimary && c.isActive);
    if (hasActive && !hasPrimary) {
      const firstActive = sanitized.find((c) => c.isActive);
      if (firstActive) firstActive.isPrimary = true;
    }

    const delegate = (prisma as any)?.systemSetting;
    if (!delegate) {
      throw new Error("Model SystemSetting belum tersedia di Prisma Client.");
    }

    await delegate.upsert({
      where: { key: SETTING_KEY },
      create: {
        key: SETTING_KEY,
        value: JSON.stringify(sanitized, null, 2),
        group: "GENERAL",
        label: "Daftar Nomor WhatsApp Admin Publik",
        description: "Nomor WhatsApp staf/admin yang ditampilkan pada tombol Hubungi Admin di navigasi publik.",
        isSecret: false,
      },
      update: {
        value: JSON.stringify(sanitized, null, 2),
        group: "GENERAL",
        label: "Daftar Nomor WhatsApp Admin Publik",
      },
    });

    revalidatePath("/");
    revalidatePath("/katalog");
    revalidatePath("/admin/settings");

    return { success: true };
  } catch (error: any) {
    console.error("[saveWhatsAppContactsAction] Gagal menyimpan:", error);
    return { success: false, error: error?.message || "Gagal menyimpan daftar kontak." };
  }
}
