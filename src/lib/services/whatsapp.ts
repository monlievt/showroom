import prisma from "@/lib/prisma";

export type NotificationLogType =
  | "PIUTANG_DUE"
  | "PAJAK_EXPIRY"
  | "UNIT_SOLD"
  | "PROFIT_DISTRIBUTION"
  | "DOCUMENT_READY";

export interface SendWhatsAppParams {
  type: NotificationLogType;
  recipientPhone: string;
  recipientName?: string | null;
  messageBody: string;
  relatedVehicleId?: string | null;
  relatedSaleId?: string | null;
  mediaUrl?: string | null;
  mediaFileName?: string | null;
  mediaMimeType?: string | null;
}

/**
 * Service pengiriman WhatsApp dengan Audit Trail NotificationLog (ARCHITECTURE.md §12).
 * Mendukung:
 * 1. WAHA (WhatsApp HTTP API - Self Hosted di port 2026 / devlikeapro/waha)
 * 2. Fonnte / Wablas API Gateway
 * 3. Fallback Simulasi jika belum ada gateway aktif (mock staging)
 *
 * TIDAK PERNAH fire-and-forget:
 * 1. Tulis baris NotificationLog status PENDING sebelum request HTTP.
 * 2. Kirim request ke gateway WhatsApp.
 * 3. Update status ke SENT jika sukses, atau FAILED jika gagal tanpa memutus proses (no throw).
 */
export async function sendWhatsAppNotification(params: SendWhatsAppParams) {
  // 1. Tulis status awal PENDING
  const log = await prisma.notificationLog.create({
    data: {
      type: params.type,
      status: "PENDING",
      recipientPhone: params.recipientPhone,
      recipientName: params.recipientName || null,
      messageBody: params.messageBody,
      relatedVehicleId: params.relatedVehicleId || null,
      relatedSaleId: params.relatedSaleId || null,
    },
  });

  const cleanPhone = params.recipientPhone.replace(/\D/g, "").replace(/^0/, "62");
  const wahaBaseUrl = process.env.WAHA_BASE_URL; // e.g. "http://localhost:2026"
  const wahaSession = process.env.WAHA_SESSION || "default";
  const fonnteToken = process.env.FONNTE_TOKEN || process.env.WABLAS_TOKEN;
  const fonnteEndpoint = process.env.WA_GATEWAY_URL || "https://api.fonnte.com/send";

  // ─────────────────────────────────────────────────────────────
  // 2A. PENGIRIMAN VIA WAHA (WhatsApp HTTP API)
  // ─────────────────────────────────────────────────────────────
  if (wahaBaseUrl) {
    try {
      let response: Response;

      if (params.mediaUrl) {
        // Kirim dokumen / PDF / Gambar via WAHA /api/sendFile
        response = await fetch(`${wahaBaseUrl}/api/sendFile`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(process.env.WAHA_API_KEY ? { "X-Api-Key": process.env.WAHA_API_KEY } : {}),
          },
          body: JSON.stringify({
            session: wahaSession,
            chatId: `${cleanPhone}@c.us`,
            file: {
              mimetype: params.mediaMimeType || "application/pdf",
              filename: params.mediaFileName || "dokumen.pdf",
              url: params.mediaUrl,
            },
            caption: params.messageBody,
          }),
          signal: AbortSignal.timeout(12000),
        });
      } else {
        // Kirim pesan teks standar via WAHA /api/sendText
        response = await fetch(`${wahaBaseUrl}/api/sendText`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(process.env.WAHA_API_KEY ? { "X-Api-Key": process.env.WAHA_API_KEY } : {}),
          },
          body: JSON.stringify({
            session: wahaSession,
            chatId: `${cleanPhone}@c.us`,
            text: params.messageBody,
          }),
          signal: AbortSignal.timeout(10000),
        });
      }

      const resData = await response.json().catch(() => ({}));

      if (response.ok) {
        const updated = await prisma.notificationLog.update({
          where: { id: log.id },
          data: {
            status: "SENT",
            sentAt: new Date(),
          },
        });
        return { success: true, logId: updated.id, gateway: "WAHA" };
      } else {
        const reason = resData.message || resData.error || `WAHA HTTP ${response.status}`;
        const updated = await prisma.notificationLog.update({
          where: { id: log.id },
          data: {
            status: "FAILED",
            failureReason: reason,
          },
        });
        return { success: false, logId: updated.id, error: reason };
      }
    } catch (err: any) {
      console.warn("[WAHA Service Warning] Gagal connect ke WAHA, fallback ke status log:", err.message);
      const updated = await prisma.notificationLog.update({
        where: { id: log.id },
        data: {
          status: "FAILED",
          failureReason: `WAHA Connection Error: ${err.message}`,
        },
      });
      return { success: false, logId: updated.id, error: err.message };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2B. PENGIRIMAN VIA FONNTE / WABLAS
  // ─────────────────────────────────────────────────────────────
  if (fonnteToken) {
    try {
      const response = await fetch(fonnteEndpoint, {
        method: "POST",
        headers: {
          Authorization: fonnteToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target: cleanPhone,
          message: params.messageBody,
          url: params.mediaUrl || undefined,
          filename: params.mediaFileName || undefined,
        }),
        signal: AbortSignal.timeout(10000),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && (data.status === true || data.status === "true" || response.status === 200)) {
        const updated = await prisma.notificationLog.update({
          where: { id: log.id },
          data: {
            status: "SENT",
            sentAt: new Date(),
          },
        });
        return { success: true, logId: updated.id, gateway: "FONNTE" };
      } else {
        const reason = data.reason || data.message || `HTTP error ${response.status}`;
        const updated = await prisma.notificationLog.update({
          where: { id: log.id },
          data: {
            status: "FAILED",
            failureReason: reason,
          },
        });
        return { success: false, logId: updated.id, error: reason };
      }
    } catch (error: any) {
      const updated = await prisma.notificationLog.update({
        where: { id: log.id },
        data: {
          status: "FAILED",
          failureReason: error.message || "Network / Gateway Connection Timeout",
        },
      });
      return { success: false, logId: updated.id, error: error.message };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2C. MODE SIMULASI (Staging / Dev tanpa gateway aktif)
  // ─────────────────────────────────────────────────────────────
  console.log(
    `[WhatsApp Service Simulation] Type: ${params.type} | To: ${params.recipientPhone} | Msg: ${params.messageBody.slice(0, 70)}...`
  );

  const updated = await prisma.notificationLog.update({
    where: { id: log.id },
    data: {
      status: "SENT",
      sentAt: new Date(),
    },
  });

  return { success: true, logId: updated.id, simulated: true };
}

/**
 * Retry manual notifikasi gagal dari dashboard Admin Settings
 */
export async function retryNotificationLog(notificationId: string) {
  try {
    const log = await prisma.notificationLog.findUnique({
      where: { id: notificationId },
    });

    if (!log) throw new Error("Log notifikasi tidak ditemukan");

    await prisma.notificationLog.update({
      where: { id: log.id },
      data: {
        status: "RETRY",
        retryCount: { increment: 1 },
      },
    });

    // Kirim ulang
    return await sendWhatsAppNotification({
      type: log.type as any,
      recipientPhone: log.recipientPhone,
      recipientName: log.recipientName,
      messageBody: log.messageBody,
      relatedVehicleId: log.relatedVehicleId,
      relatedSaleId: log.relatedSaleId,
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Cek status kesehatan koneksi WAHA (WhatsApp HTTP API)
 */
export async function checkWahaHealth() {
  const wahaBaseUrl = process.env.WAHA_BASE_URL || "http://localhost:2026";
  try {
    const res = await fetch(`${wahaBaseUrl}/api/sessions`, {
      headers: {
        ...(process.env.WAHA_API_KEY ? { "X-Api-Key": process.env.WAHA_API_KEY } : {}),
      },
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      const data = await res.json().catch(() => []);
      const session = Array.isArray(data) ? data.find((s: any) => s.name === "default") || data[0] : null;
      return {
        online: true,
        endpoint: wahaBaseUrl,
        status: session?.status || "CONNECTED",
        sessionName: session?.name || "default",
      };
    }
    return { online: false, endpoint: wahaBaseUrl, status: "ERROR_STATUS" };
  } catch (err: any) {
    return { online: false, endpoint: wahaBaseUrl, status: "OFFLINE", error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE & TRIGGER HELPER NOTIFIKASI
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 1. Notifikasi Unit Laku (Dikirim ke Owner & Investor)
 */
export async function sendUnitSoldNotification(params: {
  recipientPhone: string;
  recipientName?: string;
  vehicleTitle: string;
  plateNumber: string;
  sellingPrice: number;
  buyerName: string;
  vehicleId: string;
  saleId: string;
}) {
  const formattedPrice = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(params.sellingPrice);

  const message = [
    `📢 *KABAR BAIK: UNIT TERJUAL!*`,
    `Halo Bpk/Ibu *${params.recipientName || "Pemodal / Owner"}*,`,
    ``,
    `Unit kendaraan berikut telah laku terjual:`,
    `🚗 *Unit:* ${params.vehicleTitle}`,
    `🔢 *Plat:* ${params.plateNumber}`,
    `💰 *Harga Jual:* ${formattedPrice}`,
    `👤 *Pembeli:* ${params.buyerName}`,
    ``,
    `Sistem Nur Mobil sedang mengalkulasi HPP & laba bersih untuk pencairan bagi hasil modal Anda. Lembar rincian akan dikirimkan setelah proses penutupan selesai.`,
    ``,
    `_Salam hormat,_`,
    `*Showroom Nur Mobil (Toko Bu Nur)*`,
  ].join("\n");

  return sendWhatsAppNotification({
    type: "UNIT_SOLD",
    recipientPhone: params.recipientPhone,
    recipientName: params.recipientName,
    messageBody: message,
    relatedVehicleId: params.vehicleId,
    relatedSaleId: params.saleId,
  });
}

/**
 * 2. Notifikasi Laba Bersih & Pencairan Bagi Hasil (Dikirim ke Investor)
 */
export async function sendProfitDistributionNotification(params: {
  recipientPhone: string;
  recipientName: string;
  vehicleTitle: string;
  plateNumber: string;
  capitalReturned: number;
  profitShare: number;
  totalTransferred: number;
  vehicleId: string;
  saleId: string;
  pdfInvoiceUrl?: string;
}) {
  const fmt = (num: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);

  const message = [
    `💵 *RINCIAN PENCAIRAN BAGI HASIL INVESTASI*`,
    `Kepada Yth. Bpk/Ibu *${params.recipientName}*,`,
    ``,
    `Berikut adalah laporan pencairan dana untuk unit *${params.vehicleTitle}* (${params.plateNumber}):`,
    ``,
    `✅ *Modal Awal Kembali:* ${fmt(params.capitalReturned)}`,
    `📈 *Bagi Hasil Keuntungan:* ${fmt(params.profitShare)}`,
    `💳 *Total Dana Ditransfer:* *${fmt(params.totalTransferred)}*`,
    ``,
    `Dana telah disalurkan ke rekening bank Anda yang terdaftar. Bukti transfer dan rekapitulasi audit transaksi dapat dilihat pada portal investor Anda.`,
    ``,
    `Terima kasih atas kemitraan dan kepercayaan Anda bersama Nur Mobil!`,
    `*Showroom Nur Mobil*`,
  ].join("\n");

  return sendWhatsAppNotification({
    type: "PROFIT_DISTRIBUTION",
    recipientPhone: params.recipientPhone,
    recipientName: params.recipientName,
    messageBody: message,
    relatedVehicleId: params.vehicleId,
    relatedSaleId: params.saleId,
    mediaUrl: params.pdfInvoiceUrl || null,
    mediaFileName: `Laporan_Bagi_Hasil_${params.plateNumber.replace(/\s+/g, "_")}.pdf`,
  });
}

/**
 * 3. Notifikasi Persuratan / Dokumen Selesai (Dikirim ke Pembeli)
 */
export async function sendDocumentReadyNotification(params: {
  recipientPhone: string;
  buyerName: string;
  vehicleTitle: string;
  plateNumber: string;
  documentTypes: string[]; // e.g. ["BPKB Asli", "Faktur Pembelian", "Kuitansi Pelunasan"]
  vehicleId?: string;
  saleId?: string;
}) {
  const docList = params.documentTypes.map((d) => `• ${d}`).join("\n");

  const message = [
    `📄 *DOKUMEN KENDARAAN SIAP DIAMBIL*`,
    `Halo Bpk/Ibu *${params.buyerName}*,`,
    ``,
    `Kami informasikan bahwa dokumen resmi untuk unit *${params.vehicleTitle}* (${params.plateNumber}) telah selesai diproses dan siap diambil di Showroom Nur Mobil:`,
    ``,
    docList,
    ``,
    `📍 *Lokasi Pengambilan:* Garasi Showroom Nur Mobil`,
    `🕒 *Jam Operasional:* Senin – Sabtu (08.00 – 17.00 WIB)`,
    `Mohon membawa KTP asli saat serah terima dokumen.`,
    ``,
    `Terima kasih atas kepercayaan Anda bertransaksi di Nur Mobil!`,
  ].join("\n");

  return sendWhatsAppNotification({
    type: "DOCUMENT_READY",
    recipientPhone: params.recipientPhone,
    recipientName: params.buyerName,
    messageBody: message,
    relatedVehicleId: params.vehicleId,
    relatedSaleId: params.saleId,
  });
}
