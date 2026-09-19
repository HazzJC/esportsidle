import { OPERATIONS, getOp, type OperationDef } from '../data/operations';
import { computeMods } from './economy';
import { PRICE_GROWTH, geometricMax, geometricPrice } from './pricing';
import { operationsOpen } from './tutorial';
import type { GameState } from './types';

export { PRICE_GROWTH };
export const SELL_REFUND = 0.25;

/** Price of buying `amount` units when `owned` are already owned. */
export function bulkPrice(def: Pick<OperationDef, 'baseCost'>, owned: number, amount: number, costMult = 1): number {
  return geometricPrice(def.baseCost, owned, amount, costMult);
}

export function unitPrice(def: Pick<OperationDef, 'baseCost'>, owned: number, costMult = 1): number {
  return geometricPrice(def.baseCost, owned, 1, costMult);
}

/** Largest number of units purchasable with `cash`. */
export function maxAffordable(def: Pick<OperationDef, 'baseCost'>, owned: number, cash: number, costMult = 1): number {
  return geometricMax(def.baseCost, owned, cash, costMult);
}

/** Cash refunded for selling `amount` of the `owned` units. */
export function sellRefund(def: Pick<OperationDef, 'baseCost'>, owned: number, amount: number, costMult = 1): number {
  const n = Math.min(amount, owned);
  if (n <= 0) return 0;
  return Math.floor(geometricPrice(def.baseCost, owned - n, n, costMult) * SELL_REFUND);
}

/**
 * Buys operations. `amount` of -1 buys as many as affordable.
 * Returns the number bought (0 if unaffordable).
 */
export function buyOperation(s: GameState, id: string, amount: number): number {
  if (!operationsOpen(s)) return 0;
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

/** Trophies needed to raise an operation from `level` to `level + 1`. Each level adds +1% production. */
export function operationLevelCost(level: number): number {
  return level + 1;
}

export function levelUpOperation(s: GameState, id: string): boolean {
  const st = s.ops[id];
  if (!st || st.owned < 1) return false;
  const cost = operationLevelCost(st.level);
  if (s.trophies < cost) return false;
  s.trophies -= cost;
  st.level++;
  s.stats.opLevels++;
  return true;
}

export function totalOperationsOwned(s: GameState): number {
  let n = 0;
  for (const op of OPERATIONS) n += s.ops[op.id].owned;
  return n;
}
