"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface SettingItem {
  key: string;
  value: string;
  group: string;
  label: string;
  description: string;
  isSecret: boolean;
  isSet: boolean;
  maskedValue: string;
}

// Konfigurasi default kunci API dan integrasi
const DEFAULT_CONFIGS: Array<{
  key: string;
  group: "AI" | "SECURITY" | "NOTIFICATIONS" | "GENERAL";
  label: string;
  description: string;
  isSecret: boolean;
  defaultValue: string;
}> = [
  // 1. Google Gemini AI API
  {
    key: "GEMINI_ENABLED",
    group: "AI",
    label: "Status Fitur Gemini AI",
    description: "Sakelar aktif/nonaktif fitur Asisten Keputusan Showroom & Rangkuman Harian AI di Dashboard.",
    isSecret: false,
    defaultValue: "true",
  },
  {
    key: "GEMINI_API_KEY",
    group: "AI",
    label: "Google Gemini API Key",
    description: "Kunci API Google Gemini (Versi Free / AI Studio) untuk Asisten Keputusan Showroom & Rangkuman Harian.",
    isSecret: true,
    defaultValue: "",
  },
  {
    key: "GEMINI_MODEL",
    group: "AI",
    label: "Model Gemini AI",
    description: "Model Gemini yang digunakan (rekomendasi: gemini-2.5-flash untuk respon cepat & kuota free terbesar).",
    isSecret: false,
    defaultValue: "gemini-2.5-flash",
  },

  // 2. Google reCAPTCHA
  {
    key: "RECAPTCHA_ENABLED",
    group: "SECURITY",
    label: "Status Proteksi reCAPTCHA",
    description: "Sakelar utama aktif/nonaktif Google reCAPTCHA v2 / v3.",
    isSecret: false,
    defaultValue: "false",
  },
  {
    key: "RECAPTCHA_ON_LOGIN",
    group: "SECURITY",
    label: "Proteksi Form Login",
    description: "Aktifkan verifikasi reCAPTCHA pada halaman login admin dan staf.",
    isSecret: false,
    defaultValue: "true",
  },
  {
    key: "RECAPTCHA_ON_INQUIRIES",
    group: "SECURITY",
    label: "Proteksi Formulir Kontak / Komentar Katalog",
    description: "Aktifkan captcha pada formulir kontak penawaran dan komentar katalog publik agar bebas spam bot.",
    isSecret: false,
    defaultValue: "true",
  },
  {
    key: "RECAPTCHA_SITE_KEY",
    group: "SECURITY",
    label: "Google reCAPTCHA Site Key",
    description: "Kunci Publik (Site Key) Google reCAPTCHA v2 / v3 untuk disematkan di antarmuka web.",
    isSecret: false,
    defaultValue: "",
  },
  {
    key: "RECAPTCHA_SECRET_KEY",
    group: "SECURITY",
    label: "Google reCAPTCHA Secret Key",
    description: "Kunci Rahasia (Secret Key) untuk verifikasi server-side validasi captcha.",
    isSecret: true,
    defaultValue: "",
  },

  // 3. Telegram Bot Notifikasi HP
  {
    key: "TELEGRAM_ENABLED",
    group: "NOTIFICATIONS",
    label: "Status Notifikasi Telegram",
    description: "Sakelar aktif/nonaktif pengiriman notifikasi otomatis ke Bot Telegram HP Owner.",
    isSecret: false,
    defaultValue: "false",
  },
  {
    key: "TELEGRAM_BOT_TOKEN",
    group: "NOTIFICATIONS",
    label: "Telegram Bot Token",
    description: "Token Bot Telegram resmi dari @BotFather (Gratis 100% untuk notifikasi instan langsung di HP Anda).",
    isSecret: true,
    defaultValue: "",
  },
  {
    key: "TELEGRAM_CHAT_ID",
    group: "NOTIFICATIONS",
    label: "Telegram Owner Chat ID",
    description: "ID Chat Telegram HP Owner (bisa didapatkan via @userinfobot) tempat notifikasi dikirimkan.",
    isSecret: false,
    defaultValue: "",
  },

  // 4. WhatsApp Gateway
  {
    key: "WHATSAPP_ENABLED",
    group: "NOTIFICATIONS",
    label: "Status Notifikasi WhatsApp",
    description: "Sakelar aktif/nonaktif pengiriman pesan notifikasi via WhatsApp Gateway.",
    isSecret: false,
    defaultValue: "false",
  },
  {
    key: "WHATSAPP_GATEWAY_URL",
    group: "NOTIFICATIONS",
    label: "WhatsApp Gateway Endpoint",
    description: "URL Server WhatsApp Gateway (Fonnte / Wablas / Waha) untuk notifikasi via WhatsApp.",
    isSecret: false,
    defaultValue: "",
  },
  {
    key: "WHATSAPP_API_KEY",
    group: "NOTIFICATIONS",
    label: "WhatsApp Gateway API Token",
    description: "Token otentikasi pengiriman pesan WhatsApp.",
    isSecret: true,
    defaultValue: "",
  },

  // 5. Payment Gateway Midtrans
  {
    key: "MIDTRANS_ENABLED",
    group: "GENERAL",
    label: "Status Payment Gateway Midtrans",
    description: "Sakelar aktif/nonaktif integrasi pembayaran online (QRIS / Transfer Bank).",
    isSecret: false,
    defaultValue: "false",
  },
  {
    key: "MIDTRANS_SERVER_KEY",
    group: "GENERAL",
    label: "Midtrans Server Key",
    description: "Kunci Server Midtrans untuk verifikasi transaksi pembayaran.",
    isSecret: true,
    defaultValue: "",
  },
  {
    key: "MIDTRANS_CLIENT_KEY",
    group: "GENERAL",
    label: "Midtrans Client Key",
    description: "Kunci Klien Midtrans untuk form pembayaran Snap di web.",
    isSecret: false,
    defaultValue: "",
  },
];

/**
 * Mengambil nilai setting sistem dari DB dengan fallback ke process.env
 */
export async function getSettingValue(key: string): Promise<string> {
  try {
    if ((prisma as any)?.systemSetting?.findUnique) {
      const dbSetting = await (prisma as any).systemSetting.findUnique({
        where: { key },
      });
      if (dbSetting && dbSetting.value) {
        return dbSetting.value;
      }
    }
  } catch (err) {
    console.error(`[getSettingValue] Error reading ${key} from DB:`, err);
  }

  // Fallback ke process.env
  return process.env[key] || "";
}

/**
 * Mengambil seluruh daftar setting sistem untuk ditampilkan di panel admin
 */
export async function getSystemSettingsAction() {
  try {
    const dbSettings = (prisma as any)?.systemSetting?.findMany
      ? await (prisma as any).systemSetting.findMany()
      : [];
    const dbMap = new Map<string, any>(dbSettings.map((s: any) => [s.key, s]));

    const items: SettingItem[] = DEFAULT_CONFIGS.map((conf) => {
      const saved = dbMap.get(conf.key);
      const rawValue = saved?.value || process.env[conf.key] || conf.defaultValue;
      const isSet = rawValue.trim().length > 0;

      let maskedValue = rawValue;
      if (conf.isSecret && isSet) {
        if (rawValue.length > 8) {
          maskedValue = `${rawValue.slice(0, 4)}••••••••${rawValue.slice(-4)}`;
        } else {
          maskedValue = "••••••••••••";
        }
      }

      return {
        key: conf.key,
        value: conf.isSecret && isSet ? "" : rawValue, // Jangan kirim secret polos jika sudah tersimpan
        group: conf.group,
        label: saved?.label || conf.label,
        description: saved?.description || conf.description,
        isSecret: conf.isSecret,
        isSet,
        maskedValue,
      };
    });

    return {
      success: true,
      data: items,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal mengambil pengaturan sistem",
      data: [],
    };
  }
}

/**
 * Menyimpan banyak pengaturan sistem sekaligus
 */
export async function saveSystemSettingsBatchAction(
  settings: Array<{ key: string; value: string; group?: string; label?: string; isSecret?: boolean }>
) {
  try {
    const systemSettingDelegate = (prisma as any).systemSetting;
    if (!systemSettingDelegate) {
      throw new Error("Model SystemSetting belum siap pada Prisma Client.");
    }

    for (const item of settings) {
      // Jika value kosong dan ini adalah secret, jangan timpa nilai lama
      if (item.isSecret && !item.value.trim()) {
        continue;
      }

      const conf = DEFAULT_CONFIGS.find((c) => c.key === item.key);

      await systemSettingDelegate.upsert({
        where: { key: item.key },
        create: {
          key: item.key,
          value: item.value.trim(),
          group: item.group || conf?.group || "GENERAL",
          label: item.label || conf?.label,
          description: conf?.description,
          isSecret: item.isSecret ?? conf?.isSecret ?? false,
        },
        update: {
          value: item.value.trim(),
          group: item.group || conf?.group || "GENERAL",
          label: item.label || conf?.label,
          isSecret: item.isSecret ?? conf?.isSecret ?? false,
        },
      });
    }

    // Jika ada GEMINI_API_KEY yang baru disimpan dan GEMINI_ENABLED belum diset false, otomatis aktifkan
    const hasNewGeminiKey = settings.some((s) => s.key === "GEMINI_API_KEY" && s.value.trim().length > 0);
    const explicitlyDisabled = settings.some((s) => s.key === "GEMINI_ENABLED" && s.value === "false");
    if (hasNewGeminiKey && !explicitlyDisabled) {
      await systemSettingDelegate.upsert({
        where: { key: "GEMINI_ENABLED" },
        create: {
          key: "GEMINI_ENABLED",
          value: "true",
          group: "AI",
          label: "Status Fitur Gemini AI",
          isSecret: false,
        },
        update: { value: "true" },
      });
    }

    // Catat ke AuditLog
    await prisma.auditLog.create({
      data: {
        actorUserId: "ADMIN",
        action: "UPDATE",
        entityType: "SystemSetting",
        entityId: "API_KEYS_CONFIG",
        afterData: {
          updatedKeys: settings.map((s) => s.key),
          updatedAt: new Date().toISOString(),
        },
      },
    });

    revalidatePath("/admin/settings");
    revalidatePath("/admin");
    revalidatePath("/admin/inventory");
    revalidatePath("/login");
    revalidatePath("/");

    return { success: true, message: "Pengaturan API dan integrasi berhasil disimpan!" };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal menyimpan pengaturan",
    };
  }
}

/**
 * Mengubah status sakelar switch (ON / OFF) sebuah layanan integrasi
 */
export async function toggleSystemSettingAction(key: string, enabled: boolean) {
  try {
    const stringVal = enabled ? "true" : "false";
    const conf = DEFAULT_CONFIGS.find((c) => c.key === key);
    const systemSettingDelegate = (prisma as any).systemSetting;
    if (!systemSettingDelegate) {
      throw new Error("Model SystemSetting belum siap pada Prisma Client.");
    }

    await systemSettingDelegate.upsert({
      where: { key },
      create: {
        key,
        value: stringVal,
        group: conf?.group || "GENERAL",
        label: conf?.label || key,
        description: conf?.description,
        isSecret: false,
      },
      update: {
        value: stringVal,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: "ADMIN",
        action: "UPDATE",
        entityType: "SystemSetting",
        entityId: key,
        afterData: { enabled, updatedAt: new Date().toISOString() },
      },
    });

    revalidatePath("/admin/settings");
    revalidatePath("/admin");
    revalidatePath("/admin/inventory");
    revalidatePath("/login");
    revalidatePath("/");

    return {
      success: true,
      enabled,
      message: `${conf?.label || key} kini ${enabled ? "diaktifkan" : "dinonaktifkan"}.`,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mengubah status integrasi" };
  }
}

/**
 * Menyimpan konfigurasi khusus satu layanan (misal kartu Gemini atau reCAPTCHA saja)
 */
export async function saveSingleServiceAction(
  items: Array<{ key: string; value: string; isSecret?: boolean }>
) {
  try {
    const systemSettingDelegate = (prisma as any).systemSetting;
    if (!systemSettingDelegate) {
      throw new Error("Model SystemSetting belum siap pada Prisma Client.");
    }

    for (const item of items) {
      if (item.isSecret && !item.value.trim()) {
        continue;
      }

      const conf = DEFAULT_CONFIGS.find((c) => c.key === item.key);

      await systemSettingDelegate.upsert({
        where: { key: item.key },
        create: {
          key: item.key,
          value: item.value.trim(),
          group: conf?.group || "GENERAL",
          label: conf?.label,
          description: conf?.description,
          isSecret: item.isSecret ?? conf?.isSecret ?? false,
        },
        update: {
          value: item.value.trim(),
        },
      });
    }

    revalidatePath("/admin/settings");
    revalidatePath("/admin");
    revalidatePath("/admin/inventory");
    revalidatePath("/login");
    revalidatePath("/");

    return { success: true, message: "Konfigurasi layanan berhasil disimpan!" };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menyimpan konfigurasi layanan" };
  }
}

/**
 * Menguji koneksi Google Gemini API Key secara langsung
 */
export async function testGeminiApiKeyAction(apiKeyInput?: string) {
  try {
    let key = apiKeyInput?.trim();
    if (!key) {
      key = await getSettingValue("GEMINI_API_KEY");
    }

    if (!key) {
      return {
        success: false,
        error: "Kunci API Gemini belum diisi. Masukkan API Key terlebih dahulu.",
      };
    }

    // Ping Google Gemini REST API
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }
    );

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data.error?.message || "Google menolak API Key yang diberikan.";
      return {
        success: false,
        error: `Gagal terhubung ke Gemini: ${errMsg}`,
      };
    }

    const models = data.models || [];
    const flashModel = models.find((m: any) => m.name?.includes("gemini-1.5-flash") || m.name?.includes("gemini-2.0-flash"));

    return {
      success: true,
      message: `Koneksi Google Gemini Sukses! Ditemukan ${models.length} model AI aktif. Model yang siap digunakan: ${flashModel?.displayName || "Gemini Flash (Free Tier)"}.`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Gagal menghubungi server Google: ${error.message}`,
    };
  }
}

/**
 * Menguji koneksi Telegram Bot Token & Chat ID
 */
export async function testTelegramBotAction(tokenInput?: string, chatIdInput?: string) {
  try {
    let token = tokenInput?.trim();
    let chatId = chatIdInput?.trim();

    if (!token) token = await getSettingValue("TELEGRAM_BOT_TOKEN");
    if (!chatId) chatId = await getSettingValue("TELEGRAM_CHAT_ID");

    if (!token) {
      return {
        success: false,
        error: "Token Bot Telegram belum diisi.",
      };
    }

    // 1. Cek info bot via getMe
    const getMeRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const botData = await getMeRes.json();

    if (!botData.ok) {
      return {
        success: false,
        error: `Token Bot Telegram tidak valid: ${botData.description || "Gagal otentikasi"}`,
      };
    }

    const botName = botData.result?.first_name || botData.result?.username;

    // 2. Jika chatId ada, kirim pesan uji coba ke HP Owner
    if (chatId) {
      const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `🚗 *Nur Mobil Showroom Assistant*\n\n✅ Bot berhasil terhubung ke sistem Showroom Nur Mobil!\n⏰ Waktu: ${new Date().toLocaleString("id-ID")}\n\nNotifikasi operasional dan alarm BPKB akan dikirimkan ke chat ini.`,
          parse_mode: "Markdown",
        }),
      });

      const sendData = await sendRes.json();
      if (!sendData.ok) {
        return {
          success: false,
          error: `Bot "${botName}" aktif, tapi gagal mengirim ke Chat ID ${chatId}: ${sendData.description}`,
        };
      }

      return {
        success: true,
        message: `Koneksi Bot "${botName}" berhasil! Pesan uji coba telah dikirim ke Telegram HP Anda.`,
      };
    }

    return {
      success: true,
      message: `Token Bot "${botName}" valid! (Tips: Masukkan Chat ID agar notifikasi bisa dikirim ke HP Anda).`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Gagal menghubungi server Telegram: ${error.message}`,
    };
  }
}
