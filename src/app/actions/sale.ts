"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import {
  createSaleSchema,
  updateSaleSchema,
  createSalePaymentSchema,
  type CreateSaleInput,
  type UpdateSaleInput,
  type CreateSalePaymentInput,
} from "@/lib/validations/sale";
import { calculateSaleSettlement, getReceivableDueDateStatus } from "@/lib/calculations/sale";
import { sanitizeActionError, stripPlateSpaces } from "@/lib/utils";

export async function createSaleAction(input: CreateSaleInput) {
  try {
    const session = await requireRole(["OWNER", "ADMIN", "STAFF_ADMIN"]);
    const actorLabel = session.fullName || "Owner/Admin";
    const validated = createSaleSchema.parse(input);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Cek unit kendaraan & pastikan belum punya transaksi penjualan aktif
      const vehicle = await tx.vehicle.findUnique({
        where: { id: validated.vehicleId },
        select: {
          id: true,
          brand: true,
          model: true,
          plateNumber: true,
          status: true,
          notes: true,
          sale: { select: { id: true } },
        },
      });
      if (!vehicle) {
        throw new Error("Unit kendaraan tidak ditemukan.");
      }
      if (vehicle.status === "SOLD_SETTLED") {
        throw new Error("Unit kendaraan ini sudah terjual lunas sebelumnya.");
      }
      if (vehicle.sale) {
        throw new Error(
          "Unit ini sudah memiliki catatan penjualan aktif (DP/Tempo). Buka menu Penjualan untuk mencatat pelunasan atau mengubah transaksi."
        );
      }

      // 2. Buat atau cari Buyer (hindari duplikasi untuk showroom/pembeli langganan)
      const normalizedPhone = validated.buyerPhone?.replace(/\s+/g, "").trim() || null;
      const trimmedBuyerName = validated.buyerName.trim();
      let buyerId: string;

      let existingBuyer = normalizedPhone
        ? await tx.buyer.findFirst({ where: { phone: normalizedPhone } })
        : null;

      if (!existingBuyer) {
        existingBuyer = await tx.buyer.findFirst({
          where: { name: trimmedBuyerName },
        });
      }

      if (existingBuyer) {
        buyerId = existingBuyer.id;
        // Perbarui nomor WA / alamat jika sebelumnya kosong atau berubah
        const buyerPatch: Record<string, any> = {};
        if (normalizedPhone && normalizedPhone !== existingBuyer.phone) {
          buyerPatch.phone = normalizedPhone;
        }
        if (validated.buyerAddress && validated.buyerAddress !== existingBuyer.address) {
          buyerPatch.address = validated.buyerAddress;
        }
        if (Object.keys(buyerPatch).length > 0) {
          await tx.buyer.update({
            where: { id: existingBuyer.id },
            data: buyerPatch,
          });
        }
      } else {
        const newBuyer = await tx.buyer.create({
          data: {
            name: trimmedBuyerName,
            phone: normalizedPhone,
            isShowroom: validated.buyerIsShowroom,
            address: validated.buyerAddress || null,
            notes: validated.buyerNotes || null,
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
            recordedBy: actorLabel,
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
              createdBy: actorLabel,
            },
          });
        }

        isFullyPaid = validated.initialPaymentAmount >= validated.sellingPrice;
      }

      // 5. Update Status & Odometer Kendaraan
      let nextVehicleStatus: "SOLD_SETTLED" | "AT_SHOWROOM_PENDING" | "BOOKED";
      if (isFullyPaid) {
        nextVehicleStatus = "SOLD_SETTLED";
      } else if (validated.saleType === "SHOWROOM") {
        nextVehicleStatus = "AT_SHOWROOM_PENDING";
      } else {
        nextVehicleStatus = "BOOKED";
      }

      const vehicleUpdateData: any = { status: nextVehicleStatus };
      if (validated.handoverOdometer && validated.handoverOdometer > 0) {
        vehicleUpdateData.odometer = validated.handoverOdometer;
      }
      if (validated.handoverNotes && validated.handoverNotes.trim()) {
        const handoverLine = `[Serah Terima] ${validated.handoverNotes.trim()}`;
        vehicleUpdateData.notes = vehicle.notes
          ? `${vehicle.notes}\n\n${handoverLine}`
          : handoverLine;
      }

      await tx.vehicle.update({
        where: { id: validated.vehicleId },
        data: vehicleUpdateData,
      });

      // 6. Simpan Dokumen Legalitas & Foto Serah Terima (hindari duplikat jika /api/upload sudah membuat record)
      if (validated.handoverPhotoUrl) {
        const existsPhoto = await tx.vehiclePhoto.findFirst({
          where: { vehicleId: validated.vehicleId, fileUrl: validated.handoverPhotoUrl },
          select: { id: true },
        });
        if (!existsPhoto) {
          await tx.vehiclePhoto.create({
            data: {
              vehicleId: validated.vehicleId,
              category: "DOCUMENT_PROOF",
              tag: "HANDOVER_DELIVERY",
              title: "Foto Serah Terima Unit & Kunci ke Konsumen",
              fileUrl: validated.handoverPhotoUrl,
            },
          });
        }
      }

      const docsToArchive: Array<{ url?: string | null; type: "OTHER" | "KUITANSI" | "KTP_PEMILIK"; label: string }> = [
        { url: validated.bastDocUrl, type: "OTHER", label: `${actorLabel} (BAST)` },
        { url: validated.paymentReceiptUrl, type: "KUITANSI", label: `${actorLabel} (Bukti Bayar)` },
        { url: validated.buyerIdCardUrl, type: "KTP_PEMILIK", label: `${actorLabel} (KTP Pembeli)` },
      ];

      for (const docItem of docsToArchive) {
        if (!docItem.url) continue;
        const existsDoc = await tx.vehicleDocument.findFirst({
          where: { vehicleId: validated.vehicleId, fileUrl: docItem.url },
          select: { id: true },
        });
        if (!existsDoc) {
          await tx.vehicleDocument.create({
            data: {
              vehicleId: validated.vehicleId,
              type: docItem.type,
              fileUrl: docItem.url,
              uploadedBy: docItem.label,
            },
          });
        }
      }

      // 7. Catat Beban Komisi Makelar / Perantara (Jika Ada)
      if (validated.brokerFee && validated.brokerFee > 0) {
        const brokerExpense = await tx.expense.create({
          data: {
            vehicleId: validated.vehicleId,
            category: "BROKER_COMMISSION",
            vendorName: validated.brokerName || "Makelar / Broker Unit",
            amount: validated.brokerFee,
            date: validated.saleDate,
            notes: `Komisi penjualan unit oleh broker/perantara: ${validated.brokerName || "-"}`,
            createdBy: actorLabel,
          },
        });

        const lastCashTx = await tx.cashTransaction.findFirst({
          orderBy: { createdAt: "desc" },
          select: { runningBalance: true },
        });
        const currentBal = lastCashTx ? Number(lastCashTx.runningBalance) : 0;
        await tx.cashTransaction.create({
          data: {
            type: "OUT_EXPENSE",
            amount: validated.brokerFee,
            relatedVehicleId: vehicle.id,
            relatedSaleId: sale.id,
            relatedExpenseId: brokerExpense.id,
            runningBalance: currentBal - validated.brokerFee,
            notes: `Biaya Komisi Makelar: ${validated.brokerName || "Mediator"} (${vehicle.brand} ${vehicle.model} - ${vehicle.plateNumber})`,
            createdBy: actorLabel,
          },
        });
      }

      // 8. AuditLog
      await tx.auditLog.create({
        data: {
          actorUserId: session.userId,
          action: "CREATE",
          entityType: "Sale",
          entityId: sale.id,
          afterData: {
            saleId: sale.id,
            sellingPrice: validated.sellingPrice,
            initialPayment: validated.initialPaymentAmount,
            vehicleStatus: nextVehicleStatus,
            handoverOdometer: validated.handoverOdometer || null,
            handoverChecklist: validated.handoverChecklist || [],
            brokerFee: validated.brokerFee || null,
          } as any,
        },
      });

      return sale;
    });

    revalidatePath("/admin");
    revalidatePath("/admin/sales");
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/finance");
    revalidatePath("/katalog");
    return {
      success: true,
      data: {
        ...result,
        sellingPrice: Number(result.sellingPrice),
      },
    };
  } catch (error: any) {
    console.error("Error creating sale:", error);
    return { success: false, error: sanitizeActionError(error, "Gagal mencatat penjualan unit") };
  }
}

export async function addSalePaymentAction(input: CreateSalePaymentInput) {
  try {
    const session = await requireRole(["OWNER", "ADMIN", "STAFF_ADMIN"]);
    const actorLabel = session.fullName || "Owner/Admin";
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
          proofUrl: validated.proofUrl || null,
          recordedBy: actorLabel,
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
            createdBy: actorLabel,
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
          actorUserId: session.userId,
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

    revalidatePath("/admin");
    revalidatePath("/admin/sales");
    revalidatePath(`/admin/sales/${validated.saleId}`);
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/finance");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error adding sale payment:", error);
    return { success: false, error: sanitizeActionError(error, "Gagal mencatat pembayaran") };
  }
}

export async function getSalesAction(filters?: {
  status?: "ALL" | "PENDING_RECEIVABLES" | "SETTLED";
  search?: string;
}) {
  try {
    await requireRole(["OWNER", "ADMIN", "STAFF_ADMIN"]);
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
      const compactQ = stripPlateSpaces(filters.search);
      filtered = filtered.filter(
        (s) =>
          s.vehicle.plateNumber.toLowerCase().includes(q) ||
          (compactQ && stripPlateSpaces(s.vehicle.plateNumber).includes(compactQ)) ||
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
    await requireRole(["OWNER", "ADMIN", "STAFF_ADMIN"]);
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

/**
 * Ambil daftar pembeli & showroom rekanan yang tersimpan di database untuk pilihan cepat.
 */
export async function getBuyersAction() {
  try {
    await requireRole(["OWNER", "ADMIN", "STAFF_ADMIN"]);
    const buyers = await prisma.buyer.findMany({
      include: {
        _count: { select: { sales: true } },
      },
      orderBy: [{ isShowroom: "desc" }, { createdAt: "desc" }],
    });

    const sorted = buyers
      .map((b) => ({
        id: b.id,
        name: b.name,
        phone: b.phone || "",
        isShowroom: b.isShowroom,
        address: b.address || "",
        salesCount: b._count.sales,
      }))
      .sort((a, b) => b.salesCount - a.salesCount || Number(b.isShowroom) - Number(a.isShowroom));

    return { success: true, data: sorted };
  } catch (error: any) {
    console.error("Error fetching buyers:", error);
    return { success: false, error: sanitizeActionError(error, "Gagal memuat daftar pembeli"), data: [] };
  }
}

/**
 * Perbarui informasi transaksi penjualan (harga deal, tanggal, jatuh tempo, data pembeli).
 */
export async function updateSaleAction(input: UpdateSaleInput) {
  try {
    const session = await requireRole(["OWNER", "ADMIN", "STAFF_ADMIN"]);
    const validated = updateSaleSchema.parse(input);

    const updated = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: validated.saleId },
        include: {
          payments: true,
          distributions: true,
          buyer: true,
          vehicle: true,
        },
      });

      if (!sale) {
        throw new Error("Transaksi penjualan tidak ditemukan.");
      }

      const hasActiveDistribution = sale.distributions.some(
        (d) => !d.notes?.includes("[REVERSED]")
      );
      if (hasActiveDistribution) {
        throw new Error(
          "Transaksi ini sudah selesai bagi hasil ke investor sehingga tidak bisa diedit. Lakukan pembatalan bagi hasil terlebih dahulu jika perlu koreksi."
        );
      }

      await tx.buyer.update({
        where: { id: sale.buyerId },
        data: {
          name: validated.buyerName,
          phone: validated.buyerPhone || null,
          address: validated.buyerAddress || null,
          isShowroom: validated.buyerIsShowroom,
        },
      });

      const nextSale = await tx.sale.update({
        where: { id: sale.id },
        data: {
          saleDate: validated.saleDate,
          saleType: validated.saleType,
          sellingPrice: validated.sellingPrice,
          dueDate: validated.dueDate ?? null,
        },
      });

      const settlement = calculateSaleSettlement(validated.sellingPrice, sale.payments);
      const nextStatus = settlement.isFullyPaid
        ? "SOLD_SETTLED"
        : validated.saleType === "SHOWROOM"
        ? "AT_SHOWROOM_PENDING"
        : "BOOKED";

      await tx.vehicle.update({
        where: { id: sale.vehicleId },
        data: { status: nextStatus },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: session.userId,
          action: "UPDATE",
          entityType: "Sale",
          entityId: sale.id,
          beforeData: {
            sellingPrice: Number(sale.sellingPrice),
            saleDate: sale.saleDate,
            saleType: sale.saleType,
            dueDate: sale.dueDate,
            buyerName: sale.buyer.name,
          } as any,
          afterData: {
            sellingPrice: validated.sellingPrice,
            saleDate: validated.saleDate,
            saleType: validated.saleType,
            dueDate: validated.dueDate ?? null,
            buyerName: validated.buyerName,
          } as any,
        },
      });

      return nextSale;
    });

    revalidatePath("/admin");
    revalidatePath("/admin/sales");
    revalidatePath(`/admin/sales/${validated.saleId}`);
    revalidatePath("/admin/inventory");
    revalidatePath("/katalog");

    return {
      success: true,
      data: {
        ...updated,
        sellingPrice: Number(updated.sellingPrice),
      },
    };
  } catch (error: any) {
    console.error("Error updating sale:", error);
    return { success: false, error: sanitizeActionError(error, "Gagal memperbarui transaksi penjualan") };
  }
}

/**
 * Batalkan transaksi penjualan secara rapi & aman terhadap Buku Kas (append-only).
 * mode:
 * - VOID_MISTAKE : Salah input (balikkan seluruh kas masuk & kembalikan unit ke Siap Jual)
 * - REFUND_CASH  : Pembeli batal & uang DP/bayar dikembalikan (catat kas keluar pengembalian)
 * - FORFEIT_DP   : Pembeli batal & uang DP hangus (kas tetap utuh sebagai pendapatan showroom)
 */
export async function cancelSaleAction(
  saleId: string,
  options: {
    mode: "VOID_MISTAKE" | "REFUND_CASH" | "FORFEIT_DP";
    reason?: string;
  }
) {
  try {
    const session = await requireRole(["OWNER", "ADMIN", "STAFF_ADMIN"]);
    const actorLabel = session.fullName || "Owner/Admin";

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: {
          vehicle: true,
          payments: true,
          distributions: true,
          cashTransactions: true,
        },
      });

      if (!sale) {
        throw new Error("Transaksi penjualan tidak ditemukan.");
      }

      const hasActiveDistribution = sale.distributions.some(
        (d) => !d.notes?.includes("[REVERSED]")
      );
      if (hasActiveDistribution) {
        throw new Error(
          "Transaksi ini sudah selesai bagi hasil ke investor. Lakukan reversal bagi hasil dulu di menu Investor sebelum membatalkan penjualan."
        );
      }

      // Hitung total uang riil masuk dari penjualan ini (non trade-in)
      const totalCashIn = sale.cashTransactions
        .filter((c) => c.type === "IN_SALE_PAYMENT")
        .reduce((acc, c) => acc + Number(c.amount), 0);

      // Catat pembalikan kas secara append-only (tidak menghapus baris lama agar runningBalance tetap akurat)
      if (totalCashIn > 0 && options.mode !== "FORFEIT_DP") {
        const lastCashTx = await tx.cashTransaction.findFirst({
          orderBy: { createdAt: "desc" },
          select: { runningBalance: true, createdAt: true },
        });
        const currentBal = lastCashTx ? Number(lastCashTx.runningBalance) : 0;
        const nextTs = Math.max(
          Date.now(),
          lastCashTx ? new Date(lastCashTx.createdAt).getTime() + 1 : 0
        );
        const noteLabel =
          options.mode === "REFUND_CASH"
            ? `Pengembalian DP/Bayar (Batal Jual): ${sale.vehicle.brand} ${sale.vehicle.model} (${sale.vehicle.plateNumber})${options.reason ? ` - ${options.reason}` : ""}`
            : `Koreksi Batal Input Penjualan: ${sale.vehicle.brand} ${sale.vehicle.model} (${sale.vehicle.plateNumber})${options.reason ? ` - ${options.reason}` : ""}`;

        await tx.cashTransaction.create({
          data: {
            type: "OUT_OTHER",
            amount: totalCashIn,
            relatedVehicleId: sale.vehicleId,
            runningBalance: currentBal - totalCashIn,
            notes: noteLabel,
            createdAt: new Date(nextTs),
            createdBy: actorLabel,
          },
        });
      }

      // Lepaskan relasi FK ke Sale sebelum menghapus record Sale agar unit bisa dijual lagi
      await tx.notificationLog.updateMany({
        where: { relatedSaleId: sale.id },
        data: { relatedSaleId: null },
      });
      await tx.cashTransaction.updateMany({
        where: { relatedSaleId: sale.id },
        data: { relatedSaleId: null },
      });

      await tx.sale.delete({ where: { id: sale.id } });

      const updatedVehicle = await tx.vehicle.update({
        where: { id: sale.vehicleId },
        data: { status: "READY_FOR_SALE" },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: session.userId,
          action: "CANCEL_SALE",
          entityType: "Sale",
          entityId: sale.id,
          beforeData: {
            plateNumber: sale.vehicle.plateNumber,
            sellingPrice: Number(sale.sellingPrice),
            totalCashIn,
          } as any,
          afterData: {
            mode: options.mode,
            reason: options.reason || null,
            nextVehicleStatus: "READY_FOR_SALE",
          } as any,
        },
      });

      return updatedVehicle;
    });

    revalidatePath("/admin");
    revalidatePath("/admin/sales");
    revalidatePath("/admin/inventory");
    revalidatePath(`/admin/inventory/${result.id}`);
    revalidatePath("/admin/finance");
    revalidatePath("/katalog");

    return {
      success: true,
      message: `Penjualan unit ${result.plateNumber} dibatalkan dan unit kembali ke status Siap Jual.`,
    };
  } catch (error: any) {
    console.error("Error cancelling sale:", error);
    return { success: false, error: sanitizeActionError(error, "Gagal membatalkan penjualan") };
  }
}

/**
 * Me-reset status penjualan kendaraan kembali ke READY_FOR_SALE dengan koreksi kas append-only.
 */
export async function resetVehicleSaleAction(vehicleId: string) {
  try {
    const session = await requireRole(["OWNER", "ADMIN"]);
    const actorLabel = session.fullName || "Owner/Admin";

    const result = await prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findUnique({
        where: { id: vehicleId },
        include: {
          sale: {
            include: {
              payments: true,
              distributions: true,
              cashTransactions: true,
            },
          },
        },
      });

      if (!vehicle) {
        throw new Error("Unit kendaraan tidak ditemukan.");
      }

      if (vehicle.sale) {
        const saleId = vehicle.sale.id;
        const hasActiveDistribution = vehicle.sale.distributions.some(
          (d) => !d.notes?.includes("[REVERSED]")
        );
        if (hasActiveDistribution) {
          throw new Error(
            "Unit ini sudah selesai bagi hasil investor. Batalkan bagi hasil dulu di menu Investor sebelum reset penjualan."
          );
        }

        // Hitung selisih bersih kas dari sale ini (IN - OUT) dan buat jurnal pembalik append-only
        let netIn = 0;
        for (const c of vehicle.sale.cashTransactions) {
          const amt = Number(c.amount);
          if (c.type.startsWith("IN_")) netIn += amt;
          else if (c.type.startsWith("OUT_")) netIn -= amt;
        }

        if (netIn !== 0) {
          const lastCashTx = await tx.cashTransaction.findFirst({
            orderBy: { createdAt: "desc" },
            select: { runningBalance: true, createdAt: true },
          });
          const curBal = lastCashTx ? Number(lastCashTx.runningBalance) : 0;
          const nextTs = Math.max(
            Date.now(),
            lastCashTx ? new Date(lastCashTx.createdAt).getTime() + 1 : 0
          );

          await tx.cashTransaction.create({
            data: {
              type: netIn > 0 ? "OUT_OTHER" : "IN_OTHER",
              amount: Math.abs(netIn),
              relatedVehicleId: vehicle.id,
              runningBalance: curBal - netIn,
              notes: `Koreksi Reset Penjualan: ${vehicle.brand} ${vehicle.model} (${vehicle.plateNumber})`,
              createdAt: new Date(nextTs),
              createdBy: actorLabel,
            },
          });
        }

        await tx.notificationLog.updateMany({
          where: { relatedSaleId: saleId },
          data: { relatedSaleId: null },
        });
        await tx.cashTransaction.updateMany({
          where: { relatedSaleId: saleId },
          data: { relatedSaleId: null },
        });

        await tx.sale.delete({
          where: { id: saleId },
        });
      }

      const updatedVehicle = await tx.vehicle.update({
        where: { id: vehicleId },
        data: {
          status: "READY_FOR_SALE",
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: session.userId,
          action: "RESET_SALE",
          entityType: "Vehicle",
          entityId: vehicle.id,
          beforeData: JSON.parse(
            JSON.stringify({
              plateNumber: vehicle.plateNumber,
              status: vehicle.status,
              sale: vehicle.sale
                ? {
                    id: vehicle.sale.id,
                    sellingPrice: Number(vehicle.sale.sellingPrice),
                  }
                : null,
            })
          ),
          afterData: JSON.parse(
            JSON.stringify({
              plateNumber: vehicle.plateNumber,
              status: "READY_FOR_SALE",
              sale: null,
            })
          ),
        },
      });

      return updatedVehicle;
    });

    revalidatePath("/admin");
    revalidatePath("/admin/inventory");
    revalidatePath(`/admin/inventory/${vehicleId}`);
    revalidatePath("/admin/sales");
    revalidatePath("/admin/finance");
    revalidatePath("/admin/investors");
    revalidatePath("/katalog");
    revalidatePath("/", "layout");

    return {
      success: true,
      message: `Status unit ${result.plateNumber} dikembalikan ke Siap Jual dan kas telah disesuaikan.`,
    };
  } catch (error: any) {
    console.error("Error resetting vehicle sale:", error);
    return { success: false, error: sanitizeActionError(error, "Gagal me-reset transaksi penjualan") };
  }
}

