import React from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { VehicleNewClient } from "@/components/admin/VehicleNewClient";
import { getInvestors } from "@/app/actions/investor";
import { getCashBalanceSummary } from "@/app/actions/cash-transaction";

export const metadata = {
  title: "Catat Unit Masuk | Nur Mobil",
  description: "Tambah mobil atau motor baru ke stok sekaligus tayangkan di katalog web.",
};

export default async function AdminNewVehiclePage() {
  const [investorsRes, cashRes] = await Promise.all([
    getInvestors(),
    getCashBalanceSummary(),
  ]);

  const availableInvestors =
    investorsRes.success && investorsRes.data ? investorsRes.data : [];
  const currentCashBalance =
    cashRes.success && cashRes.data ? cashRes.data.currentBalance : 0;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Catat Unit Masuk"
        subtitle="Isi data pokok unit, harga beli, dan foto jika ingin langsung tayang di web."
      />
      <main className="flex-1">
        <VehicleNewClient
          availableInvestors={availableInvestors}
          currentCashBalance={currentCashBalance}
        />
      </main>
    </div>
  );
}
