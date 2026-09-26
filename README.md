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
- D-U-N-S onboarding and D&B furnish when the bank is live
- Operator: documented co-founder or managing partner
- Team: employee or contractor. Never reports to a personal bureau. Burn ends the seat
- Operating sleeve: company cash. Outbound wires leave this sleeve, not the card
- Payee lock on outbound transfers
- Refunds return to Operating
- No Household AU on this card
- No consumer slogan on this paper

A founder can hold UDA and UDA Business the way they hold two banks. That does not merge the companies.

## D&B

D&B is a product feature on this company. It is not a score promise.

| Piece | What UDA Business does |
| --- | --- |
| D-U-N-S | Help the company claim or confirm its number at onboarding |
| File | Card activity furnishes to Dun & Bradstreet when issuing is live |
| Watcher | Days-beyond-terms on vendors paid from Operating — early, on time, late |
| PAYDEX | An output D&B may compute after enough trade experiences. We do not sell it. |

Rules:

- D-U-N-S is included on every plan
- Furnish starts after the first settled cycle
- PAYDEX usually needs several trade experiences, not one swipe
- We do not charge extra when PAYDEX moves
- We do not pull the founder’s FICO to open this file
- Experian Business and Equifax Business can follow. D&B ships first.

Watcher, business mode:

> Vendor invoice $4,200. Terms net-30. Pay it on day 18 from Operating if you want D&B to see early, not on time.

That is the feature. Not “we will get you an 80.”

## What the company pays for

| | Starter | Build | Firm |
| --- | --- | --- | --- |
| Price | $29/mo | $79/mo | $199/mo |
| Operator | 1 | 3 | 3 |
| Team | 5 | 25 | 99 |
| D-U-N-S + D&B furnish | Yes | Yes | Yes |
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
- Card limit is a haircut of verified Operating cash
- Card settles in full from Operating each cycle
- Payee must look like a real vendor, payroll, tax, or settlement office
- A returned transfer posts back to Operating
- The card is not the deposit

## Underwriting

No-PG charge card by default.

- Entity: LLC, corp, or LP. No sole prop
- No consumer hard pull to approve
- Limit ≤ 25% of 30-day average Operating
- If Operating cannot settle, freeze Team tokens the same day
- Revolve and personal guarantee are a later product, disclosed as a founder event

## Policy

- We do not sell company or operator personal information
- Team tokens are not a side door onto anyone’s consumer file
- No score promises — PAYDEX, Intelliscore, or FICO
- No fee because a commercial or personal score moved

Results vary.

## Repo

Use a separate repository. Do not put this product in `dibs-uda-card`.

Suggested name: `dibs-financial/dibs-uda-business`

About:

```
UDA Business. It's the buzinazz. Company card. Company file. D&B on the EIN.
```

## What v0 does not do

- Live card issuing
- Live D&B furnish
- Personal accounts
- Household seats
- Shared authorized-user seats
- Score promises
- Bank wires
- Consumer shield / LifeLock

Those wait on a sponsor bank and a D&B reporter agreement. Consumer privacy and LifeLock stay on UDA unless this company licenses them later.

## License

Copyright (c) 2026 DIBS Financial. All rights reserved.

See `LICENSE` (this company only). This is not open source.
