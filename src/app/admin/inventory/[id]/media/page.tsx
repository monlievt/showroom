import React from "react";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { VehicleMediaUploadClient } from "@/components/admin/VehicleMediaUploadClient";
import { getVehicleByIdAction } from "@/app/actions/vehicle";

export const metadata = {
  title: "Media & Dokumen Unit | Nur Mobil Admin",
  description: "Manajemen arsip foto unit dan dokumen legalitas kendaraan.",
};

export default async function VehicleMediaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getVehicleByIdAction(id);

  if (!res.success || !res.data) {
    notFound();
  }

  const v = res.data;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title={`Media & Dokumen — ${v.brand} ${v.model} (${v.plateNumber})`}
        subtitle="Kelola arsip foto intake, galeri display publik, serta scan STNK dan BPKB."
      />
      <main className="flex-1">
        <VehicleMediaUploadClient
          vehicle={{
            id: v.id,
            plateNumber: v.plateNumber,
            brand: v.brand,
            model: v.model,
            year: v.year,
            photos: v.photos || [],
            documents: v.documents || [],
          }}
        />
      </main>
    </div>
  );
}
