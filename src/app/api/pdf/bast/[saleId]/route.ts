import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import prisma from "@/lib/prisma";
import { BastPdfDocument } from "@/components/pdf/BastPdfDocument";

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
      },
    });

    if (!sale || !sale.vehicle || !sale.buyer) {
      return NextResponse.json(
        { error: "Berita Acara atau transaksi penjualan tidak ditemukan." },
        { status: 404 }
      );
    }

    const buffer = await renderToBuffer(
      React.createElement(BastPdfDocument, {
        sale,
        vehicle: sale.vehicle,
        buyer: sale.buyer,
      }) as any
    );

    const filename = `bast-${sale.vehicle.plateNumber.replace(/\s+/g, "")}-${sale.id.substring(0, 6)}.pdf`;

    return new Response(buffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "public, max-age=1800",
      },
    });
  } catch (error: any) {
    console.error("Gagal men-generate BAST PDF:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat dokumen BAST PDF" },
      { status: 500 }
    );
  }
}
