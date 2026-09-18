import { isHexColor } from '../data/palette';

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) | (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b)).toString(16).slice(1)}`;
}

/** Lightens (amount > 0) or darkens (amount < 0) a #rrggbb colour. */
export function shade(hex: string, amount: number): string {
  if (!isHexColor(hex.trim())) return hex;
  const target = amount < 0 ? 0 : 255;
  const p = Math.min(1, Math.abs(amount));
  const [r, g, b] = rgb(hex.trim());
  return toHex((target - r) * p + r, (target - g) * p + g, (target - b) * p + b);
}

/** Blends `t` of colour `b` into colour `a`. For SVG attributes, where CSS color-mix is unavailable. */
export function mix(a: string, b: string, t: number): string {
  if (!isHexColor(a) || !isHexColor(b)) return a;
  const [ar, ag, ab] = rgb(a);
  const [br, bg, bb] = rgb(b);
  return toHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  if (!isHexColor(hex)) return 0;
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const [r, g, b] = rgb(hex);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Dark or light ink, whichever reads better on a solid `hex` background. */
export function readableOn(hex: string): string {
  return luminance(hex) > 0.4 ? '#141416' : '#f6f6f4';
}
