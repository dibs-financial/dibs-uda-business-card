import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { apply, checkBusinessBookOnly, checkCompany, checkEin, openCompany } from "../src/index.js";
import { company, fresh } from "./helpers.js";

describe("company: business book only", () => {
  it("requires an EIN", () => {
    assert.equal(checkEin("").ok, false);
    assert.equal((checkEin(undefined) as { code: string }).code, "EIN_REQUIRED");
  });

  it("validates EIN shape", () => {
    assert.equal(checkEin("12-3456789").ok, true);
    assert.equal(checkEin("123456789").ok, true);
    assert.equal((checkEin("12-345").ok), false);
    assert.equal((checkEin("ab-cdefghi") as { code: string }).code, "EIN_INVALID");
  });

  it("rejects a personal identifier as a book key", () => {
    const d = checkBusinessBookOnly({ ein: "12-3456789", ssn: "123-45-6789" });
    assert.equal(d.ok, false);
    assert.equal((d as { code: string }).code, "BUSINESS_BOOK_ONLY");
  });

  it("rejects unknown plans", () => {
    const d = checkCompany(company({ plan: "enterprise" as never }));
    assert.equal((d as { code: string }).code, "PLAN_UNKNOWN");
  });

  it("openCompany throws on a company that fails open rules", () => {
    assert.throws(() => openCompany(company({ ein: "" })), /EIN_REQUIRED/);
  });

  it("opens with empty sleeves and no seats", () => {
    const s = fresh();
    assert.equal(s.operating.balanceCents, 0);
    assert.equal(s.card.outstandingCents, 0);
    assert.deepEqual(s.seats, []);
    assert.deepEqual(s.ledger, []);
  });
});

describe("company: entities", () => {
  it("pins every plan to one entity in v0, including Firm", () => {
    for (const plan of ["starter", "build", "firm"] as const) {
      const r = apply(fresh(plan), { type: "add_entity" });
      assert.equal(r.decision.ok, false, plan);
      assert.equal((r.decision as { code: string }).code, "ENTITY_LIMIT");
      assert.equal(r.state.company.entities, 1);
    }
  });
});
