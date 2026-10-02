import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { InspectionWebCertificate } from "@/components/inspection/InspectionWebCertificate";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const inspection = await prisma.inspection.findUnique({
    where: { id },
    include: {
      vehicle: true,
    },
  });

  if (!inspection || !inspection.vehicle) {
    return {
      title: "Sertifikat Inspeksi Tidak Ditemukan | Nur Mobil",
    };
  }

  const v = inspection.vehicle;
  return {
    title: `Sertifikat Inspeksi ACV — ${v.brand} ${v.model} (${v.plateNumber}) | Nur Mobil`,
    description: `Lembar hasil cek fisik resmi, uji ketebalan cat bodi multi-point, dan verifikasi integritas rangka sasis berstandar Astra Car Valuation (ACV).`,
  };
}

export default async function PublicInspectionCertificatePage({ params }: Props) {
  const { id } = await params;

  const inspection = await prisma.inspection.findUnique({
    where: { id },
    include: {
      panels: true,
      vehicle: {
        include: {
          photos: {
            orderBy: { uploadedAt: "desc" },
          },
        },
      },
    },
  });

  if (!inspection || !inspection.vehicle) {
    notFound();
  }

  const v = inspection.vehicle;

  return (
    <InspectionWebCertificate
      inspection={{
        id: inspection.id,
        version: inspection.version,
        stage: inspection.stage,
        inspectedAt: inspection.inspectedAt,
        inspectedBy: inspection.inspectedBy,
        totalGrade: inspection.totalGrade,
        engineGrade: inspection.engineGrade,
        interiorGrade: inspection.interiorGrade,
        exteriorGrade: inspection.exteriorGrade,
        frameGrade: inspection.frameGrade,
        accidentHistory: inspection.accidentHistory,
        floodHistory: inspection.floodHistory,
        hasServiceBook: inspection.hasServiceBook,
        hasSpareKey: inspection.hasSpareKey,
        milAirbagOk: inspection.milAirbagOk,
        engineNotes: inspection.engineNotes,
        interiorNotes: inspection.interiorNotes,
        exteriorNotes: inspection.exteriorNotes,
        frameNotes: inspection.frameNotes,
        checklistData: inspection.checklistData,
        panels: inspection.panels as any,
      }}
      vehicle={{
        id: v.id,
        plateNumber: v.plateNumber,
        brand: v.brand,
        model: v.model,
        year: v.year,
        color: v.color,
        odometer: v.odometer,
        transmission: v.transmission,
        fuelType: v.fuelType,
        chassisNumber: v.chassisNumber,
        engineNumber: v.engineNumber,
        slug: `${v.brand.toLowerCase()}-${v.model.toLowerCase()}-${v.year}-${v.plateNumber.toLowerCase().replace(/\s+/g, "")}`,
        photos: v.photos || [],
      }}
      isPublic={true}
    />
  );
}
