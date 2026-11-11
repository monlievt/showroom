"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { formatRupiah, parseProofUrls } from "@/lib/utils";

export interface CreateSupplyInput {
  name: string;
  category: "OIL_AND_FLUIDS" | "FAST_MOVING_PARTS" | "DETAILING_CHEMICALS" | "OTHER_SUPPLIES";
  unit: string;
  currentStock: number;
  minStockAlert?: number;
  costPerUnit: number;
  standardHppCharge?: number;
  location?: string;
  photoUrl?: string | null;
  receiptUrl?: string | null;
  notes?: string;
}

export interface RestockSupplyInput {
  supplyId: string;
  addedStock: number;
  costPerUnit?: number;
  standardHppCharge?: number;
  photoUrl?: string | null;
  receiptUrl?: string | null;
  notes?: string;
}

export interface RecordUsageInput {
  supplyId: string;
  vehicleId: string;
  quantityUsed: number;
  chargedHppAmount: number; // cth 500.000
  serviceType: "GANTI_OLI" | "SALON_MANDIRI" | "GANTI_BOHLAM" | "LAINNYA";
  notes?: string;
}

export async function getWorkshopSuppliesAction() {
  try {
    await requireRole(["OWNER", "ADMIN", "STAFF_ADMIN"]);
    const supplies = await prisma.workshopSupply.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        usages: {
          include: {
            vehicle: {
              select: {
                id: true,
                plateNumber: true,
                brand: true,
                model: true,
              },
            },
          },
          orderBy: { usedDate: "desc" },
          take: 10,
        },
      },
    });

    // Kalkulasi KPI
    let totalStockValue = 0;
    let totalItemsInStock = 0;
    let lowStockCount = 0;

    const formattedSupplies = supplies.map((s) => {
      const stock = s.currentStock;
      const cost = Number(s.costPerUnit);
      const standardHpp = s.standardHppCharge ? Number(s.standardHppCharge) : cost;
      const stockValue = stock * cost;

      totalStockValue += stockValue;
      totalItemsInStock += stock;
      if (stock <= s.minStockAlert) {
        lowStockCount++;
      }

      return {
        ...s,
        costPerUnit: cost,
        standardHppCharge: standardHpp,
        stockValue,
        isLowStock: stock <= s.minStockAlert,
        usages: s.usages.map((u) => ({
          ...u,
          unitCostAtUsage: Number(u.unitCostAtUsage),
          chargedHppAmount: Number(u.chargedHppAmount),
          workshopMargin: Number(u.workshopMargin),
        })),
      };
    });

    // Ambil rekap total pemakaian dan margin garasi terkumpul
    const allUsages = await prisma.workshopSupplyUsage.findMany({
      select: {
        unitCostAtUsage: true,
        chargedHppAmount: true,
        workshopMargin: true,
      },
    });

    const totalSuppliesCostUsed = allUsages.reduce((acc, u) => acc + Number(u.unitCostAtUsage), 0);
    const totalHppChargedToVehicles = allUsages.reduce((acc, u) => acc + Number(u.chargedHppAmount), 0);
    const totalWorkshopMarginEarned = allUsages.reduce((acc, u) => acc + Number(u.workshopMargin), 0);

    return {
      success: true,
      data: {
        items: formattedSupplies,
        totalStockValue,
        totalItemsInStock,
        lowStockCount,
        summary: {
          totalSuppliesCostUsed,
          totalHppChargedToVehicles,
          totalWorkshopMarginEarned, // Laba jasa keringat mandiri garasi
        },
      },
    };
  } catch (error: any) {
    console.error("Gagal mengambil data stok barang habis pakai:", error);
    return { success: false, error: error.message || "Gagal memuat persediaan barang habis pakai" };
  }
}

export async function createWorkshopSupplyAction(input: CreateSupplyInput, deductCash = false) {
  try {
    const session = await requireRole(["OWNER", "ADMIN", "STAFF_ADMIN"]);
    const actorLabel = session.fullName || "Owner/Admin";
    const cost = Number(input.costPerUnit);
    const stock = Number(input.currentStock);
    const totalExpense = cost * stock;

    const result = await prisma.$transaction(async (tx) => {
      const supply = await tx.workshopSupply.create({
        data: {
          name: input.name,
          category: input.category,
          unit: input.unit || "Pcs",
          currentStock: stock,
          minStockAlert: input.minStockAlert ? Number(input.minStockAlert) : 2,
          costPerUnit: cost,
          standardHppCharge: input.standardHppCharge ? Number(input.standardHppCharge) : cost,
          location: input.location || "Rak Gudang Garasi",
          photoUrl: input.photoUrl || null,
          receiptUrl: input.receiptUrl || null,
          notes: input.notes,
        },
      });

      // Jika potong kas, catat pengeluaran kas pembelian stok + nota
      if (deductCash && totalExpense > 0) {
        const lastTx = await tx.cashTransaction.findFirst({
          orderBy: { createdAt: "desc" },
          select: { runningBalance: true, createdAt: true },
        });
        const currentBal = lastTx ? Number(lastTx.runningBalance) : 0;
        if (currentBal < totalExpense) {
          throw new Error(
            `Saldo kas showroom tidak mencukupi (Tersedia: ${formatRupiah(currentBal)}, Dibutuhkan: ${formatRupiah(totalExpense)}).`
          );
        }
        const newBal = currentBal - totalExpense;

        await tx.cashTransaction.create({
          data: {
            type: "OUT_OPERATIONAL",
            amount: totalExpense,
            runningBalance: newBal,
            notes: `Pembelian stok bahan habis pakai: ${input.name} (${stock} ${input.unit || "Pcs"} @ Rp ${cost.toLocaleString("id-ID")})`,
            proofUrl: input.receiptUrl || null,
            createdAt: new Date(
              Math.max(Date.now(), lastTx ? new Date(lastTx.createdAt).getTime() + 1 : 0)
            ),
            createdBy: actorLabel,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: session.userId,
          action: "CREATE",
          entityType: "WorkshopSupply",
          entityId: supply.id,
          afterData: JSON.parse(JSON.stringify(supply)),
        },
      });

      return supply;
    });

    revalidatePath("/admin/workshop");
    revalidatePath("/admin/finance");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Gagal menambahkan stok bahan:", error);
    return { success: false, error: error.message || "Gagal menambah stok bahan" };
  }
}

export async function restockWorkshopSupplyAction(
  input: RestockSupplyInput,
  deductCash = false
) {
  try {
    const session = await requireRole(["OWNER", "ADMIN", "STAFF_ADMIN"]);
    const actorLabel = session.fullName || "Owner/Admin";
    const addedQty = Number(input.addedStock);
    if (!Number.isInteger(addedQty) || addedQty <= 0) {
      throw new Error("Jumlah tambah stok minimal 1 unit.");
    }

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.workshopSupply.findUnique({
        where: { id: input.supplyId },
      });
      if (!existing) {
        throw new Error("Barang persediaan tidak ditemukan.");
      }

      const nextCost =
        input.costPerUnit && Number(input.costPerUnit) > 0
          ? Number(input.costPerUnit)
          : Number(existing.costPerUnit);
      const nextStandardHpp =
        input.standardHppCharge && Number(input.standardHppCharge) > 0
          ? Number(input.standardHppCharge)
          : existing.standardHppCharge
          ? Number(existing.standardHppCharge)
          : nextCost;

      // Gabungkan nota lama + baru bila ada nota baru
      const oldReceipts = parseProofUrls(existing.receiptUrl);
      const newReceipts = parseProofUrls(input.receiptUrl);
      const mergedReceipts = Array.from(new Set([...oldReceipts, ...newReceipts]));
      const nextReceiptUrl =
        mergedReceipts.length === 0
          ? null
          : mergedReceipts.length === 1
          ? mergedReceipts[0]
          : JSON.stringify(mergedReceipts);

      const nextPhotoUrl = input.photoUrl || existing.photoUrl || null;

      const updated = await tx.workshopSupply.update({
        where: { id: existing.id },
        data: {
          currentStock: { increment: addedQty },
          costPerUnit: nextCost,
          standardHppCharge: nextStandardHpp,
          photoUrl: nextPhotoUrl,
          receiptUrl: nextReceiptUrl,
          notes: input.notes?.trim() ? input.notes.trim() : existing.notes,
        },
      });

      const totalExpense = nextCost * addedQty;
      if (deductCash && totalExpense > 0) {
        const lastTx = await tx.cashTransaction.findFirst({
          orderBy: { createdAt: "desc" },
          select: { runningBalance: true, createdAt: true },
        });
        const currentBal = lastTx ? Number(lastTx.runningBalance) : 0;
        if (currentBal < totalExpense) {
          throw new Error(
            `Saldo kas showroom tidak mencukupi (Tersedia: ${formatRupiah(currentBal)}, Dibutuhkan: ${formatRupiah(totalExpense)}).`
          );
        }
        await tx.cashTransaction.create({
          data: {
            type: "OUT_OPERATIONAL",
            amount: totalExpense,
            runningBalance: currentBal - totalExpense,
            notes: `Restock bahan: ${existing.name} (+${addedQty} ${existing.unit} @ Rp ${nextCost.toLocaleString("id-ID")})`,
            proofUrl: input.receiptUrl || null,
            createdAt: new Date(
              Math.max(Date.now(), lastTx ? new Date(lastTx.createdAt).getTime() + 1 : 0)
            ),
            createdBy: actorLabel,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: session.userId,
          action: "UPDATE",
          entityType: "WorkshopSupply",
          entityId: existing.id,
          beforeData: JSON.parse(JSON.stringify(existing)),
          afterData: JSON.parse(JSON.stringify(updated)),
        },
      });

      return updated;
    });

    revalidatePath("/admin/workshop");
    revalidatePath("/admin/finance");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Gagal restock bahan:", error);
    return { success: false, error: error.message || "Gagal menambah stok bahan" };
  }
}

export async function recordSupplyUsageAction(input: RecordUsageInput) {
  try {
    const session = await requireRole(["OWNER", "ADMIN", "STAFF_ADMIN"]);
    const actorLabel = session.fullName || "Owner/Garasi";
    const qty = Number(input.quantityUsed);
    if (qty <= 0) {
      throw new Error("Kuantitas yang digunakan minimal 1");
    }

    const chargedHpp = Number(input.chargedHppAmount);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Ambil supply
      const supply = await tx.workshopSupply.findUnique({
        where: { id: input.supplyId },
      });
      if (!supply) {
        throw new Error("Barang persediaan tidak ditemukan.");
      }

      if (supply.currentStock < qty) {
        throw new Error(
          `Stok tidak mencukupi! Stok ${supply.name} tersisa ${supply.currentStock} ${supply.unit}, diminta ${qty} ${supply.unit}.`
        );
      }

      // 2. Ambil vehicle
      const vehicle = await tx.vehicle.findUnique({
        where: { id: input.vehicleId },
      });
      if (!vehicle) {
        throw new Error("Unit kendaraan tidak ditemukan.");
      }

      // 3. Kalkulasi modal bahan fisik vs margin jasa mandiri
      const unitCost = Number(supply.costPerUnit) * qty;
      const workshopMargin = chargedHpp - unitCost; // Selisih upah jasa mandiri garasi

      // 4. Kurangi stok fisik di gudang
      await tx.workshopSupply.update({
        where: { id: supply.id },
        data: {
          currentStock: { decrement: qty },
        },
      });

      // 5. Catat riwayat pemakaian
      const usage = await tx.workshopSupplyUsage.create({
        data: {
          supplyId: supply.id,
          vehicleId: vehicle.id,
          quantityUsed: qty,
          unitCostAtUsage: unitCost,
          chargedHppAmount: chargedHpp,
          workshopMargin: workshopMargin,
          serviceType: input.serviceType,
          recordedBy: actorLabel,
          notes: input.notes,
        },
      });

      // 6. Masukkan sebagai beban HPP mobil secara otomatis
      const category = input.serviceType === "SALON_MANDIRI" ? "DETAILING_SALON" : "OIL_AND_SERVICE";
      const desc =
        input.notes ||
        `${input.serviceType === "SALON_MANDIRI" ? "Salon & Detailing Mandiri" : "Ganti Oli & Servis Mandiri"} dari stok garasi (${qty} ${supply.unit} ${supply.name}). Modal bahan: Rp ${unitCost.toLocaleString("id-ID")}, Jasa mandiri showroom: Rp ${workshopMargin.toLocaleString("id-ID")}`;

      await tx.expense.create({
        data: {
          vehicleId: vehicle.id,
          category,
          amount: chargedHpp,
          date: new Date(),
          vendorName: "Garasi Mandiri Nur Mobil",
          notes: desc,
          createdBy: actorLabel,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: session.userId,
          action: "CREATE",
          entityType: "WorkshopSupplyUsage",
          entityId: usage.id,
          afterData: JSON.parse(
            JSON.stringify({
              supplyName: supply.name,
              vehiclePlate: vehicle.plateNumber,
              quantityUsed: qty,
              unitCost,
              chargedHpp,
              workshopMargin,
              remainingStock: supply.currentStock - qty,
            })
          ),
        },
      });

      return {
        usage,
        unitCost,
        chargedHpp,
        workshopMargin,
        remainingStock: supply.currentStock - qty,
      };
    });

    revalidatePath("/admin/workshop");
    revalidatePath("/admin/finance");
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      data: result,
      message: `Berhasil! Stok terpotong ${qty} unit. HPP Mobil ${input.vehicleId} bertambah Rp ${chargedHpp.toLocaleString("id-ID")}. Laba jasa mandiri showroom: Rp ${result.workshopMargin.toLocaleString("id-ID")}.`,
    };
  } catch (error: any) {
    console.error("Gagal mencatat pemakaian barang habis pakai:", error);
    return { success: false, error: error.message || "Gagal mencatat pemakaian barang" };
  }
}

export async function deleteWorkshopSupplyAction(id: string) {
  try {
    const session = await requireRole(["OWNER", "ADMIN", "STAFF_ADMIN"]);
    const usageCount = await prisma.workshopSupplyUsage.count({
      where: { supplyId: id },
    });
    if (usageCount > 0) {
      return {
        success: false,
        error: "Barang persediaan ini tidak dapat dihapus karena sudah memiliki riwayat pemakaian unit.",
      };
    }
    await prisma.$transaction(async (tx) => {
      const existing = await tx.workshopSupply.findUnique({ where: { id } });
      if (!existing) return;
      await tx.workshopSupply.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          actorUserId: session.userId,
          action: "DELETE",
          entityType: "WorkshopSupply",
          entityId: id,
          beforeData: JSON.parse(JSON.stringify(existing)),
        },
      });
    });
    revalidatePath("/admin/workshop");
    return { success: true };
  } catch (error: any) {
    console.error("Gagal menghapus stok bahan:", error);
    return { success: false, error: error.message || "Gagal menghapus stok bahan" };
  }
}
