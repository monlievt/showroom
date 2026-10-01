import React from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { OwnerEquityNewClient } from "@/components/admin/OwnerEquityNewClient";

export const metadata = {
  title: "Setor Modal Tambahan Pribadi | Nur Mobil Admin",
  description: "Pencatatan penambahan modal owner ke kas operasional showroom.",
};

export default function AdminNewEquityPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Setor Modal Tambahan Pribadi"
        subtitle="Injeksi dana pemilik ke kas showroom untuk modal lelang unit baru."
      />
      <main className="flex-1">
        <OwnerEquityNewClient />
      </main>
    </div>
  );
}
