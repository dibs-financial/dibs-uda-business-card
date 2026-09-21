import { ALLOW, decline, firstDecline, type Decision } from "../decision.js";
import type { Command } from "../commands.js";
import type { Payee, State } from "../types.js";

type Deposit = Extract<Command, { type: "deposit" }>;
type TransferOut = Extract<Command, { type: "transfer_out" }>;
type TransferReturn = Extract<Command, { type: "transfer_return" }>;

/** Payees that look like a real vendor or settlement office. Nothing else receives an outbound transfer. */
const OUTBOUND_PAYEE_KINDS = new Set<Payee["kind"]>(["vendor", "settlement_office"]);

export function checkAmount(amountCents: number): Decision {
  return Number.isInteger(amountCents) && amountCents > 0
    ? ALLOW
    : decline("AMOUNT_INVALID", "Amount must be a positive integer number of cents.");
}

export function findPayee(state: State, payeeId: string): Payee | undefined {
  return state.payees.find((p) => p.id === payeeId);
}

export function checkDeposit(cmd: Deposit): Decision {
  return firstDecline(
    () => checkAmount(cmd.amountCents),
    () =>
      cmd.source === "owner_cash"
        ? ALLOW
        : decline("DEPOSIT_SOURCE_INVALID", "Operating takes owner cash. Nothing else deposits into the sleeve."),
  );
}

export function checkTransferOut(state: State, cmd: TransferOut): Decision {
  return firstDecline(
    () => checkAmount(cmd.amountCents),
    () =>
      cmd.sleeve === "operating"
        ? ALLOW
        : decline("TRANSFER_SOURCE_MUST_BE_OPERATING", "Outbound transfers leave Operating, not the card."),
    () => checkPayeeLock(state, cmd.payeeId),
    () =>
      cmd.rail === "wire"
        ? decline("WIRE_WAITS_ON_SPONSOR_BANK", "Bank wires wait on a sponsor bank. Not in v0.")
        : ALLOW,
    () =>
      state.operating.balanceCents >= cmd.amountCents
        ? ALLOW
        : decline("OPERATING_INSUFFICIENT", "Operating does not hold enough company cash for this transfer."),
  );
}

/** Payee lock: the payee must exist, be approved, and look like a vendor or settlement office. */
export function checkPayeeLock(state: State, payeeId: string): Decision {
  const payee = findPayee(state, payeeId);
  if (!payee) return decline("PAYEE_NOT_FOUND", `No payee ${payeeId} on this company.`);
  if (!payee.approved) return decline("PAYEE_LOCKED", `Payee ${payee.name} is not approved. Payee lock holds.`);
  if (!OUTBOUND_PAYEE_KINDS.has(payee.kind)) {
    return decline("PAYEE_NOT_VENDOR", `Payee ${payee.name} must look like a real vendor or settlement office.`);
  }
  return ALLOW;
}

/** A returned transfer posts back to Operating. It must match a prior outbound to the same payee. */
export function checkTransferReturn(state: State, cmd: TransferReturn): Decision {
  return firstDecline(
    () => checkAmount(cmd.amountCents),
    () => {
      const sent = state.ledger
        .filter((e) => e.type === "transfer_out" && e.payeeId === cmd.payeeId)
        .reduce((sum, e) => sum + e.amountCents, 0);
      const returned = state.ledger
        .filter((e) => e.type === "transfer_return" && e.payeeId === cmd.payeeId)
        .reduce((sum, e) => sum + e.amountCents, 0);
      return sent - returned >= cmd.amountCents
        ? ALLOW
        : decline("RETURN_WITHOUT_TRANSFER", "Return exceeds what was sent to this payee from Operating.");
    },
  );
}
