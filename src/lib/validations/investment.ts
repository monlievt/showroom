import { z } from "zod";

export const vehicleInvestmentSchema = z.object({
  vehicleId: z.string().min(1, "ID unit kendaraan wajib diisi"),
  investorId: z.string().min(1, "Investor wajib dipilih"),
  capitalShare: z.number().positive("Porsi modal harus lebih dari 0"),
  profitSharePercent: z
    .number()
    .min(0, "Persentase bagi hasil tidak boleh negatif")
    .max(100, "Persentase bagi hasil maksimal 100%")
    .refine(
      (val) => val === 0 || val >= 1,
      {
        message: "Format persentase adalah 0–100 (contoh: masukkan 50 untuk 50%, bukan 0.50). Nilai pecahan desimal 0–1 dilarang.",
      }
    ),
  notes: z.string().optional().nullable(),
});

export type VehicleInvestmentInput = z.input<typeof vehicleInvestmentSchema>;
export type VehicleInvestmentOutput = z.infer<typeof vehicleInvestmentSchema>;
