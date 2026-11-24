import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import QRCode from "qrcode";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { SpecTagPdfDocument } from "@/components/pdf/SpecTagPdfDocument";
import { getPublicWhatsAppContactsAction } from "@/app/actions/contact";
import { generateVehicleSlug } from "@/lib/utils/slug";
import { normalizePlateNumber, cleanVehicleModel, formatReadableText } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !["OWNER", "ADMIN", "STAFF_ADMIN", "SALES"].includes(session.role)) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
    }
    const { vehicleId } = await params;
    const host = req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || "http";

    const [vehicle, waContacts] = await Promise.all([
      prisma.vehicle.findUnique({
        where: { id: vehicleId },
      }),
      getPublicWhatsAppContactsAction(),
    ]);

    if (!vehicle) {
      return NextResponse.json(
        { error: "Data unit kendaraan tidak ditemukan." },
        { status: 404 }
      );
    }

    const slug = generateVehicleSlug({
      plateNumber: vehicle.plateNumber,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
    });
    const catalogUrl = `${proto}://${host}/katalog/${slug}`;
    const primaryContact =
      waContacts.find((c) => c.isPrimary && c.isActive) ||
      waContacts.find((c) => c.isActive);
    const phoneHotline = primaryContact?.phone || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "-";

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
            plateNumber: normalizePlateNumber(vehicle.plateNumber),
            brand: formatReadableText(vehicle.brand),
            model: cleanVehicleModel(vehicle.brand, vehicle.model, vehicle.year) || vehicle.model,
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
          phoneHotline,
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
