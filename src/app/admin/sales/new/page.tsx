import React from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SaleNewClient } from "@/components/admin/SaleNewClient";
import { getVehiclesAction } from "@/app/actions/vehicle";

export const metadata = {
  title: "Input Penjualan Unit Baru | Nur Mobil Admin",
  description: "Form pencatatan penjualan unit mobil showroom dan penerbitan SPK/Kuitansi.",
};

export const dynamic = "force-dynamic";

export default async function AdminNewSalePage() {
  const vehiclesResult = await getVehiclesAction();
  const allVehicles =
    vehiclesResult.success && vehiclesResult.data ? vehiclesResult.data : [];

  const availableVehicles = allVehicles
    .filter(
      (v) =>
        v.status === "READY_FOR_SALE" ||
        v.status === "BOOKED" ||
        v.status === "INTAKE"
    )
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
        title="Input Penjualan Unit Baru"
        subtitle="Catat penjualan ke konsumen langsung atau showroom rekanan dengan sistem tempo pelunasan."
      />
      <main className="flex-1">
        <SaleNewClient availableVehicles={availableVehicles} />
      </main>
    </div>
  );
}
