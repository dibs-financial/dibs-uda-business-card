/**
 * UDA Business v0 rules engine.
 *
 * Evaluates company card, seat, Operating sleeve, furnishing, and fee rules.
 * It does not issue cards, move bank money, or report to bureaus.
 */
export * from "./types.js";
export * from "./commands.js";
export * from "./decision.js";
export * from "./plans.js";
export { openCompany, evaluate, apply, applyAll, type ApplyResult } from "./engine.js";
export { checkCompany, checkEin, checkBusinessBookOnly, checkPlan } from "./rules/company.js";
export { checkAddSeat, checkBurnSeat, checkSeatCanSpend, activeSeats, findSeat } from "./rules/seats.js";
export { checkDeposit, checkTransferOut, checkTransferReturn, checkPayeeLock, checkAmount } from "./rules/operating.js";
export { checkCardAuth, checkCardRefund } from "./rules/card.js";
export { checkFurnish, routeFurnishing, type Tradeline, type FileTarget } from "./rules/furnishing.js";
export { checkFee, checkInterchange, type Fee, type FeeKind, type InterchangeUse } from "./rules/fees.js";
