/**
 * Utilitas URL Slug Kendaraan Berbasis Nomor Polisi (Plat Nomor) & Spesifikasi
 * Memudahkan pencarian unit, identifikasi cepat, dan SEO marketplace otomotif.
 */

export interface VehicleSlugPayload {
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
}

/**
 * Menghasilkan slug ramah SEO dengan Plat Nomor di awal
 * Contoh: "L 1092 EF", "Toyota", "Avanza 1.5 G CVT TSS", 2022
 * Hasil: "l-1092-ef-toyota-avanza-1-5-g-cvt-tss-2022"
 */
export function generateVehicleSlug(v: VehicleSlugPayload): string {
  const cleanPlate = v.plateNumber
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  const cleanBrandModelYear = `${v.brand}-${v.model}-${v.year}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${cleanPlate}-${cleanBrandModelYear}`;
}

/**
 * Ekstrak kandidat plat nomor dari berbagai format slug atau input pencarian:
 * - "l-1092-ef-toyota-avanza-2022"
 * - "toyota-avanza-2022-l-1092-ef" (backward compatibility)
 * - "l-1092-ef" (shortcut cepat)
 * - "L1092EF" / "L 1092 EF" (direct plate)
 */
export function extractPlateCandidates(identifier: string): string[] {
  const raw = decodeURIComponent(identifier || "").trim();
  const candidates: string[] = [];

  // 1. Direct raw format
  candidates.push(raw);
  candidates.push(raw.toUpperCase());
  candidates.push(raw.replace(/\s+/g, ""));
  candidates.push(raw.replace(/-/g, " ").toUpperCase());

  // 2. Regex pencarian pola plat nomor Indonesia:
  // 1-2 huruf daerah (misal: L, W, N, AG, B, D, DK, AB)
  // 1-4 digit nomor
  // 1-3 huruf seri belakang
  const regex = /(?:^|-)([a-zA-Z]{1,2})[-_\s]?(\d{1,4})[-_\s]?([a-zA-Z]{1,3})(?:$|-)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(raw)) !== null) {
    const prefix = match[1].toUpperCase();
    const number = match[2];
    const suffix = match[3].toUpperCase();

    // Format dengan spasi: "L 1092 EF"
    candidates.push(`${prefix} ${number} ${suffix}`);
    // Format tanpa spasi: "L1092EF"
    candidates.push(`${prefix}${number}${suffix}`);
    // Format tanda hubung: "L-1092-EF"
    candidates.push(`${prefix}-${number}-${suffix}`);
  }

  return Array.from(new Set(candidates.filter(Boolean)));
}
