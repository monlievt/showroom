import React from "react";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SalePaymentNewClient } from "@/components/admin/SalePaymentNewClient";
import { getSaleByIdAction } from "@/app/actions/sale";
import { getVehiclesAction } from "@/app/actions/vehicle";
import { normalizePlateNumber, formatVehicleTitle } from "@/lib/utils";

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
        title={`Terima Bayar ${normalizePlateNumber(sale.vehicle.plateNumber)}`}
        subtitle={`${formatVehicleTitle(sale.vehicle.brand, sale.vehicle.model, sale.vehicle.year)} • Pembeli: ${sale.buyer.name}`}
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
