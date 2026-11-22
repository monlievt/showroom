/**
 * Utility parsing angka & tanggal spreadsheet
 */

export function cleanNumber(val: any): number {
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  if (!val) return 0;

  let raw = String(val)
    .replace(/Rp\.?/gi, "")
    .replace(/\s+/g, "")
    .replace(/[^\d.,-]/g, "");

  if (!raw || raw === "-") return 0;

  const dots = (raw.match(/\./g) || []).length;
  const commas = (raw.match(/,/g) || []).length;

  if (dots > 0 && commas > 0) {
    if (raw.lastIndexOf(",") > raw.lastIndexOf(".")) {
      // Format Indonesia: 150.000.000,50
      raw = raw.replace(/\./g, "").replace(",", ".");
    } else {
      // Format Inggris: 150,000,000.50
      raw = raw.replace(/,/g, "");
    }
  } else if (commas > 1) {
    // Ribuan dengan koma: 150,000,000
    raw = raw.replace(/,/g, "");
  } else if (dots > 1) {
    // Ribuan dengan titik: 150.000.000
    raw = raw.replace(/\./g, "");
  } else if (commas === 1) {
    const parts = raw.split(",");
    raw = parts[1].length === 3 ? parts.join("") : parts.join(".");
  } else if (dots === 1) {
    const parts = raw.split(".");
    raw = parts[1].length === 3 ? parts.join("") : raw;
  }

  const num = Number(raw);
  return Number.isFinite(num) ? num : 0;
}

export function cleanDate(val: any): Date {
  if (!val) return new Date();
  if (val instanceof Date) return val;

  const s = String(val).trim();

  // Format DD/MM/YYYY atau DD-MM-YYYY
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(s)) {
    const parts = s.split(/[\/\-]/);
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }

  // Format YYYY-MM-DD
  const parsed = new Date(s);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}
