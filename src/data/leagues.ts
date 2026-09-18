export const TIER_NAMES = [
  'Ranked Queue',
  'Open Qualifiers',
  'Amateur Cup',
  'Collegiate League',
  'Semi-Pro Circuit',
  'Challenger Series',
  'Regional League',
  'National Pro League',
  'Continental Major',
  'World Championship',
  'Intercontinental Masters',
  'Orbital Invitational',
  'Galactic Series',
  'Multiverse Finals',
];

const ROMAN: [number, string][] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

export function roman(n: number): string {
  let out = '';
  let rest = Math.max(1, Math.floor(n));
  for (const [value, symbol] of ROMAN) {
    while (rest >= value) {
      out += symbol;
      rest -= value;
    }
  }
  return out;
}

export function tierName(tier: number): string {
  if (tier < TIER_NAMES.length) return TIER_NAMES[tier];
  return `${TIER_NAMES[TIER_NAMES.length - 1]} ${roman(tier - TIER_NAMES.length + 2)}`;
}

/** Opponent rating at a league tier. */
export const OPPONENT_BASE = 20;
export const OPPONENT_GROWTH = 2;
/** Steepness of the win-probability curve. */
export const WIN_CURVE = 2.5;
/**
 * Prize growth per tier. This is the single most dangerous number in the game: a team can only
 * climb one tier per season, so income grows like PRIZE_GROWTH^(tiers climbed) no matter what the
 * rest of the economy does. Buying rating costs more than linearly (gear tiers cost geometrically
 * but add stats linearly), so the ladder only settles if a tier's reward stays close to the rating
 * it demands — keep this near OPPONENT_GROWTH, never far above it.
 */
export const PRIZE_GROWTH = 2.2;
/** Fans per win at tier 0 and growth per tier. Kept below PRIZE_GROWTH: fans feed fame and merch. */
export const FAN_BASE = 2;
export const FAN_GROWTH = 1.9;
export const LOSS_FAN_RATIO = 0.25;
export const LOSS_PRIZE_RATIO = 0.1;

export const SEASON_LENGTH = 16;
export const PROMOTE_WINS = 12;
export const RELEGATE_WINS = 3;
export const TITLE_WINS = 15;

export function opponentRating(tier: number): number {
  return OPPONENT_BASE * Math.pow(OPPONENT_GROWTH, tier);
}

/**
 * Seconds of operations income added to each win's prize. This keeps matches relevant at every
 * stage, but it is deliberately small and capped: if it grew with tier, match income would scale
 * with operations income across every team and run away.
 */
export const PRIZE_CPS_SECONDS = 0.8;

export function prizeSeconds(tier: number): number {
  return PRIZE_CPS_SECONDS + 0.05 * Math.min(tier, 10);
}

export function winChance(teamRating: number, oppRating: number): number {
  if (teamRating <= 0) return 0;
  return 1 / (1 + Math.pow(oppRating / teamRating, WIN_CURVE));
}
