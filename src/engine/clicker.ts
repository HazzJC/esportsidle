import { addBuff, hasBuff } from './buffs';
import { emit } from './bus';
import { computeMods, computeRates } from './economy';
import { earnCash } from './wallet';
import type { GameState } from './types';

export const HYPE_MAX = 100;
/** A crowd takes 80 unboosted clicks. Pauses remain useful, but a long absence empties the meter. */
export const HYPE_PER_CLICK = 1.25;
export const HYPE_DECAY_PER_SEC = 0.12;
export const HYPE_DECAY_ACCELERATION = 0.018;
export const HYPE_IDLE_GRACE = 4;
export const CROWD_BUFF_ID = 'crowd';
export const CROWD_DURATION = 30;
export const CROWD_MULT = 2;

/**
 * A crowd that knows the org lasts longer. Every ten times the lifetime click count and every ten
 * times the fanbase adds a quarter again to how long the crowd stays wild, on top of the upgrades.
 */
export function hypeEndurance(s: GameState): number {
  const fromClicks = Math.log10(1 + s.stats.clicksTotal / 500) * 0.25;
  const fromFans = Math.log10(1 + s.fans / 500) * 0.25;
  return 1 + fromClicks + fromFans;
}

/** How long a crowd would last right now, in seconds. */
export function crowdDuration(s: GameState, hypeDurationMult: number): number {
  return CROWD_DURATION * hypeDurationMult * hypeEndurance(s);
}

// ---------------------------------------------------------------------------
// Click chain
// ---------------------------------------------------------------------------
/**
 * When the crowd goes wild a chain of hype bubbles starts. Each one popped makes the crowd
 * louder and keeps it going longer, and each is smaller and shorter-lived than the last, so how
 * far a chain runs is a test of nerve. Missing one ends the chain and locks in what was earned.
 */
export const CHAIN_MAX = 20;
/** Seconds of crowd per bubble popped. */
export const CHAIN_SECONDS_PER_BUBBLE = 10;
export const CHAIN_FIRST_SIZE = 104;
export const CHAIN_MIN_SIZE = 34;
export const CHAIN_SIZE_FALLOFF = 0.915;
export const CHAIN_FIRST_LIFE = 2.3;
export const CHAIN_MIN_LIFE = 0.62;
export const CHAIN_LIFE_FALLOFF = 0.9;

/** The size in pixels and the lifetime in seconds of the nth bubble in a chain (1-based). */
export function chainBubble(n: number): { size: number; life: number } {
  const step = Math.max(0, n - 1);
  return {
    size: Math.max(CHAIN_MIN_SIZE, CHAIN_FIRST_SIZE * Math.pow(CHAIN_SIZE_FALLOFF, step)),
    life: Math.max(CHAIN_MIN_LIFE, CHAIN_FIRST_LIFE * Math.pow(CHAIN_LIFE_FALLOFF, step)),
  };
}

/** What a chain of `popped` bubbles is worth: the income multiplier and how long it lasts. */
export function chainReward(s: GameState, popped: number, hypeDurationMult: number): { mult: number; duration: number } {
  const base = crowdDuration(s, hypeDurationMult);
  if (popped < 1) return { mult: CROWD_MULT, duration: base };
  const chained = Math.min(CHAIN_MAX, popped);
  return {
    mult: Math.max(CROWD_MULT, chained),
    duration: Math.max(base, chained * CHAIN_SECONDS_PER_BUBBLE * hypeDurationMult * hypeEndurance(s)),
  };
}

/**
 * Locks in a finished chain. The crowd buff is already running at its floor, so this replaces it
 * with the louder, longer version the chain earned.
 */
export function applyChain(s: GameState, popped: number, hypeDurationMult: number): { mult: number; duration: number } {
  const reward = chainReward(s, popped, hypeDurationMult);
  s.stats.bestChain = Math.max(s.stats.bestChain, popped);
  s.stats.chainPops += popped;
  addBuff(s, {
    id: CROWD_BUFF_ID,
    name: popped >= 2 ? `Crowd Goes Wild ×${Math.round(reward.mult)}` : 'Crowd Goes Wild',
    icon: 'megaphone',
    tone: 'good',
    desc: `Income ×${Math.round(reward.mult)}`,
    duration: reward.duration,
    effects: [{ kind: 'income', mult: reward.mult }],
  });
  return reward;
}

export interface ClickResult {
  gain: number;
  crowd: boolean;
}

export function clickLogo(s: GameState): ClickResult {
  const mods = computeMods(s);
  const rates = computeRates(s, mods);
  const gain = rates.click;
  earnCash(s, gain, 'click');
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
        duration: crowdDuration(s, mods.hypeDurationMult),
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
  const idle = s.time - s.lastClickTime - HYPE_IDLE_GRACE;
  if (idle <= 0) return;
  // Integrate the increasing drain over this tick; this also behaves well for offline ticks.
  const start = Math.max(0, idle - dt);
  const drain = HYPE_DECAY_PER_SEC * (idle - start)
    + HYPE_DECAY_ACCELERATION * (idle * idle - start * start) / 2;
  s.hype = Math.max(0, s.hype - drain);
}
