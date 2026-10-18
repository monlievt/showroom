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

      // Jika profitSharePercent adalah 0, fallback ke defaultProfitSharePercent milik investor
      let finalProfitPercent = profitPercent;
      if (finalProfitPercent.isZero() && investor.defaultProfitSharePercent) {
        finalProfitPercent = new Decimal(investor.defaultProfitSharePercent);
      }

      // 2. Buat VehicleInvestment record
      const investment = await tx.vehicleInvestment.create({
        data: {
          vehicleId: validated.vehicleId,
          investorId: validated.investorId,
          capitalShare: capitalAmt,
          profitSharePercent: finalProfitPercent,
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

export async function saveVehicleInvestmentsAction(
  vehicleId: string,
  investments: {
    investorId: string;
    capitalShare: number;
    profitSharePercent: number;
  }[],
  actorUserId: string = "system"
) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findUnique({
        where: { id: vehicleId },
        include: {
          investments: true,
          sale: {
            include: {
              distributions: true,
            },
          },
        },
      });

      if (!vehicle) throw new Error("Unit kendaraan tidak ditemukan");

      // Cek apakah sudah pernah dilakukan bagi hasil pada unit ini
      const hasDistributed = vehicle.sale?.distributions?.some(
        (d) => !d.notes?.includes("[REVERSED]")
      );
      if (hasDistributed) {
        throw new Error(
          "Unit ini sudah selesai proses pembagian hasil (penjualan lunas). Alokasi investor tidak dapat diubah."
        );
      }

      const oldInvestments = vehicle.investments;

      // 1. Kembalikan alokasi lama ke saldo running balance investor jika sebelumnya sudah terikat
      for (const oldInv of oldInvestments) {
        await recordCapitalLedgerEntry(tx, {
          investorId: oldInv.investorId,
          type: "RETURNED",
          amount: oldInv.capitalShare,
          vehicleId: vehicle.id,
          notes: `Penyesuaian/pelepasan alokasi modal unit ${vehicle.brand} ${vehicle.model} (${vehicle.plateNumber})`,
          createdBy: actorUserId,
        });
      }

      // 2. Bersihkan record VehicleInvestment lama
      await tx.vehicleInvestment.deleteMany({
        where: { vehicleId },
      });

      // 3. Masukkan VehicleInvestment baru
      const createdInvestments = [];
      for (const inv of investments) {
        if (!inv.investorId || Number(inv.capitalShare) <= 0) continue;

        const capitalAmt = new Decimal(inv.capitalShare);
        const profitPercent = new Decimal(inv.profitSharePercent || 0);

        const newInv = await tx.vehicleInvestment.create({
          data: {
            vehicleId,
            investorId: inv.investorId,
            capitalShare: capitalAmt,
            profitSharePercent: profitPercent,
          },
          include: {
            investor: true,
          },
        });
        createdInvestments.push(newInv);

        // Catat alokasi di CapitalLedger (mengurangi saldo kas bebas investor menjadi modal terikat unit)
        await recordCapitalLedgerEntry(tx, {
          investorId: inv.investorId,
          type: "ALLOCATED",
          amount: capitalAmt,
          vehicleId: vehicle.id,
          notes: `Alokasi modal untuk unit ${vehicle.brand} ${vehicle.model} (${vehicle.plateNumber})`,
          createdBy: actorUserId,
        });
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId,
          action: "UPDATE",
          entityType: "VehicleInvestment",
          entityId: vehicleId,
          beforeData: oldInvestments as any,
          afterData: createdInvestments as any,
        },
      });

      return createdInvestments;
    });

    revalidatePath("/admin/finance");
    revalidatePath("/admin/investors");
    revalidatePath("/admin/inventory");
    revalidatePath(`/admin/inventory/${vehicleId}`);
    revalidatePath(`/admin/inventory/${vehicleId}/edit`);

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error saving vehicle investments:", error);
    return { success: false, error: error.message || "Gagal menyimpan alokasi investor" };
  }
}
