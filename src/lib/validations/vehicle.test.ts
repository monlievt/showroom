import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createVehicleSchema } from "./vehicle";

const baseVehiclePayload = {
  plateNumber: " b 1275 dks ",
  brand: "Toyota",
  model: "Avanza E",
  year: 2022,
  color: "Hitam Metalik",
  odometer: 24000,
  transmission: "MANUAL" as const,
  engineCapacity: 1300,
  purchasePrice: 145_000_000,
  purchaseDate: "2026-10-07",
};

describe("Vehicle Intake Validation & Investor Funding Schema", () => {
  it("menerima input unit kas showroom tanpa array investments", () => {
    const parsed = createVehicleSchema.parse(baseVehiclePayload);
    assert.equal(parsed.plateNumber, "B 1275 DKS");
    assert.deepEqual(parsed.investments, []);
  });

  it("menerima alokasi pemodal saat intake unit baru", () => {
    const parsed = createVehicleSchema.parse({
      ...baseVehiclePayload,
      investments: [
        {
          investorId: "inv-1",
          capitalShare: 100_000_000,
          profitSharePercent: 50,
        },
      ],
    });
    assert.equal(parsed.investments.length, 1);
    assert.equal(parsed.investments[0].investorId, "inv-1");
    assert.equal(parsed.investments[0].capitalShare, 100_000_000);
    assert.equal(parsed.investments[0].profitSharePercent, 50);
  });

  it("menolak alokasi pemodal dengan nominal <= 0 atau tanpa ID pemodal", () => {
    assert.throws(() =>
      createVehicleSchema.parse({
        ...baseVehiclePayload,
        investments: [
          {
            investorId: "",
            capitalShare: 0,
            profitSharePercent: 50,
          },
        ],
      })
    );
  });
});

