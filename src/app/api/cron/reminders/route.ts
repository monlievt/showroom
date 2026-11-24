import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendWhatsAppNotification } from "@/lib/services/whatsapp";
import { getPublicWhatsAppContactsAction } from "@/app/actions/contact";
import { formatRupiah, formatDate, normalizePlateNumber, formatVehicleTitle } from "@/lib/utils";
import Decimal from "decimal.js";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Validasi Authorization Token (CRON_SECRET)
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (process.env.NODE_ENV === "production" && !cronSecret) {
      console.error("CRON_SECRET belum dikonfigurasi di environment produksi.");
      return NextResponse.json(
        { error: "Server misconfiguration: CRON_SECRET is required in production." },
        { status: 500 }
      );
    }

    const expectedHeader = `Bearer ${cronSecret || "default_local_cron_secret"}`;
    if (authHeader !== expectedHeader) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing CRON_SECRET" },
        { status: 401 }
      );
    }

    const now = new Date();
    const results = {
      piutangSent: 0,
      pajakSent: 0,
      errors: [] as string[],
    };

    // =========================================================================
    // 2. REMINDER PIUTANG TEMPO — SHOWROOM REKANAN & PEMBELI LANGSUNG (H-3 & H-0)
    // =========================================================================
    const activeTempoSales = await prisma.sale.findMany({
      where: {
        vehicle: {
          status: {
            in: ["AT_SHOWROOM_PENDING", "BOOKED"],
          },
        },
        dueDate: {
          not: null,
        },
      },
      include: {
        buyer: true,
        vehicle: true,
        payments: true,
      },
    });

    for (const sale of activeTempoSales) {
      if (!sale.dueDate || !sale.buyer.phone) continue;

      const totalPaid = sale.payments.reduce(
        (sum, p) => sum.plus(new Decimal(p.amount.toString())),
        new Decimal(0)
      );
      const remaining = new Decimal(sale.sellingPrice.toString()).minus(totalPaid);

      if (remaining.gt(0)) {
        const dueDate = new Date(sale.dueDate);
        const diffTime = dueDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 3 || diffDays <= 0) {
          const urgency =
            diffDays <= 0
              ? `*JATUH TEMPO HARI INI / SUDAH TERLEWAT*`
              : `*H-3 JATUH TEMPO*`;
          const buyerLabel = sale.buyer.isShowroom ? " (Showroom Rekanan)" : "";
          const plate = normalizePlateNumber(sale.vehicle.plateNumber);
          const unitTitle = formatVehicleTitle(
            sale.vehicle.brand,
            sale.vehicle.model,
            sale.vehicle.year
          );

          const message = `Halo Pak/Bu *${sale.buyer.name}*${buyerLabel},\n\nPengingat ${urgency} untuk unit *${unitTitle}* (Plat: *${plate}*).\n\nSisa tagihan yang belum terbayar: *${formatRupiah(remaining.toNumber())}*.\nJatuh tempo: *${formatDate(sale.dueDate)}*.\n\nMohon konfirmasi bukti transfer jika dana sudah ditransfer ke rekening Nur Mobil. Terima kasih!`;

          const sendResult = await sendWhatsAppNotification({
            type: "PIUTANG_DUE",
            recipientPhone: sale.buyer.phone,
            recipientName: sale.buyer.name,
            messageBody: message,
            relatedVehicleId: sale.vehicleId,
            relatedSaleId: sale.id,
          });

          if (sendResult.success) results.piutangSent++;
          else if (sendResult.error) results.errors.push(sendResult.error);
        }
      }
    }

    // =========================================================================
    // 3. REMINDER JATUH TEMPO PAJAK KENDARAAN (H-30 dan H-7)
    // =========================================================================
    const waContacts = await getPublicWhatsAppContactsAction();
    const primaryContact =
      waContacts.find((c) => c.isPrimary && c.isActive) ||
      waContacts.find((c) => c.isActive);
    const ownerPhone = process.env.OWNER_WHATSAPP_PHONE || primaryContact?.phone || "";

    if (ownerPhone) {
      const unsoldVehiclesWithTax = await prisma.vehicle.findMany({
        where: {
          status: {
            in: ["INTAKE", "IN_REPAIR", "READY_FOR_SALE", "BOOKED", "AT_SHOWROOM_PENDING"],
          },
          taxExpiryDate: {
            not: null,
          },
        },
      });

      for (const v of unsoldVehiclesWithTax) {
        if (!v.taxExpiryDate) continue;

        const taxDate = new Date(v.taxExpiryDate);
        const diffTime = taxDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 30 || diffDays === 7 || diffDays <= 0) {
          const urgency =
            diffDays <= 0
              ? `*PAJAK TELAH JATUH TEMPO / MATI*`
              : `*PAJAK HABIS DALAM ${diffDays} HARI*`;
          const plate = normalizePlateNumber(v.plateNumber);
          const unitTitle = formatVehicleTitle(v.brand, v.model, v.year);

          const message = `[Internal Nur Mobil] Pengingat Pajak STNK:\n${urgency} untuk unit:\n• Unit: *${unitTitle}*\n• Plat: *${plate}*\n• Tanggal Habis Pajak: *${formatDate(v.taxExpiryDate)}*\n• Lokasi: ${v.currentLocation}\n\nMohon segera agendakan perpanjangan STNK di Samsat agar legalitas unit tetap aman.`;

          const sendResult = await sendWhatsAppNotification({
            type: "PAJAK_EXPIRY",
            recipientPhone: ownerPhone,
            recipientName: "Owner (Nur Mobil)",
            messageBody: message,
            relatedVehicleId: v.id,
          });

          if (sendResult.success) results.pajakSent++;
          else if (sendResult.error) results.errors.push(sendResult.error);
        }
      }
    } else {
      results.errors.push(
        "Nomor WhatsApp Owner belum diatur di Pengaturan Kontak WA maupun env OWNER_WHATSAPP_PHONE, reminder pajak dilewati."
      );
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      summary: results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memproses cron reminder" },
      { status: 500 }
    );
  }
}

// Mendukung GET untuk kemudahan uji coba manual di browser / healthcheck cron
export async function GET(req: NextRequest) {
  return POST(req);
}
