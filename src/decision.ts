/**
 * Every rule in the README maps to one code here. A decline always carries a code
 * and a human-readable message so callers can log or surface it without guessing.
 */
export type DeclineCode =
  // Company
  | "EIN_REQUIRED"
  | "EIN_INVALID"
  | "BUSINESS_BOOK_ONLY"
  | "ENTITY_LIMIT"
  | "PLAN_UNKNOWN"
  // Seats
  | "OPERATOR_LIMIT"
  | "OPERATOR_NOT_DOCUMENTED"
  | "OPERATOR_ROLE_INVALID"
  | "TEAM_LIMIT"
  | "TEAM_ROLE_INVALID"
  | "HOUSEHOLD_NOT_ON_COMPANY"
  | "SHARED_AU_NOT_ALLOWED"
  | "SEAT_NOT_FOUND"
  | "SEAT_ALREADY_BURNED"
  | "SEAT_BURNED"
  | "SEAT_NOT_BURNABLE"
  // Operating sleeve
  | "AMOUNT_INVALID"
  | "DEPOSIT_SOURCE_INVALID"
  | "TRANSFER_SOURCE_MUST_BE_OPERATING"
  | "OPERATING_INSUFFICIENT"
  | "PAYEE_NOT_FOUND"
  | "PAYEE_LOCKED"
  | "PAYEE_NOT_VENDOR"
  | "WIRE_WAITS_ON_SPONSOR_BANK"
  | "RETURN_WITHOUT_TRANSFER"
  // Card
  | "CARD_SEAT_INACTIVE"
  | "CARD_REFUND_EXCEEDS_OUTSTANDING"
  // Furnishing
  | "FURNISHING_NOT_LIVE"
  | "PERSONAL_FILE_FORBIDDEN"
  // Fees and revenue
  | "FEE_ON_SCORE_MOVEMENT"
  | "INTERCHANGE_WAITS_ON_SPONSOR_BANK"
  | "INTERCHANGE_NO_CONSUMER_PERKS";

export type Decision =
  | { ok: true }
  | { ok: false; code: DeclineCode; message: string };

export const ALLOW: Decision = { ok: true };

export function decline(code: DeclineCode, message: string): Decision {
  return { ok: false, code, message };
}

/** Run checks in order and return the first decline, or ALLOW. */
export function firstDecline(...checks: Array<() => Decision>): Decision {
  for (const check of checks) {
    const d = check();
    if (!d.ok) return d;
  }
  return ALLOW;
}
