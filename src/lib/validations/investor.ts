import { z } from "zod";

export const InvestorTypeEnum = z.enum([
  "OWNER_EQUITY",
  "MOTHER_SIBLING",
  "THIRD_PARTY",
]);

export const investorSchema = z.object({
  name: z.string().min(2, "Nama investor minimal 2 karakter"),
  phone: z.string().optional().nullable(),
  type: InvestorTypeEnum.default("THIRD_PARTY"),
  bankName: z.string().optional().nullable(),
  bankAccountNumber: z.string().optional().nullable(),
  bankAccountName: z.string().optional().nullable(),
  defaultProfitSharePercent: z.number().min(0, "Minimal 0%").max(100, "Maksimal 100%").optional().nullable(),
  authUserId: z.string().optional().nullable(),
});

export type InvestorInput = z.input<typeof investorSchema>;
export type InvestorOutput = z.infer<typeof investorSchema>;
