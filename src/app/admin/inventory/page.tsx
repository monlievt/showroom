import React from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { InventoryClient } from "@/components/admin/InventoryClient";
import { getVehiclesAction } from "@/app/actions/vehicle";
import { getPublicWhatsAppContactsAction } from "@/app/actions/contact";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const [result, session, waContacts] = await Promise.all([
    getVehiclesAction(),
    getSession(),
    getPublicWhatsAppContactsAction(),
  ]);
  const vehicles = result.success && result.data ? result.data : [];
  const primaryWa =
    waContacts.find((c) => c.isPrimary && c.isActive)?.phone ||
    waContacts[0]?.phone ||
    "081234567890";

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Inventori Kendaraan"
        subtitle="Manajemen unit masuk, monitoring durasi garasi (anti-unit macet), kontrol biaya servis & HPP berjalan."
      />
      <main className="flex-1">
        <InventoryClient
          initialVehicles={vehicles}
          userRole={session?.role || "STAFF_ADMIN"}
          whatsappPhone={primaryWa}
        />
      </main>
    </div>
  );
}
