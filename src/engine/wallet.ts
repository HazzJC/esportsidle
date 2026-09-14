import type { GameState } from './types';

export function earnCash(s: GameState, amount: number): void {
  if (!(amount > 0)) return;
  s.cash += amount;
  s.earnedRun += amount;
  s.earnedTotal += amount;
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
