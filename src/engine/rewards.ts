import { OPERATIONS } from '../data/operations';
import { SECTIONS } from './sections';
import { PRICE_GROWTH, geometricPrice } from './pricing';
import type { Rng } from './rng';
import type { GameState, Mods } from './types';

/**
 * Lump-sum rewards (Hype Drop cash, quest cash, investors) are paid in minutes of income. How many
 * depends on how far into the run the org is, so an early drop is a nice bump and never a leap past
 * several tiers of buildings, and a late drop is worth catching without ending the run.
 */

/** Hours into the run -> the most minutes of base income a drop can pay. Linear between anchors. */
export const DROP_CAP_ANCHORS: [hours: number, minutes: number][] = [
  [0, 1],
  [1, 6],
  [2, 15],
  [3, 30],
  [4, 45],
];
/** After the last anchor the cap keeps growing, ever more slowly, and never stops. */
export const DROP_CAP_TAIL_MINUTES = 20;

/** The most minutes of base income one drop can pay this far into the run. */
export function dropCapMinutes(runHours: number): number {
  const h = Math.max(0, runHours);
  for (let i = 1; i < DROP_CAP_ANCHORS.length; i++) {
    const [h0, m0] = DROP_CAP_ANCHORS[i - 1];
    const [h1, m1] = DROP_CAP_ANCHORS[i];
    if (h <= h1) return m0 + ((m1 - m0) * (h - h0)) / (h1 - h0);
  }
  const [hLast, mLast] = DROP_CAP_ANCHORS[DROP_CAP_ANCHORS.length - 1];
  return mLast + DROP_CAP_TAIL_MINUTES * Math.log(1 + (h - hLast) / 2);
}

export function runHours(s: Pick<GameState, 'time' | 'runStartTime'>): number {
  return Math.max(0, (s.time - s.runStartTime) / 3600);
}

/**
 * How much of the cap a drop pays, 0 to 1. A bell curve leaning towards good: most drops land around
 * 70% of the cap, a few are a top roll, a few are small, and none is worthless.
 */
export const DROP_ROLL_MEAN = 0.7;
export const DROP_ROLL_SPREAD = 0.2;
export const DROP_ROLL_MIN = 0.25;

export function dropRoll(rng: Rng): number {
  return Math.max(DROP_ROLL_MIN, Math.min(1, DROP_ROLL_MEAN + DROP_ROLL_SPREAD * rng.gauss()));
}

/** Minutes of base income one roll of a drop pays right now. */
export function dropMinutes(s: Pick<GameState, 'time' | 'runStartTime'>, rng: Rng): number {
  return dropCapMinutes(runHours(s)) * dropRoll(rng);
}

/**
 * A drop pays the greater of its minutes of income and a small share of the bank, so a player who just
 * spent still gets a real payout and one who is saving gets a nice slice of what they are saving for.
 * The bank part may run to twice the cap (and no further), so a vault does not break a run either.
 */
export function dropPayout(s: Pick<GameState, 'cash' | 'time' | 'runStartTime'>, minutes: number, baseCps: number, cashShare: number, floor = 13): number {
  const byIncome = minutes * 60 * baseCps;
  const bankLimit = 2 * dropCapMinutes(runHours(s)) * 60 * baseCps;
  const byBank = Math.min(s.cash * cashShare, bankLimit);
  return Math.max(byIncome, byBank, floor);
}

/** Whether the org is still meeting the game: a tab is locked. Rewards then cannot skip a tier. */
export function earlyGame(s: Pick<GameState, 'sections'>): boolean {
  return SECTIONS.some((d) => d.unlock && s.sections[d.id] === undefined);
}

/**
 * While the org is early, a lump sum cannot be more than the price of one unit of the first building
 * it has never owned. That is enough to fund the next step, never several steps at once, so the
 * explanations and new mechanics that come with each building are not skipped over.
 */
type PriceMods = Partial<Pick<Mods, 'opCostMult' | 'opFirstUnits'>>;

export function earlyRewardLimit(s: GameState, mods: PriceMods = {}): number {
  if (!earlyGame(s)) return Infinity;
  const next = OPERATIONS.find((op) => s.ops[op.id].highest === 0);
  if (!next) return Infinity;
  const discount = mods.opFirstUnits?.[next.id];
  return geometricPrice(next.baseCost, 0, 1, (mods.opCostMult ?? 1) * (discount && discount.units > 0 ? discount.mult : 1), next.priceGrowth ?? PRICE_GROWTH);
}

export function limitReward(s: GameState, mods: PriceMods, amount: number): number {
  return Math.min(amount, earlyRewardLimit(s, mods));
}
