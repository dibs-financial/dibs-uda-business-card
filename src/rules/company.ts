import { ALLOW, decline, firstDecline, type Decision } from "../decision.js";
import { PLANS } from "../plans.js";
import type { Company, State } from "../types.js";

/** EIN shape: nine digits, optional dash after the second. Validity beyond shape is not this engine's job. */
const EIN_SHAPE = /^\d{2}-?\d{7}$/;

export function checkEin(ein: string | undefined | null): Decision {
  if (ein === undefined || ein === null || ein.trim() === "") {
    return decline("EIN_REQUIRED", "UDA Business is business book only. An EIN is required.");
  }
  if (!EIN_SHAPE.test(ein.trim())) {
    return decline("EIN_INVALID", "EIN must be nine digits, formatted 12-3456789 or 123456789.");
  }
  return ALLOW;
}

export function checkPlan(plan: string): Decision {
  return plan in PLANS ? ALLOW : decline("PLAN_UNKNOWN", `Unknown plan "${plan}". Plans are starter, build, firm.`);
}

/** Personal accounts, SSN-keyed books, and anything without an EIN are not on this company. */
export function checkBusinessBookOnly(input: { ein?: string | null; ssn?: string | null }): Decision {
  if (input.ssn !== undefined && input.ssn !== null && input.ssn !== "") {
    return decline("BUSINESS_BOOK_ONLY", "Personal identifiers do not open a UDA Business book. EIN only.");
  }
  return checkEin(input.ein);
}

/** Validate a company record on open. */
export function checkCompany(company: Company): Decision {
  return firstDecline(
    () => checkBusinessBookOnly({ ein: company.ein }),
    () => checkPlan(company.plan),
    () => {
      const limit = PLANS[company.plan].entities;
      return company.entities <= limit
        ? ALLOW
        : decline("ENTITY_LIMIT", `Plan ${company.plan} allows ${limit} entity in v0. Multi-entity comes later.`);
    },
  );
}

export function checkAddEntity(state: State): Decision {
  const limit = PLANS[state.company.plan].entities;
  return state.company.entities + 1 <= limit
    ? ALLOW
    : decline("ENTITY_LIMIT", `Plan ${state.company.plan} allows ${limit} entity in v0. Multi-entity comes later.`);
}
