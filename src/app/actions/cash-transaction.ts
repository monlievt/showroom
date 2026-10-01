"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cashTransactionSchema, CashTransactionInput } from "@/lib/validations/cash-transaction";
import Decimal from "decimal.js";

export async function getCashBalanceSummary() {
  try {
    const latestTx = await prisma.cashTransaction.findFirst({
      orderBy: { createdAt: "desc" },
    });

    const currentBalance = latestTx ? Number(latestTx.runningBalance) : 0;

    // Hitung total kas masuk dan kas keluar
    const allTransactions = await prisma.cashTransaction.findMany({
      select: {
        type: true,
        amount: true,
      },
    });

    let totalIn = new Decimal(0);
    let totalOut = new Decimal(0);

    for (const tx of allTransactions) {
      const amt = new Decimal(tx.amount.toString());
      if (
        tx.type === "IN_SALE_PAYMENT" ||
        tx.type === "IN_CAPITAL_DEPOSIT" ||
        tx.type === "IN_OWNER_EQUITY"
      ) {
        totalIn = totalIn.plus(amt);
      } else if (
        tx.type === "OUT_VEHICLE_PURCHASE" ||
        tx.type === "OUT_EXPENSE" ||
        tx.type === "OUT_OPERATIONAL" ||
        tx.type === "OUT_OWNER_DRAW" ||
        tx.type === "OUT_ASSET_PURCHASE" ||
        tx.type === "OUT_CAPITAL_RETURN" ||
        tx.type === "OUT_PROFIT_DISTRIBUTION"
      ) {
        totalOut = totalOut.plus(amt);
      }
    }

    return {
      success: true,
      data: {
        currentBalance,
        totalIn: totalIn.toNumber(),
        totalOut: totalOut.toNumber(),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mengambil ringkasan kas" };
  }
}

/**
 * Mengambil daftar mutasi kas dengan cursor-based pagination (ARCHITECTURE.md §14.5)
 */
export async function getCashTransactions(params?: {
  cursor?: string;
  take?: number;
  type?: string;
}) {
  try {
    const take = params?.take ? Math.min(params.take, 100) : 20;

    const where: any = {};
    if (params?.type) {
      where.type = params.type;
    }

    const transactions = await prisma.cashTransaction.findMany({
      where,
      take: take + 1,
      cursor: params?.cursor ? { id: params.cursor } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        relatedVehicle: {
          select: {
            plateNumber: true,
            brand: true,
            model: true,
          },
        },
        relatedSale: {
          select: {
            id: true,
            sellingPrice: true,
          },
        },
        relatedExpense: {
          select: {
            category: true,
            amount: true,
          },
        },
      },
    });

    let nextCursor: string | null = null;
    let items = transactions;

    if (transactions.length > take) {
      const nextItem = items.pop();
      nextCursor = nextItem ? nextItem.id : null;
    }

    return {
      success: true,
      data: {
        items: items.map((tx) => ({
          id: tx.id,
          type: tx.type,
          amount: Number(tx.amount),
          runningBalance: Number(tx.runningBalance),
          notes: tx.notes,
          createdAt: tx.createdAt,
          createdBy: tx.createdBy,
          vehiclePlate: tx.relatedVehicle?.plateNumber,
          vehicleName: tx.relatedVehicle
            ? `${tx.relatedVehicle.brand} ${tx.relatedVehicle.model}`
            : undefined,
          expenseCategory: tx.relatedExpense?.category,
        })),
        nextCursor,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mengambil daftar kas" };
  }
}

export async function recordManualCashTransaction(
  input: CashTransactionInput,
  actorUserId: string = "system"
) {
  try {
    const validated = cashTransactionSchema.parse(input);
    const amt = new Decimal(validated.amount);

    const result = await prisma.$transaction(async (tx) => {
      const latestTx = await tx.cashTransaction.findFirst({
        orderBy: { createdAt: "desc" },
      });

      const prevBalance = latestTx
        ? new Decimal(latestTx.runningBalance.toString())
        : new Decimal(0);

      const isIncoming =
        validated.type === "IN_SALE_PAYMENT" ||
        validated.type === "IN_CAPITAL_DEPOSIT" ||
        validated.type === "IN_OWNER_EQUITY";

      const newBalance = isIncoming ? prevBalance.plus(amt) : prevBalance.minus(amt);

      const cashEntry = await tx.cashTransaction.create({
        data: {
          type: validated.type,
          amount: amt,
          relatedVehicleId: validated.relatedVehicleId || null,
          relatedSaleId: validated.relatedSaleId || null,
          relatedExpenseId: validated.relatedExpenseId || null,
          relatedLedgerId: validated.relatedLedgerId || null,
          runningBalance: newBalance,
          notes: validated.notes || null,
          createdBy: actorUserId,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId,
          action: "CREATE",
          entityType: "CashTransaction",
          entityId: cashEntry.id,
          afterData: cashEntry as any,
        },
      });

      return cashEntry;
    });

    revalidatePath("/admin/finance");
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mencatat transaksi kas" };
  }
}
