import Decimal from "decimal.js";

export interface ExpenseItem {
  amount: Decimal | number | string;
}

/**
 * Menghitung Total HPP (Harga Pokok Penjualan / Landed Cost) suatu unit kendaraan.
 * Rumus ARCHITECTURE.md §4: HPP = Harga Beli + Akumulasi Biaya (Expense).
 * Selalu menggunakan Decimal untuk mencegah floating point rounding error.
 */
export function calculateHpp(
  purchasePrice: Decimal | number | string,
  expenses: ExpenseItem[] = []
): Decimal {
  const base = new Decimal(purchasePrice.toString());
  const totalExpense = expenses.reduce((acc, curr) => {
    return acc.plus(new Decimal(curr.amount.toString()));
  }, new Decimal(0));

  return base.plus(totalExpense);
}

/**
 * Menghitung Laba Kotor Unit.
 * Rumus ARCHITECTURE.md §4: Laba Kotor = Harga Jual - HPP.
 */
export function calculateGrossProfit(
  sellingPrice: Decimal | number | string,
  hpp: Decimal | number | string
): Decimal {
  return new Decimal(sellingPrice.toString()).minus(new Decimal(hpp.toString()));
}

/**
 * Menghitung durasi hari unit berada di garasi/inventori sejak tanggal pembelian.
 * Dasar deteksi unit macet (K-Cunk / Nur Mobil Velocity KPI).
 */
export function calculateDaysInInventory(
  purchaseDate: Date | string,
  now: Date = new Date()
): number {
  const purchase = typeof purchaseDate === "string" ? new Date(purchaseDate) : purchaseDate;
  const diffTime = now.getTime() - purchase.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export type InventoryAgingCategory = "FRESH" | "NORMAL" | "WARNING_STAGNANT";

/**
 * Menentukan kategori perputaran unit:
 * - FRESH: 0–14 hari (target perputaran ideal)
 * - NORMAL: 15–45 hari
 * - WARNING_STAGNANT: > 45 hari (indikator unit macet / modal tertahan)
 */
export function getInventoryAgingCategory(days: number): InventoryAgingCategory {
  if (days <= 14) return "FRESH";
  if (days <= 45) return "NORMAL";
  return "WARNING_STAGNANT";
}
