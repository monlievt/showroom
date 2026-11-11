import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { withdrawInvestorCapitalSchema } from "./capital-ledger";

describe("Investor Capital Withdrawal Validation Schema", () => {
  it("menerima input pencairan pokok modal maupun pencairan laba", () => {
    const capitalReturn = withdrawInvestorCapitalSchema.parse({
      investorId: "inv-123",
      amount: 50_000_000,
      withdrawalCategory: "CAPITAL_RETURN",
      withdrawalDate: "2026-11-11",
      notes: "Pengembalian pokok modal unit terjual",
    });
    assert.equal(capitalReturn.amount, 50_000_000);
    assert.equal(capitalReturn.withdrawalCategory, "CAPITAL_RETURN");

    const profitWithdrawal = withdrawInvestorCapitalSchema.parse({
      investorId: "inv-123",
      amount: 7_500_000,
      withdrawalCategory: "PROFIT_WITHDRAWAL",
      proofUrls: ["/uploads/bukti-tf.jpg"],
    });
    assert.equal(profitWithdrawal.withdrawalCategory, "PROFIT_WITHDRAWAL");
    assert.deepEqual(profitWithdrawal.proofUrls, ["/uploads/bukti-tf.jpg"]);
  });

  it("menolak nominal penarikan <= 0 atau ID investor kosong", () => {
    assert.throws(() =>
      withdrawInvestorCapitalSchema.parse({
        investorId: "",
        amount: 0,
      })
    );
  });
});
