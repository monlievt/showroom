import { z } from "zod";

export const CashTransactionTypeEnum = z.enum([
  "IN_SALE_PAYMENT",
  "IN_CAPITAL_DEPOSIT",
  "IN_OWNER_EQUITY",
  "OUT_VEHICLE_PURCHASE",
  "OUT_EXPENSE",
  "OUT_OPERATIONAL",
  "OUT_OWNER_DRAW",
  "OUT_ASSET_PURCHASE",
  "OUT_PROFIT_DISTRIBUTION",
  "OUT_CAPITAL_RETURN",
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
});

export type CashTransactionInput = z.input<typeof cashTransactionSchema>;
export type CashTransactionOutput = z.infer<typeof cashTransactionSchema>;
