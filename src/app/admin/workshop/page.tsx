import React from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { getFinanceSummary } from "@/app/actions/finance";
import { getShowroomAssets } from "@/app/actions/asset";
import { getWorkshopSuppliesAction } from "@/app/actions/supplies";
import prisma from "@/lib/prisma";
import { AssetsInventoryPageClient } from "@/components/admin/AssetsInventoryPageClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gudang Bahan & Alat Garasi | Nur Mobil Admin",
  description: "Daftar inventaris peralatan kerja showroom, stok bahan habis pakai (oli/filter/salon), dan riwayat pemakaian servis mobil.",
};

export default async function WorkshopPage() {
  const [summaryRes, assetsRes, suppliesRes, activeVehicles] = await Promise.all([
    getFinanceSummary(),
    getShowroomAssets(),
    getWorkshopSuppliesAction(),
    prisma.vehicle.findMany({
      where: { status: { not: "SOLD_SETTLED" } },
      select: {
        id: true,
        plateNumber: true,
        brand: true,
        model: true,
        year: true,
      },
      orderBy: { purchaseDate: "desc" },
    }),
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

  const assets = assetsRes.data || {
    items: [],
    totalPurchaseCost: 0,
    totalCurrentValue: 0,
    totalItems: 0,
  };

  const supplies = suppliesRes.data || {
    items: [],
    totalStockValue: 0,
    totalItemsInStock: 0,
    lowStockCount: 0,
    summary: {
      totalSuppliesCostUsed: 0,
      totalHppChargedToVehicles: 0,
      totalWorkshopMarginEarned: 0,
    },
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Gudang Bahan & Alat Garasi"
        subtitle="Manajemen stok bahan habis pakai (oli, sparepart, salon), aset peralatan kerja, dan pencatatan alokasi servis unit mobil."
      />

      <main className="flex-1 p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
        <AssetsInventoryPageClient
          summary={summary}
          assets={assets}
          supplies={supplies}
          activeVehicles={activeVehicles}
        />
      </main>
    </div>
  );
}
