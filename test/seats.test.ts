import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { apply, applyAll, PLANS, type Command } from "../src/index.js";
import { fresh } from "./helpers.js";

const operator = (id: string): Command => ({
  type: "add_seat",
  seatKind: "operator",
  id,
  name: `Operator ${id}`,
  role: "co_founder",
  documentRef: "operating-agreement-2026-01",
});

const team = (id: string): Command => ({
  type: "add_seat",
  seatKind: "team",
  id,
  label: `Team ${id}`,
  role: "employee",
  token: `tok_${id}`,
});

describe("seats: operator", () => {
  it("adds a documented co-founder or managing partner", () => {
    const r = apply(fresh(), operator("op1"));
    assert.equal(r.decision.ok, true);
    assert.equal(r.state.seats.length, 1);
    assert.equal(r.state.seats[0]?.kind, "operator");
  });

  it("requires documentation", () => {
    const r = apply(fresh(), { type: "add_seat", seatKind: "operator", id: "op1", name: "X", role: "co_founder" });
    assert.equal((r.decision as { code: string }).code, "OPERATOR_NOT_DOCUMENTED");
    assert.equal(r.state.seats.length, 0);
  });

  it("rejects roles other than co-founder or managing partner", () => {
    const r = apply(fresh(), { ...operator("op1"), role: "intern" as never } as Command);
    assert.equal((r.decision as { code: string }).code, "OPERATOR_ROLE_INVALID");
  });

  it("enforces the plan operator limit", () => {
    for (const plan of ["starter", "build", "firm"] as const) {
      const limit = PLANS[plan].operators;
      const cmds = Array.from({ length: limit + 1 }, (_, i) => operator(`op${i}`));
      const r = applyAll(fresh(plan), cmds);
      assert.equal(r.applied, limit, plan);
      assert.equal((r.decision as { code: string }).code, "OPERATOR_LIMIT");
    }
  });

  it("operators do not burn", () => {
    const s = apply(fresh(), operator("op1")).state;
    const r = apply(s, { type: "burn_seat", seatId: "op1" });
    assert.equal((r.decision as { code: string }).code, "SEAT_NOT_BURNABLE");
  });
});

describe("seats: team", () => {
  it("adds an employee or contractor with a token", () => {
    const r = apply(fresh(), team("t1"));
    assert.equal(r.decision.ok, true);
    assert.equal(r.state.seats[0]?.kind, "team");
  });

  it("rejects roles other than employee or contractor", () => {
    const r = apply(fresh(), { ...team("t1"), role: "spouse" as never } as Command);
    assert.equal((r.decision as { code: string }).code, "TEAM_ROLE_INVALID");
  });

  it("enforces the plan team limit", () => {
    for (const plan of ["starter", "build", "firm"] as const) {
      const limit = PLANS[plan].team;
      const cmds = Array.from({ length: limit + 1 }, (_, i) => team(`t${i}`));
      const r = applyAll(fresh(plan), cmds);
      assert.equal(r.applied, limit, plan);
      assert.equal((r.decision as { code: string }).code, "TEAM_LIMIT");
    }
  });

  it("burn ends the seat and frees the slot", () => {
    const limit = PLANS.starter.team;
    let s = applyAll(fresh(), Array.from({ length: limit }, (_, i) => team(`t${i}`))).state;
    assert.equal((apply(s, team("extra")).decision as { code: string }).code, "TEAM_LIMIT");

    const burn = apply(s, { type: "burn_seat", seatId: "t0" });
    assert.equal(burn.decision.ok, true);
    s = burn.state;
    assert.equal(s.seats.find((x) => x.id === "t0")?.status, "burned");

    assert.equal(apply(s, team("extra")).decision.ok, true);
  });

  it("cannot burn twice or burn a missing seat", () => {
    const s = apply(fresh(), team("t1")).state;
    const once = apply(s, { type: "burn_seat", seatId: "t1" }).state;
    assert.equal((apply(once, { type: "burn_seat", seatId: "t1" }).decision as { code: string }).code, "SEAT_ALREADY_BURNED");
    assert.equal((apply(once, { type: "burn_seat", seatId: "nope" }).decision as { code: string }).code, "SEAT_NOT_FOUND");
  });
});

describe("seats: not on this company", () => {
  it("no Household AU on this card", () => {
    const r = apply(fresh(), { type: "add_seat", seatKind: "household", id: "h1" });
    assert.equal((r.decision as { code: string }).code, "HOUSEHOLD_NOT_ON_COMPANY");
    assert.equal(r.state.seats.length, 0);
  });

  it("no shared authorized-user mill", () => {
    const r = apply(fresh(), { type: "add_seat", seatKind: "shared_au", id: "au1" });
    assert.equal((r.decision as { code: string }).code, "SHARED_AU_NOT_ALLOWED");
    assert.equal(r.state.seats.length, 0);
  });
});
