import type { Plan, PlanId } from "./types.js";

/**
 * What the company pays for.
 *
 * Firm entities are "Multi later" in the spec. v0 pins every plan to one entity;
 * raise the Firm limit when multi-entity ships.
 */
export const PLANS: Readonly<Record<PlanId, Plan>> = {
  starter: { id: "starter", priceCents: 29_00, operators: 1, team: 5, entities: 1 },
  build: { id: "build", priceCents: 79_00, operators: 3, team: 25, entities: 1 },
  firm: { id: "firm", priceCents: 199_00, operators: 3, team: 99, entities: 1 },
};

export function planFor(id: PlanId): Plan {
  return PLANS[id];
}
