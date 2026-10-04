"use server";

import { revalidatePath } from "next/cache";
import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";
import { createVehicleSchema, type CreateVehicleInput } from "@/lib/validations/vehicle";
import { canTransition, type VehicleStatus } from "@/lib/calculations/vehicle-state";
import { calculateHpp, calculateDaysInInventory, getInventoryAgingCategory } from "@/lib/calculations/hpp";

export async function getVehiclesAction(filters?: {
  status?: string;
  search?: string;
}) {
  try {
    const where: any = {};

    if (filters?.status && filters.status !== "ALL") {
      where.status = filters.status;
    }

    if (filters?.search) {
      const search = filters.search.trim();
      where.OR = [
        { plateNumber: { contains: search } },
        { brand: { contains: search } },
        { model: { contains: search } },
      ];
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: { purchaseDate: "desc" },
      include: {
        expenses: {
          select: {
            id: true,
            category: true,
            amount: true,
            date: true,
            vendorName: true,
          },
        },
        photos: {
          take: 1,
          select: {
            id: true,
            fileUrl: true,
            category: true,
          },
        },
        sale: {
          select: {
            id: true,
            sellingPrice: true,
            saleDate: true,
            payments: {
              select: {
                amount: true,
              },
            },
          },
        },
      },
    });

    const now = new Date();

    const formatted = vehicles.map((v) => {
      const expensesList = v.expenses.map((e) => ({
        amount: Number(e.amount),
      }));
      const totalHpp = calculateHpp(Number(v.purchasePrice), expensesList);
      const days = calculateDaysInInventory(v.purchaseDate, now);
      const aging = getInventoryAgingCategory(days);

      const totalPaid = v.sale
        ? v.sale.payments.reduce((acc, p) => acc + Number(p.amount), 0)
        : 0;
      const isFullyPaid = v.sale ? totalPaid >= Number(v.sale.sellingPrice) : false;

      return {
        ...v,
        purchasePrice: Number(v.purchasePrice),
        targetSellingPrice: v.targetSellingPrice ? Number(v.targetSellingPrice) : null,
        minSellingPrice: v.minSellingPrice ? Number(v.minSellingPrice) : null,
        totalExpenses: expensesList.reduce((acc, e) => acc + e.amount, 0),
        totalHpp: totalHpp.toNumber(),
        daysInInventory: days,
        agingCategory: aging,
        isFullyPaid,
        expenses: v.expenses.map((e) => ({
          id: e.id,
          category: e.category,
          amount: Number(e.amount),
          date: e.date,
          vendorName: e.vendorName,
        })),
        sale: v.sale
          ? {
              id: v.sale.id,
              sellingPrice: Number(v.sale.sellingPrice),
              saleDate: v.sale.saleDate,
              payments: v.sale.payments.map((p) => ({
                amount: Number(p.amount),
              })),
            }
          : null,
      };
    });

    return { success: true, data: formatted };
  } catch (error: any) {
    console.error("Error fetching vehicles:", error);
    return { success: false, error: error.message || "Gagal memuat data unit" };
  }
}

export async function createVehicleAction(input: CreateVehicleInput) {
  try {
    const validated = createVehicleSchema.parse(input);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Cek plat nomor duplikat
      const existing = await tx.vehicle.findUnique({
        where: { plateNumber: validated.plateNumber },
      });
      if (existing) {
        throw new Error(`Unit dengan plat nomor ${validated.plateNumber} sudah terdaftar.`);
      }

      // Format ringkasan ceklist fisik turun towing bila ada
      let finalNotes = validated.notes || "";
      if (validated.physicalChecklist) {
        const c = validated.physicalChecklist;
        const tireDesc = c.spareTire === "ADA_BAGUS" ? "Ban Serep: Ada (Bagus)" : c.spareTire === "ADA_AUS" ? "Ban Serep: Ada (Aus/Gundul)" : "Ban Serep: TIDAK ADA";
        const jackDesc = c.jack ? "Dongkrak: Ada" : "Dongkrak: TIDAK ADA";
        const wrenchDesc = c.wheelWrench ? "Kunci Roda: Ada" : "Kunci Roda: TIDAK ADA";
        const keysDesc = c.keysCount === "2_KEYS" ? "Kunci Kontak: Lengkap 2 (Ada Serep)" : "Kunci Kontak: HANYA 1 KUNCI";
        const bookDesc = c.serviceBook ? "Buku Manual/Servis: Ada" : "Buku Manual/Servis: Tidak Ada";
        const matDesc = c.cabinMats ? "Karpet Set: Ada" : "Karpet Set: Tidak Lengkap";
        const audioDesc = c.audioUnit === "ORIGINAL" ? "Head Unit: Original" : c.audioUnit === "MODIFIED" ? "Head Unit: Upgrade Android/Layar" : "Head Unit: Rusak/Hilang";

        const checklistSummary = `[CEKLIST FISIK TURUN TOWING]\n• ${tireDesc}\n• ${jackDesc}\n• ${wrenchDesc}\n• ${keysDesc}\n• ${bookDesc}\n• ${matDesc}\n• ${audioDesc}`;
        finalNotes = finalNotes ? `${finalNotes}\n\n${checklistSummary}` : checklistSummary;
      }

      // 2. Buat Vehicle
      const vehicle = await tx.vehicle.create({
        data: {
          plateNumber: validated.plateNumber,
          brand: validated.brand,
          model: validated.model,
          year: validated.year,
          color: validated.color,
          odometer: validated.odometer,
          transmission: validated.transmission,
          engineCapacity: validated.engineCapacity,
          sourceType: validated.sourceType,
          auctionHouse: validated.auctionHouse,
          auctionLotType: validated.auctionLotType,
          purchasePrice: validated.purchasePrice,
          purchaseDate: validated.purchaseDate,
          targetSellingPrice: validated.targetSellingPrice,
          minSellingPrice: validated.minSellingPrice,
          currentLocation: validated.currentLocation,
          taxExpiryDate: validated.taxExpiryDate,
          platExpiryDate: validated.platExpiryDate,
          taxNominal: validated.taxNominal,
          stnkStatus: validated.stnkStatus,
          bpkbStatus: validated.bpkbStatus,
          bpkbLeadDays: validated.bpkbLeadDays,
          stnkLeadDays: validated.stnkLeadDays,
          estimatedReadyDate: validated.estimatedReadyDate,
          youtubeVideoId: validated.youtubeVideoId,
          notes: finalNotes,
        },
      });

      // 2b. Buat initial record Inspection Intake jika checklist diisi
      if (validated.physicalChecklist) {
        await tx.inspection.create({
          data: {
            vehicleId: vehicle.id,
            version: 1,
            isCurrent: true,
            stage: "INTAKE",
            engineGrade: "B",
            interiorGrade: "B",
            exteriorGrade: "B",
            frameGrade: "A",
            accidentHistory: false,
            floodHistory: false,
            checklistData: validated.physicalChecklist as any,
            interiorNotes: finalNotes,
            inspectedBy: "Checker Turun Towing",
          },
        });
      }

      // 3. Ambil running balance terakhir kas
      const lastCashTx = await tx.cashTransaction.findFirst({
        orderBy: { createdAt: "desc" },
        select: { runningBalance: true },
      });
      const currentBalance = lastCashTx ? Number(lastCashTx.runningBalance) : 0;
      const newBalance = currentBalance - validated.purchasePrice;

      // 4. Catat transaksi keluar pembelian unit di CashTransaction (relasi formal)
      await tx.cashTransaction.create({
        data: {
          type: "OUT_VEHICLE_PURCHASE",
          amount: validated.purchasePrice,
          relatedVehicleId: vehicle.id,
          runningBalance: newBalance,
          notes: `Pembelian unit ${vehicle.brand} ${vehicle.model} (${vehicle.plateNumber})`,
          createdBy: "Owner/Admin",
        },
      });

      // 5. Tulis AuditLog
      await tx.auditLog.create({
        data: {
          actorUserId: "admin-owner-001",
          action: "CREATE",
          entityType: "Vehicle",
          entityId: vehicle.id,
          afterData: vehicle as any,
        },
      });

      return vehicle;
    });

    revalidatePath("/admin/inventory");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error creating vehicle:", error);
    return { success: false, error: error.message || "Gagal menambahkan unit baru" };
  }
}

export async function updateVehicleStatusAction(vehicleId: string, toStatus: VehicleStatus) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findUnique({
        where: { id: vehicleId },
      });
      if (!vehicle) {
        throw new Error("Unit tidak ditemukan");
      }

      // Validasi State Machine
      const currentStatus = vehicle.status as VehicleStatus;
      if (!canTransition(currentStatus, toStatus)) {
        throw new Error(
          `Perubahan status dari ${currentStatus} ke ${toStatus} tidak diizinkan oleh sistem.`
        );
      }

      const updated = await tx.vehicle.update({
        where: { id: vehicleId },
        data: { status: toStatus },
      });

      // AuditLog
      await tx.auditLog.create({
        data: {
          actorUserId: "admin-owner-001",
          action: "UPDATE_STATUS",
          entityType: "Vehicle",
          entityId: vehicle.id,
          beforeData: { status: currentStatus },
          afterData: { status: toStatus },
        },
      });

      return updated;
    });

    revalidatePath("/admin/inventory");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error updating vehicle status:", error);
    return { success: false, error: error.message || "Gagal mengubah status unit" };
  }
}

export async function getVehicleByIdAction(id: string) {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        expenses: {
          orderBy: { date: "desc" },
        },
        photos: {
          orderBy: { uploadedAt: "desc" },
        },
        documents: {
          orderBy: { uploadedAt: "desc" },
        },
        inspections: {
          orderBy: { version: "asc" },
        },
        sale: {
          include: {
            buyer: true,
            payments: {
              orderBy: { paidAt: "desc" },
            },
          },
        },
      },
    });

    if (!vehicle) {
      return { success: false, error: "Unit kendaraan tidak ditemukan" };
    }

    const expensesList = vehicle.expenses.map((e: any) => ({
      amount: Number(e.amount),
    }));
    const totalHpp = calculateHpp(Number(vehicle.purchasePrice), expensesList);
    const now = new Date();
    const days = calculateDaysInInventory(vehicle.purchaseDate, now);
    const aging = getInventoryAgingCategory(days);

    return {
      success: true,
      data: {
        ...vehicle,
        purchasePrice: Number(vehicle.purchasePrice),
        targetSellingPrice: vehicle.targetSellingPrice ? Number(vehicle.targetSellingPrice) : null,
        minSellingPrice: vehicle.minSellingPrice ? Number(vehicle.minSellingPrice) : null,
        taxNominal: vehicle.taxNominal ? Number(vehicle.taxNominal) : null,
        totalExpenses: expensesList.reduce((acc: number, e: any) => acc + e.amount, 0),
        totalHpp: totalHpp.toNumber(),
        daysInInventory: days,
        agingCategory: aging,
        expenses: vehicle.expenses.map((e: any) => ({
          ...e,
          amount: Number(e.amount),
        })),
        photos: vehicle.photos,
        documents: vehicle.documents,
        inspections: vehicle.inspections,
      },
    };
  } catch (error: any) {
    console.error("Error fetching vehicle by ID:", error);
    return { success: false, error: error.message || "Gagal memuat detail unit" };
  }
}

export async function updateVehicleTaxAction(
  vehicleId: string,
  taxExpiryDate?: string | null,
  platExpiryDate?: string | null,
  taxNominal?: number | null
) {
  try {
    const updated = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        taxExpiryDate: taxExpiryDate ? new Date(taxExpiryDate) : null,
        platExpiryDate: platExpiryDate ? new Date(platExpiryDate) : null,
        taxNominal: taxNominal != null ? taxNominal : null,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/inventory");
    revalidatePath(`/admin/inventory/${vehicleId}`);
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error updating vehicle tax info:", error);
    return { success: false, error: error.message || "Gagal memperbarui status pajak unit" };
  }
}

export async function deleteVehiclePhotoAction(photoId: string, vehicleId: string) {
  try {
    await prisma.vehiclePhoto.delete({
      where: { id: photoId },
    });
    revalidatePath(`/admin/inventory/${vehicleId}`);
    revalidatePath(`/admin/inventory/${vehicleId}/media`);
    revalidatePath(`/katalog`);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting vehicle photo:", error);
    return { success: false, error: error.message || "Gagal menghapus foto" };
  }
}

export async function deleteVehicleDocumentAction(documentId: string, vehicleId: string) {
  try {
    await prisma.vehicleDocument.delete({
      where: { id: documentId },
    });
    revalidatePath(`/admin/inventory/${vehicleId}`);
    revalidatePath(`/admin/inventory/${vehicleId}/media`);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting vehicle document:", error);
    return { success: false, error: error.message || "Gagal menghapus dokumen" };
  }
}

export async function updateVehicleAction(
  vehicleId: string,
  data: {
    plateNumber?: string;
    brand?: string;
    model?: string;
    year?: number;
    color?: string;
    odometer?: number;
    transmission?: any;
    engineCapacity?: number;
    sourceType?: any;
    auctionHouse?: string | null;
    auctionLotType?: any;
    bpkbStatus?: any;
    bpkbLeadDays?: number;
    taxExpiryDate?: Date | string | null;
    platExpiryDate?: Date | string | null;
    taxNominal?: number | null;
    stnkStatus?: any;
    purchasePrice?: number;
    purchaseDate?: Date | string;
    targetSellingPrice?: number | null;
    minSellingPrice?: number | null;
    currentLocation?: string;
    youtubeVideoId?: string | null;
    notes?: string | null;
    physicalChecklist?: any;
  }
) {
  try {
    const updateData: any = {};
    if (data.plateNumber) {
      updateData.plateNumber = data.plateNumber.trim().toUpperCase().replace(/\s+/g, "");
    }
    if (data.brand !== undefined) updateData.brand = data.brand.trim();
    if (data.model !== undefined) updateData.model = data.model.trim();
    if (data.year !== undefined) updateData.year = Number(data.year);
    if (data.color !== undefined) updateData.color = data.color.trim();
    if (data.odometer !== undefined) updateData.odometer = Number(data.odometer);
    if (data.transmission) updateData.transmission = data.transmission;
    if (data.engineCapacity !== undefined) updateData.engineCapacity = Number(data.engineCapacity);
    if (data.sourceType) updateData.sourceType = data.sourceType;
    if (data.auctionHouse !== undefined) updateData.auctionHouse = data.auctionHouse;
    if (data.auctionLotType !== undefined) updateData.auctionLotType = data.auctionLotType;
    if (data.bpkbStatus) updateData.bpkbStatus = data.bpkbStatus;
    if (data.bpkbLeadDays !== undefined) updateData.bpkbLeadDays = Number(data.bpkbLeadDays);
    if (data.taxExpiryDate !== undefined) {
      updateData.taxExpiryDate = data.taxExpiryDate ? new Date(data.taxExpiryDate) : null;
    }
    if (data.platExpiryDate !== undefined) {
      updateData.platExpiryDate = data.platExpiryDate ? new Date(data.platExpiryDate) : null;
    }
    if (data.taxNominal !== undefined) {
      updateData.taxNominal = data.taxNominal ? new Decimal(data.taxNominal) : null;
    }
    if (data.stnkStatus) updateData.stnkStatus = data.stnkStatus;
    if (data.purchasePrice !== undefined) {
      updateData.purchasePrice = new Decimal(data.purchasePrice);
    }
    if (data.purchaseDate) {
      updateData.purchaseDate = new Date(data.purchaseDate);
    }
    if (data.targetSellingPrice !== undefined) {
      updateData.targetSellingPrice = data.targetSellingPrice ? new Decimal(data.targetSellingPrice) : null;
    }
    if (data.minSellingPrice !== undefined) {
      updateData.minSellingPrice = data.minSellingPrice ? new Decimal(data.minSellingPrice) : null;
    }
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.currentLocation !== undefined) updateData.currentLocation = data.currentLocation.trim();
    if (data.youtubeVideoId !== undefined) updateData.youtubeVideoId = data.youtubeVideoId;

    const updated = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: updateData,
    });

    // Update atau create initial inspection record jika ada checklist fisik
    if (data.physicalChecklist) {
      const existingInspection = await prisma.inspection.findFirst({
        where: { vehicleId },
        orderBy: { version: "asc" },
      });
      if (existingInspection) {
        await prisma.inspection.update({
          where: { id: existingInspection.id },
          data: {
            checklistData: data.physicalChecklist,
          },
        });
      } else {
        await prisma.inspection.create({
          data: {
            vehicleId,
            version: 1,
            isCurrent: true,
            stage: "INTAKE",
            engineGrade: "B",
            interiorGrade: "B",
            exteriorGrade: "B",
            frameGrade: "A",
            checklistData: data.physicalChecklist,
            inspectedBy: "Checker Turun Towing",
          },
        });
      }
    }

    revalidatePath("/admin/inventory");
    revalidatePath(`/admin/inventory/${vehicleId}`);
    revalidatePath(`/admin/inventory/${vehicleId}/edit`);
    revalidatePath("/katalog");
    revalidatePath("/", "layout");

    return {
      success: true,
      data: {
        ...updated,
        purchasePrice: Number(updated.purchasePrice),
        targetSellingPrice: updated.targetSellingPrice ? Number(updated.targetSellingPrice) : null,
        minSellingPrice: updated.minSellingPrice ? Number(updated.minSellingPrice) : null,
        taxNominal: updated.taxNominal ? Number(updated.taxNominal) : null,
      },
    };
  } catch (error: any) {
    console.error("Error updating vehicle details:", error);
    if (error.code === "P2002") {
      return { success: false, error: "Nomor plat sudah terdaftar pada kendaraan lain." };
    }
    return { success: false, error: error.message || "Gagal memperbarui data unit kendaraan" };
  }
}


