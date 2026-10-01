import React from "react";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { VehicleStatusClient } from "@/components/admin/VehicleStatusClient";
import { getVehicleByIdAction } from "@/app/actions/vehicle";

export const metadata = {
  title: "Ubah Status Unit | Nur Mobil Admin",
  description: "Pengaturan status alur kerja unit kendaraan showroom.",
};

export default async function VehicleStatusPage({
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
        title={`Ubah Status — ${v.brand} ${v.model} (${v.plateNumber})`}
        subtitle="Kelola transisi status dari intake lelang, bengkel, siap display hingga terjual."
      />
      <main className="flex-1">
        <VehicleStatusClient
          vehicle={{
            id: v.id,
            plateNumber: v.plateNumber,
            brand: v.brand,
            model: v.model,
            year: v.year,
            status: v.status,
          }}
        />
      </main>
    </div>
  );
}
