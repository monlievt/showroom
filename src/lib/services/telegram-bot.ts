/**
 * Telegram Bot Service — Showroom Nur Mobil
 *
 * Layanan ini menangani:
 * 1. Mengirim pesan ke Telegram (teks, foto)
 * 2. Memproses update/perintah masuk dari webhook
 * 3. Semua logika bisnis query & mutasi data via chat
 */

import prisma from "@/lib/prisma";
import { getSettingValue } from "@/app/actions/setting";
import { formatRupiah, formatDate } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// TIPE DATA TELEGRAM
// ─────────────────────────────────────────────────────────────────────────────

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface TelegramMessage {
  message_id: number;
  from?: { id: number; first_name: string; username?: string };
  chat: { id: number; type: string };
  text?: string;
  photo?: Array<{ file_id: string; file_size: number; width: number; height: number }>;
  document?: { file_id: string; file_name?: string; mime_type?: string };
  caption?: string;
  reply_to_message?: TelegramMessage;
}

export interface TelegramCallbackQuery {
  id: string;
  from: { id: number; first_name: string; username?: string };
  message?: TelegramMessage;
  data?: string;
}

// State percakapan per chat (in-memory, cukup untuk 1-2 user owner)
export type ConversationState =
  | null
  | { step: "INTAKE_PLAT" }
  | { step: "INTAKE_BRAND"; plat: string }
  | { step: "INTAKE_MODEL"; plat: string; brand: string }
  | { step: "INTAKE_YEAR"; plat: string; brand: string; model: string }
  | { step: "INTAKE_PRICE"; plat: string; brand: string; model: string; year: number }
  | { step: "INTAKE_AUCTION_HOUSE"; plat: string; brand: string; model: string; year: number; price: number }
  | { step: "BIAYA_PLAT" }
  | { step: "BIAYA_NOMINAL"; vehicleId: string; plateNumber: string }
  | { step: "BIAYA_KETERANGAN"; vehicleId: string; plateNumber: string; amount: number }
  | { step: "FOTO_PLAT" }
  | { step: "FOTO_UPLOAD"; vehicleId: string; plateNumber: string }
  | { step: "STATUS_PLAT" }
  | { step: "STATUS_CHOOSE"; vehicleId: string; plateNumber: string };

const conversationStore = new Map<number, ConversationState>();

export function getConversationState(chatId: number): ConversationState {
  return conversationStore.get(chatId) ?? null;
}

export function setConversationState(chatId: number, state: ConversationState) {
  conversationStore.set(chatId, state);
}

export function clearConversationState(chatId: number) {
  conversationStore.delete(chatId);
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER KIRIM PESAN
// ─────────────────────────────────────────────────────────────────────────────

export async function getTelegramToken(): Promise<string> {
  return getSettingValue("TELEGRAM_BOT_TOKEN");
}

export async function getAuthorizedChatIds(): Promise<number[]> {
  // Ambil semua chat ID yang diizinkan: dari setting utama + setting tambahan
  const primary = await getSettingValue("TELEGRAM_CHAT_ID");
  const extra = await getSettingValue("TELEGRAM_BOT_ALLOWED_CHAT_IDS");

  const ids: number[] = [];
  if (primary) {
    const n = parseInt(primary.trim(), 10);
    if (!isNaN(n)) ids.push(n);
  }
  if (extra) {
    extra
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n))
      .forEach((n) => ids.push(n));
  }
  return ids;
}

export async function isChatAuthorized(chatId: number): Promise<boolean> {
  const allowed = await getAuthorizedChatIds();
  return allowed.includes(chatId);
}

export async function sendTelegramMessage(
  chatId: number,
  text: string,
  options?: {
    parse_mode?: "Markdown" | "HTML" | "MarkdownV2";
    reply_markup?: object;
    disable_notification?: boolean;
  }
): Promise<boolean> {
  const token = await getTelegramToken();
  if (!token) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: options?.parse_mode ?? "Markdown",
        reply_markup: options?.reply_markup,
        disable_notification: options?.disable_notification,
      }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    return data.ok === true;
  } catch (err) {
    console.error("[TelegramBot] sendMessage error:", err);
    return false;
  }
}

export async function sendTelegramPhoto(
  chatId: number,
  photoFileId: string,
  caption?: string
): Promise<boolean> {
  const token = await getTelegramToken();
  if (!token) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        photo: photoFileId,
        caption,
        parse_mode: "Markdown",
      }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    return data.ok === true;
  } catch {
    return false;
  }
}

export async function downloadTelegramFile(fileId: string): Promise<Buffer | null> {
  const token = await getTelegramToken();
  if (!token) return null;

  try {
    // 1. Ambil path file dari Telegram
    const pathRes = await fetch(
      `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`,
      { signal: AbortSignal.timeout(8000) }
    );
    const pathData = await pathRes.json();
    if (!pathData.ok) return null;

    const filePath: string = pathData.result.file_path;

    // 2. Download bytes
    const fileRes = await fetch(
      `https://api.telegram.org/file/bot${token}/${filePath}`,
      { signal: AbortSignal.timeout(30000) }
    );
    if (!fileRes.ok) return null;

    const arrayBuffer = await fileRes.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FORMAT
// ─────────────────────────────────────────────────────────────────────────────

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    INTAKE: "🆕 Intake Baru",
    IN_REPAIR: "🔧 Bengkel",
    READY_FOR_SALE: "✅ Ready Jual",
    BOOKED: "📋 Booked",
    AT_SHOWROOM_PENDING: "🏪 Titip Showroom",
    SOLD_SETTLED: "💰 Terjual",
  };
  return map[status] ?? status;
}

function agingEmoji(days: number): string {
  if (days <= 14) return "🟢";
  if (days <= 30) return "🟡";
  if (days <= 45) return "🟠";
  return "🔴";
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLERS PERINTAH
// ─────────────────────────────────────────────────────────────────────────────

async function handleStart(chatId: number, firstName: string) {
  const msg = `🚗 *Selamat datang, ${firstName}!*

Halo, saya asisten operasional *Showroom Nur Mobil*.

*Perintah yang tersedia:*
━━━━━━━━━━━━━━━━
📋 /daftar — Semua unit aktif di garasi
🔴 /macet — Unit macet (> 45 hari)
✅ /ready — Unit siap jual
🔎 /cek _plat_ — Cek info & HPP unit
💸 /biaya — Catat biaya unit via chat
🔄 /status — Ubah status unit (ready, bengkel, dll)
📸 /foto — Upload foto unit
➕ /intake — Daftarkan unit baru
📊 /laporan — Ringkasan keuangan hari ini
❓ /bantuan — Panduan lengkap
━━━━━━━━━━━━━━━━

_Contoh: /cek BK1952AEE_`;

  await sendTelegramMessage(chatId, msg);
}

async function handleDaftar(chatId: number) {
  const vehicles = await prisma.vehicle.findMany({
    where: { status: { notIn: ["SOLD_SETTLED"] } },
    orderBy: [{ status: "asc" }, { purchaseDate: "asc" }],
    select: {
      plateNumber: true,
      brand: true,
      model: true,
      year: true,
      status: true,
      purchaseDate: true,
      expenses: { select: { amount: true } },
      purchasePrice: true,
    },
  });

  if (vehicles.length === 0) {
    await sendTelegramMessage(chatId, "📭 Tidak ada unit aktif di garasi saat ini.");
    return;
  }

  const now = new Date();
  const lines = vehicles.map((v) => {
    const days = Math.floor((now.getTime() - new Date(v.purchaseDate).getTime()) / (1000 * 60 * 60 * 24));
    const totalHpp =
      Number(v.purchasePrice) + v.expenses.reduce((s, e) => s + Number(e.amount), 0);
    return `${agingEmoji(days)} *${v.plateNumber}* — ${v.brand} ${v.model} ${v.year}\n   ${statusLabel(v.status)} · ${days}h · HPP ${formatRupiah(totalHpp)}`;
  });

  const msg = `🚗 *Unit Aktif di Garasi (${vehicles.length} unit)*\n━━━━━━━━━━━━━━━━\n${lines.join("\n\n")}`;
  await sendTelegramMessage(chatId, msg);
}

async function handleMacet(chatId: number) {
  const now = new Date();
  const vehicles = await prisma.vehicle.findMany({
    where: { status: { notIn: ["SOLD_SETTLED"] } },
    select: {
      plateNumber: true, brand: true, model: true, year: true,
      status: true, purchaseDate: true, purchasePrice: true,
      targetSellingPrice: true,
      expenses: { select: { amount: true } },
    },
  });

  const macet = vehicles.filter((v) => {
    const days = Math.floor((now.getTime() - new Date(v.purchaseDate).getTime()) / (1000 * 60 * 60 * 24));
    return days > 45;
  });

  if (macet.length === 0) {
    await sendTelegramMessage(chatId, "✅ Tidak ada unit yang macet (> 45 hari). Bagus!");
    return;
  }

  const lines = macet.map((v) => {
    const days = Math.floor((now.getTime() - new Date(v.purchaseDate).getTime()) / (1000 * 60 * 60 * 24));
    const totalHpp = Number(v.purchasePrice) + v.expenses.reduce((s, e) => s + Number(e.amount), 0);
    const target = v.targetSellingPrice ? `Target: ${formatRupiah(Number(v.targetSellingPrice))}` : "Target: *belum diisi*";
    return `🔴 *${v.plateNumber}* — ${v.brand} ${v.model} ${v.year}\n   ${statusLabel(v.status)} · *${days} hari* di garasi\n   HPP: ${formatRupiah(totalHpp)} · ${target}`;
  });

  const msg = `🚨 *Unit Macet > 45 Hari (${macet.length} unit)*\n━━━━━━━━━━━━━━━━\n${lines.join("\n\n")}\n\n_Pertimbangkan evaluasi harga atau promosi ulang._`;
  await sendTelegramMessage(chatId, msg);
}

async function handleReady(chatId: number) {
  const vehicles = await prisma.vehicle.findMany({
    where: { status: "READY_FOR_SALE" },
    orderBy: { purchaseDate: "asc" },
    select: {
      plateNumber: true, brand: true, model: true, year: true, color: true,
      odometer: true, targetSellingPrice: true, minSellingPrice: true,
      purchaseDate: true, purchasePrice: true,
      expenses: { select: { amount: true } },
    },
  });

  if (vehicles.length === 0) {
    await sendTelegramMessage(chatId, "📭 Tidak ada unit yang berstatus Ready Jual saat ini.");
    return;
  }

  const now = new Date();
  const lines = vehicles.map((v) => {
    const days = Math.floor((now.getTime() - new Date(v.purchaseDate).getTime()) / (1000 * 60 * 60 * 24));
    const totalHpp = Number(v.purchasePrice) + v.expenses.reduce((s, e) => s + Number(e.amount), 0);
    const target = v.targetSellingPrice ? formatRupiah(Number(v.targetSellingPrice)) : "belum diset";
    const margin = v.targetSellingPrice ? formatRupiah(Number(v.targetSellingPrice) - totalHpp) : "-";
    return `✅ *${v.plateNumber}* — ${v.brand} ${v.model} ${v.year} ${v.color}\n   Odo: ${v.odometer.toLocaleString("id-ID")} km · ${days}h\n   HPP: ${formatRupiah(totalHpp)} · Jual: ${target} · Margin: *${margin}*`;
  });

  const msg = `✅ *Unit Siap Jual (${vehicles.length} unit)*\n━━━━━━━━━━━━━━━━\n${lines.join("\n\n")}`;
  await sendTelegramMessage(chatId, msg);
}

async function handleCek(chatId: number, plateQuery: string) {
  if (!plateQuery.trim()) {
    await sendTelegramMessage(chatId, "❓ Ketik plat nomor setelah /cek\n_Contoh: /cek BK1952AEE_");
    return;
  }

  const plate = plateQuery.trim().toUpperCase().replace(/\s/g, "");
  const vehicle = await prisma.vehicle.findFirst({
    where: { plateNumber: { contains: plate } },
    include: {
      expenses: { orderBy: { date: "desc" } },
      photos: { where: { category: "FINAL_LISTING" }, take: 1 },
    },
  });

  if (!vehicle) {
    await sendTelegramMessage(chatId, `❌ Unit dengan plat *${plate}* tidak ditemukan.`);
    return;
  }

  const now = new Date();
  const days = Math.floor((now.getTime() - new Date(vehicle.purchaseDate).getTime()) / (1000 * 60 * 60 * 24));
  const totalExpenses = vehicle.expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalHpp = Number(vehicle.purchasePrice) + totalExpenses;
  const target = vehicle.targetSellingPrice ? formatRupiah(Number(vehicle.targetSellingPrice)) : "_belum diset_";
  const margin = vehicle.targetSellingPrice
    ? formatRupiah(Number(vehicle.targetSellingPrice) - totalHpp)
    : "-";

  // Rincian 5 biaya terakhir
  const expenseLines =
    vehicle.expenses.length > 0
      ? vehicle.expenses
          .slice(0, 5)
          .map((e) => `  · ${formatDate(e.date)} — ${e.category.replace(/_/g, " ")} ${formatRupiah(Number(e.amount))}`)
          .join("\n")
      : "  _Belum ada biaya_";

  const msg = `🚗 *${vehicle.brand} ${vehicle.model} ${vehicle.year}*
Plat: *${vehicle.plateNumber}* | Warna: ${vehicle.color}
Odo: ${vehicle.odometer.toLocaleString("id-ID")} km | Transmisi: ${vehicle.transmission}

${statusLabel(vehicle.status)} · *${days} hari* di garasi
Masuk: ${formatDate(vehicle.purchaseDate)}
Sumber: ${vehicle.sourceType}${vehicle.auctionHouse ? ` (${vehicle.auctionHouse})` : ""}

💰 *HPP & Harga*
Harga Beli: ${formatRupiah(Number(vehicle.purchasePrice))}
Total Biaya: +${formatRupiah(totalExpenses)}
*Total HPP: ${formatRupiah(totalHpp)}*
Target Jual: ${target}
Estimasi Margin: *${margin}*

📋 *Biaya Terakhir:*
${expenseLines}

_/biaya untuk catat biaya baru_`;

  await sendTelegramMessage(chatId, msg);
}

async function handleLaporan(chatId: number) {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const [
    totalActiveUnits,
    macetUnits,
    readyUnits,
    todayExpenses,
    todaySales,
    totalHppData,
  ] = await Promise.all([
    prisma.vehicle.count({ where: { status: { notIn: ["SOLD_SETTLED"] } } }),
    prisma.vehicle.count({
      where: {
        status: { notIn: ["SOLD_SETTLED"] },
        purchaseDate: { lte: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.vehicle.count({ where: { status: "READY_FOR_SALE" } }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { date: { gte: startOfDay } },
    }),
    prisma.sale.aggregate({
      _sum: { sellingPrice: true },
      where: { createdAt: { gte: startOfDay } },
    }),
    prisma.vehicle.findMany({
      where: { status: { notIn: ["SOLD_SETTLED"] } },
      select: { purchasePrice: true, expenses: { select: { amount: true } } },
    }),
  ]);

  const totalModal = totalHppData.reduce((sum, v) => {
    const hpp = Number(v.purchasePrice) + v.expenses.reduce((s, e) => s + Number(e.amount), 0);
    return sum + hpp;
  }, 0);

  const msg = `📊 *Laporan Harian — ${now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}*
━━━━━━━━━━━━━━━━
🚗 Unit Aktif: *${totalActiveUnits}* unit
✅ Siap Jual: *${readyUnits}* unit
🔴 Macet > 45h: *${macetUnits}* unit
💼 Total Modal Terikat: *${formatRupiah(totalModal)}*
━━━━━━━━━━━━━━━━
📅 *Hari Ini:*
💸 Total Biaya Keluar: *${formatRupiah(Number(todayExpenses._sum.amount ?? 0))}*
💰 Penjualan Baru: *${formatRupiah(Number(todaySales._sum.sellingPrice ?? 0))}*
━━━━━━━━━━━━━━━━
_Lihat detail di dashboard: /admin_`;

  await sendTelegramMessage(chatId, msg);
}

async function handleBantuan(chatId: number) {
  const msg = `📖 *Panduan Lengkap Bot Showroom Nur Mobil*
━━━━━━━━━━━━━━━━
*📋 Melihat Data:*
/daftar — Semua unit aktif
/macet — Unit > 45 hari
/ready — Unit siap jual
/cek BK1952AEE — Detail unit by plat
/laporan — Ringkasan hari ini

*💸 Catat Biaya:*
/biaya — Panduan step-by-step
Atau langsung ketik:
\`biaya BK1952AEE ganti oli 150000\`
\`biaya BK1952AEE tune up 350000 bengkel rizky\`

*🔄 Ubah Status Unit:*
/status — Panduan step-by-step
Atau langsung ketik:
\`status BK1952AEE ready\`
\`status BK1952AEE bengkel\`
\`status BK1952AEE booked\`

*📸 Upload Foto:*
/foto — Panduan upload foto unit

*➕ Intake Unit Baru:*
/intake — Daftar unit baru (step-by-step)

*⌨️ Perintah Cepat (tanpa slash):*
Ketik langsung tanpa /
\`daftar\` \`macet\` \`ready\` \`laporan\`

*❌ Batalkan:*
Ketik /batal kapan saja untuk keluar dari alur percakapan.`;

  await sendTelegramMessage(chatId, msg);
}

// ─── ALUR CATAT BIAYA ───────────────────────────────────────────────────────

async function handleBiayaInline(chatId: number, text: string) {
  // Format: biaya <PLAT> <keterangan> <nominal>
  // Contoh: biaya BK1952AEE ganti oli 150000
  const parts = text.trim().split(/\s+/);
  if (parts.length < 4) {
    await startBiayaFlow(chatId);
    return;
  }

  const plate = parts[1].toUpperCase();
  const nominalStr = parts[parts.length - 1].replace(/[.,]/g, "");
  const amount = parseInt(nominalStr, 10);
  const keterangan = parts.slice(2, parts.length - 1).join(" ");

  if (isNaN(amount) || amount <= 0) {
    await sendTelegramMessage(chatId, `❌ Nominal *${parts[parts.length - 1]}* tidak valid. Gunakan angka tanpa titik/koma.\n_Contoh: biaya BK1952AEE ganti oli 150000_`);
    return;
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: { plateNumber: { contains: plate } },
    select: { id: true, plateNumber: true, brand: true, model: true },
  });

  if (!vehicle) {
    await sendTelegramMessage(chatId, `❌ Unit *${plate}* tidak ditemukan. Periksa kembali plat nomor.`);
    return;
  }

  await saveBiaya(chatId, vehicle.id, vehicle.plateNumber, `${vehicle.brand} ${vehicle.model}`, amount, keterangan);
}

async function startBiayaFlow(chatId: number) {
  setConversationState(chatId, { step: "BIAYA_PLAT" });
  await sendTelegramMessage(
    chatId,
    "💸 *Catat Biaya Unit*\n\nKetik plat nomor unit:\n_Contoh: BK1952AEE_\n\nKetik /batal untuk membatalkan."
  );
}

async function saveBiaya(
  chatId: number,
  vehicleId: string,
  plateNumber: string,
  vehicleName: string,
  amount: number,
  keterangan: string
) {
  try {
    // Tentukan kategori otomatis berdasarkan kata kunci
    const lower = keterangan.toLowerCase();
    type ExpenseCategoryType = "OIL_AND_SERVICE" | "BODY_PAINT" | "DETAILING_SALON" | "TIRES_AND_WHEELS" | "ELECTRICAL" | "SPAREPARTS" | "DOCUMENT_TAX_MUTATION" | "TRANSPORT_PICKUP" | "AUCTION_ADMIN_FEE" | "BROKER_COMMISSION" | "OTHER";
    let category: ExpenseCategoryType = "OTHER";
    if (lower.includes("oli") || lower.includes("service") || lower.includes("servis") || lower.includes("tune")) category = "OIL_AND_SERVICE";
    else if (lower.includes("cat") || lower.includes("body") || lower.includes("dempul") || lower.includes("poles")) category = "BODY_PAINT";
    else if (lower.includes("salon") || lower.includes("cuci") || lower.includes("detailing")) category = "DETAILING_SALON";
    else if (lower.includes("ban") || lower.includes("velg") || lower.includes("roda")) category = "TIRES_AND_WHEELS";
    else if (lower.includes("listrik") || lower.includes("aki") || lower.includes("electrical") || lower.includes("kabel")) category = "ELECTRICAL";
    else if (lower.includes("sparepart") || lower.includes("part") || lower.includes("rem") || lower.includes("kopling")) category = "SPAREPARTS";
    else if (lower.includes("pajak") || lower.includes("stnk") || lower.includes("bpkb") || lower.includes("mutasi")) category = "DOCUMENT_TAX_MUTATION";
    else if (lower.includes("ongkir") || lower.includes("jemput") || lower.includes("derek") || lower.includes("tow") || lower.includes("angkut")) category = "TRANSPORT_PICKUP";
    else if (lower.includes("admin") || lower.includes("lelang")) category = "AUCTION_ADMIN_FEE";
    else if (lower.includes("broker") || lower.includes("komisi")) category = "BROKER_COMMISSION";

    const lastCash = await prisma.cashTransaction.findFirst({
      orderBy: { createdAt: "desc" },
      select: { runningBalance: true },
    });
    const currentBalance = Number(lastCash?.runningBalance ?? 0);

    await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          vehicleId,
          category,
          amount,
          date: new Date(),
          notes: keterangan,
          createdBy: "Telegram Bot",
        },
      });

      await tx.cashTransaction.create({
        data: {
          type: "OUT_EXPENSE",
          amount,
          relatedVehicleId: vehicleId,
          relatedExpenseId: expense.id,
          runningBalance: currentBalance - amount,
          notes: `${keterangan} — ${plateNumber} (via Telegram)`,
          createdBy: "Telegram Bot",
        },
      });
    });

    clearConversationState(chatId);
    await sendTelegramMessage(
      chatId,
      `✅ *Biaya berhasil dicatat!*\n\nUnit: *${vehicleName}* (${plateNumber})\nKeterangan: ${keterangan}\nJumlah: *${formatRupiah(amount)}*\nKategori: ${category.replace(/_/g, " ")}\n\n_Tersimpan ke HPP unit._`
    );
  } catch (err) {
    console.error("[TelegramBot] saveBiaya error:", err);
    clearConversationState(chatId);
    await sendTelegramMessage(chatId, "❌ Gagal menyimpan biaya. Coba lagi atau gunakan web admin.");
  }
}

// ─── ALUR INTAKE UNIT BARU ──────────────────────────────────────────────────

async function startIntakeFlow(chatId: number) {
  setConversationState(chatId, { step: "INTAKE_PLAT" });
  await sendTelegramMessage(
    chatId,
    "➕ *Intake Unit Baru*\n\nKetik *plat nomor* unit:\n_Contoh: BK1952AEE_\n\nKetik /batal untuk membatalkan."
  );
}

// ─── ALUR UPLOAD FOTO ───────────────────────────────────────────────────────

async function startFotoFlow(chatId: number) {
  setConversationState(chatId, { step: "FOTO_PLAT" });
  await sendTelegramMessage(
    chatId,
    "📸 *Upload Foto Unit*\n\nKetik *plat nomor* unit yang akan ditambah fotonya:\n_Contoh: BK1952AEE_\n\nKetik /batal untuk membatalkan."
  );
}

async function handleFotoUpload(chatId: number, vehicleId: string, plateNumber: string, fileId: string, caption?: string) {
  try {
    // Download file dari Telegram
    const buffer = await downloadTelegramFile(fileId);
    if (!buffer) {
      await sendTelegramMessage(chatId, "❌ Gagal mengunduh foto dari Telegram. Coba lagi.");
      return;
    }

    // Simpan ke disk (public/uploads/vehicles/...)
    const { writeFile, mkdir } = await import("fs/promises");
    const path = await import("path");
    const crypto = await import("crypto");

    const uploadDir = path.resolve(process.cwd(), "public", "uploads", "vehicles", vehicleId, "photo");
    await mkdir(uploadDir, { recursive: true });

    const filename = `${Date.now()}_${crypto.randomBytes(6).toString("hex")}.jpg`;
    const fullPath = path.resolve(uploadDir, filename);
    await writeFile(fullPath, buffer);

    const fileUrl = `/uploads/vehicles/${vehicleId}/photo/${filename}`;

    // Simpan ke VehiclePhoto
    await prisma.vehiclePhoto.create({
      data: {
        vehicleId,
        category: "CONDITION_INTAKE",
        fileUrl,
        tag: caption || "TELEGRAM_UPLOAD",
        title: caption || `Foto via Telegram — ${new Date().toLocaleDateString("id-ID")}`,
      },
    });

    clearConversationState(chatId);
    await sendTelegramMessage(
      chatId,
      `✅ *Foto berhasil diupload!*\n\nUnit: *${plateNumber}*\nFile: ${filename}\n\n_Foto tersimpan di galeri unit._`
    );
  } catch (err) {
    console.error("[TelegramBot] handleFotoUpload error:", err);
    clearConversationState(chatId);
    await sendTelegramMessage(chatId, "❌ Gagal menyimpan foto. Coba lagi.");
  }
}

// ─── ALUR STATUS UNIT ────────────────────────────────────────────────────────

function parseStatusKeyword(input: string): string | null {
  const s = input.toLowerCase().trim();
  if (s.includes("ready") || s.includes("siap") || s.includes("jual")) return "READY_FOR_SALE";
  if (s.includes("bengkel") || s.includes("repair") || s.includes("servis") || s.includes("perbaikan")) return "IN_REPAIR";
  if (s.includes("intake") || s.includes("baru")) return "INTAKE";
  if (s.includes("book") || s.includes("dp")) return "BOOKED";
  if (s.includes("showroom") || s.includes("titip")) return "AT_SHOWROOM_PENDING";
  if (s.includes("sold") || s.includes("laku") || s.includes("lunas") || s.includes("terjual")) return "SOLD_SETTLED";
  return null;
}

async function startStatusFlow(chatId: number) {
  setConversationState(chatId, { step: "STATUS_PLAT" });
  await sendTelegramMessage(
    chatId,
    "🔄 *Ubah Status Unit*\n\nKetik *plat nomor* unit:\n_Contoh: BK1952AEE_\n\nKetik /batal untuk membatalkan."
  );
}

async function saveVehicleStatus(chatId: number, vehicleId: string, plateNumber: string, newStatus: any) {
  try {
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status: newStatus },
    });

    clearConversationState(chatId);
    await sendTelegramMessage(
      chatId,
      `✅ *Status berhasil diperbarui!*\n\nUnit: *${plateNumber}*\nStatus Baru: ${statusLabel(newStatus)}\n\n_Data langsung terupdate di dashboard & katalog._`
    );
  } catch (err) {
    console.error("[TelegramBot] saveVehicleStatus error:", err);
    clearConversationState(chatId);
    await sendTelegramMessage(chatId, "❌ Gagal memperbarui status unit. Coba lagi.");
  }
}

async function handleStatusInline(chatId: number, text: string) {
  // Format: status <PLAT> <status_baru>
  // Contoh: status BK1952AEE ready
  const parts = text.trim().split(/\s+/);
  if (parts.length < 3) {
    await startStatusFlow(chatId);
    return;
  }

  const plate = parts[1].toUpperCase().replace(/\s/g, "");
  const targetStatusStr = parts.slice(2).join(" ");
  const parsedStatus = parseStatusKeyword(targetStatusStr);

  if (!parsedStatus) {
    await sendTelegramMessage(
      chatId,
      `❌ Status *"${targetStatusStr}"* tidak dikenali.\nPilihan status: *ready*, *bengkel*, *intake*, *booked*, *showroom*, *terjual*.\n_Contoh: status BK1952AEE ready_`
    );
    return;
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: { plateNumber: { contains: plate } },
    select: { id: true, plateNumber: true, brand: true, model: true },
  });

  if (!vehicle) {
    await sendTelegramMessage(chatId, `❌ Unit dengan plat *${plate}* tidak ditemukan.`);
    return;
  }

  await saveVehicleStatus(chatId, vehicle.id, vehicle.plateNumber, parsedStatus);
}

// ─────────────────────────────────────────────────────────────────────────────
// DISPATCHER UTAMA
// ─────────────────────────────────────────────────────────────────────────────

export async function processTelegramUpdate(update: TelegramUpdate): Promise<void> {
  const msg = update.message;
  if (!msg) return;

  const chatId = msg.chat.id;
  const text = (msg.text ?? msg.caption ?? "").trim();
  const firstName = msg.from?.first_name ?? "Pengguna";

  // ── OTORISASI ──
  const authorized = await isChatAuthorized(chatId);
  if (!authorized) {
    await sendTelegramMessage(
      chatId,
      `🔒 Akses ditolak.\n\nChat ID Anda: \`${chatId}\`\n\nMinta owner untuk menambahkan ID ini di *Pengaturan → Telegram Bot*.`
    );
    return;
  }

  // ── BATAL ──
  if (text === "/batal" || text === "batal") {
    clearConversationState(chatId);
    await sendTelegramMessage(chatId, "✅ Alur percakapan dibatalkan. Ketik /bantuan untuk melihat perintah.");
    return;
  }

  // ── CEK STATE PERCAKAPAN AKTIF ──
  const state = getConversationState(chatId);

  // ─── STATE: BIAYA ───────────────────────────────────────────
  if (state?.step === "BIAYA_PLAT") {
    const plate = text.toUpperCase().replace(/\s/g, "");
    const vehicle = await prisma.vehicle.findFirst({
      where: { plateNumber: { contains: plate } },
      select: { id: true, plateNumber: true, brand: true, model: true },
    });
    if (!vehicle) {
      await sendTelegramMessage(chatId, `❌ Unit *${plate}* tidak ditemukan. Ketik ulang plat nomor atau /batal.`);
      return;
    }
    setConversationState(chatId, { step: "BIAYA_NOMINAL", vehicleId: vehicle.id, plateNumber: vehicle.plateNumber });
    await sendTelegramMessage(chatId, `✅ Unit: *${vehicle.brand} ${vehicle.model}* (${vehicle.plateNumber})\n\nKetik *nominal biaya* (hanya angka):\n_Contoh: 150000_`);
    return;
  }

  if (state?.step === "BIAYA_NOMINAL") {
    const amount = parseInt(text.replace(/[.,\s]/g, ""), 10);
    if (isNaN(amount) || amount <= 0) {
      await sendTelegramMessage(chatId, "❌ Nominal tidak valid. Ketik angka tanpa titik/koma.\n_Contoh: 350000_");
      return;
    }
    setConversationState(chatId, { step: "BIAYA_KETERANGAN", vehicleId: state.vehicleId, plateNumber: state.plateNumber, amount });
    await sendTelegramMessage(chatId, `Nominal: *${formatRupiah(amount)}*\n\nKetik *keterangan biaya*:\n_Contoh: ganti oli dan filter, tune up, cat bumper depan_`);
    return;
  }

  if (state?.step === "BIAYA_KETERANGAN") {
    await saveBiaya(chatId, state.vehicleId, state.plateNumber, state.plateNumber, state.amount, text);
    return;
  }

  // ─── STATE: INTAKE ──────────────────────────────────────────
  if (state?.step === "INTAKE_PLAT") {
    const plate = text.toUpperCase().replace(/\s/g, "");
    const existing = await prisma.vehicle.findFirst({ where: { plateNumber: plate } });
    if (existing) {
      await sendTelegramMessage(chatId, `❌ Plat *${plate}* sudah terdaftar. Ketik plat lain atau /batal.`);
      return;
    }
    setConversationState(chatId, { step: "INTAKE_BRAND", plat: plate });
    await sendTelegramMessage(chatId, `Plat: *${plate}*\n\nKetik *merk/brand* kendaraan:\n_Contoh: Toyota, Honda, Mitsubishi_`);
    return;
  }

  if (state?.step === "INTAKE_BRAND") {
    setConversationState(chatId, { step: "INTAKE_MODEL", plat: state.plat, brand: text });
    await sendTelegramMessage(chatId, `Brand: *${text}*\n\nKetik *model/tipe* kendaraan:\n_Contoh: Avanza, Brio, Pajero Sport_`);
    return;
  }

  if (state?.step === "INTAKE_MODEL") {
    setConversationState(chatId, { step: "INTAKE_YEAR", plat: state.plat, brand: state.brand, model: text });
    await sendTelegramMessage(chatId, `Model: *${text}*\n\nKetik *tahun* kendaraan:\n_Contoh: 2020_`);
    return;
  }

  if (state?.step === "INTAKE_YEAR") {
    const year = parseInt(text, 10);
    if (isNaN(year) || year < 1990 || year > new Date().getFullYear() + 1) {
      await sendTelegramMessage(chatId, "❌ Tahun tidak valid. Ketik tahun seperti 2019, 2021, dll.");
      return;
    }
    setConversationState(chatId, { step: "INTAKE_PRICE", plat: state.plat, brand: state.brand, model: state.model, year });
    await sendTelegramMessage(chatId, `Tahun: *${year}*\n\nKetik *harga beli* (angka, dalam Rupiah):\n_Contoh: 95000000_`);
    return;
  }

  if (state?.step === "INTAKE_PRICE") {
    const price = parseInt(text.replace(/[.,\s]/g, ""), 10);
    if (isNaN(price) || price <= 0) {
      await sendTelegramMessage(chatId, "❌ Harga tidak valid. Ketik angka.\n_Contoh: 95000000_");
      return;
    }
    setConversationState(chatId, { step: "INTAKE_AUCTION_HOUSE", plat: state.plat, brand: state.brand, model: state.model, year: state.year, price });
    await sendTelegramMessage(chatId, `Harga Beli: *${formatRupiah(price)}*\n\nKetik *nama balai lelang/sumber* (atau ketik '-' jika beli langsung):\n_Contoh: JBA, AUKSI, IBID, Broker, -_`);
    return;
  }

  if (state?.step === "INTAKE_AUCTION_HOUSE") {
    const auctionHouse = text === "-" ? null : text;
    try {
      const vehicle = await prisma.vehicle.create({
        data: {
          plateNumber: state.plat,
          brand: state.brand,
          model: state.model,
          year: state.year,
          purchasePrice: state.price,
          purchaseDate: new Date(),
          color: "BELUM DIISI",
          odometer: 0,
          transmission: "AUTOMATIC",
          engineCapacity: 0,
          sourceType: auctionHouse ? "AUCTION" : "DIRECT_BUY",
          auctionHouse,
          status: "INTAKE",
          currentLocation: "Garasi",
          bpkbLeadDays: 14,
        },
      });

      // Catat kas keluar pembelian
      const lastCash = await prisma.cashTransaction.findFirst({ orderBy: { createdAt: "desc" }, select: { runningBalance: true } });
      const currentBalance = Number(lastCash?.runningBalance ?? 0);
      await prisma.cashTransaction.create({
        data: {
          type: "OUT_VEHICLE_PURCHASE",
          amount: state.price,
          relatedVehicleId: vehicle.id,
          runningBalance: currentBalance - state.price,
          notes: `Pembelian ${state.brand} ${state.model} ${state.year} — ${state.plat} (via Telegram)`,
          createdBy: "Telegram Bot",
        },
      });

      clearConversationState(chatId);
      await sendTelegramMessage(
        chatId,
        `✅ *Unit berhasil diintake!*\n\n🚗 ${state.brand} ${state.model} ${state.year}\nPlat: *${state.plat}*\nHarga Beli: *${formatRupiah(state.price)}*\nSumber: ${auctionHouse ?? "Beli Langsung"}\nStatus: Intake Baru\n\n_Lanjut ke web admin untuk melengkapi data (odometer, warna, transmisi, dll)._`
      );
    } catch (err) {
      console.error("[TelegramBot] intake error:", err);
      clearConversationState(chatId);
      await sendTelegramMessage(chatId, "❌ Gagal menyimpan unit. Coba lagi atau gunakan web admin.");
    }
    return;
  }

  // ─── STATE: FOTO ────────────────────────────────────────────
  if (state?.step === "FOTO_PLAT") {
    const plate = text.toUpperCase().replace(/\s/g, "");
    const vehicle = await prisma.vehicle.findFirst({
      where: { plateNumber: { contains: plate } },
      select: { id: true, plateNumber: true },
    });
    if (!vehicle) {
      await sendTelegramMessage(chatId, `❌ Unit *${plate}* tidak ditemukan. Ketik ulang atau /batal.`);
      return;
    }
    setConversationState(chatId, { step: "FOTO_UPLOAD", vehicleId: vehicle.id, plateNumber: vehicle.plateNumber });
    await sendTelegramMessage(chatId, `✅ Unit: *${vehicle.plateNumber}*\n\n📸 Kirimkan foto (bisa lebih dari satu, satu per satu).\n\nKetik /batal jika selesai.`);
    return;
  }

  if (state?.step === "FOTO_UPLOAD") {
    if (msg.photo && msg.photo.length > 0) {
      // Ambil resolusi tertinggi
      const best = msg.photo.reduce((a, b) => (a.file_size > b.file_size ? a : b));
      await handleFotoUpload(chatId, state.vehicleId, state.plateNumber, best.file_id, msg.caption ?? undefined);
      // Tetap di state FOTO_UPLOAD agar bisa upload beberapa foto
      setConversationState(chatId, { step: "FOTO_UPLOAD", vehicleId: state.vehicleId, plateNumber: state.plateNumber });
      return;
    }
    // Bukan foto: tanya ulang
    await sendTelegramMessage(chatId, "📸 Kirimkan foto. Ketik /batal jika sudah selesai upload.");
    return;
  }

  // ─── STATE: STATUS ──────────────────────────────────────────
  if (state?.step === "STATUS_PLAT") {
    const plate = text.toUpperCase().replace(/\s/g, "");
    const vehicle = await prisma.vehicle.findFirst({
      where: { plateNumber: { contains: plate } },
      select: { id: true, plateNumber: true, brand: true, model: true, status: true },
    });
    if (!vehicle) {
      await sendTelegramMessage(chatId, `❌ Unit *${plate}* tidak ditemukan. Ketik ulang atau /batal.`);
      return;
    }
    setConversationState(chatId, { step: "STATUS_CHOOSE", vehicleId: vehicle.id, plateNumber: vehicle.plateNumber });
    await sendTelegramMessage(
      chatId,
      `Unit: *${vehicle.brand} ${vehicle.model}* (${vehicle.plateNumber})\nStatus saat ini: *${statusLabel(vehicle.status)}*\n\nPilih / ketik status baru:\n1. *ready* — Siap Jual\n2. *bengkel* — Dalam Perbaikan\n3. *intake* — Intake Baru\n4. *booked* — Booked / DP Masuk\n5. *showroom* — Titip Showroom\n6. *terjual* — Terjual Lunas\n\nKetik salah satu status di atas:`
    );
    return;
  }

  if (state?.step === "STATUS_CHOOSE") {
    const parsed = parseStatusKeyword(text);
    if (!parsed) {
      await sendTelegramMessage(
        chatId,
        "❌ Pilihan tidak valid. Ketik: *ready*, *bengkel*, *intake*, *booked*, *showroom*, atau *terjual* (atau /batal):"
      );
      return;
    }
    await saveVehicleStatus(chatId, state.vehicleId, state.plateNumber, parsed);
    return;
  }

  // ─── PERINTAH UTAMA ─────────────────────────────────────────

  // Handle foto yang dikirim tanpa state aktif (infer state dari caption)
  if (msg.photo && msg.photo.length > 0) {
    const caption = msg.caption?.trim() ?? "";
    if (caption) {
      // Cek apakah caption mengandung plat nomor
      const plateMatch = caption.match(/([A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{0,3})/i);
      if (plateMatch) {
        const plate = plateMatch[1].toUpperCase().replace(/\s/g, "");
        const vehicle = await prisma.vehicle.findFirst({
          where: { plateNumber: { contains: plate } },
          select: { id: true, plateNumber: true },
        });
        if (vehicle) {
          const best = msg.photo.reduce((a, b) => (a.file_size > b.file_size ? a : b));
          await handleFotoUpload(chatId, vehicle.id, vehicle.plateNumber, best.file_id, caption);
          return;
        }
      }
    }
    await sendTelegramMessage(chatId, "📸 Foto diterima! Ketik /foto untuk memilih unit tujuan upload.");
    return;
  }

  const lowerText = text.toLowerCase();

  // Perintah langsung tanpa slash
  if (lowerText === "/start" || lowerText === "start") {
    await handleStart(chatId, firstName);
    return;
  }
  if (lowerText === "/daftar" || lowerText === "daftar") { await handleDaftar(chatId); return; }
  if (lowerText === "/macet" || lowerText === "macet") { await handleMacet(chatId); return; }
  if (lowerText === "/ready" || lowerText === "ready") { await handleReady(chatId); return; }
  if (lowerText === "/laporan" || lowerText === "laporan") { await handleLaporan(chatId); return; }
  if (lowerText === "/bantuan" || lowerText === "bantuan" || lowerText === "/help" || lowerText === "help") { await handleBantuan(chatId); return; }
  if (lowerText === "/biaya" || lowerText === "biaya") { await startBiayaFlow(chatId); return; }
  if (lowerText === "/status" || lowerText === "status") { await startStatusFlow(chatId); return; }
  if (lowerText === "/intake" || lowerText === "intake") { await startIntakeFlow(chatId); return; }
  if (lowerText === "/foto" || lowerText === "foto") { await startFotoFlow(chatId); return; }

  // /status <plat> <status_baru> atau status <plat> <status_baru>
  if (lowerText.startsWith("/status ") || lowerText.startsWith("status ")) {
    await handleStatusInline(chatId, text.replace(/^\//, ""));
    return;
  }

  // /cek <plat>
  if (lowerText.startsWith("/cek ") || lowerText.startsWith("cek ")) {
    const plate = text.replace(/^\/cek\s+/i, "").replace(/^cek\s+/i, "");
    await handleCek(chatId, plate);
    return;
  }

  // biaya <plat> <keterangan> <nominal> (satu baris)
  if (lowerText.startsWith("biaya ")) {
    await handleBiayaInline(chatId, text);
    return;
  }

  // Fallback
  await sendTelegramMessage(
    chatId,
    `🤔 Perintah *"${text}"* tidak dikenali.\n\nKetik /bantuan untuk daftar perintah, atau /start untuk memulai.`
  );
}
