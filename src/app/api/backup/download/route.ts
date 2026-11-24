import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();

    // Hanya role OWNER dan ADMIN yang berhak mengunduh snapshot data sensitif
    if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
      return new NextResponse(
        JSON.stringify({ error: "Akses ditolak: Hanya Owner yang berhak mengunduh backup data." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Ambil seluruh data operasional showroom (kecualikan API key rahasia dari export JSON)
    const [
      vehicles,
      sales,
      salePayments,
      expenses,
      buyers,
      investors,
      vehicleInvestments,
      capitalLedgers,
      profitShareRules,
      profitDistributions,
      cashTransactions,
      operationalExpenses,
      showroomAssets,
      inspections,
      workshopSupplies,
      workshopSupplyUsages,
      historicalSales,
      auditLogs,
      systemSettings,
    ] = await Promise.all([
      prisma.vehicle.findMany({ include: { expenses: true, photos: true, documents: true } }),
      prisma.sale.findMany({ include: { payments: true } }),
      prisma.salePayment.findMany(),
      prisma.expense.findMany(),
      prisma.buyer.findMany(),
      prisma.investor.findMany({ include: { ledgerEntries: true } }),
      prisma.vehicleInvestment.findMany(),
      prisma.capitalLedger.findMany(),
      prisma.profitShareRule.findMany(),
      prisma.profitDistribution.findMany(),
      prisma.cashTransaction.findMany(),
      prisma.operationalExpense.findMany(),
      prisma.showroomAsset.findMany(),
      prisma.inspection.findMany({ include: { panels: true } }),
      prisma.workshopSupply.findMany(),
      prisma.workshopSupplyUsage.findMany(),
      prisma.historicalSale.findMany(),
      prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
      prisma.systemSetting.findMany({ where: { isSecret: false } }),
    ]);

    const backupPayload = {
      meta: {
        appName: "Nur Mobil Showroom App",
        exportDate: new Date().toISOString(),
        exportedBy: session.fullName,
        version: "2.6.0-production",
        secretsExcluded: true,
        totalVehicles: vehicles.length,
        totalSales: sales.length,
        totalTransactions: cashTransactions.length,
        totalHistoricalSales: historicalSales.length,
      },
      data: {
        vehicles,
        sales,
        salePayments,
        expenses,
        buyers,
        investors,
        vehicleInvestments,
        capitalLedgers,
        profitShareRules,
        profitDistributions,
        cashTransactions,
        operationalExpenses,
        showroomAssets,
        inspections,
        workshopSupplies,
        workshopSupplyUsages,
        historicalSales,
        auditLogs,
        systemSettings,
      },
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `nur_mobil_data_snapshot_${timestamp}.json`;

    return new NextResponse(JSON.stringify(backupPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating instant database backup:", error);
    return new NextResponse(
      JSON.stringify({ error: error.message || "Gagal menghasilkan file cadangan data." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
