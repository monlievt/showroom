import { NextRequest, NextResponse } from "next/server";
import { getSettingValue } from "@/app/actions/setting";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * POST /api/telegram/setup-webhook
 *
 * Mendaftarkan URL webhook ke Telegram Bot API.
 * Dipanggil dari panel Settings setelah token dan domain dikonfigurasi.
 */
export async function POST(req: NextRequest) {
  try {
    // ── 1. Pastikan hanya Owner/Admin ───────────────────────────────────────
    const session = await getSession();
    if (!session || !["OWNER", "ADMIN"].includes(session.role)) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
    }

    // ── 2. Ambil konfigurasi ────────────────────────────────────────────────
    const token = await getSettingValue("TELEGRAM_BOT_TOKEN");
    if (!token) {
      return NextResponse.json(
        { error: "TELEGRAM_BOT_TOKEN belum dikonfigurasi di Settings." },
        { status: 400 }
      );
    }

    // ── 3. Tentukan URL webhook ─────────────────────────────────────────────
    const { webhookUrl: customUrl } = await req.json().catch(() => ({}));
    const appUrl =
      customUrl ||
      (await getSettingValue("APP_PUBLIC_URL")) ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.VERCEL_URL;

    if (!appUrl) {
      return NextResponse.json(
        { error: "URL publik aplikasi belum dikonfigurasi. Isi APP_PUBLIC_URL di Settings atau env." },
        { status: 400 }
      );
    }

    const baseUrl = appUrl.startsWith("http") ? appUrl : `https://${appUrl}`;
    const webhookUrl = `${baseUrl.replace(/\/$/, "")}/api/telegram/webhook`;

    // ── 4. Generate & simpan secret token (opsional, untuk keamanan) ────────
    let webhookSecret = await getSettingValue("TELEGRAM_WEBHOOK_SECRET");
    if (!webhookSecret) {
      const crypto = await import("crypto");
      webhookSecret = crypto.randomBytes(32).toString("hex");
      // Simpan ke DB
      await (await import("@/lib/prisma")).default.systemSetting.upsert({
        where: { key: "TELEGRAM_WEBHOOK_SECRET" },
        create: {
          key: "TELEGRAM_WEBHOOK_SECRET",
          value: webhookSecret,
          group: "NOTIFICATIONS",
          label: "Telegram Webhook Secret Token",
          isSecret: true,
        },
        update: { value: webhookSecret },
      });
    }

    // ── 5. Daftarkan webhook ke Telegram ────────────────────────────────────
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: webhookSecret,
        allowed_updates: ["message", "callback_query"],
        drop_pending_updates: true,
      }),
      signal: AbortSignal.timeout(15000),
    });

    const tgData = await tgRes.json();

    if (!tgData.ok) {
      return NextResponse.json(
        { error: `Gagal mendaftarkan webhook ke Telegram: ${tgData.description}` },
        { status: 400 }
      );
    }

    // ── 6. Cek info webhook ─────────────────────────────────────────────────
    const infoRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const infoData = await infoRes.json();

    return NextResponse.json({
      success: true,
      message: `✅ Webhook berhasil didaftarkan!`,
      webhookUrl,
      telegramResponse: tgData,
      webhookInfo: infoData.result,
    });

  } catch (err: any) {
    console.error("[SetupWebhook] Error:", err);
    return NextResponse.json({ error: err.message || "Terjadi kesalahan." }, { status: 500 });
  }
}

/**
 * DELETE /api/telegram/setup-webhook
 * Menghapus webhook (nonaktifkan bot)
 */
export async function DELETE() {
  try {
    const session = await getSession();
    if (!session || !["OWNER", "ADMIN"].includes(session.role)) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
    }

    const token = await getSettingValue("TELEGRAM_BOT_TOKEN");
    if (!token) return NextResponse.json({ error: "Token belum dikonfigurasi." }, { status: 400 });

    const res = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, {
      method: "POST",
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();

    return NextResponse.json({
      success: data.ok,
      message: data.ok ? "✅ Webhook berhasil dihapus." : `Gagal: ${data.description}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

