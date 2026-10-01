import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { InspectionFormClient } from "@/components/admin/InspectionFormClient";

export default async function NewInspectionPage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const { vehicleId } = await params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: {
      id: true,
      plateNumber: true,
      brand: true,
      model: true,
      year: true,
      color: true,
    },
  });

  if (!vehicle) {
    notFound();
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Formulir Cek Fisik & Transparansi"
        subtitle={`Input hasil uji 11 panel logam dan penilaian 4 pilar unit ${vehicle.brand} ${vehicle.model} (${vehicle.plateNumber}).`}
      />
      <main className="flex-1 bg-[#F7F5F2]">
        <InspectionFormClient vehicle={vehicle} />
      </main>
    </div>
  );
}
