import type { CreateExpenseInput } from "@/lib/validations/expense";

export type ExpenseCategoryCode = CreateExpenseInput["category"];

export interface ExpenseCategoryOption {
  value: ExpenseCategoryCode;
  shortLabel: string;
  label: string;
  group: string;
  quickPick: boolean;
}

export const EXPENSE_CATEGORIES: ExpenseCategoryOption[] = [
  {
    value: "OIL_AND_SERVICE",
    shortLabel: "Servis & Oli",
    label: "Oli, Tune Up & Servis Rutin",
    group: "Perbaikan, Mesin & Salon (Restorasi)",
    quickPick: true,
  },
  {
    value: "BODY_PAINT",
    shortLabel: "Body & Cat",
    label: "Body Repair, Ketok & Cat Spet",
    group: "Perbaikan, Mesin & Salon (Restorasi)",
    quickPick: true,
  },
  {
    value: "DETAILING_SALON",
    shortLabel: "Salon / Poles",
    label: "Salon Interior, Eksterior & Detailing",
    group: "Perbaikan, Mesin & Salon (Restorasi)",
    quickPick: true,
  },
  {
    value: "SPAREPARTS",
    shortLabel: "Sparepart",
    label: "Penggantian Sparepart & Kaki-kaki",
    group: "Perbaikan, Mesin & Salon (Restorasi)",
    quickPick: true,
  },
  {
    value: "TIRES_AND_WHEELS",
    shortLabel: "Ban & Spooring",
    label: "Ganti Ban, Spooring & Balancing",
    group: "Perbaikan, Mesin & Salon (Restorasi)",
    quickPick: true,
  },
  {
    value: "ELECTRICAL",
    shortLabel: "Kelistrikan & AC",
    label: "Kelistrikan, Audio & AC Mobil",
    group: "Perbaikan, Mesin & Salon (Restorasi)",
    quickPick: false,
  },
  {
    value: "TRANSPORT_PICKUP",
    shortLabel: "Towing / Angkut",
    label: "Ongkos Angkut / Towing / Biaya Ambil Unit",
    group: "Pengadaan & Logistik Awal (Landed Cost)",
    quickPick: true,
  },
  {
    value: "AUCTION_ADMIN_FEE",
    shortLabel: "Admin Lelang",
    label: "Biaya Admin Lelang Resmi",
    group: "Pengadaan & Logistik Awal (Landed Cost)",
    quickPick: false,
  },
  {
    value: "BROKER_COMMISSION",
    shortLabel: "Komisi Makelar",
    label: "Komisi Makelar / Mediator",
    group: "Pengadaan & Logistik Awal (Landed Cost)",
    quickPick: false,
  },
  {
    value: "DOCUMENT_TAX_MUTATION",
    shortLabel: "Pajak / STNK",
    label: "Pajak Tahunan, Kaleng, Balik Nama & STNK",
    group: "Legalitas & Dokumen",
    quickPick: true,
  },
  {
    value: "OTHER",
    shortLabel: "Lain-lain",
    label: "Biaya Operasional / Pengeluaran Lainnya",
    group: "Lain-lain",
    quickPick: false,
  },
];

const EXPENSE_CATEGORY_MAP = new Map<string, ExpenseCategoryOption>(
  EXPENSE_CATEGORIES.map((item) => [item.value, item])
);

export function getExpenseCategoryShortLabel(category: string): string {
  return EXPENSE_CATEGORY_MAP.get(category)?.shortLabel ?? category;
}

export function getExpenseCategoryLabel(category: string): string {
  return EXPENSE_CATEGORY_MAP.get(category)?.label ?? category;
}
