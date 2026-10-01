import Decimal from "decimal.js";

export interface SalePaymentSummary {
  amount: Decimal | number | string;
}

/**
 * Menghitung rekapitulasi pembayaran penjualan kendaraan.
 * Berdasarkan ARCHITECTURE.md §8:
 * - paidAmount = SUM(SalePayment.amount)
 * - remaining = sellingPrice - paidAmount
 * - isFullyPaid = remaining <= 0
 */
export function calculateSaleSettlement(
  sellingPrice: Decimal | number | string,
  payments: SalePaymentSummary[] = []
) {
  const price = new Decimal(sellingPrice.toString());
  const paid = payments.reduce((acc, curr) => {
    return acc.plus(new Decimal(curr.amount.toString()));
  }, new Decimal(0));

  const remaining = price.minus(paid);
  const isFullyPaid = remaining.lessThanOrEqualTo(0);
  const percentagePaid = price.isZero()
    ? 100
    : Math.min(100, paid.dividedBy(price).times(100).toNumber());

  return {
    sellingPrice: price,
    paidAmount: paid,
    remainingAmount: remaining.greaterThan(0) ? remaining : new Decimal(0),
    isFullyPaid,
    percentagePaid: Math.round(percentagePaid * 10) / 10,
  };
}

/**
 * Menghitung status jatuh tempo piutang (Aging Receivables):
 * - OVERDUE: Lewat tanggal jatuh tempo
 * - DUE_SOON: Jatuh tempo dalam 3 hari ke depan
 * - ON_SCHEDULE: Masih aman (> 3 hari)
 * - NO_DUE_DATE: Belum ada tanggal jatuh tempo
 */
export function getReceivableDueDateStatus(
  dueDate: Date | string | null | undefined,
  now: Date = new Date()
): { status: "OVERDUE" | "DUE_SOON" | "ON_SCHEDULE" | "NO_DUE_DATE"; daysRemaining: number | null } {
  if (!dueDate) return { status: "NO_DUE_DATE", daysRemaining: null };

  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: "OVERDUE", daysRemaining: diffDays };
  }
  if (diffDays <= 3) {
    return { status: "DUE_SOON", daysRemaining: diffDays };
  }
  return { status: "ON_SCHEDULE", daysRemaining: diffDays };
}

/**
 * Konversi angka ke kalimat terbilang Rupiah (untuk kuitansi & faktur resmi).
 */
export function terbilangRupiah(nominal: number | string | Decimal): string {
  const n = typeof nominal === "object" ? Number(nominal.toString()) : Number(nominal);
  if (isNaN(n) || n === 0) return "Nol Rupiah";

  const satuan = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
    "Sepuluh",
    "Sebelas",
  ];

  function bilang(num: number): string {
    if (num < 12) return satuan[num];
    if (num < 20) return bilang(num - 10) + " Belas";
    if (num < 100) return bilang(Math.floor(num / 10)) + " Puluh " + bilang(num % 10);
    if (num < 200) return "Seratus " + bilang(num - 100);
    if (num < 1000) return bilang(Math.floor(num / 100)) + " Ratus " + bilang(num % 100);
    if (num < 2000) return "Seribu " + bilang(num - 1000);
    if (num < 1000000) return bilang(Math.floor(num / 1000)) + " Ribu " + bilang(num % 1000);
    if (num < 1000000000)
      return bilang(Math.floor(num / 1000000)) + " Juta " + bilang(num % 1000000);
    if (num < 1000000000000)
      return bilang(Math.floor(num / 1000000000)) + " Miliar " + bilang(num % 1000000000);
    return "";
  }

  return (bilang(Math.abs(Math.floor(n))).trim() + " Rupiah").replace(/\s+/g, " ");
}
