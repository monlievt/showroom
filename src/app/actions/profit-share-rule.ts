"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  validateContiguousTiers,
  TierRuleInput,
  SingleProfitShareRuleInput,
} from "@/lib/validations/profit-share-rule";
import Decimal from "decimal.js";

export async function getActiveProfitShareRules() {
  try {
    const rules = await prisma.profitShareRule.findMany({
      where: { active: true },
      orderBy: { minProfit: "asc" },
    });

    return {
      success: true,
      data: rules.map((r) => ({
        id: r.id,
        name: r.name,
        beneficiaryGroup: r.beneficiaryGroup,
        minProfit: Number(r.minProfit),
        maxProfit: r.maxProfit !== null ? Number(r.maxProfit) : null,
        amountPerPerson: Number(r.amountPerPerson),
        numberOfPeople: r.numberOfPeople,
        active: r.active,
      })),
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mengambil aturan bagi hasil" };
  }
}

export async function saveProfitShareRules(
  tiers: SingleProfitShareRuleInput[],
  actorUserId: string = "system"
) {
  try {
    // 1. Validasi Contiguous (tanpa gap/overlap) di service layer
    const validation = validateContiguousTiers(tiers as TierRuleInput[]);
    if (!validation.valid) {
      throw new Error(validation.error || "Validasi tingkatan (tier) aturan bagi hasil gagal");
    }

    const result = await prisma.$transaction(async (tx) => {
      // Non-aktifkan semua aturan lama
      await tx.profitShareRule.updateMany({
        where: { active: true },
        data: { active: false, effectiveUntil: new Date() },
      });

      // Buat entri tier baru
      const createdTiers = [];
      for (const t of tiers) {
        const newRule = await tx.profitShareRule.create({
          data: {
            name: t.name,
            beneficiaryGroup: t.beneficiaryGroup || "MOTHER_SIBLING",
            minProfit: new Decimal(t.minProfit),
            maxProfit: t.maxProfit !== null && t.maxProfit !== undefined ? new Decimal(t.maxProfit) : null,
            amountPerPerson: new Decimal(t.amountPerPerson),
            numberOfPeople: t.numberOfPeople || 4,
            active: true,
            effectiveFrom: new Date(),
          },
        });
        createdTiers.push(newRule);
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId,
          action: "UPDATE",
          entityType: "ProfitShareRule",
          entityId: "batch",
          afterData: createdTiers as any,
        },
      });

      return createdTiers;
    });

    revalidatePath("/admin/finance");
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menyimpan aturan bagi hasil" };
  }
}
