import Decimal from "decimal.js";
import { calculateHpp, calculateGrossProfit, ExpenseItem } from "./hpp";
import { validateContiguousTiers, TierRuleInput } from "../validations/profit-share-rule";
import { InvestorType } from "@prisma/client";

export interface InvestmentData {
  investorId: string;
  investorName: string;
  investorType: InvestorType | "OWNER_EQUITY" | "MOTHER_SIBLING" | "THIRD_PARTY";
  capitalShare: Decimal | number | string;
  profitSharePercent: Decimal | number | string; // 0–100
}

export interface RuleData {
  id: string;
  name: string;
  minProfit: Decimal | number | string;
  maxProfit: Decimal | number | string | null;
  amountPerPerson: Decimal | number | string;
  numberOfPeople: number;
  active: boolean;
}

export interface DistributionCalculationItem {
  investorId: string | null;
  beneficiaryType: "INVESTOR_EXTERNAL" | "MOTHER_SIBLING" | "OWNER";
  beneficiaryName: string;
  grossProfitAtCalc: Decimal;
  totalUnitCapitalAtCalc: Decimal;
  investorCapitalAtCalc: Decimal | null;
  agreedPercentAtCalc: Decimal | null;
  ruleVersionId: string | null;
  calculatedAmount: Decimal;
  notes?: string;
  returnedCapital?: Decimal; // Pokok modal yang wajib dikembalikan ke investor
}

export interface ProfitDistributionResult {
  isFullyPaid: boolean;
  sellingPrice: Decimal;
  hpp: Decimal;
  grossProfit: Decimal;
  isLoss: boolean;
  totalInvestedCapital: Decimal;
  distributions: DistributionCalculationItem[];
  appliedRule?: RuleData;
}

/**
 * Menghitung distribusi laba/rugi untuk transaksi penjualan unit mobil secara deterministik.
 * Memenuhi PRD.md §4 & ARCHITECTURE.md §4:
 * 1. Hanya dieksekusi jika isFullyPaid = true (SUM(payments) >= sellingPrice).
 * 2. Investor Eksternal (THIRD_PARTY): (modal investor ÷ total modal unit) × persentase akad (0–100).
 * 3. Modal Ibu / 4 Saudara (MOTHER_SIBLING): tier bertingkat dari ProfitShareRule berdasarkan laba unit.
 * 4. Owner: sisa laba bersih unit setelah investor eksternal & saudara.
 * 5. Alur Rugi: Seluruh modal investor kembali 100%, kerugian 100% diserap oleh Owner (calculatedAmount negatif).
 */
export function calculateProfitDistribution(params: {
  sellingPrice: Decimal | number | string;
  paidAmount: Decimal | number | string;
  purchasePrice: Decimal | number | string;
  expenses: ExpenseItem[];
  investments: InvestmentData[];
  rules: RuleData[];
}): ProfitDistributionResult {
  const sellingPrice = new Decimal(params.sellingPrice.toString());
  const paidAmount = new Decimal(params.paidAmount.toString());

  // 1. Validasi Pelunasan
  const isFullyPaid = paidAmount.gte(sellingPrice);
  if (!isFullyPaid) {
    throw new Error(
      `Pembagian laba tidak dapat dieksekusi: Unit belum lunas 100%. Total terbayar: Rp ${paidAmount.toString()}, Harga jual: Rp ${sellingPrice.toString()}`
    );
  }

  // 2. Hitung HPP dan Laba Kotor
  const hpp = calculateHpp(params.purchasePrice, params.expenses);
  const grossProfit = calculateGrossProfit(sellingPrice, hpp);
  const isLoss = grossProfit.lt(0);

  // Total modal yang ditanamkan oleh investor
  const totalInvestedCapital = params.investments.reduce((acc, inv) => {
    return acc.plus(new Decimal(inv.capitalShare.toString()));
  }, new Decimal(0));

  // Basis total modal unit untuk perhitungan proporsi adalah HPP (landed cost)
  // atau total investasi jika lebih besar dari HPP.
  const totalUnitCapital = Decimal.max(hpp, totalInvestedCapital);

  const distributions: DistributionCalculationItem[] = [];

  // =========================================================================
  // SKENARIO 1: RUGI (Gross Profit < 0)
  // =========================================================================
  if (isLoss) {
    // Seluruh investor mendapatkan pokok modalnya kembali 100%, pembagian profit = 0
    for (const inv of params.investments) {
      const cap = new Decimal(inv.capitalShare.toString());
      distributions.push({
        investorId: inv.investorId,
        beneficiaryType: inv.investorType === "MOTHER_SIBLING" ? "MOTHER_SIBLING" : "INVESTOR_EXTERNAL",
        beneficiaryName: inv.investorName,
        grossProfitAtCalc: grossProfit,
        totalUnitCapitalAtCalc: totalUnitCapital,
        investorCapitalAtCalc: cap,
        agreedPercentAtCalc: new Decimal(inv.profitSharePercent.toString()),
        ruleVersionId: null,
        calculatedAmount: new Decimal(0),
        returnedCapital: cap,
        notes: `Unit rugi Rp ${grossProfit.abs().toString()}. Pokok modal dikembalikan 100%.`,
      });
    }

    // Owner menyerap kerugian 100%
    distributions.push({
      investorId: null,
      beneficiaryType: "OWNER",
      beneficiaryName: "Owner (Nur Mobil)",
      grossProfitAtCalc: grossProfit,
      totalUnitCapitalAtCalc: totalUnitCapital,
      investorCapitalAtCalc: totalUnitCapital.minus(totalInvestedCapital),
      agreedPercentAtCalc: null,
      ruleVersionId: null,
      calculatedAmount: grossProfit, // Nilai negatif menunjukkan penyerapan kerugian
      notes: `Owner menyerap 100% kerugian operasional unit.`,
    });

    return {
      isFullyPaid,
      sellingPrice,
      hpp,
      grossProfit,
      isLoss: true,
      totalInvestedCapital,
      distributions,
    };
  }

  // =========================================================================
  // SKENARIO 2: UNTUNG ATAU IMPAS (Gross Profit >= 0)
  // =========================================================================
  let totalDistributedToThirdParties = new Decimal(0);

  // A. Hitung Pembagian Investor Pihak Ketiga (THIRD_PARTY)
  const thirdPartyInvestments = params.investments.filter(
    (inv) => inv.investorType === "THIRD_PARTY"
  );

  for (const inv of thirdPartyInvestments) {
    const cap = new Decimal(inv.capitalShare.toString());
    const percent = new Decimal(inv.profitSharePercent.toString());

    // Formula PRD: (modal investor ÷ total modal unit) × persentase akad (0-100)
    const capitalProportion = totalUnitCapital.gt(0) ? cap.div(totalUnitCapital) : new Decimal(0);
    const agreedFraction = percent.div(100);
    const investorShare = grossProfit.times(capitalProportion).times(agreedFraction).toDecimalPlaces(2);

    totalDistributedToThirdParties = totalDistributedToThirdParties.plus(investorShare);

    distributions.push({
      investorId: inv.investorId,
      beneficiaryType: "INVESTOR_EXTERNAL",
      beneficiaryName: inv.investorName,
      grossProfitAtCalc: grossProfit,
      totalUnitCapitalAtCalc: totalUnitCapital,
      investorCapitalAtCalc: cap,
      agreedPercentAtCalc: percent,
      ruleVersionId: null,
      calculatedAmount: investorShare,
      returnedCapital: cap,
      notes: `Bagi hasil investor eksternal ${percent.toString()}% dari porsi modal (${capitalProportion.times(100).toFixed(1)}%).`,
    });
  }

  // Sisa laba kotor yang tersedia setelah investor pihak ketiga
  const remainingProfitAfterExternal = grossProfit.minus(totalDistributedToThirdParties);

  // B. Hitung Pembagian Modal Ibu Nurdiah / 4 Saudara (MOTHER_SIBLING)
  const familyInvestments = params.investments.filter(
    (inv) => inv.investorType === "MOTHER_SIBLING"
  );

  let totalDistributedToFamily = new Decimal(0);
  let matchedRule: RuleData | undefined = undefined;

  if (familyInvestments.length > 0) {
    // Cari aturan ProfitShareRule yang aktif dan cocok dengan grossProfit unit
    const activeRules = params.rules
      .filter((r) => r.active)
      .sort((a, b) => new Decimal(a.minProfit.toString()).minus(new Decimal(b.minProfit.toString())).toNumber());

    for (const rule of activeRules) {
      const min = new Decimal(rule.minProfit.toString());
      const max = rule.maxProfit !== null ? new Decimal(rule.maxProfit.toString()) : null;

      if (grossProfit.gte(min) && (max === null || grossProfit.lt(max))) {
        matchedRule = rule;
        break;
      }
    }

    if (matchedRule) {
      const amountPerPerson = new Decimal(matchedRule.amountPerPerson.toString());
      const numberOfPeople = matchedRule.numberOfPeople || 4;

      // Buat distribusi per saudara (4 orang)
      for (let s = 1; s <= numberOfPeople; s++) {
        const familyInvId = familyInvestments[0]?.investorId || null;
        totalDistributedToFamily = totalDistributedToFamily.plus(amountPerPerson);

        distributions.push({
          investorId: familyInvId,
          beneficiaryType: "MOTHER_SIBLING",
          beneficiaryName: `Saudara ${s} (Modal Ibu Nurdiah)`,
          grossProfitAtCalc: grossProfit,
          totalUnitCapitalAtCalc: totalUnitCapital,
          investorCapitalAtCalc: new Decimal(familyInvestments[0]?.capitalShare.toString() || 0),
          agreedPercentAtCalc: null,
          ruleVersionId: matchedRule.id,
          calculatedAmount: amountPerPerson,
          returnedCapital: s === 1 ? new Decimal(familyInvestments[0]?.capitalShare.toString() || 0) : undefined,
          notes: `Tier '${matchedRule.name}': Rp ${amountPerPerson.toString()} per saudara.`,
        });
      }
    }
  }

  // C. Sisa Akhir untuk Owner (Nur Mobil)
  const ownerShare = remainingProfitAfterExternal.minus(totalDistributedToFamily);

  distributions.push({
    investorId: null,
    beneficiaryType: "OWNER",
    beneficiaryName: "Owner (Nur Mobil)",
    grossProfitAtCalc: grossProfit,
    totalUnitCapitalAtCalc: totalUnitCapital,
    investorCapitalAtCalc: totalUnitCapital.minus(totalInvestedCapital),
    agreedPercentAtCalc: null,
    ruleVersionId: matchedRule ? matchedRule.id : null,
    calculatedAmount: ownerShare,
    notes: `Laba bersih tersisa untuk operasional & kas Owner Nur Mobil.`,
  });

  return {
    isFullyPaid,
    sellingPrice,
    hpp,
    grossProfit,
    isLoss: false,
    totalInvestedCapital,
    distributions,
    appliedRule: matchedRule,
  };
}
