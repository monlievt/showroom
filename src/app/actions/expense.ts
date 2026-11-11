e"use server";

import { revalidatePath } from "next/cache";
import Decimal from "decimal.js";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { parseProofUrls } from "@/lib/utils";
import {
  createExpenseSchema,
  updateExpenseSchema,
  type CreateExpenseInput,
  type UpdateExpenseInput,
} from "@/lib/validations/expense";

type PrismaTx = Prisma.TransactionClient;

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function revalidateExpensePaths(vehicleId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/inventory");
  revalidatePath(`/admin/inventory/${vehicleId}/expenses/new`);
  revalidatePath("/admin/finance");
  revalidatePath("/admin/analytics");
}

async function assertVehicleExpensesEditable(tx: PrismaTx, vehicleId: string) {
  const vehicle = await tx.vehicle.findUnique({
    where: { id: vehicleId },
    select: {
      id: true,
      brand: true,
      model: true,
      plateNumber: true,
      sale: {
        select: {
          distributions: {
            select: { id: true, notes: true },
          },
        },
      },
    },
  });

  if (!vehicle) {
    throw new Error("Kendaraan tidak ditemukan.");
  }

  const hasActiveDistribution = vehicle.sale?.distributions.some(
    (d) => !d.notes?.includes("[REVERSED]")
  );

  if (hasActiveDistribution) {
    throw new Error(
      "Biaya tidak dapat diubah atau dihapus karena bagi hasil penjualan unit ini sudah dicatat. Lakukan reversal distribusi terlebih dahulu di menu Keuangan."
    );
  }

  return vehicle;
}

async function archiveReceiptPhotos(
  tx: PrismaTx,
  params: {
    vehicleId: string;
    receiptUrl?: string | null;
    category: string;
    vendorName?: string | null;
    amount: number;
  }
) {
  const receiptUrls = parseProofUrls(params.receiptUrl);
  if (receiptUrls.length === 0) return;

  const existingPhotos = await tx.vehiclePhoto.findMany({
    where: {
      vehicleId: params.vehicleId,
      fileUrl: { in: receiptUrls },
    },
    select: { fileUrl: true },
  });
  const existingSet = new Set(existingPhotos.map((p) => p.fileUrl));
  const newUrls = receiptUrls.filter((u) => !existingSet.has(u));

  for (let i = 0; i < newUrls.length; i++) {
    await tx.vehiclePhoto.create({
      data: {
        vehicleId: params.vehicleId,
        category: "DOCUMENT_PROOF",
        fileUrl: newUrls[i],
        tag: "RECEIPT_EXPENSE",
        title: `Bukti Nota ${params.category}: ${params.vendorName || "Vendor"} (Rp ${params.amount.toLocaleString("id-ID")})${newUrls.length > 1 ? ` — Foto ${i + 1}/${newUrls.length}` : ""}`,
      },
    });
  }
}

async function recordCashBalanceDelta(
  tx: PrismaTx,
  params: {
    direction: "IN" | "OUT";
    amount: Decimal;
    vehicleId: string;
    expenseId?: string | null;
    notes: string;
    createdBy: string;
  }
) {
  const lastCashTx = await tx.cashTransaction.findFirst({
    orderBy: { createdAt: "desc" },
    select: { runningBalance: true },
  });

  const currentBalance = lastCashTx
    ? new Decimal(lastCashTx.runningBalance.toString())
    : new Decimal(0);

  const newBalance =
    params.direction === "OUT"
      ? currentBalance.minus(params.amount)
      : currentBalance.plus(params.amount);

  await tx.cashTransaction.create({
    data: {
      type: params.direction === "OUT" ? "OUT_EXPENSE" : "IN_OTHER",
      amount: params.amount,
      relatedVehicleId: params.vehicleId,
      relatedExpenseId: params.expenseId ?? null,
      runningBalance: newBalance,
      notes: params.notes,
      createdBy: params.createdBy,
    },
  });
}

export async function createExpenseAction(input: CreateExpenseInput) {
  try {
    const session = await requireRole(["OWNER", "ADMIN", "STAFF_ADMIN"]);
    const actorLabel = session.fullName || "Owner/Admin";
    const validated = createExpenseSchema.parse(input);

    const result = await prisma.$transaction(async (tx) => {
      const vehicle = await assertVehicleExpensesEditable(tx, validated.vehicleId);

      const expense = await tx.expense.create({
        data: {
          vehicleId: validated.vehicleId,
          category: validated.category,
          vendorName: validated.vendorName || null,
          amount: validated.amount,
          date: validated.date,
          notes: validated.notes || null,
          receiptUrl: validated.receiptUrl || null,
          createdBy: actorLabel,
        },
      });

      await archiveReceiptPhotos(tx, {
        vehicleId: validated.vehicleId,
        receiptUrl: validated.receiptUrl,
        category: validated.category,
        vendorName: validated.vendorName,
        amount: validated.amount,
      });

      await recordCashBalanceDelta(tx, {
        direction: "OUT",
        amount: new Decimal(validated.amount),
        vehicleId: vehicle.id,
        expenseId: expense.id,
        notes: `Biaya ${expense.category}: ${vehicle.brand} ${vehicle.model} (${vehicle.plateNumber})${validated.notes ? ` - ${validated.notes}` : ""}`,
        createdBy: actorLabel,
      });

      await tx.auditLog.create({
        data: {
          actorUserId: session.userId,
          action: "CREATE",
          entityType: "Expense",
          entityId: expense.id,
          afterData: toJsonValue(expense),
        },
      });

      return expense;
    });

    revalidateExpensePaths(validated.vehicleId);
    return {
      success: true,
      data: {
        ...result,
        amount: Number(result.amount),
      },
    };
  } catch (error: unknown) {
    console.error("Error creating expense:", error);
    return { success: false, error: getErrorMessage(error, "Gagal mencatat biaya") };
  }
}

export async function updateExpenseAction(input: UpdateExpenseInput) {
  try {
    const session = await requireRole(["OWNER", "ADMIN", "STAFF_ADMIN"]);
    const actorLabel = session.fullName || "Owner/Admin";
    const validated = updateExpenseSchema.parse(input);

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.expense.findUnique({
        where: { id: validated.expenseId },
      });

      if (!existing) {
        throw new Error("Data biaya tidak ditemukan.");
      }

      const vehicle = await assertVehicleExpensesEditable(tx, existing.vehicleId);

      const updated = await tx.expense.update({
        where: { id: existing.id },
        data: {
          category: validated.category,
          vendorName: validated.vendorName || null,
          amount: validated.amount,
          date: validated.date,
          notes: validated.notes || null,
          receiptUrl: validated.receiptUrl || null,
        },
      });

      await archiveReceiptPhotos(tx, {
        vehicleId: existing.vehicleId,
        receiptUrl: validated.receiptUrl,
        category: validated.category,
        vendorName: validated.vendorName,
        amount: validated.amount,
      });

      const oldAmount = new Decimal(existing.amount.toString());
      const newAmount = new Decimal(validated.amount);
      const diff = newAmount.minus(oldAmount);

      // Catat selisih mutasi kas agar buku kas tetap append-only dan saldo berjalan akurat
      if (!diff.isZero()) {
        if (diff.gt(0)) {
          await recordCashBalanceDelta(tx, {
            direction: "OUT",
            amount: diff,
            vehicleId: vehicle.id,
            expenseId: updated.id,
            notes: `Penyesuaian (+Rp ${diff.toNumber().toLocaleString("id-ID")}) edit biaya ${updated.category}: ${vehicle.brand} ${vehicle.model} (${vehicle.plateNumber})`,
            createdBy: actorLabel,
          });
        } else {
          const refundAmt = diff.abs();
          await recordCashBalanceDelta(tx, {
            direction: "IN",
            amount: refundAmt,
            vehicleId: vehicle.id,
            expenseId: updated.id,
            notes: `Koreksi pengurangan biaya (-Rp ${refundAmt.toNumber().toLocaleString("id-ID")}) ${updated.category}: ${vehicle.brand} ${vehicle.model} (${vehicle.plateNumber})`,
            createdBy: actorLabel,
          });
        }
      }

      await tx.auditLog.create({
        data: {
          actorUserId: session.userId,
          action: "UPDATE",
          entityType: "Expense",
          entityId: updated.id,
          beforeData: toJsonValue(existing),
          afterData: toJsonValue(updated),
        },
      });

      return updated;
    });

    revalidateExpensePaths(result.vehicleId);
    return {
      success: true,
      data: {
        ...result,
        amount: Number(result.amount),
      },
    };
  } catch (error: unknown) {
    console.error("Error updating expense:", error);
    return { success: false, error: getErrorMessage(error, "Gagal memperbarui biaya") };
  }
}

export async function deleteExpenseAction(expenseId: string) {
  try {
    const session = await requireRole(["OWNER", "ADMIN", "STAFF_ADMIN"]);
    const actorLabel = session.fullName || "Owner/Admin";
    if (!expenseId) {
      return { success: false, error: "ID biaya tidak valid" };
    }

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.expense.findUnique({
        where: { id: expenseId },
      });

      if (!existing) {
        throw new Error("Data biaya tidak ditemukan.");
      }

      const vehicle = await assertVehicleExpensesEditable(tx, existing.vehicleId);
      const oldAmount = new Decimal(existing.amount.toString());

      // Lepaskan relasi CashTransaction lama agar histori kas tetap tersimpan tanpa error FK
      await tx.cashTransaction.updateMany({
        where: { relatedExpenseId: existing.id },
        data: { relatedExpenseId: null },
      });

      // Kembalikan saldo kas sejumlah biaya yang dihapus
      await recordCashBalanceDelta(tx, {
        direction: "IN",
        amount: oldAmount,
        vehicleId: vehicle.id,
        expenseId: null,
        notes: `Pembatalan/hapus biaya ${existing.category} (Rp ${oldAmount.toNumber().toLocaleString("id-ID")}): ${vehicle.brand} ${vehicle.model} (${vehicle.plateNumber})`,
        createdBy: actorLabel,
      });

      await tx.expense.delete({
        where: { id: existing.id },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: session.userId,
          action: "DELETE",
          entityType: "Expense",
          entityId: existing.id,
          beforeData: toJsonValue(existing),
        },
      });

      return { vehicleId: existing.vehicleId, deletedId: existing.id };
    });

    revalidateExpensePaths(result.vehicleId);
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error("Error deleting expense:", error);
    return { success: false, error: getErrorMessage(error, "Gagal menghapus biaya") };
  }
}

export async function getExpensesByVehicleIdAction(vehicleId: string) {
  try {
    await requireRole(["OWNER", "ADMIN", "STAFF_ADMIN"]);
    const [expenses, sale] = await Promise.all([
      prisma.expense.findMany({
        where: { vehicleId },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      }),
      prisma.sale.findUnique({
        where: { vehicleId },
        select: {
          distributions: {
            select: { id: true, notes: true },
          },
        },
      }),
    ]);

    const isLocked = Boolean(
      sale?.distributions.some((d) => !d.notes?.includes("[REVERSED]"))
    );

    return {
      success: true,
      isLocked,
      data: expenses.map((e) => ({
        ...e,
        amount: Number(e.amount),
      })),
    };
  } catch (error: unknown) {
    console.error("Error getting expenses:", error);
    return {
      success: false,
      isLocked: false,
      error: getErrorMessage(error, "Gagal memuat rincian biaya"),
    };
  }
}
