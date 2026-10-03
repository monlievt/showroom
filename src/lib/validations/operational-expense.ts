import { z } from "zod";

export const OperationalCategoryEnum = z.enum([
  "RENT_SHOWROOM",
  "UTILITIES_WIFI",
  "MARKETING_ADS",
  "SALARY_WAGES",
  "OFFICE_SUPPLIES",
  "CONSUMPTION_GUEST",
  "MAINTENANCE",
  "OTHER",
]);

export const operationalExpenseSchema = z.object({
  category: OperationalCategoryEnum,
  recipient: z.string().optional().nullable(),
  amount: z.coerce.number().positive("Nominal pengeluaran harus lebih dari 0"),
  date: z.coerce.date().default(() => new Date()),
  notes: z.string().optional().nullable(),
  receiptUrl: z.string().optional().nullable(),
  proofUrls: z.array(z.string()).optional().nullable(),
});

export type OperationalExpenseInput = z.infer<typeof operationalExpenseSchema>;

export const ownerDrawSchema = z.object({
  amount: z.coerce.number().positive("Nominal penarikan pribadi (Prive) harus lebih dari 0"),
  date: z.coerce.date().default(() => new Date()),
  notes: z.string().min(2, "Catatan keperluan penarikan pribadi wajib diisi (misal: Belanja Rumah Tangga, SPP Sekolah, dll)"),
  proofUrls: z.array(z.string()).optional().nullable(),
});

export type OwnerDrawInput = z.infer<typeof ownerDrawSchema>;

export const ownerEquitySchema = z.object({
  amount: z.coerce.number().positive("Nominal setoran modal pribadi harus lebih dari 0"),
  date: z.coerce.date().default(() => new Date()),
  notes: z.string().optional().nullable(),
  proofUrls: z.array(z.string()).optional().nullable(),
});

export type OwnerEquityInput = z.infer<typeof ownerEquitySchema>;
