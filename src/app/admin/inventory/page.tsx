import React from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { InventoryClient } from "@/components/admin/InventoryClient";
import { getVehiclesAction } from "@/app/actions/vehicle";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const result = await getVehiclesAction();
  const vehicles = result.success && result.data ? result.data : [];

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Inventori Kendaraan"
        subtitle="Manajemen unit masuk, monitoring durasi garasi (anti-unit macet), kontrol biaya servis & HPP berjalan."
      />
      <main className="flex-1">
        <InventoryClient initialVehicles={vehicles as any} />
      </main>
    </div>
  );
}
