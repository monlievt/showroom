import { describe, it } from "node:test";
import assert from "node:assert/strict";
import Decimal from "decimal.js";
import { 
  calculateSaleSettlement, 
  getReceivableDueDateStatus, 
  terbilangRupiah 
} from "./sale";

describe("Sales & Payment Ledger Calculation", () => {
  it("menghitung pelunasan bertahap (DP + Cicilan 1 + Pelunasan)", () => {
    const sellingPrice = "165000000";
    const payments = [
      { amount: "15000000" },  // DP Tanda Jadi
      { amount: "50000000" },  // Cicilan 1
      { amount: "100000000" }, // Pelunasan
    ];

    const result = calculateSaleSettlement(sellingPrice, payments);
    assert.equal(result.paidAmount.toString(), "165000000");
    assert.equal(result.remainingAmount.toString(), "0");
    assert.equal(result.isFullyPaid, true);
    assert.equal(result.percentagePaid, 100);
  });

  it("menghitung sisa piutang jika belum lunas", () => {
    const sellingPrice = "200000000";
    const payments = [
      { amount: "30000000" }, // DP saja
    ];

    const result = calculateSaleSettlement(sellingPrice, payments);
    assert.equal(result.paidAmount.toString(), "30000000");
    assert.equal(result.remainingAmount.toString(), "170000000");
    assert.equal(result.isFullyPaid, false);
    assert.equal(result.percentagePaid, 15);
  });

  it("mendeteksi status jatuh tempo piutang", () => {
    const now = new Date("2026-10-10T12:00:00Z");

    // Overdue (lewat 2 hari)
    const overdue = getReceivableDueDateStatus(new Date("2026-10-08T00:00:00Z"), now);
    assert.equal(overdue.status, "OVERDUE");

    // Due Soon (H-2)
    const dueSoon = getReceivableDueDateStatus(new Date("2026-10-12T00:00:00Z"), now);
    assert.equal(dueSoon.status, "DUE_SOON");

    // On Schedule (H-15)
    const onSchedule = getReceivableDueDateStatus(new Date("2026-10-25T00:00:00Z"), now);
    assert.equal(onSchedule.status, "ON_SCHEDULE");
  });

  it("mengkonversi angka ke kalimat terbilang Rupiah untuk kwitansi resmi", () => {
    assert.equal(terbilangRupiah(150000000), "Seratus Lima Puluh Juta Rupiah");
    assert.equal(terbilangRupiah(25500000), "Dua Puluh Lima Juta Lima Ratus Ribu Rupiah");
    assert.equal(terbilangRupiah(1750000), "Satu Juta Tujuh Ratus Lima Puluh Ribu Rupiah");
  });
});
