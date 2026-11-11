import React from "react";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import {
  VehicleDetailAdminClient,
  type VehicleDetailAdminData,
} from "@/components/admin/VehicleDetailAdminClient";
import { getVehicleByIdAction } from "@/app/actions/vehicle";
import { getPublicWhatsAppContactsAction } from "@/app/actions/contact";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Detail Unit Kendaraan | Nur Mobil Admin",
  description: "Ringkasan foto unit, scan dokumen legalitas, biaya servis, dan inspeksi kendaraan.",
};

export default async function AdminVehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [res, waContacts] = await Promise.all([
    getVehicleByIdAction(id),
    getPublicWhatsAppContactsAction(),
  ]);

  if (!res.success || !res.data) {
    notFound();
  }

  const v = res.data as unknown as VehicleDetailAdminData;
  const primaryWa =
    waContacts.find((c) => c.isPrimary && c.isActive)?.phone ||
    waContacts[0]?.phone ||
    "081234567890";

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title={`Detail Unit — ${v.brand} ${v.model} (${v.plateNumber})`}
        subtitle="Lihat foto unit, dokumen legalitas, rincian biaya HPP, cek fisik, dan alokasi pemodal dalam satu tempat."
      />
      <main className="flex-1">
        <VehicleDetailAdminClient vehicle={v} whatsappPhone={primaryWa} />
      </main>
    </div>
  );
}

