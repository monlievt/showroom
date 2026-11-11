import React from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { VehicleNewClient } from "@/components/admin/VehicleNewClient";
import { getInvestors } from "@/app/actions/investor";
import { getCashBalanceSummary } from "@/app/actions/cash-transaction";

export const metadata = {
  title: "Intake Kendaraan Baru | Nur Mobil Admin",
  description: "Form pendaftaran unit baru masuk ke inventori garasi Showroom Nur Mobil.",
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
        title="Intake Unit Kendaraan Baru"
        subtitle="Daftarkan kendaraan yang baru dimenangkan dari balai lelang atau dibeli langsung."
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
