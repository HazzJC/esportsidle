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
export const OPPONENT_GROWTH = 1.7;
/** Steepness of the win-probability curve. */
export const WIN_CURVE = 2.5;
/** Flat prize growth per tier. */
export const PRIZE_GROWTH = 3;
/** Fans per win at tier 0 and growth per tier. */
export const FAN_BASE = 2;
export const FAN_GROWTH = 2.6;
export const LOSS_FAN_RATIO = 0.25;
export const LOSS_PRIZE_RATIO = 0.1;

export const SEASON_LENGTH = 10;
export const PROMOTE_WINS = 7;
export const RELEGATE_WINS = 2;
export const TITLE_WINS = 9;

export function opponentRating(tier: number): number {
  return OPPONENT_BASE * Math.pow(OPPONENT_GROWTH, tier);
}

/** Seconds of operations income added to each win's prize: keeps matches relevant at every stage. */
export function prizeSeconds(tier: number): number {
  return 2 + 1.5 * tier;
}

export function winChance(teamRating: number, oppRating: number): number {
  if (teamRating <= 0) return 0;
  return 1 / (1 + Math.pow(oppRating / teamRating, WIN_CURVE));
}
