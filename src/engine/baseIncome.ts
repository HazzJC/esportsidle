import type { GameState, Rates } from './types';

/**
 * Prices that are tied to income (gear, a market reroll, a PR clean-up, a charity stream, tournament
 * preparation) use *base income*: operations income with no temporary buffs, smoothed over a few
 * minutes. Two rules follow:
 *
 * - Hype never moves a price. A crowd, a frenzy or a scandal changes what you earn, not what things
 *   cost, so nobody buys something in a hype streak and watches it get ten times cheaper afterwards.
 * - Prices follow income slowly, in both directions. Buying a building raises what later prices are
 *   measured against over minutes, not in the same instant.
 *
 * Rewards that are a number of minutes of income (quests, Hype Drops) read the live base income
 * (`rates.cpsNoBuffs`) and do not need the smoothing, since they are paid, not charged.
 */
export const PRICE_INCOME_SECONDS = 300;

/** The income that prices are measured against right now. */
export function baseIncome(s: Pick<GameState, 'priceIncome'>, rates: Pick<Rates, 'cpsNoBuffs'>): number {
  return s.priceIncome > 0 ? s.priceIncome : rates.cpsNoBuffs;
}

/** Moves the smoothed base income towards the live one. Call once per tick with the tick's `dt`. */
export function updatePriceIncome(s: Pick<GameState, 'priceIncome'>, live: number, dt: number): void {
  if (!(s.priceIncome > 0)) {
    s.priceIncome = Math.max(0, live);
    return;
  }
  s.priceIncome += (live - s.priceIncome) * (1 - Math.exp(-dt / PRICE_INCOME_SECONDS));
}
