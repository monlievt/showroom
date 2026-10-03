import { PrismaClient } from "@prisma/client";
import Decimal from "decimal.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Memulai pengosongan seluruh data transaksi & operasional Nur Mobil...");

  // 1. Hapus tabel-tabel transaksi turunan
  await prisma.workshopSupplyUsage.deleteMany({});
  console.log("✓ WorkshopSupplyUsage dikosongkan");

  await prisma.workshopSupply.deleteMany({});
  console.log("✓ WorkshopSupply dikosongkan");

  await prisma.showroomAsset.deleteMany({});
  console.log("✓ ShowroomAsset dikosongkan");

  await prisma.operationalExpense.deleteMany({});
  console.log("✓ OperationalExpense dikosongkan");

  await prisma.cashTransaction.deleteMany({});
  console.log("✓ CashTransaction dikosongkan");

  await prisma.profitDistribution.deleteMany({});
  console.log("✓ ProfitDistribution dikosongkan");

  await prisma.capitalLedger.deleteMany({});
  console.log("✓ CapitalLedger dikosongkan");

  await prisma.vehicleInvestment.deleteMany({});
  console.log("✓ VehicleInvestment dikosongkan");

  await prisma.salePayment.deleteMany({});
  console.log("✓ SalePayment dikosongkan");

  await prisma.sale.deleteMany({});
  console.log("✓ Sale dikosongkan");

  await prisma.buyer.deleteMany({});
  console.log("✓ Buyer dikosongkan");

  await prisma.inspectionPanel.deleteMany({});
  console.log("✓ InspectionPanel dikosongkan");

  await prisma.inspection.deleteMany({});
  console.log("✓ Inspection dikosongkan");

  await prisma.vehiclePhoto.deleteMany({});
  console.log("✓ VehiclePhoto dikosongkan");

  await prisma.vehicleDocument.deleteMany({});
  console.log("✓ VehicleDocument dikosongkan");

  await prisma.expense.deleteMany({});
  console.log("✓ Expense dikosongkan");

  await prisma.notificationLog.deleteMany({});
  console.log("✓ NotificationLog dikosongkan");

  await prisma.auditLog.deleteMany({});
  console.log("✓ AuditLog dikosongkan");

  await prisma.taxRecord.deleteMany({});
  console.log("✓ TaxRecord dikosongkan");

  await prisma.vehicle.deleteMany({});
  console.log("✓ Vehicle (Semua Unit Mobil) dikosongkan");

  // Lepaskan relasi investor dari UserProfile jika ada
  await prisma.userProfile.updateMany({
    data: { investorId: null },
  });

  await prisma.investor.deleteMany({});
  console.log("✓ Investor dikosongkan");

  // 2. Pastikan Akun User Login Dasar Tetap Siap Digunakan (Owner, Staff, Sales)
  await prisma.userProfile.deleteMany({});

  await prisma.userProfile.create({
    data: {
      authUserId: "admin-owner-001",
      role: "OWNER",
      fullName: "Owner Nur Mobil (Toko Bu Nur)",
      phone: "081234567890",
    },
  });

  await prisma.userProfile.create({
    data: {
      authUserId: "staff-admin-001",
      role: "STAFF_ADMIN",
      fullName: "Staff Operasional & Garasi",
      phone: "081234567891",
    },
  });

  await prisma.userProfile.create({
    data: {
      authUserId: "sales-field-001",
      role: "SALES",
      fullName: "Tim Sales Nur Mobil",
      phone: "081234567892",
    },
  });
  console.log("✓ Akun Login Operasional (Owner, Staff, Sales) siap dengan PIN 123456");

  // 3. Pastikan Aturan Standar Bagi Hasil 4 Saudara Tersedia
  await prisma.profitShareRule.deleteMany({});
  await prisma.profitShareRule.createMany({
    data: [
      {
        id: "rule-tier-1",
        name: "Laba Sangat Tinggi (> Rp 10.000.000)",
        beneficiaryGroup: "4_SAUDARA",
        minProfit: new Decimal(10000000),
        maxProfit: null,
        amountPerPerson: new Decimal(1000000),
        numberOfPeople: 4,
      },
      {
        id: "rule-tier-2",
        name: "Laba Tinggi (Rp 5.000.000 - Rp 10.000.000)",
        beneficiaryGroup: "4_SAUDARA",
        minProfit: new Decimal(5000000),
        maxProfit: new Decimal(10000000),
        amountPerPerson: new Decimal(500000),
        numberOfPeople: 4,
      },
      {
        id: "rule-tier-3",
        name: "Laba Wajar (< Rp 5.000.000)",
        beneficiaryGroup: "4_SAUDARA",
        minProfit: new Decimal(0),
        maxProfit: new Decimal(5000000),
        amountPerPerson: new Decimal(250000),
        numberOfPeople: 4,
      },
    ],
  });
  console.log("✓ Aturan Tier Bagi Hasil 4 Saudara siap digunakan");

  console.log("🎉 SEMUA DATA DATABASE BERHASIL DIKOSONGKAN. SIAP INPUT DARI 0!");
}

main()
  .catch((e) => {
    console.error("Gagal mengosongkan database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
