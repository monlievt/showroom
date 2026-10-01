import { z } from "zod";

export interface TierRuleInput {
  name?: string;
  minProfit: number;
  maxProfit: number | null;
  amountPerPerson: number;
  numberOfPeople?: number;
}

/**
 * Validasi bahwa daftar tier bagi hasil bersifat contiguous:
 * - Tidak boleh ada gap (jarak kosong antar tier).
 * - Tidak boleh ada overlap (rentang yang saling tumpang tindih).
 * - Tier dengan maxProfit = null (tanpa batas atas) hanya boleh berada di tier paling akhir.
 * - tier[i].maxProfit HARUS sama persis dengan tier[i+1].minProfit.
 */
export function validateContiguousTiers(tiers: TierRuleInput[]): {
  valid: boolean;
  error?: string;
} {
  if (!tiers || tiers.length === 0) {
    return { valid: false, error: "Daftar tier aturan bagi hasil tidak boleh kosong" };
  }

  // Sort berdasarkan minProfit secara ascending
  const sorted = [...tiers].sort((a, b) => a.minProfit - b.minProfit);

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];

    if (current.minProfit < 0) {
      return { valid: false, error: `Tier '${current.name || i + 1}': minProfit tidak boleh negatif` };
    }

    if (current.amountPerPerson < 0) {
      return { valid: false, error: `Tier '${current.name || i + 1}': amountPerPerson tidak boleh negatif` };
    }

    if (current.maxProfit !== null && current.maxProfit <= current.minProfit) {
      return {
        valid: false,
        error: `Tier '${current.name || i + 1}': maxProfit (${current.maxProfit}) harus lebih besar dari minProfit (${current.minProfit})`,
      };
    }

    // Jika maxProfit bernilai null (unbounded), ia WAJIB menjadi tier paling akhir
    if (current.maxProfit === null && i !== sorted.length - 1) {
      return {
        valid: false,
        error: `Tier '${current.name || i + 1}' tidak memiliki batas atas (maxProfit null), sehingga harus menjadi tier terakhir`,
      };
    }

    // Periksa kontinuitas dengan tier berikutnya
    if (i < sorted.length - 1) {
      const next = sorted[i + 1];
      if (current.maxProfit === null) {
        return {
          valid: false,
          error: `Overlap terdeteksi: Tier '${current.name || i + 1}' tidak berbatas atas tetapi ada tier berikutnya`,
        };
      }

      if (current.maxProfit !== next.minProfit) {
        if (current.maxProfit < next.minProfit) {
          return {
            valid: false,
            error: `Gap (celah) terdeteksi antara tier '${current.name || i + 1}' (max: ${current.maxProfit}) dan tier '${next.name || i + 2}' (min: ${next.minProfit})`,
          };
        } else {
          return {
            valid: false,
            error: `Overlap (tumpang tindih) terdeteksi antara tier '${current.name || i + 1}' (max: ${current.maxProfit}) dan tier '${next.name || i + 2}' (min: ${next.minProfit})`,
          };
        }
      }
    }
  }

  return { valid: true };
}

export const singleProfitShareRuleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Nama tier minimal 2 karakter"),
  beneficiaryGroup: z.string().default("MOTHER_SIBLING"),
  minProfit: z.number().min(0, "Laba minimal tidak boleh negatif"),
  maxProfit: z.number().nullable().optional(),
  amountPerPerson: z.number().min(0, "Nominal per orang tidak boleh negatif"),
  numberOfPeople: z.number().int().positive().default(4),
  active: z.boolean().default(true),
});

export const profitShareRuleBatchSchema = z
  .array(singleProfitShareRuleSchema)
  .min(1, "Minimal 1 aturan tier wajib ada")
  .refine(
    (tiers) => {
      const mapped: TierRuleInput[] = tiers.map((t) => ({
        name: t.name,
        minProfit: t.minProfit,
        maxProfit: t.maxProfit ?? null,
        amountPerPerson: t.amountPerPerson,
        numberOfPeople: t.numberOfPeople,
      }));
      const check = validateContiguousTiers(mapped);
      return check.valid;
    },
    {
      message: "Tier aturan bagi hasil tidak valid atau tumpang tindih",
    }
  );

export type SingleProfitShareRuleInput = z.input<typeof singleProfitShareRuleSchema>;
export type SingleProfitShareRuleOutput = z.infer<typeof singleProfitShareRuleSchema>;
