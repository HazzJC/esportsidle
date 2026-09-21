import {
  BASE_SPONSOR_TIERS,
  BRANDS,
  BRAND_MAP,
  CATEGORY_INFO,
  GOAL_EASE,
  GOAL_INFO,
  SPONSORS_UNLOCK_FANS,
  SPONSOR_TIERS,
  type SponsorGoalKind,
} from '../data/sponsors';
import { hasSpecial } from './prestige';
import type { StatAmount } from '../data/staff';
import { addBuff } from './buffs';
import { emit } from './bus';
import { addTrophy, trophyHomeGame } from './stories';
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

/** The share of what the org earned during a deal that finishing its goal pays out. */
export const GOAL_EARNINGS_SHARE = 0.35;

export function goalDifficultyBonus(kind: SponsorGoalKind): number {
  return kind === 'drops' ? 8 : kind === 'tournaments' ? 5 : kind === 'titles' ? 3 : 1;
}

/**
 * What finishing a sponsor goal pays.
 *
 * A goal used to pay a flat slice of current income, so a deal that completed the moment it was
 * signed — which late-game orgs do constantly — handed over an hour of earnings for nothing. Now the
 * bonus is a share of what the org actually earned while the deal ran, capped by the contract's
 * headline value, and scaled down when the goal is finished early. Running the full goal time and
 * earning well is what pays.
 */
export function goalReward(s: GameState, c: SponsorContract, cpsNoBuffs: number): number {
  const floor = 500 * (c.tier + 1);
  const full = c.goal.rewardSeconds;
  const pace = Math.min(1, Math.max(0, s.time - c.signedAt) / Math.max(1, full));
  const headline = Math.max(0, cpsNoBuffs) * full * goalDifficultyBonus(c.goal.kind);
  // Contracts signed before this rule have no baseline, so they keep the old headline value.
  const earnedDuring = c.earnedAt === undefined ? null : Math.max(0, s.earnedRun - c.earnedAt);
  const share = earnedDuring === null ? headline : earnedDuring * GOAL_EARNINGS_SHARE * goalDifficultyBonus(c.goal.kind);
  return Math.max(floor, Math.min(headline, share) * pace);
}

/** The most a goal could pay if the deal runs its full goal time: what an offer advertises. */
export function goalRewardPotential(tier: number, rewardSeconds: number, cpsNoBuffs: number, kind: SponsorGoalKind = 'wins'): number {
  return Math.max(500 * (tier + 1), Math.max(0, cpsNoBuffs) * rewardSeconds * goalDifficultyBonus(kind));
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

/** The highest tier that can call: five, or ten with the Global Brand Portfolio. */
export function maxSponsorTier(s: GameState): number {
  return (hasSpecial(s, 'sponsorTiers') ? SPONSOR_TIERS.length : BASE_SPONSOR_TIERS) - 1;
}

/** Goals are never set so low that the org would clear them in minutes at its recent pace. */
export const MIN_GOAL_SECONDS = 300;
/** Pace samples are this far apart, and the window is five minutes of them. */
const PACE_EVERY = 30;
const PACE_SAMPLES = 11;

function paceSample(s: GameState) {
  return {
    at: s.time,
    wins: GOAL_STAT.wins(s),
    fans: GOAL_STAT.fans(s),
    titles: GOAL_STAT.titles(s),
    tournaments: GOAL_STAT.tournaments(s),
    drops: GOAL_STAT.drops(s),
  };
}

/** How fast this kind of goal has been progressing, per second, over the last five minutes. */
export function goalPace(s: GameState, kind: SponsorGoalKind): number {
  const pace = s.sponsors.pace ?? [];
  if (pace.length < 2) return 0;
  const first = pace[0];
  const last = pace[pace.length - 1];
  const span = last.at - first.at;
  return span > 0 ? Math.max(0, last[kind] - first[kind]) / span : 0;
}

/**
 * A goal's target: the tier's target, raised when the org is already moving so fast that it would
 * finish in less than five minutes. A deal that completes the moment it is signed is no deal.
 */
export function goalTarget(s: GameState, kind: SponsorGoalKind, tier: number): number {
  const base = GOAL_INFO[kind].targets[tier];
  const pace = goalPace(s, kind);
  return Math.max(base, Math.ceil(pace * MIN_GOAL_SECONDS));
}

/** How strong a deal's category perk is: its tier, times how demanding its goal is. */
export function offerPerkScale(tier: number, kind: SponsorGoalKind): number {
  return SPONSOR_TIERS[tier].perkScale * GOAL_EASE[kind];
}

export function generateOffer(s: GameState, rng: Rng): SponsorOffer {
  let maxTier = 0;
  const top = maxSponsorTier(s);
  SPONSOR_TIERS.forEach((t, i) => {
    if (i <= top && s.fansRun >= t.fans / 20) maxTier = i;
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
    duration: Math.round(rng.range(kind === 'drops' ? 3600 : 900, kind === 'drops' ? 14_400 : 3600) / 60) * 60,
    incomePct: t.incomePct * GOAL_EASE[kind] * (brand.category === 'crypto' ? 2 : 1) * rng.range(0.85, 1.15),
    perkScale: offerPerkScale(tier, kind),
    goal: { kind, target: goalTarget(s, kind, tier), rewardSeconds: t.goalSeconds },
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
    earnedAt: s.earnedRun,
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

/** A category perk's effect at a contract's strength. */
export function scaleSponsorEffect(e: Effect, k: number): Effect {
  if ('mult' in e && typeof e.mult === 'number') {
    // Reductions deepen towards a floor; bonuses grow linearly.
    const mult = e.mult < 1 ? Math.max(0.3, 1 - (1 - e.mult) * k) : 1 + (e.mult - 1) * k;
    return { ...e, mult } as Effect;
  }
  if ('add' in e && typeof e.add === 'number') return { ...e, add: e.add * k } as Effect;
  return e;
}

/** Income bonus and category perks from active contracts, each at its deal's strength. */
export function sponsorBonuses(s: GameState): SponsorBonuses {
  const out: SponsorBonuses = { incomePct: 0, stats: [], effects: [] };
  for (const c of s.sponsors.active) {
    if (c.endsAt <= s.time) continue;
    const brand = BRAND_MAP.get(c.brandId);
    if (!brand) continue;
    out.incomePct += c.incomePct;
    const info = CATEGORY_INFO[brand.category];
    const k = c.perkScale ?? 1;
    if (info.stats) out.stats.push(...info.stats.map((st) => ({ ...st, amount: st.amount * k })));
    if (info.effects) out.effects.push(...info.effects.map((e) => scaleSponsorEffect(e, k)));
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
        emit({ type: 'toast', title: `${brand?.name ?? 'Sponsor'} contract ended`, body: 'A sponsor slot is free again.', icon: 'handshake', tone: 'info', channel: 'business' });
      }
    }
  }
  if (offline || !sponsorsUnlocked(s)) return;

  // Five minutes of progress, so new goals are pitched at the org's real pace.
  s.sponsors.pace ??= [];
  const lastSample = s.sponsors.pace[s.sponsors.pace.length - 1];
  if (!lastSample || s.time - lastSample.at >= PACE_EVERY) {
    s.sponsors.pace.push(paceSample(s));
    if (s.sponsors.pace.length > PACE_SAMPLES) s.sponsors.pace.splice(0, s.sponsors.pace.length - PACE_SAMPLES);
  }

  if (s.time >= s.sponsors.nextRefresh) refreshOffers(s, ctx.rng, OFFER_COUNT);

  for (const c of s.sponsors.active) {
    const brand = BRAND_MAP.get(c.brandId);
    if (!c.completed && goalProgress(s, c) >= c.goal.target) {
      c.completed = true;
      const reward = goalReward(s, c, ctx.rates.cpsNoBuffs);
      earnCash(s, reward, 'sponsor');
      const trophies = c.tier >= 2 ? 1 : 0;
      gainTrophies(s, trophies);
      if (trophies > 0) {
        addTrophy(s, { kind: 'sponsor', gameId: trophyHomeGame(s), tier: c.tier, season: null, mvp: null, label: `${brand?.name ?? 'Sponsor'} goal` }, trophies);
      }
      s.stats.sponsorGoals++;
      emit({
        type: 'toast',
        title: `${brand?.name ?? 'Sponsor'} goal complete!`,
        body: `+${money(reward)}${trophies ? ' and a trophy' : ''}.`,
        icon: 'handshake',
        tone: 'gold',
        channel: 'business',
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
    emit({ type: 'toast', title: `${brand.name} collapsed!`, body: 'The token went to zero. Income ×0.5 for 5 minutes while you deal with the fallout.', icon: 'trending-down', tone: 'bad', channel: 'business' });
  }
}
