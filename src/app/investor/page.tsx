import prisma from "@/lib/prisma";
import { InvestorClient } from "@/components/investor/InvestorClient";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

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
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { id: paramInvestorId } = await searchParams;
  const canSwitchInvestor = session.role === "OWNER" || session.role === "ADMIN";

  let allInvestors: Array<{ id: string; name: string }> = [];
  let targetId: string | undefined;

  if (canSwitchInvestor) {
    allInvestors = await prisma.investor.findMany({
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    });
    targetId = paramInvestorId || allInvestors[0]?.id;
  } else {
    // Role INVESTOR / non-admin terkunci hanya pada investorId miliknya sendiri
    const profile = await prisma.userProfile.findUnique({
      where: { id: session.userId },
      select: { investorId: true },
    });
    targetId = profile?.investorId ?? undefined;
  }

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

      // Hitung total profit yang diterima (abaikan entri yang di-reverse)
      const activeDistributions = inv.distributions.filter(
        (d) => !d.notes?.includes("[REVERSED]")
      );
      const totalProfitReceived = activeDistributions.reduce(
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
