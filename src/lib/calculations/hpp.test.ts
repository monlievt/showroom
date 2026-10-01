import { describe, it } from "node:test";
import assert from "node:assert/strict";
import Decimal from "decimal.js";
import {
  calculateHpp,
  calculateGrossProfit,
  calculateDaysInInventory,
  getInventoryAgingCategory,
} from "./hpp";

describe("Financial Engine — HPP & Gross Profit Calculation", () => {
  it("menghitung HPP dengan akurat tanpa floating point error", () => {
    const purchasePrice = "125000000";
    const expenses = [
      { amount: "2500000" }, // transport & lelang
      { amount: "1250000.50" }, // servis oli
      { amount: "3500000" }, // cat bodi
    ];

    const hpp = calculateHpp(purchasePrice, expenses);
    // 125.000.000 + 2.500.000 + 1.250.000.50 + 3.500.000 = 132.250.000.50
    assert.equal(hpp.toString(), "132250000.5");
  });

  it("menghitung Laba Kotor (Gross Profit)", () => {
    const hpp = new Decimal("132250000");
    const sellingPrice = new Decimal("145000000");

    const profit = calculateGrossProfit(sellingPrice, hpp);
    assert.equal(profit.toString(), "12750000");
  });

  it("menghitung kerugian secara presisi (hasil negatif)", () => {
    const hpp = new Decimal("130000000");
    const sellingPrice = new Decimal("122000000"); // jual rugi / cut loss

    const profit = calculateGrossProfit(sellingPrice, hpp);
    assert.equal(profit.toString(), "-8000000");
  });

  it("mendeteksi kategori umur unit di inventori", () => {
    assert.equal(getInventoryAgingCategory(10), "FRESH");
    assert.equal(getInventoryAgingCategory(14), "FRESH");
    assert.equal(getInventoryAgingCategory(25), "NORMAL");
    assert.equal(getInventoryAgingCategory(45), "NORMAL");
    assert.equal(getInventoryAgingCategory(46), "WARNING_STAGNANT");
    assert.equal(getInventoryAgingCategory(80), "WARNING_STAGNANT");
  });

  it("menghitung jumlah hari sejak tanggal pembelian", () => {
    const now = new Date("2026-10-15T00:00:00Z");
    const purchaseDate = new Date("2026-09-01T00:00:00Z"); // 44 hari

    const days = calculateDaysInInventory(purchaseDate, now);
    assert.equal(days, 44);
  });
});
