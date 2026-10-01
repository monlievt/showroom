/**
 * Utility parsing angka & tanggal spreadsheet
 */

export function cleanNumber(val: any): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const cleaned = String(val)
    .replace(/[^\d,-]/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");
  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
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
