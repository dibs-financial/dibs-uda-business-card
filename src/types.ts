/**
 * Domain types for the UDA Business v0 rules engine.
 *
 * Money is integer minor units (cents). No floats anywhere in the ledger.
 */

export type PlanId = "starter" | "build" | "firm";

export interface Plan {
  id: PlanId;
  /** Monthly price in cents. */
  priceCents: number;
  /** Maximum named operators. */
  operators: number;
  /** Maximum active team seats. */
  team: number;
  /** Maximum entities on the company file. Multi-entity waits on a later version. */
  entities: number;
}

export type OperatorRole = "co_founder" | "managing_partner";
export type TeamRole = "employee" | "contractor";

/** Seat kinds the engine will consider. `household` and `shared_au` exist only to be rejected. */
export type SeatKind = "operator" | "team" | "household" | "shared_au";

export type SeatStatus = "active" | "burned";

export interface OperatorSeat {
  id: string;
  kind: "operator";
  /** Legal name of the documented person. */
  name: string;
  role: OperatorRole;
  /** Reference to the document that establishes the role (operating agreement, filing, etc.). */
  documentRef: string;
  status: SeatStatus;
}

export interface TeamSeat {
  id: string;
  kind: "team";
  /** Display label only. Never a bureau identity. */
  label: string;
  role: TeamRole;
  /** Opaque token the seat spends with. Burn ends it. */
  token: string;
  status: SeatStatus;
}

export type Seat = OperatorSeat | TeamSeat;

export type PayeeKind = "vendor" | "settlement_office" | "person" | "unknown";

export interface Payee {
  id: string;
  name: string;
  kind: PayeeKind;
  /** Payee lock: only approved payees can receive outbound transfers. */
  approved: boolean;
}

export interface Company {
  id: string;
  name: string;
  /** Employer Identification Number. Required. The engine validates shape only. */
  ein: string;
  plan: PlanId;
  /** Number of legal entities on this company file. */
  entities: number;
  /** Set when the company file furnishing pipeline is live. Off in v0 by default. */
  furnishingLive: boolean;
  /** Set when a sponsor bank is attached. Off in v0 by default. */
  sponsorBank: boolean;
}

export type LedgerEntry =
  | { type: "deposit"; amountCents: number; sleeve: "operating"; source: "owner_cash"; at: string }
  | { type: "transfer_out"; amountCents: number; sleeve: "operating"; payeeId: string; rail: TransferRail; at: string }
  | { type: "transfer_return"; amountCents: number; sleeve: "operating"; payeeId: string; at: string }
  | { type: "card_auth"; amountCents: number; seatId: string; merchant: string; at: string }
  | { type: "card_refund"; amountCents: number; sleeve: "operating"; seatId: string; merchant: string; at: string };

export type TransferRail = "ach" | "wire";

export interface State {
  company: Company;
  seats: Seat[];
  payees: Payee[];
  /** Operating sleeve: company cash. The card is not the deposit. */
  operating: { balanceCents: number };
  /** Card outstanding is tracked separately from Operating. */
  card: { outstandingCents: number };
  ledger: LedgerEntry[];
}
