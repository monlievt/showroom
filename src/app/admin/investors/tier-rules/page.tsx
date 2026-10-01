import React from "react";
import prisma from "@/lib/prisma";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { getInvestors } from "@/app/actions/investor";
import { getDistributionsHistory } from "@/app/actions/finance";
import { getActiveProfitShareRules } from "@/app/actions/profit-share-rule";
import { InvestorTierRulesPageClient } from "@/components/admin/InvestorTierRulesPageClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Aturan Tier 4 Saudara | Nur Mobil Admin",
  description: "Konfigurasi skema pembagian laba berjenjang (tier contiguous) untuk modal Ibu dan 4 Saudara.",
};

export default async function AdminInvestorsTierRulesPage() {
  const [investorsRes, distRes, rulesRes] = await Promise.all([
    getInvestors(),
    getDistributionsHistory(),
    getActiveProfitShareRules(),
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
        title="Aturan Tier Bagi Hasil 4 Saudara"
        subtitle="Skema pembagian keuntungan bertingkat (kontigu) tanpa tumpang tindih untuk pembagian laba keluarga."
      />

      <main className="flex-1 p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
        <InvestorTierRulesPageClient
          profitRules={rulesRes.data || []}
          pendingCount={pendingSalesCount}
          totalInvestorsCount={investorsRes.data?.length || 0}
          totalHistoryCount={distRes.data?.length || 0}
        />
      </main>
    </div>
  );
}
