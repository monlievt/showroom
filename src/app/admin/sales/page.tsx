import React from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SalesClient } from "@/components/admin/SalesClient";
import { getSalesAction } from "@/app/actions/sale";
import { getVehiclesAction } from "@/app/actions/vehicle";

export const dynamic = "force-dynamic";

export default async function AdminSalesPage() {
  const [salesResult, vehiclesResult] = await Promise.all([
    getSalesAction(),
    getVehiclesAction(),
  ]);

  const sales = salesResult.success && salesResult.data ? salesResult.data : [];
  const allVehicles = vehiclesResult.success && vehiclesResult.data ? vehiclesResult.data : [];

  // Hanya unit yang belum memiliki catatan penjualan & belum lunas
  const availableVehicles = allVehicles
    .filter((v) => !v.sale && v.status !== "SOLD_SETTLED")
    .map((v) => ({
      id: v.id,
      plateNumber: v.plateNumber,
      brand: v.brand,
      model: v.model,
      year: v.year,
      targetSellingPrice: v.targetSellingPrice,
      minSellingPrice: v.minSellingPrice,
      totalHpp: v.totalHpp,
      status: v.status,
    }));

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Penjualan & Tagihan"
        subtitle="Catat unit laku, pantau sisa tagihan tempo, terima pelunasan, dan cetak kuitansi."
      />

      <main className="flex-1">
        <SalesClient
          initialSales={sales as any}
          availableVehicles={availableVehicles}
        />
      </main>
    </div>
  );
}
