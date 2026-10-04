import { PrismaClient, VehicleStatus, SourceType, TransmissionType, ExpenseCategory, CashTransactionType, InvestorType, SaleChannel } from "@prisma/client";
import Decimal from "decimal.js";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 0. Mengosongkan data transaksi lama agar import bersih & tanpa duplikat...");
  await prisma.profitDistribution.deleteMany({});
  await prisma.salePayment.deleteMany({});
  await prisma.sale.deleteMany({});
  await prisma.cashTransaction.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.buyer.deleteMany({});
  console.log("✓ Data transaksi berhasil dibersihkan");

  console.log("\n🚀 Memulai import data historis & stok aktif ke database...");

  const dataFilePath = path.join(__dirname, "history-data.json");
  if (!fs.existsSync(dataFilePath)) {
    throw new Error(`File ${dataFilePath} tidak ditemukan!`);
  }

  const rawData = JSON.parse(fs.readFileSync(dataFilePath, "utf-8"));
  const { investors, activeVehicles, soldVehicles } = rawData;

  // Inisialisasi saldo kas berjalan
  let runningBalance = new Decimal(500000000); // Modal dasar operasional awal
  await prisma.cashTransaction.create({
    data: {
      type: CashTransactionType.IN_OWNER_EQUITY,
      amount: new Decimal(500000000),
      runningBalance: runningBalance,
      notes: "Saldo kas operasional awal modal toko",
      createdBy: "admin-owner-001",
    },
  });

  // 1. Buat / Upsert Investor
  console.log(`\n👥 1. Memproses ${investors.length} Investor...`);
  const investorMap = new Map<string, string>();
  for (const inv of investors) {
    const existing = await prisma.investor.findFirst({
      where: { name: inv.name },
    });
    if (existing) {
      investorMap.set(inv.name, existing.id);
    } else {
      const created = await prisma.investor.create({
        data: {
          name: inv.name,
          phone: inv.phone,
          type: inv.type as InvestorType,
        },
      });
      investorMap.set(inv.name, created.id);
    }
  }
  console.log(`✓ ${investorMap.size} Investor siap`);

  // 2. Buat Default Buyer
  console.log("\n🛒 2. Memproses Buyer / Pelanggan...");
  const buyerNames = [
    "Pelanggan Showroom (Umum)",
    "Pelanggan Toko Bu Nur (2021-2024)",
    "Kcunk Motor Tulungagung",
  ];
  const buyerMap = new Map<string, string>();
  for (const bName of buyerNames) {
    const existing = await prisma.buyer.findFirst({
      where: { name: bName },
    });
    if (existing) {
      buyerMap.set(bName, existing.id);
    } else {
      const created = await prisma.buyer.create({
        data: {
          name: bName,
          isShowroom: bName.includes("Showroom") || bName.includes("Kcunk"),
        },
      });
      buyerMap.set(bName, created.id);
    }
  }
  const defaultBuyerId = buyerMap.get("Pelanggan Showroom (Umum)")!;
  console.log(`✓ ${buyerMap.size} Buyer siap`);

  // 3. Masukkan 13 Unit STOK AKTIF
  console.log(`\n🚗 3. Memasukkan ${activeVehicles.length} Unit STOK AKTIF (Ready & Pengerjaan)...`);
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
        notes: `Import Stok Aktif dari Sheet [${v.sheet}]. Modal terhitung: Rp ${Number(v.totalHpp).toLocaleString("id-ID")}`,
      },
    });

    // Transaksi Kas Beli Unit
    const beliAmount = new Decimal(v.purchasePrice);
    runningBalance = runningBalance.minus(beliAmount);
    await prisma.cashTransaction.create({
      data: {
        type: CashTransactionType.OUT_VEHICLE_PURCHASE,
        amount: beliAmount,
        runningBalance: runningBalance,
        createdAt: pDate,
        relatedVehicleId: vehicle.id,
        notes: `[Kulakan Unit] ${v.brand} ${v.model} (${v.plateNumber}) via ${v.auctionHouse || "Lelang"}`,
        createdBy: "Import Sistem",
      },
    });

    // Biaya-biaya unit
    for (const exp of v.expenses || []) {
      const expAmount = new Decimal(exp.amount);
      const expense = await prisma.expense.create({
        data: {
          vehicleId: vehicle.id,
          category: exp.category as ExpenseCategory,
          amount: expAmount,
          createdAt: pDate,
          notes: exp.notes || "Biaya perbaikan/rekondisi",
          createdBy: "Import Sistem",
        },
      });

      runningBalance = runningBalance.minus(expAmount);
      await prisma.cashTransaction.create({
        data: {
          type: CashTransactionType.OUT_EXPENSE,
          amount: expAmount,
          runningBalance: runningBalance,
          createdAt: pDate,
          relatedVehicleId: vehicle.id,
          relatedExpenseId: expense.id,
          notes: `[Biaya Unit ${v.plateNumber}] ${exp.notes}`,
          createdBy: "Import Sistem",
        },
      });
    }

    activeCount++;
  }
  console.log(`✓ Berhasil memasukkan ${activeCount} unit STOK AKTIF.`);

  // 4. Masukkan Unit Terjual Historis
  console.log(`\n📜 4. Memasukkan ${soldVehicles.length} Unit TERJUAL HISTORIS (File 1 & File 2)...`);
  let soldCount = 0;
  for (const v of soldVehicles) {
    const pDate = new Date(v.purchaseDate);
    const sDate = v.sale?.saleDate ? new Date(v.sale.saleDate) : pDate;
    const bId = buyerMap.get(v.sale?.buyerName || "") || defaultBuyerId;

    const vehicle = await prisma.vehicle.create({
      data: {
        plateNumber: v.plateNumber,
        brand: v.brand,
        model: v.model,
        year: v.year,
        color: v.color || "HITAM",
        odometer: v.odometer || 60000,
        transmission: v.transmission as TransmissionType,
        engineCapacity: v.engineCapacity || 1500,
        sourceType: (v.sourceType as SourceType) || SourceType.AUCTION,
        auctionHouse: v.auctionHouse || null,
        purchasePrice: new Decimal(v.purchasePrice),
        purchaseDate: pDate,
        targetSellingPrice: v.targetSellingPrice ? new Decimal(v.targetSellingPrice) : null,
        status: VehicleStatus.SOLD_SETTLED,
        currentLocation: "Terjual",
        notes: `Data historis dari [${v.sheet}]. Modal HPP: Rp ${Number(v.totalHpp).toLocaleString("id-ID")}`,
      },
    });

    // Kas Beli Unit
    const beliAmount = new Decimal(v.purchasePrice);
    runningBalance = runningBalance.minus(beliAmount);
    await prisma.cashTransaction.create({
      data: {
        type: CashTransactionType.OUT_VEHICLE_PURCHASE,
        amount: beliAmount,
        runningBalance: runningBalance,
        createdAt: pDate,
        relatedVehicleId: vehicle.id,
        notes: `[Kulakan Historis] ${v.brand} ${v.model} (${v.plateNumber})`,
        createdBy: "Import Sistem",
      },
    });

    // Expenses
    for (const exp of v.expenses || []) {
      const expAmount = new Decimal(exp.amount);
      const expense = await prisma.expense.create({
        data: {
          vehicleId: vehicle.id,
          category: exp.category as ExpenseCategory,
          amount: expAmount,
          createdAt: pDate,
          notes: exp.notes || "Biaya perbaikan/rekondisi",
          createdBy: "Import Sistem",
        },
      });

      runningBalance = runningBalance.minus(expAmount);
      await prisma.cashTransaction.create({
        data: {
          type: CashTransactionType.OUT_EXPENSE,
          amount: expAmount,
          runningBalance: runningBalance,
          createdAt: pDate,
          relatedVehicleId: vehicle.id,
          relatedExpenseId: expense.id,
          notes: `[Biaya Historis ${v.plateNumber}] ${exp.notes}`,
          createdBy: "Import Sistem",
        },
      });
    }

    // Record Penjualan (Sale)
    if (v.sale && v.sale.sellingPrice > 0) {
      const jualAmount = new Decimal(v.sale.sellingPrice);
      const sale = await prisma.sale.create({
        data: {
          vehicleId: vehicle.id,
          saleDate: sDate,
          saleType: SaleChannel.SHOWROOM,
          buyerId: bId,
          sellingPrice: jualAmount,
        },
      });

      // Pembayaran Lunas
      await prisma.salePayment.create({
        data: {
          saleId: sale.id,
          amount: jualAmount,
          paidAt: sDate,
          method: "CASH",
          notes: `Pelunasan penjualan historis ${v.plateNumber}`,
          recordedBy: "Import Sistem",
        },
      });

      // Kas Masuk Penjualan
      runningBalance = runningBalance.plus(jualAmount);
      await prisma.cashTransaction.create({
        data: {
          type: CashTransactionType.IN_SALE_PAYMENT,
          amount: jualAmount,
          runningBalance: runningBalance,
          createdAt: sDate,
          relatedVehicleId: vehicle.id,
          relatedSaleId: sale.id,
          notes: `[Pelunasan Jual Historis] ${v.brand} ${v.model} (${v.plateNumber})`,
          createdBy: "Import Sistem",
        },
      });
    }

    soldCount++;
    if (soldCount % 25 === 0) {
      console.log(`  ...diproses ${soldCount}/${soldVehicles.length} unit`);
    }
  }

  console.log(`✓ Berhasil memasukkan ${soldCount} unit TERJUAL HISTORIS.`);

  // Ringkasan Akhir
  const totalVehicles = await prisma.vehicle.count();
  const totalSales = await prisma.sale.count();
  const totalExpenses = await prisma.expense.count();
  const totalCashTx = await prisma.cashTransaction.count();

  console.log("\n=======================================================");
  console.log("🎉 IMPORT SELESAI DENGAN SUKSES!");
  console.log("=======================================================");
  console.log(`  - Total Kendaraan di Database: ${totalVehicles} unit`);
  console.log(`      * Stok Aktif (Ready/Bengkel): ${activeCount} unit`);
  console.log(`      * Terjual Lunas (Historis):   ${soldCount} unit`);
  console.log(`  - Total Transaksi Penjualan:   ${totalSales}`);
  console.log(`  - Total Rincian Biaya:         ${totalExpenses}`);
  console.log(`  - Total Baris Buku Kas Masuk/Keluar: ${totalCashTx}`);
  console.log(`  - Saldo Kas Akhir Tercatat: Rp ${runningBalance.toNumber().toLocaleString("id-ID")}`);
  console.log("=======================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Error saat import data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
