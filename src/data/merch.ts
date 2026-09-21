/** The default 32-colour palette for new designs. */
export const DESIGN_PALETTE = [
  '#0b0e1f',
  '#1d2347',
  '#3a4273',
  '#8d95c9',
  '#e9ecff',
  '#ffffff',
  '#22e4ff',
  '#1a8fb3',
  '#ff2bd6',
  '#9e1a85',
  '#8b5cff',
  '#4b2fa3',
  '#3dff9a',
  '#1c9e5c',
  '#9dff3b',
  '#5f9e1f',
  '#ffc83d',
  '#c48a17',
  '#ff8a3d',
  '#b3561c',
  '#ff4d6d',
  '#a3213c',
  '#6b4423',
  '#a0662d',
  '#d9a441',
  '#f2d27a',
  '#f6d0ae',
  '#b87b4f',
  '#4a2c1c',
  '#2d6a4f',
  '#264653',
  '#7f5539',
];

export type TrendId = 'neon' | 'minimal' | 'retro' | 'chaotic' | 'mono' | 'bold';

export interface TrendDef {
  id: TrendId;
  name: string;
  desc: string;
  icon: string;
}

export const TRENDS: TrendDef[] = [
  { id: 'neon', name: 'Neon', desc: 'Bright, saturated colours that glow on stream.', icon: 'zap' },
  { id: 'minimal', name: 'Minimal', desc: 'Two or three colours and plenty of empty space.', icon: 'square' },
  { id: 'retro', name: 'Retro', desc: 'Warm, earthy tones straight out of the 80s.', icon: 'sun' },
  { id: 'chaotic', name: 'Chaotic', desc: 'As many colours as you can fit. More is more.', icon: 'sparkles' },
  { id: 'mono', name: 'Monochrome', desc: 'Shades of a single colour.', icon: 'circle' },
  { id: 'bold', name: 'Bold', desc: 'Big, filled, high-contrast shapes.', icon: 'flame' },
];

export const TREND_MAP: Map<TrendId, TrendDef> = new Map(TRENDS.map((t) => [t.id, t]));

export interface ProductDef {
  id: string;
  name: string;
  icon: string;
  unlockCost: number;
  unlockFans: number;
  /** Nominal price in dollars (used for per-unit numbers). */
  basePrice: number;
  /** Share of operations income a perfect line of this product earns. */
  cpsShare: number;
  desc: string;
}

export const PRODUCTS: ProductDef[] = [
  { id: 'tee', name: 'T-Shirt', icon: 'shirt', unlockCost: 25_000, unlockFans: 25_000, basePrice: 25, cpsShare: 0.02, desc: 'The classic. Every fan owns at least three.' },
  { id: 'cap', name: 'Snapback Cap', icon: 'graduation-cap', unlockCost: 250_000, unlockFans: 100_000, basePrice: 30, cpsShare: 0.025, desc: 'Worn backwards, obviously.' },
  { id: 'mug', name: 'Mug', icon: 'coffee', unlockCost: 2e6, unlockFans: 300_000, basePrice: 18, cpsShare: 0.03, desc: 'For energy drinks. Nobody drinks coffee from these.' },
  { id: 'mousepad', name: 'XXL Mousepad', icon: 'mouse', unlockCost: 2e7, unlockFans: 1e6, basePrice: 35, cpsShare: 0.04, desc: 'Covers the entire desk and part of the floor.' },
  { id: 'hoodie', name: 'Hoodie', icon: 'shirt', unlockCost: 2e8, unlockFans: 5e6, basePrice: 70, cpsShare: 0.05, desc: 'Hood up, headphones on, game face.' },
  { id: 'poster', name: 'Poster', icon: 'image', unlockCost: 2e9, unlockFans: 15e6, basePrice: 20, cpsShare: 0.05, desc: 'Signed prints for bedroom walls everywhere.' },
  { id: 'keycaps', name: 'Keycap Set', icon: 'keyboard', unlockCost: 2e10, unlockFans: 5e7, basePrice: 90, cpsShare: 0.06, desc: 'Artisan keycaps. Sold out in 11 seconds.' },
  { id: 'jersey', name: 'Replica Jersey', icon: 'shirt', unlockCost: 2e11, unlockFans: 2.5e8, basePrice: 120, cpsShare: 0.07, desc: 'Just like the pros wear, minus the sweat.' },
  { id: 'sneakers', name: 'Signature Sneakers', icon: 'footprints', unlockCost: 2e12, unlockFans: 1.25e9, basePrice: 220, cpsShare: 0.08, desc: 'Resold for ten times the price within the hour.' },
  { id: 'plushie', name: 'Player Plushie', icon: 'cat', unlockCost: 2e13, unlockFans: 5e9, basePrice: 45, cpsShare: 0.1, desc: 'Squishy versions of your stars. Wildly popular.' },
];

export const PRODUCT_MAP: Map<string, ProductDef> = new Map(PRODUCTS.map((p) => [p.id, p]));

/**
 * The finish a product line is made to, from bulk stock up to a museum piece. Each level is one
 * "Improve finish" purchase and adds to how well the line sells, the way gear tiers add to stats.
 */
export const FINISH_NAMES = [
  'Bulk stock',
  'Screen print',
  'Heat press',
  'Contrast trim',
  'Stitched crest',
  'Premium materials',
  'Gloss finish',
  'Limited run',
  'Signed edition',
  "Collector's box",
  'Hall of Fame edition',
];

/** Sales added per finish level: a Q4 line sells 2.4 times what bulk stock does. */
export const FINISH_SALES_PER_LEVEL = 0.35;

/** Rarity band 0-5 for a finish level, on the same colour ladder as gear and upgrades. */
export function finishBand(quality: number): number {
  return Math.max(0, Math.min(5, Math.floor(quality / 2)));
}

export function finishSalesMult(quality: number): number {
  return 1 + Math.max(0, quality) * FINISH_SALES_PER_LEVEL;
}
