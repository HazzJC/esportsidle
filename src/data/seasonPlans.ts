export type SeasonPlan = 'development' | 'balanced' | 'push';

/**
 * A team's plan for the season. Plans trade results now against players later, and the auto-sub
 * logic carries them out: Development rotates the squad early so the bench plays and learns, Push
 * keeps the strongest lineup on until players are nearly spent.
 */
export interface SeasonPlanDef {
  id: SeasonPlan;
  name: string;
  icon: string;
  summary: string;
  /** Team rating multiplier: how hard the team competes. */
  rating: number;
  /** XP multiplier for players who play. */
  xp: number;
  /** Share of a match's XP that bench players earn in training. */
  benchXp: number;
  /** Energy drain per match multiplier. */
  drain: number;
  /** Energy recovery multiplier. */
  recovery: number;
  /** Starters below this energy are rotated out when a rested substitute is available. */
  subAt: number;
  /** Injury chance multiplier for starters: pushing hard gets people hurt. */
  injuryRisk: number;
}

export const SEASON_PLANS: Record<SeasonPlan, SeasonPlanDef> = {
  development: {
    id: 'development',
    name: 'Development',
    icon: 'graduation-cap',
    summary: 'Rotate the squad and drill fundamentals. Weaker results, much faster growth.',
    rating: 0.9,
    xp: 1.8,
    benchXp: 0.5,
    drain: 0.8,
    recovery: 1.25,
    subAt: 60,
    injuryRisk: 0.7,
  },
  balanced: {
    id: 'balanced',
    name: 'Balanced',
    icon: 'activity',
    summary: 'Compete properly and keep players fresh.',
    rating: 1,
    xp: 1,
    benchXp: 0.15,
    drain: 1,
    recovery: 1,
    subAt: 35,
    injuryRisk: 1,
  },
  push: {
    id: 'push',
    name: 'Push for Promotion',
    icon: 'flame',
    summary: 'Best lineup every match. Stronger now, but players tire fast and learn little.',
    rating: 1.12,
    xp: 0.6,
    benchXp: 0,
    drain: 1.35,
    recovery: 0.85,
    subAt: 20,
    injuryRisk: 1.6,
  },
};

export const SEASON_PLAN_ORDER: SeasonPlan[] = ['development', 'balanced', 'push'];

/** A player ages a year every this many seasons with the org. */
export const SEASONS_PER_YEAR = 2;
/** From this age a birthday costs a little skill and ceiling. */
export const DECLINE_AGE = 29;
/** From this age a player may announce they will retire at the end of the next season. */
export const RETIRE_AGE = 31;
/** Chance to announce retirement per birthday, per year past RETIRE_AGE - 1. */
export const RETIRE_CHANCE_PER_YEAR = 0.25;
