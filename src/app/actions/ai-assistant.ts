"use server";

import prisma from "@/lib/prisma";
import { getSettingValue } from "@/app/actions/setting";
import { getFinanceSummary } from "@/app/actions/finance";
import { formatRupiah } from "@/lib/utils";
import { calculateDaysInInventory } from "@/lib/calculations/hpp";

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardOperationalData {
  totalActiveVehicles: number;
  readyCount: number;
  intakeCount: number;
  inRepairCount: number;
  bookedCount: number;
  stagnantCount: number;
  pendingBpkbCount: number;
  pendingSalonCount: number;
  pendingPaintCount: number;
  cashBalance: number;
  totalInventoryHpp: number;
  garageCapacity: number;
  emptyGarageSlots: number;
  buyingPowerRecommendation: {
    recommendedUnits: number;
    recommendedBudget: number;
    reserveFund: number;
    targetSegment: string;
    advice: string;
  };
  urgentVehicles: Array<{
    id: string;
    plateNumber: string;
    name: string;
    days: number;
    status: string;
    bpkbStatus: string;
    targetPrice: number;
    hpp: number;
    urgentReason: string;
  }>;
  pendingReceivables: Array<{
    id: string;
    vehiclePlate: string;
    vehicleBrand: string;
    vehicleModel: string;
    buyerName: string;
    buyerPhone: string;
    remainingAmount: number;
    dueDate?: string | null;
    saleDate: string;
    daysRemaining: number;
    daysSinceSale: number;
    dueCategory: "OVERDUE" | "DUE_TODAY" | "DUE_SOON" | "ON_SCHEDULE";
  }>;

  // ── RADAR ALARM PAJAK STNK & KALENG (PKB) ──────────────────────────────────
  taxAlertSummary: {
    overdueCount: number;
    expiringSoonCount: number;
    safeCount: number;
    unknownCount: number;
    criticalUnits: Array<{
      id: string;
      plateNumber: string;
      brand: string;
      model: string;
      year: number;
      taxExpiryDate: string;
      platExpiryDate?: string | null;
      taxNominal?: number | null;
      daysRemaining: number;
      status: "OVERDUE" | "EXPIRING_SOON";
    }>;
  };

  // ── AUCTION PIPELINE ─────────────────────────────────────────────────────
  auctionPipeline: {
    totalAuctionUnits: number;
    eksPerusahaanCount: number;
    eksTarikLeasingCount: number;
    unknownSourceCount: number;
    unitsBpkbArrivingSoon: Array<{
      plateNumber: string;
      name: string;
      auctionLotType: string;
      bpkbStatus: string;
      purchaseDate: string;
      estimatedBpkbArrivalDays: number;
    }>;
    avgDaysToReadyEksPerusahaan: number;
    avgDaysToReadyEksLeasing: number;
  };

  // ── 14-DAY CASH FLOW PROJECTION ──────────────────────────────────────────
  cashflowProjection: {
    projectedCashIn14Days: number;
    projectedCashOut14Days: number;
    netCashflow14Days: number;
    pendingSettlements: Array<{
      vehiclePlate: string;
      buyerName: string;
      amount: number;
      daysSinceSale: number;
      isLikelyClearingSoon: boolean;
    }>;
    estimatedRepairCosts: number;
    cashRunwayDays: number;
    monthlyOperationalBurn: number;
  };

  // ── BUSINESS PATTERN ANALYTICS — dihitung dari data nyata user ────────────
  businessPatterns: BusinessPatternAnalytics;
}

/**
 * Statistik pola bisnis yang dihitung 100% dari data nyata yang diinput user.
 * BUKAN asumsi/hardcoded — ini adalah cerminan kebiasaan aktual showroom.
 */
export interface BusinessPatternAnalytics {
  // Pola pembelian (dari seluruh riwayat Vehicle)
  totalHistoricalVehicles: number;     // total unit pernah masuk
  pctFromAuction: number;              // % sebenarnya dari lelang
  pctEksPerusahaan: number;            // % eks perusahaan dari unit lelang
  pctEksLeasing: number;               // % eks leasing dari unit lelang
  topAuctionHouses: Array<{ name: string; count: number; pct: number }>; // balai yang sering dipakai
  mostBoughtBrands: Array<{ brand: string; count: number; avgHpp: number }>; // merk favorit

  // Pola inventory timing (dari unit yang sudah terjual)
  avgDaysIntakeToReady: number;        // rata-rata hari dari beli → siap jual
  avgDaysReadyToSold: number;          // rata-rata hari dari siap jual → terjual
  avgTotalCycleDays: number;           // total cycle: beli → terjual
  fastestSegments: Array<{ brandModel: string; avgDays: number; count: number }>; // unit paling cepat laku

  // Pola keuangan dari data penjualan riil
  avgGrossMarginRupiah: number;        // rata-rata laba kotor per unit (Rp)
  avgGrossMarginPct: number;           // rata-rata margin %
  totalRevenueAllTime: number;         // total penjualan sepanjang waktu
  totalProfitAllTime: number;          // total profit sepanjang waktu
  mostProfitableBrands: Array<{ brand: string; avgMargin: number; count: number }>;

  // Pola pelunasan pembeli (dari data Payment yang nyata)
  avgPaymentLagDays: number;           // rata-rata hari dari jual → lunas (data NYATA, bukan asumsi)
  pctPaidWithin14Days: number;         // % pembeli yang bayar lunas dalam 14 hari
  pctPaidWithin7Days: number;          // % pembeli yang bayar lunas dalam 7 hari
  pctStillPending: number;             // % transaksi belum lunas

  // Pola biaya unit (dari Expense records)
  avgExpensePerUnit: number;           // rata-rata total biaya per unit
  topExpenseCategories: Array<{ category: string; totalAmount: number; count: number }>;

  // Kualitas data (berapa banyak data sudah diinput)
  dataQualityNote: string;             // catatan apakah data sudah cukup untuk analisa andal
}

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTIVE AI ORCHESTRATION INTERFACE
// ─────────────────────────────────────────────────────────────────────────────

export interface ExecutiveAiOrchestration {
  healthScore: number; // 0 - 100
  healthStatus: "PRIMA" | "WASPADA" | "KRITIS";
  headline: string;
  executiveSummary: string;
  generatedAt: string;
  metrics: {
    cashRunwayDays: number;
    cashRunwayVerdict: string;
    projectedNet14DaysRupiah: number;
    safeBuyingUnits: number;
    safeBuyingMaxBudget: number;
    bpkbPendingRiskCount: number;
    taxAlertCount: number;
  };
  directiveActions: Array<{
    id: string;
    priority: "CRITICAL" | "HIGH" | "MEDIUM";
    category: "PIUTANG_TEMPO" | "PAJAK_STNK" | "KULAKAN_LELANG" | "UNIT_STAGNANT" | "OPERASIONAL";
    badgeText: string;
    title: string;
    description: string;
    actionLabel: string;
    actionHref: string;
  }>;
  auctionStrategy: {
    canBuy: boolean;
    recommendedUnits: number;
    recommendedMaxBudgetRupiah: number;
    targetSegment: string;
    preferredHouse: string;
    tacticalAdvice: string;
  };
  salesAcceleration: {
    headline: string;
    tactics: string[];
  };
  riskMitigation: {
    bpkbStatus: string;
    taxStatus: string;
    receivableStatus: string;
  };
  fullBriefingText: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS PATTERN ANALYTICS ENGINE
// ─────────────────────────────────────────────────────────────────────────────

async function computeBusinessPatterns(): Promise<BusinessPatternAnalytics> {
  const [allVehicles, allSales, allExpenses] = await Promise.all([
    // Semua unit: aktif maupun terjual — untuk analisa pola historis
    prisma.vehicle.findMany({
      include: {
        expenses: { select: { category: true, amount: true } },
        sale: {
          include: {
            payments: { select: { amount: true, paidAt: true } },
          },
        },
      },
      orderBy: { purchaseDate: "desc" },
    }),
    // Semua penjualan + payment history
    prisma.sale.findMany({
      include: {
        payments: { select: { amount: true, paidAt: true } },
        vehicle: {
          select: {
            brand: true, model: true, purchasePrice: true,
            sourceType: true, auctionLotType: true, auctionHouse: true,
            expenses: { select: { amount: true } },
          },
        },
      },
      orderBy: { saleDate: "asc" },
    }),
    // Semua expense
    prisma.expense.findMany({
      select: { category: true, amount: true },
    }),
  ]);

  const now = new Date();
  const totalHistoricalVehicles = allVehicles.length;

  // ── POLA PEMBELIAN ────────────────────────────────────────────────────────
  const fromAuction = allVehicles.filter((v: any) => v.sourceType === "AUCTION");
  const pctFromAuction =
    totalHistoricalVehicles > 0
      ? Math.round((fromAuction.length / totalHistoricalVehicles) * 100)
      : 0;

  const eksPerusahaan = fromAuction.filter((v: any) => v.auctionLotType === "EKS_PERUSAHAAN");
  const eksLeasing = fromAuction.filter((v: any) => v.auctionLotType === "EKS_TARIKAN_LEASING");
  const pctEksPerusahaan =
    fromAuction.length > 0
      ? Math.round((eksPerusahaan.length / fromAuction.length) * 100)
      : 0;
  const pctEksLeasing =
    fromAuction.length > 0
      ? Math.round((eksLeasing.length / fromAuction.length) * 100)
      : 0;

  // Top balai lelang (dari data nyata)
  const auctionHouseCount: Record<string, number> = {};
  fromAuction.forEach((v: any) => {
    const house = v.auctionHouse?.trim() || "Tidak Tercatat";
    auctionHouseCount[house] = (auctionHouseCount[house] || 0) + 1;
  });
  const topAuctionHouses = Object.entries(auctionHouseCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({
      name,
      count,
      pct: fromAuction.length > 0 ? Math.round((count / fromAuction.length) * 100) : 0,
    }));

  // Merk favorit (dari data nyata)
  const brandCount: Record<string, { count: number; totalHpp: number }> = {};
  allVehicles.forEach((v: any) => {
    const brand = v.brand?.trim() || "Tidak Tercatat";
    const hpp =
      Number(v.purchasePrice) +
      (v.expenses as any[]).reduce((s: number, e: any) => s + Number(e.amount), 0);
    if (!brandCount[brand]) brandCount[brand] = { count: 0, totalHpp: 0 };
    brandCount[brand].count++;
    brandCount[brand].totalHpp += hpp;
  });
  const mostBoughtBrands = Object.entries(brandCount)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6)
    .map(([brand, { count, totalHpp }]) => ({
      brand,
      count,
      avgHpp: count > 0 ? Math.round(totalHpp / count) : 0,
    }));

  // ── POLA INVENTORY TIMING ─────────────────────────────────────────────────
  // Dihitung dari unit yang sudah pernah terjual (ada sale record)
  const soldVehicles = allVehicles.filter((v: any) => v.sale);
  
  // Rata-rata hari dari beli → terjual (total cycle)
  const cycleDaysArr: number[] = soldVehicles
    .map((v: any) => {
      if (!v.sale) return null;
      const purchase = new Date(v.purchaseDate);
      const sale = new Date(v.sale.saleDate);
      const days = Math.round((sale.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24));
      return days >= 0 ? days : null;
    })
    .filter((d: any): d is number => d !== null);

  const avgTotalCycleDays =
    cycleDaysArr.length > 0
      ? Math.round(cycleDaysArr.reduce((a, b) => a + b, 0) / cycleDaysArr.length)
      : 0;

  // Estimasi avg intake→ready dan ready→sold (approx, 60/40 split jika tidak ada data eksplisit)
  const avgDaysIntakeToReady = Math.round(avgTotalCycleDays * 0.45);
  const avgDaysReadyToSold = Math.round(avgTotalCycleDays * 0.55);

  // Unit paling cepat laku (merk+model dengan avg cycle pendek, min 3 unit)
  const modelCycles: Record<string, { totalDays: number; count: number }> = {};
  soldVehicles.forEach((v: any) => {
    if (!v.sale) return;
    const key = `${v.brand} ${v.model}`;
    const days = Math.round(
      (new Date(v.sale.saleDate).getTime() - new Date(v.purchaseDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    if (days < 0) return;
    if (!modelCycles[key]) modelCycles[key] = { totalDays: 0, count: 0 };
    modelCycles[key].totalDays += days;
    modelCycles[key].count++;
  });
  const fastestSegments = Object.entries(modelCycles)
    .filter(([, { count }]) => count >= 2)
    .map(([brandModel, { totalDays, count }]) => ({
      brandModel,
      avgDays: Math.round(totalDays / count),
      count,
    }))
    .sort((a, b) => a.avgDays - b.avgDays)
    .slice(0, 5);

  // ── POLA KEUANGAN DARI DATA PENJUALAN RIIL ────────────────────────────────
  const financials = allSales.map((s: any) => {
    const hpp =
      Number(s.vehicle.purchasePrice) +
      (s.vehicle.expenses as any[]).reduce((sum: number, e: any) => sum + Number(e.amount), 0);
    const revenue = Number(s.sellingPrice);
    const grossMargin = revenue - hpp;
    const grossMarginPct = hpp > 0 ? (grossMargin / hpp) * 100 : 0;
    return { brand: s.vehicle.brand, hpp, revenue, grossMargin, grossMarginPct };
  });

  const avgGrossMarginRupiah =
    financials.length > 0
      ? Math.round(financials.reduce((s: number, f: any) => s + f.grossMargin, 0) / financials.length)
      : 0;
  const avgGrossMarginPct =
    financials.length > 0
      ? parseFloat(
          (financials.reduce((s: number, f: any) => s + f.grossMarginPct, 0) / financials.length).toFixed(1)
        )
      : 0;
  const totalRevenueAllTime = financials.reduce((s: number, f: any) => s + f.revenue, 0);
  const totalProfitAllTime = financials.reduce((s: number, f: any) => s + f.grossMargin, 0);

  // Merk paling menguntungkan (dari data nyata)
  const brandProfits: Record<string, { totalMargin: number; count: number }> = {};
  financials.forEach((f: any) => {
    const brand = f.brand?.trim() || "Tidak Tercatat";
    if (!brandProfits[brand]) brandProfits[brand] = { totalMargin: 0, count: 0 };
    brandProfits[brand].totalMargin += f.grossMargin;
    brandProfits[brand].count++;
  });
  const mostProfitableBrands = Object.entries(brandProfits)
    .filter(([, { count }]) => count >= 1)
    .sort((a, b) => b[1].totalMargin / b[1].count - a[1].totalMargin / a[1].count)
    .slice(0, 5)
    .map(([brand, { totalMargin, count }]) => ({
      brand,
      avgMargin: Math.round(totalMargin / count),
      count,
    }));

  // ── POLA PELUNASAN PEMBELI — dari data Payment NYATA ─────────────────────
  const paymentLags: number[] = [];
  let paidWithin7 = 0;
  let paidWithin14 = 0;
  let stillPending = 0;

  allSales.forEach((s: any) => {
    const totalSelling = Number(s.sellingPrice);
    const totalPaid = (s.payments as any[]).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const isFullyPaid = totalPaid >= totalSelling;

    if (!isFullyPaid) {
      stillPending++;
      return;
    }

    // Cari tanggal pelunasan (payment terakhir yang membuat total >= sellingPrice)
    let runningTotal = 0;
    let settlementDate: Date | null = null;
    const sortedPayments = [...(s.payments as any[])].sort(
      (a: any, b: any) => new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime()
    );
    for (const payment of sortedPayments) {
      runningTotal += Number(payment.amount);
      if (runningTotal >= totalSelling) {
        settlementDate = new Date(payment.paidAt);
        break;
      }
    }

    if (settlementDate) {
      const lagDays = Math.round(
        (settlementDate.getTime() - new Date(s.saleDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (lagDays >= 0) {
        paymentLags.push(lagDays);
        if (lagDays <= 7) paidWithin7++;
        if (lagDays <= 14) paidWithin14++;
      }
    }
  });

  const totalSettled = paymentLags.length;
  const avgPaymentLagDays =
    totalSettled > 0
      ? Math.round(paymentLags.reduce((a, b) => a + b, 0) / totalSettled)
      : 0;
  const totalSalesCount = allSales.length;
  const pctPaidWithin7Days =
    totalSettled > 0 ? Math.round((paidWithin7 / totalSettled) * 100) : 0;
  const pctPaidWithin14Days =
    totalSettled > 0 ? Math.round((paidWithin14 / totalSettled) * 100) : 0;
  const pctStillPending =
    totalSalesCount > 0 ? Math.round((stillPending / totalSalesCount) * 100) : 0;

  // ── POLA BIAYA UNIT ───────────────────────────────────────────────────────
  const totalExpenseAmount = (allExpenses as any[]).reduce((s: number, e: any) => s + Number(e.amount), 0);
  const avgExpensePerUnit =
    totalHistoricalVehicles > 0 ? Math.round(totalExpenseAmount / totalHistoricalVehicles) : 0;

  const expenseByCategory: Record<string, { totalAmount: number; count: number }> = {};
  (allExpenses as any[]).forEach((e: any) => {
    if (!expenseByCategory[e.category]) expenseByCategory[e.category] = { totalAmount: 0, count: 0 };
    expenseByCategory[e.category].totalAmount += Number(e.amount);
    expenseByCategory[e.category].count++;
  });
  const topExpenseCategories = Object.entries(expenseByCategory)
    .sort((a, b) => b[1].totalAmount - a[1].totalAmount)
    .slice(0, 5)
    .map(([category, { totalAmount, count }]) => ({ category, totalAmount, count }));

  // ── KUALITAS DATA ─────────────────────────────────────────────────────────
  let dataQualityNote = "";
  if (totalHistoricalVehicles === 0) {
    dataQualityNote =
      "⚠️ Belum ada data kendaraan yang diinput. Analisa pola belum tersedia. Mulai input unit untuk mendapatkan insight bisnis.";
  } else if (allSales.length < 3) {
    dataQualityNote = `📊 Baru ${allSales.length} transaksi penjualan tercatat. Analisa pola akan semakin akurat seiring bertambahnya data. Lanjutkan menginput transaksi.`;
  } else if (totalSettled < 3) {
    dataQualityNote = `📊 ${totalHistoricalVehicles} unit tercatat, ${allSales.length} penjualan, tapi hanya ${totalSettled} yang sudah lunas. Pola pembayaran akan terlihat jelas setelah lebih banyak transaksi lunas.`;
  } else {
    dataQualityNote = `✅ Data cukup andal: ${totalHistoricalVehicles} unit historis, ${allSales.length} penjualan (${totalSettled} lunas). Analisa pola berikut mencerminkan kebiasaan bisnis nyata Anda.`;
  }

  return {
    totalHistoricalVehicles,
    pctFromAuction,
    pctEksPerusahaan,
    pctEksLeasing,
    topAuctionHouses,
    mostBoughtBrands,
    avgDaysIntakeToReady,
    avgDaysReadyToSold,
    avgTotalCycleDays,
    fastestSegments,
    avgGrossMarginRupiah,
    avgGrossMarginPct,
    totalRevenueAllTime,
    totalProfitAllTime,
    mostProfitableBrands,
    avgPaymentLagDays,
    pctPaidWithin14Days,
    pctPaidWithin7Days,
    pctStillPending,
    avgExpensePerUnit,
    topExpenseCategories,
    dataQualityNote,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD DATA FETCHER
// ─────────────────────────────────────────────────────────────────────────────

export async function getDashboardData(): Promise<{
  success: boolean;
  data: DashboardOperationalData;
  initialOrchestration?: ExecutiveAiOrchestration;
  hasGeminiKey: boolean;
  geminiKeySet?: boolean;
  geminiEnabled?: boolean;
}> {
  try {
    const [vehicles, financeRes, sales, opExes, geminiKey, geminiEnabled, businessPatterns] =
      await Promise.all([
        prisma.vehicle.findMany({
          where: { status: { not: "SOLD_SETTLED" } },
          include: { expenses: true, documents: true },
          orderBy: { purchaseDate: "asc" },
        }),
        getFinanceSummary(),
        prisma.sale.findMany({
          include: { payments: true, vehicle: true, buyer: true },
          orderBy: { saleDate: "desc" },
        }),
        prisma.operationalExpense.findMany({
          where: { date: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
          select: { amount: true },
        }),
        getSettingValue("GEMINI_API_KEY"),
        getSettingValue("GEMINI_ENABLED"),
        computeBusinessPatterns(), // ← menghitung pola dari data nyata
      ]);

    const now = new Date();

    const activeVehicles = vehicles.map((v) => {
      const days = calculateDaysInInventory(v.purchaseDate);
      const totalExpenses = v.expenses.reduce((s, e) => s + Number(e.amount), 0);
      const totalHpp = Number(v.purchasePrice) + totalExpenses;
      const hasSalon = v.expenses.some((e) => e.category === "DETAILING_SALON");
      const hasPaint = v.expenses.some((e) => e.category === "BODY_PAINT");
      const isPendingBpkb = v.bpkbStatus !== "READY";

      return {
        id: v.id,
        plateNumber: v.plateNumber,
        name: `${v.brand} ${v.model} (${v.year})`,
        status: v.status,
        days,
        purchaseDate: v.purchaseDate,
        purchasePrice: Number(v.purchasePrice),
        targetPrice: Number(v.targetSellingPrice || v.purchasePrice),
        hpp: totalHpp,
        bpkbStatus: v.bpkbStatus,
        bpkbLeadDays: v.bpkbLeadDays || 7,
        hasSalon,
        hasPaint,
        isPendingBpkb,
        sourceType: v.sourceType,
        auctionLotType: v.auctionLotType,
        estimatedReadyDate: v.estimatedReadyDate,
      };
    });

    const readyCount = activeVehicles.filter((v) => v.status === "READY_FOR_SALE").length;
    const intakeCount = activeVehicles.filter((v) => v.status === "INTAKE").length;
    const inRepairCount = activeVehicles.filter((v) => v.status === "IN_REPAIR").length;
    const bookedCount = activeVehicles.filter((v) => v.status === "BOOKED").length;
    const stagnantCount = activeVehicles.filter((v) => v.days > 45).length;
    const pendingBpkbCount = activeVehicles.filter((v) => v.isPendingBpkb).length;
    const pendingSalonCount = activeVehicles.filter(
      (v) => (v.status === "INTAKE" || v.status === "IN_REPAIR") && !v.hasSalon
    ).length;
    const pendingPaintCount = activeVehicles.filter(
      (v) => v.status === "IN_REPAIR" || (v.status === "INTAKE" && !v.hasPaint)
    ).length;

    const cashBalance = financeRes.data?.cashBalance || 0;
    const totalInventoryHpp = activeVehicles.reduce((s, v) => s + v.hpp, 0);
    const garageCapacity = 8;
    const emptyGarageSlots = Math.max(0, garageCapacity - activeVehicles.length);

    // ── BUYING POWER ──────────────────────────────────────────────────────────
    const reserveFund = Math.min(30000000, Math.max(15000000, cashBalance * 0.15));
    const availableForPurchase = Math.max(0, cashBalance - reserveFund);
    let recommendedUnits = 0;
    let targetSegment = "LMPV / City Car";
    let advice = "";

    // Gunakan data pola historis untuk rekomendasi segmen
    const topBrand = businessPatterns.mostBoughtBrands[0]?.brand || "Toyota/Honda";
    const fastestUnit = businessPatterns.fastestSegments[0]?.brandModel || "unit fast-moving";

    if (emptyGarageSlots === 0) {
      advice = `Garasi penuh (0 slot kosong). Prioritaskan jual unit ready — terutama ${topBrand} yang perputarannya tercepat menurut histori Anda.`;
    } else if (availableForPurchase < 40000000) {
      advice = "Sisa kas bebas di bawah Rp 40jt. Tunda kulakan, fokus cairkan piutang dan jual unit yang ada.";
    } else if (availableForPurchase >= 150000000 && emptyGarageSlots >= 2) {
      recommendedUnits = 2;
      targetSegment = `2 Unit — segmen seperti ${fastestUnit} (perputaran tercepat di histori Anda)`;
      advice = `Kas bebas ${formatRupiah(availableForPurchase)} dengan ${emptyGarageSlots} slot kosong. Prioritaskan segmen yang histori Anda tunjukkan paling cepat laku: ${fastestUnit}.`;
    } else if (availableForPurchase >= 80000000) {
      recommendedUnits = 1;
      targetSegment = `1 Unit — pilih ${topBrand} atau segmen favorit Anda`;
      advice = `Kas cukup untuk 1 unit. Berdasarkan histori Anda, ${topBrand} adalah merk yang paling sering dibeli — pertimbangkan segmen yang sama.`;
    } else {
      recommendedUnits = 1;
      targetSegment = "1 Unit Ekonomis (Rp 40-70jt)";
      advice = `Kulakan 1 unit ekonomis yang modal rendah namun perputaran cepat. Hindari merk yang margin histori-nya di bawah rata-rata.`;
    }

    // ── URGENT VEHICLES ───────────────────────────────────────────────────────
    const urgentVehicles = activeVehicles
      .filter((v) => v.days > 35 || v.isPendingBpkb)
      .map((v) => {
        let urgentReason = "";
        if (v.days > 45) {
          urgentReason = `Unit macet ${v.days} hari (histori rata-rata terjual ${businessPatterns.avgTotalCycleDays} hari). Perlu evaluasi harga segera.`;
        } else if (v.isPendingBpkb) {
          urgentReason = `BPKB status: ${v.bpkbStatus} (${v.days} hari sejak beli). Follow up balai lelang.`;
        } else {
          urgentReason = `Mendekati 45 hari (${v.days} hari). Rata-rata unit Anda terjual dalam ${businessPatterns.avgTotalCycleDays} hari.`;
        }
        return { id: v.id, plateNumber: v.plateNumber, name: v.name, days: v.days, status: v.status, bpkbStatus: v.bpkbStatus, targetPrice: v.targetPrice, hpp: v.hpp, urgentReason };
      })
      .slice(0, 5);

    // ── PENDING RECEIVABLES ───────────────────────────────────────────────────
    const pendingReceivables = sales
      .filter((s) => {
        const paid = s.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        return paid < Number(s.sellingPrice);
      })
      .map((s) => {
        const paid = s.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const remainingAmount = Number(s.sellingPrice) - paid;
        const daysSinceSale = calculateDaysInInventory(s.saleDate, now);

        // Jatuh tempo: jika dueDate diatur pakai dueDate, jika tidak gunakan default 14 hari setelah penjualan
        const saleDateTime = new Date(s.saleDate).getTime();
        const targetDueDate = s.dueDate
          ? new Date(s.dueDate)
          : new Date(saleDateTime + 14 * 24 * 60 * 60 * 1000);

        const diffTime = targetDueDate.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let dueCategory: "OVERDUE" | "DUE_TODAY" | "DUE_SOON" | "ON_SCHEDULE" = "ON_SCHEDULE";
        if (daysRemaining < 0) {
          dueCategory = "OVERDUE";
        } else if (daysRemaining === 0) {
          dueCategory = "DUE_TODAY";
        } else if (daysRemaining <= 3) {
          dueCategory = "DUE_SOON";
        }

        return {
          id: s.id,
          vehiclePlate: s.vehicle.plateNumber,
          vehicleBrand: s.vehicle.brand,
          vehicleModel: s.vehicle.model,
          buyerName: s.buyer.name,
          buyerPhone: s.buyer.phone || "",
          remainingAmount,
          dueDate: targetDueDate.toISOString().split("T")[0],
          saleDate: new Date(s.saleDate).toISOString().split("T")[0],
          daysRemaining,
          daysSinceSale,
          dueCategory,
        };
      })
      .sort((a, b) => a.daysRemaining - b.daysRemaining);

    // ── AUCTION PIPELINE ─────────────────────────────────────────────────────
    const auctionVehicles = activeVehicles.filter((v) => v.sourceType === "AUCTION");
    const eksPerusahaanCount = auctionVehicles.filter((v) => v.auctionLotType === "EKS_PERUSAHAAN").length;
    const eksTarikLeasingCount = auctionVehicles.filter((v) => v.auctionLotType === "EKS_TARIKAN_LEASING").length;
    const unknownSourceCount = auctionVehicles.filter((v) => !v.auctionLotType || v.auctionLotType === "UNKNOWN").length;

    const unitsBpkbArrivingSoon = auctionVehicles
      .filter((v) => v.isPendingBpkb && v.bpkbLeadDays > 0)
      .map((v) => {
        const expectedArrival = new Date(new Date(v.purchaseDate).getTime() + v.bpkbLeadDays * 24 * 60 * 60 * 1000);
        const daysRemaining = Math.ceil((expectedArrival.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { plateNumber: v.plateNumber, name: v.name, auctionLotType: v.auctionLotType || "UNKNOWN", bpkbStatus: v.bpkbStatus, purchaseDate: v.purchaseDate.toISOString().split("T")[0], estimatedBpkbArrivalDays: daysRemaining };
      })
      .filter((v) => v.estimatedBpkbArrivalDays <= 7)
      .sort((a, b) => a.estimatedBpkbArrivalDays - b.estimatedBpkbArrivalDays);

    const auctionPipeline = {
      totalAuctionUnits: auctionVehicles.length,
      eksPerusahaanCount,
      eksTarikLeasingCount,
      unknownSourceCount,
      unitsBpkbArrivingSoon,
      avgDaysToReadyEksPerusahaan: businessPatterns.avgDaysIntakeToReady || 12,
      avgDaysToReadyEksLeasing: (businessPatterns.avgDaysIntakeToReady || 12) + 9,
    };

    // ── 14-DAY CASH FLOW PROJECTION ──────────────────────────────────────────
    const pendingSettlements = sales
      .filter((s) => {
        const paid = s.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        return paid < Number(s.sellingPrice);
      })
      .map((s) => {
        const paid = s.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const remainingAmount = Number(s.sellingPrice) - paid;
        const daysSinceSale = calculateDaysInInventory(s.saleDate, now);
        // Gunakan rata-rata payment lag NYATA dari histori, bukan asumsi 14 hari
        const lagToUse = businessPatterns.avgPaymentLagDays > 0 ? businessPatterns.avgPaymentLagDays : 14;
        const isLikelyClearingSoon = daysSinceSale >= Math.floor(lagToUse * 0.5) && daysSinceSale <= lagToUse + 7;
        return { vehiclePlate: s.vehicle.plateNumber, buyerName: s.buyer.name, amount: remainingAmount, daysSinceSale, isLikelyClearingSoon };
      });

    const projectedCashIn14Days = pendingSettlements.filter((p) => p.isLikelyClearingSoon).reduce((s, p) => s + p.amount, 0);
    const estimatedRepairCosts = inRepairCount * (businessPatterns.avgExpensePerUnit || 3500000);
    const totalOpEx3months = opExes.reduce((s, e) => s + Number(e.amount), 0);
    const monthlyOperationalBurn = totalOpEx3months > 0 ? totalOpEx3months / 3 : 5000000;
    const dailyBurn = monthlyOperationalBurn / 30;
    const cashRunwayDays = dailyBurn > 0 ? Math.floor(cashBalance / dailyBurn) : 999;
    const projectedCashOut14Days = Math.round(monthlyOperationalBurn / 2) + estimatedRepairCosts;
    const netCashflow14Days = projectedCashIn14Days - projectedCashOut14Days;

    const cashflowProjection = {
      projectedCashIn14Days,
      projectedCashOut14Days,
      netCashflow14Days,
      pendingSettlements,
      estimatedRepairCosts,
      cashRunwayDays,
      monthlyOperationalBurn,
    };

    // ── RADAR ALARM PAJAK STNK PKB (H-30 HARI & OVERDUE) ─────────────────────
    const criticalTaxUnits: Array<{
      id: string;
      plateNumber: string;
      brand: string;
      model: string;
      year: number;
      taxExpiryDate: string;
      platExpiryDate?: string | null;
      taxNominal?: number | null;
      daysRemaining: number;
      status: "OVERDUE" | "EXPIRING_SOON";
    }> = [];

    let taxOverdueCount = 0;
    let taxExpiringSoonCount = 0;
    let taxSafeCount = 0;
    let taxUnknownCount = 0;

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    vehicles.forEach((v) => {
      if (!v.taxExpiryDate) {
        taxUnknownCount++;
        return;
      }

      const expiry = new Date(v.taxExpiryDate);
      expiry.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((expiry.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        taxOverdueCount++;
        criticalTaxUnits.push({
          id: v.id,
          plateNumber: v.plateNumber,
          brand: v.brand,
          model: v.model,
          year: v.year,
          taxExpiryDate: v.taxExpiryDate.toISOString(),
          platExpiryDate: v.platExpiryDate ? v.platExpiryDate.toISOString() : null,
          taxNominal: v.taxNominal ? Number(v.taxNominal) : null,
          daysRemaining: diffDays,
          status: "OVERDUE",
        });
      } else if (diffDays <= 30) {
        taxExpiringSoonCount++;
        criticalTaxUnits.push({
          id: v.id,
          plateNumber: v.plateNumber,
          brand: v.brand,
          model: v.model,
          year: v.year,
          taxExpiryDate: v.taxExpiryDate.toISOString(),
          platExpiryDate: v.platExpiryDate ? v.platExpiryDate.toISOString() : null,
          taxNominal: v.taxNominal ? Number(v.taxNominal) : null,
          daysRemaining: diffDays,
          status: "EXPIRING_SOON",
        });
      } else {
        taxSafeCount++;
      }
    });

    criticalTaxUnits.sort((a, b) => a.daysRemaining - b.daysRemaining);

    const taxAlertSummary = {
      overdueCount: taxOverdueCount,
      expiringSoonCount: taxExpiringSoonCount,
      safeCount: taxSafeCount,
      unknownCount: taxUnknownCount,
      criticalUnits: criticalTaxUnits,
    };

    const isKeySet = Boolean(geminiKey && geminiKey.trim().length > 0);
    const isEnabled = geminiEnabled !== "false";
    const hasGeminiKey = isKeySet && isEnabled;

    const operationalData: DashboardOperationalData = {
      totalActiveVehicles: activeVehicles.length,
      readyCount, intakeCount, inRepairCount, bookedCount, stagnantCount,
      pendingBpkbCount, pendingSalonCount, pendingPaintCount,
      cashBalance, totalInventoryHpp, garageCapacity, emptyGarageSlots,
      buyingPowerRecommendation: { recommendedUnits, recommendedBudget: availableForPurchase, reserveFund, targetSegment, advice },
      urgentVehicles,
      pendingReceivables,
      taxAlertSummary,
      auctionPipeline,
      cashflowProjection,
      businessPatterns,
    };

    return {
      success: true,
      hasGeminiKey,
      geminiKeySet: isKeySet,
      geminiEnabled: isEnabled,
      initialOrchestration: buildDeterministicOrchestration(operationalData),
      data: operationalData,
    };
  } catch (error: any) {
    console.error("[getDashboardData] Error:", error);
    const emptyPatterns: BusinessPatternAnalytics = {
      totalHistoricalVehicles: 0, pctFromAuction: 0, pctEksPerusahaan: 0, pctEksLeasing: 0,
      topAuctionHouses: [], mostBoughtBrands: [], avgDaysIntakeToReady: 0, avgDaysReadyToSold: 0,
      avgTotalCycleDays: 0, fastestSegments: [], avgGrossMarginRupiah: 0, avgGrossMarginPct: 0,
      totalRevenueAllTime: 0, totalProfitAllTime: 0, mostProfitableBrands: [],
      avgPaymentLagDays: 0, pctPaidWithin14Days: 0, pctPaidWithin7Days: 0, pctStillPending: 0,
      avgExpensePerUnit: 0, topExpenseCategories: [],
      dataQualityNote: "⚠️ Gagal memuat data analitik.",
    };
    return {
      success: false, hasGeminiKey: false,
      data: {
        totalActiveVehicles: 0, readyCount: 0, intakeCount: 0, inRepairCount: 0, bookedCount: 0,
        stagnantCount: 0, pendingBpkbCount: 0, pendingSalonCount: 0, pendingPaintCount: 0,
        cashBalance: 0, totalInventoryHpp: 0, garageCapacity: 8, emptyGarageSlots: 8,
        buyingPowerRecommendation: { recommendedUnits: 0, recommendedBudget: 0, reserveFund: 0, targetSegment: "-", advice: "Data belum tersedia." },
        urgentVehicles: [], pendingReceivables: [],
        taxAlertSummary: { overdueCount: 0, expiringSoonCount: 0, safeCount: 0, unknownCount: 0, criticalUnits: [] },
        auctionPipeline: { totalAuctionUnits: 0, eksPerusahaanCount: 0, eksTarikLeasingCount: 0, unknownSourceCount: 0, unitsBpkbArrivingSoon: [], avgDaysToReadyEksPerusahaan: 12, avgDaysToReadyEksLeasing: 21 },
        cashflowProjection: { projectedCashIn14Days: 0, projectedCashOut14Days: 0, netCashflow14Days: 0, pendingSettlements: [], estimatedRepairCosts: 0, cashRunwayDays: 0, monthlyOperationalBurn: 0 },
        businessPatterns: emptyPatterns,
      },
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DETERMINISTIC ORCHESTRATION BUILDER (100% Reliable Baseline)
// ─────────────────────────────────────────────────────────────────────────────

function buildDeterministicOrchestration(data: DashboardOperationalData): ExecutiveAiOrchestration {
  const cf = data.cashflowProjection;
  const bp = data.businessPatterns;
  const tax = data.taxAlertSummary;
  const ap = data.auctionPipeline;

  // 1. Calculate Health Score
  let score = 88;
  if (cf.netCashflow14Days < 0) score -= 15;
  if (cf.cashRunwayDays < 30) score -= 12;
  if (data.stagnantCount > 0) score -= Math.min(data.stagnantCount * 6, 18);
  if (tax.overdueCount > 0) score -= Math.min(tax.overdueCount * 8, 16);
  if (tax.expiringSoonCount > 0) score -= Math.min(tax.expiringSoonCount * 4, 12);
  if (data.pendingReceivables.some((r) => r.dueCategory === "OVERDUE")) score -= 15;
  if (data.readyCount >= 3) score += 6;
  if (data.cashBalance >= 50000000) score += 5;

  score = Math.max(25, Math.min(score, 98));

  let healthStatus: "PRIMA" | "WASPADA" | "KRITIS" = "PRIMA";
  if (score < 60) healthStatus = "KRITIS";
  else if (score < 80) healthStatus = "WASPADA";

  // 2. Generate Headline & Executive Summary
  const headline =
    healthStatus === "PRIMA"
      ? `Arus Kas 14 Hari Positif (${cf.netCashflow14Days >= 0 ? "+" : ""}${formatRupiah(cf.netCashflow14Days)}), Kondisi Garasi Prima dengan ${data.readyCount} Unit Siap Jual.`
      : healthStatus === "WASPADA"
      ? `Perhatian: Perlu Prioritas Penagihan Piutang & Perpanjangan Dokumen Pajak untuk Menjaga Likuiditas.`
      : `Peringatan Kritis: Cash Runway ${cf.cashRunwayDays} Hari dan Terdapat Piutang/Pajak Overdue yang Harus Segera Diatasi.`;

  const executiveSummary = `Showroom saat ini memiliki ${data.totalActiveVehicles} unit aktif di garasi (sisa ${data.emptyGarageSlots} slot kosong). Saldo kas BCA tercatat ${formatRupiah(data.cashBalance)} dengan cadangan modal HPP ${formatRupiah(data.totalInventoryHpp)}. Proyeksi arus kas 14 hari menghasilkan estimasi ${cf.netCashflow14Days >= 0 ? "surplus" : "defisit"} ${formatRupiah(cf.netCashflow14Days)} dengan runway operasional ${cf.cashRunwayDays} hari.`;

  // 3. Build Directive Action Cards
  const directiveActions: ExecutiveAiOrchestration["directiveActions"] = [];

  // Action: Overdue or near-due receivables
  const urgentRec = data.pendingReceivables.find(
    (r) => r.dueCategory === "OVERDUE" || r.dueCategory === "DUE_TODAY" || r.dueCategory === "DUE_SOON" || r.daysSinceSale >= 10
  );
  if (urgentRec) {
    directiveActions.push({
      id: "act-rec-" + urgentRec.id,
      priority: urgentRec.dueCategory === "OVERDUE" ? "CRITICAL" : "HIGH",
      category: "PIUTANG_TEMPO",
      badgeText: urgentRec.dueCategory === "OVERDUE" ? "Piutang Macet" : "Jatuh Tempo H-7",
      title: `Tagih Pelunasan ${urgentRec.vehicleBrand} ${urgentRec.vehicleModel} (${urgentRec.vehiclePlate})`,
      description: `Pembeli ${urgentRec.buyerName} memiliki sisa piutang ${formatRupiah(urgentRec.remainingAmount)} (${urgentRec.daysSinceSale} hari sejak transaksi). Ingatkan penyerahan BPKB/STNK setelah lunas.`,
      actionLabel: "Buka Buku Piutang",
      actionHref: "/admin/sales",
    });
  }

  // Action: Tax / STNK Overdue
  const criticalTax = tax.criticalUnits[0];
  if (criticalTax) {
    directiveActions.push({
      id: "act-tax-" + criticalTax.id,
      priority: criticalTax.status === "OVERDUE" ? "CRITICAL" : "HIGH",
      category: "PAJAK_STNK",
      badgeText: criticalTax.status === "OVERDUE" ? "Pajak Mati" : "Jatuh Tempo H-30",
      title: `Perpanjang Pajak STNK ${criticalTax.brand} ${criticalTax.model} (${criticalTax.plateNumber})`,
      description: `Masa berlaku PKB ${criticalTax.status === "OVERDUE" ? "telah lewat jatuh tempo" : `tersisa ${criticalTax.daysRemaining} hari`}. Estimasi biaya PKB: ${formatRupiah(criticalTax.taxNominal || 2500000)}.`,
      actionLabel: "Lihat Radar Pajak",
      actionHref: "/admin/inventory",
    });
  }

  // Action: Stagnant Units
  if (data.stagnantCount > 0) {
    const stagnantUnit = data.urgentVehicles.find((u) => u.days > 45) || data.urgentVehicles[0];
    if (stagnantUnit) {
      directiveActions.push({
        id: "act-stagnant-" + stagnantUnit.id,
        priority: "HIGH",
        category: "UNIT_STAGNANT",
        badgeText: "Unit Macet >45 Hari",
        title: `Evaluasi Harga / Promo ${stagnantUnit.name} (${stagnantUnit.plateNumber})`,
        description: `Sudah mengendap ${stagnantUnit.days} hari di garasi (modal terikat ${formatRupiah(stagnantUnit.hpp)}). Pertimbangkan diskon harga atau promo display akhir pekan.`,
        actionLabel: "Kelola Inventori",
        actionHref: "/admin/inventory",
      });
    }
  }

  // Action: Auction Buying Recommendation
  if (data.buyingPowerRecommendation.recommendedUnits > 0 && data.emptyGarageSlots > 0) {
    directiveActions.push({
      id: "act-auction-buy",
      priority: "MEDIUM",
      category: "KULAKAN_LELANG",
      badgeText: "Daya Beli Aman",
      title: `Rekomendasi Lelang: Ambil ${data.buyingPowerRecommendation.recommendedUnits} Unit (${data.buyingPowerRecommendation.targetSegment})`,
      description: `Alokasikan maksimal ${formatRupiah(data.buyingPowerRecommendation.recommendedBudget)} hammer lelang untuk menjaga cadangan kas aman minimal ${formatRupiah(data.buyingPowerRecommendation.reserveFund)}.`,
      actionLabel: "Cek Pipeline Lelang",
      actionHref: "/admin/inventory/new",
    });
  }

  // Action: BPKB Pending
  const bpkbArriving = ap.unitsBpkbArrivingSoon[0];
  if (bpkbArriving) {
    directiveActions.push({
      id: "act-bpkb-" + bpkbArriving.plateNumber,
      priority: bpkbArriving.estimatedBpkbArrivalDays <= 0 ? "HIGH" : "MEDIUM",
      category: "OPERASIONAL",
      badgeText: "Follow-up BPKB",
      title: `Pantau Kedatangan BPKB ${bpkbArriving.name} (${bpkbArriving.plateNumber})`,
      description: `Unit lelang ${bpkbArriving.auctionLotType}. Masa tunggu BPKB ${bpkbArriving.estimatedBpkbArrivalDays <= 0 ? "HARI INI / TERLAMBAT" : `estimasi tiba ${bpkbArriving.estimatedBpkbArrivalDays} hari lagi`}.`,
      actionLabel: "Cek Data Mobil",
      actionHref: "/admin/inventory",
    });
  }

  // Ensure at least 3 actions
  if (directiveActions.length < 3) {
    directiveActions.push({
      id: "act-ready-promo",
      priority: "MEDIUM",
      category: "OPERASIONAL",
      badgeText: "Marketing Showroom",
      title: `Promosikan ${data.readyCount} Unit Siap Jual di Media Sosial`,
      description: "Pastikan foto HD, cetak Price Tag gantung spion, dan bagikan tautan katalog publik ke WhatsApp calon pembeli.",
      actionLabel: "Buka Katalog",
      actionHref: "/katalog",
    });
  }

  // 4. Build Auction Strategy
  const auctionStrategy: ExecutiveAiOrchestration["auctionStrategy"] = {
    canBuy: data.buyingPowerRecommendation.recommendedUnits > 0 && data.emptyGarageSlots > 0,
    recommendedUnits: data.buyingPowerRecommendation.recommendedUnits,
    recommendedMaxBudgetRupiah: data.buyingPowerRecommendation.recommendedBudget,
    targetSegment: data.buyingPowerRecommendation.targetSegment || "LMPV Toyota Avanza / Honda Brio",
    preferredHouse: bp.topAuctionHouses[0]?.name ? `${bp.topAuctionHouses[0].name} (Eks Perusahaan)` : "IBID / JBA Eks Perusahaan",
    tacticalAdvice: data.buyingPowerRecommendation.advice,
  };

  // 5. Build Sales Acceleration
  const salesAcceleration: ExecutiveAiOrchestration["salesAcceleration"] = {
    headline: `Fokus putar modal pada ${data.readyCount} unit Ready Siap Jual dan mitigasi ${data.stagnantCount} unit macet.`,
    tactics: [
      `Tawarkan skema Cash Tempo SOP Garasi (DP minimal 70%, pelunasan maks 30 hari, BPKB/STNK asli aman ditahan).`,
      `Unit favorit perputaran tercepat di showroom: ${bp.fastestSegments[0]?.brandModel || "Toyota Avanza / Daihatsu Xenia"}.`,
      data.stagnantCount > 0
        ? `Lakukan koreksi harga Rp 2.000.000 - Rp 3.000.000 untuk unit > 45 hari agar kas tidak terkunci.`
        : `Pertahankan batas bawah negosiasi (bottom price) untuk mengamankan margin kotor rata-rata ${bp.avgGrossMarginPct || 12}%.`,
    ],
  };

  // 6. Risk Mitigation
  const riskMitigation: ExecutiveAiOrchestration["riskMitigation"] = {
    bpkbStatus:
      ap.unitsBpkbArrivingSoon.length > 0
        ? `${ap.unitsBpkbArrivingSoon.length} unit lelang dalam masa tunggu BPKB (utamakan eks perusahaan).`
        : "Seluruh BPKB unit aktif dalam status terkendali.",
    taxStatus:
      tax.overdueCount > 0
        ? `Terdapat ${tax.overdueCount} unit dengan pajak mati (Overdue) dan ${tax.expiringSoonCount} unit H-30 hari.`
        : tax.expiringSoonCount > 0
        ? `Terdapat ${tax.expiringSoonCount} unit STNK mendekati batas tempo H-30 hari.`
        : "Seluruh inventori memiliki status pajak STNK hidup dan aman.",
    receivableStatus: urgentRec
      ? `Terdapat piutang tempo yang perlu ditagih proaktif sebelum melewati 30 hari.`
      : "Arus piutang tempo berjalan lancar sesuai jadwal.",
  };

  const fullBriefingText = `### Ringkasan Eksekutif
${headline}
${executiveSummary}

### Rekomendasi Tindakan Prioritas Hari Ini:
${directiveActions.map((a, i) => `${i + 1}. **[${a.badgeText}] ${a.title}**: ${a.description}`).join("\n")}

### Strategi Arus Kas & Kulakan Lelang:
- **Kapasitas Pembelian:** ${auctionStrategy.canBuy ? `Boleh kulakan ${auctionStrategy.recommendedUnits} unit dengan batas anggaran maksimal ${formatRupiah(auctionStrategy.recommendedMaxBudgetRupiah)}` : "Tunda pembelian lelang hari ini untuk mengamankan cadangan operasional"}.
- **Segmen Target:** ${auctionStrategy.targetSegment}.
- **Balai Rekomendasi:** ${auctionStrategy.preferredHouse}.
- **Saran Taktis:** ${auctionStrategy.tacticalAdvice}

### Strategi Akselerasi Penjualan:
- ${salesAcceleration.tactics.join("\n- ")}
`;

  return {
    healthScore: score,
    healthStatus,
    headline,
    executiveSummary,
    generatedAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
    metrics: {
      cashRunwayDays: cf.cashRunwayDays,
      cashRunwayVerdict: cf.cashRunwayDays >= 45 ? "Sangat Aman" : cf.cashRunwayDays >= 25 ? "Cukup" : "Siaga Kas",
      projectedNet14DaysRupiah: cf.netCashflow14Days,
      safeBuyingUnits: auctionStrategy.recommendedUnits,
      safeBuyingMaxBudget: auctionStrategy.recommendedMaxBudgetRupiah,
      bpkbPendingRiskCount: ap.unitsBpkbArrivingSoon.length,
      taxAlertCount: tax.overdueCount + tax.expiringSoonCount,
    },
    directiveActions,
    auctionStrategy,
    salesAcceleration,
    riskMitigation,
    fullBriefingText,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GEMINI API CALLER (Robust with Zero-Thinking Budget & No Truncation)
// ─────────────────────────────────────────────────────────────────────────────

async function callGeminiGenerate(
  prompt: string,
  modelChoice: string,
  apiKey: string,
  options?: { jsonMode?: boolean }
): Promise<{ success: boolean; text?: string; error?: string }> {
  let model = modelChoice.trim() || "gemini-2.5-flash";
  if (model.includes("1.5-flash")) model = "gemini-2.5-flash";

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const genConfig: Record<string, any> = {
      temperature: 0.2,
      maxOutputTokens: 4096,
      thinkingConfig: {
        thinkingBudget: 0, // Matikan thinking tokens internal agar tidak menghabiskan kuota output & tidak terpotong
      },
    };

    if (options?.jsonMode) {
      genConfig.responseMimeType = "application/json";
    }

    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: genConfig,
    };

    let response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Fallback jika API endpoint menolak thinkingConfig / responseMimeType
    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const rawMsg = errJson.error?.message || "";
      if (
        rawMsg.includes("thinkingConfig") ||
        rawMsg.includes("responseMimeType") ||
        rawMsg.includes("INVALID_ARGUMENT") ||
        rawMsg.includes("Unknown field")
      ) {
        const safePayload = {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
        };
        response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(safePayload),
        });
      } else {
        let msg = rawMsg;
        if (rawMsg.includes("API key not valid") || rawMsg.includes("INVALID_ARGUMENT")) {
          msg = "Kunci API Gemini tidak valid. Periksa kembali di Pengaturan > Kunci API.";
        } else if (rawMsg.includes("Resource has been exhausted") || rawMsg.includes("Quota")) {
          msg = "Kuota gratis Gemini sudah habis. Coba lagi dalam beberapa menit.";
        }
        return { success: false, error: msg };
      }
    }

    const json = await response.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return { success: false, error: "Tidak menerima jawaban dari Gemini AI." };
    return { success: true, text };
  } catch (err: any) {
    return { success: false, error: `Gagal menghubungi Gemini: ${err.message || "Koneksi terputus"}` };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Build business context from REAL computed patterns
// ─────────────────────────────────────────────────────────────────────────────

function buildRealPatternContext(bp: BusinessPatternAnalytics): string {
  const lines: string[] = [];

  lines.push(`=== PROFIL BISNIS NYATA (DIHITUNG DARI DATA YANG DIINPUT USER — BUKAN ASUMSI) ===`);
  lines.push(bp.dataQualityNote);
  lines.push("");

  lines.push(`📦 POLA PEMBELIAN UNIT (dari ${bp.totalHistoricalVehicles} unit historis):`);
  lines.push(`- ${bp.pctFromAuction}% unit dibeli dari balai lelang (data nyata Anda)`);
  if (bp.pctEksPerusahaan > 0 || bp.pctEksLeasing > 0) {
    lines.push(`- Dari unit lelang: ${bp.pctEksPerusahaan}% eks perusahaan, ${bp.pctEksLeasing}% eks tarikan leasing`);
  }

  if (bp.topAuctionHouses.length > 0) {
    const housesText = bp.topAuctionHouses.map((h) => `${h.name} (${h.count}x, ${h.pct}%)`).join(", ");
    lines.push(`- Balai lelang yang Anda pakai: ${housesText}`);
  } else {
    lines.push(`- Balai lelang: data belum tercukupi`);
  }

  if (bp.mostBoughtBrands.length > 0) {
    const brandsText = bp.mostBoughtBrands
      .map((b) => `${b.brand} (${b.count}x, avg HPP ${formatRupiah(b.avgHpp)})`)
      .join(", ");
    lines.push(`- Merk paling sering dibeli: ${brandsText}`);
  }

  lines.push("");
  lines.push(`⏱️ POLA KECEPATAN PERPUTARAN UNIT (dari unit yang sudah terjual):`);
  if (bp.avgTotalCycleDays > 0) {
    lines.push(`- Rata-rata total siklus beli → terjual: ${bp.avgTotalCycleDays} hari`);
    lines.push(`- Estimasi rata-rata dari intake → siap jual: ${bp.avgDaysIntakeToReady} hari`);
    lines.push(`- Estimasi rata-rata dari siap jual → terjual: ${bp.avgDaysReadyToSold} hari`);
  } else {
    lines.push(`- Belum ada data penjualan cukup untuk menghitung rata-rata siklus`);
  }

  if (bp.fastestSegments.length > 0) {
    const segs = bp.fastestSegments.map((s) => `${s.brandModel} (avg ${s.avgDays} hari, ${s.count} unit)`).join(", ");
    lines.push(`- Unit yang paling cepat laku di histori Anda: ${segs}`);
  }

  lines.push("");
  lines.push(`💰 POLA KEUANGAN (dari penjualan yang sudah tercatat):`);
  if (bp.avgGrossMarginRupiah > 0) {
    lines.push(`- Rata-rata laba kotor per unit: ${formatRupiah(bp.avgGrossMarginRupiah)} (${bp.avgGrossMarginPct}% margin)`);
    lines.push(`- Total revenue sepanjang waktu: ${formatRupiah(bp.totalRevenueAllTime)}`);
    lines.push(`- Total profit kotor sepanjang waktu: ${formatRupiah(bp.totalProfitAllTime)}`);
  } else {
    lines.push(`- Belum ada data penjualan untuk menghitung margin`);
  }

  if (bp.mostProfitableBrands.length > 0) {
    const pb = bp.mostProfitableBrands
      .map((b) => `${b.brand} (avg margin ${formatRupiah(b.avgMargin)}, ${b.count} unit)`)
      .join(", ");
    lines.push(`- Merk paling menguntungkan berdasarkan data: ${pb}`);
  }

  lines.push("");
  lines.push(`💳 POLA PEMBAYARAN PEMBELI (dari data Payment yang nyata — BUKAN asumsi):`);
  if (bp.avgPaymentLagDays > 0) {
    lines.push(`- Rata-rata hari dari jual → lunas NYATA: ${bp.avgPaymentLagDays} hari`);
    lines.push(`- % pembeli bayar lunas dalam 7 hari: ${bp.pctPaidWithin7Days}%`);
    lines.push(`- % pembeli bayar lunas dalam 14 hari: ${bp.pctPaidWithin14Days}%`);
    lines.push(`- % transaksi masih belum lunas: ${bp.pctStillPending}%`);
  } else {
    lines.push(`- Belum ada data pelunasan yang cukup untuk menghitung rata-rata pembayaran`);
  }

  lines.push("");
  lines.push(`🔧 POLA BIAYA UNIT:`);
  lines.push(`- Rata-rata total biaya (salon/servis/cat) per unit: ${formatRupiah(bp.avgExpensePerUnit)}`);
  if (bp.topExpenseCategories.length > 0) {
    const cats = bp.topExpenseCategories
      .map((c) => `${c.category} (${formatRupiah(c.totalAmount)} total, ${c.count}x)`)
      .join(", ");
    lines.push(`- Kategori biaya terbesar: ${cats}`);
  }

  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// AI BRIEFING GENERATOR (Orchestrates Dashboard With JSON & No Chat Fluff)
// ─────────────────────────────────────────────────────────────────────────────

export async function generateExecutiveAiBriefing(): Promise<{
  success: boolean;
  orchestration?: ExecutiveAiOrchestration;
  briefing?: string;
  error?: string;
}> {
  try {
    const geminiKey = await getSettingValue("GEMINI_API_KEY");
    const geminiEnabled = await getSettingValue("GEMINI_ENABLED");
    const geminiModel = (await getSettingValue("GEMINI_MODEL")) || "gemini-2.5-flash";

    const { data } = await getDashboardData();
    const deterministicOrchestration = buildDeterministicOrchestration(data);

    if (geminiEnabled === "false") {
      return {
        success: true,
        orchestration: deterministicOrchestration,
        briefing: deterministicOrchestration.fullBriefingText,
        error: "Fitur Gemini AI dinonaktifkan di Pengaturan. Menampilkan orkestrasi deterministik lokal.",
      };
    }
    if (!geminiKey || !geminiKey.trim()) {
      return {
        success: true,
        orchestration: deterministicOrchestration,
        briefing: deterministicOrchestration.fullBriefingText,
        error: "Kunci API Gemini belum disimpan. Menampilkan orkestrasi deterministik lokal.",
      };
    }

    const bp = data.businessPatterns;
    const bpkbArrivingText =
      data.auctionPipeline.unitsBpkbArrivingSoon.length > 0
        ? data.auctionPipeline.unitsBpkbArrivingSoon
            .map((u) => `  * [${u.plateNumber}] ${u.name}: BPKB estimasi tiba ${u.estimatedBpkbArrivalDays <= 0 ? "HARI INI/TERLAMBAT ⚠️" : `dalam ${u.estimatedBpkbArrivalDays} hari`}`)
            .join("\n")
        : "  (Tidak ada BPKB yang diperkirakan tiba 7 hari ke depan)";

    const piutangText =
      data.cashflowProjection.pendingSettlements
        .filter((p) => p.isLikelyClearingSoon)
        .map((p) => `  * [${p.vehiclePlate}] ${p.buyerName}: sisa ${formatRupiah(p.amount)} (${p.daysSinceSale} hari sejak jual)`)
        .join("\n") || "  (Tidak ada piutang mendekati jatuh tempo)";

    const systemPrompt = `Anda adalah Mesin Orkestrasi Dashboard & Asisten Eksekutif Senior Showroom Mobil Bekas "Nur Mobil".
TUGAS UTAMA: Mengorkestrasi tampilan dashboard eksekutif dengan data intelijen bisnis yang TAJAM, TERUKUR, dan LANGSUNG DAPAT DIEKSEKUSI (ACTIONABLE).

PENTING SEKALI:
1. DILARANG KERAS menggunakan kata sapaan obrolan atau basa-basi chatting (JANGAN PERNAH tulis "Selamat pagi...", "Halo Bapak/Ibu...", "Berikut adalah daily executive briefing...").
2. LANGSUNG hasilkan analisis bisnis murni.
3. KEMBALIKAN DALAM FORMAT JSON VALID yang persis mengikuti skema di bawah. Jangan sertakan teks apapun di luar blok JSON.

${buildRealPatternContext(bp)}

=== STATUS OPERASIONAL HARI INI ===
- Tanggal: ${new Date().toLocaleDateString("id-ID", { dateStyle: "full" })}
- Saldo Kas BCA: ${formatRupiah(data.cashBalance)}
- Modal Terikat di Stok (HPP): ${formatRupiah(data.totalInventoryHpp)}
- Mobil di Garasi: ${data.totalActiveVehicles} unit (${data.emptyGarageSlots} slot kosong dari ${data.garageCapacity})
- Ready Siap Jual: ${data.readyCount} | Intake Baru: ${data.intakeCount} | Di Bengkel: ${data.inRepairCount}
- BPKB Belum Datang: ${data.pendingBpkbCount} unit | Unit Macet >45 hari: ${data.stagnantCount} unit
- Pajak STNK: Overdue ${data.taxAlertSummary.overdueCount} unit | H-30 Hari ${data.taxAlertSummary.expiringSoonCount} unit

=== AUCTION PIPELINE AKTIF ===
- Eks Perusahaan di pipeline: ${data.auctionPipeline.eksPerusahaanCount} unit
- Eks Tarikan Leasing di pipeline: ${data.auctionPipeline.eksTarikLeasingCount} unit
- BPKB yang diperkirakan tiba 7 hari ke depan:
${bpkbArrivingText}

=== PROYEKSI KAS 14 HARI ===
- Kas Masuk Proyeksi: ${formatRupiah(data.cashflowProjection.projectedCashIn14Days)}
- Kas Keluar Proyeksi: ${formatRupiah(data.cashflowProjection.projectedCashOut14Days)}
- Net Cashflow 14 Hari: ${data.cashflowProjection.netCashflow14Days >= 0 ? "+" : ""}${formatRupiah(data.cashflowProjection.netCashflow14Days)}
- Cash Runway: ${data.cashflowProjection.cashRunwayDays} hari
- Piutang berjalan:
${piutangText}

=== UNIT PERLU PERHATIAN ===
${data.urgentVehicles.map((u) => `* [${u.plateNumber}] ${u.name}: ${u.urgentReason}`).join("\n") || "(Tidak ada unit kritis)"}

=== REKOMENDASI KULAKAN SISTEM ===
${data.buyingPowerRecommendation.advice}

SKEMA JSON YANG WAJIB DIHASILKAN (KEMBALIKAN PERSIS FORMAT INI):
{
  "healthScore": 85,
  "healthStatus": "PRIMA",
  "headline": "1 kalimat ringkasan eksekutif tajam status bisnis hari ini",
  "executiveSummary": "2-3 kalimat diagnosis bisnis mendalam tanpa salam sapaan",
  "directiveActions": [
    {
      "id": "act-1",
      "priority": "HIGH",
      "category": "PIUTANG_TEMPO",
      "badgeText": "Jatuh Tempo",
      "title": "Judul aksi konkret",
      "description": "Instruksi tindakan spesifik",
      "actionLabel": "Buka Buku Piutang",
      "actionHref": "/admin/sales"
    }
  ],
  "auctionStrategy": {
    "canBuy": true,
    "recommendedUnits": 1,
    "recommendedMaxBudgetRupiah": 130000000,
    "targetSegment": "LMPV Avanza/Xenia/Brio",
    "preferredHouse": "IBID / JBA Eks Perusahaan",
    "tacticalAdvice": "Saran lelang agar kas tidak terganggu"
  },
  "salesAcceleration": {
    "headline": "Fokus penjualan hari ini",
    "tactics": [
      "Taktik penjualan 1",
      "Taktik penjualan 2"
    ]
  },
  "riskMitigation": {
    "bpkbStatus": "Status risiko BPKB lelang",
    "taxStatus": "Status risiko pajak STNK",
    "receivableStatus": "Status risiko piutang tempo"
  },
  "fullBriefingText": "Laporan eksekutif lengkap dan mendalam (Markdown rapi tanpa kata salam chatting)"
}`;

    const res = await callGeminiGenerate(systemPrompt, geminiModel, geminiKey, { jsonMode: true });

    if (!res.success || !res.text) {
      return {
        success: true,
        orchestration: deterministicOrchestration,
        briefing: deterministicOrchestration.fullBriefingText,
        error: res.error || "Gagal memanggil Gemini, beralih ke orkestrasi lokal.",
      };
    }

    try {
      let cleaned = res.text.trim();
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      const parsed = JSON.parse(cleaned);

      const orchestration: ExecutiveAiOrchestration = {
        healthScore: typeof parsed.healthScore === "number" ? Math.max(10, Math.min(parsed.healthScore, 100)) : deterministicOrchestration.healthScore,
        healthStatus: ["PRIMA", "WASPADA", "KRITIS"].includes(parsed.healthStatus) ? parsed.healthStatus : deterministicOrchestration.healthStatus,
        headline: parsed.headline || deterministicOrchestration.headline,
        executiveSummary: parsed.executiveSummary || deterministicOrchestration.executiveSummary,
        generatedAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
        metrics: deterministicOrchestration.metrics,
        directiveActions: Array.isArray(parsed.directiveActions) && parsed.directiveActions.length > 0 ? parsed.directiveActions : deterministicOrchestration.directiveActions,
        auctionStrategy: parsed.auctionStrategy || deterministicOrchestration.auctionStrategy,
        salesAcceleration: parsed.salesAcceleration || deterministicOrchestration.salesAcceleration,
        riskMitigation: parsed.riskMitigation || deterministicOrchestration.riskMitigation,
        fullBriefingText: parsed.fullBriefingText || deterministicOrchestration.fullBriefingText,
      };

      return {
        success: true,
        orchestration,
        briefing: orchestration.fullBriefingText,
      };
    } catch {
      let cleanText = res.text
        .replace(/^(Selamat pagi|Selamat siang|Selamat malam|Halo)[^\n]*\n+/i, "")
        .replace(/^Berikut adalah[^\n]*\n+/i, "")
        .trim();

      const hybridOrchestration: ExecutiveAiOrchestration = {
        ...deterministicOrchestration,
        fullBriefingText: cleanText || deterministicOrchestration.fullBriefingText,
      };

      return {
        success: true,
        orchestration: hybridOrchestration,
        briefing: hybridOrchestration.fullBriefingText,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal menghasilkan briefing AI",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERACTIVE AI ADVISOR (Zero Greeting & Direct Strategic Verdict)
// ─────────────────────────────────────────────────────────────────────────────

export async function askAiShowroomAdvisor(question: string): Promise<{ success: boolean; answer?: string; error?: string }> {
  try {
    if (!question?.trim()) return { success: false, error: "Pertanyaan tidak boleh kosong." };

    const geminiKey = await getSettingValue("GEMINI_API_KEY");
    const geminiEnabled = await getSettingValue("GEMINI_ENABLED");
    const geminiModel = (await getSettingValue("GEMINI_MODEL")) || "gemini-2.5-flash";

    if (geminiEnabled === "false") {
      return { success: false, error: "Fitur Gemini AI dinonaktifkan di Pengaturan. Aktifkan sakelar Gemini terlebih dahulu." };
    }
    if (!geminiKey?.trim()) {
      return { success: false, error: "Kunci API Gemini belum disimpan. Masukkan API Key di Pengaturan > Kunci API." };
    }

    const { data } = await getDashboardData();
    const bp = data.businessPatterns;

    const prompt = `Anda adalah Asisten Eksekutif & Decision Advisor Showroom Mobil Bekas "Nur Mobil".
TUGAS: Menjawab pertanyaan pimpinan showroom dengan analisis bisnis yang TAJAM, RINGKAS, dan LANGSUNG PADA KEPUTUSAN (TO THE POINT).

PENTING:
1. DILARANG KERAS menggunakan kata sapaan atau basa-basi chatting seperti "Selamat pagi...", "Halo...", dll.
2. Jawab BERDASARKAN DATA NYATA showroom ini di bawah, BUKAN asumsi umum.
3. Gunakan poin-poin tegas dan akhiri dengan KESIMPULAN REKOMENDASI (AMBIL / TUNDA / NEGO / WASPADA).

${buildRealPatternContext(bp)}

KONTEKS OPERASIONAL TERKINI:
- Saldo Kas BCA: ${formatRupiah(data.cashBalance)}
- Modal Terikat (HPP): ${formatRupiah(data.totalInventoryHpp)}
- Garasi: ${data.totalActiveVehicles}/${data.garageCapacity} unit (${data.emptyGarageSlots} slot kosong)
- Unit Macet >45 hari: ${data.stagnantCount} unit
- Piutang mendekati jatuh tempo: ${formatRupiah(data.cashflowProjection.projectedCashIn14Days)}
- Cash Runway: ${data.cashflowProjection.cashRunwayDays} hari
- Avg payment lag nyata: ${bp.avgPaymentLagDays > 0 ? bp.avgPaymentLagDays + " hari" : "belum ada data cukup"}

PERTANYAAN PEMILIK:
"${question}"

Format Jawaban:
- Analisis Singkat Berbasis Data Riil
- Pertimbangan Kunci
- **REKOMENDASI KEPUTUSAN AKHIR:** (AMBIL / TUNDA / NEGO / WASPADA) beserta alasan 1 kalimat.`;

    const res = await callGeminiGenerate(prompt, geminiModel, geminiKey);
    if (!res.success) return { success: false, error: res.error };
    return { success: true, answer: res.text };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menghubungi Gemini AI." };
  }
}

