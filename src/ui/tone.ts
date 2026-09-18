import { DEFAULT_TONE, isHexColor } from '../data/palette';
import { readableOn } from './color';

let applied = '';

/**
 * Applies the interface tone. Every neutral in global.css is mixed from --accent, so this one
 * property recolours the whole interface. It never touches in-game kit or art.
 */
export function applyTone(color: string): void {
  const tone = isHexColor(color) ? color : DEFAULT_TONE;
  if (tone === applied || typeof document === 'undefined') return;
  applied = tone;
  const root = document.documentElement.style;
  root.setProperty('--accent', tone);
  root.setProperty('--on-accent', readableOn(tone));
}
