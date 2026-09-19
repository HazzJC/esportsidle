/**
 * Shared drawing kit for the bespoke item art (gear, decor). Everything draws on a 48x48 grid and
 * returns SVG markup built only from constants and numbers, never from player input, so the result
 * is safe to render with {@html}.
 */

/** Draws one item. `c` is the glow colour: the rarity colour on a card, or the team colour in a scene. */
export type Art = (c: string) => string;

export const K = {
  ink: '#141417',
  black: '#1f2024',
  black2: '#2c2d33',
  black3: '#3d3e45',
  grey: '#9b9ea4',
  greyD: '#6d7077',
  greyL: '#c7c9cd',
  beige: '#d9d0b7',
  beigeD: '#b3a88c',
  silver: '#d2d5d9',
  silverD: '#9ea2a8',
  gold: '#f5c451',
  goldD: '#c99a2e',
  goldL: '#ffe7a3',
  white: '#f1f1f0',
  red: '#e0474c',
  green: '#4caf6a',
  pcb: '#2f5e46',
  wood: '#a8764b',
  woodD: '#7d5535',
  copper: '#c77b45',
  ice: '#e8f6ff',
};

export const f = (v: number) => +v.toFixed(2);
const x = (extra: string) => (extra ? ` ${extra}` : '');
export const rect = (rx: number, ry: number, w: number, h: number, fill: string, extra = '') =>
  `<rect x="${f(rx)}" y="${f(ry)}" width="${f(w)}" height="${f(h)}" fill="${fill}"${x(extra)}/>`;
export const rr = (rx: number, ry: number, w: number, h: number, r: number, fill: string, extra = '') =>
  rect(rx, ry, w, h, fill, `rx="${r}"${x(extra)}`);
export const circ = (cx: number, cy: number, r: number, fill: string, extra = '') =>
  `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}"${x(extra)}/>`;
export const ell = (cx: number, cy: number, rx: number, ry: number, fill: string, extra = '') =>
  `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}"${x(extra)}/>`;
export const path = (d: string, fill: string, extra = '') => `<path d="${d}" fill="${fill}"${x(extra)}/>`;
export const line = (d: string, color: string, w = 1.5, extra = '') =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${x(extra)}/>`;
export const op = (o: number) => `opacity="${o}"`;
export const stroke = (color: string, w = 1) => `stroke="${color}" stroke-width="${w}"`;
export const group = (inner: string, extra: string) => `<g ${extra}>${inner}</g>`;
export const shadow = (rx = 14, cy = 44.5) => ell(24, cy, rx, 2, '#000', op(0.35));
export const glow = (cx: number, cy: number, r: number, c: string, o = 0.22) => circ(cx, cy, r, c, op(o));
export const spark = (sx: number, sy: number, s: number, fill: string) =>
  path(
    `M${sx} ${sy - s}L${f(sx + s * 0.28)} ${f(sy - s * 0.28)}L${sx + s} ${sy}L${f(sx + s * 0.28)} ${f(sy + s * 0.28)}` +
      `L${sx} ${sy + s}L${f(sx - s * 0.28)} ${f(sy + s * 0.28)}L${sx - s} ${sy}L${f(sx - s * 0.28)} ${f(sy - s * 0.28)}Z`,
    fill,
  );
export function grid(x0: number, y0: number, cols: number, rows: number, w: number, h: number, gap: number, fill: string, extra = ''): string {
  let s = '';
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) s += rr(x0 + k * (w + gap), y0 + r * (h + gap), w, h, 0.6, fill, extra);
  return s;
}
/** Like grid(), but with separate column and row gaps so overlays can line up with keys. */
export function grid2(x0: number, y0: number, cols: number, rows: number, w: number, h: number, gx: number, gy: number, fill: string, extra = ''): string {
  let s = '';
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) s += rr(x0 + k * (w + gx), y0 + r * (h + gy), w, h, 0.6, fill, extra);
  return s;
}
export const stars = (pts: [number, number][], fill = K.white) => pts.map(([sx, sy], i) => circ(sx, sy, i % 3 === 0 ? 0.9 : 0.55, fill)).join('');
export const rings = (cx: number, cy: number, radii: number[], c: string) =>
  radii.map((r, i) => circ(cx, cy, r, 'none', `${stroke(c, 1.2)} ${op(f(0.75 - i * 0.2))}`)).join('');
