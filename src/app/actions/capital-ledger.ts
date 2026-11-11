"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import {
  capitalLedgerSchema,
  withdrawInvestorCapitalSchema,
  type CapitalLedgerInput,
  type WithdrawInvestorCapitalInput,
} from "@/lib/validations/capital-ledger";
import { formatRupiah } from "@/lib/utils";
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
    proofUrl?: string | null;
    createdAt?: Date;
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

  const requestedAt = params.createdAt ? params.createdAt.getTime() : Date.now();
  const minNextAt = latestLedger
    ? new Date(latestLedger.createdAt).getTime() + 1
    : 0;
  const entryCreatedAt = new Date(Math.max(requestedAt, minNextAt));

  // Buat entri CapitalLedger
  const entry = await tx.capitalLedger.create({
    data: {
      investorId: params.investorId,
      type: params.type,
      amount: amt.abs(),
      vehicleId: params.vehicleId || null,
      runningBalance: newRunningBalance,
      notes: params.notes || null,
      proofUrl: params.proofUrl || null,
      createdAt: entryCreatedAt,
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
  actorUserId?: string
) {
  try {
    const session = await requireRole(["OWNER", "ADMIN"]);
    const resolvedActorId = actorUserId && actorUserId !== "system" ? actorUserId : session.userId;
    const validated = capitalLedgerSchema.parse(input);
    const amt = new Decimal(validated.amount);
    const txDate = validated.depositDate ? new Date(validated.depositDate) : new Date();

    // Resolve proofUrl: bisa satu atau beberapa URL yang di-serialize sebagai JSON string
    let resolvedProofUrl: string | null = null;
    if (validated.proofUrls && validated.proofUrls.length > 0) {
      resolvedProofUrl = JSON.stringify(validated.proofUrls);
    } else if (validated.proofUrl) {
      resolvedProofUrl = validated.proofUrl;
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Tulis CapitalLedger DEPOSIT
      const ledgerEntry = await recordCapitalLedgerEntry(tx, {
        investorId: validated.investorId,
        type: "DEPOSIT",
        amount: amt,
        vehicleId: validated.vehicleId,
        notes: validated.notes || "Setoran modal baru investor",
        proofUrl: resolvedProofUrl,
        createdAt: txDate,
        createdBy: session.fullName || resolvedActorId,
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
          proofUrl: resolvedProofUrl,
          createdAt: txDate,
          createdBy: session.fullName || resolvedActorId,
        },
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: resolvedActorId,
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

    revalidatePath("/admin/investors");
    revalidatePath("/admin/investors/accounts");
    revalidatePath("/admin/finance");
    revalidatePath("/investor");
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mencatat setoran modal" };
  }
}

/**
 * Server Action: Penarikan / Pencairan Dana Modal & Profit Pemodal ke Rekening Pemodal.
 * Memotong saldo bebas CapitalLedger dan saldo kas rekening CashTransaction secara atomik.
 */
export async function withdrawInvestorCapital(
  input: WithdrawInvestorCapitalInput,
  actorUserId?: string
) {
  try {
    const session = await requireRole(["OWNER", "ADMIN"]);
    const resolvedActorId = actorUserId && actorUserId !== "system" ? actorUserId : session.userId;
    const actorLabel = session.fullName || resolvedActorId;
    const validated = withdrawInvestorCapitalSchema.parse(input);
    const amt = new Decimal(validated.amount);
    const txDate = validated.withdrawalDate ? new Date(validated.withdrawalDate) : new Date();

    let resolvedProofUrl: string | null = null;
    if (validated.proofUrls && validated.proofUrls.length > 0) {
      resolvedProofUrl = JSON.stringify(validated.proofUrls);
    } else if (validated.proofUrl) {
      resolvedProofUrl = validated.proofUrl;
    }

    const result = await prisma.$transaction(async (tx) => {
      const investor = await tx.investor.findUnique({
        where: { id: validated.investorId },
      });
      if (!investor) {
        throw new Error("Akun investor tidak ditemukan.");
      }

      // 1. Cek kecukupan saldo bebas investor
      const latestLedger = await tx.capitalLedger.findFirst({
        where: { investorId: validated.investorId },
        orderBy: { createdAt: "desc" },
      });
      const prevInvestorBalance = latestLedger
        ? new Decimal(latestLedger.runningBalance.toString())
        : new Decimal(0);

      if (prevInvestorBalance.lt(amt)) {
        throw new Error(
          `Saldo bebas ${investor.name} tidak mencukupi untuk dicairkan (Tersedia: ${formatRupiah(prevInvestorBalance.toNumber())}, Diminta: ${formatRupiah(amt.toNumber())}).`
        );
      }

      // 2. Cek kecukupan saldo kas rekening showroom
      const latestCash = await tx.cashTransaction.findFirst({
        orderBy: { createdAt: "desc" },
      });
      const prevCashBalance = latestCash
        ? new Decimal(latestCash.runningBalance.toString())
        : new Decimal(0);

      if (prevCashBalance.lt(amt)) {
        throw new Error(
          `Saldo kas rekening showroom tidak mencukupi untuk transfer pencairan ini (Kas tersedia: ${formatRupiah(prevCashBalance.toNumber())}, Diminta: ${formatRupiah(amt.toNumber())}).`
        );
      }

      const categoryLabel =
        validated.withdrawalCategory === "PROFIT_WITHDRAWAL"
          ? "Pencairan Laba / Profit"
          : "Pengembalian Pokok Modal";
      const ledgerNotes = `[PENARIKAN DANA - ${categoryLabel}] ${validated.notes?.trim() || `Transfer balik ke ${investor.name}`}`;

      // 3. Catat pengurangan CapitalLedger (CORRECTION bernilai negatif)
      const ledgerEntry = await recordCapitalLedgerEntry(tx, {
        investorId: validated.investorId,
        type: "CORRECTION",
        amount: amt.negated(),
        notes: ledgerNotes,
        proofUrl: resolvedProofUrl,
        createdAt: txDate,
        createdBy: actorLabel,
      });

      // 4. Catat kas keluar di CashTransaction dengan timestamp monotonik
      const cashTime = Math.max(
        txDate.getTime(),
        latestCash ? new Date(latestCash.createdAt).getTime() + 1 : 0
      );
      const newCashBalance = prevCashBalance.minus(amt);
      const cashType =
        validated.withdrawalCategory === "PROFIT_WITHDRAWAL"
          ? "OUT_PROFIT_DISTRIBUTION"
          : "OUT_CAPITAL_RETURN";

      const cashEntry = await tx.cashTransaction.create({
        data: {
          type: cashType,
          amount: amt,
          relatedLedgerId: ledgerEntry.id,
          runningBalance: newCashBalance,
          notes: `${categoryLabel} kepada ${investor.name}${validated.notes ? `: ${validated.notes}` : ""}`,
          proofUrl: resolvedProofUrl,
          createdAt: new Date(cashTime),
          createdBy: actorLabel,
        },
      });

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: resolvedActorId,
          action: "CREATE",
          entityType: "CapitalLedger",
          entityId: ledgerEntry.id,
          afterData: JSON.parse(
            JSON.stringify({
              investorName: investor.name,
              withdrawalCategory: validated.withdrawalCategory,
              amount: amt.toNumber(),
              ledger: ledgerEntry,
              cash: cashEntry,
            })
          ),
        },
      });

      return {
        ledgerEntry,
        cashEntry,
        newInvestorBalance: prevInvestorBalance.minus(amt).toNumber(),
      };
    });

    revalidatePath("/admin/investors");
    revalidatePath("/admin/investors/accounts");
    revalidatePath("/admin/finance");
    revalidatePath("/investor");
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal mencatat pencairan dana pemodal",
    };
  }
}
