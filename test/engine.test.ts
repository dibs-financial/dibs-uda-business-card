import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { apply, applyAll, evaluate } from "../src/index.js";
import { fresh } from "./helpers.js";

describe("engine", () => {
  it("evaluate never mutates state", () => {
    const s = fresh();
    const before = JSON.stringify(s);
    evaluate(s, { type: "deposit", amountCents: 100, source: "owner_cash" });
    assert.equal(JSON.stringify(s), before);
  });

  it("apply returns the same state object on a decline", () => {
    const s = fresh();
    const r = apply(s, { type: "deposit", amountCents: -1, source: "owner_cash" });
    assert.equal(r.decision.ok, false);
    assert.equal(r.state, s);
  });

  it("apply returns a new state object on allow and leaves the input untouched", () => {
    const s = fresh();
    const r = apply(s, { type: "deposit", amountCents: 100, source: "owner_cash" });
    assert.notEqual(r.state, s);
    assert.equal(s.operating.balanceCents, 0);
    assert.equal(r.state.operating.balanceCents, 100);
  });

  it("applyAll stops at the first decline and reports how many applied", () => {
    const r = applyAll(fresh(), [
      { type: "deposit", amountCents: 100, source: "owner_cash" },
      { type: "deposit", amountCents: 0, source: "owner_cash" },
      { type: "deposit", amountCents: 100, source: "owner_cash" },
    ]);
    assert.equal(r.applied, 1);
    assert.equal(r.decision.ok, false);
    assert.equal(r.state.operating.balanceCents, 100);
  });

  it("uses the supplied timestamp on ledger entries", () => {
    const r = apply(fresh(), { type: "deposit", amountCents: 100, source: "owner_cash", at: "2026-09-21T12:00:00Z" });
    assert.equal(r.state.ledger[0]?.at, "2026-09-21T12:00:00Z");
  });
});
