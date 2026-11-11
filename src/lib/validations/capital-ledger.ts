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

export const withdrawInvestorCapitalSchema = z.object({
  investorId: z.string().min(1, "Investor wajib dipilih"),
  amount: z.coerce.number().positive("Nominal penarikan dana harus lebih dari 0"),
  withdrawalCategory: z
    .enum(["CAPITAL_RETURN", "PROFIT_WITHDRAWAL"])
    .default("CAPITAL_RETURN"),
  withdrawalDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  proofUrl: z.string().optional().nullable(),
  proofUrls: z.array(z.string()).optional().nullable(),
});

export type WithdrawInvestorCapitalInput = z.input<typeof withdrawInvestorCapitalSchema>;
