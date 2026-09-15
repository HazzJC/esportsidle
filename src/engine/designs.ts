import { DESIGN_PALETTE, TREND_MAP, type TrendId } from '../data/merch';
import type { Rng } from './rng';
import type { Design, GameState } from './types';

export const PIXEL_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const DESIGN_SIZES = [16, 32, 64];
export const MAX_DESIGNS = 24;
/** Index 0 is transparent, so a design can use up to 35 colours. */
export const MAX_PALETTE = PIXEL_ALPHABET.length - 1;

const HEX = /^#[0-9a-f]{6}$/i;
const CHAR_INDEX: Record<string, number> = {};
for (let i = 0; i < PIXEL_ALPHABET.length; i++) CHAR_INDEX[PIXEL_ALPHABET[i]] = i;

export function blankPixels(size: number): string {
  return '0'.repeat(size * size);
}

export function decodePixels(d: Pick<Design, 'size' | 'pixels'>): Uint8Array {
  const out = new Uint8Array(d.size * d.size);
  for (let i = 0; i < out.length; i++) out[i] = CHAR_INDEX[d.pixels[i]] ?? 0;
  return out;
}

export function encodePixels(values: ArrayLike<number>): string {
  const chars: string[] = new Array(values.length);
  for (let i = 0; i < values.length; i++) chars[i] = PIXEL_ALPHABET[Math.max(0, Math.min(MAX_PALETTE, values[i] | 0))];
  return chars.join('');
}

/** Normalises a design from untrusted input (imported saves). */
export function sanitizeDesign(raw: Partial<Design> & { id: string }): Design {
  const size = DESIGN_SIZES.includes(Number(raw.size)) ? Number(raw.size) : 32;
  const palette = (Array.isArray(raw.palette) ? raw.palette : DESIGN_PALETTE)
    .filter((c): c is string => typeof c === 'string' && HEX.test(c))
    .slice(0, MAX_PALETTE);
  if (palette.length === 0) palette.push(...DESIGN_PALETTE);
  const source = typeof raw.pixels === 'string' ? raw.pixels : '';
  const values = new Uint8Array(size * size);
  for (let i = 0; i < values.length; i++) {
    const idx = CHAR_INDEX[source[i]] ?? 0;
    values[i] = idx <= palette.length ? idx : 0;
  }
  return {
    id: String(raw.id),
    name: String(raw.name ?? 'Untitled').slice(0, 24) || 'Untitled',
    size,
    palette,
    pixels: encodePixels(values),
    handmade: raw.handmade !== false,
    createdAt: Number(raw.createdAt) || 0,
    version: Number(raw.version) || 1,
  };
}

// ---------------------------------------------------------------------------
// Colour helpers
// ---------------------------------------------------------------------------
export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return [h * 60, s, l];
}

export function luminance(r: number, g: number, b: number): number {
  const f = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

// ---------------------------------------------------------------------------
// Appeal
// ---------------------------------------------------------------------------
export interface AppealBreakdown {
  colors: number;
  coverage: number;
  symmetry: number;
  contrast: number;
  trend: number;
  total: number;
  usedColors: number;
  fill: number;
  hints: string[];
}

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
const HANDMADE_BONUS = 1.15;
/** Merch is printed on dark garments, so transparency counts as dark. */
const BACKGROUND_LUMINANCE = 0.02;

const cache = new Map<string, AppealBreakdown>();

export function analyzeDesign(d: Design, trend: TrendId, useCache = true): AppealBreakdown {
  const key = `${d.id}:${d.version}:${trend}:${d.handmade ? 1 : 0}:${d.size}`;
  if (useCache) {
    const hit = cache.get(key);
    if (hit) return hit;
  }
  const result = computeAppeal(d, trend);
  if (useCache) {
    if (cache.size > 200) cache.clear();
    cache.set(key, result);
  }
  return result;
}

function computeAppeal(d: Design, trend: TrendId): AppealBreakdown {
  const px = decodePixels(d);
  const n = d.size;
  const total = n * n;
  const counts = new Map<number, number>();
  let filled = 0;
  for (const v of px) {
    if (v > 0) {
      filled++;
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
  }
  const used = counts.size;
  const fill = filled / total;
  const trendName = TREND_MAP.get(trend)?.name ?? trend;

  if (filled === 0) {
    return { colors: 0, coverage: 0, symmetry: 0, contrast: 0, trend: 0, total: 0, usedColors: 0, fill: 0, hints: ['Start drawing!'] };
  }

  const colors = used === 1 ? 0.35 : used === 2 ? 0.7 : used <= 6 ? 1 : used <= 10 ? 0.8 : 0.55;
  const coverage =
    fill < 0.05 ? (fill / 0.05) * 0.3 : fill < 0.25 ? 0.3 + ((fill - 0.05) / 0.2) * 0.7 : fill <= 0.7 ? 1 : Math.max(0.5, 1 - ((fill - 0.7) / 0.3) * 0.5);

  let hCount = 0;
  let hMatch = 0;
  let vCount = 0;
  let vMatch = 0;
  const half = Math.floor(n / 2);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < half; x++) {
      const a = px[y * n + x];
      const b = px[y * n + (n - 1 - x)];
      if (a || b) {
        hCount++;
        if (a === b) hMatch++;
      }
    }
  }
  for (let x = 0; x < n; x++) {
    for (let y = 0; y < half; y++) {
      const a = px[y * n + x];
      const b = px[(n - 1 - y) * n + x];
      if (a || b) {
        vCount++;
        if (a === b) vMatch++;
      }
    }
  }
  const symmetry = Math.max(hCount ? hMatch / hCount : 0, vCount ? vMatch / vCount : 0);

  const info: { count: number; h: number; s: number; l: number; lum: number }[] = [];
  for (const [idx, count] of counts) {
    const hex = d.palette[idx - 1] ?? '#ffffff';
    const [r, g, b] = hexToRgb(hex);
    const [h, s, l] = rgbToHsl(r, g, b);
    info.push({ count, h, s, l, lum: luminance(r, g, b) });
  }
  const lums = [BACKGROUND_LUMINANCE, ...info.map((c) => c.lum)];
  const contrast = clamp01((Math.max(...lums) - Math.min(...lums)) * 1.3);

  const share = (pred: (c: (typeof info)[number]) => boolean) => info.filter(pred).reduce((a, c) => a + c.count, 0) / filled;
  let trendScore: number;
  switch (trend) {
    case 'neon':
      trendScore = share((c) => c.s >= 0.7 && c.l >= 0.4 && c.l <= 0.8);
      break;
    case 'minimal':
      trendScore = used <= 3 && fill <= 0.35 ? 1 : clamp01(1 - Math.max(0, used - 3) * 0.25 - Math.max(0, fill - 0.35) * 2);
      break;
    case 'retro':
      trendScore = share((c) => c.h >= 15 && c.h <= 60 && c.s >= 0.2 && c.s <= 0.85 && c.l >= 0.2 && c.l <= 0.7);
      break;
    case 'chaotic':
      trendScore = clamp01(used / 10);
      break;
    case 'mono': {
      const hues = info.filter((c) => c.s >= 0.15).map((c) => c.h).sort((a, b) => a - b);
      if (hues.length <= 1) {
        trendScore = 1;
      } else {
        let largestGap = 360 - hues[hues.length - 1] + hues[0];
        for (let i = 1; i < hues.length; i++) largestGap = Math.max(largestGap, hues[i] - hues[i - 1]);
        trendScore = clamp01(1 - (360 - largestGap) / 90);
      }
      break;
    }
    case 'bold':
      trendScore = clamp01(fill / 0.6) * contrast;
      break;
  }

  const base = 0.2 * colors + 0.2 * coverage + 0.2 * symmetry + 0.15 * contrast + 0.25 * trendScore;
  const totalScore = clamp01(base * (d.handmade ? HANDMADE_BONUS : 1));

  const parts: [number, string][] = [
    [colors, used < 3 ? 'Add a few more colours.' : 'Try using fewer colours.'],
    [coverage, fill < 0.25 ? 'Fill more of the canvas.' : 'Leave a little more empty space.'],
    [symmetry, 'Mirror your design for more symmetry.'],
    [contrast, 'Needs more contrast between colours.'],
    [trendScore, `Fans want ${trendName} designs right now.`],
  ];
  const hints = parts
    .filter(([score]) => score < 0.7)
    .sort((a, b) => a[0] - b[0])
    .slice(0, 2)
    .map(([, text]) => text);

  return { colors, coverage, symmetry, contrast, trend: trendScore, total: totalScore, usedColors: used, fill, hints };
}

// ---------------------------------------------------------------------------
// Generation & management
// ---------------------------------------------------------------------------

/** A symmetric "identicon" sprite, upscaled to the requested size. */
export function generateDesign(rng: Rng, size: number, name: string): Omit<Design, 'id' | 'createdAt' | 'version'> {
  const cells = 8;
  const scale = size / cells;
  const choices = rng.shuffle(Array.from({ length: DESIGN_PALETTE.length }, (_, i) => i + 1)).slice(0, rng.int(2, 4));
  const grid = new Uint8Array(cells * cells);
  const density = rng.range(0.35, 0.6);
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells / 2; x++) {
      if (!rng.chance(density)) continue;
      const color = rng.chance(0.7) ? choices[0] : rng.pick(choices);
      grid[y * cells + x] = color;
      grid[y * cells + (cells - 1 - x)] = color;
    }
  }
  const values = new Uint8Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) values[y * size + x] = grid[Math.floor(y / scale) * cells + Math.floor(x / scale)];
  }
  return { name, size, palette: [...DESIGN_PALETTE], pixels: encodePixels(values), handmade: false };
}

export type DesignDraft = Pick<Design, 'name' | 'size' | 'palette' | 'pixels' | 'handmade'>;

export function addDesign(s: GameState, draft: DesignDraft): string | null {
  if (Object.keys(s.designs).length >= MAX_DESIGNS) return null;
  const id = `d${s.nextId++}`;
  s.designs[id] = sanitizeDesign({ ...draft, id, createdAt: s.time, version: 1 });
  if (draft.handmade) s.stats.designsCreated++;
  return id;
}

export function updateDesign(s: GameState, id: string, patch: Partial<Pick<Design, 'name' | 'pixels' | 'palette'>>): boolean {
  const current = s.designs[id];
  if (!current) return false;
  s.designs[id] = sanitizeDesign({ ...current, ...patch, id, version: current.version + 1, handmade: current.handmade || patch.pixels !== undefined });
  return true;
}

export function deleteDesign(s: GameState, id: string): boolean {
  if (!s.designs[id]) return false;
  delete s.designs[id];
  if (s.org.logo === id) s.org.logo = null;
  if (s.org.jersey === id) s.org.jersey = null;
  for (const line of Object.values(s.merch.lines)) if (line.designId === id) line.designId = null;
  return true;
}

export function setOrgLogo(s: GameState, id: string | null): boolean {
  if (id !== null && !s.designs[id]) return false;
  s.org.logo = id;
  return true;
}

export function setJerseyDesign(s: GameState, id: string | null): boolean {
  if (id !== null && !s.designs[id]) return false;
  s.org.jersey = id;
  return true;
}
