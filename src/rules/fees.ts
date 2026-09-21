import { ALLOW, decline, type Decision } from "../decision.js";
import type { State } from "../types.js";

export type FeeKind = "subscription" | "score_movement" | string;

export interface Fee {
  kind: FeeKind;
  amountCents: number;
  /** Set when the fee is triggered by a PAYDEX, FICO, or other score moving. Always declined. */
  triggeredByScoreMovement?: boolean;
}

/** No fee because a PAYDEX or FICO number moved. */
export function checkFee(fee: Fee): Decision {
  if (fee.kind === "score_movement" || fee.triggeredByScoreMovement === true) {
    return decline("FEE_ON_SCORE_MOVEMENT", "No fee because a PAYDEX or FICO number moved.");
  }
  return ALLOW;
}

export type InterchangeUse = "operating" | "reserve" | "consumer_perk" | string;

/** Interchange on the company card comes after a sponsor bank. Do not spend it on consumer perks. */
export function checkInterchange(state: State, use: InterchangeUse): Decision {
  if (!state.company.sponsorBank) {
    return decline("INTERCHANGE_WAITS_ON_SPONSOR_BANK", "Interchange on the company card comes after a sponsor bank.");
  }
  if (use === "consumer_perk") {
    return decline("INTERCHANGE_NO_CONSUMER_PERKS", "Do not spend interchange on consumer perks.");
  }
  return ALLOW;
}
