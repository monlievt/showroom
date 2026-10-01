"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { vehicleInvestmentSchema, VehicleInvestmentInput } from "@/lib/validations/investment";
import { recordCapitalLedgerEntry } from "./capital-ledger";
import Decimal from "decimal.js";

export async function addVehicleInvestment(
  input: VehicleInvestmentInput,
  actorUserId: string = "system"
) {
  try {
    const validated = vehicleInvestmentSchema.parse(input);
    const capitalAmt = new Decimal(validated.capitalShare);
    const profitPercent = new Decimal(validated.profitSharePercent);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Cek keberadaan vehicle dan investor
      const vehicle = await tx.vehicle.findUnique({ where: { id: validated.vehicleId } });
      if (!vehicle) throw new Error("Unit kendaraan tidak ditemukan");

      const investor = await tx.investor.findUnique({ where: { id: validated.investorId } });
      if (!investor) throw new Error("Investor tidak ditemukan");

      // 2. Buat VehicleInvestment record
      const investment = await tx.vehicleInvestment.create({
        data: {
          vehicleId: validated.vehicleId,
          investorId: validated.investorId,
          capitalShare: capitalAmt,
          profitSharePercent: profitPercent,
        },
      });

      // 3. Catat di CapitalLedger sebagai ALLOCATED (modal terikat ke unit kendaraan)
      const ledgerEntry = await recordCapitalLedgerEntry(tx, {
        investorId: validated.investorId,
        type: "ALLOCATED",
        amount: capitalAmt,
        vehicleId: validated.vehicleId,
        notes: `Alokasi modal untuk unit ${vehicle.brand} ${vehicle.model} (${vehicle.plateNumber})`,
        createdBy: actorUserId,
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId,
          action: "CREATE",
          entityType: "VehicleInvestment",
          entityId: investment.id,
          afterData: {
            investment,
            ledger: ledgerEntry,
          } as any,
        },
      });

      return investment;
    });

    revalidatePath("/admin/finance");
    revalidatePath(`/admin/inventory`);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mencatat investasi unit" };
  }
}

export async function getVehicleInvestments(vehicleId: string) {
  try {
    const investments = await prisma.vehicleInvestment.findMany({
      where: { vehicleId },
      include: {
        investor: true,
      },
    });

    return {
      success: true,
      data: investments.map((inv) => ({
        id: inv.id,
        investorId: inv.investorId,
        investorName: inv.investor.name,
        investorType: inv.investor.type,
        capitalShare: Number(inv.capitalShare),
        profitSharePercent: Number(inv.profitSharePercent),
      })),
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mengambil data investasi unit" };
  }
}
