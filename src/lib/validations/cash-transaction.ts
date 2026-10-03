import { z } from "zod";

export const CashTransactionTypeEnum = z.enum([
  "IN_SALE_PAYMENT",
  "IN_CAPITAL_DEPOSIT",
  "IN_OWNER_EQUITY",
  "IN_OTHER",
  "OUT_VEHICLE_PURCHASE",
  "OUT_EXPENSE",
  "OUT_OPERATIONAL",
  "OUT_OWNER_DRAW",
  "OUT_ASSET_PURCHASE",
  "OUT_PROFIT_DISTRIBUTION",
  "OUT_CAPITAL_RETURN",
  "OUT_OTHER",
  "CORRECTION",
]);

export const cashTransactionSchema = z.object({
  type: CashTransactionTypeEnum,
  amount: z.number().positive("Nominal transaksi kas harus lebih dari 0"),
  relatedVehicleId: z.string().optional().nullable(),
  relatedSaleId: z.string().optional().nullable(),
  relatedExpenseId: z.string().optional().nullable(),
  relatedLedgerId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  proofUrl: z.string().optional().nullable(),
  proofUrls: z.array(z.string()).optional().nullable(),
  createdAt: z.coerce.date().optional().nullable(),
});

export type CashTransactionInput = z.input<typeof cashTransactionSchema>;
export type CashTransactionOutput = z.infer<typeof cashTransactionSchema>;
