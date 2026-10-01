import React from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { getFinanceSummary } from "@/app/actions/finance";
import { getOperationalExpensesSummary } from "@/app/actions/operational-expense";
import { getShowroomAssets } from "@/app/actions/asset";
import { ExpensesPrivePageClient } from "@/components/admin/ExpensesPrivePageClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pemisahan Beban & Prive (BCA) | Nur Mobil Admin",
  description: "Pemisahan pengeluaran operasional showroom vs belanja pribadi owner di satu rekening BCA.",
};

export default async function ExpensesPrivePage() {
  const [summaryRes, operationalRes, assetsRes] = await Promise.all([
    getFinanceSummary(),
    getOperationalExpensesSummary(),
    getShowroomAssets(),
  ]);

  const summary = summaryRes.data || {
    cashBalance: 0,
    activeAllocatedCapital: 0,
    totalProfitPaid: 0,
    totalOwnerProfit: 0,
    totalInvestorProfit: 0,
    totalInventoryValue: 0,
    totalAssetValue: 0,
    totalOperationalExpenses: 0,
    totalOwnerDraw: 0,
    totalOwnerEquity: 0,
    activeVehiclesCount: 0,
    assetsCount: assetsRes.data?.totalItems || 0,
  };

  const operationalData = operationalRes.data || {
    operationalExpenses: [],
    ownerDraws: [],
    ownerEquities: [],
    totalOperational: 0,
    totalOwnerDraw: 0,
    totalOwnerEquity: 0,
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Pemisahan Beban & Prive Pribadi (BCA)"
        subtitle="Solusi pembukuan rekening campur: pisahkan beban ruko/listrik showroom dari belanja keluarga tanpa merusak laba mobil."
      />

      <main className="flex-1 p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
        <ExpensesPrivePageClient
          summary={summary}
          operationalData={operationalData}
        />
      </main>
    </div>
  );
}
