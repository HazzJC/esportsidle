import { OPERATIONS, getOp, type OperationDef } from '../data/operations';
import { computeMods } from './economy';
import type { GameState } from './types';

export const PRICE_GROWTH = 1.15;
export const SELL_REFUND = 0.25;

/** Price of buying `amount` units when `owned` are already owned. */
export function bulkPrice(def: OperationDef, owned: number, amount: number, costMult = 1): number {
  if (amount <= 0) return 0;
  const first = def.baseCost * Math.pow(PRICE_GROWTH, owned);
  return Math.ceil((first * (Math.pow(PRICE_GROWTH, amount) - 1)) / (PRICE_GROWTH - 1) * costMult);
}

export function unitPrice(def: OperationDef, owned: number, costMult = 1): number {
  return bulkPrice(def, owned, 1, costMult);
}

/** Largest number of units purchasable with `cash`. */
export function maxAffordable(def: OperationDef, owned: number, cash: number, costMult = 1): number {
  const first = def.baseCost * Math.pow(PRICE_GROWTH, owned) * costMult;
  if (cash < Math.ceil(first)) return 0;
  let n = Math.floor(Math.log((cash * (PRICE_GROWTH - 1)) / first + 1) / Math.log(PRICE_GROWTH));
  while (n > 0 && bulkPrice(def, owned, n, costMult) > cash) n--;
  while (bulkPrice(def, owned, n + 1, costMult) <= cash) n++;
  return n;
}

/** Cash refunded for selling `amount` of the `owned` units. */
export function sellRefund(def: OperationDef, owned: number, amount: number, costMult = 1): number {
  const n = Math.min(amount, owned);
  if (n <= 0) return 0;
  return Math.floor(bulkPrice(def, owned - n, n, costMult) * SELL_REFUND);
}

/**
 * Buys operations. `amount` of -1 buys as many as affordable.
 * Returns the number bought (0 if unaffordable).
 */
export function buyOperation(s: GameState, id: string, amount: number): number {
  const def = getOp(id);
  const st = s.ops[id];
  const { opCostMult } = computeMods(s);
  const n = amount < 0 ? maxAffordable(def, st.owned, s.cash, opCostMult) : Math.floor(amount);
  if (n <= 0) return 0;
  const price = bulkPrice(def, st.owned, n, opCostMult);
  if (price > s.cash) return 0;
  s.cash -= price;
  st.owned += n;
  st.highest = Math.max(st.highest, st.owned);
  s.stats.opsBoughtTotal += n;
  return n;
}

/** Sells operations. `amount` of -1 sells all. Returns cash refunded. */
export function sellOperation(s: GameState, id: string, amount: number): number {
  const def = getOp(id);
  const st = s.ops[id];
  const n = amount < 0 ? st.owned : Math.min(Math.floor(amount), st.owned);
  if (n <= 0) return 0;
  const refund = sellRefund(def, st.owned, n, computeMods(s).opCostMult);
  st.owned -= n;
  s.cash += refund;
  s.stats.opsSoldTotal += n;
  return refund;
}

/** Whether an operation should be shown (fully) in the store. */
export function isOperationRevealed(s: GameState, def: OperationDef): boolean {
  if (def.index === 0) return true;
  const st = s.ops[def.id];
  return st.owned > 0 || st.highest > 0 || s.earnedRun >= def.baseCost * 0.4 || s.cash >= def.baseCost;
}

export function totalOperationsOwned(s: GameState): number {
  let n = 0;
  for (const op of OPERATIONS) n += s.ops[op.id].owned;
  return n;
}
