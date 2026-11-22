import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  normalizePlateNumber,
  stripPlateSpaces,
  cleanVehicleModel,
  formatVehicleTitle,
  sanitizeActionError,
} from "./utils";
import { cleanNumber } from "./utils/spreadsheet-parser";

describe("Data Normalization & Error Sanitizer", () => {
  it("menyeragamkan plat nomor Indonesia ke format spasi konsisten", () => {
    assert.equal(normalizePlateNumber("B1277DKS"), "B 1277 DKS");
    assert.equal(normalizePlateNumber(" b 1471 nzs "), "B 1471 NZS");
    assert.equal(normalizePlateNumber("AG2737EFF"), "AG 2737 EFF");
    assert.equal(normalizePlateNumber("DD1271YA"), "DD 1271 YA");
    assert.equal(normalizePlateNumber("D-1607-AHC"), "D 1607 AHC");
    assert.equal(stripPlateSpaces("B 1277 DKS"), "B1277DKS");
  });

  it("membersihkan duplikasi merk, typo merk, dan tahun ganda pada nama unit", () => {
    assert.equal(
      cleanVehicleModel("SUZUKI", "SUZUKI ERTIGA DIESEL 2016", 2016),
      "Ertiga Diesel"
    );
    assert.equal(
      formatVehicleTitle("SUZUKI", "SUZUKI ERTIGA DIESEL 2016", 2016),
      "Suzuki Ertiga Diesel (2016)"
    );
    assert.equal(
      formatVehicleTitle("HONDA", "HONSA VARIO 160 2024", 2024),
      "Honda Vario 160 (2024)"
    );
    assert.equal(
      formatVehicleTitle("HYUNDAI", "HYUNDAI STARGAZER TREND MT 2023", 2023),
      "Hyundai Stargazer Trend MT (2023)"
    );
  });

  it("mem-parse angka spreadsheet baik format titik maupun koma ribuan", () => {
    assert.equal(cleanNumber("150.000.000"), 150000000);
    assert.equal(cleanNumber("150,000,000"), 150000000);
    assert.equal(cleanNumber("Rp 75.011.000"), 75011000);
    assert.equal(cleanNumber("150.000.000,50"), 150000000.5);
  });

  it("mengubah error teknis Prisma menjadi pesan ramah pengguna", () => {
    const msg = sanitizeActionError(
      new Error(
        "Invalid prisma.sale.create() invocation: Unique constraint failed on the constraint: Sale_vehicleId_key"
      )
    );
    assert.ok(!msg.includes("prisma"));
    assert.ok(msg.toLowerCase().includes("penjualan aktif"));
  });
});
