import { z } from "zod";

export const AssetCategoryEnum = z.enum([
  "INSPECTION_TOOLS",
  "WORKSHOP_EQUIPMENT",
  "OFFICE_ELECTRONICS",
  "FACILITY_FURNITURE",
  "OPERATIONAL_VEHICLE",
  "OTHER",
]);

export const AssetConditionEnum = z.enum([
  "EXCELLENT",
  "GOOD",
  "FAIR",
  "DAMAGED",
]);

export const showroomAssetSchema = z.object({
  name: z.string().min(2, "Nama aset minimal 2 karakter"),
  category: AssetCategoryEnum,
  purchaseDate: z.coerce.date().default(() => new Date()),
  purchaseCost: z.coerce.number().positive("Biaya perolehan aset harus lebih dari 0"),
  currentValue: z.coerce.number().optional().nullable(),
  condition: AssetConditionEnum.default("GOOD"),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  receiptUrl: z.string().optional().nullable(),
  proofUrls: z.array(z.string()).optional().nullable(),
});

export type ShowroomAssetInput = z.infer<typeof showroomAssetSchema>;
