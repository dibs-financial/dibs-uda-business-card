import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkFee, checkFurnish, checkInterchange, routeFurnishing } from "../src/index.js";
import { fresh } from "./helpers.js";

describe("furnishing", () => {
  it("reports to the company file only when furnishing is live", () => {
    const off = checkFurnish(fresh(), { seatId: "op1", target: "company" });
    assert.equal((off as { code: string }).code, "FURNISHING_NOT_LIVE");
    const on = checkFurnish(fresh("starter", { furnishingLive: true }), { seatId: "op1", target: "company" });
    assert.equal(on.ok, true);
  });

  it("nothing on this company hits a personal file, even when furnishing is live", () => {
    const d = checkFurnish(fresh("starter", { furnishingLive: true }), { seatId: "t1", target: "personal" });
    assert.equal((d as { code: string }).code, "PERSONAL_FILE_FORBIDDEN");
  });

  it("routes a batch and keeps the decision per line", () => {
    const routed = routeFurnishing(fresh("build", { furnishingLive: true }), [
      { seatId: "op1", target: "company" },
      { seatId: "t1", target: "personal" },
    ]);
    assert.equal(routed[0]?.decision.ok, true);
    assert.equal((routed[1]?.decision as { code: string }).code, "PERSONAL_FILE_FORBIDDEN");
  });
});

describe("fees", () => {
  it("subscription fees are fine", () => {
    assert.equal(checkFee({ kind: "subscription", amountCents: 29_00 }).ok, true);
  });

  it("no fee because a PAYDEX or FICO number moved", () => {
    assert.equal((checkFee({ kind: "score_movement", amountCents: 1 }) as { code: string }).code, "FEE_ON_SCORE_MOVEMENT");
    assert.equal(
      (checkFee({ kind: "subscription", amountCents: 1, triggeredByScoreMovement: true }) as { code: string }).code,
      "FEE_ON_SCORE_MOVEMENT",
    );
  });
});

describe("interchange", () => {
  it("comes after a sponsor bank", () => {
    assert.equal((checkInterchange(fresh(), "operating") as { code: string }).code, "INTERCHANGE_WAITS_ON_SPONSOR_BANK");
  });

  it("is never spent on consumer perks", () => {
    const s = fresh("firm", { sponsorBank: true });
    assert.equal((checkInterchange(s, "consumer_perk") as { code: string }).code, "INTERCHANGE_NO_CONSUMER_PERKS");
    assert.equal(checkInterchange(s, "operating").ok, true);
  });
});
