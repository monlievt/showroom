import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { prisma } from "@/lib/prisma";
import { InspectionPdfDocument } from "@/components/pdf/InspectionPdfDocument";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const inspection = await prisma.inspection.findUnique({
      where: { id },
      include: {
        vehicle: true,
        panels: true,
      },
    });

    if (!inspection || !inspection.vehicle) {
      return NextResponse.json(
        { error: "Lembar inspeksi tidak ditemukan" },
        { status: 404 }
      );
    }

    // Render PDF ke buffer
    const buffer = await renderToBuffer(
      React.createElement(InspectionPdfDocument, {
        inspection,
        vehicle: inspection.vehicle,
      }) as any
    );

    const filename = `inspeksi-${inspection.vehicle.plateNumber.replace(/\s+/g, "")}-v${inspection.version}.pdf`;

    return new Response(buffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("Gagal men-generate PDF inspeksi:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat dokumen PDF" },
      { status: 500 }
    );
  }
}
