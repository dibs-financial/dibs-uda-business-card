# UDA Business

**It’s the buzinazz.**

The company card. The company file.

UDA Business is its own company. It is not UDA. It does not share a card, a file, a login, a bank program, or a GitHub About with the consumer product.

```
Operators run the company card.
Team members get a number they can burn.
```

v0 is the business rules engine. It does not issue cards, move bank money, or report to bureaus.

## Product

- Business book only
- EIN required
- Reports to the company file when furnishing is live
- Operator: documented co-founder or managing partner
- Team: employee or contractor. Never reports to a personal bureau. Burn ends the seat
- Operating sleeve: company cash. Outbound wires leave this sleeve, not the card
- Payee lock on outbound transfers
- Refunds return to Operating
- No Household AU on this card
- No consumer slogan on this paper

A founder can hold UDA and UDA Business the way they hold two banks. That does not merge the companies.

## What the company pays for

| | Starter | Build | Firm |
| --- | --- | --- | --- |
| Price | $29/mo | $79/mo | $199/mo |
| Operator | 1 | 3 | 3 |
| Team | 5 | 25 | 99 |
| Entities | 1 | 1 | Multi later |

Interchange on the company card comes after a sponsor bank. Do not spend it on consumer perks.

## People seats

| Seat | File | Rule |
| --- | --- | --- |
| Operator | Company | Named. Documented. Runs the card. |
| Team | Company | Token. Never hits a personal file. Burnable. |
| Household | — | Not on this company. Lives on consumer UDA only. |

No shared authorized-user mill. No stranger on the EIN card.

## Operating

Company cash sits in Operating.

- Deposit owner cash into Operating
- Outbound transfers leave Operating
- Payee must look like a real vendor or settlement office
- A returned transfer posts back to Operating
- The card is not the deposit

## Policy

- We do not sell company or operator personal information
- Team tokens are not a side door onto anyone’s consumer file
- No score promises — commercial or personal
- No fee because a PAYDEX or FICO number moved

Results vary.

## Engine

v0 is a pure rules engine in TypeScript. No runtime dependencies. No network. No database.

```
npm install
npm test
```

Layout:

```
src/types.ts          Company, seats, payees, Operating sleeve, ledger
src/plans.ts          Starter / Build / Firm limits
src/decision.ts       Allow, or decline with a code and a message
src/commands.ts       The only way state changes
src/engine.ts         openCompany, evaluate, apply, applyAll
src/rules/company.ts  EIN required. Business book only. Entity limit
src/rules/seats.ts    Operator documented. Team burnable. No Household. No shared AU
src/rules/operating.ts Owner cash in. Payee lock out. Returns post back. Wires wait
src/rules/card.ts     Seat must be active. Card is not the deposit. Refunds to Operating
src/rules/furnishing.ts Company file only, when live. Never personal
src/rules/fees.ts     No fee on score movement. Interchange after sponsor bank, never on perks
test/                 One file per rule area
```

`evaluate(state, command)` judges. `apply(state, command)` judges and, if allowed, returns the next state. Both are pure. A decline always carries a code from `src/decision.ts` so the reason is never a guess.

```ts
import { openCompany, apply } from "@dibs-financial/uda-business-rules";

let state = openCompany({ id: "co_1", name: "Acme Holdings LLC", ein: "12-3456789", plan: "starter", entities: 1, furnishingLive: false, sponsorBank: false });

state = apply(state, { type: "deposit", amountCents: 100_00, source: "owner_cash" }).state;

const r = apply(state, { type: "add_seat", seatKind: "household", id: "h1" });
// r.decision -> { ok: false, code: "HOUSEHOLD_NOT_ON_COMPANY", message: "No Household AU on this card. ..." }
```

Money is integer cents. Timestamps are ISO strings you pass in, or now.

## Repo

Use a separate repository. Do not put this product in `dibs-uda-card`.

Suggested name: `dibs-financial/dibs-uda-business`

About:

```
UDA Business. It's the buzinazz. Company card. Company file.
```

## What v0 does not do

- Live card issuing
- Personal accounts
- Household seats
- Shared authorized-user seats
- Score promises
- Bank wires
- Consumer shield / LifeLock

Those wait on a sponsor bank. Consumer privacy and LifeLock stay on UDA unless this company licenses them later.

## License

UNLICENSED. Private.
