import React from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { getHistoricalSalesAction } from "@/app/actions/historical-sale";
import { ArchivePageClient } from "@/components/admin/ArchivePageClient";

export const dynamic = "force-dynamic";

export default async function AdminArchivePage() {
  const result = await getHistoricalSalesAction();
  const items = result.success && result.data ? result.data.items : [];
  const summary =
    result.success && result.data
      ? result.data.summary
      : {
          totalCount: 0,
          totalOmzet: 0,
          totalProfit: 0,
          totalHpp: 0,
          avgProfitPerUnit: 0,
          avgMarginPercent: 0,
        };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Arsip & Benchmark Harga"
        subtitle="Rekam jejak transaksi historis toko lama 2021-2025 sebagai mesin referensi harga pasaran dan acuan kulakan lelang."
      />
      <main className="flex-1">
        <ArchivePageClient initialItems={items} initialSummary={summary} />
      </main>
    </div>
  );
}
