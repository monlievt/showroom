import React from "react";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SaleDetailClient } from "@/components/admin/SaleDetailClient";
import { getSaleByIdAction } from "@/app/actions/sale";
import { normalizePlateNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminSaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getSaleByIdAction(id);

  if (!res.success || !res.data) {
    notFound();
  }

  const sale = res.data;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title={`Detail Penjualan ${normalizePlateNumber(sale.vehicle.plateNumber)}`}
        subtitle={`Pembeli: ${sale.buyer.name}. Ubah data transaksi, cetak kuitansi, atau batalkan jika diperlukan.`}
      />
      <main className="flex-1">
        <SaleDetailClient sale={sale as any} />
      </main>
    </div>
  );
}
