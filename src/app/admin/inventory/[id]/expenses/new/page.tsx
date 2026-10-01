import React from "react";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { VehicleExpenseNewClient } from "@/components/admin/VehicleExpenseNewClient";
import { getVehicleByIdAction } from "@/app/actions/vehicle";

export const metadata = {
  title: "Catat Biaya Unit & HPP | Nur Mobil Admin",
  description: "Form pencatatan pengeluaran perbaikan/servis unit kendaraan.",
};

export default async function NewVehicleExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getVehicleByIdAction(id);

  if (!res.success || !res.data) {
    notFound();
  }

  const v = res.data;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title={`Catat Biaya Unit — ${v.brand} ${v.model} (${v.plateNumber})`}
        subtitle="Setiap nota bengkel dan perbaikan langsung diakumulasi ke HPP unit."
      />
      <main className="flex-1">
        <VehicleExpenseNewClient
          vehicle={{
            id: v.id,
            plateNumber: v.plateNumber,
            brand: v.brand,
            model: v.model,
            year: v.year,
            purchasePrice: v.purchasePrice,
            totalExpenses: v.totalExpenses,
            totalHpp: v.totalHpp,
            status: v.status,
          }}
        />
      </main>
    </div>
  );
}
