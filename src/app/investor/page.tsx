import prisma from "@/lib/prisma";
import { InvestorClient } from "@/components/investor/InvestorClient";
import Decimal from "decimal.js";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Portal Investor | Nur Mobil",
  description: "Portal transparansi portofolio modal dan pembagian laba investor Nur Mobil.",
};

export default async function InvestorPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id: paramInvestorId } = await searchParams;

  // Ambil semua investor untuk dropdown switch demo/audit
  const allInvestors = await prisma.investor.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Tentukan investor aktif: dari parameter URL atau default investor pertama
  const targetId = paramInvestorId || allInvestors[0]?.id;

  let investorData = null;

  if (targetId) {
    const inv = await prisma.investor.findUnique({
      where: { id: targetId },
      include: {
        investments: {
          include: {
            vehicle: true,
          },
        },
        ledgerEntries: {
          orderBy: { createdAt: "desc" },
          take: 30,
        },
        distributions: {
          include: {
            sale: {
              include: {
                vehicle: true,
              },
            },
          },
          orderBy: { calculatedAt: "desc" },
        },
      },
    });

    if (inv) {
      const latestLedger = inv.ledgerEntries[0];
      const currentBalance = latestLedger ? Number(latestLedger.runningBalance) : 0;

      // Hitung modal yang saat ini aktif di mobil (status != SOLD_SETTLED)
      const activeAllocatedCapital = inv.investments
        .filter((item) => item.vehicle.status !== "SOLD_SETTLED")
        .reduce((sum, item) => sum + Number(item.capitalShare), 0);

      // Hitung total profit yang diterima
      const totalProfitReceived = inv.distributions.reduce(
        (sum, item) => sum + Number(item.calculatedAmount),
        0
      );

      investorData = {
        id: inv.id,
        name: inv.name,
        phone: inv.phone,
        type: inv.type,
        currentBalance,
        activeAllocatedCapital,
        totalProfitReceived,
        investments: inv.investments.map((item) => ({
          id: item.id,
          vehiclePlate: item.vehicle.plateNumber,
          vehicleName: `${item.vehicle.brand} ${item.vehicle.model}`,
          vehicleYear: item.vehicle.year,
          vehicleStatus: item.vehicle.status,
          capitalShare: Number(item.capitalShare),
          profitSharePercent: Number(item.profitSharePercent),
        })),
        ledgerEntries: inv.ledgerEntries.map((e) => ({
          id: e.id,
          type: e.type,
          amount: Number(e.amount),
          runningBalance: Number(e.runningBalance),
          notes: e.notes,
          createdAt: e.createdAt,
        })),
        distributions: inv.distributions.map((d) => ({
          id: d.id,
          vehiclePlate: d.sale.vehicle.plateNumber,
          vehicleName: `${d.sale.vehicle.brand} ${d.sale.vehicle.model}`,
          calculatedAmount: Number(d.calculatedAmount),
          isPaid: d.isPaid,
          calculatedAt: d.calculatedAt,
          notes: d.notes,
        })),
      };
    }
  }

  return (
    <InvestorClient
      investor={investorData}
      allInvestors={allInvestors}
    />
  );
}
