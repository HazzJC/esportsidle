import {
  BRANDS,
  BRAND_MAP,
  CATEGORY_INFO,
  GOAL_INFO,
  SPONSORS_UNLOCK_FANS,
  SPONSOR_TIERS,
  type SponsorGoalKind,
} from '../data/sponsors';
import type { StatAmount } from '../data/staff';
import { addBuff } from './buffs';
import { emit } from './bus';
import { fmt, money } from './format';
import type { Rng } from './rng';
import type { Effect, GameState, Mods, Rates, SponsorContract, SponsorOffer } from './types';
import { earnCash, gainTrophies } from './wallet';

export const OFFER_COUNT = 3;
export const OFFER_REFRESH_SECONDS = 300;
export const BASE_SPONSOR_SLOTS = 2;
/** Chance per minute that a crypto sponsor collapses. */
export const CRYPTO_CRASH_PER_MINUTE = 0.02;
const HISTORY_LENGTH = 20;

export const GOAL_STAT: Record<SponsorGoalKind, (s: GameState) => number> = {
  wins: (s) => s.stats.matchesWon,
  fans: (s) => s.fansTotal,
  titles: (s) => s.stats.seasonTitles,
  tournaments: (s) => s.stats.tournamentsWon,
  drops: (s) => s.stats.dropsClicked,
};

export function sponsorsUnlocked(s: GameState): boolean {
  return s.fansRun >= SPONSORS_UNLOCK_FANS || s.stats.sponsorsSigned > 0;
}

const bestTeamTier = (s: GameState): number => Object.values(s.teams).reduce((m, t) => Math.max(m, t.bestTier), 0);

export function goalLabel(kind: SponsorGoalKind, target: number): string {
  return GOAL_INFO[kind].label(fmt(target));
}

export function goalProgress(s: GameState, c: SponsorContract): number {
  return Math.max(0, GOAL_STAT[c.goal.kind](s) - c.baseline);
}

export function offerRequirements(s: GameState, offer: SponsorOffer): { ok: boolean; reason?: string } {
  const tier = SPONSOR_TIERS[offer.tier];
  if (s.fansRun < tier.fans) return { ok: false, reason: `Needs ${fmt(tier.fans)} fans this run` };
  if (bestTeamTier(s) < tier.teamTier) return { ok: false, reason: `Needs a team in league tier ${tier.teamTier + 1}` };
  return { ok: true };
}

export function generateOffer(s: GameState, rng: Rng): SponsorOffer {
  let maxTier = 0;
  SPONSOR_TIERS.forEach((t, i) => {
    if (s.fansRun >= t.fans / 20) maxTier = i;
  });
  const tiers = Array.from({ length: maxTier + 1 }, (_, i) => i);
  const tier = rng.weighted(tiers, (i) => (i === maxTier ? 3 : 1 + i * 0.5)) ?? 0;
  const taken = new Set(s.sponsors.active.map((c) => BRAND_MAP.get(c.brandId)?.category));
  const brand = rng.weighted(BRANDS, (b) => (taken.has(b.category) ? 0.15 : 1)) ?? BRANDS[0];
  const kinds: SponsorGoalKind[] = ['wins', 'fans', 'titles', 'tournaments', 'drops'];
  const kind = rng.weighted(kinds, (k) => (k === 'titles' || k === 'tournaments' ? (s.stats.matchesWon >= 30 ? 1 : 0) : 1.5)) ?? 'wins';
  const t = SPONSOR_TIERS[tier];
  return {
    id: s.nextId++,
    brandId: brand.id,
    tier,
    duration: Math.round(rng.range(900, 3600) / 60) * 60,
    incomePct: t.incomePct * (brand.category === 'crypto' ? 2 : 1) * rng.range(0.85, 1.15),
    goal: { kind, target: GOAL_INFO[kind].targets[tier], rewardSeconds: t.goalSeconds },
  };
}

export function refreshOffers(s: GameState, rng: Rng, count = OFFER_COUNT): void {
  s.sponsors.offers = Array.from({ length: count }, () => generateOffer(s, rng)).sort((a, b) => a.tier - b.tier);
  s.sponsors.nextRefresh = s.time + OFFER_REFRESH_SECONDS;
}

export type SignResult = { ok: true; contract: SponsorContract } | { ok: false; reason: string };

export function signOffer(s: GameState, offerId: number, mods: Pick<Mods, 'sponsorSlots'>): SignResult {
  const index = s.sponsors.offers.findIndex((o) => o.id === offerId);
  if (index < 0) return { ok: false, reason: 'That offer has expired.' };
  const offer = s.sponsors.offers[index];
  const brand = BRAND_MAP.get(offer.brandId);
  if (!brand) return { ok: false, reason: 'Unknown brand.' };
  if (s.sponsors.active.length >= mods.sponsorSlots) return { ok: false, reason: 'All sponsor slots are full.' };
  if (s.sponsors.active.some((c) => BRAND_MAP.get(c.brandId)?.category === brand.category)) {
    return { ok: false, reason: `You already have a ${CATEGORY_INFO[brand.category].label} sponsor.` };
  }
  const req = offerRequirements(s, offer);
  if (!req.ok) return { ok: false, reason: req.reason ?? 'Requirements not met.' };
  s.sponsors.offers.splice(index, 1);
  const contract: SponsorContract = {
    ...offer,
    signedAt: s.time,
    endsAt: s.time + offer.duration,
    baseline: GOAL_STAT[offer.goal.kind](s),
    completed: false,
  };
  s.sponsors.active.push(contract);
  s.stats.sponsorsSigned++;
  return { ok: true, contract };
}

function endContract(s: GameState, c: SponsorContract, reason: 'expired' | 'cancelled' | 'crashed'): void {
  s.sponsors.active = s.sponsors.active.filter((x) => x.id !== c.id);
  s.sponsors.history.unshift({ brandId: c.brandId, completed: c.completed, reason, endedAt: s.time });
  if (s.sponsors.history.length > HISTORY_LENGTH) s.sponsors.history.length = HISTORY_LENGTH;
}

export function cancelContract(s: GameState, contractId: number): boolean {
  const c = s.sponsors.active.find((x) => x.id === contractId);
  if (!c) return false;
  endContract(s, c, 'cancelled');
  return true;
}

export interface SponsorBonuses {
  incomePct: number;
  stats: StatAmount[];
  effects: Effect[];
}

/** Income bonus and category perks from active contracts. */
export function sponsorBonuses(s: GameState): SponsorBonuses {
  const out: SponsorBonuses = { incomePct: 0, stats: [], effects: [] };
  for (const c of s.sponsors.active) {
    if (c.endsAt <= s.time) continue;
    const brand = BRAND_MAP.get(c.brandId);
    if (!brand) continue;
    out.incomePct += c.incomePct;
    const info = CATEGORY_INFO[brand.category];
    if (info.stats) out.stats.push(...info.stats);
    if (info.effects) out.effects.push(...info.effects);
  }
  return out;
}

export interface SponsorContext {
  rng: Rng;
  mods: Mods;
  rates: Rates;
}

export function updateSponsors(s: GameState, ctx: SponsorContext, dt: number, offline: boolean): void {
  for (const c of [...s.sponsors.active]) {
    if (c.endsAt <= s.time) {
      endContract(s, c, 'expired');
      if (!offline) {
        const brand = BRAND_MAP.get(c.brandId);
        emit({ type: 'toast', title: `${brand?.name ?? 'Sponsor'} contract ended`, body: 'A sponsor slot is free again.', icon: 'handshake', tone: 'info' });
      }
    }
  }
  if (offline || !sponsorsUnlocked(s)) return;

  if (s.time >= s.sponsors.nextRefresh) refreshOffers(s, ctx.rng, OFFER_COUNT);

  for (const c of s.sponsors.active) {
    const brand = BRAND_MAP.get(c.brandId);
    if (!c.completed && goalProgress(s, c) >= c.goal.target) {
      c.completed = true;
      const reward = Math.max(500 * (c.tier + 1), ctx.rates.cpsNoBuffs * c.goal.rewardSeconds);
      earnCash(s, reward);
      const trophies = c.tier >= 2 ? 1 : 0;
      gainTrophies(s, trophies);
      s.stats.sponsorGoals++;
      emit({
        type: 'toast',
        title: `${brand?.name ?? 'Sponsor'} goal complete!`,
        body: `+${money(reward)}${trophies ? ' and a trophy' : ''}.`,
        icon: 'handshake',
        tone: 'gold',
      });
    }
  }

  const chance = (CRYPTO_CRASH_PER_MINUTE / 60) * dt;
  for (const c of [...s.sponsors.active]) {
    const brand = BRAND_MAP.get(c.brandId);
    if (brand?.category !== 'crypto' || !ctx.rng.chance(chance)) continue;
    endContract(s, c, 'crashed');
    s.stats.cryptoCrashes++;
    addBuff(s, { id: 'crypto_crash', name: 'Crypto Crash', icon: 'trending-down', tone: 'bad', desc: 'Income ×0.5', duration: 300, effects: [{ kind: 'income', mult: 0.5 }] });
    emit({ type: 'toast', title: `${brand.name} collapsed!`, body: 'The token went to zero. Income ×0.5 for 5 minutes while you deal with the fallout.', icon: 'trending-down', tone: 'bad' });
  }
}
