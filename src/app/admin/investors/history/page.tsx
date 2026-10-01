import React from "react";
import prisma from "@/lib/prisma";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { getInvestors } from "@/app/actions/investor";
import { getDistributionsHistory } from "@/app/actions/finance";
import { InvestorHistoryPageClient } from "@/components/admin/InvestorHistoryPageClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Riwayat Distribusi Laba | Nur Mobil Admin",
  description: "Daftar riwayat pembagian laba yang telah dieksekusi secara deterministik ke investor dan owner.",
};

export default async function AdminInvestorsHistoryPage() {
  const [investorsRes, distRes] = await Promise.all([
    getInvestors(),
    getDistributionsHistory(),
  ]);

  // Hitung jumlah pending sales untuk badge subnav
  const allSales = await prisma.sale.findMany({
    include: {
      payments: true,
      distributions: true,
    },
  });

  const pendingSalesCount = allSales.filter((s) => {
    const paid = s.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const isLunas = paid >= Number(s.sellingPrice);
    const hasActiveDist =
      s.distributions.length > 0 &&
      s.distributions.some((d) => !d.notes?.includes("[REVERSED]"));
    return isLunas && !hasActiveDist;
  }).length;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Riwayat Distribusi Laba Penjualan"
        subtitle="Snapshot pembagian laba historis berdasarkan aturan tier, audit mutasi ledger, dan fasilitas reversal."
      />

      <main className="flex-1 p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
        <InvestorHistoryPageClient
          distributions={distRes.data || []}
          pendingCount={pendingSalesCount}
          totalInvestorsCount={investorsRes.data?.length || 0}
        />
      </main>
    </div>
  );
}
