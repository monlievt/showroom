import React from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { InvestorDepositNewClient } from "@/components/admin/InvestorDepositNewClient";
import { getInvestors } from "@/app/actions/investor";

export const metadata = {
  title: "Penyetoran Modal Investor | Nur Mobil Admin",
  description: "Form pencatatan penyetoran modal investor ke rekening kas showroom.",
};

export const dynamic = "force-dynamic";

export default async function AdminInvestorDepositPage() {
  const res = await getInvestors();
  const rawInvestors = res.success && res.data ? res.data : [];

  const investors = rawInvestors.map((i) => ({
    id: i.id,
    name: i.name,
    type: i.type,
  }));

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Penyetoran Modal Investor"
        subtitle="Catat dana masuk dari investor yang akan dialokasikan ke modal unit mobil."
      />
      <main className="flex-1">
        <InvestorDepositNewClient investors={investors} />
      </main>
    </div>
  );
}
