import type { OperatorRole, TeamRole, TransferRail, PayeeKind, SeatKind } from "./types.js";

/**
 * Commands are the only way state changes. `evaluate` judges a command against the
 * rules; `apply` runs it if allowed. Both are pure.
 */
export type Command =
  | { type: "add_seat"; seatKind: "operator"; id: string; name: string; role: OperatorRole; documentRef?: string }
  | { type: "add_seat"; seatKind: "team"; id: string; label: string; role: TeamRole; token: string }
  | { type: "add_seat"; seatKind: Exclude<SeatKind, "operator" | "team">; id: string }
  | { type: "burn_seat"; seatId: string }
  | { type: "add_entity" }
  | { type: "add_payee"; id: string; name: string; kind: PayeeKind; approved: boolean }
  | { type: "deposit"; amountCents: number; source: "owner_cash" | string; at?: string }
  | { type: "transfer_out"; amountCents: number; sleeve: "operating" | "card" | string; payeeId: string; rail: TransferRail; at?: string }
  | { type: "transfer_return"; amountCents: number; payeeId: string; at?: string }
  | { type: "card_auth"; amountCents: number; seatId: string; merchant: string; at?: string }
  | { type: "card_refund"; amountCents: number; seatId: string; merchant: string; at?: string };

export type CommandType = Command["type"];
