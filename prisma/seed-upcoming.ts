import { PrismaClient } from "@prisma/client";
import Decimal from "decimal.js";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding dummy data untuk Stok Segera Hadir (Upcoming Stock)...");

  // 1. Unit 1: Toyota Avanza 1.3 E MT 2022 (Status: INTAKE / Baru Masuk)
  const avanzaUpcoming = await prisma.vehicle.upsert({
    where: { plateNumber: "N 1552 CD" },
    update: {
      status: "INTAKE",
      targetSellingPrice: new Decimal(155000000),
    },
    create: {
      plateNumber: "N 1552 CD",
      brand: "Toyota",
      model: "Avanza 1.3 E MT",
      year: 2022,
      color: "Putih Metalik",
      odometer: 38500,
      transmission: "MANUAL",
      engineCapacity: 1329,
      purchasePrice: new Decimal(138000000),
      purchaseDate: new Date("2026-10-01"),
      targetSellingPrice: new Decimal(155000000),
      minSellingPrice: new Decimal(148000000),
      status: "INTAKE",
      currentLocation: "Garasi Antrean Inspeksi - Area C",
      taxExpiryDate: new Date("2027-05-15"),
      stnkStatus: "READY",
      bpkbStatus: "PROCESS_1_2_WEEKS",
      bpkbLeadDays: 14,
      fuelType: "BENSIN",
      driveType: "4x2 FWD",
      notes: "Unit baru masuk dari tangan pertama, dalam antrean inspeksi menyeluruh dan detailing salon.",
    },
  });

  // Hapus foto lama jika ada lalu isi foto teaser & foto internal
  await prisma.vehiclePhoto.deleteMany({ where: { vehicleId: avanzaUpcoming.id } });
  await prisma.vehiclePhoto.createMany({
    data: [
      {
        vehicleId: avanzaUpcoming.id,
        category: "CONDITION_INTAKE",
        tag: "FRONT_3_4",
        title: "Tampak Depan Serong Kanan (Teaser Publik)",
        fileUrl: "/images/cars/avanza/front.jpg",
      },
      {
        vehicleId: avanzaUpcoming.id,
        category: "CONDITION_INTAKE",
        tag: "REAR_3_4",
        title: "Tampak Belakang (Internal Showroom)",
        fileUrl: "/images/cars/avanza/rear.jpg",
      },
    ],
  });

  console.log(`✓ Unit INTAKE seeded: ${avanzaUpcoming.brand} ${avanzaUpcoming.model} (${avanzaUpcoming.plateNumber})`);

  // 2. Unit 2: Honda Brio Satya 1.2 E CVT 2021 (Status: IN_REPAIR / Sedang Salon & Rekondisi)
  const brioUpcoming = await prisma.vehicle.upsert({
    where: { plateNumber: "W 1204 PK" },
    update: {
      status: "IN_REPAIR",
      targetSellingPrice: new Decimal(148000000),
    },
    create: {
      plateNumber: "W 1204 PK",
      brand: "Honda",
      model: "Brio Satya 1.2 E CVT",
      year: 2021,
      color: "Abu-abu Metalik",
      odometer: 42000,
      transmission: "AUTOMATIC",
      engineCapacity: 1199,
      purchasePrice: new Decimal(132000000),
      purchaseDate: new Date("2026-09-28"),
      targetSellingPrice: new Decimal(148000000),
      minSellingPrice: new Decimal(142000000),
      status: "IN_REPAIR",
      currentLocation: "Workshop Salon & Detailing Nur Mobil",
      taxExpiryDate: new Date("2027-02-10"),
      stnkStatus: "READY",
      bpkbStatus: "READY",
      fuelType: "BENSIN",
      driveType: "4x2 FWD",
      notes: "Sedang proses poles bodi 3 tahap dan pembersihan ruang mesin. Estimasi siap tayang 2 hari lagi.",
    },
  });

  await prisma.vehiclePhoto.deleteMany({ where: { vehicleId: brioUpcoming.id } });
  await prisma.vehiclePhoto.createMany({
    data: [
      {
        vehicleId: brioUpcoming.id,
        category: "CONDITION_BEFORE_REPAIR",
        tag: "FRONT_3_4",
        title: "Tampak Depan Serong Kanan (Teaser Publik)",
        fileUrl: "/images/cars/brio/front.jpg",
      },
      {
        vehicleId: brioUpcoming.id,
        category: "CONDITION_BEFORE_REPAIR",
        tag: "REAR_3_4",
        title: "Tampak Belakang (Internal Showroom)",
        fileUrl: "/images/cars/brio/rear.jpg",
      },
    ],
  });

  console.log(`✓ Unit IN_REPAIR seeded: ${brioUpcoming.brand} ${brioUpcoming.model} (${brioUpcoming.plateNumber})`);
  console.log("Seeding dummy upcoming stock selesai!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
