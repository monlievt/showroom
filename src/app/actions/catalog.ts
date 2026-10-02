"use server";

import prisma from "@/lib/prisma";
import { generateVehicleSlug, extractPlateCandidates } from "@/lib/utils/slug";

export interface PublicCatalogFilter {
  brand?: string;
  transmission?: string;
  minPrice?: number;
  maxPrice?: number;
  query?: string;
  status?: "ALL" | "READY_FOR_SALE" | "BOOKED" | "SOLD_SETTLED";
}

/**
 * Server Action: Mengambil katalog publik (PRD.md §3 & ARCHITECTURE.md §3)
 * KEAMANAN TINGKAT TINGGI:
 * - Menampilkan unit READY_FOR_SALE, BOOKED, serta arsip unit TERJUAL (SOLD_SETTLED).
 * - Membuang SEMUA field finansial internal (purchasePrice, expenses, HPP, margin, data investor).
 */
export async function getPublicCatalog(filters?: PublicCatalogFilter) {
  try {
    const allowedStatuses = ["READY_FOR_SALE", "BOOKED", "SOLD_SETTLED"];
    const where: any = {};

    if (filters?.status && filters.status !== "ALL" && allowedStatuses.includes(filters.status)) {
      where.status = filters.status;
    } else {
      where.status = {
        in: allowedStatuses,
      };
    }

    if (filters?.brand) {
      where.brand = { contains: filters.brand };
    }

    if (filters?.transmission) {
      where.transmission = filters.transmission;
    }

    if (filters?.minPrice || filters?.maxPrice) {
      where.targetSellingPrice = {};
      if (filters.minPrice) where.targetSellingPrice.gte = filters.minPrice;
      if (filters.maxPrice) where.targetSellingPrice.lte = filters.maxPrice;
    }

    if (filters?.query) {
      where.OR = [
        { brand: { contains: filters.query } },
        { model: { contains: filters.query } },
        { plateNumber: { contains: filters.query } },
      ];
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      select: {
        id: true,
        plateNumber: true,
        brand: true,
        model: true,
        year: true,
        color: true,
        odometer: true,
        transmission: true,
        engineCapacity: true,
        targetSellingPrice: true,
        status: true,
        currentLocation: true,
        youtubeVideoId: true,
        photos: {
          select: {
            id: true,
            fileUrl: true,
            category: true,
            tag: true,
          },
        },
        inspections: {
          where: { isCurrent: true },
          select: {
            id: true,
            engineGrade: true,
            interiorGrade: true,
            exteriorGrade: true,
            frameGrade: true,
            accidentHistory: true,
            floodHistory: true,
          },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const tagOrder: Record<string, number> = {
      FRONT_3_4: 1,
      REAR_3_4: 2,
      SIDE_RIGHT: 3,
      SIDE_LEFT: 4,
      INTERIOR_DASHBOARD: 5,
      ENGINE_BAY: 6,
      DOOR_SEALER: 7,
      UNDER_DASHBOARD: 8,
      UNDERBODY_CHASSIS: 9,
      TRUNK_SPARE_TIRE: 10,
      DOCUMENT_STNK_BPKB: 11,
    };

    return {
      success: true,
      data: vehicles.map((v) => {
        const safeSlug = generateVehicleSlug(v);

        const sortedPhotos = v.photos.slice().sort((a, b) => {
          const orderA = a.tag ? (tagOrder[a.tag] ?? 90) : a.category === "FINAL_LISTING" ? 10 : 50;
          const orderB = b.tag ? (tagOrder[b.tag] ?? 90) : b.category === "FINAL_LISTING" ? 10 : 50;
          return orderA - orderB;
        });

        return {
          id: v.id,
          slug: safeSlug,
          plateNumber: v.plateNumber,
          brand: v.brand,
          model: v.model,
          year: v.year,
          color: v.color,
          odometer: v.odometer,
          transmission: v.transmission,
          engineCapacity: v.engineCapacity,
          price: v.targetSellingPrice ? Number(v.targetSellingPrice) : null,
          status: v.status,
          location: v.currentLocation,
          youtubeVideoId: v.youtubeVideoId,
          photos: sortedPhotos.map((p) => ({
            id: p.id,
            fileUrl: p.fileUrl,
            category: p.category,
            tag: p.tag,
          })),
          inspection: v.inspections[0] || null,
        };
      }),
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal memuat katalog mobil" };
  }
}

/**
 * Server Action: Mengambil data metrik homepage & unit yang baru laku
 */
export async function getShowroomHomepageData() {
  try {
    const catalogRes = await getPublicCatalog();
    const readyVehicles = catalogRes.success && catalogRes.data
      ? catalogRes.data.filter((v: any) => v.status === "READY_FOR_SALE" || v.status === "BOOKED").slice(0, 6)
      : [];

    const soldVehicles = await prisma.vehicle.findMany({
      where: { status: "SOLD_SETTLED" },
      select: {
        id: true,
        plateNumber: true,
        brand: true,
        model: true,
        year: true,
        color: true,
        odometer: true,
        transmission: true,
        targetSellingPrice: true,
        notes: true,
        photos: {
          select: { fileUrl: true, tag: true },
          take: 2,
        },
        sale: {
          select: {
            saleDate: true,
            sellingPrice: true,
            buyer: {
              select: { name: true, address: true },
            },
          },
        },
        inspections: {
          where: { isCurrent: true },
          select: { engineGrade: true, exteriorGrade: true, interiorGrade: true, frameGrade: true },
          take: 1,
        },
      },
      take: 4,
      orderBy: { updatedAt: "desc" },
    });

    const readyCount = await prisma.vehicle.count({ where: { status: "READY_FOR_SALE" } });
    const soldDbCount = await prisma.vehicle.count({ where: { status: "SOLD_SETTLED" } });
    const totalInspections = await prisma.inspection.count();

    return {
      success: true,
      readyVehicles,
      soldVehicles: soldVehicles.map((v) => {
        const safeSlug = generateVehicleSlug(v);

        return {
          id: v.id,
          slug: safeSlug,
          plateNumber: v.plateNumber,
          brand: v.brand,
          model: v.model,
          year: v.year,
          color: v.color,
          odometer: v.odometer,
          transmission: v.transmission,
          price: v.sale?.sellingPrice ? Number(v.sale.sellingPrice) : Number(v.targetSellingPrice || 0),
          soldDate: v.sale?.saleDate || new Date(),
          buyerName: v.sale?.buyer?.name || "Konsumen Jawa Timur",
          buyerLocation: v.sale?.buyer?.address || "Jawa Timur",
          photoUrl: v.photos[0]?.fileUrl || "/images/cars/jazz/front.jpg",
          notes: v.notes,
          inspection: v.inspections[0] || null,
        };
      }),
      stats: {
        totalSold: 124 + soldDbCount,
        readyStock: readyCount,
        pointsTestedPerCar: 34,
        avgDaysToSell: 18,
        samsatVerifiedPct: 100,
        inspectionsDone: 160 + totalInspections,
      },
    };
  } catch (error: any) {
    console.error("Error in getShowroomHomepageData:", error);
    return {
      success: false,
      readyVehicles: [],
      soldVehicles: [],
      stats: {
        totalSold: 124,
        readyStock: 4,
        pointsTestedPerCar: 34,
        avgDaysToSell: 18,
        samsatVerifiedPct: 100,
        inspectionsDone: 160,
      },
    };
  }
}

/**
 * Server Action: Mengambil detail lengkap satu unit untuk halaman publik /katalog/[slug]
 */
export async function getPublicVehicleDetail(identifier: string) {
  try {
    const raw = decodeURIComponent(identifier || "").trim();
    const plateCandidates = extractPlateCandidates(raw);

    // 1. Cari berdasarkan UUID langsung atau kandidat plat nomor yang diekstrak dari slug
    let vehicle = await prisma.vehicle.findFirst({
      where: {
        OR: [
          { id: raw },
          { plateNumber: { in: plateCandidates } },
        ],
        status: { in: ["READY_FOR_SALE", "BOOKED", "SOLD_SETTLED"] },
      },
      select: {
        id: true,
        plateNumber: true,
        brand: true,
        model: true,
        year: true,
        color: true,
        odometer: true,
        transmission: true,
        engineCapacity: true,
        targetSellingPrice: true,
        status: true,
        currentLocation: true,
        taxExpiryDate: true,
        stnkStatus: true,
        bpkbStatus: true,
        fuelType: true,
        driveType: true,
        chassisNumber: true,
        engineNumber: true,
        youtubeVideoId: true,
        notes: true,
        photos: {
          select: {
            id: true,
            fileUrl: true,
            category: true,
            tag: true,
            title: true,
          },
          orderBy: { uploadedAt: "asc" },
        },
        inspections: {
          where: { isCurrent: true },
          include: {
            panels: true,
          },
          take: 1,
        },
      },
    });

    // 2. Fallback cerdas: Cari jika plat nomor terselip di dalam slug teks (termasuk unit READY, BOOKED, maupun SOLD_SETTLED)
    if (!vehicle) {
      const allVehicles = await prisma.vehicle.findMany({
        where: { status: { in: ["READY_FOR_SALE", "BOOKED", "SOLD_SETTLED"] } },
        select: {
          id: true,
          plateNumber: true,
          brand: true,
          model: true,
          year: true,
        },
      });

      const cleanTarget = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
      const matched = allVehicles.find((v) => {
        const cleanPlate = v.plateNumber.toLowerCase().replace(/[^a-z0-9]/g, "");
        const generatedSlug1 = generateVehicleSlug(v).toLowerCase().replace(/[^a-z0-9]/g, "");
        const legacySlug = `${v.brand}-${v.model}-${v.year}-${v.plateNumber}`.toLowerCase().replace(/[^a-z0-9]/g, "");
        return cleanTarget.includes(cleanPlate) || cleanTarget === generatedSlug1 || cleanTarget === legacySlug;
      });

      if (matched) {
        return getPublicVehicleDetail(matched.id);
      }
    }

    if (!vehicle) {
      return { success: false, error: "Unit kendaraan tidak ditemukan di katalog" };
    }

    const currentInspection = vehicle.inspections[0] || null;

    return {
      success: true,
      data: {
        id: vehicle.id,
        slug: generateVehicleSlug(vehicle),
        plateNumber: vehicle.plateNumber,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        odometer: vehicle.odometer,
        transmission: vehicle.transmission,
        engineCapacity: vehicle.engineCapacity,
        fuelType: vehicle.fuelType,
        driveType: vehicle.driveType,
        chassisNumber: vehicle.chassisNumber,
        engineNumber: vehicle.engineNumber,
        taxExpiryDate: vehicle.taxExpiryDate,
        price: vehicle.targetSellingPrice ? Number(vehicle.targetSellingPrice) : null,
        status: vehicle.status,
        location: vehicle.currentLocation,
        stnkStatus: vehicle.stnkStatus,
        bpkbStatus: vehicle.bpkbStatus,
        notes: vehicle.notes,
        photos: vehicle.photos.slice().sort((a, b) => {
          const tagOrder: Record<string, number> = {
            FRONT_3_4: 1,
            REAR_3_4: 2,
            SIDE_RIGHT: 3,
            SIDE_LEFT: 4,
            INTERIOR_DASHBOARD: 5,
            ENGINE_BAY: 6,
            DOOR_SEALER: 7,
            UNDER_DASHBOARD: 8,
            UNDERBODY_CHASSIS: 9,
            TRUNK_SPARE_TIRE: 10,
            DOCUMENT_STNK_BPKB: 11,
          };
          const orderA = a.tag ? (tagOrder[a.tag] ?? 90) : a.category === "FINAL_LISTING" ? 10 : 50;
          const orderB = b.tag ? (tagOrder[b.tag] ?? 90) : b.category === "FINAL_LISTING" ? 10 : 50;
          return orderA - orderB;
        }),
        inspection: currentInspection
          ? {
              id: currentInspection.id,
              engineGrade: currentInspection.engineGrade,
              interiorGrade: currentInspection.interiorGrade,
              exteriorGrade: currentInspection.exteriorGrade,
              frameGrade: currentInspection.frameGrade,
              accidentHistory: currentInspection.accidentHistory,
              floodHistory: currentInspection.floodHistory,
              engineNotes: currentInspection.engineNotes,
              interiorNotes: currentInspection.interiorNotes,
              exteriorNotes: currentInspection.exteriorNotes,
              inspectedAt: currentInspection.inspectedAt,
              panels: currentInspection.panels.map((p) => ({
                id: p.id,
                panelType: p.panelType,
                paintThickness: p.paintThickness,
                pointRight: p.pointRight,
                pointCenter: p.pointCenter,
                pointLeft: p.pointLeft,
                pointExtra: p.pointExtra,
                condition: p.condition,
                defectCode: p.defectCode,
                notes: p.notes,
              })),
            }
          : null,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal memuat detail unit" };
  }
}
