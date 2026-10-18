import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Menyinkronkan akun pengguna & password ke database...");

  const defaultUsers = [
    {
      authUserId: "owner",
      aliases: ["admin-owner-001"],
      role: "OWNER" as const,
      fullName: "Owner Nur Mobil (Toko Bu Nur)",
      phone: "081234567890",
      password: process.env.AUTH_PASSWORD_OWNER || "NurMobil#Owner2026!",
    },
    {
      authUserId: "admin_garasi",
      aliases: ["staff-admin-001"],
      role: "STAFF_ADMIN" as const,
      fullName: "Staff Operasional & Garasi",
      phone: "081234567891",
      password: process.env.AUTH_PASSWORD_STAFF || "NurMobil#Staff2026*",
    },
    {
      authUserId: "sales01",
      aliases: ["sales-field-001"],
      role: "SALES" as const,
      fullName: "Tim Sales Nur Mobil",
      phone: "081234567892",
      password: process.env.AUTH_PASSWORD_SALES || "NurMobil#Sales2026$",
    },
    {
      authUserId: "hendra_investor",
      aliases: [],
      role: "INVESTOR" as const,
      fullName: "Pak Hendra Pemodal",
      phone: "081234567895",
      password: process.env.AUTH_PASSWORD_INVESTOR || "NurMobil#Investor2026^",
    },
  ];

  for (const user of defaultUsers) {
    const saltRounds = 10;
    const passwordHash = bcrypt.hashSync(user.password, saltRounds);

    // Jika role INVESTOR, pastikan ada record di tabel Investor dan relasikan
    let investorId: string | undefined = undefined;
    if (user.role === "INVESTOR") {
      let investor = await prisma.investor.findFirst({
        where: {
          OR: [
            { name: { contains: "Hendra" } },
            { phone: user.phone },
          ],
        },
      });

      if (!investor) {
        investor = await prisma.investor.create({
          data: {
            name: user.fullName,
            phone: user.phone,
            type: "THIRD_PARTY",
            defaultProfitSharePercent: 50,
          },
        });
        console.log(`✓ Record profil investor dibuat: ${investor.name} (${investor.id})`);
      }
      investorId = investor.id;
    }

    // Cari apakah akun sudah ada (berdasarkan authUserId utama atau alias lama)
    const existing = await prisma.userProfile.findFirst({
      where: {
        OR: [
          { authUserId: user.authUserId },
          ...(user.aliases.length > 0 ? [{ authUserId: { in: user.aliases } }] : []),
        ],
      },
    });

    if (existing) {
      await prisma.userProfile.update({
        where: { id: existing.id },
        data: {
          authUserId: user.authUserId,
          role: user.role,
          fullName: user.fullName,
          phone: user.phone,
          passwordHash,
          isActive: true,
          ...(investorId ? { investorId } : {}),
        },
      });
      console.log(`✓ Akun diupdate: ${user.authUserId} (${user.role}) - Password tersimpan di DB.`);
    } else {
      await prisma.userProfile.create({
        data: {
          authUserId: user.authUserId,
          role: user.role,
          fullName: user.fullName,
          phone: user.phone,
          passwordHash,
          isActive: true,
          ...(investorId ? { investorId } : {}),
        },
      });
      console.log(`✓ Akun dibuat baru: ${user.authUserId} (${user.role}) - Password tersimpan di DB.`);
    }
  }

  console.log("\nSeluruh akun pengguna dan kata sandi berhasil disinkronkan ke database!");
}

main()
  .catch((e) => {
    console.error("Gagal sinkronisasi pengguna:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
