import React from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { getFinanceSummary } from "@/app/actions/finance";
import { getCashTransactions } from "@/app/actions/cash-transaction";
import { getShowroomAssets } from "@/app/actions/asset";
import { CashflowPageClient } from "@/components/admin/CashflowPageClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Buku Kas & Mutasi BCA | Nur Mobil Admin",
  description: "Manajemen buku kas BCA, pencatatan mutasi masuk dan keluar, serta kontrol saldo berjalan.",
};

export default async function FinanceCashflowPage() {
  const [summaryRes, cashRes, assetsRes] = await Promise.all([
    getFinanceSummary(),
    getCashTransactions({ take: 150 }),
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

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Buku Kas Rekening BCA & Mutasi"
        subtitle="Pencatatan uang masuk/keluar harian, saldo berjalan kas rekening, filter tipe transaksi, dan status rekonsiliasi."
      />

      <main className="flex-1 p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
        <CashflowPageClient
          summary={summary}
          cashTransactions={cashRes.data?.items || []}
        />
      </main>
    </div>
  );
}
