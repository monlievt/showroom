import React from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { VehicleNewClient } from "@/components/admin/VehicleNewClient";

export const metadata = {
  title: "Intake Kendaraan Baru | Nur Mobil Admin",
  description: "Form pendaftaran unit baru masuk ke inventori garasi Showroom Nur Mobil.",
};

export default function AdminNewVehiclePage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Intake Unit Kendaraan Baru"
        subtitle="Daftarkan kendaraan yang baru dimenangkan dari balai lelang atau dibeli langsung."
      />
      <main className="flex-1">
        <VehicleNewClient />
      </main>
    </div>
  );
}
