"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createInspectionSchema, type CreateInspectionInput } from "@/lib/validations/inspection";

export async function createInspectionAction(input: CreateInspectionInput) {
  try {
    const validated = createInspectionSchema.parse(input);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Cek kendaraan
      const vehicle = await tx.vehicle.findUnique({
        where: { id: validated.vehicleId },
        select: { id: true, brand: true, model: true, plateNumber: true },
      });
      if (!vehicle) {
        throw new Error("Kendaraan tidak ditemukan.");
      }

      // 2. Ambil versi inspeksi terakhir
      const latest = await tx.inspection.findFirst({
        where: { vehicleId: validated.vehicleId },
        orderBy: { version: "desc" },
        select: { version: true },
      });
      const nextVersion = (latest?.version ?? 0) + 1;

      // 3. Set semua inspeksi sebelumnya isCurrent = false
      await tx.inspection.updateMany({
        where: { vehicleId: validated.vehicleId, isCurrent: true },
        data: { isCurrent: false },
      });

      // 4. Buat record Inspection baru
      const inspection = await tx.inspection.create({
        data: {
          vehicleId: validated.vehicleId,
          version: nextVersion,
          isCurrent: true,
          stage: validated.stage,
          engineGrade: validated.engineGrade,
          interiorGrade: validated.interiorGrade,
          exteriorGrade: validated.exteriorGrade,
          frameGrade: validated.frameGrade,
          accidentHistory: validated.accidentHistory,
          floodHistory: validated.floodHistory,
          engineNotes: validated.engineNotes,
          interiorNotes: validated.interiorNotes,
          exteriorNotes: validated.exteriorNotes,
          inspectedBy: validated.inspectedBy,
          inspectedAt: new Date(),
          panels: {
            create: validated.panels.map((p) => {
              const points = [p.pointRight, p.pointCenter, p.pointLeft, p.pointExtra].filter(
                (v): v is number => typeof v === "number" && !isNaN(v)
              );
              const computedThickness =
                points.length > 0
                  ? Math.round(points.reduce((a, b) => a + b, 0) / points.length)
                  : p.paintThickness;

              return {
                panelType: p.panelType,
                paintThickness: computedThickness,
                pointRight: p.pointRight,
                pointCenter: p.pointCenter,
                pointLeft: p.pointLeft,
                pointExtra: p.pointExtra,
                condition: p.condition,
                notes: p.notes,
              };
            }),
          },
        },
        include: {
          panels: true,
        },
      });

      // 5. AuditLog
      await tx.auditLog.create({
        data: {
          actorUserId: "admin-owner-001",
          action: "CREATE",
          entityType: "Inspection",
          entityId: inspection.id,
          afterData: {
            version: inspection.version,
            stage: inspection.stage,
            frameGrade: inspection.frameGrade,
            accidentHistory: inspection.accidentHistory,
          } as any,
        },
      });

      return inspection;
    });

    revalidatePath(`/admin/inspections/${validated.vehicleId}`);
    revalidatePath("/admin/inventory");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error creating inspection:", error);
    return { success: false, error: error.message || "Gagal menyimpan hasil inspeksi" };
  }
}

export async function getVehicleInspectionsAction(vehicleId: string) {
  try {
    const inspections = await prisma.inspection.findMany({
      where: { vehicleId },
      orderBy: { version: "desc" },
      include: {
        panels: true,
        photos: true,
      },
    });

    return { success: true, data: inspections };
  } catch (error: any) {
    console.error("Error fetching inspections:", error);
    return { success: false, error: error.message || "Gagal memuat riwayat inspeksi" };
  }
}

export async function getInspectionByIdAction(id: string) {
  try {
    const inspection = await prisma.inspection.findUnique({
      where: { id },
      include: {
        vehicle: true,
        panels: true,
        photos: true,
      },
    });

    if (!inspection) {
      return { success: false, error: "Inspeksi tidak ditemukan" };
    }

    return { success: true, data: inspection };
  } catch (error: any) {
    console.error("Error fetching inspection by ID:", error);
    return { success: false, error: error.message || "Gagal memuat inspeksi" };
  }
}
