/** Frame colours for upgrade tiers, from plain to neon. */
export const TIER_COLORS = [
  '#9aa3c7',
  '#cd8b4e',
  '#c9d3e6',
  '#ffc83d',
  '#3dff9a',
  '#22a8ff',
  '#ff4d6d',
  '#b05cff',
  '#22e4ff',
  '#ff2bd6',
  '#9dff3b',
  '#ff8a3d',
  '#ffffff',
];

export function tierColor(tier: number): string {
  return TIER_COLORS[Math.max(0, Math.min(tier, TIER_COLORS.length - 1))];
}

/** Distinct hue per operation lane. */
export function laneHue(index: number): number {
  return (index * 47 + 190) % 360;
}
