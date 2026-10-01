"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  operationalExpenseSchema,
  OperationalExpenseInput,
  ownerDrawSchema,
  OwnerDrawInput,
  ownerEquitySchema,
  OwnerEquityInput,
} from "@/lib/validations/operational-expense";
import Decimal from "decimal.js";

export async function getOperationalExpensesSummary() {
  try {
    const expenses = await prisma.operationalExpense.findMany({
      orderBy: { date: "desc" },
    });

    const totalOperational = expenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0
    );

    // Ambil transaksi Prive Owner dari CashTransaction
    const ownerDraws = await prisma.cashTransaction.findMany({
      where: { type: "OUT_OWNER_DRAW" },
      orderBy: { createdAt: "desc" },
    });

    const totalOwnerDraw = ownerDraws.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );

    // Ambil setoran modal pribadi Owner dari CashTransaction
    const ownerEquities = await prisma.cashTransaction.findMany({
      where: { type: "IN_OWNER_EQUITY" },
      orderBy: { createdAt: "desc" },
    });

    const totalOwnerEquity = ownerEquities.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );

    return {
      success: true,
      data: {
        operationalExpenses: expenses.map((e) => ({
          id: e.id,
          category: e.category,
          recipient: e.recipient,
          amount: Number(e.amount),
          date: e.date,
          notes: e.notes,
          receiptUrl: e.receiptUrl,
          createdAt: e.createdAt,
        })),
        ownerDraws: ownerDraws.map((d) => ({
          id: d.id,
          amount: Number(d.amount),
          notes: d.notes,
          createdAt: d.createdAt,
          runningBalance: Number(d.runningBalance),
        })),
        ownerEquities: ownerEquities.map((eq) => ({
          id: eq.id,
          amount: Number(eq.amount),
          notes: eq.notes,
          createdAt: eq.createdAt,
          runningBalance: Number(eq.runningBalance),
        })),
        totalOperational,
        totalOwnerDraw,
        totalOwnerEquity,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal mengambil ringkasan pengeluaran operasional & prive",
    };
  }
}

export async function recordOperationalExpense(
  input: OperationalExpenseInput,
  actorUserId: string = "system"
) {
  try {
    const validated = operationalExpenseSchema.parse(input);
    const amt = new Decimal(validated.amount);

    const result = await prisma.$transaction(async (tx) => {
      const latestTx = await tx.cashTransaction.findFirst({
        orderBy: { createdAt: "desc" },
      });
      const prevBal = latestTx ? new Decimal(latestTx.runningBalance.toString()) : new Decimal(0);
      const newBal = prevBal.minus(amt);

      const cashEntry = await tx.cashTransaction.create({
        data: {
          type: "OUT_OPERATIONAL",
          amount: amt,
          runningBalance: newBal,
          notes: `Beban Operasional: [${validated.category}] ${validated.notes || ""} ${validated.recipient ? `(Penerima: ${validated.recipient})` : ""}`.trim(),
          createdBy: actorUserId,
        },
      });

      const opExpense = await tx.operationalExpense.create({
        data: {
          category: validated.category,
          recipient: validated.recipient || null,
          amount: amt,
          date: validated.date,
          notes: validated.notes || null,
          receiptUrl: validated.receiptUrl || null,
          createdBy: actorUserId,
          cashTransactionId: cashEntry.id,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId,
          action: "CREATE",
          entityType: "OperationalExpense",
          entityId: opExpense.id,
          afterData: opExpense as any,
        },
      });

      return opExpense;
    });

    revalidatePath("/admin/finance");
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal mencatat beban operasional",
    };
  }
}

export async function recordOwnerDraw(
  input: OwnerDrawInput,
  actorUserId: string = "system"
) {
  try {
    const validated = ownerDrawSchema.parse(input);
    const amt = new Decimal(validated.amount);

    const result = await prisma.$transaction(async (tx) => {
      const latestTx = await tx.cashTransaction.findFirst({
        orderBy: { createdAt: "desc" },
      });
      const prevBal = latestTx ? new Decimal(latestTx.runningBalance.toString()) : new Decimal(0);
      const newBal = prevBal.minus(amt);

      const cashEntry = await tx.cashTransaction.create({
        data: {
          type: "OUT_OWNER_DRAW",
          amount: amt,
          runningBalance: newBal,
          notes: `Prive Pribadi Owner: ${validated.notes}`,
          createdBy: actorUserId,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId,
          action: "CREATE",
          entityType: "CashTransaction:OwnerDraw",
          entityId: cashEntry.id,
          afterData: cashEntry as any,
        },
      });

      return cashEntry;
    });

    revalidatePath("/admin/finance");
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal mencatat penarikan pribadi (Prive)",
    };
  }
}

export async function recordOwnerEquity(
  input: OwnerEquityInput,
  actorUserId: string = "system"
) {
  try {
    const validated = ownerEquitySchema.parse(input);
    const amt = new Decimal(validated.amount);

    const result = await prisma.$transaction(async (tx) => {
      const latestTx = await tx.cashTransaction.findFirst({
        orderBy: { createdAt: "desc" },
      });
      const prevBal = latestTx ? new Decimal(latestTx.runningBalance.toString()) : new Decimal(0);
      const newBal = prevBal.plus(amt);

      const cashEntry = await tx.cashTransaction.create({
        data: {
          type: "IN_OWNER_EQUITY",
          amount: amt,
          runningBalance: newBal,
          notes: `Setoran Modal Tambahan Pribadi Owner: ${validated.notes || "Setoran kas"}`,
          createdBy: actorUserId,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId,
          action: "CREATE",
          entityType: "CashTransaction:OwnerEquity",
          entityId: cashEntry.id,
          afterData: cashEntry as any,
        },
      });

      return cashEntry;
    });

    revalidatePath("/admin/finance");
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal mencatat setoran modal pribadi",
    };
  }
}
