"use server";

import { revalidatePath } from "next/cache";
import {
  sendWhatsAppNotification,
  sendUnitSoldNotification,
  sendProfitDistributionNotification,
  sendDocumentReadyNotification,
  checkWahaHealth,
  NotificationLogType,
} from "@/lib/services/whatsapp";

export async function sendTestWhatsAppAction(type: NotificationLogType, phone: string, name?: string) {
  try {
    if (!phone) throw new Error("Nomor WhatsApp wajib diisi");

    let result;
    if (type === "UNIT_SOLD") {
      result = await sendUnitSoldNotification({
        recipientPhone: phone,
        recipientName: name || "Investor Demo",
        vehicleTitle: "Toyota Innova Reborn 2.4 G Diesel AT 2021",
        plateNumber: "N 1822 AB",
        sellingPrice: 325000000,
        buyerName: "Bpk. Rahmat Santoso (Malang)",
        vehicleId: "demo-vehicle-id",
        saleId: "demo-sale-id",
      });
    } else if (type === "PROFIT_DISTRIBUTION") {
      result = await sendProfitDistributionNotification({
        recipientPhone: phone,
        recipientName: name || "Pak Budi Hartono",
        vehicleTitle: "Toyota Innova Reborn 2.4 G Diesel AT 2021",
        plateNumber: "N 1822 AB",
        capitalReturned: 150000000,
        profitShare: 6750000,
        totalTransferred: 156750000,
        vehicleId: "demo-vehicle-id",
        saleId: "demo-sale-id",
      });
    } else if (type === "DOCUMENT_READY") {
      result = await sendDocumentReadyNotification({
        recipientPhone: phone,
        buyerName: name || "Bpk. Rahmat Santoso",
        vehicleTitle: "Toyota Innova Reborn 2.4 G Diesel AT 2021",
        plateNumber: "N 1822 AB",
        documentTypes: ["BPKB Asli & Faktur Resmi", "Kuitansi Pelunasan Showroom", "Surat Pelepasan Hak"],
      });
    } else if (type === "PAJAK_EXPIRY") {
      result = await sendWhatsAppNotification({
        type: "PAJAK_EXPIRY",
        recipientPhone: phone,
        recipientName: name || "Admin / Owner",
        messageBody: `⚠️ *PENGINGAT PAJAK STNK*\nUnit *Toyota Innova Reborn (N 1822 AB)* memiliki masa berlaku pajak STNK yang akan habis dalam 14 hari ke depan. Mohon perpanjangan segera agar unit tetap prima legalitasnya.`,
      });
    } else {
      result = await sendWhatsAppNotification({
        type: "PIUTANG_DUE",
        recipientPhone: phone,
        recipientName: name || "Customer",
        messageBody: `🔔 *PENGINGAT JATUH TEMPO PIUTANG*\nHalo Bpk/Ibu, kami menginformasikan sisa pembayaran cicilan showroom unit Innova Reborn sebesar Rp 15.000.000 akan jatuh tempo pada 3 hari mendatang. Terima kasih atas kerja samanya.`,
      });
    }

    revalidatePath("/admin/settings");
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal mengirim pesan uji coba" };
  }
}

export async function getWahaHealthAction() {
  return await checkWahaHealth();
}
