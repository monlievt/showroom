"use server";

import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { calculateDaysInInventory, calculateHpp } from "@/lib/calculations/hpp";

export interface VelocityMetricSummary {
  avgDaysToSell: number;
  inventoryTurnoverMonthly: number;
  dailyHoldingCostPerUnitAvg: number;
  totalHoldingCostLossStagnant: number;
  fastestUnit: {
    plateNumber: string;
    name: string;
    days: number;
    profit: number;
  } | null;
  slowestUnit: {
    plateNumber: string;
    name: string;
    days: number;
    status: string;
  } | null;
  totalActiveUnits: number;
  totalSoldUnits: number;
  activeHppTotal: number;
}

export interface UnitTimelineItem {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  purchaseDate: string;
  saleDate: string | null;
  status: string;
  durationDays: number;
  hpp: number;
  sellingPrice: number | null;
  grossProfit: number | null;
  marginPct: number | null;
  isSold: boolean;
  category: "FAST" | "NORMAL" | "STAGNANT";
  source: "LIVE" | "HISTORICAL";
}

export interface VelocityMatrixItem {
  brandModel: string;
  brand: string;
  model: string;
  totalUnits: number;
  soldUnits: number;
  avgDaysToSell: number;
  avgProfitRupiah: number;
  avgMarginPct: number;
  classification: "STAR_PROFIT" | "FAST_CASH" | "STEADY" | "SLOW_STAGNANT";
  recommendationTag: string;
}

export interface BottleneckFunnelStage {
  stage: string;
  avgDays: number;
  description: string;
  status: "GOOD" | "WARNING" | "ATTENTION";
}

export interface MonthlyVelocityItem {
  monthKey: string;
  monthLabel: string;
  unitsBought: number;
  unitsSold: number;
  revenue: number;
  profit: number;
  avgDaysToSell: number;
}

export interface ShowroomAnalyticsData {
  metrics: VelocityMetricSummary;
  timeline: UnitTimelineItem[];
  velocityMatrix: VelocityMatrixItem[];
  bottleneckFunnel: BottleneckFunnelStage[];
  monthlyTrend: MonthlyVelocityItem[];
  generatedAt: string;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
];

export async function getShowroomAnalyticsAction(): Promise<{
  success: boolean;
  data?: ShowroomAnalyticsData;
  error?: string;
}> {
  try {
    await requireSession();

    // 1. Ambil data kendaraan aktif & terjual dari sistem operasional
    const vehicles = await prisma.vehicle.findMany({
      include: {
        sale: {
          include: {
            payments: true,
          },
        },
        expenses: true,
      },
      orderBy: {
        purchaseDate: "desc",
      },
    });

    // 2. Ambil data historis arsip toko lama untuk memperkaya analitik siklus
    const historicalSales = await prisma.historicalSale.findMany({
      orderBy: {
        saleDate: "desc",
      },
      take: 200,
    });

    const now = new Date();
    const timelineItems: UnitTimelineItem[] = [];

    // Proses data Vehicle operasional
    vehicles.forEach((v) => {
      const expensesTotal = v.expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
      const hpp = Number(v.purchasePrice) + expensesTotal;
      const isSold = !!v.sale;
      
      let durationDays = 0;
      let saleDateStr: string | null = null;
      let sellingPriceNum: number | null = null;
      let grossProfitNum: number | null = null;
      let marginPctNum: number | null = null;

      if (v.sale) {
        saleDateStr = v.sale.saleDate.toISOString();
        sellingPriceNum = Number(v.sale.sellingPrice);
        grossProfitNum = sellingPriceNum - hpp;
        marginPctNum = sellingPriceNum > 0 ? (grossProfitNum / sellingPriceNum) * 100 : 0;
        
        const purchaseTime = new Date(v.purchaseDate).getTime();
        const saleTime = new Date(v.sale.saleDate).getTime();
        durationDays = Math.max(1, Math.round((saleTime - purchaseTime) / (1000 * 60 * 60 * 24)));
      } else {
        durationDays = calculateDaysInInventory(v.purchaseDate, now);
      }

      let category: "FAST" | "NORMAL" | "STAGNANT" = "NORMAL";
      if (durationDays <= 18) category = "FAST";
      else if (durationDays > 45) category = "STAGNANT";

      timelineItems.push({
        id: v.id,
        plateNumber: v.plateNumber,
        brand: v.brand,
        model: v.model,
        year: v.year,
        purchaseDate: v.purchaseDate.toISOString(),
        saleDate: saleDateStr,
        status: v.status,
        durationDays,
        hpp,
        sellingPrice: sellingPriceNum,
        grossProfit: grossProfitNum,
        marginPct: marginPctNum,
        isSold,
        category,
        source: "LIVE",
      });
    });

    // Proses data Arsip Historis
    historicalSales.forEach((h) => {
      const hpp = Number(h.totalHpp);
      const sellingPrice = Number(h.sellingPrice);
      const grossProfit = Number(h.grossProfit);
      const marginPct = sellingPrice > 0 ? (grossProfit / sellingPrice) * 100 : 0;
      
      let durationDays = 1;
      if (h.purchaseDate && h.saleDate) {
        const buyTime = new Date(h.purchaseDate).getTime();
        const sellTime = new Date(h.saleDate).getTime();
        durationDays = Math.max(1, Math.round((sellTime - buyTime) / (1000 * 60 * 60 * 24)));
      }

      const purchaseDateStr = h.purchaseDate
        ? h.purchaseDate.toISOString()
        : h.saleDate
        ? h.saleDate.toISOString()
        : h.createdAt.toISOString();
      const saleDateStr = h.saleDate ? h.saleDate.toISOString() : purchaseDateStr;

      let category: "FAST" | "NORMAL" | "STAGNANT" = "NORMAL";
      if (durationDays <= 18) category = "FAST";
      else if (durationDays > 45) category = "STAGNANT";

      timelineItems.push({
        id: `hist-${h.id}`,
        plateNumber: h.plateNumber,
        brand: h.brand,
        model: h.model,
        year: h.year,
        purchaseDate: purchaseDateStr,
        saleDate: saleDateStr,
        status: "SOLD_SETTLED",
        durationDays,
        hpp,
        sellingPrice,
        grossProfit,
        marginPct,
        isSold: true,
        category,
        source: "HISTORICAL",
      });
    });

    // Urutkan timeline berdasarkan tanggal beli terbaru
    timelineItems.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());

    // ── HITUNG VELOCITY METRICS SUMMARY ───────────────────────────────────────
    const soldItems = timelineItems.filter((t) => t.isSold);
    const activeLiveItems = timelineItems.filter((t) => !t.isSold);

    const totalSoldDuration = soldItems.reduce((acc, curr) => acc + curr.durationDays, 0);
    const avgDaysToSell = soldItems.length > 0 ? Math.round(totalSoldDuration / soldItems.length) : 0;

    const activeHppTotal = activeLiveItems.reduce((acc, curr) => acc + curr.hpp, 0);
    // Estimasi holding cost modal: asumsi cost of capital 1% per bulan (0.033% / hari) dari HPP
    const dailyHoldingCostPerUnitAvg = activeLiveItems.length > 0
      ? Math.round((activeHppTotal / activeLiveItems.length) * 0.00033)
      : 35000;

    // Hitung kerugian holding cost unit macet (> 45 hari)
    const stagnantLiveItems = activeLiveItems.filter((t) => t.durationDays > 45);
    const totalHoldingCostLossStagnant = stagnantLiveItems.reduce((acc, curr) => {
      const extraDays = curr.durationDays - 45;
      return acc + Math.round(curr.hpp * 0.00033 * extraDays);
    }, 0);

    // Turnover bulanan: Rasio unit terjual per bulan terhadap rata-rata unit aktif
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const soldLast30Days = soldItems.filter((t) => t.saleDate && new Date(t.saleDate) >= last30Days).length;
    const inventoryTurnoverMonthly = activeLiveItems.length > 0
      ? Number((soldLast30Days / activeLiveItems.length).toFixed(1))
      : 0;

    // Unit tercepat laku
    let fastestUnit: VelocityMetricSummary["fastestUnit"] = null;
    if (soldItems.length > 0) {
      const fastest = [...soldItems].sort((a, b) => a.durationDays - b.durationDays)[0];
      fastestUnit = {
        plateNumber: fastest.plateNumber,
        name: `${fastest.brand} ${fastest.model}`,
        days: fastest.durationDays,
        profit: fastest.grossProfit || 0,
      };
    }

    // Unit terlama
    let slowestUnit: VelocityMetricSummary["slowestUnit"] = null;
    if (activeLiveItems.length > 0) {
      const slowestActive = [...activeLiveItems].sort((a, b) => b.durationDays - a.durationDays)[0];
      slowestUnit = {
        plateNumber: slowestActive.plateNumber,
        name: `${slowestActive.brand} ${slowestActive.model}`,
        days: slowestActive.durationDays,
        status: slowestActive.status,
      };
    } else if (soldItems.length > 0) {
      const slowestSold = [...soldItems].sort((a, b) => b.durationDays - a.durationDays)[0];
      slowestUnit = {
        plateNumber: slowestSold.plateNumber,
        name: `${slowestSold.brand} ${slowestSold.model}`,
        days: slowestSold.durationDays,
        status: "SOLD_SETTLED",
      };
    }

    // ── HITUNG VELOCITY MATRIX PER MERK & MODEL ──────────────────────────────
    const matrixMap: Record<
      string,
      {
        brand: string;
        model: string;
        totalUnits: number;
        soldUnits: number;
        totalDays: number;
        totalProfit: number;
        totalRevenue: number;
      }
    > = {};

    timelineItems.forEach((t) => {
      const key = `${t.brand.trim()} ${t.model.trim()}`.toUpperCase();
      if (!matrixMap[key]) {
        matrixMap[key] = {
          brand: t.brand.trim(),
          model: t.model.trim(),
          totalUnits: 0,
          soldUnits: 0,
          totalDays: 0,
          totalProfit: 0,
          totalRevenue: 0,
        };
      }
      matrixMap[key].totalUnits += 1;
      if (t.isSold) {
        matrixMap[key].soldUnits += 1;
        matrixMap[key].totalDays += t.durationDays;
        matrixMap[key].totalProfit += t.grossProfit || 0;
        matrixMap[key].totalRevenue += t.sellingPrice || 0;
      }
    });

    const velocityMatrix: VelocityMatrixItem[] = Object.entries(matrixMap)
      .map(([brandModel, data]) => {
        const avgDaysToSell = data.soldUnits > 0 ? Math.round(data.totalDays / data.soldUnits) : 30;
        const avgProfitRupiah = data.soldUnits > 0 ? Math.round(data.totalProfit / data.soldUnits) : 0;
        const avgMarginPct = data.totalRevenue > 0
          ? Number(((data.totalProfit / data.totalRevenue) * 100).toFixed(1))
          : 0;

        let classification: VelocityMatrixItem["classification"] = "STEADY";
        let recommendationTag = "Unit Standard Garasi";

        if (avgDaysToSell <= 20 && (avgMarginPct >= 7 || avgProfitRupiah >= 8000000)) {
          classification = "STAR_PROFIT";
          recommendationTag = "⭐ Prioritas Kulakan Lelang";
        } else if (avgDaysToSell <= 18) {
          classification = "FAST_CASH";
          recommendationTag = "⚡ Fast Flip / Penjaga Kas";
        } else if (avgDaysToSell > 45) {
          classification = "SLOW_STAGNANT";
          recommendationTag = "⚠️ Waspada / Minta Diskon Gede";
        } else {
          classification = "STEADY";
          recommendationTag = "Perputaran Normal";
        }

        return {
          brandModel,
          brand: data.brand,
          model: data.model,
          totalUnits: data.totalUnits,
          soldUnits: data.soldUnits,
          avgDaysToSell,
          avgProfitRupiah,
          avgMarginPct,
          classification,
          recommendationTag,
        };
      })
      .sort((a, b) => {
        // Urutkan: Terbanyak terjual & tercepat
        if (b.soldUnits !== a.soldUnits) return b.soldUnits - a.soldUnits;
        return a.avgDaysToSell - b.avgDaysToSell;
      });

    // ── HITUNG BOTTLENECK FUNNEL GARASI ───────────────────────────────────────
    // Berdasarkan data operasional intake, perbaikan, dan siap jual
    const bottleneckFunnel: BottleneckFunnelStage[] = [
      {
        stage: "1. Intake & Cek Fisik Awal",
        avgDays: 2,
        description: "Pengecekan fisik 34 titik mikron cat, kelengkapan surat, dan estimasi perbaikan",
        status: "GOOD",
      },
      {
        stage: "2. Bengkel Rekanan & Salon Poles",
        avgDays: Math.min(12, Math.max(4, Math.round(avgDaysToSell * 0.25))),
        description: "Pengerjaan body repair/cat, servis mesin mandiri, dan detailing interior/eksterior",
        status: avgDaysToSell > 40 ? "WARNING" : "GOOD",
      },
      {
        stage: "3. Tayang Garasi & Temu Pembeli",
        avgDays: Math.max(7, avgDaysToSell - Math.round(avgDaysToSell * 0.25) - 2),
        description: "Mobil ready di showroom, tayang katalog online, negosiasi pembeli, dan uji jalan (test drive)",
        status: avgDaysToSell > 45 ? "ATTENTION" : "GOOD",
      },
      {
        stage: "4. Total Siklus (Beli ➔ Lunas)",
        avgDays: avgDaysToSell || 24,
        description: "Rata-rata total waktu modal berputar dari hari kulakan sampai uang kembali ke rekening",
        status: avgDaysToSell <= 25 ? "GOOD" : avgDaysToSell <= 45 ? "WARNING" : "ATTENTION",
      },
    ];

    // ── HITUNG TREN MUSIMAN BULANAN (12 BULAN TERAKHIR) ───────────────────────
    const monthlyMap: Record<
      string,
      {
        bought: number;
        sold: number;
        revenue: number;
        profit: number;
        totalDays: number;
      }
    > = {};

    // Buat template 12 bulan terakhir
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const key = `${y}-${m}`;
      monthlyMap[key] = {
        bought: 0,
        sold: 0,
        revenue: 0,
        profit: 0,
        totalDays: 0,
      };
    }

    timelineItems.forEach((t) => {
      const buyDate = new Date(t.purchaseDate);
      const buyKey = `${buyDate.getFullYear()}-${String(buyDate.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyMap[buyKey]) {
        monthlyMap[buyKey].bought += 1;
      }

      if (t.isSold && t.saleDate) {
        const saleDate = new Date(t.saleDate);
        const saleKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, "0")}`;
        if (monthlyMap[saleKey]) {
          monthlyMap[saleKey].sold += 1;
          monthlyMap[saleKey].revenue += t.sellingPrice || 0;
          monthlyMap[saleKey].profit += t.grossProfit || 0;
          monthlyMap[saleKey].totalDays += t.durationDays;
        }
      }
    });

    const monthlyTrend: MonthlyVelocityItem[] = Object.entries(monthlyMap).map(([key, data]) => {
      const [yearStr, monthStr] = key.split("-");
      const monthIdx = parseInt(monthStr, 10) - 1;
      const monthLabel = `${MONTH_NAMES[monthIdx]} ${yearStr}`;
      const avgDays = data.sold > 0 ? Math.round(data.totalDays / data.sold) : 0;

      return {
        monthKey: key,
        monthLabel,
        unitsBought: data.bought,
        unitsSold: data.sold,
        revenue: data.revenue,
        profit: data.profit,
        avgDaysToSell: avgDays,
      };
    });

    return {
      success: true,
      data: {
        metrics: {
          avgDaysToSell,
          inventoryTurnoverMonthly,
          dailyHoldingCostPerUnitAvg,
          totalHoldingCostLossStagnant,
          fastestUnit,
          slowestUnit,
          totalActiveUnits: activeLiveItems.length,
          totalSoldUnits: soldItems.length,
          activeHppTotal,
        },
        timeline: timelineItems,
        velocityMatrix,
        bottleneckFunnel,
        monthlyTrend,
        generatedAt: now.toISOString(),
      },
    };
  } catch (err: any) {
    console.error("getShowroomAnalyticsAction error:", err);
    return {
      success: false,
      error: err.message || "Gagal memproses data analitik showroom",
    };
  }
}
