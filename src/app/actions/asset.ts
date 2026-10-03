"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { showroomAssetSchema, ShowroomAssetInput } from "@/lib/validations/asset";
import Decimal from "decimal.js";

export async function getShowroomAssets() {
  try {
    const assets = await prisma.showroomAsset.findMany({
      orderBy: { purchaseDate: "desc" },
    });

    const totalPurchaseCost = assets.reduce(
      (sum, a) => sum + Number(a.purchaseCost),
      0
    );

    const totalCurrentValue = assets.reduce(
      (sum, a) => sum + Number(a.currentValue ?? a.purchaseCost),
      0
    );

    return {
      success: true,
      data: {
        items: assets.map((a) => ({
          id: a.id,
          name: a.name,
          category: a.category,
          purchaseDate: a.purchaseDate,
          purchaseCost: Number(a.purchaseCost),
          currentValue: a.currentValue ? Number(a.currentValue) : Number(a.purchaseCost),
          condition: a.condition,
          location: a.location,
          notes: a.notes,
          createdAt: a.createdAt,
        })),
        totalPurchaseCost,
        totalCurrentValue,
        totalItems: assets.length,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal mengambil daftar aset showroom",
    };
  }
}

export async function createShowroomAsset(
  input: ShowroomAssetInput,
  recordCashOut: boolean = false,
  actorUserId: string = "system"
) {
  try {
    const validated = showroomAssetSchema.parse(input);
    const cost = new Decimal(validated.purchaseCost);
    const currVal = validated.currentValue ? new Decimal(validated.currentValue) : cost;

    const result = await prisma.$transaction(async (tx) => {
      const asset = await tx.showroomAsset.create({
        data: {
          name: validated.name,
          category: validated.category,
          purchaseDate: validated.purchaseDate,
          purchaseCost: cost,
          currentValue: currVal,
          condition: validated.condition,
          location: validated.location || null,
          notes: validated.notes || null,
        },
      });

      // Jika user memilih untuk langsung potong kas BCA saat beli aset
      if (recordCashOut) {
        const latestTx = await tx.cashTransaction.findFirst({
          orderBy: { createdAt: "desc" },
        });
        const prevBal = latestTx ? new Decimal(latestTx.runningBalance.toString()) : new Decimal(0);
        const newBal = prevBal.minus(cost);

        await tx.cashTransaction.create({
          data: {
            type: "OUT_ASSET_PURCHASE",
            amount: cost,
            runningBalance: newBal,
            notes: `Pembelian Aset Showroom: ${validated.name}`,
            createdBy: actorUserId,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId,
          action: "CREATE",
          entityType: "ShowroomAsset",
          entityId: asset.id,
          afterData: asset as any,
        },
      });

      return asset;
    });

    revalidatePath("/admin/workshop");
    revalidatePath("/admin/finance");
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal mencatat aset baru",
    };
  }
}

export async function updateShowroomAsset(
  id: string,
  input: Partial<ShowroomAssetInput>,
  actorUserId: string = "system"
) {
  try {
    const data: any = {};
    if (input.name) data.name = input.name;
    if (input.category) data.category = input.category;
    if (input.purchaseDate) data.purchaseDate = input.purchaseDate;
    if (input.purchaseCost) data.purchaseCost = new Decimal(input.purchaseCost);
    if (input.currentValue !== undefined) {
      data.currentValue = input.currentValue ? new Decimal(input.currentValue) : null;
    }
    if (input.condition) data.condition = input.condition;
    if (input.location !== undefined) data.location = input.location;
    if (input.notes !== undefined) data.notes = input.notes;

    const updated = await prisma.showroomAsset.update({
      where: { id },
      data,
    });

    revalidatePath("/admin/workshop");
    revalidatePath("/admin/finance");
    return { success: true, data: updated };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal memperbarui aset",
    };
  }
}

export async function deleteShowroomAsset(id: string, actorUserId: string = "system") {
  try {
    await prisma.showroomAsset.delete({ where: { id } });
    revalidatePath("/admin/workshop");
    revalidatePath("/admin/finance");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal menghapus aset",
    };
  }
}
