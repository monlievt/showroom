import { PrismaClient } from "@prisma/client";
import {
  normalizePlateNumber,
  cleanVehicleModel,
  formatReadableText,
} from "../src/lib/utils";

const prisma = new PrismaClient();

async function main() {
  const isDryRun = process.argv.includes("--dry-run");
  console.log(
    isDryRun
      ? "=== MODE SIMULASI (--dry-run): tidak mengubah database ==="
      : "=== MULAI PEMBERSIHAN DATA PLAT & NAMA UNIT ==="
  );

  // 1. Rapikan tabel Vehicle
  const vehicles = await prisma.vehicle.findMany({
    select: {
      id: true,
      plateNumber: true,
      brand: true,
      model: true,
      year: true,
      color: true,
    },
  });

  const existingPlates = new Set(vehicles.map((v) => v.plateNumber));
  let vehicleUpdated = 0;
  let vehicleSkippedConflict = 0;

  for (const v of vehicles) {
    const nextPlate = normalizePlateNumber(v.plateNumber);
    const nextBrand = formatReadableText(v.brand);
    const nextModel = cleanVehicleModel(v.brand, v.model, v.year) || formatReadableText(v.model);
    const nextColor = formatReadableText(v.color);

    const changed =
      nextPlate !== v.plateNumber ||
      nextBrand !== v.brand ||
      nextModel !== v.model ||
      nextColor !== v.color;

    if (!changed) continue;

    // Pastikan tidak bentrok unique constraint jika sudah ada unit lain dengan plat target
    if (nextPlate !== v.plateNumber && existingPlates.has(nextPlate)) {
      console.warn(
        `[LEWATI KONFLIK] Vehicle ${v.id}: "${v.plateNumber}" -> "${nextPlate}" sudah dipakai unit lain.`
      );
      vehicleSkippedConflict++;
      continue;
    }

    console.log(
      `[Vehicle] ${v.plateNumber} (${v.brand} ${v.model}) => ${nextPlate} (${nextBrand} ${nextModel})`
    );

    if (!isDryRun) {
      await prisma.vehicle.update({
        where: { id: v.id },
        data: {
          plateNumber: nextPlate,
          brand: nextBrand,
          model: nextModel,
          color: nextColor,
        },
      });
    }

    existingPlates.delete(v.plateNumber);
    existingPlates.add(nextPlate);
    vehicleUpdated++;
  }

  // 2. Rapikan tabel HistoricalSale
  const histories = await prisma.historicalSale.findMany({
    select: {
      id: true,
      plateNumber: true,
      brand: true,
      model: true,
      year: true,
      color: true,
    },
  });

  let historyUpdated = 0;
  for (const h of histories) {
    const nextPlate = normalizePlateNumber(h.plateNumber);
    const nextBrand = formatReadableText(h.brand);
    const nextModel = cleanVehicleModel(h.brand, h.model, h.year) || formatReadableText(h.model);
    const nextColor = h.color ? formatReadableText(h.color) : h.color;

    const changed =
      nextPlate !== h.plateNumber ||
      nextBrand !== h.brand ||
      nextModel !== h.model ||
      nextColor !== h.color;

    if (!changed) continue;

    if (!isDryRun) {
      await prisma.historicalSale.update({
        where: { id: h.id },
        data: {
          plateNumber: nextPlate,
          brand: nextBrand,
          model: nextModel,
          color: nextColor,
        },
      });
    }
    historyUpdated++;
  }

  console.log("\n=== RINGKASAN PEMBERSIHAN ===");
  console.log(`- Unit aktif (Vehicle) dirapikan : ${vehicleUpdated} dari ${vehicles.length}`);
  if (vehicleSkippedConflict > 0) {
    console.log(`- Unit dilewati karena konflik   : ${vehicleSkippedConflict}`);
  }
  console.log(`- Arsip (HistoricalSale) dirapikan: ${historyUpdated} dari ${histories.length}`);
  if (isDryRun) {
    console.log("\nJalankan tanpa --dry-run (npm run db:cleanup-data) untuk menerapkan perubahan.");
  }
}

main()
  .catch((err) => {
    console.error("Gagal menjalankan pembersihan data:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
