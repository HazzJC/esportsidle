import { OPERATIONS } from '../data/operations';
import { checkAchievements } from './achievements';
import { fmt } from './format';
import { emit } from './bus';
import { AUTOMATION_INTERVAL, runAutomation } from './automation';
import { expireBuffs } from './buffs';
import { decayHype } from './clicker';
import { returnScandalFans, updateDrops } from './drops';
import { updateInvitation } from './tournament';
import { updateWorldEvents } from './worldEvents';
import { OFFLINE_FADE_HOURS, computeMods, computeRates } from './economy';
import { updatePriceIncome } from './baseIncome';
import { updateMarket } from './market';
import { updateMerch } from './merch';
import { updateSponsors } from './sponsors';
import { updatePopularity } from './popularity';
import { checkChallenge, checkSaleOffer } from './prestige';
import { updateQuests } from './quests';
import { Rng } from './rng';
import { updatePlayers, updateTeams } from './teams';
import { calmStart, updateTutorial } from './tutorial';
import { updateSections } from './sections';
import { checkHouseMove } from './staff';
import type { GameState, Mods, Rates } from './types';
import { refreshUpgradeUnlocks } from './upgrades';
import { earnCash, gainFans } from './wallet';

export const TICK_SECONDS = 0.1;

export interface TickResult {
  mods: Mods;
  rates: Rates;
}

export interface TickOptions {
  pauseMarket?: boolean;
  pauseTeams?: boolean;
  pauseGear?: boolean;
}

/** Advances the simulation by `dt` seconds. */
export function tick(s: GameState, dt: number, offline = false, options?: TickOptions): TickResult {
  const prevTime = s.time;
  s.time += dt;
  s.stats.playtimeTotal += dt;
  if (offline) s.stats.offlineSecondsTotal += dt;

  const rng = new Rng(s);
  expireBuffs(s);
  updatePopularity(s, dt, rng);

  const mods = computeMods(s);
  const rates = computeRates(s, mods);
  const factor = offline ? mods.offlineRate : 1;
  updatePriceIncome(s, rates.cpsNoBuffs, dt);

  earnCash(s, rates.cps * dt * factor, 'ops');
  for (const op of OPERATIONS) s.ops[op.id].produced += rates.opCps[op.id] * dt * factor;
  gainFans(s, rates.fansPerSec * dt * factor);

  earnCash(s, rates.merchCps * dt * factor, 'merch');
  updateMerch(s, dt, factor, rates, rng, offline, mods);
  updateTeams(s, dt, offline, factor, mods, rates.teams, rng, options?.pauseTeams);
  updatePlayers(s, dt, mods);
  updateSponsors(s, { rng, mods, rates }, dt, offline);

  if (!offline) {
    updateMarket(s, rng, mods);
    if (Math.floor(s.time / AUTOMATION_INTERVAL) !== Math.floor(prevTime / AUTOMATION_INTERVAL)) {
      runAutomation(s, mods, { pauseMarket: options?.pauseMarket, pauseGear: options?.pauseGear, pauseTeams: options?.pauseTeams, rates });
    }
    const ctx = { rng, mods, rates };
    // A new org gets a calm start: no drops or world events while it finds its feet.
    if (!calmStart(s)) {
      updateDrops(s, ctx);
      updateWorldEvents(s, ctx);
    }
    updateInvitation(s, ctx);
    decayHype(s, dt);
    if (rates.cpsNoBuffs > s.stats.bestCps) s.stats.bestCps = rates.cpsNoBuffs;
  }

  // Unlock checks twice per simulated second (and every coarse offline step).
  if (Math.floor(s.time * 2) !== Math.floor(prevTime * 2)) {
    refreshUpgradeUnlocks(s);
    checkChallenge(s);
    checkSaleOffer(s);
    const returned = returnScandalFans(s);
    if (returned > 0) {
      emit({
        type: 'toast',
        title: 'The scandal blows over',
        body: `${fmt(returned)} fans came back.`,
        icon: 'heart',
        tone: 'good',
        channel: 'business',
      });
    }
    checkAchievements(s, rates);
    updateTutorial(s);
    updateQuests(s);
    updateSections(s);
    if (!offline) checkHouseMove(s);
  }
  return { mods, rates };
}

export interface AdvanceResult {
  earned: number;
  fans: number;
}

/** Advances many seconds using coarser steps for long spans. */
export function advance(s: GameState, seconds: number, offline = false): AdvanceResult {
  const earnedBefore = s.earnedTotal;
  const fansBefore = s.fansTotal;
  const step = seconds > 6 * 3600 ? 60 : seconds > 600 ? 10 : seconds > 10 ? 1 : TICK_SECONDS;
  let remaining = seconds;
  while (remaining > 1e-9) {
    const dt = Math.min(step, remaining);
    tick(s, dt, offline);
    remaining -= dt;
  }
  return { earned: s.earnedTotal - earnedBefore, fans: s.fansTotal - fansBefore };
}

export interface OfflineReport {
  awaySeconds: number;
  /** Seconds of play credited: the full-rate window plus the fading time after it. */
  countedSeconds: number;
  rate: number;
  /** The full-rate window, and how much of the time away fell inside it and in the fading stretch. */
  windowSeconds: number;
  fullSeconds: number;
  taperSeconds: number;
  earned: number;
  fans: number;
  /** About what the org would have made with the game open for the same time (no growth, no buffs). */
  openEstimate: number;
}

/**
 * How much of an absence offline progress credits: the full rate for the window, then a rate that
 * fades but never stops. Time past the window counts as FADE · ln(1 + extra / FADE), so the first
 * extra hours are worth nearly their full length and a week away still pays more than a day. Returned
 * as seconds of play at the offline rate.
 */
export function offlineCredit(awaySeconds: number, mods: Pick<Mods, 'offlineWindowHours'>): { window: number; full: number; taper: number; counted: number } {
  const away = Math.max(0, awaySeconds);
  const window = mods.offlineWindowHours * 3600;
  const full = Math.min(away, window);
  const fade = OFFLINE_FADE_HOURS * 3600;
  const taper = away > window ? fade * Math.log(1 + (away - window) / fade) : 0;
  return { window, full, taper, counted: full + taper };
}

export const MIN_OFFLINE_SECONDS = 30;

/** Credits progress made while the game was closed. */
export function applyOfflineProgress(s: GameState, nowMs: number = Date.now()): OfflineReport | null {
  const away = (nowMs - s.lastSaved) / 1000;
  if (!s.settings.offlineProgress || !(away >= MIN_OFFLINE_SECONDS)) return null;
  const mods = computeMods(s);
  const rates = computeRates(s, mods);
  const inc = rates.buffIncomeMult || 1;
  const openEstimate = (rates.cpsNoBuffs + (rates.matchCps + rates.merchCps) / inc) * away;
  const credit = offlineCredit(away, mods);
  s.hype = 0;
  const result = advance(s, credit.counted, true);
  s.lastSaved = nowMs;
  return {
    awaySeconds: away,
    countedSeconds: credit.counted,
    rate: mods.offlineRate,
    windowSeconds: credit.window,
    fullSeconds: credit.full,
    taperSeconds: credit.taper,
    earned: result.earned,
    fans: result.fans,
    openEstimate,
  };
}
