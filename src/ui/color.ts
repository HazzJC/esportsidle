/** Lightens (amount > 0) or darkens (amount < 0) a #rrggbb colour. */
export function shade(hex: string, amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const target = amount < 0 ? 0 : 255;
  const p = Math.min(1, Math.abs(amount));
  const mix = (c: number) => Math.round((target - c) * p + c);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
