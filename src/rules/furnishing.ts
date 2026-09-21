import { ALLOW, decline, type Decision } from "../decision.js";
import type { State } from "../types.js";

export type FileTarget = "company" | "personal";

export interface Tradeline {
  seatId: string;
  target: FileTarget;
}

/**
 * Where a tradeline may go.
 *
 * - Company file only, and only when furnishing is live.
 * - Team tokens never hit a personal file. Neither does anything else on this company.
 */
export function checkFurnish(state: State, tradeline: Tradeline): Decision {
  if (tradeline.target === "personal") {
    return decline("PERSONAL_FILE_FORBIDDEN", "Nothing on UDA Business reports to a personal bureau. Company file only.");
  }
  if (!state.company.furnishingLive) {
    return decline("FURNISHING_NOT_LIVE", "Reports to the company file when furnishing is live. It is not live.");
  }
  return ALLOW;
}

/** Route a batch of tradelines. Declined lines carry their decision. */
export function routeFurnishing(
  state: State,
  tradelines: Tradeline[],
): Array<{ tradeline: Tradeline; decision: Decision }> {
  return tradelines.map((tradeline) => ({ tradeline, decision: checkFurnish(state, tradeline) }));
}
