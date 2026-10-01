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

  // Kendaraan yang siap dijual (READY_FOR_SALE atau BOOKED)
  const availableVehicles = allVehicles
    .filter((v) => v.status === "READY_FOR_SALE" || v.status === "BOOKED" || v.status === "INTAKE")
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
        title="Penjualan & Buku Piutang"
        subtitle="Pencatatan transaksi jual (retail & showroom tempo), mutasi pembayaran bertahap, kuitansi PDF resmi, dan tukar tambah."
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
