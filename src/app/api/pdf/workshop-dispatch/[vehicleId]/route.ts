import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import prisma from "@/lib/prisma";
import { WorkshopDispatchPdfDocument } from "@/components/pdf/WorkshopDispatchPdfDocument";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  try {
    const { vehicleId } = await params;
    const url = new URL(req.url);

    const workshopName = url.searchParams.get("workshopName") || "Bengkel Rekanan Rekondisi";
    const workshopAddress = url.searchParams.get("workshopAddress") || "Workshop / Body Repair Rekanan";
    const workshopPhone = url.searchParams.get("workshopPhone") || null;
    const driverName = url.searchParams.get("driverName") || "Kru Operasional Showroom";
    const targetDays = url.searchParams.get("targetDays") ? parseInt(url.searchParams.get("targetDays")!) : 4;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        expenses: {
          orderBy: { date: "desc" },
          take: 5,
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: "Data unit kendaraan tidak ditemukan." },
        { status: 404 }
      );
    }

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const cleanPlate = vehicle.plateNumber.replace(/\s+/g, "");
    const dispatchNumber = `SPK-BKL/${todayStr}/${cleanPlate}`;

    // Map expenses jika ada
    const relevantExpenses = vehicle.expenses.map((e) => ({
      category: e.category.replace(/_/g, " "),
      description: e.notes || (e.vendorName ? `${e.vendorName} - Pengerjaan ${e.category.toLowerCase().replace(/_/g, " ")}` : `Pengerjaan ${e.category.toLowerCase().replace(/_/g, " ")}`),
      amount: Number(e.amount),
    }));

    const buffer = await renderToBuffer(
      React.createElement(WorkshopDispatchPdfDocument, {
        data: {
          dispatchNumber,
          dispatchDate: new Date(),
          workshopName,
          workshopAddress,
          workshopPhone,
          targetDays,
          driverName,
          vehicle: {
            plateNumber: vehicle.plateNumber,
            brand: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year,
            color: vehicle.color,
            odometer: vehicle.odometer,
            transmission: vehicle.transmission,
            chassisNumber: vehicle.chassisNumber,
            engineNumber: vehicle.engineNumber,
            fuelType: vehicle.fuelType,
          },
          expenses: relevantExpenses.length > 0 ? relevantExpenses : undefined,
        },
      }) as any
    );

    const filename = `surat-jalan-bengkel-${cleanPlate}-${todayStr}.pdf`;

    return new Response(buffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "public, max-age=1800",
      },
    });
  } catch (error: any) {
    console.error("Gagal men-generate Surat Jalan Bengkel PDF:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat dokumen Surat Jalan Bengkel PDF" },
      { status: 500 }
    );
  }
}
