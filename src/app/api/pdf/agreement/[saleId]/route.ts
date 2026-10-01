import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import prisma from "@/lib/prisma";
import { SaleAgreementPdfDocument } from "@/components/pdf/SaleAgreementPdfDocument";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ saleId: string }> }
) {
  try {
    const { saleId } = await params;

    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        vehicle: true,
        buyer: true,
        payments: {
          orderBy: { paidAt: "asc" },
          include: {
            tradeInVehicle: true,
          },
        },
      },
    });

    if (!sale || !sale.vehicle || !sale.buyer) {
      return NextResponse.json(
        { error: "Surat Perjanjian atau transaksi penjualan tidak ditemukan." },
        { status: 404 }
      );
    }

    const buffer = await renderToBuffer(
      React.createElement(SaleAgreementPdfDocument, {
        sale,
        vehicle: sale.vehicle,
        buyer: sale.buyer,
        payments: sale.payments,
      }) as any
    );

    const filename = `spk-perjanjian-${sale.vehicle.plateNumber.replace(/\s+/g, "")}-${sale.id.substring(0, 6)}.pdf`;

    return new Response(buffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "public, max-age=1800",
      },
    });
  } catch (error: any) {
    console.error("Gagal men-generate Surat Perjanjian SPK PDF:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat dokumen SPK PDF" },
      { status: 500 }
    );
  }
}
