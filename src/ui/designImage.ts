import { decodePixels, hexToRgb } from '../engine/designs';
import type { Design } from '../engine/types';

const cache = new Map<string, string>();

/** Renders a design to a PNG data URL (cached per design version). */
export function designUrl(d: Pick<Design, 'id' | 'version' | 'size' | 'palette' | 'pixels'>): string {
  const key = `${d.id}:${d.version}:${d.size}`;
  const hit = cache.get(key);
  if (hit) return hit;
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = d.size;
  canvas.height = d.size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const image = ctx.createImageData(d.size, d.size);
  const px = decodePixels(d);
  const colours = d.palette.map((hex) => hexToRgb(hex));
  for (let i = 0; i < px.length; i++) {
    const v = px[i];
    if (v === 0) continue;
    const [r, g, b] = colours[v - 1] ?? [255, 255, 255];
    image.data[i * 4] = r;
    image.data[i * 4 + 1] = g;
    image.data[i * 4 + 2] = b;
    image.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  const url = canvas.toDataURL('image/png');
  if (cache.size > 120) cache.clear();
  cache.set(key, url);
  return url;
}
