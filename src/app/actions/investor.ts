"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { investorSchema, InvestorInput } from "@/lib/validations/investor";
import Decimal from "decimal.js";

export async function getInvestors() {
  try {
    const investors = await prisma.investor.findMany({
      include: {
        userProfile: true,
        investments: {
          include: {
            vehicle: {
              select: {
                id: true,
                plateNumber: true,
                brand: true,
                model: true,
                status: true,
              },
            },
          },
        },
        ledgerEntries: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        distributions: {
          select: {
            calculatedAmount: true,
            isPaid: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: investors.map((inv) => {
        const latestLedger = inv.ledgerEntries[0];
        const currentBalance = latestLedger ? Number(latestLedger.runningBalance) : 0;
        const totalProfitDistributed = inv.distributions.reduce(
          (sum, d) => sum + Number(d.calculatedAmount),
          0
        );

        return {
          id: inv.id,
          name: inv.name,
          phone: inv.phone,
          type: inv.type,
          bankName: inv.bankName,
          bankAccountNumber: inv.bankAccountNumber,
          bankAccountName: inv.bankAccountName,
          defaultProfitSharePercent: inv.defaultProfitSharePercent
            ? Number(inv.defaultProfitSharePercent)
            : null,
          createdAt: inv.createdAt,
          userProfile: inv.userProfile,
          currentBalance,
          investmentsCount: inv.investments.length,
          totalProfitDistributed,
          investments: inv.investments.map((item) => ({
            id: item.id,
            vehicleId: item.vehicleId,
            vehiclePlate: item.vehicle.plateNumber,
            vehicleName: `${item.vehicle.brand} ${item.vehicle.model}`,
            vehicleStatus: item.vehicle.status,
            capitalShare: Number(item.capitalShare),
            profitSharePercent: Number(item.profitSharePercent),
          })),
        };
      }),
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mengambil data investor" };
  }
}

export async function createInvestor(input: InvestorInput, actorUserId: string = "system") {
  try {
    const validated = investorSchema.parse(input);

    const investor = await prisma.$transaction(async (tx) => {
      const newInvestor = await tx.investor.create({
        data: {
          name: validated.name,
          phone: validated.phone || null,
          type: validated.type,
          bankName: validated.bankName || null,
          bankAccountNumber: validated.bankAccountNumber || null,
          bankAccountName: validated.bankAccountName || null,
          defaultProfitSharePercent:
            validated.defaultProfitSharePercent !== undefined &&
            validated.defaultProfitSharePercent !== null
              ? new Decimal(validated.defaultProfitSharePercent)
              : null,
        },
      });

      // Jika ada authUserId yang ingin ditautkan sebagai akun UserProfile
      if (validated.authUserId) {
        await tx.userProfile.create({
          data: {
            authUserId: validated.authUserId,
            role: "INVESTOR",
            fullName: validated.name,
            phone: validated.phone,
            investorId: newInvestor.id,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId,
          action: "CREATE",
          entityType: "Investor",
          entityId: newInvestor.id,
          afterData: newInvestor as any,
        },
      });

      return newInvestor;
    });

    revalidatePath("/admin/investors");
    revalidatePath("/admin/investors/accounts");
    revalidatePath("/admin/finance");
    return { success: true, data: investor };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal membuat profil investor" };
  }
}

export async function updateInvestor(
  id: string,
  input: Partial<InvestorInput>,
  actorUserId: string = "system"
) {
  try {
    const existing = await prisma.investor.findUnique({ where: { id } });
    if (!existing) throw new Error("Investor tidak ditemukan");

    const updated = await prisma.$transaction(async (tx) => {
      const dataToUpdate: any = {};
      if (input.name !== undefined) dataToUpdate.name = input.name;
      if (input.phone !== undefined) dataToUpdate.phone = input.phone || null;
      if (input.type !== undefined) dataToUpdate.type = input.type;
      if (input.bankName !== undefined) dataToUpdate.bankName = input.bankName || null;
      if (input.bankAccountNumber !== undefined) dataToUpdate.bankAccountNumber = input.bankAccountNumber || null;
      if (input.bankAccountName !== undefined) dataToUpdate.bankAccountName = input.bankAccountName || null;
      if (input.defaultProfitSharePercent !== undefined) {
        dataToUpdate.defaultProfitSharePercent =
          input.defaultProfitSharePercent !== null && input.defaultProfitSharePercent !== undefined
            ? new Decimal(input.defaultProfitSharePercent)
            : null;
      }

      const inv = await tx.investor.update({
        where: { id },
        data: dataToUpdate,
      });

      await tx.auditLog.create({
        data: {
          actorUserId,
          action: "UPDATE",
          entityType: "Investor",
          entityId: id,
          beforeData: existing as any,
          afterData: inv as any,
        },
      });

      return inv;
    });

    revalidatePath("/admin/investors");
    revalidatePath("/admin/investors/accounts");
    revalidatePath("/admin/finance");
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal memperbarui data investor" };
  }
}

export async function getInvestorDetails(investorId: string) {
  try {
    const investor = await prisma.investor.findUnique({
      where: { id: investorId },
      include: {
        userProfile: true,
        investments: {
          include: {
            vehicle: true,
          },
          orderBy: { id: "desc" },
        },
        ledgerEntries: {
          include: {
            vehicle: {
              select: {
                plateNumber: true,
                brand: true,
                model: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        distributions: {
          include: {
            sale: {
              include: {
                vehicle: {
                  select: {
                    plateNumber: true,
                    brand: true,
                    model: true,
                  },
                },
              },
            },
          },
          orderBy: { calculatedAt: "desc" },
        },
      },
    });

    if (!investor) throw new Error("Investor tidak ditemukan");

    return { success: true, data: investor };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mengambil rincian investor" };
  }
}
