import React from "react";
import prisma from "@/lib/prisma";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { getFinanceSummary, getDistributionsHistory } from "@/app/actions/finance";
import { getInvestors } from "@/app/actions/investor";
import { InvestorPendingPageClient } from "@/components/admin/InvestorPendingPageClient";
import { calculateHpp, calculateGrossProfit } from "@/lib/calculations/hpp";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Unit Siap Bagi Hasil | Nur Mobil Admin",
  description: "Daftar mobil lunas yang siap dihitung dan dieksekusi bagi hasilnya untuk investor dan owner.",
};

export default async function AdminInvestorsPendingPage() {
  const [summaryRes, investorsRes, distRes] = await Promise.all([
    getFinanceSummary(),
    getInvestors(),
    getDistributionsHistory(),
  ]);

  // Cari sales yang sudah lunas 100% tapi belum dieksekusi bagi hasilnya
  const allSales = await prisma.sale.findMany({
    include: {
      payments: true,
      distributions: true,
      buyer: true,
      vehicle: {
        include: {
          expenses: true,
        },
      },
    },
    orderBy: { saleDate: "desc" },
  });

  const pendingSales = allSales
    .filter((s) => {
      const paid = s.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const isLunas = paid >= Number(s.sellingPrice);
      const hasActiveDist =
        s.distributions.length > 0 &&
        s.distributions.some((d) => !d.notes?.includes("[REVERSED]"));
      return isLunas && !hasActiveDist;
    })
    .map((s) => {
      const paid = s.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const hpp = calculateHpp(
        s.vehicle.purchasePrice,
        s.vehicle.expenses.map((e) => ({ amount: e.amount }))
      );
      const grossProfit = calculateGrossProfit(s.sellingPrice, hpp);

      return {
        id: s.id,
        vehicleId: s.vehicleId,
        vehiclePlate: s.vehicle.plateNumber,
        vehicleName: `${s.vehicle.brand} ${s.vehicle.model}`,
        sellingPrice: Number(s.sellingPrice),
        paidAmount: paid,
        hpp: hpp.toNumber(),
        grossProfit: grossProfit.toNumber(),
        buyerName: s.buyer.name,
      };
    });

  const summary = {
    activeAllocatedCapital: summaryRes.data?.activeAllocatedCapital || 0,
    totalProfitPaid: summaryRes.data?.totalProfitPaid || 0,
    totalOwnerProfit: summaryRes.data?.totalOwnerProfit || 0,
    totalInvestorProfit: summaryRes.data?.totalInvestorProfit || 0,
    pendingDistributionsCount: pendingSales.length,
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Unit Siap Bagi Hasil"
        subtitle="Daftar mobil terjual lunas 100% yang siap dieksekusi pembagian labanya secara deterministik."
      />

      <main className="flex-1 p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
        <InvestorPendingPageClient
          summary={summary}
          pendingSales={pendingSales}
          totalInvestorsCount={investorsRes.data?.length || 0}
          totalHistoryCount={distRes.data?.length || 0}
        />
      </main>
    </div>
  );
}
