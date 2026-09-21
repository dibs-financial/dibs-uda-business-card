import { firstDecline, ALLOW, decline, type Decision } from "../decision.js";
import type { Command } from "../commands.js";
import type { State } from "../types.js";
import { checkAmount } from "./operating.js";
import { checkSeatCanSpend } from "./seats.js";

type CardAuth = Extract<Command, { type: "card_auth" }>;
type CardRefund = Extract<Command, { type: "card_refund" }>;

/**
 * Card authorizations draw on the card, not on Operating. The card is not the deposit.
 * v0 does not issue cards: this is the rule decision a future issuer would consult.
 */
export function checkCardAuth(state: State, cmd: CardAuth): Decision {
  return firstDecline(
    () => checkAmount(cmd.amountCents),
    () => {
      const d = checkSeatCanSpend(state, cmd.seatId);
      return d.ok ? ALLOW : d.code === "SEAT_BURNED" ? decline("CARD_SEAT_INACTIVE", d.message) : d;
    },
  );
}

/** Refunds return to Operating. They never exceed what is outstanding on the card. */
export function checkCardRefund(state: State, cmd: CardRefund): Decision {
  return firstDecline(
    () => checkAmount(cmd.amountCents),
    () =>
      state.seats.some((s) => s.id === cmd.seatId)
        ? ALLOW
        : decline("SEAT_NOT_FOUND", `No seat ${cmd.seatId} on this company.`),
    () =>
      state.card.outstandingCents >= cmd.amountCents
        ? ALLOW
        : decline("CARD_REFUND_EXCEEDS_OUTSTANDING", "Refund exceeds card outstanding."),
  );
}
