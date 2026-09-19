import { OPERATIONS } from '../data/operations';
import { RARITY_COLORS, RARITY_NAMES } from '../data/palette';

/**
 * One rarity ladder for everything you can own: players, gear, staff, upgrades, achievements,
 * operations and house decor all use the same six bands (common grey, uncommon green, rare blue,
 * epic purple, legendary gold, mythic red), so a colour means the same thing on every screen.
 */
export const RARITY_BANDS = RARITY_COLORS.length;

const band = (n: number) => Math.max(0, Math.min(RARITY_BANDS - 1, Math.floor(n)));

export function rarityColor(b: number): string {
  return RARITY_COLORS[band(b)];
}

export function rarityName(b: number): string {
  return RARITY_NAMES[band(b)];
}

/** Upgrade tiers run 0-13: two tiers per band, and everything from tier 10 is mythic. */
export const UPGRADE_TIER_SPAN = 12;

export function upgradeBand(tier: number): number {
  return band(tier / 2);
}

export function tierColor(tier: number): string {
  return rarityColor(upgradeBand(tier));
}

/** How far through the whole tier ladder an upgrade sits, for the rank bar under its icon. */
export function tierRank(tier: number): number {
  return Math.max(0, Math.min(1, (tier + 1) / UPGRADE_TIER_SPAN));
}

/** Operations climb the bands in order, so later buildings read as rarer. */
export function opBand(index: number): number {
  return band((index * RARITY_BANDS) / OPERATIONS.length);
}

export function opColor(index: number): string {
  return rarityColor(opBand(index));
}

/** Decor and rooms: each room level is one band, from the Garage (common) to Orbital HQ (mythic). */
export function roomColor(room: number): string {
  return rarityColor(room);
}

/**
 * Rarity-style colours for a growing count. Staff have no tier of their own, so without this a
 * department of 500 looks exactly like a single hire.
 */
const QUALITY_STEPS = [5, 25, 75, 200, 500];

export function countQuality(n: number): string {
  let i = 0;
  while (i < QUALITY_STEPS.length && n >= QUALITY_STEPS[i]) i++;
  return rarityColor(i);
}
