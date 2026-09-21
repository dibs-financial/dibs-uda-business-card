import { ALLOW, decline, firstDecline, type Decision } from "../decision.js";
import { PLANS } from "../plans.js";
import type { Command } from "../commands.js";
import type { Seat, State } from "../types.js";

type AddSeat = Extract<Command, { type: "add_seat" }>;

const OPERATOR_ROLES = new Set(["co_founder", "managing_partner"]);
const TEAM_ROLES = new Set(["employee", "contractor"]);

export function activeSeats(state: State, kind: Seat["kind"]): Seat[] {
  return state.seats.filter((s) => s.kind === kind && s.status === "active");
}

export function findSeat(state: State, seatId: string): Seat | undefined {
  return state.seats.find((s) => s.id === seatId);
}

export function checkAddSeat(state: State, cmd: AddSeat): Decision {
  const plan = PLANS[state.company.plan];

  switch (cmd.seatKind) {
    case "household":
      return decline("HOUSEHOLD_NOT_ON_COMPANY", "No Household AU on this card. Household lives on consumer UDA only.");
    case "shared_au":
      return decline("SHARED_AU_NOT_ALLOWED", "No shared authorized-user mill. No stranger on the EIN card.");
    case "operator":
      return firstDecline(
        () =>
          OPERATOR_ROLES.has(cmd.role)
            ? ALLOW
            : decline("OPERATOR_ROLE_INVALID", "Operator must be a co-founder or managing partner."),
        () =>
          cmd.documentRef && cmd.documentRef.trim() !== ""
            ? ALLOW
            : decline("OPERATOR_NOT_DOCUMENTED", "Operator must be documented. Provide the document reference."),
        () =>
          activeSeats(state, "operator").length < plan.operators
            ? ALLOW
            : decline("OPERATOR_LIMIT", `Plan ${plan.id} allows ${plan.operators} operator seat(s).`),
      );
    case "team":
      return firstDecline(
        () =>
          TEAM_ROLES.has(cmd.role) ? ALLOW : decline("TEAM_ROLE_INVALID", "Team seat must be an employee or contractor."),
        () =>
          activeSeats(state, "team").length < plan.team
            ? ALLOW
            : decline("TEAM_LIMIT", `Plan ${plan.id} allows ${plan.team} team seat(s).`),
      );
  }
}

export function checkBurnSeat(state: State, seatId: string): Decision {
  const seat = findSeat(state, seatId);
  if (!seat) return decline("SEAT_NOT_FOUND", `No seat ${seatId} on this company.`);
  if (seat.kind !== "team") {
    return decline("SEAT_NOT_BURNABLE", "Only team seats burn. Operators are removed by document, not by token.");
  }
  if (seat.status === "burned") return decline("SEAT_ALREADY_BURNED", `Seat ${seatId} is already burned.`);
  return ALLOW;
}

/** A seat can spend only while active. Burn ends the seat. */
export function checkSeatCanSpend(state: State, seatId: string): Decision {
  const seat = findSeat(state, seatId);
  if (!seat) return decline("SEAT_NOT_FOUND", `No seat ${seatId} on this company.`);
  if (seat.status !== "active") return decline("SEAT_BURNED", `Seat ${seatId} is burned. Burn ends the seat.`);
  return ALLOW;
}
