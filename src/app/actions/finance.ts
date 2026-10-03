"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  calculateProfitDistribution,
  InvestmentData,
  RuleData,
} from "@/lib/calculations/profit-share";
import { recordCapitalLedgerEntry } from "./capital-ledger";
import Decimal from "decimal.js";

export async function getFinanceSummary() {
  try {
    // 1. Total modal saat ini di kas umum
    const latestCash = await prisma.cashTransaction.findFirst({
      orderBy: { createdAt: "desc" },
    });
    const cashBalance = latestCash ? Number(latestCash.runningBalance) : 0;

    // 2. Total modal investor yang sedang terikat di unit (VehicleInvestment pada unit aktif)
    const activeInvestments = await prisma.vehicleInvestment.findMany({
      where: {
        vehicle: {
          status: {
            in: ["INTAKE", "IN_REPAIR", "READY_FOR_SALE", "BOOKED", "AT_SHOWROOM_PENDING"],
          },
        },
      },
      select: {
        capitalShare: true,
      },
    });

    const activeAllocatedCapital = activeInvestments.reduce(
      (sum, inv) => sum + Number(inv.capitalShare),
      0
    );

    // 3. Total profit yang sudah dibagikan
    const paidDistributions = await prisma.profitDistribution.findMany({
      where: {
        calculatedAmount: { gt: 0 },
      },
      select: {
        calculatedAmount: true,
        beneficiaryType: true,
      },
    });

    let totalProfitPaid = 0;
    let totalOwnerProfit = 0;
    let totalInvestorProfit = 0;

    for (const d of paidDistributions) {
      const amt = Number(d.calculatedAmount);
      totalProfitPaid += amt;
      if (d.beneficiaryType === "OWNER") {
        totalOwnerProfit += amt;
      } else {
        totalInvestorProfit += amt;
      }
    }

    // 4. Hitung unit yang siap dibagikan labanya (sudah lunas tapi belum dieksekusi)
    const sales = await prisma.sale.findMany({
      include: {
        payments: true,
        distributions: true,
        vehicle: {
          select: {
            plateNumber: true,
            brand: true,
            model: true,
          },
        },
      },
    });

    const pendingDistributions = sales.filter((s) => {
      const paid = s.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const isLunas = paid >= Number(s.sellingPrice);
      const hasDistributed = s.distributions.length > 0 && !s.distributions[0].notes?.includes("[REVERSED]");
      return isLunas && !hasDistributed;
    });

    // 5. Total Nilai Stok Dagangan (Inventory Mobil Aktif)
    const activeVehicles = await prisma.vehicle.findMany({
      where: {
        status: { in: ["INTAKE", "IN_REPAIR", "READY_FOR_SALE", "BOOKED", "AT_SHOWROOM_PENDING"] },
      },
      select: {
        purchasePrice: true,
        expenses: {
          select: { amount: true },
        },
      },
    });

    const totalInventoryValue = activeVehicles.reduce((sum, v) => {
      const expTotal = v.expenses.reduce((eSum, e) => eSum + Number(e.amount), 0);
      return sum + Number(v.purchasePrice) + expTotal;
    }, 0);

    // 6. Total Nilai Aset Tetap Showroom (Peralatan & Fasilitas)
    const allAssets = await prisma.showroomAsset.findMany();
    const totalAssetValue = allAssets.reduce(
      (sum, a) => sum + Number(a.currentValue ?? a.purchaseCost),
      0
    );

    // 7. Total Biaya Operasional Showroom
    const allOpEx = await prisma.operationalExpense.findMany();
    const totalOperationalExpenses = allOpEx.reduce((sum, e) => sum + Number(e.amount), 0);

    // 8. Total Prive (Penarikan Pribadi Owner)
    const allOwnerDraws = await prisma.cashTransaction.findMany({
      where: { type: "OUT_OWNER_DRAW" },
      select: { amount: true },
    });
    const totalOwnerDraw = allOwnerDraws.reduce((sum, d) => sum + Number(d.amount), 0);

    // 9. Total Injeksi Modal Pribadi
    const allOwnerEquity = await prisma.cashTransaction.findMany({
      where: { type: "IN_OWNER_EQUITY" },
      select: { amount: true },
    });
    const totalOwnerEquity = allOwnerEquity.reduce((sum, eq) => sum + Number(eq.amount), 0);

    return {
      success: true,
      data: {
        cashBalance,
        activeAllocatedCapital,
        totalProfitPaid,
        totalOwnerProfit,
        totalInvestorProfit,
        pendingDistributionsCount: pendingDistributions.length,
        totalInventoryValue,
        totalAssetValue,
        totalOperationalExpenses,
        totalOwnerDraw,
        totalOwnerEquity,
        activeVehiclesCount: activeVehicles.length,
        assetsCount: allAssets.length,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mengambil ringkasan keuangan" };
  }
}

/**
 * Eksekusi Pembagian Laba Penjualan Unit Mobil (PRD.md §4 & ARCHITECTURE.md §4)
 * - Hanya dieksekusi jika SUM(payments) >= sellingPrice.
 * - Snapshot permanen disimpan di ProfitDistribution.
 * - Mutasi CapitalLedger untuk pokok modal (RETURNED) dan profit (PROFIT_PAID).
 * - Rugi: 100% pokok modal investor kembali, kerugian 100% diserap akun Owner.
 */
export async function executeProfitDistribution(
  saleId: string,
  actorUserId: string = "system"
) {
  try {
    // 1. Ambil data penjualan lengkap
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        payments: true,
        distributions: true,
        vehicle: {
          include: {
            expenses: true,
            investments: {
              include: {
                investor: true,
              },
            },
          },
        },
      },
    });

    if (!sale) throw new Error("Data penjualan tidak ditemukan");

    // Cek apakah sudah pernah didistribusikan (dan belum di-reverse)
    const activeDists = sale.distributions.filter(
      (d) => !d.notes?.includes("[REVERSED]")
    );
    if (activeDists.length > 0) {
      throw new Error("Distribusi laba untuk transaksi penjualan ini sudah pernah dieksekusi");
    }

    // 2. Ambil aturan bagi hasil aktif
    const activeRules = await prisma.profitShareRule.findMany({
      where: { active: true },
      orderBy: { minProfit: "asc" },
    });

    const ruleData: RuleData[] = activeRules.map((r) => ({
      id: r.id,
      name: r.name,
      minProfit: r.minProfit,
      maxProfit: r.maxProfit,
      amountPerPerson: r.amountPerPerson,
      numberOfPeople: r.numberOfPeople,
      active: r.active,
    }));

    // 3. Siapkan data investasi (dengan fallback ke defaultProfitSharePercent milik investor jika per-unit belum diset)
    const investmentData: InvestmentData[] = sale.vehicle.investments.map((inv) => {
      const explicitPercent = Number(inv.profitSharePercent);
      const effectivePercent =
        explicitPercent > 0
          ? inv.profitSharePercent
          : inv.investor.defaultProfitSharePercent
          ? inv.investor.defaultProfitSharePercent
          : inv.profitSharePercent;

      return {
        investorId: inv.investorId,
        investorName: inv.investor.name,
        investorType: inv.investor.type,
        capitalShare: inv.capitalShare,
        profitSharePercent: effectivePercent,
      };
    });

    const totalPaid = sale.payments.reduce(
      (sum, p) => sum.plus(new Decimal(p.amount.toString())),
      new Decimal(0)
    );

    // 4. Hitung distribusi lewat engine deterministik
    const calcResult = calculateProfitDistribution({
      sellingPrice: sale.sellingPrice,
      paidAmount: totalPaid,
      purchasePrice: sale.vehicle.purchasePrice,
      expenses: sale.vehicle.expenses.map((e) => ({ amount: e.amount })),
      investments: investmentData,
      rules: ruleData,
    });

    // 5. Eksekusi database transaction
    const execution = await prisma.$transaction(async (tx) => {
      const createdDistributions = [];

      for (const item of calcResult.distributions) {
        const dist = await tx.profitDistribution.create({
          data: {
            saleId: sale.id,
            investorId: item.investorId,
            beneficiaryType: item.beneficiaryType,
            beneficiaryName: item.beneficiaryName,
            grossProfitAtCalc: item.grossProfitAtCalc,
            totalUnitCapitalAtCalc: item.totalUnitCapitalAtCalc,
            investorCapitalAtCalc: item.investorCapitalAtCalc,
            agreedPercentAtCalc: item.agreedPercentAtCalc,
            ruleVersionId: item.ruleVersionId,
            calculatedAmount: item.calculatedAmount,
            isPaid: true,
            paidAt: new Date(),
            notes: item.notes,
          },
        });
        createdDistributions.push(dist);

        // Jika ada pokok modal yang kembali (returnedCapital) dan ada investorId
        if (item.investorId && item.returnedCapital && item.returnedCapital.gt(0)) {
          await recordCapitalLedgerEntry(tx, {
            investorId: item.investorId,
            type: "RETURNED",
            amount: item.returnedCapital,
            vehicleId: sale.vehicleId,
            notes: `Pengembalian 100% pokok modal unit ${sale.vehicle.plateNumber} (Sale: ${sale.id})`,
            createdBy: actorUserId,
          });
        }

        // Jika ada bagi hasil keuntungan untuk investor (> 0)
        if (
          item.investorId &&
          item.calculatedAmount.gt(0) &&
          item.beneficiaryType === "INVESTOR_EXTERNAL"
        ) {
          await recordCapitalLedgerEntry(tx, {
            investorId: item.investorId,
            type: "PROFIT_PAID",
            amount: item.calculatedAmount,
            vehicleId: sale.vehicleId,
            notes: `Pembagian laba hasil penjualan unit ${sale.vehicle.plateNumber} (${item.agreedPercentAtCalc}% porsi modal)`,
            createdBy: actorUserId,
          });
        }
      }

      // Pastikan status kendaraan adalah SOLD_SETTLED
      await tx.vehicle.update({
        where: { id: sale.vehicleId },
        data: { status: "SOLD_SETTLED" },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId,
          action: "CREATE",
          entityType: "ProfitDistribution",
          entityId: sale.id,
          afterData: createdDistributions as any,
        },
      });

      return createdDistributions;
    });

    revalidatePath("/admin/finance");
    revalidatePath("/admin/sales");
    return { success: true, data: execution };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mengeksekusi pembagian laba" };
  }
}

/**
 * Reversal / Koreksi Distribusi Laba (ARCHITECTURE.md §13)
 * Menjalankan rollback eksplisit tanpa hard delete:
 * 1. AuditLog: REVERSAL_INITIATED
 * 2. Balikkan mutasi CapitalLedger dengan entri CORRECTION bertanda negatif
 * 3. Set ProfitDistribution.isPaid = false & tandai [REVERSED]
 * 4. AuditLog: REVERSAL_COMPLETED
 */
export async function reverseDistribution(
  saleId: string,
  actorUserId: string = "system"
) {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        distributions: true,
        vehicle: true,
      },
    });

    if (!sale) throw new Error("Data penjualan tidak ditemukan");

    const activeDists = sale.distributions.filter(
      (d) => !d.notes?.includes("[REVERSED]")
    );

    if (activeDists.length === 0) {
      throw new Error("Tidak ada distribusi aktif untuk di-reverse pada transaksi ini");
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. AuditLog: REVERSAL_INITIATED
      await tx.auditLog.create({
        data: {
          actorUserId,
          action: "REVERSAL_INITIATED",
          entityType: "ProfitDistribution",
          entityId: sale.id,
          beforeData: activeDists as any,
        },
      });

      // 2. Balikkan setiap distribusi yang pernah dicatat
      for (const dist of activeDists) {
        // Balikkan modal pokok & profit yang sempat dicatat ke CapitalLedger
        if (dist.investorId) {
          const amt = new Decimal(dist.calculatedAmount.toString());
          if (amt.gt(0)) {
            await recordCapitalLedgerEntry(tx, {
              investorId: dist.investorId,
              type: "CORRECTION",
              amount: amt.negated(),
              vehicleId: sale.vehicleId,
              notes: `[REVERSAL] Koreksi pembatalan profit unit ${sale.vehicle.plateNumber}`,
              createdBy: actorUserId,
            });
          }

          if (dist.investorCapitalAtCalc && new Decimal(dist.investorCapitalAtCalc.toString()).gt(0)) {
            const cap = new Decimal(dist.investorCapitalAtCalc.toString());
            await recordCapitalLedgerEntry(tx, {
              investorId: dist.investorId,
              type: "CORRECTION",
              amount: cap.negated(),
              vehicleId: sale.vehicleId,
              notes: `[REVERSAL] Koreksi pengembalian modal unit ${sale.vehicle.plateNumber}`,
              createdBy: actorUserId,
            });
          }
        }

        // Update status distribusi lama
        await tx.profitDistribution.update({
          where: { id: dist.id },
          data: {
            isPaid: false,
            notes: `[REVERSED] ${dist.notes || ""}`,
          },
        });
      }

      // 3. AuditLog: REVERSAL_COMPLETED
      await tx.auditLog.create({
        data: {
          actorUserId,
          action: "REVERSAL_COMPLETED",
          entityType: "ProfitDistribution",
          entityId: sale.id,
        },
      });

      return { reversedCount: activeDists.length };
    });

    revalidatePath("/admin/finance");
    revalidatePath("/admin/sales");
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal melakukan reversal distribusi" };
  }
}

export async function getDistributionsHistory() {
  try {
    const distributions = await prisma.profitDistribution.findMany({
      include: {
        investor: true,
        sale: {
          include: {
            vehicle: true,
            buyer: true,
          },
        },
      },
      orderBy: { calculatedAt: "desc" },
    });

    return {
      success: true,
      data: distributions.map((d) => ({
        id: d.id,
        saleId: d.saleId,
        vehiclePlate: d.sale.vehicle.plateNumber,
        vehicleName: `${d.sale.vehicle.brand} ${d.sale.vehicle.model}`,
        buyerName: d.sale.buyer.name,
        beneficiaryType: d.beneficiaryType,
        beneficiaryName: d.beneficiaryName || d.investor?.name || "Owner",
        grossProfitAtCalc: Number(d.grossProfitAtCalc),
        calculatedAmount: Number(d.calculatedAmount),
        isPaid: d.isPaid,
        calculatedAt: d.calculatedAt,
        notes: d.notes,
      })),
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mengambil riwayat distribusi laba" };
  }
}
