import React from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { OpExNewClient } from "@/components/admin/OpExNewClient";

export const metadata = {
  title: "Catat Beban Operasional Showroom | Nur Mobil Admin",
  description: "Pencatatan pengeluaran rutin operasional showroom terpisah dari HPP unit mobil.",
};

export default function AdminNewOpExPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Catat Beban Operasional Showroom"
        subtitle="Pencatatan pengeluaran sewa ruko, utilitas, gaji, dan iklan agar terpisah dari kas belanja mobil."
      />
      <main className="flex-1">
        <OpExNewClient />
      </main>
    </div>
  );
}
