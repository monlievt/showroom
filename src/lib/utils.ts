import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number | string | bigint): string {
  const num = typeof amount === "string" ? parseFloat(amount) : Number(amount);
  if (isNaN(num)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatUpcomingPrice(price: number | null | undefined): string {
  if (!price || price <= 0) return "Estimasi: Hubungi Kami";
  const millions = Math.floor(price / 1_000_000);
  if (millions >= 100) {
    const tens = Math.floor(millions / 10) * 10;
    return `Estimasi Rp ${tens} Jutaan`;
  }
  const rounded = Math.floor(millions / 5) * 5;
  return `Estimasi Rp ${rounded} Jutaan`;
}

export function parseProofUrls(proofUrl?: string | null): string[] {
  if (!proofUrl) return [];
  try {
    const parsed = JSON.parse(proofUrl);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string" && Boolean(item));
    }
  } catch {}
  return [proofUrl];
}

export function serializeProofUrls(urls: string[]): string | null {
  const cleaned = urls.map((u) => u.trim()).filter(Boolean);
  if (cleaned.length === 0) return null;
  return cleaned.length === 1 ? cleaned[0] : JSON.stringify(cleaned);
}

/**
 * Format angka atau string angka ke format ribuan dengan pemisah titik (misal: 150000000 -> "150.000.000")
 */
export function formatThousands(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const cleaned = String(value).replace(/\D/g, "");
  if (!cleaned) return "";
  return new Intl.NumberFormat("id-ID").format(Number(cleaned));
}

/**
 * Parse string dengan pemisah ribuan titik/koma menjadi angka integer (misal: "150.000.000" -> 150000000)
 */
export function parseThousands(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const cleaned = value.replace(/\D/g, "");
  return cleaned ? parseInt(cleaned, 10) : 0;
}

/**
 * Normalisasi plat nomor kendaraan Indonesia ke format standar berspasi:
 * Contoh: "b1277dks" / "B  1277  DKS" / "B-1277-DKS" -> "B 1277 DKS"
 *         "ag2737eff" -> "AG 2737 EFF"
 */
export function normalizePlateNumber(raw: string | null | undefined): string {
  if (!raw) return "";
  const compact = raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .trim();

  if (!compact) return "";

  const match = compact.match(/^([A-Z]{1,2})(\d{1,4})([A-Z]{0,3})$/);
  if (match) {
    const [, prefix, number, suffix] = match;
    return suffix ? `${prefix} ${number} ${suffix}` : `${prefix} ${number}`;
  }

  return raw.toUpperCase().replace(/\s+/g, " ").trim();
}

/**
 * Hapus spasi & karakter non-alfanumerik pada plat nomor untuk pencocokan/pencarian fleksibel.
 */
export function stripPlateSpaces(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

const BRAND_TYPO_ALIASES: Record<string, string[]> = {
  HONDA: ["HONSA", "HONDAA"],
  TOYOTA: ["TOYOYA", "TOYOTAA"],
  DAIHATSU: ["DAIHASU", "DAIHATSHU"],
  SUZUKI: ["SUZUKY"],
  MITSUBISHI: ["MITSUBISI"],
  YAMAHA: ["YAMAHAA"],
  HYUNDAI: ["HYUNDY"],
};

const PRESERVE_UPPERCASE_WORDS = new Set([
  "MT",
  "AT",
  "CVT",
  "DCT",
  "ABS",
  "SRS",
  "TSS",
  "GR",
  "RS",
  "GL",
  "GX",
  "GLX",
  "DX",
  "EX",
  "LX",
  "SX",
  "SE",
  "LE",
  "XE",
  "XS",
  "DLX",
  "STD",
  "SUV",
  "MPV",
  "CRV",
  "HRV",
  "BRV",
  "WRV",
  "CR-V",
  "HR-V",
  "BR-V",
  "WR-V",
  "XL7",
  "L300",
  "AC",
  "PS",
  "PU",
  "4X2",
  "4X4",
  "AWD",
  "FWD",
  "RWD",
  "EV",
  "HEV",
  "PHEV",
  "VVT-I",
  "VVTI",
  "VTEC",
  "I-VTEC",
  "TURBO",
]);

function smartTitleCaseToken(token: string): string {
  const upper = token.toUpperCase();
  if (PRESERVE_UPPERCASE_WORDS.has(upper)) return upper;
  if (/^\d+(\.\d+)?$/.test(token)) return token;
  if (/^[A-Z]\d+$/.test(upper)) return upper;
  if (token.length <= 2 && /^[A-Z]+$/i.test(token)) return upper;
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

export function formatReadableText(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  const letters = trimmed.replace(/[^a-zA-Z]/g, "");
  const isAllUpper = letters.length > 2 && letters === letters.toUpperCase();
  if (!isAllUpper) return trimmed;
  return trimmed.split(" ").map(smartTitleCaseToken).join(" ");
}

/**
 * Bersihkan duplikasi merk, typo merk, dan tahun ganda pada kolom model.
 * Contoh: ("SUZUKI", "SUZUKI ERTIGA DIESEL 2016", 2016) -> "Ertiga Diesel"
 *         ("HONDA", "HONSA VARIO 160 2024", 2024) -> "Vario 160"
 */
export function cleanVehicleModel(
  brand: string | null | undefined,
  model: string | null | undefined,
  year?: number | null
): string {
  let cleaned = (model || "").trim().replace(/\s+/g, " ");
  if (!cleaned) return "";

  const cleanBrand = (brand || "").trim().toUpperCase();
  if (cleanBrand) {
    const prefixes = [cleanBrand, ...(BRAND_TYPO_ALIASES[cleanBrand] || [])];
    for (const prefix of prefixes) {
      const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`^${escaped}\\s+`, "i");
      if (re.test(cleaned)) {
        cleaned = cleaned.replace(re, "").trim();
        break;
      }
    }
  }

  if (year && Number.isFinite(year)) {
    const yearStr = String(year);
    const trailingYearRe = new RegExp(`\\s*\\(?${yearStr}\\)?\\s*$`);
    cleaned = cleaned.replace(trailingYearRe, "").trim();
  }

  return formatReadableText(cleaned);
}

/**
 * Format judul kendaraan yang rapi dan bebas duplikasi merk/tahun.
 */
export function formatVehicleTitle(
  brand: string | null | undefined,
  model: string | null | undefined,
  year?: number | null
): string {
  const prettyBrand = formatReadableText(brand || "");
  const prettyModel = cleanVehicleModel(brand, model, year);
  const base = [prettyBrand, prettyModel].filter(Boolean).join(" ").trim();
  if (!base) return year ? `Unit (${year})` : "Unit Kendaraan";
  return year ? `${base} (${year})` : base;
}

/**
 * Ambil tanggal hari ini dalam format YYYY-MM-DD sesuai zona waktu WIB (Asia/Jakarta).
 */
export function getTodayWibDateString(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = parts.find((p) => p.type === "year")?.value || String(now.getFullYear());
  const month = parts.find((p) => p.type === "month")?.value || String(now.getMonth() + 1).padStart(2, "0");
  const day = parts.find((p) => p.type === "day")?.value || String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Ubah error teknis (Prisma / Zod / sistem) menjadi pesan bahasa Indonesia yang mudah dipahami.
 */
export function sanitizeActionError(error: unknown, fallback = "Terjadi kendala saat menyimpan data. Silakan coba lagi."): string {
  if (!error) return fallback;

  const errObj = error as {
    code?: string;
    message?: string;
    meta?: { target?: string | string[] };
    issues?: Array<{ message?: string }>;
    name?: string;
  };

  if (errObj.name === "ZodError" && Array.isArray(errObj.issues) && errObj.issues.length > 0) {
    return errObj.issues[0]?.message || "Data yang diisi belum lengkap atau formatnya tidak sesuai.";
  }

  if (errObj.code === "P2002") {
    const target = Array.isArray(errObj.meta?.target)
      ? errObj.meta.target.join(",")
      : String(errObj.meta?.target || "");
    if (target.toLowerCase().includes("vehicleid") || target.toLowerCase().includes("sale")) {
      return "Unit ini sudah memiliki catatan penjualan aktif. Silakan buka menu Penjualan untuk mencatat pelunasan atau mengubah transaksi.";
    }
    if (target.toLowerCase().includes("platenumber")) {
      return "Nomor plat ini sudah terdaftar di stok. Periksa kembali plat nomor atau cari di daftar stok.";
    }
    return "Data yang sama sudah tercatat sebelumnya.";
  }

  if (errObj.code === "P2025") {
    return "Data yang dimaksud tidak ditemukan atau sudah dihapus.";
  }

  if (errObj.code === "P2003") {
    return "Data ini masih terhubung dengan transaksi lain sehingga tidak bisa diproses.";
  }

  const rawMsg = typeof errObj.message === "string" ? errObj.message : "";
  if (
    rawMsg.includes("Invalid `prisma.") ||
    rawMsg.includes("Invalid prisma.") ||
    rawMsg.includes("Unique constraint failed") ||
    rawMsg.includes("Foreign key constraint") ||
    rawMsg.includes("PrismaClient")
  ) {
    if (rawMsg.includes("Sale_vehicleId_key")) {
      return "Unit ini sudah memiliki catatan penjualan aktif. Silakan buka menu Penjualan untuk mencatat pelunasan atau mengubah transaksi.";
    }
    if (rawMsg.includes("Vehicle_plateNumber_key")) {
      return "Nomor plat ini sudah terdaftar di stok. Periksa kembali daftar stok.";
    }
    return fallback;
  }

  return rawMsg || fallback;
}



