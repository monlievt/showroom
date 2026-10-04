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


