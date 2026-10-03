import { PrismaClient } from "@prisma/client";
import Decimal from "decimal.js";

const prisma = new PrismaClient();

async function main() {
  console.log("Mengupdate Aturan Tier Bagi Hasil 4 Saudara ke 7 Tingkatan...");

  // Nonaktifkan/hapus aturan lama
  await prisma.profitShareRule.deleteMany({});

  const rulesData = [
    {
      name: "Laba Rendah (Rp 0 - Rp 1.000.000)",
      beneficiaryGroup: "MOTHER_SIBLING",
      minProfit: new Decimal(0),
      maxProfit: new Decimal(1000000),
      amountPerPerson: new Decimal(100000),
      numberOfPeople: 4,
      active: true,
    },
    {
      name: "Laba Ringan (Rp 1.000.000 - Rp 2.500.000)",
      beneficiaryGroup: "MOTHER_SIBLING",
      minProfit: new Decimal(1000000),
      maxProfit: new Decimal(2500000),
      amountPerPerson: new Decimal(175000),
      numberOfPeople: 4,
      active: true,
    },
    {
      name: "Laba Wajar (Rp 2.500.000 - Rp 5.000.000)",
      beneficiaryGroup: "MOTHER_SIBLING",
      minProfit: new Decimal(2500000),
      maxProfit: new Decimal(5000000),
      amountPerPerson: new Decimal(250000),
      numberOfPeople: 4,
      active: true,
    },
    {
      name: "Laba Menengah (Rp 5.000.000 - Rp 7.500.000)",
      beneficiaryGroup: "MOTHER_SIBLING",
      minProfit: new Decimal(5000000),
      maxProfit: new Decimal(7500000),
      amountPerPerson: new Decimal(500000),
      numberOfPeople: 4,
      active: true,
    },
    {
      name: "Laba Tinggi (Rp 7.500.000 - Rp 10.000.000)",
      beneficiaryGroup: "MOTHER_SIBLING",
      minProfit: new Decimal(7500000),
      maxProfit: new Decimal(10000000),
      amountPerPerson: new Decimal(750000),
      numberOfPeople: 4,
      active: true,
    },
    {
      name: "Laba Sangat Tinggi (Rp 10.000.000 - Rp 20.000.000)",
      beneficiaryGroup: "MOTHER_SIBLING",
      minProfit: new Decimal(10000000),
      maxProfit: new Decimal(20000000),
      amountPerPerson: new Decimal(1000000),
      numberOfPeople: 4,
      active: true,
    },
    {
      name: "Laba Istimewa (> Rp 20.000.000)",
      beneficiaryGroup: "MOTHER_SIBLING",
      minProfit: new Decimal(20000000),
      maxProfit: null,
      amountPerPerson: new Decimal(2000000),
      numberOfPeople: 4,
      active: true,
    },
  ];

  for (const rule of rulesData) {
    await prisma.profitShareRule.create({ data: rule });
  }

  console.log("✓ Berhasil memperbarui 7 tingkatan aturan bagi hasil 4 saudara!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
