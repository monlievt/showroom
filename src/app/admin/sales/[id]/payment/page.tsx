import React from "react";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SalePaymentNewClient } from "@/components/admin/SalePaymentNewClient";
import { getSaleByIdAction } from "@/app/actions/sale";
import { getVehiclesAction } from "@/app/actions/vehicle";

export const metadata = {
  title: "Catat Pembayaran Masuk | Nur Mobil Admin",
  description: "Form pencatatan pembayaran tempo atau pelunasan penjualan unit kendaraan.",
};

export default async function AdminSalePaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [saleRes, vehiclesRes] = await Promise.all([
    getSaleByIdAction(id),
    getVehiclesAction(),
  ]);

  if (!saleRes.success || !saleRes.data) {
    notFound();
  }

  const allVehicles =
    vehiclesRes.success && vehiclesRes.data ? vehiclesRes.data : [];

  const availableVehicles = allVehicles.map((v) => ({
    id: v.id,
    plateNumber: v.plateNumber,
    brand: v.brand,
    model: v.model,
    year: v.year,
  }));

  const sale = saleRes.data;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title={`Catat Pembayaran — ${sale.vehicle.brand} ${sale.vehicle.model} (${sale.vehicle.plateNumber})`}
        subtitle={`Pembeli: ${sale.buyer.name} • Sisa Piutang Berjalan.`}
      />
      <main className="flex-1">
        <SalePaymentNewClient
          sale={sale as any}
          availableVehicles={availableVehicles}
        />
      </main>
    </div>
  );
}
