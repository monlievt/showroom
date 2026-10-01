import React from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { InvestorNewClient } from "@/components/admin/InvestorNewClient";

export const metadata = {
  title: "Tambah Investor Baru | Nur Mobil Admin",
  description: "Pendaftaran profil mitra investor pemodal showroom mobil.",
};

export default function AdminNewInvestorPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Tambah Investor Baru"
        subtitle="Daftarkan mitra pemodal untuk dialokasikan pada unit lelang dan pembagian bagi hasil."
      />
      <main className="flex-1">
        <InvestorNewClient />
      </main>
    </div>
  );
}
