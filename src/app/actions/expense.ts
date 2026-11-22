"use server";

import { revalidatePath } from "next/cache";
import Decimal from "decimal.js";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { parseProofUrls, sanitizeActionError } from "@/lib/utils";
import { getExpenseCategoryShortLabel } from "@/lib/constants/expense-categories";
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
  return sanitizeActionError(error, fallback);
}

function revalidateExpensePaths(vehicleId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/inventory");
  revalidatePath(`/admin/inventory/${vehicleId}`);
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

async function syncReceiptPhotos(
  tx: PrismaTx,
  params: {
    vehicleId: string;
    previousReceiptUrl?: string | null;
    nextReceiptUrl?: string | null;
    excludeExpenseId?: string;
    category: string;
    vendorName?: string | null;
    amount: number;
  }
) {
  const prevUrls = parseProofUrls(params.previousReceiptUrl);
  const nextUrls = parseProofUrls(params.nextReceiptUrl);
  const nextSet = new Set(nextUrls);
  const removedUrls = prevUrls.filter((u) => !nextSet.has(u));

  // Hapus foto arsip nota lama jika tidak dipakai lagi oleh biaya lain pada unit ini
  if (removedUrls.length > 0) {
    const otherExpenses = await tx.expense.findMany({
      where: {
        vehicleId: params.vehicleId,
        ...(params.excludeExpenseId ? { id: { not: params.excludeExpenseId } } : {}),
      },
      select: { receiptUrl: true },
    });
    const stillUsedUrls = new Set<string>();
    for (const exp of otherExpenses) {
      for (const u of parseProofUrls(exp.receiptUrl)) {
        stillUsedUrls.add(u);
      }
    }
    const safeToDelete = removedUrls.filter((u) => !stillUsedUrls.has(u));
    if (safeToDelete.length > 0) {
      await tx.vehiclePhoto.deleteMany({
        where: {
          vehicleId: params.vehicleId,
          tag: "RECEIPT_EXPENSE",
          fileUrl: { in: safeToDelete },
        },
      });
    }
  }

  if (nextUrls.length === 0) return;

  const categoryLabel = getExpenseCategoryShortLabel(params.category);
  const existingPhotos = await tx.vehiclePhoto.findMany({
    where: {
      vehicleId: params.vehicleId,
      tag: "RECEIPT_EXPENSE",
      fileUrl: { in: nextUrls },
    },
    select: { id: true, fileUrl: true },
  });
  const existingByUrl = new Map(existingPhotos.map((p) => [p.fileUrl, p.id]));

  for (let i = 0; i < nextUrls.length; i++) {
    const url = nextUrls[i];
    const nextTitle = `Nota ${categoryLabel}: ${params.vendorName || "Vendor"} (Rp ${params.amount.toLocaleString("id-ID")})${nextUrls.length > 1 ? ` (${i + 1}/${nextUrls.length})` : ""}`;
    const existingId = existingByUrl.get(url);

    if (existingId) {
      // Sinkronkan judul agar nominal & kategori selalu cocok setelah edit
      await tx.vehiclePhoto.update({
        where: { id: existingId },
        data: { title: nextTitle },
      });
    } else {
      await tx.vehiclePhoto.create({
        data: {
          vehicleId: params.vehicleId,
          category: "DOCUMENT_PROOF",
          fileUrl: url,
          tag: "RECEIPT_EXPENSE",
          title: nextTitle,
        },
      });
    }
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
    proofUrl?: string | null;
    createdBy: string;
  }
) {
  const lastCashTx = await tx.cashTransaction.findFirst({
    orderBy: { createdAt: "desc" },
    select: { runningBalance: true, createdAt: true },
  });

  const currentBalance = lastCashTx
    ? new Decimal(lastCashTx.runningBalance.toString())
    : new Decimal(0);

  const newBalance =
    params.direction === "OUT"
      ? currentBalance.minus(params.amount)
      : currentBalance.plus(params.amount);

  const nextTs = Math.max(
    Date.now(),
    lastCashTx ? new Date(lastCashTx.createdAt).getTime() + 1 : 0
  );

  await tx.cashTransaction.create({
    data: {
      type: params.direction === "OUT" ? "OUT_EXPENSE" : "IN_OTHER",
      amount: params.amount,
      relatedVehicleId: params.vehicleId,
      relatedExpenseId: params.expenseId ?? null,
      runningBalance: newBalance,
      notes: params.notes,
      proofUrl: params.proofUrl || null,
      createdAt: new Date(nextTs),
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

      await syncReceiptPhotos(tx, {
        vehicleId: validated.vehicleId,
        nextReceiptUrl: validated.receiptUrl,
        excludeExpenseId: expense.id,
        category: validated.category,
        vendorName: validated.vendorName,
        amount: validated.amount,
      });

      await recordCashBalanceDelta(tx, {
        direction: "OUT",
        amount: new Decimal(validated.amount),
        vehicleId: vehicle.id,
        expenseId: expense.id,
        notes: `Biaya ${getExpenseCategoryShortLabel(expense.category)}: ${vehicle.brand} ${vehicle.model} (${vehicle.plateNumber})${validated.notes ? ` - ${validated.notes}` : ""}`,
        proofUrl: validated.receiptUrl || null,
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

      await syncReceiptPhotos(tx, {
        vehicleId: existing.vehicleId,
        previousReceiptUrl: existing.receiptUrl,
        nextReceiptUrl: validated.receiptUrl,
        excludeExpenseId: updated.id,
        category: validated.category,
        vendorName: validated.vendorName,
        amount: validated.amount,
      });

      // Sinkronkan juga lampiran bukti nota pada mutasi kas terkait biaya ini
      if ((existing.receiptUrl || null) !== (validated.receiptUrl || null)) {
        await tx.cashTransaction.updateMany({
          where: { relatedExpenseId: updated.id },
          data: { proofUrl: validated.receiptUrl || null },
        });
      }

      const oldAmount = new Decimal(existing.amount.toString());
      const newAmount = new Decimal(validated.amount);
      const diff = newAmount.minus(oldAmount);

      // Catat selisih mutasi kas agar buku kas tetap append-only dan saldo berjalan akurat
      if (!diff.isZero()) {
        const catLabel = getExpenseCategoryShortLabel(updated.category);
        if (diff.gt(0)) {
          await recordCashBalanceDelta(tx, {
            direction: "OUT",
            amount: diff,
            vehicleId: vehicle.id,
            expenseId: updated.id,
            notes: `Penyesuaian (+Rp ${diff.toNumber().toLocaleString("id-ID")}) edit biaya ${catLabel}: ${vehicle.brand} ${vehicle.model} (${vehicle.plateNumber})`,
            proofUrl: validated.receiptUrl || null,
            createdBy: actorLabel,
          });
        } else {
          const refundAmt = diff.abs();
          await recordCashBalanceDelta(tx, {
            direction: "IN",
            amount: refundAmt,
            vehicleId: vehicle.id,
            expenseId: updated.id,
            notes: `Koreksi pengurangan biaya (-Rp ${refundAmt.toNumber().toLocaleString("id-ID")}) ${catLabel}: ${vehicle.brand} ${vehicle.model} (${vehicle.plateNumber})`,
            proofUrl: validated.receiptUrl || null,
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

      // Hapus salinan foto arsip nota (RECEIPT_EXPENSE) agar tidak meninggalkan foto yatim di tab Foto & Dokumen
      await syncReceiptPhotos(tx, {
        vehicleId: existing.vehicleId,
        previousReceiptUrl: existing.receiptUrl,
        nextReceiptUrl: null,
        excludeExpenseId: existing.id,
        category: existing.category,
        vendorName: existing.vendorName,
        amount: oldAmount.toNumber(),
      });

      // Kembalikan saldo kas sejumlah biaya yang dihapus
      await recordCashBalanceDelta(tx, {
        direction: "IN",
        amount: oldAmount,
        vehicleId: vehicle.id,
        expenseId: null,
        notes: `Pembatalan/hapus biaya ${getExpenseCategoryShortLabel(existing.category)} (Rp ${oldAmount.toNumber().toLocaleString("id-ID")}): ${vehicle.brand} ${vehicle.model} (${vehicle.plateNumber})`,
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

export async function enrichExpensesWithEditAudit<
  T extends { id: string }
>(expenses: T[]): Promise<Array<T & { updatedAt: Date | null; updatedBy: string | null }>> {
  if (expenses.length === 0) {
    return [];
  }

  const updateLogs = await prisma.auditLog.findMany({
    where: {
      entityType: "Expense",
      action: "UPDATE",
      entityId: { in: expenses.map((e) => e.id) },
    },
    orderBy: { createdAt: "desc" },
    select: {
      entityId: true,
      actorUserId: true,
      createdAt: true,
    },
  });

  const latestByExpenseId = new Map<string, { actorUserId: string; createdAt: Date }>();
  for (const log of updateLogs) {
    if (!latestByExpenseId.has(log.entityId)) {
      latestByExpenseId.set(log.entityId, {
        actorUserId: log.actorUserId,
        createdAt: log.createdAt,
      });
    }
  }

  const actorIds = Array.from(
    new Set(Array.from(latestByExpenseId.values()).map((entry) => entry.actorUserId))
  );
  const profiles =
    actorIds.length > 0
      ? await prisma.userProfile.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, fullName: true },
        })
      : [];
  const profileMap = new Map(profiles.map((p) => [p.id, p.fullName]));

  return expenses.map((expense) => {
    const latestEdit = latestByExpenseId.get(expense.id);
    return {
      ...expense,
      updatedAt: latestEdit ? latestEdit.createdAt : null,
      updatedBy: latestEdit ? profileMap.get(latestEdit.actorUserId) || null : null,
    };
  });
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

    const enrichedExpenses = await enrichExpensesWithEditAudit(
      expenses.map((e) => ({
        ...e,
        amount: Number(e.amount),
      }))
    );

    const isLocked = Boolean(
      sale?.distributions.some((d) => !d.notes?.includes("[REVERSED]"))
    );

    return {
      success: true,
      isLocked,
      data: enrichedExpenses,
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
