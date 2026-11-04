import { NextRequest, NextResponse } from "next/server";
import { processTelegramUpdate, type TelegramUpdate } from "@/lib/services/telegram-bot";
import { getSettingValue } from "@/app/actions/setting";

export const dynamic = "force-dynamic";

/**
 * GET — Verifikasi webhook dari Telegram (opsional, untuk debugging)
 */
export async function GET() {
  return NextResponse.json({ ok: true, service: "Telegram Bot Webhook — Showroom Nur Mobil" });
}

/**
 * POST — Menerima update dari Telegram Bot API
 *
 * Telegram mengirimkan setiap pesan/perintah masuk ke URL webhook ini.
 * Autentikasi dilakukan via secret token di header X-Telegram-Bot-Api-Secret-Token.
 */
export async function POST(req: NextRequest) {
  try {
    // ── 1. VALIDASI SECRET TOKEN (Mencegah request palsu) ──────────────────
    const secretToken = req.headers.get("x-telegram-bot-api-secret-token");
    const expectedSecret = await getSettingValue("TELEGRAM_WEBHOOK_SECRET");

    if (expectedSecret && secretToken !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── 2. PARSE BODY ───────────────────────────────────────────────────────
    const body = await req.json() as TelegramUpdate;

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // ── 3. PROSES UPDATE (non-blocking — Telegram expects 200 fast) ─────────
    // Jalankan processing di background agar response langsung 200 ke Telegram
    processTelegramUpdate(body).catch((err) => {
      console.error("[TelegramWebhook] Processing error:", err);
    });

    // ── 4. ACK CEPAT ke Telegram ────────────────────────────────────────────
    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("[TelegramWebhook] Uncaught error:", err);
    // Tetap kembalikan 200 agar Telegram tidak retry spam
    return NextResponse.json({ ok: true });
  }
}

