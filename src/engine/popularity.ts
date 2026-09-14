import { GAMES } from '../data/games';
import type { Rng } from './rng';
import type { GameProgress, GameState } from './types';

export const POPULARITY_MIN = 0.25;
export const POPULARITY_MAX = 3;
export const POPULARITY_STEP = 5;
export const POPULARITY_HISTORY = 48;
/** Sample history every N steps (N * 5s). */
const HISTORY_EVERY = 6;

export function createGameProgress(unlocked: boolean, base = 1): GameProgress {
  return { unlocked, popularity: base, target: base, history: [base] };
}

function clamp(v: number): number {
  return Math.max(POPULARITY_MIN, Math.min(POPULARITY_MAX, v));
}

/** Mean-reverting random walk: popularity chases a slowly drifting target. */
export function stepPopularity(gp: GameProgress, base: number, volatility: number, rng: Rng): void {
  gp.target += (base - gp.target) * 0.01 + rng.gauss() * volatility * 0.08;
  gp.target = clamp(gp.target);
  gp.popularity += (gp.target - gp.popularity) * 0.06 + rng.gauss() * volatility * 0.04;
  gp.popularity = clamp(gp.popularity);
}

export function updatePopularity(s: GameState, dt: number, rng: Rng): void {
  s.popularityClock += dt;
  while (s.popularityClock >= POPULARITY_STEP) {
    s.popularityClock -= POPULARITY_STEP;
    const sample = Math.floor(s.time / POPULARITY_STEP) % HISTORY_EVERY === 0;
    for (const game of GAMES) {
      const gp = s.games[game.id];
      if (!gp) continue;
      stepPopularity(gp, game.basePopularity, game.volatility, rng);
      if (sample) {
        gp.history.push(Math.round(gp.popularity * 1000) / 1000);
        if (gp.history.length > POPULARITY_HISTORY) gp.history.splice(0, gp.history.length - POPULARITY_HISTORY);
      }
    }
  }
}

/** Instantly shifts a game's popularity (used by world events). */
export function shockPopularity(s: GameState, gameId: string, mult: number): void {
  const gp = s.games[gameId];
  if (!gp) return;
  gp.popularity = clamp(gp.popularity * mult);
  gp.target = clamp(gp.target * Math.sqrt(mult));
}
