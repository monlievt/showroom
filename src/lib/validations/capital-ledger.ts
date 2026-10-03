import { z } from "zod";

export const CapitalLedgerTypeEnum = z.enum([
  "DEPOSIT",
  "ALLOCATED",
  "RETURNED",
  "PROFIT_PAID",
  "CORRECTION",
]);

export const capitalLedgerSchema = z.object({
  investorId: z.string().min(1, "Investor wajib dipilih"),
  type: CapitalLedgerTypeEnum,
  amount: z.number().positive("Nominal mutasi modal harus positif"),
  vehicleId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  proofUrl: z.string().optional().nullable(),
  proofUrls: z.array(z.string()).optional().nullable(),
  depositDate: z.string().optional().nullable(),
});

export type CapitalLedgerInput = z.input<typeof capitalLedgerSchema>;
export type CapitalLedgerOutput = z.infer<typeof capitalLedgerSchema>;
