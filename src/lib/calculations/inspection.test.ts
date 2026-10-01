import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getPaintMicronCategory, PANEL_LABELS } from "./inspection";

describe("Inspection Engine — Paint Micron Calculation", () => {
  it("mengkategorikan ketebalan cat di bawah 120 mikron sebagai ORIGINAL", () => {
    assert.equal(getPaintMicronCategory(85), "ORIGINAL");
    assert.equal(getPaintMicronCategory(119), "ORIGINAL");
  });

  it("mengkategorikan ketebalan cat 120-200 mikron sebagai REPAINT", () => {
    assert.equal(getPaintMicronCategory(120), "REPAINT");
    assert.equal(getPaintMicronCategory(165), "REPAINT");
    assert.equal(getPaintMicronCategory(200), "REPAINT");
  });

  it("mengkategorikan ketebalan cat di atas 200 mikron sebagai THICK_FILLER (dempul tebal)", () => {
    assert.equal(getPaintMicronCategory(201), "THICK_FILLER");
    assert.equal(getPaintMicronCategory(350), "THICK_FILLER");
  });

  it("memiliki 11 panel body lengkap dengan label bahasa Indonesia", () => {
    const keys = Object.keys(PANEL_LABELS);
    assert.equal(keys.length, 11);
    assert.ok(keys.includes("FENDER_FRONT_RIGHT"));
    assert.ok(keys.includes("FENDER_FRONT_LEFT"));
    assert.ok(keys.includes("HOOD"));
    assert.ok(keys.includes("ROOF"));
  });

  it("mengkalibrasi ketebalan cat khusus Wuling (lapisan primer/clearcoat lebih tebal)", () => {
    // 145 µm di Wuling adalah ORIGINAL pabrik (standar s/d 160 µm)
    assert.equal(getPaintMicronCategory(145, "Wuling"), "ORIGINAL");
    // Namun 145 µm di Toyota adalah REPAINT (standar pabrik <= 120 µm)
    assert.equal(getPaintMicronCategory(145, "Toyota"), "REPAINT");
    // Di atas 240 µm di Wuling terindikasi DEMPUL
    assert.equal(getPaintMicronCategory(250, "Wuling"), "THICK_FILLER");
  });

  it("mengkalibrasi ketebalan cat mobil Eropa (BMW / Mercedes-Benz)", () => {
    // 150 µm di BMW adalah ORIGINAL
    assert.equal(getPaintMicronCategory(150, "BMW"), "ORIGINAL");
    assert.equal(getPaintMicronCategory(150, "Mercedes-Benz"), "ORIGINAL");
    assert.equal(getPaintMicronCategory(210, "BMW"), "REPAINT");
    assert.equal(getPaintMicronCategory(260, "BMW"), "THICK_FILLER");
  });

  it("mengkalibrasi ketebalan cat kendaraan niaga / pick-up (lapisan tipis fungsional)", () => {
    // 110 µm di GranMax atau Carry sudah REPAINT (standar pabrik <= 100 µm)
    assert.equal(getPaintMicronCategory(80, "GranMax"), "ORIGINAL");
    assert.equal(getPaintMicronCategory(110, "GranMax"), "REPAINT");
    assert.equal(getPaintMicronCategory(170, "Carry"), "THICK_FILLER");
  });

  it("mendeteksi tipe bodi kendaraan secara akurat (HATCHBACK, MPV_SUV, SEDAN, PICKUP)", () => {
    const { detectBodyType } = require("./inspection");
    assert.equal(detectBodyType("Brio RS", "Honda"), "HATCHBACK");
    assert.equal(detectBodyType("Yaris GR", "Toyota"), "HATCHBACK");
    assert.equal(detectBodyType("Innova Reborn 2.4 G", "Toyota"), "MPV_SUV");
    assert.equal(detectBodyType("Pajero Sport Dakar", "Mitsubishi"), "MPV_SUV");
    assert.equal(detectBodyType("Vios E", "Toyota"), "SEDAN");
    assert.equal(detectBodyType("Civic Turbo", "Honda"), "SEDAN");
    assert.equal(detectBodyType("GranMax PU 1.5", "Daihatsu"), "PICKUP");
    assert.equal(detectBodyType("Carry Pick Up", "Suzuki"), "PICKUP");
  });

  it("menghitung rata-rata 3 titik dan mendeteksi kondisi cat belang (IBID ACV Formula)", () => {
    const { calculateMultiPointAnalysis } = require("./inspection");
    // Kasus Kap Mesin: 172, 168, 204 -> Rata-rata 181.3, Delta = 36 (> 30 -> Belang!)
    const hood = calculateMultiPointAnalysis([172, 168, 204]);
    assert.equal(hood.average, 181.3);
    assert.equal(hood.delta, 36);
    assert.equal(hood.isBelang, true);

    // Kasus Pintu Rata & Normal: 102, 105, 108 -> Rata-rata 105, Delta = 6 (<= 30 -> Tidak Belang)
    const door = calculateMultiPointAnalysis([102, 105, 108]);
    assert.equal(door.average, 105);
    assert.equal(door.delta, 6);
    assert.equal(door.isBelang, false);

    // Kasus Atap 4 Titik: 109, 96.1, 101, 112 -> Rata-rata 104.5, Delta = 15.9
    const roof = calculateMultiPointAnalysis([109, 96.1, 101, 112]);
    assert.equal(roof.average, 104.5);
    assert.equal(roof.delta, 15.9);
    assert.equal(roof.isBelang, false);
  });

  it("menghitung metrik rata-rata keseluruhan bodi mobil (Overall Vehicle Average)", () => {
    const { calculateOverallVehiclePaint } = require("./inspection");
    const samplePanels = [
      { panelType: "HOOD", pointRight: 102, pointCenter: 105, pointLeft: 108 },
      { panelType: "ROOF", pointRight: 98, pointCenter: 100, pointLeft: 102 },
      { panelType: "FENDER_FRONT_RIGHT", pointRight: 110, pointCenter: 112, pointLeft: 114 },
    ];
    const stats = calculateOverallVehiclePaint(samplePanels, "Toyota");
    assert.equal(stats.totalPoints, 9);
    assert.equal(stats.overallAverage, 105.7);
    assert.equal(stats.overallCondition, "ORIGINAL_FACTORY");
    assert.equal(stats.belangPanelsCount, 0);
  });
});
