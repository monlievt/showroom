import React from "react";
import prisma from "@/lib/prisma";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { getInvestors } from "@/app/actions/investor";
import { getDistributionsHistory } from "@/app/actions/finance";
import { InvestorAccountsPageClient } from "@/components/admin/InvestorAccountsPageClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Daftar Akun Investor | Nur Mobil Admin",
  description: "Monitoring modal investor, alokasi unit mobil aktif, dan riwayat setoran modal.",
};

export default async function AdminInvestorsAccountsPage() {
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
        title="Daftar Akun Investor & Modal"
        subtitle="Monitoring saldo modal per investor, alokasi modal ke unit aktif, dan pencatatan setoran modal baru."
      />

      <main className="flex-1 p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
        <InvestorAccountsPageClient
          investors={investorsRes.data || []}
          pendingCount={pendingSalesCount}
          totalHistoryCount={distRes.data?.length || 0}
        />
      </main>
    </div>
  );
}
