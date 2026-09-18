import { RARITY_COLORS } from '../data/palette';

/**
 * Frame colours for upgrade tiers. Ordered so rank reads at a glance: base metals first, then the
 * rarity gems, then white-hot. The previous list was thirteen unrelated hues with no order to learn.
 */
export const TIER_COLORS = [
  '#8d8a84',
  '#c98a55',
  '#c9ccd1',
  '#f5c451',
  RARITY_COLORS[1],
  RARITY_COLORS[2],
  RARITY_COLORS[3],
  RARITY_COLORS[5],
  '#ff6b35',
  '#ffb27a',
  '#ffe2b8',
  '#fff4e0',
  '#ffffff',
];

export function tierColor(tier: number): string {
  return TIER_COLORS[Math.max(0, Math.min(tier, TIER_COLORS.length - 1))];
}

/** Distinct hue per operation lane. */
export function laneHue(index: number): number {
  return (index * 47 + 190) % 360;
}

/**
 * Rarity-style colours for a growing count. Staff and decor have no tier of their own, so without
 * this a department of 500 looks exactly like a single hire.
 */
export const QUALITY_COLORS = RARITY_COLORS;
const QUALITY_STEPS = [5, 25, 75, 200, 500];

export function countQuality(n: number): string {
  let i = 0;
  while (i < QUALITY_STEPS.length && n >= QUALITY_STEPS[i]) i++;
  return QUALITY_COLORS[i];
}
