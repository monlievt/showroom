import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import QRCode from "qrcode";
import prisma from "@/lib/prisma";
import { SpecTagPdfDocument } from "@/components/pdf/SpecTagPdfDocument";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  try {
    const { vehicleId } = await params;
    const host = req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || "http";

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: "Data unit kendaraan tidak ditemukan." },
        { status: 404 }
      );
    }

    const catalogUrl = `${proto}://${host}/catalog/${vehicle.id}`;

    // Generate QR Code data URL
    const qrDataUrl = await QRCode.toDataURL(catalogUrl, {
      margin: 1,
      width: 250,
      color: {
        dark: "#1C1917",
        light: "#FFFFFF",
      },
    });

    const buffer = await renderToBuffer(
      React.createElement(SpecTagPdfDocument, {
        data: {
          vehicle: {
            plateNumber: vehicle.plateNumber,
            brand: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year,
            color: vehicle.color,
            odometer: vehicle.odometer,
            transmission: vehicle.transmission,
            fuelType: vehicle.fuelType,
            engineCapacity: vehicle.engineCapacity,
            targetSellingPrice: vehicle.targetSellingPrice ? Number(vehicle.targetSellingPrice) : null,
          },
          qrDataUrl,
          catalogUrl,
          showroomName: "NUR MOBIL",
          phoneHotline: "0812-3456-7890",
        },
      }) as any
    );

    const cleanPlate = vehicle.plateNumber.replace(/\s+/g, "");
    const filename = `tag-spion-${cleanPlate}.pdf`;

    return new Response(buffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "public, max-age=1800",
      },
    });
  } catch (error: any) {
    console.error("Gagal men-generate Tag Spion PDF:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat dokumen Tag Spion PDF" },
      { status: 500 }
    );
  }
}
