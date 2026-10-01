"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { 
  createSaleSchema, 
  createSalePaymentSchema, 
  type CreateSaleInput, 
  type CreateSalePaymentInput 
} from "@/lib/validations/sale";
import { calculateSaleSettlement, getReceivableDueDateStatus } from "@/lib/calculations/sale";

export async function createSaleAction(input: CreateSaleInput) {
  try {
    const validated = createSaleSchema.parse(input);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Cek unit kendaraan
      const vehicle = await tx.vehicle.findUnique({
        where: { id: validated.vehicleId },
        select: { id: true, brand: true, model: true, plateNumber: true, status: true },
      });
      if (!vehicle) {
        throw new Error("Unit kendaraan tidak ditemukan.");
      }
      if (vehicle.status === "SOLD_SETTLED") {
        throw new Error("Unit kendaraan ini sudah terjual lunas sebelumnya.");
      }

      // 2. Buat atau cari Buyer
      let buyerId: string;
      if (validated.buyerPhone) {
        const existingBuyer = await tx.buyer.findFirst({
          where: { phone: validated.buyerPhone },
        });
        if (existingBuyer) {
          buyerId = existingBuyer.id;
        } else {
          const newBuyer = await tx.buyer.create({
            data: {
              name: validated.buyerName,
              phone: validated.buyerPhone,
              isShowroom: validated.buyerIsShowroom,
              address: validated.buyerAddress,
              notes: validated.buyerNotes,
            },
          });
          buyerId = newBuyer.id;
        }
      } else {
        const newBuyer = await tx.buyer.create({
          data: {
            name: validated.buyerName,
            phone: validated.buyerPhone,
            isShowroom: validated.buyerIsShowroom,
            address: validated.buyerAddress,
            notes: validated.buyerNotes,
          },
        });
        buyerId = newBuyer.id;
      }

      // 3. Buat Sale
      const sale = await tx.sale.create({
        data: {
          vehicleId: validated.vehicleId,
          buyerId,
          saleDate: validated.saleDate,
          saleType: validated.saleType as any,
          sellingPrice: validated.sellingPrice,
          dueDate: validated.dueDate,
        },
      });

      // 4. Proses Pembayaran Awal / DP jika ada
      let isFullyPaid = false;
      if (validated.initialPaymentAmount && validated.initialPaymentAmount > 0) {
        const payment = await tx.salePayment.create({
          data: {
            saleId: sale.id,
            amount: validated.initialPaymentAmount,
            paidAt: validated.saleDate,
            method: validated.initialPaymentMethod,
            tradeInVehicleId: validated.tradeInVehicleId,
            notes: validated.initialPaymentNotes || "Pembayaran awal / DP saat transaksi",
            recordedBy: "Owner/Admin",
          },
        });

        // Jika bukan tukar tambah (berupa uang riil cash/transfer), catat di buku kas CashTransaction
        if (validated.initialPaymentMethod !== "TRADE_IN") {
          const lastCashTx = await tx.cashTransaction.findFirst({
            orderBy: { createdAt: "desc" },
            select: { runningBalance: true },
          });
          const currentBalance = lastCashTx ? Number(lastCashTx.runningBalance) : 0;
          const newBalance = currentBalance + validated.initialPaymentAmount;

          await tx.cashTransaction.create({
            data: {
              type: "IN_SALE_PAYMENT",
              amount: validated.initialPaymentAmount,
              relatedVehicleId: vehicle.id,
              relatedSaleId: sale.id,
              runningBalance: newBalance,
              notes: `Penerimaan DP/Pelunasan: ${vehicle.brand} ${vehicle.model} (${vehicle.plateNumber})`,
              createdBy: "Owner/Admin",
            },
          });
        }

        isFullyPaid = validated.initialPaymentAmount >= validated.sellingPrice;
      }

      // 5. Update Status Kendaraan
      let nextVehicleStatus: "SOLD_SETTLED" | "AT_SHOWROOM_PENDING" | "BOOKED";
      if (isFullyPaid) {
        nextVehicleStatus = "SOLD_SETTLED";
      } else if (validated.saleType === "SHOWROOM") {
        nextVehicleStatus = "AT_SHOWROOM_PENDING";
      } else {
        nextVehicleStatus = "BOOKED";
      }

      await tx.vehicle.update({
        where: { id: validated.vehicleId },
        data: { status: nextVehicleStatus },
      });

      // 6. AuditLog
      await tx.auditLog.create({
        data: {
          actorUserId: "admin-owner-001",
          action: "CREATE",
          entityType: "Sale",
          entityId: sale.id,
          afterData: {
            saleId: sale.id,
            sellingPrice: validated.sellingPrice,
            initialPayment: validated.initialPaymentAmount,
            vehicleStatus: nextVehicleStatus,
          } as any,
        },
      });

      return sale;
    });

    revalidatePath("/admin/sales");
    revalidatePath("/admin/inventory");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error creating sale:", error);
    return { success: false, error: error.message || "Gagal mencatat penjualan unit" };
  }
}

export async function addSalePaymentAction(input: CreateSalePaymentInput) {
  try {
    const validated = createSalePaymentSchema.parse(input);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Ambil data Sale beserta pembayaran sebelumnya & data investor
      const sale = await tx.sale.findUnique({
        where: { id: validated.saleId },
        include: {
          vehicle: {
            include: {
              investments: {
                include: {
                  investor: true,
                },
              },
            },
          },
          payments: true,
        },
      });
      if (!sale) {
        throw new Error("Transaksi penjualan tidak ditemukan.");
      }

      // 2. Buat record SalePayment
      const payment = await tx.salePayment.create({
        data: {
          saleId: validated.saleId,
          amount: validated.amount,
          paidAt: validated.paidAt,
          method: validated.method,
          tradeInVehicleId: validated.tradeInVehicleId,
          notes: validated.notes,
          recordedBy: "Owner/Admin",
        },
      });

      // 3. Catat di CashTransaction jika pembayaran berupa uang tunai / transfer
      if (validated.method !== "TRADE_IN") {
        const lastCashTx = await tx.cashTransaction.findFirst({
          orderBy: { createdAt: "desc" },
          select: { runningBalance: true },
        });
        const currentBalance = lastCashTx ? Number(lastCashTx.runningBalance) : 0;
        const newBalance = currentBalance + validated.amount;

        await tx.cashTransaction.create({
          data: {
            type: "IN_SALE_PAYMENT",
            amount: validated.amount,
            relatedVehicleId: sale.vehicleId,
            relatedSaleId: sale.id,
            runningBalance: newBalance,
            notes: `Pembayaran angsuran/pelunasan: ${sale.vehicle.brand} ${sale.vehicle.model} (${sale.vehicle.plateNumber})`,
            createdBy: "Owner/Admin",
          },
        });
      }

      // 4. Hitung ulang total pembayaran
      const allPayments = [...sale.payments, payment];
      const settlement = calculateSaleSettlement(sale.sellingPrice, allPayments);

      // Jika sudah lunas 100%, update status kendaraan ke SOLD_SETTLED
      if (settlement.isFullyPaid && sale.vehicle.status !== "SOLD_SETTLED") {
        await tx.vehicle.update({
          where: { id: sale.vehicleId },
          data: { status: "SOLD_SETTLED" },
        });
      }

      // 5. AuditLog
      await tx.auditLog.create({
        data: {
          actorUserId: "admin-owner-001",
          action: "CREATE",
          entityType: "SalePayment",
          entityId: payment.id,
          afterData: {
            amount: validated.amount,
            method: validated.method,
            isFullyPaid: settlement.isFullyPaid,
          } as any,
        },
      });

      const investments = (sale.vehicle as any).investments || [];
      const hasInvestor = investments.length > 0;
      const investorNames = investments.map((inv: any) => inv.investor?.name || "Investor");

      return {
        payment,
        isFullyPaid: settlement.isFullyPaid,
        saleId: sale.id,
        vehiclePlate: sale.vehicle.plateNumber,
        vehicleName: `${sale.vehicle.brand} ${sale.vehicle.model}`,
        hasInvestor,
        investorNames,
      };
    });

    revalidatePath("/admin/sales");
    revalidatePath("/admin/inventory");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error adding sale payment:", error);
    return { success: false, error: error.message || "Gagal mencatat pembayaran" };
  }
}

export async function getSalesAction(filters?: {
  status?: "ALL" | "PENDING_RECEIVABLES" | "SETTLED";
  search?: string;
}) {
  try {
    const sales = await prisma.sale.findMany({
      orderBy: { saleDate: "desc" },
      include: {
        vehicle: {
          select: {
            id: true,
            brand: true,
            model: true,
            year: true,
            plateNumber: true,
            color: true,
            status: true,
            purchasePrice: true,
            expenses: {
              select: { amount: true },
            },
            investments: {
              include: {
                investor: {
                  select: { id: true, name: true, type: true },
                },
              },
            },
          },
        },
        distributions: true,
        buyer: true,
        payments: {
          orderBy: { paidAt: "desc" },
          include: {
            tradeInVehicle: {
              select: {
                id: true,
                brand: true,
                model: true,
                plateNumber: true,
              },
            },
          },
        },
      },
    });

    const now = new Date();

    const formatted = sales.map((sale) => {
      const settlement = calculateSaleSettlement(sale.sellingPrice, sale.payments);
      const dueStatus = getReceivableDueDateStatus(sale.dueDate, now);

      const totalExpense = sale.vehicle.expenses.reduce(
        (acc, e) => acc + Number(e.amount),
        0
      );
      const hpp = Number(sale.vehicle.purchasePrice) + totalExpense;
      const grossProfit = Number(sale.sellingPrice) - hpp;

      const activeDistributions = (sale as any).distributions?.filter(
        (d: any) => !d.notes?.includes("[REVERSED]")
      ) || [];
      const hasInvestor = (sale.vehicle as any).investments?.length > 0;
      const isDistributed = activeDistributions.length > 0;
      const investorNames = ((sale.vehicle as any).investments || []).map(
        (inv: any) => inv.investor?.name || "Investor"
      );

      let profitDistributionStatus: "NOT_SETTLED" | "READY_FOR_DISTRIBUTION" | "DISTRIBUTED" | "OWNER_ONLY" = "NOT_SETTLED";
      if (settlement.isFullyPaid) {
        if (isDistributed) {
          profitDistributionStatus = "DISTRIBUTED";
        } else if (hasInvestor) {
          profitDistributionStatus = "READY_FOR_DISTRIBUTION";
        } else {
          profitDistributionStatus = "OWNER_ONLY";
        }
      }

      return {
        id: sale.id,
        saleDate: sale.saleDate,
        saleType: sale.saleType,
        sellingPrice: Number(sale.sellingPrice),
        dueDate: sale.dueDate,
        paidAmount: settlement.paidAmount.toNumber(),
        remainingAmount: settlement.remainingAmount.toNumber(),
        isFullyPaid: settlement.isFullyPaid,
        percentagePaid: settlement.percentagePaid,
        dueStatus,
        hpp,
        grossProfit,
        hasInvestor,
        investorNames,
        profitDistributionStatus,
        vehicle: {
          id: sale.vehicle.id,
          brand: sale.vehicle.brand,
          model: sale.vehicle.model,
          year: sale.vehicle.year,
          plateNumber: sale.vehicle.plateNumber,
          color: sale.vehicle.color,
          status: sale.vehicle.status,
        },
        buyer: sale.buyer,
        payments: sale.payments.map((p) => ({
          id: p.id,
          amount: Number(p.amount),
          paidAt: p.paidAt,
          method: p.method,
          notes: p.notes,
          tradeInVehicle: p.tradeInVehicle,
        })),
      };
    });

    let filtered = formatted;
    if (filters?.status === "PENDING_RECEIVABLES") {
      filtered = filtered.filter((s) => !s.isFullyPaid);
    } else if (filters?.status === "SETTLED") {
      filtered = filtered.filter((s) => s.isFullyPaid);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.vehicle.plateNumber.toLowerCase().includes(q) ||
          s.vehicle.brand.toLowerCase().includes(q) ||
          s.vehicle.model.toLowerCase().includes(q) ||
          s.buyer.name.toLowerCase().includes(q) ||
          (s.buyer.phone && s.buyer.phone.includes(q))
      );
    }

    return { success: true, data: filtered };
  } catch (error: any) {
    console.error("Error fetching sales:", error);
    return { success: false, error: error.message || "Gagal memuat data penjualan" };
  }
}

export async function getSaleByIdAction(id: string) {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        vehicle: {
          select: {
            id: true,
            brand: true,
            model: true,
            year: true,
            plateNumber: true,
            color: true,
            status: true,
            purchasePrice: true,
            expenses: {
              select: { amount: true },
            },
            investments: {
              include: {
                investor: {
                  select: { id: true, name: true, type: true },
                },
              },
            },
          },
        },
        distributions: true,
        buyer: true,
        payments: {
          orderBy: { paidAt: "desc" },
          include: {
            tradeInVehicle: {
              select: {
                id: true,
                brand: true,
                model: true,
                plateNumber: true,
              },
            },
          },
        },
      },
    });

    if (!sale) {
      return { success: false, error: "Data penjualan tidak ditemukan" };
    }

    const now = new Date();
    const settlement = calculateSaleSettlement(sale.sellingPrice, sale.payments);
    const dueStatus = getReceivableDueDateStatus(sale.dueDate, now);

    const totalExpense = sale.vehicle.expenses.reduce(
      (acc, e) => acc + Number(e.amount),
      0
    );
    const hpp = Number(sale.vehicle.purchasePrice) + totalExpense;
    const grossProfit = Number(sale.sellingPrice) - hpp;

    const activeDistributions = (sale as any).distributions?.filter(
      (d: any) => !d.notes?.includes("[REVERSED]")
    ) || [];
    const hasInvestor = (sale.vehicle as any).investments?.length > 0;
    const isDistributed = activeDistributions.length > 0;
    const investorNames = ((sale.vehicle as any).investments || []).map(
      (inv: any) => inv.investor?.name || "Investor"
    );

    let profitDistributionStatus: "NOT_SETTLED" | "READY_FOR_DISTRIBUTION" | "DISTRIBUTED" | "OWNER_ONLY" = "NOT_SETTLED";
    if (settlement.isFullyPaid) {
      if (isDistributed) {
        profitDistributionStatus = "DISTRIBUTED";
      } else if (hasInvestor) {
        profitDistributionStatus = "READY_FOR_DISTRIBUTION";
      } else {
        profitDistributionStatus = "OWNER_ONLY";
      }
    }

    return {
      success: true,
      data: {
        id: sale.id,
        saleDate: sale.saleDate,
        saleType: sale.saleType,
        sellingPrice: Number(sale.sellingPrice),
        dueDate: sale.dueDate,
        paidAmount: settlement.paidAmount.toNumber(),
        remainingAmount: settlement.remainingAmount.toNumber(),
        isFullyPaid: settlement.isFullyPaid,
        percentagePaid: settlement.percentagePaid,
        dueStatus,
        hpp,
        grossProfit,
        hasInvestor,
        investorNames,
        profitDistributionStatus,
        vehicle: {
          id: sale.vehicle.id,
          brand: sale.vehicle.brand,
          model: sale.vehicle.model,
          year: sale.vehicle.year,
          plateNumber: sale.vehicle.plateNumber,
          color: sale.vehicle.color,
          status: sale.vehicle.status,
        },
        buyer: sale.buyer,
        payments: sale.payments.map((p) => ({
          id: p.id,
          amount: Number(p.amount),
          paidAt: p.paidAt,
          method: p.method,
          notes: p.notes,
          tradeInVehicle: p.tradeInVehicle,
        })),
      },
    };
  } catch (error: any) {
    console.error("Error fetching sale by ID:", error);
    return { success: false, error: error.message || "Gagal memuat detail penjualan" };
  }
}

