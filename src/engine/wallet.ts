import type { GameState, IncomeSource } from './types';

/**
 * Pays the org. Every caller names the system the money came from, which keeps a running breakdown
 * of the run's income for the Stats screen and the balance sim.
 */
export function earnCash(s: GameState, amount: number, source: IncomeSource = 'event'): void {
  if (!(amount > 0)) return;
  s.cash += amount;
  s.earnedRun += amount;
  s.earnedTotal += amount;
  s.incomeRun[source] = (s.incomeRun[source] ?? 0) + amount;
  s.incomeTotal[source] = (s.incomeTotal[source] ?? 0) + amount;
}

export function gainFans(s: GameState, amount: number): void {
  if (!(amount > 0)) return;
  s.fans += amount;
  s.fansRun += amount;
  s.fansTotal += amount;
}

export function gainTrophies(s: GameState, amount: number): void {
  if (!(amount > 0)) return;
  s.trophies += amount;
  s.stats.trophiesTotal += amount;
}

export function spendCash(s: GameState, amount: number): boolean {
  if (!(amount >= 0) || s.cash < amount) return false;
  s.cash -= amount;
  return true;
}
