"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface ParsedVehicleRow {
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  transmission: "MANUAL" | "AUTOMATIC" | "CVT" | "DCT";
  odometer: number;
  engineCapacity: number;
  purchaseDate: string;
  purchasePrice: number;
  targetSellingPrice?: number;
  minSellingPrice?: number;
  bpkbStatus: "READY" | "PROCESS_1_2_WEEKS" | "LOST_NEED_REPLACEMENT" | "MUTATION_REQUIRED";
  status: "INTAKE" | "IN_REPAIR" | "READY_FOR_SALE" | "BOOKED" | "AT_SHOWROOM_PENDING" | "SOLD_SETTLED";
  sourceType: "AUCTION" | "BROKER" | "DIRECT_BUY";
  currentLocation?: string;
  notes?: string;
}

export interface ParsedExpenseRow {
  plateNumber: string;
  category: "TRANSPORT_PICKUP" | "AUCTION_ADMIN_FEE" | "BROKER_COMMISSION" | "OIL_AND_SERVICE" | "BODY_PAINT" | "DETAILING_SALON" | "SPAREPARTS" | "DOCUMENT_TAX_MUTATION" | "OTHER";
  description: string;
  amount: number;
  date: string;
  vendorName?: string;
}

import { cleanNumber, cleanDate } from "@/lib/utils/spreadsheet-parser";

/**
 * Impor Massal Data Kendaraan dari Spreadsheet
 */
export async function importVehiclesAction(
  rows: ParsedVehicleRow[],
  options: {
    onDuplicate: "SKIP" | "UPDATE";
    recordCashExpense?: boolean;
  } = { onDuplicate: "SKIP", recordCashExpense: false }
) {
  try {
    if (!rows || rows.length === 0) {
      return { success: false, error: "Tidak ada baris data yang valid untuk diimpor." };
    }

    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const row of rows) {
        if (!row.plateNumber || !row.brand || !row.model) {
          skippedCount++;
          continue;
        }

        const cleanPlate = row.plateNumber.trim().toUpperCase();

        const existing = await tx.vehicle.findUnique({
          where: { plateNumber: cleanPlate },
        });

        const purchaseDate = cleanDate(row.purchaseDate);
        const purchasePrice = cleanNumber(row.purchasePrice);
        const targetPrice = cleanNumber(row.targetSellingPrice) || purchasePrice * 1.15;
        const minPrice = cleanNumber(row.minSellingPrice) || purchasePrice * 1.08;

        if (existing) {
          if (options.onDuplicate === "UPDATE") {
            await tx.vehicle.update({
              where: { id: existing.id },
              data: {
                brand: row.brand.trim(),
                model: row.model.trim(),
                year: Number(row.year) || existing.year,
                color: row.color?.trim() || existing.color,
                odometer: cleanNumber(row.odometer) || existing.odometer,
                transmission: row.transmission || existing.transmission,
                engineCapacity: cleanNumber(row.engineCapacity) || existing.engineCapacity,
                purchasePrice,
                targetSellingPrice: targetPrice,
                minSellingPrice: minPrice,
                status: row.status || existing.status,
                bpkbStatus: row.bpkbStatus || existing.bpkbStatus,
                currentLocation: row.currentLocation?.trim() || existing.currentLocation,
                notes: row.notes?.trim() || existing.notes,
              },
            });
            updatedCount++;
          } else {
            skippedCount++;
          }
          continue;
        }

        // Buat Vehicle Baru
        const newVehicle = await tx.vehicle.create({
          data: {
            plateNumber: cleanPlate,
            brand: row.brand.trim(),
            model: row.model.trim(),
            year: Number(row.year) || new Date().getFullYear(),
            color: row.color?.trim() || "Hitam",
            odometer: cleanNumber(row.odometer) || 10000,
            transmission: row.transmission || "AUTOMATIC",
            engineCapacity: cleanNumber(row.engineCapacity) || 1500,
            sourceType: row.sourceType || "DIRECT_BUY",
            purchasePrice,
            purchaseDate,
            targetSellingPrice: targetPrice,
            minSellingPrice: minPrice,
            status: row.status || "READY_FOR_SALE",
            bpkbStatus: row.bpkbStatus || "READY",
            currentLocation: row.currentLocation?.trim() || "Garasi Utama",
            notes: row.notes?.trim() || null,
          },
        });

        // Jika opsi recordCashExpense diaktifkan, potong kas BCA
        if (options.recordCashExpense && purchasePrice > 0) {
          const lastCashTx = await tx.cashTransaction.findFirst({
            orderBy: { createdAt: "desc" },
            select: { runningBalance: true },
          });
          const currentBal = lastCashTx ? Number(lastCashTx.runningBalance) : 0;
          await tx.cashTransaction.create({
            data: {
              type: "OUT_VEHICLE_PURCHASE",
              amount: purchasePrice,
              relatedVehicleId: newVehicle.id,
              runningBalance: currentBal - purchasePrice,
              notes: `[Import Data Lama] Pembelian ${newVehicle.brand} ${newVehicle.model} (${newVehicle.plateNumber})`,
              createdBy: "System Import",
            },
          });
        }

        importedCount++;
      }

      // Catat ke Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: "ADMIN",
          action: "CREATE",
          entityType: "VehicleImportBatch",
          entityId: `BATCH_${Date.now()}`,
          afterData: {
            importedCount,
            updatedCount,
            skippedCount,
            totalRows: rows.length,
            recordCashExpense: options.recordCashExpense,
          },
        },
      });
    });

    revalidatePath("/admin");
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/finance");

    return {
      success: true,
      message: `Berhasil mengimpor ${importedCount} unit baru${updatedCount > 0 ? `, ${updatedCount} unit diperbarui` : ""}${skippedCount > 0 ? `, ${skippedCount} unit dilewati` : ""}.`,
      importedCount,
      updatedCount,
      skippedCount,
      errors,
    };
  } catch (error: any) {
    console.error("[importVehiclesAction] Error:", error);
    return {
      success: false,
      error: error.message || "Gagal mengimpor data kendaraan.",
      importedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
    };
  }
}

/**
 * Impor Massal Data Pengeluaran / Biaya Servis Unit dari Spreadsheet
 */
export async function importExpensesAction(rows: ParsedExpenseRow[]) {
  try {
    if (!rows || rows.length === 0) {
      return { success: false, error: "Tidak ada baris pengeluaran yang valid." };
    }

    let importedCount = 0;
    let notFoundPlates: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const row of rows) {
        if (!row.plateNumber || !row.amount) continue;

        const cleanPlate = row.plateNumber.trim().toUpperCase();
        const vehicle = await tx.vehicle.findUnique({
          where: { plateNumber: cleanPlate },
        });

        if (!vehicle) {
          notFoundPlates.push(cleanPlate);
          continue;
        }

        await tx.expense.create({
          data: {
            vehicleId: vehicle.id,
            category: row.category || "OTHER",
            notes: row.description || "Biaya perbaikan / servis impor",
            amount: cleanNumber(row.amount),
            date: cleanDate(row.date),
            vendorName: row.vendorName?.trim() || null,
            createdBy: "IMPORT_SYSTEM",
          },
        });

        importedCount++;
      }
    });

    revalidatePath("/admin/inventory");
    revalidatePath("/admin/finance");

    return {
      success: true,
      message: `Berhasil mengimpor ${importedCount} catatan biaya perbaikan unit.${notFoundPlates.length > 0 ? ` (${notFoundPlates.length} biaya dilewati karena plat tidak ditemukan)` : ""}`,
      importedCount,
      notFoundPlates,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal mengimpor data pengeluaran.",
    };
  }
}
