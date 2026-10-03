import { z } from "zod";

export const ExpenseCategoryEnum = z.enum([
  "TRANSPORT_PICKUP",
  "AUCTION_ADMIN_FEE",
  "BROKER_COMMISSION",
  "OIL_AND_SERVICE",
  "BODY_PAINT",
  "DETAILING_SALON",
  "TIRES_AND_WHEELS",
  "ELECTRICAL",
  "SPAREPARTS",
  "DOCUMENT_TAX_MUTATION",
  "OTHER",
]);

export const createExpenseSchema = z.object({
  vehicleId: z.string().uuid("ID kendaraan tidak valid"),
  category: ExpenseCategoryEnum,
  vendorName: z.string().optional().nullable(),
  amount: z.coerce.number().positive("Nominal biaya harus lebih besar dari 0"),
  date: z.coerce.date().default(() => new Date()),
  notes: z.string().optional().nullable(),
  receiptUrl: z.string().optional().nullable(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
