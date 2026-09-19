import { isEmblem, type Emblem } from '../data/emblems';
import { DEFAULT_KIT, isHexColor } from '../data/palette';
import { luminance } from './color';
import type { GameState } from './types';

export const MAX_ORG_NAME = 24;

/** Collapses runs of whitespace and trims to the length the UI allows. */
export function cleanOrgName(name: string): string {
  return name.replace(/\s+/g, ' ').trim().slice(0, MAX_ORG_NAME);
}

/** The team colours a tone suggests: the tone itself with a contrasting accent. */
export function kitForTone(tone: string): { primary: string; secondary: string } {
  const t = tone.toLowerCase();
  return { primary: t, secondary: luminance(t) > 0.4 ? '#26262b' : '#f1f1f0' };
}

/**
 * Completes the first-run screen. Until the player picks team colours themselves, their teams start
 * in the interface tone so the org looks like theirs from the first minute. A kit that is no longer
 * the untouched default was chosen by them, so it is left alone.
 */
export function completeOnboarding(s: GameState, name: string, tone: string, emblem?: Emblem): void {
  const clean = cleanOrgName(name);
  if (clean) s.org.name = clean;
  if (isHexColor(tone)) {
    const t = tone.toLowerCase();
    s.settings.uiAccent = t;
    if (s.org.primary === DEFAULT_KIT.primary && s.org.secondary === DEFAULT_KIT.secondary) Object.assign(s.org, kitForTone(t));
  }
  if (isEmblem(emblem)) s.org.emblem = { shape: emblem.shape, mark: emblem.mark };
  s.settings.onboarded = true;
}
