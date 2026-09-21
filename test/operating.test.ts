import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { apply, applyAll, type Command, type State } from "../src/index.js";
import { fresh } from "./helpers.js";

const vendor: Command = { type: "add_payee", id: "p_vendor", name: "Acme Supply Co", kind: "vendor", approved: true };
const settlement: Command = { type: "add_payee", id: "p_settle", name: "Title & Settlement Office", kind: "settlement_office", approved: true };
const person: Command = { type: "add_payee", id: "p_person", name: "Cousin Ray", kind: "person", approved: true };
const unapproved: Command = { type: "add_payee", id: "p_pending", name: "New Vendor LLC", kind: "vendor", approved: false };

function funded(cents = 100_000): State {
  return applyAll(fresh(), [vendor, settlement, person, unapproved, { type: "deposit", amountCents: cents, source: "owner_cash", at: "2026-09-21T00:00:00Z" }]).state;
}

describe("operating: deposits", () => {
  it("owner cash deposits into Operating", () => {
    const r = apply(fresh(), { type: "deposit", amountCents: 5_000, source: "owner_cash" });
    assert.equal(r.decision.ok, true);
    assert.equal(r.state.operating.balanceCents, 5_000);
    assert.equal(r.state.ledger[0]?.type, "deposit");
  });

  it("rejects other deposit sources", () => {
    const r = apply(fresh(), { type: "deposit", amountCents: 5_000, source: "card_advance" });
    assert.equal((r.decision as { code: string }).code, "DEPOSIT_SOURCE_INVALID");
  });

  it("rejects zero, negative, and fractional amounts", () => {
    for (const amountCents of [0, -1, 10.5, Number.NaN]) {
      const r = apply(fresh(), { type: "deposit", amountCents, source: "owner_cash" });
      assert.equal((r.decision as { code: string }).code, "AMOUNT_INVALID", String(amountCents));
    }
  });
});

describe("operating: outbound transfers", () => {
  it("leaves Operating to an approved vendor over ACH", () => {
    const r = apply(funded(), { type: "transfer_out", amountCents: 40_000, sleeve: "operating", payeeId: "p_vendor", rail: "ach" });
    assert.equal(r.decision.ok, true);
    assert.equal(r.state.operating.balanceCents, 60_000);
  });

  it("settlement offices are valid payees", () => {
    const r = apply(funded(), { type: "transfer_out", amountCents: 1_000, sleeve: "operating", payeeId: "p_settle", rail: "ach" });
    assert.equal(r.decision.ok, true);
  });

  it("outbound leaves Operating, not the card", () => {
    const r = apply(funded(), { type: "transfer_out", amountCents: 1_000, sleeve: "card", payeeId: "p_vendor", rail: "ach" });
    assert.equal((r.decision as { code: string }).code, "TRANSFER_SOURCE_MUST_BE_OPERATING");
  });

  it("payee lock: unapproved payee is declined", () => {
    const r = apply(funded(), { type: "transfer_out", amountCents: 1_000, sleeve: "operating", payeeId: "p_pending", rail: "ach" });
    assert.equal((r.decision as { code: string }).code, "PAYEE_LOCKED");
  });

  it("payee lock: unknown payee is declined", () => {
    const r = apply(funded(), { type: "transfer_out", amountCents: 1_000, sleeve: "operating", payeeId: "nope", rail: "ach" });
    assert.equal((r.decision as { code: string }).code, "PAYEE_NOT_FOUND");
  });

  it("payee must look like a real vendor or settlement office", () => {
    const r = apply(funded(), { type: "transfer_out", amountCents: 1_000, sleeve: "operating", payeeId: "p_person", rail: "ach" });
    assert.equal((r.decision as { code: string }).code, "PAYEE_NOT_VENDOR");
  });

  it("bank wires wait on a sponsor bank", () => {
    const r = apply(funded(), { type: "transfer_out", amountCents: 1_000, sleeve: "operating", payeeId: "p_vendor", rail: "wire" });
    assert.equal((r.decision as { code: string }).code, "WIRE_WAITS_ON_SPONSOR_BANK");
    assert.equal(r.state.operating.balanceCents, 100_000);
  });

  it("cannot overdraw Operating", () => {
    const r = apply(funded(1_000), { type: "transfer_out", amountCents: 1_001, sleeve: "operating", payeeId: "p_vendor", rail: "ach" });
    assert.equal((r.decision as { code: string }).code, "OPERATING_INSUFFICIENT");
  });
});

describe("operating: returns", () => {
  it("a returned transfer posts back to Operating", () => {
    const out = apply(funded(), { type: "transfer_out", amountCents: 40_000, sleeve: "operating", payeeId: "p_vendor", rail: "ach" }).state;
    const r = apply(out, { type: "transfer_return", amountCents: 40_000, payeeId: "p_vendor" });
    assert.equal(r.decision.ok, true);
    assert.equal(r.state.operating.balanceCents, 100_000);
    assert.equal(r.state.ledger.at(-1)?.type, "transfer_return");
  });

  it("a return cannot exceed what was sent to that payee", () => {
    const out = apply(funded(), { type: "transfer_out", amountCents: 40_000, sleeve: "operating", payeeId: "p_vendor", rail: "ach" }).state;
    const r = apply(out, { type: "transfer_return", amountCents: 40_001, payeeId: "p_vendor" });
    assert.equal((r.decision as { code: string }).code, "RETURN_WITHOUT_TRANSFER");
    const other = apply(out, { type: "transfer_return", amountCents: 1, payeeId: "p_settle" });
    assert.equal((other.decision as { code: string }).code, "RETURN_WITHOUT_TRANSFER");
  });
});
