"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { capitalLedgerSchema, CapitalLedgerInput } from "@/lib/validations/capital-ledger";
import Decimal from "decimal.js";

/**
 * Service function untuk mencatat mutasi CapitalLedger dengan update running balance deterministik.
 * Wajib dijalankan di dalam interactive database transaction (tx).
 */
export async function recordCapitalLedgerEntry(
  tx: any,
  params: {
    investorId: string;
    type: "DEPOSIT" | "ALLOCATED" | "RETURNED" | "PROFIT_PAID" | "CORRECTION";
    amount: Decimal | number | string;
    vehicleId?: string | null;
    notes?: string | null;
    createdBy?: string;
  }
) {
  const amt = new Decimal(params.amount.toString());
  const createdBy = params.createdBy || "system";

  // Ambil saldo berjalan terakhir milik investor ini
  const latestLedger = await tx.capitalLedger.findFirst({
    where: { investorId: params.investorId },
    orderBy: { createdAt: "desc" },
  });

  const previousBalance = latestLedger
    ? new Decimal(latestLedger.runningBalance.toString())
    : new Decimal(0);

  // Tentukan delta terhadap saldo berjalan:
  // DEPOSIT: + (investor menyetor modal baru)
  // ALLOCATED: - (modal dialokasikan/terikat ke unit mobil)
  // RETURNED: + (pokok modal kembali dari penjualan mobil lunas)
  // PROFIT_PAID: + (bagi hasil keuntungan masuk ke saldo investor)
  // CORRECTION: disesuaikan dengan notes / tanda
  let delta: Decimal;
  switch (params.type) {
    case "DEPOSIT":
    case "RETURNED":
    case "PROFIT_PAID":
      delta = amt;
      break;
    case "ALLOCATED":
      delta = amt.negated();
      break;
    case "CORRECTION":
      delta = amt; // Nilai bisa positif atau negatif dari pemanggil
      break;
    default:
      delta = amt;
  }

  const newRunningBalance = previousBalance.plus(delta);

  // Buat entri CapitalLedger
  const entry = await tx.capitalLedger.create({
    data: {
      investorId: params.investorId,
      type: params.type,
      amount: amt.abs(),
      vehicleId: params.vehicleId || null,
      runningBalance: newRunningBalance,
      notes: params.notes || null,
      createdBy,
    },
  });

  return entry;
}

/**
 * Server Action: Mencatat Setoran Modal Baru dari Investor
 * Menulis CapitalLedger (DEPOSIT) dan berpasangan dengan CashTransaction (IN_CAPITAL_DEPOSIT).
 */
export async function depositInvestorCapital(
  input: CapitalLedgerInput,
  actorUserId: string = "system"
) {
  try {
    const validated = capitalLedgerSchema.parse(input);
    const amt = new Decimal(validated.amount);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Tulis CapitalLedger DEPOSIT
      const ledgerEntry = await recordCapitalLedgerEntry(tx, {
        investorId: validated.investorId,
        type: "DEPOSIT",
        amount: amt,
        vehicleId: validated.vehicleId,
        notes: validated.notes || "Setoran modal baru investor",
        createdBy: actorUserId,
      });

      // 2. Ambil saldo berjalan kas umum terakhir
      const latestCash = await tx.cashTransaction.findFirst({
        orderBy: { createdAt: "desc" },
      });
      const prevCashBalance = latestCash
        ? new Decimal(latestCash.runningBalance.toString())
        : new Decimal(0);
      const newCashBalance = prevCashBalance.plus(amt);

      // 3. Tulis CashTransaction IN_CAPITAL_DEPOSIT yang berpasangan
      const cashEntry = await tx.cashTransaction.create({
        data: {
          type: "IN_CAPITAL_DEPOSIT",
          amount: amt,
          relatedVehicleId: validated.vehicleId || null,
          relatedLedgerId: ledgerEntry.id,
          runningBalance: newCashBalance,
          notes: `Setoran modal dari investor (Ref Ledger: ${ledgerEntry.id})`,
          createdBy: actorUserId,
        },
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId,
          action: "CREATE",
          entityType: "CapitalLedger",
          entityId: ledgerEntry.id,
          afterData: {
            ledger: ledgerEntry,
            cash: cashEntry,
          } as any,
        },
      });

      return { ledgerEntry, cashEntry };
    });

    revalidatePath("/admin/finance");
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mencatat setoran modal" };
  }
}
