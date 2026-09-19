import type { TeamState } from './types';

/**
 * Competitive balance. A team that parks in a league it has outgrown should do worse than one that
 * pushes up and wins some of the time. Two levers make that true:
 *
 * - Stakes: crowds and sponsors pay for contests, not foregone conclusions, so prize money and fans
 *   shrink once the win chance passes STAKES_START. Expected income per match peaks around that
 *   point, and the next tier's bigger purse does the rest.
 * - Mood: players react to their recent run of results (form). Close competition fires them up and
 *   endless defeats frustrate them. Endless stomps only bore them when the org is holding them back
 *   with auto-promote switched off; a dominant team that is still climbing is just on a roll.
 */

/** Weight of each new result in a team's form: roughly a season of memory. */
export const FORM_WEIGHT = 1 / 12;
/** Form at or above this is a team coasting through a league it has outgrown. */
export const BORED_FORM = 0.85;
/** Form at or below this is a team being beaten week after week. */
export const FRUSTRATED_FORM = 0.25;
/** The band where matches feel like a real contest. */
export const ENGAGED_MIN = 0.4;
export const ENGAGED_MAX = 0.75;
/** A change of tier pulls form this far back towards even, since the opposition is new. */
export const TIER_CHANGE_RESET = 0.5;

/** Win chance above which crowds start to lose interest. Matches the bar for challenging up a tier. */
export const STAKES_START = 0.75;
/** Share of prize money and fans lost at a certain win. */
export const STAKES_DROP = 0.5;

export type TeamMood = 'engaged' | 'settled' | 'rolling' | 'bored' | 'frustrated';

export interface MoodDef {
  name: string;
  icon: string;
  tone: 'good' | 'muted' | 'bad';
  summary: string;
  /** XP multiplier for starters. */
  xp: number;
  /** Morale change for a starter after a win and after a loss. */
  moraleWin: number;
  moraleLoss: number;
}

export const MOODS: Record<TeamMood, MoodDef> = {
  engaged: {
    name: 'Fired up',
    icon: 'flame',
    tone: 'good',
    summary: 'Every match is a real contest. Players learn fast and take losses in their stride.',
    xp: 1.25,
    moraleWin: 3,
    moraleLoss: -3,
  },
  settled: {
    name: 'Settled',
    icon: 'circle',
    tone: 'muted',
    summary: 'A normal run of results.',
    xp: 1,
    moraleWin: 3,
    moraleLoss: -4,
  },
  rolling: {
    name: 'On a roll',
    icon: 'trending-up',
    tone: 'muted',
    summary: 'Winning almost every match on the way to promotion. Lopsided matches pay less, so challenge up a tier early if they stay this dominant.',
    xp: 1,
    moraleWin: 3,
    moraleLoss: -4,
  },
  bored: {
    name: 'Bored',
    icon: 'face-slightly-frowning',
    tone: 'bad',
    summary: 'Winning almost every match with promotion switched off. Players are coasting, learning little and getting restless. Challenge up a tier.',
    xp: 0.5,
    moraleWin: -2,
    moraleLoss: -4,
  },
  frustrated: {
    name: 'Frustrated',
    icon: 'trending-down',
    tone: 'bad',
    summary: 'Losing week after week. Morale takes a beating. Strengthen the lineup or drop a tier.',
    xp: 0.9,
    moraleWin: 5,
    moraleLoss: -7,
  },
};

export function moodFor(form: number, climbing = false): TeamMood {
  if (form >= BORED_FORM) return climbing ? 'rolling' : 'bored';
  if (form <= FRUSTRATED_FORM) return 'frustrated';
  if (form >= ENGAGED_MIN && form <= ENGAGED_MAX) return 'engaged';
  return 'settled';
}

/** A team with auto-promote on is still climbing, so dominance there is a roll, not boredom. */
export function teamMood(team: Pick<TeamState, 'form' | 'autoPromote'>): TeamMood {
  return moodFor(team.form, team.autoPromote);
}

/** Records one result in the team's form. */
export function recordForm(team: Pick<TeamState, 'form'>, win: boolean): void {
  team.form += ((win ? 1 : 0) - team.form) * FORM_WEIGHT;
}

/** A new tier means new opposition, so recent form counts for less. */
export function resetFormForTier(team: Pick<TeamState, 'form'>): void {
  team.form = 0.5 + (team.form - 0.5) * TIER_CHANGE_RESET;
}

/** Prize and fan multiplier for a match with this win chance. */
export function stakesMult(winChance: number): number {
  const over = Math.max(0, Math.min(1, (winChance - STAKES_START) / (1 - STAKES_START)));
  return 1 - STAKES_DROP * over;
}
