import React from "react";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { VehicleEditClient } from "@/components/admin/VehicleEditClient";
import { getVehicleByIdAction } from "@/app/actions/vehicle";

export const metadata = {
  title: "Edit Lengkap Data Unit | Nur Mobil Admin",
  description: "Edit data lengkap intake, spesifikasi, legalitas BPKB/STNK dan harga kendaraan showroom.",
};

export default async function VehicleEditPage({
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
        title={`Edit Data Unit — ${v.brand} ${v.model} (${v.plateNumber})`}
        subtitle="Perbarui semua data spesifikasi, balai lelang, status STNK/pajak, dan harga katalog."
      />
      <main className="flex-1">
        <VehicleEditClient vehicle={v} />
      </main>
    </div>
  );
}
