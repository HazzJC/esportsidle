import { OPERATIONS, getOp, type OperationDef } from '../data/operations';
import { computeMods } from './economy';
import { PRICE_GROWTH, geometricMax, geometricPrice } from './pricing';
import { operationsOpen } from './tutorial';
import type { GameState, OpDiscount } from './types';

export { PRICE_GROWTH };
export const SELL_REFUND = 0.25;

/** Units of `amount`, starting after `owned`, that fall inside a first-units discount. */
function discounted(owned: number, amount: number, discount?: OpDiscount): number {
  if (!discount || discount.mult === 1) return 0;
  return Math.max(0, Math.min(amount, discount.units - owned));
}

type Priced = Pick<OperationDef, 'baseCost' | 'priceGrowth'>;

/**
 * Price of buying `amount` units when `owned` are already owned. `discount` makes the first few units
 * of this operation cheaper (`Mods.opFirstUnits`).
 */
export function bulkPrice(def: Priced, owned: number, amount: number, costMult = 1, discount?: OpDiscount): number {
  const g = def.priceGrowth ?? PRICE_GROWTH;
  const k = discounted(owned, amount, discount);
  if (k === 0) return geometricPrice(def.baseCost, owned, amount, costMult, g);
  return geometricPrice(def.baseCost, owned, k, costMult * discount!.mult, g) + geometricPrice(def.baseCost, owned + k, amount - k, costMult, g);
}

export function unitPrice(def: Priced, owned: number, costMult = 1, discount?: OpDiscount): number {
  return bulkPrice(def, owned, 1, costMult, discount);
}

/** Largest number of units purchasable with `cash`. */
export function maxAffordable(def: Priced, owned: number, cash: number, costMult = 1, discount?: OpDiscount): number {
  const g = def.priceGrowth ?? PRICE_GROWTH;
  const room = discounted(owned, Infinity, discount);
  if (room === 0) return geometricMax(def.baseCost, owned, cash, costMult, g);
  const cheap = Math.min(room, geometricMax(def.baseCost, owned, cash, costMult * discount!.mult, g));
  if (cheap < room) return cheap;
  return cheap + geometricMax(def.baseCost, owned + cheap, cash - bulkPrice(def, owned, cheap, costMult, discount), costMult, g);
}

/** Cash refunded for selling `amount` of the `owned` units. */
export function sellRefund(def: Priced, owned: number, amount: number, costMult = 1, discount?: OpDiscount): number {
  const n = Math.min(amount, owned);
  if (n <= 0) return 0;
  return Math.floor(bulkPrice(def, owned - n, n, costMult, discount) * SELL_REFUND);
}

/**
 * Buys operations. `amount` of -1 buys as many as affordable.
 * Returns the number bought (0 if unaffordable).
 */
export function buyOperation(s: GameState, id: string, amount: number): number {
  if (!operationsOpen(s)) return 0;
  const def = getOp(id);
  const st = s.ops[id];
  const { opCostMult, opFirstUnits } = computeMods(s);
  const discount = opFirstUnits[id];
  const n = amount < 0 ? maxAffordable(def, st.owned, s.cash, opCostMult, discount) : Math.floor(amount);
  if (n <= 0) return 0;
  const price = bulkPrice(def, st.owned, n, opCostMult, discount);
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
  const mods = computeMods(s);
  const refund = sellRefund(def, st.owned, n, mods.opCostMult, mods.opFirstUnits[id]);
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
