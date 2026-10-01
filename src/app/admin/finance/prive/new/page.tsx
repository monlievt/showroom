import React from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { OwnerDrawNewClient } from "@/components/admin/OwnerDrawNewClient";

export const metadata = {
  title: "Catat Prive Pribadi Owner | Nur Mobil Admin",
  description: "Pencatatan penarikan keperluan pribadi owner tanpa merusak laba mobil showroom.",
};

export default function AdminNewPrivePage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Catat Prive (Kebutuhan Pribadi Owner)"
        subtitle="Pemisahan uang kas rekening BCA untuk kebutuhan keluarga agar pembukuan mobil tetap bersih."
      />
      <main className="flex-1">
        <OwnerDrawNewClient />
      </main>
    </div>
  );
}
