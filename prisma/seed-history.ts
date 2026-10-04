import { PrismaClient, VehicleStatus, SourceType, TransmissionType, ExpenseCategory, InvestorType } from "@prisma/client";
import Decimal from "decimal.js";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 0. Mengosongkan data transaksi lama untuk menerapkan Solusi A (Pemisahan Bersih)...");
  await prisma.historicalSale.deleteMany({});
  await prisma.profitDistribution.deleteMany({});
  await prisma.salePayment.deleteMany({});
  await prisma.sale.deleteMany({});
  await prisma.cashTransaction.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.buyer.deleteMany({});
  await prisma.investor.deleteMany({});
  console.log("✓ Seluruh data transaksi & investor dibersihkan.");

  const dataFilePath = path.join(__dirname, "history-data.json");
  if (!fs.existsSync(dataFilePath)) {
    throw new Error(`File ${dataFilePath} tidak ditemukan!`);
  }

  const rawData = JSON.parse(fs.readFileSync(dataFilePath, "utf-8"));
  const { activeVehicles, soldVehicles } = rawData;

  // 1. Masukkan 13 Unit STOK AKTIF ke tabel `Vehicle`
  console.log(`\n🚗 2. Memasukkan ${activeVehicles.length} Unit STOK AKTIF Garasi ke Inventori...`);
  let activeCount = 0;
  for (const v of activeVehicles) {
    const pDate = new Date(v.purchaseDate);
    const vehicle = await prisma.vehicle.create({
      data: {
        plateNumber: v.plateNumber,
        brand: v.brand,
        model: v.model,
        year: v.year,
        color: v.color || "HITAM",
        odometer: v.odometer || 50000,
        transmission: v.transmission as TransmissionType,
        engineCapacity: v.engineCapacity || 1500,
        sourceType: v.sourceType as SourceType,
        auctionHouse: v.auctionHouse || null,
        purchasePrice: new Decimal(v.purchasePrice),
        purchaseDate: pDate,
        targetSellingPrice: v.targetSellingPrice ? new Decimal(v.targetSellingPrice) : null,
        status: v.status as VehicleStatus,
        currentLocation: v.status === "IN_REPAIR" ? "Bengkel / Pengerjaan" : "Garasi Utama",
        notes: `Unit Stok Aktif dari Sheet [${v.sheet}]. Modal terhitung: Rp ${Number(v.totalHpp).toLocaleString("id-ID")}`,
      },
    });

    // Masukkan rincian biaya yang sudah dikeluarkan sejauh ini (HPP)
    for (const exp of v.expenses || []) {
      await prisma.expense.create({
        data: {
          vehicleId: vehicle.id,
          category: exp.category as ExpenseCategory,
          amount: new Decimal(exp.amount),
          date: pDate,
          notes: exp.notes || "Biaya perbaikan/rekondisi",
          createdBy: "Staf Operasional",
        },
      });
    }

    activeCount++;
  }
  console.log(`✓ Berhasil memasukkan ${activeCount} unit STOK AKTIF (Ready & Pengerjaan) ke Inventori.`);

  // 3. Masukkan 127 Unit Penjualan Masa Lalu ke tabel `HistoricalSale` (ARSIP & BENCHMARK)
  console.log(`\n📚 3. Memasukkan ${soldVehicles.length} Unit Masa Lalu ke Tabel 'HistoricalSale' (Arsip & Benchmark)...`);
  let archiveCount = 0;
  let totalOmzet = new Decimal(0);
  let totalProfit = new Decimal(0);

  for (const v of soldVehicles) {
    const pDate = v.purchaseDate ? new Date(v.purchaseDate) : null;
    const sDate = v.sale?.saleDate ? new Date(v.sale.saleDate) : pDate;
    const hargaBeli = new Decimal(v.purchasePrice || 0);
    const hargaLaku = new Decimal(v.sale?.sellingPrice || 0);
    const modalHpp = new Decimal(v.totalHpp || v.purchasePrice || 0);
    const labaKotor = hargaLaku.minus(modalHpp);

    totalOmzet = totalOmzet.plus(hargaLaku);
    totalProfit = totalProfit.plus(labaKotor);

    const isFile1 = String(v.sheet).startsWith("File1");
    const sourceLabel = isFile1 ? "File 1 (2021-2024)" : `File 2 (Sheet ${v.sheet})`;

    await prisma.historicalSale.create({
      data: {
        plateNumber: v.plateNumber,
        brand: v.brand,
        model: v.model,
        year: v.year,
        color: v.color || "HITAM",
        transmission: v.transmission || "MANUAL",
        sourceType: v.sourceType || "AUCTION",
        auctionHouse: v.auctionHouse || null,
        purchasePrice: hargaBeli,
        purchaseDate: pDate,
        repairExpenses: modalHpp.minus(hargaBeli),
        totalHpp: modalHpp,
        sellingPrice: hargaLaku,
        saleDate: sDate,
        grossProfit: labaKotor,
        buyerName: v.sale?.buyerName || "Pelanggan Showroom",
        notes: `Data historis toko lama dari ${sourceLabel}.`,
        expenseDetails: v.expenses && v.expenses.length > 0 ? v.expenses : null,
        sourceFile: sourceLabel,
      },
    });

    archiveCount++;
    if (archiveCount % 25 === 0) {
      console.log(`  ...diarsipkan ${archiveCount}/${soldVehicles.length} unit`);
    }
  }
  console.log(`✓ Berhasil mengarsipkan ${archiveCount} unit ke tabel HistoricalSale.`);

  console.log("\n=======================================================");
  console.log("🎉 SOLUSI A BERHASIL DITERAPKAN DENGAN BERSIH!");
  console.log("=======================================================");
  console.log(`  1. INVENTORI AKTIF TOKO:`);
  console.log(`     - Total Mobil/Motor di Garasi: ${activeCount} unit (Ready & Proses)`);
  console.log(`     - Tanpa ada mobil lama berstatus SOLD_SETTLED yang mengotori inventori.`);
  console.log(`  2. BUKU KAS TOKO:`);
  console.log(`     - Bersih 100%! Tidak ada modal semu 500jt.`);
  console.log(`     - Buku kas siap mencatat saldo riil toko Anda hari ini.`);
  console.log(`  3. ARSIP & BENCHMARK REFERENSI HARGA:`);
  console.log(`     - Total Unit Tersimpan: ${archiveCount} unit`);
  console.log(`     - Total Omzet Historis: Rp ${totalOmzet.toNumber().toLocaleString("id-ID")}`);
  console.log(`     - Total Laba Historis:  Rp ${totalProfit.toNumber().toLocaleString("id-ID")}`);
  console.log("=======================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Error saat import Solusi A:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
