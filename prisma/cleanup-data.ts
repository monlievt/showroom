import { PrismaClient } from "@prisma/client";
import {
  normalizePlateNumber,
  cleanVehicleModel,
  formatReadableText,
  parseProofUrls,
} from "../src/lib/utils";
import { getExpenseCategoryShortLabel } from "../src/lib/constants/expense-categories";

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

  // 3. Bersihkan foto arsip nota yatim (VehiclePhoto tag=RECEIPT_EXPENSE yang biaya induknya sudah dihapus/diganti)
  const receiptPhotos = await prisma.vehiclePhoto.findMany({
    where: { tag: "RECEIPT_EXPENSE" },
    select: { id: true, vehicleId: true, fileUrl: true, title: true },
  });

  const allExpenses = await prisma.expense.findMany({
    select: {
      vehicleId: true,
      category: true,
      vendorName: true,
      amount: true,
      receiptUrl: true,
    },
  });

  // Peta: vehicleId -> Map<fileUrl, expectedTitle>
  const activeReceiptMap = new Map<string, Map<string, string>>();
  for (const exp of allExpenses) {
    const urls = parseProofUrls(exp.receiptUrl);
    if (urls.length === 0) continue;
    let urlMap = activeReceiptMap.get(exp.vehicleId);
    if (!urlMap) {
      urlMap = new Map<string, string>();
      activeReceiptMap.set(exp.vehicleId, urlMap);
    }
    const catLabel = getExpenseCategoryShortLabel(exp.category);
    urls.forEach((u, idx) => {
      const title = `Nota ${catLabel}: ${exp.vendorName || "Vendor"} (Rp ${Number(exp.amount).toLocaleString("id-ID")})${urls.length > 1 ? ` (${idx + 1}/${urls.length})` : ""}`;
      urlMap!.set(u, title);
    });
  }

  let orphanReceiptsRemoved = 0;
  let receiptTitlesSynced = 0;

  for (const photo of receiptPhotos) {
    const validTitle = activeReceiptMap.get(photo.vehicleId)?.get(photo.fileUrl);
    if (!validTitle) {
      console.log(
        `[Hapus Nota Yatim] VehiclePhoto ${photo.id}: "${photo.title || photo.fileUrl}" (biaya asalnya sudah tidak ada)`
      );
      if (!isDryRun) {
        await prisma.vehiclePhoto.delete({ where: { id: photo.id } });
      }
      orphanReceiptsRemoved++;
    } else if (photo.title !== validTitle) {
      console.log(
        `[Sinkron Judul Nota] "${photo.title}" => "${validTitle}"`
      );
      if (!isDryRun) {
        await prisma.vehiclePhoto.update({
          where: { id: photo.id },
          data: { title: validTitle },
        });
      }
      receiptTitlesSynced++;
    }
  }

  console.log("\n=== RINGKASAN PEMBERSIHAN ===");
  console.log(`- Unit aktif (Vehicle) dirapikan  : ${vehicleUpdated} dari ${vehicles.length}`);
  if (vehicleSkippedConflict > 0) {
    console.log(`- Unit dilewati karena konflik    : ${vehicleSkippedConflict}`);
  }
  console.log(`- Arsip (HistoricalSale) dirapikan: ${historyUpdated} dari ${histories.length}`);
  console.log(`- Foto nota yatim dibersihkan     : ${orphanReceiptsRemoved}`);
  console.log(`- Judul foto nota disinkronkan    : ${receiptTitlesSynced}`);
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
