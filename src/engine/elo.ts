import { ELO_BASE, ELO_K, ELO_PER_TIER, PROMOTE_MARGIN, RELEGATE_MARGIN } from '../data/leagues';
import type { TeamState } from './types';

/**
 * Team Elo: what a team has shown it can do, as opposed to what its roster is rated at today.
 *
 * Every league tier has an Elo, ELO_PER_TIER apart (one tier doubles the opposition, and the win
 * curve makes a doubling worth 301 points). A team's Elo moves a little after every match: a win over
 * an opponent it was expected to beat barely moves it, a win over a better side moves it a lot. So
 * Elo settles at the level the roster really plays at, and cannot be run up by stomping a league that
 * is too easy. Promotion is gated on it: a team moves up once it has shown it belongs one tier higher.
 */
export function tierElo(tier: number): number {
  return ELO_BASE + ELO_PER_TIER * Math.max(0, tier);
}

/** The chance Elo `a` beats Elo `b`, 0 to 1. */
export function eloExpected(a: number, b: number): number {
  return 1 / (1 + Math.pow(10, (b - a) / 400));
}

/** Elo a team in `tier` needs to be promoted: nearly the next tier's level, so it has a fair fight there. */
export function promotionElo(tier: number): number {
  return tierElo(tier + 1) - PROMOTE_MARGIN;
}

/** Below this Elo a team in `tier` is out of its depth and drops down. */
export function relegationElo(tier: number): number {
  return tier <= 0 ? -Infinity : tierElo(tier) - RELEGATE_MARGIN;
}

/** The team's Elo, filling it in for teams made before Elo existed. */
export function teamElo(team: Pick<TeamState, 'elo' | 'tier'>): number {
  return team.elo ?? tierElo(team.tier);
}

export function canPromote(team: Pick<TeamState, 'elo' | 'tier'>): boolean {
  return teamElo(team) >= promotionElo(team.tier);
}

/** Moves the team's Elo after a match played in its current tier. */
export function recordEloResult(team: Pick<TeamState, 'elo' | 'tier'>, win: boolean): void {
  const elo = teamElo(team);
  team.elo = elo + ELO_K * ((win ? 1 : 0) - eloExpected(elo, tierElo(team.tier)));
}
