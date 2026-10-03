"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createExpenseSchema, type CreateExpenseInput } from "@/lib/validations/expense";

export async function createExpenseAction(input: CreateExpenseInput) {
  try {
    const validated = createExpenseSchema.parse(input);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verifikasi unit kendaraan ada
      const vehicle = await tx.vehicle.findUnique({
        where: { id: validated.vehicleId },
        select: { id: true, brand: true, model: true, plateNumber: true },
      });
      if (!vehicle) {
        throw new Error("Kendaraan tidak ditemukan.");
      }

      // 2. Buat record Expense
      const expense = await tx.expense.create({
        data: {
          vehicleId: validated.vehicleId,
          category: validated.category,
          vendorName: validated.vendorName,
          amount: validated.amount,
          date: validated.date,
          notes: validated.notes,
          receiptUrl: validated.receiptUrl || null,
          createdBy: "Owner/Admin",
        },
      });

      // 2b. Jika ada lampiran bukti nota fisik, arsipkan otomatis ke VehiclePhoto (DOCUMENT_PROOF)
      // receiptUrl bisa berupa URL tunggal atau JSON array ["url1","url2"]
      if (validated.receiptUrl) {
        let receiptUrls: string[] = [];
        try {
          const parsed = JSON.parse(validated.receiptUrl);
          if (Array.isArray(parsed)) {
            receiptUrls = parsed.filter((u) => typeof u === "string" && u.startsWith("http"));
          } else {
            receiptUrls = [validated.receiptUrl];
          }
        } catch {
          receiptUrls = [validated.receiptUrl];
        }

        for (let i = 0; i < receiptUrls.length; i++) {
          await tx.vehiclePhoto.create({
            data: {
              vehicleId: validated.vehicleId,
              category: "DOCUMENT_PROOF",
              fileUrl: receiptUrls[i],
              tag: "RECEIPT_EXPENSE",
              title: `Bukti Nota ${validated.category}: ${validated.vendorName || "Vendor"} (Rp ${validated.amount.toLocaleString("id-ID")})${receiptUrls.length > 1 ? ` — Foto ${i + 1}/${receiptUrls.length}` : ""}`,
            },
          });
        }
      }

      // 3. Ambil saldo kas terakhir
      const lastCashTx = await tx.cashTransaction.findFirst({
        orderBy: { createdAt: "desc" },
        select: { runningBalance: true },
      });
      const currentBalance = lastCashTx ? Number(lastCashTx.runningBalance) : 0;
      const newBalance = currentBalance - validated.amount;

      // 4. Catat transaksi keluar biaya di CashTransaction (relasi formal)
      await tx.cashTransaction.create({
        data: {
          type: "OUT_EXPENSE",
          amount: validated.amount,
          relatedVehicleId: vehicle.id,
          relatedExpenseId: expense.id,
          runningBalance: newBalance,
          notes: `Biaya ${expense.category}: ${vehicle.brand} ${vehicle.model} (${vehicle.plateNumber})${validated.notes ? ` - ${validated.notes}` : ""}`,
          createdBy: "Owner/Admin",
        },
      });

      // 5. Tulis AuditLog
      await tx.auditLog.create({
        data: {
          actorUserId: "admin-owner-001",
          action: "CREATE",
          entityType: "Expense",
          entityId: expense.id,
          afterData: expense as any,
        },
      });

      return expense;
    });

    revalidatePath("/admin/inventory");
    revalidatePath("/admin/finance");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error creating expense:", error);
    return { success: false, error: error.message || "Gagal mencatat biaya" };
  }
}

export async function getExpensesByVehicleIdAction(vehicleId: string) {
  try {
    const expenses = await prisma.expense.findMany({
      where: { vehicleId },
      orderBy: { date: "desc" },
    });

    return {
      success: true,
      data: expenses.map((e) => ({
        ...e,
        amount: Number(e.amount),
      })),
    };
  } catch (error: any) {
    console.error("Error getting expenses:", error);
    return { success: false, error: error.message || "Gagal memuat rincian biaya" };
  }
}
