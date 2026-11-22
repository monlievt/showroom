import React from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SaleNewClient } from "@/components/admin/SaleNewClient";
import { getVehiclesAction } from "@/app/actions/vehicle";
import { getBuyersAction } from "@/app/actions/sale";

export const metadata = {
  title: "Catat Penjualan Unit | Nur Mobil",
  description: "Catat transaksi jual mobil atau motor secara lunas maupun tempo.",
};

export const dynamic = "force-dynamic";

export default async function AdminNewSalePage({
  searchParams,
}: {
  searchParams?: Promise<{ vehicleId?: string }>;
}) {
  const { vehicleId } = (await searchParams) || {};
  const [vehiclesResult, buyersResult] = await Promise.all([
    getVehiclesAction(),
    getBuyersAction(),
  ]);

  const allVehicles =
    vehiclesResult.success && vehiclesResult.data ? vehiclesResult.data : [];
  const savedBuyers =
    buyersResult.success && buyersResult.data ? buyersResult.data : [];

  // Cek apakah vehicleId yang dipilih di URL ternyata sudah punya transaksi penjualan aktif
  const requestedVehicle = vehicleId
    ? allVehicles.find((v) => v.id === vehicleId)
    : undefined;
  const alreadySoldInfo =
    requestedVehicle && requestedVehicle.sale
      ? {
          saleId: requestedVehicle.sale.id,
          plateNumber: requestedVehicle.plateNumber,
          brand: requestedVehicle.brand,
          model: requestedVehicle.model,
          year: requestedVehicle.year,
          isFullyPaid: requestedVehicle.isFullyPaid,
        }
      : null;

  // Hanya tampilkan unit yang BELUM memiliki catatan penjualan dan belum lunas
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
        title="Catat Penjualan Unit"
        subtitle="Isi data unit, pembeli, dan harga deal. Berkas tambahan bisa dilengkapi nanti."
      />
      <main className="flex-1">
        <SaleNewClient
          availableVehicles={availableVehicles}
          savedBuyers={savedBuyers}
          initialVehicleId={vehicleId}
          alreadySoldInfo={alreadySoldInfo}
        />
      </main>
    </div>
  );
}
