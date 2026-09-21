import type { Command } from "./commands.js";
import { ALLOW, type Decision } from "./decision.js";
import { checkCardAuth, checkCardRefund } from "./rules/card.js";
import { checkAddEntity, checkCompany } from "./rules/company.js";
import { checkDeposit, checkTransferOut, checkTransferReturn } from "./rules/operating.js";
import { checkAddSeat, checkBurnSeat } from "./rules/seats.js";
import type { Company, LedgerEntry, Seat, State } from "./types.js";

export interface ApplyResult {
  decision: Decision;
  /** The next state. Unchanged from the input when the decision is a decline. */
  state: State;
}

/** Open a company book. Throws on a company that fails the open rules. */
export function openCompany(company: Company): State {
  const d = checkCompany(company);
  if (!d.ok) throw new Error(`${d.code}: ${d.message}`);
  return {
    company: { ...company },
    seats: [],
    payees: [],
    operating: { balanceCents: 0 },
    card: { outstandingCents: 0 },
    ledger: [],
  };
}

/** Judge a command against the rules. Pure. Never mutates state. */
export function evaluate(state: State, cmd: Command): Decision {
  switch (cmd.type) {
    case "add_seat":
      return checkAddSeat(state, cmd);
    case "burn_seat":
      return checkBurnSeat(state, cmd.seatId);
    case "add_entity":
      return checkAddEntity(state);
    case "add_payee":
      return ALLOW;
    case "deposit":
      return checkDeposit(cmd);
    case "transfer_out":
      return checkTransferOut(state, cmd);
    case "transfer_return":
      return checkTransferReturn(state, cmd);
    case "card_auth":
      return checkCardAuth(state, cmd);
    case "card_refund":
      return checkCardRefund(state, cmd);
  }
}

/** Evaluate, then apply if allowed. Pure. Returns a new state object on allow. */
export function apply(state: State, cmd: Command): ApplyResult {
  const decision = evaluate(state, cmd);
  if (!decision.ok) return { decision, state };
  return { decision, state: transition(state, cmd) };
}

/** Apply a list of commands in order. Stops at the first decline. */
export function applyAll(state: State, cmds: Command[]): ApplyResult & { applied: number } {
  let current = state;
  for (let i = 0; i < cmds.length; i++) {
    const cmd = cmds[i]!;
    const result = apply(current, cmd);
    if (!result.decision.ok) return { ...result, applied: i };
    current = result.state;
  }
  return { decision: ALLOW, state: current, applied: cmds.length };
}

function stamp(at: string | undefined): string {
  return at ?? new Date().toISOString();
}

function withEntry(state: State, entry: LedgerEntry): State {
  return { ...state, ledger: [...state.ledger, entry] };
}

/** State transition for an already-allowed command. Not exported: go through `apply`. */
function transition(state: State, cmd: Command): State {
  switch (cmd.type) {
    case "add_seat": {
      let seat: Seat;
      if (cmd.seatKind === "operator") {
        seat = {
          id: cmd.id,
          kind: "operator",
          name: cmd.name,
          role: cmd.role,
          documentRef: cmd.documentRef ?? "",
          status: "active",
        };
      } else if (cmd.seatKind === "team") {
        seat = { id: cmd.id, kind: "team", label: cmd.label, role: cmd.role, token: cmd.token, status: "active" };
      } else {
        // Household and shared AU never pass evaluate. Guard anyway.
        return state;
      }
      return { ...state, seats: [...state.seats, seat] };
    }
    case "burn_seat":
      return {
        ...state,
        seats: state.seats.map((s) => (s.id === cmd.seatId ? { ...s, status: "burned" } : s)),
      };
    case "add_entity":
      return { ...state, company: { ...state.company, entities: state.company.entities + 1 } };
    case "add_payee":
      return {
        ...state,
        payees: [
          ...state.payees.filter((p) => p.id !== cmd.id),
          { id: cmd.id, name: cmd.name, kind: cmd.kind, approved: cmd.approved },
        ],
      };
    case "deposit":
      return withEntry(
        { ...state, operating: { balanceCents: state.operating.balanceCents + cmd.amountCents } },
        { type: "deposit", amountCents: cmd.amountCents, sleeve: "operating", source: "owner_cash", at: stamp(cmd.at) },
      );
    case "transfer_out":
      return withEntry(
        { ...state, operating: { balanceCents: state.operating.balanceCents - cmd.amountCents } },
        {
          type: "transfer_out",
          amountCents: cmd.amountCents,
          sleeve: "operating",
          payeeId: cmd.payeeId,
          rail: cmd.rail,
          at: stamp(cmd.at),
        },
      );
    case "transfer_return":
      return withEntry(
        { ...state, operating: { balanceCents: state.operating.balanceCents + cmd.amountCents } },
        { type: "transfer_return", amountCents: cmd.amountCents, sleeve: "operating", payeeId: cmd.payeeId, at: stamp(cmd.at) },
      );
    case "card_auth":
      // The card is not the deposit. Operating is untouched.
      return withEntry(
        { ...state, card: { outstandingCents: state.card.outstandingCents + cmd.amountCents } },
        { type: "card_auth", amountCents: cmd.amountCents, seatId: cmd.seatId, merchant: cmd.merchant, at: stamp(cmd.at) },
      );
    case "card_refund":
      // Refunds return to Operating.
      return withEntry(
        {
          ...state,
          card: { outstandingCents: state.card.outstandingCents - cmd.amountCents },
          operating: { balanceCents: state.operating.balanceCents + cmd.amountCents },
        },
        {
          type: "card_refund",
          amountCents: cmd.amountCents,
          sleeve: "operating",
          seatId: cmd.seatId,
          merchant: cmd.merchant,
          at: stamp(cmd.at),
        },
      );
  }
}
