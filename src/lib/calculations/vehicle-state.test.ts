import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canTransition } from "./vehicle-state";

describe("Vehicle State Machine — canTransition", () => {
  it("mengizinkan transisi maju normal", () => {
    assert.equal(canTransition("INTAKE", "IN_REPAIR"), true);
    assert.equal(canTransition("IN_REPAIR", "READY_FOR_SALE"), true);
    assert.equal(canTransition("READY_FOR_SALE", "BOOKED"), true);
    assert.equal(canTransition("BOOKED", "SOLD_SETTLED"), true);
  });

  it("mengizinkan transisi showroom pending", () => {
    assert.equal(canTransition("READY_FOR_SALE", "AT_SHOWROOM_PENDING"), true);
    assert.equal(canTransition("AT_SHOWROOM_PENDING", "SOLD_SETTLED"), true);
  });

  it("mengizinkan pembatalan booking atau tarik showroom kembali ke ready", () => {
    // Booking batal / leasing ditolak
    assert.equal(canTransition("BOOKED", "READY_FOR_SALE"), true);
    // Unit ditarik dari showroom rekanan jika tidak laku
    assert.equal(canTransition("AT_SHOWROOM_PENDING", "READY_FOR_SALE"), true);
  });

  it("mengizinkan status yang sama (idempotent)", () => {
    assert.equal(canTransition("READY_FOR_SALE", "READY_FOR_SALE"), true);
    assert.equal(canTransition("IN_REPAIR", "IN_REPAIR"), true);
  });

  it("menolak lompatan status ilegal", () => {
    // Lompat langsung dari intake ke jual
    assert.equal(canTransition("INTAKE", "SOLD_SETTLED"), false);
    assert.equal(canTransition("INTAKE", "READY_FOR_SALE"), false);
    assert.equal(canTransition("IN_REPAIR", "SOLD_SETTLED"), false);
  });

  it("menolak transisi mundur ilegal", () => {
    // Sudah lunas tidak boleh mundur
    assert.equal(canTransition("SOLD_SETTLED", "IN_REPAIR"), false);
    assert.equal(canTransition("SOLD_SETTLED", "READY_FOR_SALE"), false);
    // Dari booking tidak boleh mundur ke intake
    assert.equal(canTransition("BOOKED", "INTAKE"), false);
    assert.equal(canTransition("BOOKED", "IN_REPAIR"), false);
  });
});
