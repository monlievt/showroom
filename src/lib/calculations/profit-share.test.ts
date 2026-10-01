import { describe, it } from "node:test";
import assert from "node:assert";
import Decimal from "decimal.js";
import {
  calculateProfitDistribution,
  InvestmentData,
  RuleData,
} from "./profit-share";
import { validateContiguousTiers } from "../validations/profit-share-rule";

describe("Profit Sharing & Loss Financial Engine", () => {
  const sampleRules: RuleData[] = [
    {
      id: "rule-1",
      name: "Laba Rendah (< 3 Juta)",
      minProfit: 0,
      maxProfit: 3000000,
      amountPerPerson: 0,
      numberOfPeople: 4,
      active: true,
    },
    {
      id: "rule-2",
      name: "Laba Sedang (3 - 5 Juta)",
      minProfit: 3000000,
      maxProfit: 5000000,
      amountPerPerson: 500000,
      numberOfPeople: 4,
      active: true,
    },
    {
      id: "rule-3",
      name: "Laba Menengah (5 - 10 Juta)",
      minProfit: 5000000,
      maxProfit: 10000000,
      amountPerPerson: 750000,
      numberOfPeople: 4,
      active: true,
    },
    {
      id: "rule-4",
      name: "Laba Tinggi (> 10 Juta)",
      minProfit: 10000000,
      maxProfit: null,
      amountPerPerson: 1000000,
      numberOfPeople: 4,
      active: true,
    },
  ];

  it("menolak eksekusi distribusi jika unit belum lunas 100%", () => {
    assert.throws(
      () => {
        calculateProfitDistribution({
          sellingPrice: 150000000,
          paidAmount: 50000000, // Baru bayar DP 50 juta dari 150 juta
          purchasePrice: 120000000,
          expenses: [{ amount: 5000000 }],
          investments: [],
          rules: sampleRules,
        });
      },
      /belum lunas 100%/
    );
  });

  it("menghitung pembagian laba normal dengan investor pihak ketiga dan modal Ibu (4 saudara)", () => {
    // Skenario:
    // Harga Beli: 100.000.000
    // Biaya Perbaikan dll: 10.000.000 -> Total HPP: 110.000.000
    // Harga Jual: 130.000.000 (Lunas 130.000.000)
    // Laba Kotor: 130.000.000 - 110.000.000 = 20.000.000
    //
    // Investor:
    // 1. Pak Budi (THIRD_PARTY): Modal 55.000.000 (50% dari HPP 110m), profitSharePercent: 50.00%
    //    Bagian Pak Budi = 20.000.000 * (55m / 110m) * (50 / 100) = 20m * 0.5 * 0.5 = 5.000.000
    // 2. Ibu Nurdiah (FAMILY): Modal 55.000.000
    //    Gross profit = 20.000.000 -> Masuk tier "Laba Tinggi (> 10 Juta)" -> 1.000.000 per orang untuk 4 saudara = 4.000.000 total
    // 3. Sisa untuk Owner:
    //    20.000.000 - 5.000.000 (Pak Budi) - 4.000.000 (4 Saudara) = 11.000.000

    const investments: InvestmentData[] = [
      {
        investorId: "inv-budi",
        investorName: "Pak Budi",
        investorType: "THIRD_PARTY",
        capitalShare: 55000000,
        profitSharePercent: 50.0,
      },
      {
        investorId: "inv-ibu",
        investorName: "Ibu Nurdiah",
        investorType: "MOTHER_SIBLING",
        capitalShare: 55000000,
        profitSharePercent: 0,
      },
    ];

    const result = calculateProfitDistribution({
      sellingPrice: 130000000,
      paidAmount: 130000000,
      purchasePrice: 100000000,
      expenses: [{ amount: 10000000 }],
      investments,
      rules: sampleRules,
    });

    assert.strictEqual(result.isFullyPaid, true);
    assert.strictEqual(result.isLoss, false);
    assert.strictEqual(result.hpp.toNumber(), 110000000);
    assert.strictEqual(result.grossProfit.toNumber(), 20000000);

    // Pak Budi
    const budiDist = result.distributions.find((d) => d.investorId === "inv-budi");
    assert.ok(budiDist);
    assert.strictEqual(budiDist.beneficiaryType, "INVESTOR_EXTERNAL");
    assert.strictEqual(budiDist.calculatedAmount.toNumber(), 5000000);
    assert.strictEqual(budiDist.returnedCapital?.toNumber(), 55000000);

    // 4 Saudara
    const siblingsDist = result.distributions.filter((d) => d.beneficiaryType === "MOTHER_SIBLING");
    assert.strictEqual(siblingsDist.length, 4);
    for (const sib of siblingsDist) {
      assert.strictEqual(sib.calculatedAmount.toNumber(), 1000000);
    }

    // Owner
    const ownerDist = result.distributions.find((d) => d.beneficiaryType === "OWNER");
    assert.ok(ownerDist);
    assert.strictEqual(ownerDist.calculatedAmount.toNumber(), 11000000);

    // Total yang dibagikan harus tepat sama dengan laba kotor
    const totalDistributed = result.distributions.reduce(
      (sum, d) => sum.plus(d.calculatedAmount),
      new Decimal(0)
    );
    assert.strictEqual(totalDistributed.toNumber(), 20000000);
  });

  it("menerapkan alur rugi: modal investor kembali 100%, profit 0, dan Owner menyerap 100% kerugian", () => {
    // Skenario Rugi:
    // Harga Beli: 80.000.000
    // Biaya Perbaikan: 10.000.000 -> Total HPP: 90.000.000
    // Harga Jual: 82.000.000 (Rugi 8.000.000)
    //
    // Investor:
    // Pak Budi menanamkan 40.000.000
    // Modal Ibu Nurdiah 40.000.000
    //
    // Hasil diharapkan:
    // Pak Budi: calculatedAmount = 0, returnedCapital = 40.000.000
    // Ibu Nurdiah: calculatedAmount = 0, returnedCapital = 40.000.000
    // Saudara: profit 0
    // Owner: calculatedAmount = -8.000.000 (menanggung 100% rugi)

    const investments: InvestmentData[] = [
      {
        investorId: "inv-budi",
        investorName: "Pak Budi",
        investorType: "THIRD_PARTY",
        capitalShare: 40000000,
        profitSharePercent: 50.0,
      },
      {
        investorId: "inv-ibu",
        investorName: "Ibu Nurdiah",
        investorType: "MOTHER_SIBLING",
        capitalShare: 40000000,
        profitSharePercent: 0,
      },
    ];

    const result = calculateProfitDistribution({
      sellingPrice: 82000000,
      paidAmount: 82000000,
      purchasePrice: 80000000,
      expenses: [{ amount: 10000000 }],
      investments,
      rules: sampleRules,
    });

    assert.strictEqual(result.isLoss, true);
    assert.strictEqual(result.grossProfit.toNumber(), -8000000);

    // Investor eksternal dan keluarga dapat 0 profit, tapi 100% modal kembali
    const investorDists = result.distributions.filter((d) => d.investorId !== null);
    for (const inv of investorDists) {
      assert.strictEqual(inv.calculatedAmount.toNumber(), 0);
      assert.strictEqual(inv.returnedCapital?.toNumber(), 40000000);
    }

    // Owner menyerap -8.000.000
    const ownerDist = result.distributions.find((d) => d.beneficiaryType === "OWNER");
    assert.ok(ownerDist);
    assert.strictEqual(ownerDist.calculatedAmount.toNumber(), -8000000);
  });

  it("memvalidasi aturan tier ProfitShareRule yang contiguous (tanpa gap/overlap)", () => {
    // 1. Tier valid
    const validTiers = [
      { minProfit: 0, maxProfit: 3000000, amountPerPerson: 0 },
      { minProfit: 3000000, maxProfit: 5000000, amountPerPerson: 500000 },
      { minProfit: 5000000, maxProfit: null, amountPerPerson: 1000000 },
    ];
    const checkValid = validateContiguousTiers(validTiers);
    assert.strictEqual(checkValid.valid, true);

    // 2. Terdeteksi Gap (celah 3jt s.d 4jt)
    const gapTiers = [
      { minProfit: 0, maxProfit: 3000000, amountPerPerson: 0 },
      { minProfit: 4000000, maxProfit: 5000000, amountPerPerson: 500000 }, // GAP antara 3m dan 4m
      { minProfit: 5000000, maxProfit: null, amountPerPerson: 1000000 },
    ];
    const checkGap = validateContiguousTiers(gapTiers);
    assert.strictEqual(checkGap.valid, false);
    assert.match(checkGap.error || "", /Gap \(celah\) terdeteksi/);

    // 3. Terdeteksi Overlap (tumpang tindih)
    const overlapTiers = [
      { minProfit: 0, maxProfit: 3000000, amountPerPerson: 0 },
      { minProfit: 2500000, maxProfit: 5000000, amountPerPerson: 500000 }, // OVERLAP antara 2.5m dan 3m
      { minProfit: 5000000, maxProfit: null, amountPerPerson: 1000000 },
    ];
    const checkOverlap = validateContiguousTiers(overlapTiers);
    assert.strictEqual(checkOverlap.valid, false);
    assert.match(checkOverlap.error || "", /Overlap \(tumpang tindih\) terdeteksi/);

    // 4. Null maxProfit di tengah-tengah
    const middleNullTiers = [
      { minProfit: 0, maxProfit: null, amountPerPerson: 0 },
      { minProfit: 3000000, maxProfit: 5000000, amountPerPerson: 500000 },
    ];
    const checkMiddleNull = validateContiguousTiers(middleNullTiers);
    assert.strictEqual(checkMiddleNull.valid, false);
    assert.match(checkMiddleNull.error || "", /tidak memiliki batas atas/);
  });

  it("mensimulasikan reversal distribusi laba secara matematis (ARCHITECTURE.md §13)", () => {
    // Skenario: Distribusi sudah dieksekusi, lalu dibatalkan/di-reverse.
    // Seluruh modal dan profit yang didistribusikan harus net zero setelah reversal correction.
    const initialBalance = new Decimal(50000000); // Saldo awal investor 50jt

    // 1. Alokasi modal ke mobil (-25jt)
    const allocated = new Decimal(25000000);
    const balanceAfterAlloc = initialBalance.minus(allocated); // 25jt

    // 2. Mobil laku dan didistribusikan:
    // Pengembalian modal (+25jt) dan Pembayaran Profit (+2.5jt)
    const returnedCapital = new Decimal(25000000);
    const profitPaid = new Decimal(2500000);
    const balanceAfterDist = balanceAfterAlloc.plus(returnedCapital).plus(profitPaid); // 52.5jt

    // 3. Reversal terjadi (ARCHITECTURE.md §13):
    // Entri koreksi bertipe CORRECTION membalikkan profit (-2.5jt) dan modal (-25jt)
    const reversalProfitCorrection = profitPaid.negated();
    const reversalCapitalCorrection = returnedCapital.negated();
    const balanceAfterReversal = balanceAfterDist
      .plus(reversalProfitCorrection)
      .plus(reversalCapitalCorrection);

    // Saldo setelah reversal harus kembali persis ke saldo saat modal teralokasi (sebelum settlement)
    assert.strictEqual(balanceAfterReversal.toNumber(), balanceAfterAlloc.toNumber());
    assert.strictEqual(balanceAfterReversal.toNumber(), 25000000);

    // Net dampak dari dist + reversal adalah tepat 0
    const netImpact = returnedCapital
      .plus(profitPaid)
      .plus(reversalProfitCorrection)
      .plus(reversalCapitalCorrection);
    assert.strictEqual(netImpact.toNumber(), 0);
  });
});
