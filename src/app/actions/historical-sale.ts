"use server";

import { prisma } from "@/lib/prisma";
import Decimal from "decimal.js";
import { revalidatePath } from "next/cache";

export interface HistoricalSaleFilter {
  search?: string;
  brand?: string;
  year?: number;
}

export async function getHistoricalSalesAction(filters?: HistoricalSaleFilter) {
  try {
    const where: any = {};

    if (filters?.brand && filters.brand !== "ALL") {
      where.brand = filters.brand;
    }

    if (filters?.year && filters.year > 0) {
      where.year = filters.year;
    }

    if (filters?.search) {
      const search = filters.search.trim();
      where.OR = [
        { plateNumber: { contains: search } },
        { brand: { contains: search } },
        { model: { contains: search } },
        { notes: { contains: search } },
      ];
    }

    const items = await prisma.historicalSale.findMany({
      where,
      orderBy: [
        { saleDate: "desc" },
        { createdAt: "desc" },
      ],
    });

    // Hitung ringkasan statistik
    let totalOmzet = new Decimal(0);
    let totalProfit = new Decimal(0);
    let totalHpp = new Decimal(0);
    let totalLoss = new Decimal(0);
    let totalGain = new Decimal(0);
    let lossCount = 0;
    let profitCount = 0;

    const serialized = items.map((item) => {
      const hppNum = Number(item.totalHpp);
      const lakuNum = Number(item.sellingPrice);
      const profitNum = Number(item.grossProfit);
      const marginPct = lakuNum > 0 ? (profitNum / lakuNum) * 100 : 0;

      totalOmzet = totalOmzet.plus(item.sellingPrice);
      totalProfit = totalProfit.plus(item.grossProfit);
      totalHpp = totalHpp.plus(item.totalHpp);

      if (profitNum < 0) {
        totalLoss = totalLoss.plus(Math.abs(profitNum));
        lossCount++;
      } else if (profitNum > 0) {
        totalGain = totalGain.plus(profitNum);
        profitCount++;
      }

      return {
        id: item.id,
        plateNumber: item.plateNumber,
        brand: item.brand,
        model: item.model,
        year: item.year,
        color: item.color,
        transmission: item.transmission,
        sourceType: item.sourceType,
        auctionHouse: item.auctionHouse,
        purchasePrice: Number(item.purchasePrice),
        purchaseDate: item.purchaseDate?.toISOString() || null,
        repairExpenses: Number(item.repairExpenses),
        totalHpp: hppNum,
        sellingPrice: lakuNum,
        saleDate: item.saleDate?.toISOString() || null,
        grossProfit: profitNum,
        marginPercent: Math.round(marginPct * 10) / 10,
        buyerName: item.buyerName,
        notes: item.notes,
        expenseDetails: item.expenseDetails as any,
        sourceFile: item.sourceFile,
      };
    });

    const totalCount = serialized.length;
    const avgProfitPerUnit = totalCount > 0 ? totalProfit.dividedBy(totalCount).toNumber() : 0;
    const avgMarginPercent = totalOmzet.greaterThan(0)
      ? totalProfit.dividedBy(totalOmzet).times(100).toNumber()
      : 0;

    return {
      success: true,
      data: {
        items: serialized,
        summary: {
          totalCount,
          totalOmzet: totalOmzet.toNumber(),
          totalProfit: totalProfit.toNumber(),
          totalGain: totalGain.toNumber(),
          totalLoss: totalLoss.toNumber(),
          profitCount,
          lossCount,
          totalHpp: totalHpp.toNumber(),
          avgProfitPerUnit,
          avgMarginPercent: Math.round(avgMarginPercent * 10) / 10,
        },
      },
    };
  } catch (error: any) {
    console.error("Error fetching historical sales:", error);
    return {
      success: false,
      error: error.message || "Gagal memuat data arsip penjualan",
    };
  }
}

export async function updateHistoricalSaleAction(
  id: string,
  data: {
    sellingPrice?: number;
    totalHpp?: number;
    notes?: string;
    buyerName?: string;
    plateNumber?: string;
    purchaseDate?: string | null;
    saleDate?: string | null;
  }
) {
  try {
    const existing = await prisma.historicalSale.findUnique({
      where: { id },
    });
    if (!existing) {
      return { success: false, error: "Data arsip tidak ditemukan" };
    }

    const sellingPrice = data.sellingPrice !== undefined ? new Decimal(data.sellingPrice) : existing.sellingPrice;
    const totalHpp = data.totalHpp !== undefined ? new Decimal(data.totalHpp) : existing.totalHpp;
    const grossProfit = sellingPrice.minus(totalHpp);

    const updated = await prisma.historicalSale.update({
      where: { id },
      data: {
        ...(data.plateNumber && { plateNumber: data.plateNumber.toUpperCase().trim() }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.buyerName !== undefined && { buyerName: data.buyerName }),
        ...(data.purchaseDate !== undefined && {
          purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        }),
        ...(data.saleDate !== undefined && {
          saleDate: data.saleDate ? new Date(data.saleDate) : null,
        }),
        sellingPrice,
        totalHpp,
        grossProfit,
      },
    });

    revalidatePath("/admin/archive");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error updating historical sale:", error);
    return { success: false, error: error.message || "Gagal memperbarui data arsip" };
  }
}

export async function deleteHistoricalSaleAction(id: string) {
  try {
    const existing = await prisma.historicalSale.findUnique({
      where: { id },
    });
    if (!existing) {
      return { success: false, error: "Data arsip tidak ditemukan" };
    }

    await prisma.historicalSale.delete({
      where: { id },
    });

    revalidatePath("/admin/archive");
    return { success: true, message: `Data unit ${existing.plateNumber} berhasil dihapus dari arsip.` };
  } catch (error: any) {
    console.error("Error deleting historical sale:", error);
    return { success: false, error: error.message || "Gagal menghapus data arsip" };
  }
}

