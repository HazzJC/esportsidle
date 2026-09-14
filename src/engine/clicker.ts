import { addBuff, hasBuff } from './buffs';
import { emit } from './bus';
import { computeMods, computeRates, earnCash } from './economy';
import type { GameState } from './types';

export const HYPE_MAX = 100;
export const HYPE_PER_CLICK = 0.5;
export const HYPE_DECAY_PER_SEC = 4;
export const HYPE_IDLE_GRACE = 2;
export const CROWD_BUFF_ID = 'crowd';
export const CROWD_DURATION = 30;
export const CROWD_MULT = 2;

export interface ClickResult {
  gain: number;
  crowd: boolean;
}

export function clickLogo(s: GameState): ClickResult {
  const mods = computeMods(s);
  const rates = computeRates(s, mods);
  const gain = rates.click;
  earnCash(s, gain);
  s.stats.clicksRun++;
  s.stats.clicksTotal++;
  s.stats.clickCashRun += gain;
  s.stats.clickCashTotal += gain;
  s.lastClickTime = s.time;

  let crowd = false;
  if (!hasBuff(s, CROWD_BUFF_ID)) {
    s.hype += HYPE_PER_CLICK * mods.hypeGainMult;
    if (s.hype >= HYPE_MAX) {
      s.hype = 0;
      s.stats.crowdsTotal++;
      addBuff(s, {
        id: CROWD_BUFF_ID,
        name: 'Crowd Goes Wild',
        icon: 'megaphone',
        tone: 'good',
        desc: `Income ×${CROWD_MULT}`,
        duration: CROWD_DURATION * mods.hypeDurationMult,
        effects: [{ kind: 'income', mult: CROWD_MULT }],
      });
      emit({ type: 'crowd' });
      crowd = true;
    }
  }
  return { gain, crowd };
}

/** Hype slowly drains when the player stops clicking. */
export function decayHype(s: GameState, dt: number): void {
  if (s.hype <= 0) return;
  if (s.time - s.lastClickTime > HYPE_IDLE_GRACE) {
    s.hype = Math.max(0, s.hype - HYPE_DECAY_PER_SEC * dt);
  }
}
