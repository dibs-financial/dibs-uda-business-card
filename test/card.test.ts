import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { apply, applyAll, type Command, type State } from "../src/index.js";
import { fresh } from "./helpers.js";

const teamSeat: Command = { type: "add_seat", seatKind: "team", id: "t1", label: "Ops", role: "contractor", token: "tok_t1" };
const opSeat: Command = { type: "add_seat", seatKind: "operator", id: "op1", name: "Pat", role: "managing_partner", documentRef: "doc-1" };

function seated(): State {
  return applyAll(fresh(), [opSeat, teamSeat, { type: "deposit", amountCents: 10_000, source: "owner_cash" }]).state;
}

describe("card: authorizations", () => {
  it("an active team token can spend", () => {
    const r = apply(seated(), { type: "card_auth", amountCents: 2_500, seatId: "t1", merchant: "Office Depot" });
    assert.equal(r.decision.ok, true);
    assert.equal(r.state.card.outstandingCents, 2_500);
  });

  it("an operator can spend", () => {
    const r = apply(seated(), { type: "card_auth", amountCents: 2_500, seatId: "op1", merchant: "Office Depot" });
    assert.equal(r.decision.ok, true);
  });

  it("the card is not the deposit: Operating is untouched by a card auth", () => {
    const r = apply(seated(), { type: "card_auth", amountCents: 2_500, seatId: "t1", merchant: "Office Depot" });
    assert.equal(r.state.operating.balanceCents, 10_000);
  });

  it("burn ends the seat: a burned token is declined", () => {
    const burned = apply(seated(), { type: "burn_seat", seatId: "t1" }).state;
    const r = apply(burned, { type: "card_auth", amountCents: 100, seatId: "t1", merchant: "Anywhere" });
    assert.equal((r.decision as { code: string }).code, "CARD_SEAT_INACTIVE");
    assert.equal(r.state.card.outstandingCents, 0);
  });

  it("an unknown seat is declined", () => {
    const r = apply(seated(), { type: "card_auth", amountCents: 100, seatId: "ghost", merchant: "Anywhere" });
    assert.equal((r.decision as { code: string }).code, "SEAT_NOT_FOUND");
  });
});

describe("card: refunds", () => {
  it("refunds return to Operating", () => {
    const spent = apply(seated(), { type: "card_auth", amountCents: 2_500, seatId: "t1", merchant: "Office Depot" }).state;
    const r = apply(spent, { type: "card_refund", amountCents: 2_500, seatId: "t1", merchant: "Office Depot" });
    assert.equal(r.decision.ok, true);
    assert.equal(r.state.card.outstandingCents, 0);
    assert.equal(r.state.operating.balanceCents, 12_500);
    assert.equal(r.state.ledger.at(-1)?.type, "card_refund");
  });

  it("a refund cannot exceed card outstanding", () => {
    const spent = apply(seated(), { type: "card_auth", amountCents: 2_500, seatId: "t1", merchant: "Office Depot" }).state;
    const r = apply(spent, { type: "card_refund", amountCents: 2_501, seatId: "t1", merchant: "Office Depot" });
    assert.equal((r.decision as { code: string }).code, "CARD_REFUND_EXCEEDS_OUTSTANDING");
  });

  it("a refund on a burned seat still returns to Operating", () => {
    const spent = apply(seated(), { type: "card_auth", amountCents: 2_500, seatId: "t1", merchant: "Office Depot" }).state;
    const burned = apply(spent, { type: "burn_seat", seatId: "t1" }).state;
    const r = apply(burned, { type: "card_refund", amountCents: 2_500, seatId: "t1", merchant: "Office Depot" });
    assert.equal(r.decision.ok, true);
    assert.equal(r.state.operating.balanceCents, 12_500);
  });
});
