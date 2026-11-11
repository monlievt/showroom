"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { showroomAssetSchema, ShowroomAssetInput } from "@/lib/validations/asset";
import Decimal from "decimal.js";

export async function getShowroomAssets() {
  try {
    await requireRole(["OWNER", "ADMIN", "STAFF_ADMIN"]);
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
  recordCashOut: boolean = false
) {
  try {
    const session = await requireRole(["OWNER", "ADMIN", "STAFF_ADMIN"]);
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
          receiptUrl: validated.proofUrls && validated.proofUrls.length > 0
            ? JSON.stringify(validated.proofUrls)
            : (validated.receiptUrl || null),
        },
      });

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
            createdBy: session.fullName || session.userId,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: session.userId,
          action: "CREATE",
          entityType: "ShowroomAsset",
          entityId: asset.id,
          afterData: JSON.parse(JSON.stringify(asset)),
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
  input: Partial<ShowroomAssetInput>
) {
  try {
    const session = await requireRole(["OWNER", "ADMIN", "STAFF_ADMIN"]);

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.showroomAsset.findUnique({ where: { id } });
      if (!existing) {
        throw new Error("Data aset tidak ditemukan.");
      }

      const data: Record<string, unknown> = {};
      if (input.name) data.name = input.name;
      if (input.category) data.category = input.category;
      if (input.purchaseDate) data.purchaseDate = input.purchaseDate;
      if (input.purchaseCost !== undefined) data.purchaseCost = new Decimal(input.purchaseCost);
      if (input.currentValue !== undefined) {
        data.currentValue = input.currentValue ? new Decimal(input.currentValue) : null;
      }
      if (input.condition) data.condition = input.condition;
      if (input.location !== undefined) data.location = input.location;
      if (input.notes !== undefined) data.notes = input.notes;

      const nextAsset = await tx.showroomAsset.update({
        where: { id },
        data,
      });

      // Jika nilai beli berubah dan sebelumnya pernah memotong kas, catat selisihnya di buku kas
      if (input.purchaseCost !== undefined) {
        const hadCashPurchase = await tx.cashTransaction.findFirst({
          where: {
            type: "OUT_ASSET_PURCHASE",
            notes: { contains: existing.name },
          },
        });
        if (hadCashPurchase) {
          const diff = new Decimal(input.purchaseCost).minus(
            new Decimal(existing.purchaseCost.toString())
          );
          if (!diff.isZero()) {
            const latestTx = await tx.cashTransaction.findFirst({
              orderBy: { createdAt: "desc" },
            });
            const prevBal = latestTx
              ? new Decimal(latestTx.runningBalance.toString())
              : new Decimal(0);
            const newBal = diff.gt(0) ? prevBal.minus(diff) : prevBal.plus(diff.abs());

            await tx.cashTransaction.create({
              data: {
                type: diff.gt(0) ? "OUT_ASSET_PURCHASE" : "IN_OTHER",
                amount: diff.abs(),
                runningBalance: newBal,
                notes: `Koreksi nilai beli aset "${nextAsset.name}" (${diff.gt(0) ? "+" : "-"}Rp ${diff.abs().toNumber().toLocaleString("id-ID")})`,
                createdBy: session.fullName || session.userId,
              },
            });
          }
        }
      }

      await tx.auditLog.create({
        data: {
          actorUserId: session.userId,
          action: "UPDATE",
          entityType: "ShowroomAsset",
          entityId: id,
          beforeData: JSON.parse(JSON.stringify(existing)),
          afterData: JSON.parse(JSON.stringify(nextAsset)),
        },
      });

      return nextAsset;
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

export async function deleteShowroomAsset(id: string) {
  try {
    const session = await requireRole(["OWNER", "ADMIN", "STAFF_ADMIN"]);

    await prisma.$transaction(async (tx) => {
      const existing = await tx.showroomAsset.findUnique({ where: { id } });
      if (!existing) {
        throw new Error("Data aset tidak ditemukan.");
      }

      const hadCashPurchase = await tx.cashTransaction.findFirst({
        where: {
          type: "OUT_ASSET_PURCHASE",
          notes: { contains: existing.name },
        },
      });

      if (hadCashPurchase) {
        const latestTx = await tx.cashTransaction.findFirst({
          orderBy: { createdAt: "desc" },
        });
        const prevBal = latestTx
          ? new Decimal(latestTx.runningBalance.toString())
          : new Decimal(0);
        const refund = new Decimal(existing.purchaseCost.toString());

        await tx.cashTransaction.create({
          data: {
            type: "IN_OTHER",
            amount: refund,
            runningBalance: prevBal.plus(refund),
            notes: `Pembatalan/hapus aset showroom: ${existing.name}`,
            createdBy: session.fullName || session.userId,
          },
        });
      }

      await tx.showroomAsset.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          actorUserId: session.userId,
          action: "DELETE",
          entityType: "ShowroomAsset",
          entityId: id,
          beforeData: JSON.parse(JSON.stringify(existing)),
        },
      });
    });

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
