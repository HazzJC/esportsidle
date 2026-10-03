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
/**
 * Fans per win at tier 0 and growth per tier. Well below PRIZE_GROWTH: fans feed fame and merch, and
 * teams climb about a tier per season, so fans grow like FAN_GROWTH^(tiers climbed). At 1.9 that was
 * ×1000 an hour and the run never levelled off; 1.5 keeps promotions exciting without compounding.
 */
export const FAN_BASE = 2;
export const FAN_GROWTH = 1.5;
export const LOSS_FAN_RATIO = 0.25;
export const LOSS_PRIZE_RATIO = 0.1;

export const SEASON_LENGTH = 16;
/** Wins in a season that take the league title (a trophy and a bonus). Promotion goes by Elo instead. */
export const TITLE_WINS = 15;

/**
 * Team Elo (engine/elo.ts). A tier doubles the opposition; the win curve is p / (1 - p) = (rating /
 * opponent)^WIN_CURVE, so a doubling is worth 400 · WIN_CURVE · log10(2) = 301 Elo.
 */
export const ELO_BASE = 1000;
export const ELO_PER_TIER = 400 * WIN_CURVE * Math.log10(OPPONENT_GROWTH);
/**
 * How far one match can move a team's Elo. Small enough that luck over a season (16 matches) moves it
 * by under about 50 points, so one hot streak does not promote a team that is not ready, and a cold one
 * does not drop it.
 */
export const ELO_K = 24;
/**
 * A team is promoted at this far below the next tier's Elo, where it would win about two in five
 * there and about four in five where it is.
 */
export const PROMOTE_MARGIN = 70;
/**
 * A team this far below its own tier's Elo (winning about one in five) drops a tier. Well clear of the
 * promotion line's side of the next tier, so a team promoted on a lucky run is not sent straight back.
 */
export const RELEGATE_MARGIN = 230;

export function opponentRating(tier: number): number {
  return OPPONENT_BASE * Math.pow(OPPONENT_GROWTH, tier);
}

/**
 * Seconds of operations income added to each win's prize. This keeps matches relevant at every
 * stage, but it is deliberately small: if it grew quickly with tier, match income would scale with
 * operations income across every team and run away. It grows steadily to tier 10 and then ever more
 * slowly, never stopping.
 */
export const PRIZE_CPS_SECONDS = 0.8;
/** n teams earn n^this times one team from the income-linked part of prizes (see teamShareDivisor). */
export const TEAM_SHARE_EXPONENT = 0.65;

export function prizeSeconds(tier: number): number {
  const t = Math.max(0, tier);
  return PRIZE_CPS_SECONDS + 0.05 * (t <= 10 ? t : 10 + 4 * Math.log(1 + (t - 10) / 4));
}

export function winChance(teamRating: number, oppRating: number): number {
  if (teamRating <= 0) return 0;
  return 1 / (1 + Math.pow(oppRating / teamRating, WIN_CURVE));
}
