import { openCompany, type Company, type PlanId, type State } from "../src/index.js";

export function company(overrides: Partial<Company> = {}): Company {
  return {
    id: "co_1",
    name: "Acme Holdings LLC",
    ein: "12-3456789",
    plan: "starter",
    entities: 1,
    furnishingLive: false,
    sponsorBank: false,
    ...overrides,
  };
}

export function fresh(plan: PlanId = "starter", overrides: Partial<Company> = {}): State {
  return openCompany(company({ plan, ...overrides }));
}
