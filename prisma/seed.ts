import { PrismaClient, PanelCondition, InspectionPanelType } from "@prisma/client";
import Decimal from "decimal.js";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding data awal Nur Mobil...");

  // 1. Seed UserProfile Admin / Owner
  const admin = await prisma.userProfile.upsert({
    where: { authUserId: "admin-owner-001" },
    update: {},
    create: {
      authUserId: "admin-owner-001",
      role: "ADMIN",
      fullName: "Owner Nur Mobil (Toko Bu Nur)",
      phone: "081234567890",
    },
  });
  console.log(`✓ Admin seeded: ${admin.fullName} (${admin.authUserId})`);

  // 2. Seed Investor
  const ibuInvestor = await prisma.investor.upsert({
    where: { id: "investor-ibu-nurdiah" },
    update: {},
    create: {
      id: "investor-ibu-nurdiah",
      name: "Ibu Nurdiah (Modal Keluarga)",
      phone: "081298765432",
      type: "MOTHER_SIBLING",
    },
  });

  const pakBudi = await prisma.investor.upsert({
    where: { id: "investor-pak-budi" },
    update: {},
    create: {
      id: "investor-pak-budi",
      name: "Pak Budi Hartono (Pihak Ketiga)",
      phone: "081345678901",
      type: "THIRD_PARTY",
    },
  });
  console.log(`✓ Investor seeded: ${ibuInvestor.name}, ${pakBudi.name}`);

  // Saldo awal di CapitalLedger dan CashTransaction (Idempotent: hanya jika belum ada)
  const existingLedger = await prisma.capitalLedger.findFirst({
    where: { investorId: ibuInvestor.id },
  });

  if (!existingLedger) {
    await prisma.capitalLedger.create({
      data: {
        investorId: ibuInvestor.id,
        type: "DEPOSIT",
        amount: new Decimal(150000000),
        runningBalance: new Decimal(150000000),
        notes: "Setoran modal awal Ibu Nurdiah untuk unit perputaran showroom",
        createdBy: admin.authUserId,
      },
    });

    await prisma.capitalLedger.create({
      data: {
        investorId: pakBudi.id,
        type: "DEPOSIT",
        amount: new Decimal(100000000),
        runningBalance: new Decimal(100000000),
        notes: "Setoran modal investasi Pak Budi (akad bagi hasil custom)",
        createdBy: admin.authUserId,
      },
    });

    await prisma.cashTransaction.create({
      data: {
        type: "IN_CAPITAL_DEPOSIT",
        amount: new Decimal(250000000),
        runningBalance: new Decimal(250000000),
        notes: "Saldo kas awal gabungan modal investor",
        createdBy: admin.authUserId,
      },
    });
  }

  // 3. Seed ProfitShareRule Bertingkat (Bagi Hasil 4 Saudara)
  const rules = [
    {
      id: "rule-tier-1",
      name: "Laba Rendah (Rp 0 - Rp 1.000.000)",
      beneficiaryGroup: "MOTHER_SIBLING",
      minProfit: new Decimal(0),
      maxProfit: new Decimal(1000000),
      amountPerPerson: new Decimal(100000),
      numberOfPeople: 4,
      active: true,
    },
    {
      id: "rule-tier-2",
      name: "Laba Ringan (Rp 1.000.000 - Rp 2.500.000)",
      beneficiaryGroup: "MOTHER_SIBLING",
      minProfit: new Decimal(1000000),
      maxProfit: new Decimal(2500000),
      amountPerPerson: new Decimal(175000),
      numberOfPeople: 4,
      active: true,
    },
    {
      id: "rule-tier-3",
      name: "Laba Wajar (Rp 2.500.000 - Rp 5.000.000)",
      beneficiaryGroup: "MOTHER_SIBLING",
      minProfit: new Decimal(2500000),
      maxProfit: new Decimal(5000000),
      amountPerPerson: new Decimal(250000),
      numberOfPeople: 4,
      active: true,
    },
    {
      id: "rule-tier-4",
      name: "Laba Menengah (Rp 5.000.000 - Rp 7.500.000)",
      beneficiaryGroup: "MOTHER_SIBLING",
      minProfit: new Decimal(5000000),
      maxProfit: new Decimal(7500000),
      amountPerPerson: new Decimal(500000),
      numberOfPeople: 4,
      active: true,
    },
    {
      id: "rule-tier-5",
      name: "Laba Tinggi (Rp 7.500.000 - Rp 10.000.000)",
      beneficiaryGroup: "MOTHER_SIBLING",
      minProfit: new Decimal(7500000),
      maxProfit: new Decimal(10000000),
      amountPerPerson: new Decimal(750000),
      numberOfPeople: 4,
      active: true,
    },
    {
      id: "rule-tier-6",
      name: "Laba Sangat Tinggi (Rp 10.000.000 - Rp 20.000.000)",
      beneficiaryGroup: "MOTHER_SIBLING",
      minProfit: new Decimal(10000000),
      maxProfit: new Decimal(20000000),
      amountPerPerson: new Decimal(1000000),
      numberOfPeople: 4,
      active: true,
    },
    {
      id: "rule-tier-7",
      name: "Laba Istimewa (> Rp 20.000.000)",
      beneficiaryGroup: "MOTHER_SIBLING",
      minProfit: new Decimal(20000000),
      maxProfit: null,
      amountPerPerson: new Decimal(2000000),
      numberOfPeople: 4,
      active: true,
    },
  ];

  for (const r of rules) {
    await prisma.profitShareRule.upsert({
      where: { id: r.id },
      update: r,
      create: r,
    });
  }
  console.log(`✓ ${rules.length} ProfitShareRule bertingkat 4 saudara seeded.`);

  // 4. Seed Unit Kendaraan Realistis (Clean Cascade Delete)
  const targetPlates = ["N 1822 AB", "AG 1455 XY", "W 1934 QZ", "L 1092 EF", "N 8821 CD", "N 1420 AB", "AG 1892 RD"];
  const existingVehicles = await prisma.vehicle.findMany({
    where: { plateNumber: { in: targetPlates } },
    select: { id: true },
  });
  const vIds = existingVehicles.map(v => v.id);

  if (vIds.length > 0) {
    const sales = await prisma.sale.findMany({ where: { vehicleId: { in: vIds } }, select: { id: true } });
    const sIds = sales.map(s => s.id);
    if (sIds.length > 0) {
      await prisma.salePayment.deleteMany({ where: { saleId: { in: sIds } } });
      await prisma.profitDistribution.deleteMany({ where: { saleId: { in: sIds } } });
      await prisma.cashTransaction.deleteMany({ where: { relatedSaleId: { in: sIds } } });
      await prisma.sale.deleteMany({ where: { id: { in: sIds } } });
    }

    const inspections = await prisma.inspection.findMany({ where: { vehicleId: { in: vIds } }, select: { id: true } });
    const inspIds = inspections.map(i => i.id);
    if (inspIds.length > 0) {
      await prisma.inspectionPanel.deleteMany({ where: { inspectionId: { in: inspIds } } });
      await prisma.inspection.deleteMany({ where: { id: { in: inspIds } } });
    }

    await prisma.vehiclePhoto.deleteMany({ where: { vehicleId: { in: vIds } } });
    await prisma.expense.deleteMany({ where: { vehicleId: { in: vIds } } });
    await prisma.vehicleInvestment.deleteMany({ where: { vehicleId: { in: vIds } } });
    await prisma.vehicle.deleteMany({ where: { id: { in: vIds } } });
  }

  const panelTypes: InspectionPanelType[] = [
    "HOOD",
    "ROOF",
    "FENDER_FRONT_RIGHT",
    "FENDER_FRONT_LEFT",
    "FRONT_DOOR_RIGHT",
    "FRONT_DOOR_LEFT",
    "REAR_DOOR_RIGHT",
    "REAR_DOOR_LEFT",
    "TRUNK_LID",
    "QUARTER_PANEL_RIGHT",
    "QUARTER_PANEL_LEFT",
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // UNIT 1: Toyota Innova Reborn Diesel 2021 (READY_FOR_SALE)
  // ─────────────────────────────────────────────────────────────────────────────
  const innova = await prisma.vehicle.create({
    data: {
      plateNumber: "N 1822 AB",
      brand: "Toyota",
      model: "Innova Reborn 2.4 G Diesel AT",
      year: 2021,
      color: "Hitam Metalik (Attitude Black)",
      odometer: 48500,
      transmission: "AUTOMATIC",
      engineCapacity: 2393,
      sourceType: "AUCTION",
      auctionHouse: "JBA Surabaya",
      auctionLotType: "EKS_PERUSAHAAN",
      purchasePrice: new Decimal(285000000),
      purchaseDate: new Date("2026-08-15"),
      targetSellingPrice: new Decimal(325000000),
      minSellingPrice: new Decimal(315000000),
      status: "READY_FOR_SALE",
      currentLocation: "Garasi Utama - Blok A1",
      taxExpiryDate: new Date("2027-04-20"),
      stnkStatus: "READY",
      bpkbStatus: "READY",
      bpkbLeadDays: 7,
      youtubeVideoId: "dQw4w9WgXcQ",
      chassisNumber: "MHKAB1BY5NK031897",
      engineNumber: "2GD885717",
      fuelType: "DIESEL",
      driveType: "4x2 RWD",
      notes: "Kondisi sangat istimewa, rawatan bengkel resmi Auto2000, ban tebal 90%.",
    },
  });

  await prisma.expense.createMany({
    data: [
      {
        vehicleId: innova.id,
        category: "DETAILING_SALON",
        amount: new Decimal(1200000),
        notes: "Paket cuci mesin + poles 3 step nano ceramic",
        createdBy: admin.authUserId,
      },
      {
        vehicleId: innova.id,
        category: "OIL_AND_SERVICE",
        amount: new Decimal(1500000),
        notes: "Ganti oli mesin diesel Toyota TMO + filter oli + filter solar",
        createdBy: admin.authUserId,
      },
      {
        vehicleId: innova.id,
        category: "AUCTION_ADMIN_FEE",
        amount: new Decimal(2500000),
        notes: "Admin fee pemenang lelang JBA",
        createdBy: admin.authUserId,
      },
    ],
  });

  const inspectionInnova = await prisma.inspection.create({
    data: {
      vehicleId: innova.id,
      version: 1,
      isCurrent: true,
      stage: "FINAL_LISTING",
      engineGrade: "A",
      interiorGrade: "A",
      exteriorGrade: "A",
      frameGrade: "A",
      accidentHistory: false,
      floodHistory: false,
      engineNotes: "Mesin 2GD-FTV kering tanpa rembes, turbo boost responsif, transmisi matic halus.",
      interiorNotes: "Jok fabric bersih tanpa noda/robek, plafon bersih, AC double blower dingin menggigil.",
      exteriorNotes: "Bodi lempeng nat presisi pabrik, bebas baret dalam.",
      inspectedBy: "Bambang (Inspektor Utama Nur Mobil)",
    },
  });

  for (const panelType of panelTypes) {
    const isRoof = panelType === "ROOF";
    const pRight = 100 + Math.floor(Math.random() * 6) - 3;
    const pCenter = 102 + Math.floor(Math.random() * 6) - 3;
    const pLeft = 101 + Math.floor(Math.random() * 6) - 3;
    const pExtra = isRoof ? 101 : null;
    const avg = Math.round((pRight + pCenter + pLeft + (pExtra || 0)) / (isRoof ? 4 : 3));

    await prisma.inspectionPanel.create({
      data: {
        inspectionId: inspectionInnova.id,
        panelType,
        pointRight: pRight,
        pointCenter: pCenter,
        pointLeft: pLeft,
        pointExtra: pExtra,
        paintThickness: avg,
        condition: "ORIGINAL",
        defectCode: "✓",
        notes: "Cat original pabrik presisi, segel baut utuh tanpa tanda bekas bongkar.",
      },
    });
  }

  await prisma.vehiclePhoto.createMany({
    data: [
      {
        vehicleId: innova.id,
        inspectionId: inspectionInnova.id,
        category: "FINAL_LISTING",
        tag: "FRONT_3_4",
        title: "Tampak Depan Serong Kanan (Front 3/4)",
        fileUrl: "/images/cars/innova/front.jpg",
      },
      {
        vehicleId: innova.id,
        inspectionId: inspectionInnova.id,
        category: "FINAL_LISTING",
        tag: "REAR_3_4",
        title: "Tampak Belakang Serong Kiri (Rear 3/4)",
        fileUrl: "/images/cars/innova/rear.jpg",
      },
      {
        vehicleId: innova.id,
        inspectionId: inspectionInnova.id,
        category: "CONDITION_INTAKE",
        tag: "ENGINE_BAY",
        title: "Ruang Mesin 2GD-FTV Kering & Sealer Kap Mesin Utuh",
        fileUrl: "/images/cars/innova/engine.jpg",
      },
      {
        vehicleId: innova.id,
        inspectionId: inspectionInnova.id,
        category: "CONDITION_INTAKE",
        tag: "DOOR_SEALER",
        title: "Sealer Karet Pintu & Baut Engsel (Bebas Bongkar)",
        fileUrl: "/images/cars/innova/door_sealer.jpg",
      },
      {
        vehicleId: innova.id,
        inspectionId: inspectionInnova.id,
        category: "CONDITION_INTAKE",
        tag: "UNDER_DASHBOARD",
        title: "Bawah Dashboard & Kolong Pedal (Bebas Lumpur Banjir)",
        fileUrl: "/images/cars/innova/under_dashboard.jpg",
      },
      {
        vehicleId: innova.id,
        inspectionId: inspectionInnova.id,
        category: "CONDITION_INTAKE",
        tag: "UNDERBODY_CHASSIS",
        title: "Kolong Sasis & Rangka Bawah (Bebas Karat & Bebas Benturan)",
        fileUrl: "/images/cars/innova/underbody.jpg",
      },
      {
        vehicleId: innova.id,
        inspectionId: inspectionInnova.id,
        category: "FINAL_LISTING",
        tag: "INTERIOR_DASHBOARD",
        title: "Dashboard, Setir & Panel Speedometer Odo 48.500 KM",
        fileUrl: "/images/cars/innova/interior.jpg",
      },
      {
        vehicleId: innova.id,
        inspectionId: inspectionInnova.id,
        category: "CONDITION_INTAKE",
        tag: "TRUNK_SPARE_TIRE",
        title: "Ruang Bagasi & Lantai Tempat Ban Serep Utuh",
        fileUrl: "/images/cars/innova/trunk.jpg",
      },
      {
        vehicleId: innova.id,
        inspectionId: inspectionInnova.id,
        category: "DOCUMENT_PROOF",
        tag: "DOCUMENT_STNK_BPKB",
        title: "Fisik Asli Dokumen BPKB & STNK Pajak Aktif",
        fileUrl: "/images/cars/innova/stnk_bpkb.jpg",
      },
    ],
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // UNIT 2: Honda Brio RS CVT 2022 (READY_FOR_SALE)
  // ─────────────────────────────────────────────────────────────────────────────
  const brio = await prisma.vehicle.create({
    data: {
      plateNumber: "AG 1455 XY",
      brand: "Honda",
      model: "Brio RS 1.2 Urbanite CVT",
      year: 2022,
      color: "Kuning Karnaval (Carnival Yellow)",
      odometer: 28000,
      transmission: "CVT",
      engineCapacity: 1199,
      sourceType: "DIRECT_BUY",
      purchasePrice: new Decimal(155000000),
      purchaseDate: new Date("2026-08-28"),
      targetSellingPrice: new Decimal(178000000),
      minSellingPrice: new Decimal(172000000),
      status: "READY_FOR_SALE",
      currentLocation: "Garasi Utama - Display Depan",
      taxExpiryDate: new Date("2027-02-14"),
      stnkStatus: "READY",
      bpkbStatus: "READY",
      bpkbLeadDays: 0,
      youtubeVideoId: null,
      chassisNumber: "MRHDD1850NJ310455",
      engineNumber: "L12B1854912",
      fuelType: "BENSIN",
      driveType: "4x2 FWD",
      notes: "Tangan pertama dari baru, service record Honda resmi, body mulus terawat.",
    },
  });

  await prisma.expense.createMany({
    data: [
      {
        vehicleId: brio.id,
        category: "BODY_PAINT",
        amount: new Decimal(800000),
        notes: "Spet halus spakbor depan kiri baret keluar garasi",
        createdBy: admin.authUserId,
      },
      {
        vehicleId: brio.id,
        category: "DETAILING_SALON",
        amount: new Decimal(700000),
        notes: "Cuci interior + salon ruang mesin",
        createdBy: admin.authUserId,
      },
    ],
  });

  const inspectionBrio = await prisma.inspection.create({
    data: {
      vehicleId: brio.id,
      version: 1,
      isCurrent: true,
      stage: "FINAL_LISTING",
      engineGrade: "A",
      interiorGrade: "A",
      exteriorGrade: "B",
      frameGrade: "A",
      accidentHistory: false,
      floodHistory: false,
      engineNotes: "Mesin 1.2 i-VTEC sangat halus, tarikan responsif, oli mesin bersih.",
      interiorNotes: "Interior RS hitam dengan aksen oranye, tombol setir berfungsi semua.",
      exteriorNotes: "Spakbor depan kiri pernah cat ulang spet tipis, ada dempul spot kecil pintu belakang kanan.",
      inspectedBy: "Bambang (Inspektor Utama Nur Mobil)",
    },
  });

  for (const panelType of panelTypes) {
    const isRoof = panelType === "ROOF";
    let pRight = 98;
    let pCenter = 100;
    let pLeft = 102;
    let pExtra = isRoof ? 100 : null;
    let thickness = 100;
    let condition = "ORIGINAL";
    let defectCode = "✓";
    let notes = "Cat original pabrik normal.";

    if (panelType === "FENDER_FRONT_LEFT") {
      pRight = 165;
      pCenter = 175;
      pLeft = 185;
      thickness = 175;
      condition = "REPAINTED";
      defectCode = "D";
      notes = "Pernah cat ulang spet tipis (R: 165, C: 175, L: 185 µm) karena baret pagar rumah. Tulang apron dalam aman utuh.";
    } else if (panelType === "REAR_DOOR_RIGHT") {
      pRight = 195;
      pCenter = 215;
      pLeft = 265;
      thickness = 225;
      condition = "DENTED_SCRATCHED";
      defectCode = "P";
      notes = "Ada dempul spot (R: 195, C: 215, L: 265 µm, Delta 70 µm) bekas lesung pipit tersenggol motor di parkiran.";
    } else {
      thickness = Math.round((pRight + pCenter + pLeft + (pExtra || 0)) / (isRoof ? 4 : 3));
    }

    await prisma.inspectionPanel.create({
      data: {
        inspectionId: inspectionBrio.id,
        panelType,
        pointRight: pRight,
        pointCenter: pCenter,
        pointLeft: pLeft,
        pointExtra: pExtra,
        paintThickness: thickness,
        condition: condition as any,
        defectCode,
        notes,
      },
    });
  }

  await prisma.vehiclePhoto.createMany({
    data: [
      {
        vehicleId: brio.id,
        inspectionId: inspectionBrio.id,
        category: "FINAL_LISTING",
        tag: "FRONT_3_4",
        title: "Tampak Depan (Front 3/4 RS Sporty)",
        fileUrl: "/images/cars/brio/front.jpg",
      },
      {
        vehicleId: brio.id,
        inspectionId: inspectionBrio.id,
        category: "FINAL_LISTING",
        tag: "REAR_3_4",
        title: "Tampak Belakang (Rear 3/4 & Spoiler RS)",
        fileUrl: "/images/cars/brio/rear.jpg",
      },
      {
        vehicleId: brio.id,
        inspectionId: inspectionBrio.id,
        category: "CONDITION_INTAKE",
        tag: "ENGINE_BAY",
        title: "Ruang Mesin 1.2 i-VTEC Kering Total",
        fileUrl: "/images/cars/brio/engine.jpg",
      },
      {
        vehicleId: brio.id,
        inspectionId: inspectionBrio.id,
        category: "CONDITION_INTAKE",
        tag: "DOOR_SEALER",
        title: "Sealer Pintu Utuh & Spakbor Kiri (Bekas Spet Halus)",
        fileUrl: "/images/cars/brio/door_sealer.jpg",
      },
      {
        vehicleId: brio.id,
        inspectionId: inspectionBrio.id,
        category: "CONDITION_INTAKE",
        tag: "UNDER_DASHBOARD",
        title: "Kolong Dasbor & Pedal Gas/Rem (Bebas Lumpur Banjir)",
        fileUrl: "/images/cars/brio/under_dashboard.jpg",
      },
      {
        vehicleId: brio.id,
        inspectionId: inspectionBrio.id,
        category: "FINAL_LISTING",
        tag: "INTERIOR_DASHBOARD",
        title: "Interior RS Sporty & Panel AC Digital",
        fileUrl: "/images/cars/brio/interior.jpg",
      },
    ],
  });

  await prisma.vehicleInvestment.createMany({
    data: [
      {
        vehicleId: brio.id,
        investorId: ibuInvestor.id,
        capitalShare: new Decimal(100000000),
        profitSharePercent: new Decimal(0),
      },
      {
        vehicleId: brio.id,
        investorId: pakBudi.id,
        capitalShare: new Decimal(55000000),
        profitSharePercent: new Decimal(50.0),
      },
    ],
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // UNIT 3: Mitsubishi Xpander Ultimate 1.5 AT 2020 (READY_FOR_SALE)
  // ─────────────────────────────────────────────────────────────────────────────
  const xpander = await prisma.vehicle.create({
    data: {
      plateNumber: "W 1934 QZ",
      brand: "Mitsubishi",
      model: "Xpander Ultimate 1.5 AT",
      year: 2020,
      color: "Putih Mutiara (Quartz White Pearl)",
      odometer: 36200,
      transmission: "AUTOMATIC",
      engineCapacity: 1499,
      sourceType: "DIRECT_BUY",
      purchasePrice: new Decimal(198000000),
      purchaseDate: new Date("2026-09-02"),
      targetSellingPrice: new Decimal(228000000),
      minSellingPrice: new Decimal(220000000),
      status: "READY_FOR_SALE",
      currentLocation: "Garasi Utama - Blok B1",
      taxExpiryDate: new Date("2027-01-18"),
      stnkStatus: "READY",
      bpkbStatus: "READY",
      bpkbLeadDays: 0,
      chassisNumber: "MK2NC1W1LLJ041289",
      engineNumber: "4A91E14923",
      fuelType: "BENSIN",
      driveType: "4x2 FWD",
      notes: "Tipe tertinggi Ultimate, cruise control aktif, jok kulit sintetis rapi, bebas banjir.",
    },
  });

  await prisma.expense.createMany({
    data: [
      {
        vehicleId: xpander.id,
        category: "DETAILING_SALON",
        amount: new Decimal(950000),
        notes: "Poles bodi exterior + pembersihan jok interior",
        createdBy: admin.authUserId,
      },
    ],
  });

  const inspectionXpander = await prisma.inspection.create({
    data: {
      vehicleId: xpander.id,
      version: 1,
      isCurrent: true,
      stage: "FINAL_LISTING",
      engineGrade: "A",
      interiorGrade: "A",
      exteriorGrade: "A",
      frameGrade: "A",
      accidentHistory: false,
      floodHistory: false,
      engineNotes: "Mesin 4A91 MIVEC responsif halus, matic konvensional 4-speed sangat responsif.",
      interiorNotes: "Interior Ultimate bernuansa beige bersih wangi, head unit touch screen normal.",
      exteriorNotes: "Cat original terawat, hanya pintu bagasi pernah spet tipis pernis pabrik.",
      inspectedBy: "Bambang (Inspektor Utama Nur Mobil)",
    },
  });

  for (const panelType of panelTypes) {
    const isRoof = panelType === "ROOF";
    let pRight = 108;
    let pCenter = 112;
    let pLeft = 110;
    let pExtra = isRoof ? 109 : null;
    let thickness = 110;
    let condition = "ORIGINAL";
    let defectCode = "✓";
    let notes = "Cat original pabrik presisi.";

    if (panelType === "TRUNK_LID") {
      pRight = 145;
      pCenter = 155;
      pLeft = 150;
      thickness = 150;
      condition = "REPAINTED";
      defectCode = "U";
      notes = "Pernah cat ulang spet tipis (R: 145, C: 155, L: 150 µm, Delta 10 µm merata tanpa belang).";
    }

    await prisma.inspectionPanel.create({
      data: {
        inspectionId: inspectionXpander.id,
        panelType,
        pointRight: pRight,
        pointCenter: pCenter,
        pointLeft: pLeft,
        pointExtra: pExtra,
        paintThickness: thickness,
        condition: condition as any,
        defectCode,
        notes,
      },
    });
  }

  await prisma.vehiclePhoto.createMany({
    data: [
      {
        vehicleId: xpander.id,
        inspectionId: inspectionXpander.id,
        category: "FINAL_LISTING",
        tag: "FRONT_3_4",
        title: "Tampak Depan (Dynamic Shield Grille)",
        fileUrl: "/images/cars/xpander/front.jpg",
      },
      {
        vehicleId: xpander.id,
        inspectionId: inspectionXpander.id,
        category: "FINAL_LISTING",
        tag: "REAR_3_4",
        title: "Tampak Belakang (L-Shaped LED Taillights)",
        fileUrl: "/images/cars/xpander/rear.jpg",
      },
      {
        vehicleId: xpander.id,
        inspectionId: inspectionXpander.id,
        category: "FINAL_LISTING",
        tag: "INTERIOR_DASHBOARD",
        title: "Interior Kemudi & Dashboard Beige Premium",
        fileUrl: "/images/cars/xpander/interior.jpg",
      },
    ],
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // UNIT 4: Toyota Avanza 1.5 G CVT 2022 (BOOKED - Menampilkan Status Booking)
  // ─────────────────────────────────────────────────────────────────────────────
  const avanza = await prisma.vehicle.create({
    data: {
      plateNumber: "L 1092 EF",
      brand: "Toyota",
      model: "Avanza 1.5 G CVT TSS",
      year: 2022,
      color: "Silver Mica Metallic",
      odometer: 19800,
      transmission: "CVT",
      engineCapacity: 1496,
      sourceType: "DIRECT_BUY",
      purchasePrice: new Decimal(205000000),
      purchaseDate: new Date("2026-09-10"),
      targetSellingPrice: new Decimal(235000000),
      minSellingPrice: new Decimal(228000000),
      status: "BOOKED",
      currentLocation: "Garasi Utama - Blok A2",
      taxExpiryDate: new Date("2027-05-12"),
      stnkStatus: "READY",
      bpkbStatus: "READY",
      bpkbLeadDays: 0,
      chassisNumber: "MHFM6BA34NK019823",
      engineNumber: "2NR-VE99412",
      fuelType: "BENSIN",
      driveType: "4x2 FWD",
      notes: "Sudah di-booking pelanggan dari Malang dengan tanda jadi DP Rp 5.000.000.",
    },
  });

  const inspectionAvanza = await prisma.inspection.create({
    data: {
      vehicleId: avanza.id,
      version: 1,
      isCurrent: true,
      stage: "FINAL_LISTING",
      engineGrade: "A",
      interiorGrade: "A",
      exteriorGrade: "A",
      frameGrade: "A",
      accidentHistory: false,
      floodHistory: false,
      engineNotes: "Mesin Dual VVT-i 2NR-VE sangat hening, transmisi D-CVT mulus tanpa hentakan.",
      interiorNotes: "Kondisi seperti baru keluar showroom, bau mobil baru masih terasa, jok fabric mulus.",
      exteriorNotes: "100% cat asli pabrik tanpa spet ulang, velg alloy 16 inch utuh tanpa baret trotoar.",
      inspectedBy: "Bambang (Inspektor Utama Nur Mobil)",
    },
  });

  for (const panelType of panelTypes) {
    const isRoof = panelType === "ROOF";
    const pRight = 104;
    const pCenter = 106;
    const pLeft = 105;
    const pExtra = isRoof ? 104 : null;
    const avg = 105;

    await prisma.inspectionPanel.create({
      data: {
        inspectionId: inspectionAvanza.id,
        panelType,
        pointRight: pRight,
        pointCenter: pCenter,
        pointLeft: pLeft,
        pointExtra: pExtra,
        paintThickness: avg,
        condition: "ORIGINAL",
        defectCode: "✓",
        notes: "Cat original pabrik 100% utuh tanpa bekas bongkar.",
      },
    });
  }

  await prisma.vehiclePhoto.createMany({
    data: [
      {
        vehicleId: avanza.id,
        inspectionId: inspectionAvanza.id,
        category: "FINAL_LISTING",
        tag: "FRONT_3_4",
        title: "Tampak Depan All New Avanza 1.5 G",
        fileUrl: "/images/cars/avanza/front.jpg",
      },
      {
        vehicleId: avanza.id,
        inspectionId: inspectionAvanza.id,
        category: "FINAL_LISTING",
        tag: "REAR_3_4",
        title: "Tampak Belakang All New Avanza 1.5 G",
        fileUrl: "/images/cars/avanza/rear.jpg",
      },
    ],
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // UNIT 5: Daihatsu Gran Max Pick Up 1.5 AC PS 2021 (READY_FOR_SALE - Niaga)
  // ─────────────────────────────────────────────────────────────────────────────
  const granmax = await prisma.vehicle.create({
    data: {
      plateNumber: "N 8821 CD",
      brand: "Daihatsu",
      model: "Gran Max Pick Up 1.5 AC PS",
      year: 2021,
      color: "Putih (Ultra White)",
      odometer: 42000,
      transmission: "MANUAL",
      engineCapacity: 1495,
      sourceType: "DIRECT_BUY",
      purchasePrice: new Decimal(95000000),
      purchaseDate: new Date("2026-09-12"),
      targetSellingPrice: new Decimal(115000000),
      minSellingPrice: new Decimal(110000000),
      status: "READY_FOR_SALE",
      currentLocation: "Garasi Niaga - Blok C",
      taxExpiryDate: new Date("2026-11-20"),
      stnkStatus: "READY",
      bpkbStatus: "READY",
      bpkbLeadDays: 0,
      chassisNumber: "MHKP3170NJ039124",
      engineNumber: "3SZ-VE18320",
      fuelType: "BENSIN",
      driveType: "4x2 RWD",
      notes: "Sudah dilengkapi AC dingin & Power Steering, bak 3-way lempeng, siap pakai cari uang.",
    },
  });

  const inspectionGranMax = await prisma.inspection.create({
    data: {
      vehicleId: granmax.id,
      version: 1,
      isCurrent: true,
      stage: "FINAL_LISTING",
      engineGrade: "B",
      interiorGrade: "B",
      exteriorGrade: "B",
      frameGrade: "A",
      accidentHistory: false,
      floodHistory: false,
      engineNotes: "Mesin 1.5L 3SZ-VE sehat bertenaga, kopling empuk, AC dingin.",
      interiorNotes: "Jok vinyl bersih tanpa sobek, dashboard utuh, power steering enteng.",
      exteriorNotes: "Bodi kepala original tipis khas niaga, bak ada baret pemakaian wajar.",
      inspectedBy: "Bambang (Inspektor Utama Nur Mobil)",
    },
  });

  for (const panelType of panelTypes) {
    const isRoof = panelType === "ROOF";
    let pRight = 82;
    let pCenter = 85;
    let pLeft = 84;
    let pExtra = isRoof ? 83 : null;
    let thickness = 84;
    let condition = "ORIGINAL";
    let defectCode = "✓";
    let notes = "Cat fungsional khas kendaraan niaga tipis terawat.";

    if (panelType === "TRUNK_LID") {
      condition = "DENTED_SCRATCHED";
      defectCode = "B";
      notes = "Pintu bak belakang ada goresan lecet pemakaian muatan logistik ringan.";
    }

    await prisma.inspectionPanel.create({
      data: {
        inspectionId: inspectionGranMax.id,
        panelType,
        pointRight: pRight,
        pointCenter: pCenter,
        pointLeft: pLeft,
        pointExtra: pExtra,
        paintThickness: thickness,
        condition: condition as any,
        defectCode,
        notes,
      },
    });
  }

  await prisma.vehiclePhoto.createMany({
    data: [
      {
        vehicleId: granmax.id,
        inspectionId: inspectionGranMax.id,
        category: "FINAL_LISTING",
        tag: "FRONT_3_4",
        title: "Tampak Depan Kepala Gran Max Pick Up",
        fileUrl: "/images/cars/granmax/front.jpg",
      },
      {
        vehicleId: granmax.id,
        inspectionId: inspectionGranMax.id,
        category: "FINAL_LISTING",
        tag: "REAR_3_4",
        title: "Tampak Samping & Bak Kargo Gran Max",
        fileUrl: "/images/cars/granmax/rear.jpg",
      },
    ],
  });

  
  // ─────────────────────────────────────────────────────────────────────────────
  // PEMBELI (BUYERS) UNTUK TRACK RECORD TERJUAL
  // ─────────────────────────────────────────────────────────────────────────────
  const buyerHajiSamsul = await prisma.buyer.upsert({
    where: { id: "buyer-haji-samsul" },
    update: {},
    create: {
      id: "buyer-haji-samsul",
      name: "H. Samsul Arifin",
      phone: "081234998811",
      address: "Kepanjen, Malang, Jawa Timur",
    },
  });

  const buyerMasWahyu = await prisma.buyer.upsert({
    where: { id: "buyer-mas-wahyu" },
    update: {},
    create: {
      id: "buyer-mas-wahyu",
      name: "Wahyu Pratama, S.T.",
      phone: "085678112233",
      address: "Sananwetan, Blitar, Jawa Timur",
    },
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // UNIT 6: Honda Jazz RS GK5 CVT 2019 (SOLD - Terjual ke Malang)
  // ─────────────────────────────────────────────────────────────────────────────
  const jazz = await prisma.vehicle.create({
    data: {
      plateNumber: "N 1420 AB",
      brand: "Honda",
      model: "Jazz RS 1.5 GK5 CVT",
      year: 2019,
      color: "Modern Steel Metallic",
      odometer: 39000,
      transmission: "CVT",
      engineCapacity: 1497,
      sourceType: "DIRECT_BUY",
      purchasePrice: new Decimal(190000000),
      purchaseDate: new Date("2026-08-01"),
      targetSellingPrice: new Decimal(215000000),
      minSellingPrice: new Decimal(208000000),
      status: "SOLD_SETTLED",
      currentLocation: "Terjual - Serah Terima",
      taxExpiryDate: new Date("2027-03-10"),
      stnkStatus: "READY",
      bpkbStatus: "READY",
      bpkbLeadDays: 0,
      fuelType: "BENSIN",
      driveType: "4x2 FWD",
      notes: "Terjual dalam 12 hari ke H. Samsul (Malang). Bebas laka & bebas banjir.",
    },
  });

  await prisma.vehiclePhoto.createMany({
    data: [
      {
        vehicleId: jazz.id,
        category: "FINAL_LISTING",
        tag: "FRONT_3_4",
        title: "Tampak Depan Honda Jazz RS GK5",
        fileUrl: "/images/cars/jazz/front.jpg",
      },
    ],
  });

  const saleJazz = await prisma.sale.create({
    data: {
      vehicleId: jazz.id,
      saleDate: new Date("2026-08-14"),
      saleType: "SHOWROOM",
      buyerId: buyerHajiSamsul.id,
      sellingPrice: new Decimal(215000000),
    },
  });

  await prisma.salePayment.create({
    data: {
      saleId: saleJazz.id,
      amount: new Decimal(215000000),
      method: "BANK_TRANSFER",
      paidAt: new Date("2026-08-14"),
      notes: "Pelunasan transfer BCA serah terima unit di showroom",
      recordedBy: admin.authUserId,
    },
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // UNIT 7: Toyota Calya 1.2 G MT 2021 (SOLD - Terjual ke Blitar)
  // ─────────────────────────────────────────────────────────────────────────────
  const calya = await prisma.vehicle.create({
    data: {
      plateNumber: "AG 1892 RD",
      brand: "Toyota",
      model: "Calya 1.2 G MT",
      year: 2021,
      color: "Putih",
      odometer: 32000,
      transmission: "MANUAL",
      engineCapacity: 1197,
      sourceType: "DIRECT_BUY",
      purchasePrice: new Decimal(112000000),
      purchaseDate: new Date("2026-08-20"),
      targetSellingPrice: new Decimal(126000000),
      minSellingPrice: new Decimal(122000000),
      status: "SOLD_SETTLED",
      currentLocation: "Terjual - Serah Terima",
      taxExpiryDate: new Date("2027-06-15"),
      stnkStatus: "READY",
      bpkbStatus: "READY",
      bpkbLeadDays: 0,
      fuelType: "BENSIN",
      driveType: "4x2 FWD",
      notes: "Terjual dalam 9 hari ke Mas Wahyu (Blitar). 100% orisinil pabrik.",
    },
  });

  await prisma.vehiclePhoto.createMany({
    data: [
      {
        vehicleId: calya.id,
        category: "FINAL_LISTING",
        tag: "FRONT_3_4",
        title: "Tampak Depan Toyota Calya 1.2 G",
        fileUrl: "/images/cars/calya/front.jpg",
      },
    ],
  });

  const saleCalya = await prisma.sale.create({
    data: {
      vehicleId: calya.id,
      saleDate: new Date("2026-08-29"),
      saleType: "SHOWROOM",
      buyerId: buyerMasWahyu.id,
      sellingPrice: new Decimal(126000000),
    },
  });

  await prisma.salePayment.create({
    data: {
      saleId: saleCalya.id,
      amount: new Decimal(126000000),
      method: "BANK_TRANSFER",
      paidAt: new Date("2026-08-29"),
      notes: "Pelunasan transfer Mandiri lunas",
      recordedBy: admin.authUserId,
    },
  });

  // 8. Seed Aset Tetap Showroom (Peralatan & Fasilitas Kerja)
  await prisma.showroomAsset.deleteMany({});
  await prisma.showroomAsset.createMany({
    data: [
      {
        name: "Digital Paint Thickness Gauge (Alat Uji Mikron Cat 34 Titik)",
        category: "INSPECTION_TOOLS",
        purchaseDate: new Date("2025-11-15"),
        purchaseCost: new Decimal(3850000),
        currentValue: new Decimal(3500000),
        condition: "EXCELLENT",
        location: "Koper Inspeksi / Meja Admin",
        notes: "Sensor mikron presisi tinggi kalibrasi ganda (besi/aluminium) standar IBID Astra.",
      },
      {
        name: "Mesin Poles Dual Action Shinemate EX620 & Pad Set",
        category: "WORKSHOP_EQUIPMENT",
        purchaseDate: new Date("2025-08-20"),
        purchaseCost: new Decimal(3200000),
        currentValue: new Decimal(2700000),
        condition: "GOOD",
        location: "Area Salon & Detailing",
        notes: "Dipakai untuk koreksi cat ringan dan waxing unit ready.",
      },
      {
        name: "Scanner OBD2 Otomatis Thinkdiag Bluetooth Diagnostic",
        category: "INSPECTION_TOOLS",
        purchaseDate: new Date("2026-01-10"),
        purchaseCost: new Decimal(2400000),
        currentValue: new Decimal(2200000),
        condition: "EXCELLENT",
        location: "Koper Inspeksi",
        notes: "Scan riwayat DTC transmisi matik, sensor ABS, dan riwayat airbag.",
      },
      {
        name: "Kompresor Angin Lakoni Imola 125 (1 HP)",
        category: "WORKSHOP_EQUIPMENT",
        purchaseDate: new Date("2025-06-12"),
        purchaseCost: new Decimal(1650000),
        currentValue: new Decimal(1300000),
        condition: "GOOD",
        location: "Garasi Belakang",
        notes: "Untuk cuci mesin, tiup debu interior, dan isi angin ban.",
      },
      {
        name: "Neon Box & Plang Nama Showroom 'Nur Mobil' (3x1.2 Meter)",
        category: "FACILITY_FURNITURE",
        purchaseDate: new Date("2025-03-05"),
        purchaseCost: new Decimal(5500000),
        currentValue: new Decimal(4800000),
        condition: "EXCELLENT",
        location: "Depan Pintu Gerbang Garasi Showroom",
        notes: "Plang nama resmi dengan lampu LED hemat energi.",
      },
      {
        name: "Dongkrak Buaya 3 Ton & 4 Jack Stand Tekiro",
        category: "INSPECTION_TOOLS",
        purchaseDate: new Date("2025-07-18"),
        purchaseCost: new Decimal(2100000),
        currentValue: new Decimal(1850000),
        condition: "GOOD",
        location: "Garasi Kolong Inspeksi",
        notes: "Pemeriksaan kolong sasis, apron depan, dan kebocoran oli.",
      },
      {
        name: "Laptop Kasir Lenovo & Printer Kuitansi Thermal",
        category: "OFFICE_ELECTRONICS",
        purchaseDate: new Date("2025-09-02"),
        purchaseCost: new Decimal(6200000),
        currentValue: new Decimal(5100000),
        condition: "GOOD",
        location: "Meja Kasir & Administrasi",
        notes: "Digunakan admin untuk cetak faktur, kuitansi, dan surat jalan.",
      },
      {
        name: "Motor Operasional Honda Beat 2019 (Plat N)",
        category: "OPERATIONAL_VEHICLE",
        purchaseDate: new Date("2025-05-14"),
        purchaseCost: new Decimal(11500000),
        currentValue: new Decimal(10500000),
        condition: "GOOD",
        location: "Garasi Utama",
        notes: "Kendaraan kurir antar-jemput berkas Samsat & cek fisik BPKB.",
      },
    ],
  });

  // 9. Seed Beban Operasional Showroom (OPEX)
  await prisma.operationalExpense.deleteMany({});
  await prisma.operationalExpense.createMany({
    data: [
      {
        category: "RENT_SHOWROOM",
        recipient: "H. Ridwan (Pemilik Lahan)",
        amount: new Decimal(3500000),
        date: new Date("2026-09-01"),
        notes: "Sewa lahan display dan garasi showroom bulan September 2026",
        createdBy: admin.authUserId,
      },
      {
        category: "UTILITIES_WIFI",
        recipient: "PLN & Telkom IndiHome",
        amount: new Decimal(650000),
        date: new Date("2026-09-05"),
        notes: "Token listrik display malam 450rb + WiFi IndiHome 200rb",
        createdBy: admin.authUserId,
      },
      {
        category: "MARKETING_ADS",
        recipient: "OLX Autos & Facebook Ads",
        amount: new Decimal(450000),
        date: new Date("2026-09-10"),
        notes: "Sundul iklan Innova Reborn & Brio Urbanite paket 30 hari",
        createdBy: admin.authUserId,
      },
      {
        category: "CONSUMPTION_GUEST",
        recipient: "Minimarket Barokah",
        amount: new Decimal(200000),
        date: new Date("2026-09-12"),
        notes: "Kopi kapal api, teh botol, air mineral galon untuk tamu",
        createdBy: admin.authUserId,
      },
    ],
  });

  // 10. Seed Contoh Prive (Penarikan Pribadi Owner dari BCA)
  const existingDraws = await prisma.cashTransaction.findMany({
    where: { type: "OUT_OWNER_DRAW" },
  });
  if (existingDraws.length === 0) {
    const latestCash = await prisma.cashTransaction.findFirst({
      orderBy: { createdAt: "desc" },
    });
    const curBal = latestCash ? new Decimal(latestCash.runningBalance.toString()) : new Decimal(100000000);

    const draw1 = new Decimal(4500000);
    const balAfter1 = curBal.minus(draw1);
    await prisma.cashTransaction.create({
      data: {
        type: "OUT_OWNER_DRAW",
        amount: draw1,
        runningBalance: balAfter1,
        notes: "Prive Pribadi Owner: Belanja bulanan keluarga & keperluan rumah tangga (Tarik tunai ATM BCA)",
        createdBy: admin.authUserId,
      },
    });

    const draw2 = new Decimal(1200000);
    const balAfter2 = balAfter1.minus(draw2);
    await prisma.cashTransaction.create({
      data: {
        type: "OUT_OWNER_DRAW",
        amount: draw2,
        runningBalance: balAfter2,
        notes: "Prive Pribadi Owner: Pembayaran SPP sekolah anak (Transfer m-BCA)",
        createdBy: admin.authUserId,
      },
    });
  }

  console.log("✓ 7 Unit Kendaraan Realistis (Ready & Sold) berhasil di-seed:");
  console.log(`  1. Toyota Innova Reborn Diesel 2021 (${innova.plateNumber}) - Ready`);
  console.log(`  2. Honda Brio RS Urbanite 2022 (${brio.plateNumber}) - Ready`);
  console.log(`  3. Mitsubishi Xpander Ultimate 2020 (${xpander.plateNumber}) - Ready`);
  console.log(`  4. Toyota Avanza 1.5 G CVT 2022 (${avanza.plateNumber}) - Booked`);
  console.log(`  5. Daihatsu Gran Max Pick Up 2021 (${granmax.plateNumber}) - Ready`);
  console.log("✓ 8 Aset Tetap Showroom (Peralatan & Fasilitas) berhasil di-seed.");
  console.log("✓ Pengeluaran Operasional Showroom & Prive Owner berhasil di-seed.");
  console.log("Seeding selesai!");
}

main()
  .catch((e) => {
    console.error("Gagal menjalankan seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
