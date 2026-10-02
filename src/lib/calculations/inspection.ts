export type PaintMicronCategory = "ORIGINAL" | "REPAINT" | "THICK_FILLER";

export type BrandGroup =
  | "JAPANESE"
  | "CHINESE"
  | "EUROPEAN"
  | "KOREAN"
  | "AMERICAN"
  | "COMMERCIAL"
  | "DEFAULT";

export interface BrandPaintCalibration {
  brandGroup: BrandGroup;
  brandGroupName: string;
  originalMax: number;   // Batas atas toleransi cat original pabrik
  repaintMax: number;    // Batas atas cat ulang / spet (di atas ini indikasi dempul tebal)
  typicalRange: string;  // Rentang normal pabrik saat keluar dealer
  notes: string;
}

export type BodyType = "HATCHBACK" | "MPV_SUV" | "SEDAN" | "PICKUP";

/**
 * Basis Kalibrasi Ketebalan Cat Otomotif berdasarkan Standar Konsensus Industri
 * Inspeksi Mobil Bekas (IBID Astra, JBA, Otospector, dan kalibrasi Paint Depth Gauge Elcometer/DeFelsko).
 */
export function getBrandPaintStandard(brand?: string | null): BrandPaintCalibration {
  if (!brand) {
    return {
      brandGroup: "DEFAULT",
      brandGroupName: "Standar Acuan Umum",
      originalMax: 120,
      repaintMax: 200,
      typicalRange: "80 – 120 µm",
      notes: "Standar umum inspeksi mobil penumpang di Indonesia.",
    };
  }

  const b = brand.trim().toLowerCase();

  // Pabrikan China (Wuling, Chery, DFSK, BYD, MG, Geely)
  // Karakteristik: Pelapisan elektroforesis, primer surfacer, dan clear coat relatif tebal (115 - 160 µm)
  if (
    b.includes("wuling") ||
    b.includes("chery") ||
    b.includes("dfsk") ||
    b.includes("byd") ||
    b.includes("mg") ||
    b.includes("morris") ||
    b.includes("geely") ||
    b.includes("haval") ||
    b.includes("ora")
  ) {
    return {
      brandGroup: "CHINESE",
      brandGroupName: "Pabrikan China / Wuling & Chery",
      originalMax: 160,
      repaintMax: 240,
      typicalRange: "115 – 160 µm",
      notes: "Pabrik SGMW Cikarang / Chery menerapkan lapisan primer dan clear coat tebal dari lini robotik.",
    };
  }

  // Pabrikan Eropa (BMW, Mercedes-Benz, Audi, Volkswagen, Volvo, Porsche, Peugeot, Renault)
  // Karakteristik: Cat electro-coating tebal dengan proteksi iklim ekstrem (120 - 165 µm)
  if (
    b.includes("bmw") ||
    b.includes("mercedes") ||
    b.includes("benz") ||
    b.includes("audi") ||
    b.includes("volkswagen") ||
    b.includes("vw") ||
    b.includes("volvo") ||
    b.includes("porsche") ||
    b.includes("peugeot") ||
    b.includes("renault") ||
    b.includes("mini")
  ) {
    return {
      brandGroup: "EUROPEAN",
      brandGroupName: "Pabrikan Eropa (BMW, Mercedes, VW)",
      originalMax: 165,
      repaintMax: 240,
      typicalRange: "120 – 165 µm",
      notes: "Standar proteksi anti-korosi electro-deposition & clear coat tebal regulasi Eropa.",
    };
  }

  // Pabrikan Amerika (Ford, Chevrolet, Jeep)
  if (b.includes("ford") || b.includes("chevrolet") || b.includes("jeep") || b.includes("dodge")) {
    return {
      brandGroup: "AMERICAN",
      brandGroupName: "Pabrikan Amerika (Ford, Chevrolet)",
      originalMax: 150,
      repaintMax: 225,
      typicalRange: "105 – 150 µm",
      notes: "Standar ketebalan pabrik perakitan US OEM.",
    };
  }

  // Pabrikan Korea (Hyundai, Kia)
  if (b.includes("hyundai") || b.includes("kia")) {
    return {
      brandGroup: "KOREAN",
      brandGroupName: "Pabrikan Korea (Hyundai, Kia)",
      originalMax: 135,
      repaintMax: 210,
      typicalRange: "95 – 135 µm",
      notes: "Standar robotik pengecatan pabrik HMC/KMC modern.",
    };
  }

  // Kendaraan Niaga / Komersial / Pick-up (GranMax, Carry, L300, Traga)
  // Sering kali menggunakan single-stage atau lapisan lebih tipis
  if (
    b.includes("carry") ||
    b.includes("granmax") ||
    b.includes("gran max") ||
    b.includes("l300") ||
    b.includes("traga") ||
    b.includes("tata")
  ) {
    return {
      brandGroup: "COMMERCIAL",
      brandGroupName: "Kendaraan Niaga / Pick-up Ringan",
      originalMax: 100,
      repaintMax: 160,
      typicalRange: "65 – 100 µm",
      notes: "Lapisan cat fungsional efisien untuk kendaraan angkutan kerja.",
    };
  }

  // Pabrikan Jepang (Toyota, Honda, Daihatsu, Suzuki, Mitsubishi, Nissan, Mazda, Isuzu, Subaru)
  if (
    b.includes("toyota") ||
    b.includes("honda") ||
    b.includes("daihatsu") ||
    b.includes("suzuki") ||
    b.includes("mitsubishi") ||
    b.includes("nissan") ||
    b.includes("mazda") ||
    b.includes("isuzu") ||
    b.includes("subaru")
  ) {
    return {
      brandGroup: "JAPANESE",
      brandGroupName: "Pabrikan Jepang (Toyota, Honda, Daihatsu, dll)",
      originalMax: 120,
      repaintMax: 200,
      typicalRange: "80 – 120 µm",
      notes: "Standar efisiensi Toyota Production System & OEM Jepang (Honda/Daihatsu 80-105 µm, Toyota 90-120 µm).",
    };
  }

  return {
    brandGroup: "DEFAULT",
    brandGroupName: "Standar Acuan Umum",
    originalMax: 120,
    repaintMax: 200,
    typicalRange: "80 – 120 µm",
    notes: "Standar umum inspeksi mobil penumpang di Indonesia.",
  };
}

/**
 * Menentukan kategori ketebalan cat berdasarkan mikron (µm) dan Brand Kalibrasi.
 * - ORIGINAL: Di bawah batas original pabrik
 * - REPAINT: Antara batas original dan batas dempul
 * - THICK_FILLER: Di atas batas toleransi repaint (terdapat dempul tebal)
 */
export function getPaintMicronCategory(
  microns: number | null | undefined,
  brand?: string | null
): PaintMicronCategory {
  if (microns == null || isNaN(microns)) return "ORIGINAL";
  const cal = getBrandPaintStandard(brand);

  // Jika brand tidak dispesifikasi (default), jaga presisi backward compatible:
  // < 120 = ORIGINAL, 120-200 = REPAINT, > 200 = THICK_FILLER
  if (cal.brandGroup === "DEFAULT" || !brand) {
    if (microns < 120) return "ORIGINAL";
    if (microns <= 200) return "REPAINT";
    return "THICK_FILLER";
  }

  if (microns <= cal.originalMax) return "ORIGINAL";
  if (microns <= cal.repaintMax) return "REPAINT";
  return "THICK_FILLER";
}

/**
 * Deteksi Tipe Bodi Mobil (HATCHBACK, MPV_SUV, SEDAN, PICKUP)
 * untuk adaptasi siluet blueprint dan proporsi bodi inspeksi.
 */
export function detectBodyType(model?: string | null, brand?: string | null): BodyType {
  const text = `${brand || ""} ${model || ""}`.toLowerCase();

  // 1. Pick-up / Bak Terbuka
  if (
    text.includes("pickup") ||
    text.includes("pick up") ||
    text.includes("pick-up") ||
    text.includes("bak") ||
    text.includes("l300") ||
    text.includes("carry") ||
    text.includes("traga") ||
    text.includes("gran max pu") ||
    text.includes("granmax pu") ||
    text.includes("mega carry") ||
    text.includes("hilux single")
  ) {
    return "PICKUP";
  }

  // 2. Hatchback / City Car (Buritan pendek tanpa ekor bagasi)
  if (
    text.includes("brio") ||
    text.includes("yaris") ||
    text.includes("jazz") ||
    text.includes("agya") ||
    text.includes("ayla") ||
    text.includes("sirion") ||
    text.includes("march") ||
    text.includes("swift") ||
    text.includes("baleno") ||
    text.includes("ignis") ||
    text.includes("hatchback") ||
    text.includes("picanto") ||
    text.includes("rio") ||
    text.includes("fiesta") ||
    text.includes("polo") ||
    text.includes("golf") ||
    text.includes("mini cooper") ||
    text.includes("air ev") ||
    text.includes("bingo")
  ) {
    return "HATCHBACK";
  }

  // 3. Sedan (Three-box design: moncong depan dan dek bagasi belakang terpisah)
  if (
    text.includes("sedan") ||
    text.includes("vios") ||
    text.includes("city") ||
    text.includes("corolla") ||
    text.includes("civic") ||
    text.includes("camry") ||
    text.includes("accord") ||
    text.includes("altis") ||
    text.includes("bmw 3") ||
    text.includes("bmw 5") ||
    text.includes("c-class") ||
    text.includes("e-class") ||
    text.includes("c200") ||
    text.includes("e300") ||
    text.includes("mercedes")
  ) {
    return "SEDAN";
  }

  // 4. MPV / SUV / Crossover (Default: Innova, Avanza, Xpander, Fortuner, Pajero, Almaz, Confero, dll)
  return "MPV_SUV";
}

export const PANEL_LABELS: Record<string, string> = {
  HOOD: "Kap Mesin Depan",
  ROOF: "Atap Kendaraan",
  FENDER_FRONT_RIGHT: "Spakbor Depan Kanan",
  FENDER_FRONT_LEFT: "Spakbor Depan Kiri",
  FRONT_DOOR_RIGHT: "Pintu Depan Kanan (Driver)",
  FRONT_DOOR_LEFT: "Pintu Depan Kiri",
  REAR_DOOR_RIGHT: "Pintu Belakang Kanan",
  REAR_DOOR_LEFT: "Pintu Belakang Kiri",
  TRUNK_LID: "Pintu Bagasi Belakang",
  QUARTER_PANEL_RIGHT: "Spakbor Belakang Kanan",
  QUARTER_PANEL_LEFT: "Spakbor Belakang Kiri",
  ROCKER_PANEL_RIGHT: "Rocker Panel / Pijakan Samping Kanan",
  ROCKER_PANEL_LEFT: "Rocker Panel / Pijakan Samping Kiri",
  BUMPER_FRONT: "Bumper Depan & Grille",
  BUMPER_REAR: "Bumper Belakang",
};

export const CONDITION_LABELS: Record<string, string> = {
  ORIGINAL: "Original Pabrik",
  REPAINTED: "Cat Ulang / Spet",
  DENTED_SCRATCHED: "Baret / Lesung Ringan",
  REPLACED: "Penggantian Panel",
  PLASTIC_NORMAL: "Plastik Normal / Utuh",
  PLASTIC_DAMAGED: "Plastik Baret / Renggang / Pecah",
};

export const GRADE_LABELS: Record<string, { label: string; desc: string }> = {
  A: { label: "Grade A", desc: "Istimewa / Sangat Prima" },
  B: { label: "Grade B", desc: "Baik / Standar Pemakaian Wajar" },
  C: { label: "Grade C", desc: "Cukup / Perlu Perbaikan Ringan" },
  D: { label: "Grade D", desc: "Kurang / Bekas Tabrakan Berat / Pr" },
  E: { label: "Grade E", desc: "Buruk / Bekas Laka Parah / Rusak Berat" },
};

/**
 * Kamus Notasi Kode Kerusakan Standar Balai Lelang Otomotif (IBID ACV / JBA / USS)
 */
export const DEFECT_CODES: Record<
  string,
  { code: string; name: string; desc: string; category: "NORMAL" | "SCRATCH" | "DENT" | "COMBO" | "CRACK" | "OTHER" }
> = {
  OK: { code: "✓", name: "Normal / Mulus", desc: "Kondisi fisik utuh tanpa cacat signifikan", category: "NORMAL" },
  A1: { code: "A1", name: "Baret Halus", desc: "Goresan rambut sangat tipis (bisa hilang dipoles)", category: "SCRATCH" },
  A2: { code: "A2", name: "Baret Sedang", desc: "Goresan terlihat jelas, cat tergores tapi belum tembus pelat", category: "SCRATCH" },
  A3: { code: "A3", name: "Baret Dalam", desc: "Goresan dalam / cat terkelupas tembus dasar/pelat", category: "SCRATCH" },
  U1: { code: "U1", name: "Penyok Kecil", desc: "Lesung pipit / lekukan minor tanpa cat pecah", category: "DENT" },
  U2: { code: "U2", name: "Penyok Sedang", desc: "Deformasi bodi terlihat dari jarak 1 meter", category: "DENT" },
  U3: { code: "U3", name: "Penyok Dalam", desc: "Lekukan besar butuh ketok bodi & cat ulang", category: "DENT" },
  AU1: { code: "AU1", name: "Baret & Penyok Kecil", desc: "Kombinasi goresan dan deformasi minor", category: "COMBO" },
  AU2: { code: "AU2", name: "Baret & Penyok Sedang", desc: "Kombinasi goresan dan lekukan cukup lebar", category: "COMBO" },
  Y1: { code: "Y1", name: "Retak / Gap Tipis", desc: "Retak rambut atau celah sambungan renggang tipis", category: "CRACK" },
  Y2: { code: "Y2", name: "Retak / Kancing Lepas", desc: "Retakan sedang / klip kancing bumper kendor", category: "CRACK" },
  Y3: { code: "Y3", name: "Pecah / Gap Parah", desc: "Plastik pecah / gap antar panel renggang lebar", category: "CRACK" },
  B: { code: "B", name: "Modifikasi", desc: "Part variasi / bodykit non-standar pabrik", category: "OTHER" },
  C: { code: "C", name: "Karat Berat", desc: "Oksidasi parah / keropos", category: "OTHER" },
  S: { code: "S", name: "Karat Ringan", desc: "Karat permukaan tipis", category: "OTHER" },
  G: { code: "G", name: "Lemparan Batu", desc: "Stone chip pada kap / kaca / fender", category: "OTHER" },
  P: { code: "P", name: "Pernis Pudar", desc: "Clear coat terkelupas / cat terbakar matahari", category: "OTHER" },
  "0": { code: "0", name: "Bekas Perbaikan", desc: "Pernah dicat ulang / dempul / bekas ketok", category: "OTHER" },
};

export const DAMAGE_LEVELS: Record<number, string> = {
  0: "Bekas Perbaikan",
  1: "Minimal (Halus)",
  2: "Kecil (Tampak Jelas)",
  3: "Sedang (Perlu Repaint / Ketok)",
  4: "Besar (Perlu Ganti Panel)",
};

/**
 * 14 Titik Rangka Kritis Monokok & Sasis Standar IBID ACV (Hal 10)
 */
export const FRAME_CHECKLIST_ITEMS = [
  { id: "BULLHEAD_FRONT", label: "Rangka Depan (Bullhead / Dudukan Radiator)" },
  { id: "INNER_FENDER_FRONT_RIGHT", label: "Panel Dalam Spakbor Depan Kanan (Apron)" },
  { id: "INNER_FENDER_FRONT_LEFT", label: "Panel Dalam Spakbor Depan Kiri (Apron)" },
  { id: "SHOCK_TOWER_RIGHT", label: "Rumah Shockbreaker Depan Kanan (Shock Tower)" },
  { id: "SHOCK_TOWER_LEFT", label: "Rumah Shockbreaker Depan Kiri (Shock Tower)" },
  { id: "PILLAR_A_RIGHT", label: "Pilar Depan Kanan (Pilar A)" },
  { id: "PILLAR_A_LEFT", label: "Pilar Depan Kiri (Pilar A)" },
  { id: "PILLAR_B_RIGHT", label: "Pilar Tengah Kanan (Pilar B)" },
  { id: "PILLAR_B_LEFT", label: "Pilar Tengah Kiri (Pilar B)" },
  { id: "UNDERBODY_FLOOR", label: "Rangka Tengah Bawah (Lantai Kolong Sasis)" },
  { id: "REAR_FRAME_TRUNK", label: "Rangka Belakang & Dudukan Bagasi" },
  { id: "SPARE_TIRE_WELL", label: "Dudukan / Box Ban Cadangan (Bagasi Bawah)" },
  { id: "REAR_SIDE_MEMBER_RIGHT", label: "Sasis Belakang Kanan (Rear Member)" },
  { id: "REAR_SIDE_MEMBER_LEFT", label: "Sasis Belakang Kiri (Rear Member)" },
] as const;

/**
 * Syarat & Ketentuan Penyangkalan Hukum Resmi (Legal Disclaimer ala IBID Astra)
 */
export const INSPECTION_LEGAL_DISCLAIMER = {
  title: "Syarat, Ketentuan & Batasan Tanggung Jawab Inspeksi",
  lastUpdated: "2026",
  points: [
    {
      num: 1,
      title: "Sifat Laporan sebagai Panduan Informasi",
      text: "Seluruh data hasil inspeksi, pengujian ketebalan mikron cat digital, pemetaan visual bodi, dan penentuan Grade yang tercantum diterbitkan semata-mata sebagai panduan informasi dan sarana transparansi awal. Penilaian ini didasarkan pada metode serta standar internal tim teknis Nur Mobil pada saat tanggal inspeksi dilakukan. Pembeli memahami bahwa pihak ketiga, bengkel independen, atau penilai lain dapat memiliki metode, alat kalibrasi, dan interpretasi yang berbeda.",
    },
    {
      num: 2,
      title: "Bukan Dasar Klaim Fisik atau Tuntutan Ganti Rugi",
      text: "Hasil inspeksi ini bukan merupakan jaminan/garansi mutlak atas keausan komponen di masa mendatang dan tidak dapat dijadikan dasar gugatan, tuntutan hukum, atau klaim ganti rugi fisik dalam bentuk apa pun terhadap Nur Mobil.",
    },
    {
      num: 3,
      title: "Kesempatan Pengecekan Mandiri Sebelum Transaksi",
      text: "Pembeli mengakui telah menerima informasi yang transparan dan telah diberikan hak serta kesempatan yang cukup untuk memeriksa fisik kendaraan secara langsung, melakukan uji jalan (test drive), maupun membawa teknisi/mekanik independen pilihannya sebelum melakukan pembayaran atau menandatangani Berita Acara Serah Terima (BAST).",
    },
    {
      num: 4,
      title: "Pelepasan Tanggung Jawab Fisik Setelah Unit Keluar Garasi",
      text: "Dengan menandatangani BAST dan membawa kendaraan keluar dari area showroom Nur Mobil, Pembeli menyatakan menerima kondisi fisik unit apa adanya (as-is), dan kondisi fisik kendaraan tidak dapat dikeluhkan/dikomplain di kemudian hari.",
    },
    {
      num: 5,
      title: "Batasan Komplain Khusus Dokumen Legalitas (30 Hari Kalender)",
      text: "Nur Mobil hanya memproses komplain/keluhan resmi yang berkaitan dengan keabsahan dokumen kepemilikan negara (BPKB dan STNK terblokir atau tersangkut sengketa hukum yang terjadi sebelum tanggal transaksi). Keluhan ini wajib diajukan secara tertulis dengan bukti sah dari pihak berwenang (Samsat/Kepolisian) dalam jangka waktu maksimal 30 (tiga puluh) hari kalender sejak tanggal serah terima dokumen kendaraan.",
    },
  ],
};

/**
 * Menghitung Total Grade komposit (A-E) berdasarkan matriks pembobotan IBID ACV
 * - Rangka memiliki bobot keamanan tertinggi (35%)
 * - Mesin & Mekanikal (30%)
 * - Eksterior (20%)
 * - Interior (15%)
 * Catatan: Jika Rangka D atau E, atau terindikasi accident berat, Total Grade terkunci maksimal D/E.
 */
export function calculateTotalGrade(
  engineGrade: string = "B",
  interiorGrade: string = "B",
  exteriorGrade: string = "B",
  frameGrade: string = "A",
  accidentHistory: boolean = false
): "A" | "B" | "C" | "D" | "E" {
  if (accidentHistory || frameGrade === "E") return "E";
  if (frameGrade === "D") return "D";

  const gradeScore: Record<string, number> = { A: 4, B: 3, C: 2, D: 1, E: 0 };
  const sEngine = gradeScore[engineGrade] ?? 3;
  const sInterior = gradeScore[interiorGrade] ?? 3;
  const sExterior = gradeScore[exteriorGrade] ?? 3;
  const sFrame = gradeScore[frameGrade] ?? 4;

  const composite = sFrame * 0.35 + sEngine * 0.3 + sExterior * 0.2 + sInterior * 0.15;

  if (composite >= 3.55) return "A";
  if (composite >= 2.65) return "B";
  if (composite >= 1.75) return "C";
  if (composite >= 0.9) return "D";
  return "E";
}

export interface MultiPointInspectionResult {
  average: number;
  delta: number;
  isBelang: boolean;
  maxPoint: number;
  minPoint: number;
  pointsCount: number;
}

/**
 * Menghitung rata-rata, disparitas (delta max - min), dan mendeteksi kondisi cat belang (IBID ACV Formula).
 * Berdasarkan standar IBID ACV Astra:
 * Disparitas (delta) > 30 µm antara titik dalam 1 panel menandakan indikasi spet sebagian / cat belang / dempul spot.
 */
export function calculateMultiPointAnalysis(
  points: (number | null | undefined)[],
  disparityThreshold: number = 30
): MultiPointInspectionResult {
  const valid = points.filter((p): p is number => p != null && !isNaN(p) && p > 0);
  if (valid.length === 0) {
    return {
      average: 0,
      delta: 0,
      isBelang: false,
      maxPoint: 0,
      minPoint: 0,
      pointsCount: 0,
    };
  }

  const sum = valid.reduce((acc, curr) => acc + curr, 0);
  const average = Math.round((sum / valid.length) * 10) / 10;
  const maxPoint = Math.max(...valid);
  const minPoint = Math.min(...valid);
  const delta = Math.round((maxPoint - minPoint) * 10) / 10;
  const isBelang = valid.length >= 2 && delta > disparityThreshold;

  return {
    average,
    delta,
    isBelang,
    maxPoint,
    minPoint,
    pointsCount: valid.length,
  };
}

export interface OverallVehiclePaintStats {
  overallAverage: number;
  totalPoints: number;
  maxMicron: number;
  minMicron: number;
  belangPanelsCount: number;
  repaintPanelsCount: number;
  fillerPanelsCount: number;
  originalPanelsCount: number;
  overallCondition: "ORIGINAL_FACTORY" | "PARTIAL_REPAINT" | "FULL_REPAINT" | "THICK_FILLER";
  overallConditionLabel: string;
}

/**
 * Kalkulasi rata-rata ketebalan cat keseluruhan bodi kendaraan (IBID ACV Overall Average).
 */
export function calculateOverallVehiclePaint(
  panels: Array<{
    panelType: string;
    paintThickness?: number | null;
    pointRight?: number | null;
    pointCenter?: number | null;
    pointLeft?: number | null;
    pointExtra?: number | null;
  }>,
  brand?: string | null
): OverallVehiclePaintStats {
  const cal = getBrandPaintStandard(brand);
  let allPoints: number[] = [];
  let belangPanelsCount = 0;
  let repaintPanelsCount = 0;
  let fillerPanelsCount = 0;
  let originalPanelsCount = 0;

  for (const p of panels) {
    if (p.panelType === "BUMPER_FRONT" || p.panelType === "BUMPER_REAR") continue;

    const rawPoints = [p.pointRight, p.pointCenter, p.pointLeft, p.pointExtra].filter(
      (pt): pt is number => pt != null && !isNaN(pt) && pt > 0
    );

    if (rawPoints.length > 0) {
      allPoints.push(...rawPoints);
      const analysis = calculateMultiPointAnalysis(rawPoints);
      if (analysis.isBelang) belangPanelsCount++;
      const avg = analysis.average;
      if (avg > cal.repaintMax) fillerPanelsCount++;
      else if (avg > cal.originalMax) repaintPanelsCount++;
      else originalPanelsCount++;
    } else if (p.paintThickness) {
      allPoints.push(p.paintThickness);
      if (p.paintThickness > cal.repaintMax) fillerPanelsCount++;
      else if (p.paintThickness > cal.originalMax) repaintPanelsCount++;
      else originalPanelsCount++;
    }
  }

  if (allPoints.length === 0) {
    return {
      overallAverage: 0,
      totalPoints: 0,
      maxMicron: 0,
      minMicron: 0,
      belangPanelsCount: 0,
      repaintPanelsCount: 0,
      fillerPanelsCount: 0,
      originalPanelsCount: 0,
      overallCondition: "ORIGINAL_FACTORY",
      overallConditionLabel: "Belum Diinspeksi",
    };
  }

  const sum = allPoints.reduce((acc, c) => acc + c, 0);
  const overallAverage = Math.round((sum / allPoints.length) * 10) / 10;
  const maxMicron = Math.max(...allPoints);
  const minMicron = Math.min(...allPoints);

  let overallCondition: OverallVehiclePaintStats["overallCondition"] = "ORIGINAL_FACTORY";
  let overallConditionLabel = "100% Cat Asli Pabrik";

  if (fillerPanelsCount > 0) {
    overallCondition = "THICK_FILLER";
    overallConditionLabel = `Terdeteksi ${fillerPanelsCount} Bagian Dempul Tebal`;
  } else if (repaintPanelsCount >= 6) {
    overallCondition = "FULL_REPAINT";
    overallConditionLabel = "Mayoritas / Full Repaint Bodi";
  } else if (repaintPanelsCount > 0 || belangPanelsCount > 0) {
    overallCondition = "PARTIAL_REPAINT";
    overallConditionLabel = `${repaintPanelsCount} Panel Spet Ulang (${belangPanelsCount} Panel Belang)`;
  }

  return {
    overallAverage,
    totalPoints: allPoints.length,
    maxMicron,
    minMicron,
    belangPanelsCount,
    repaintPanelsCount,
    fillerPanelsCount,
    originalPanelsCount,
    overallCondition,
    overallConditionLabel,
  };
}
