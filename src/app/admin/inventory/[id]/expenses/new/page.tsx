import React from "react";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { VehicleExpenseNewClient } from "@/components/admin/VehicleExpenseNewClient";
import { getVehicleByIdAction } from "@/app/actions/vehicle";
import { getExpensesByVehicleIdAction } from "@/app/actions/expense";

export const metadata = {
  title: "Kelola Biaya & Servis Unit | Nur Mobil Admin",
  description: "Daftar riwayat, pencatatan, dan edit pengeluaran perbaikan/servis unit kendaraan.",
};

export default async function NewVehicleExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [res, expensesRes] = await Promise.all([
    getVehicleByIdAction(id),
    getExpensesByVehicleIdAction(id),
  ]);

  if (!res.success || !res.data) {
    notFound();
  }

  const v = res.data;
  const initialExpenses = expensesRes.success && expensesRes.data ? expensesRes.data : [];
  const initialLocked = Boolean(expensesRes.isLocked);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title={`Biaya & Servis Unit — ${v.brand} ${v.model} (${v.plateNumber})`}
        subtitle="Lihat riwayat pengeluaran, edit rincian biaya, atau catat nota bengkel baru."
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
          initialExpenses={initialExpenses}
          initialLocked={initialLocked}
        />
      </main>
    </div>
  );
}
