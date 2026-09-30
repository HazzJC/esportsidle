/**
 * Lategame checks that go beyond ablation: spending efficiency, lump-sum payouts, and the
 * multiplier chains that look unbounded. Each returns plain data; the report script prints it and
 * tests/lategame-audit.test.ts turns the interesting rows into budgets.
 */
import { ACHIEVEMENTS } from '../src/data/achievements';
import { TRENDS } from '../src/data/merch';
import { OPERATIONS } from '../src/data/operations';
import { STAFF } from '../src/data/staff';
import { MERCH_SPOTLIGHT_MULT, clickDrop, hypeTrainPayout } from '../src/engine/drops';
import { tick } from '../src/engine/game';
import { cabinetCount, cabinetIncomeMult, cabinetMarginalGain, computeMods, computeRates } from '../src/engine/economy';
import { MANIA_BONUS, optimalPrice } from '../src/engine/merch';
import { maxAffordable, operationLevelCost, unitPrice } from '../src/engine/operations';
import { Rng } from '../src/engine/rng';
import { goalRewardPotential, sponsorBonuses } from '../src/engine/sponsors';
import { maxStaffAffordable, staffPrice } from '../src/engine/staff';
import { championPrize, pickTournamentTeam } from '../src/engine/tournament';
import { INCOME_SOURCES, type GameState, type IncomeSource } from '../src/engine/types';
import { measure, settled } from './lategame-lib';

export interface Payback {
  kind: 'operation' | 'staff' | 'operation level';
  /** Levels are bought with trophies, everything else with cash. */
  currency: 'cash' | 'trophies';
  id: string;
  owned: number;
  cost: number;
  /** Extra total income per second from one more. */
  gain: number;
  /** Seconds of current income to earn the cost back. */
  paybackSeconds: number;
  /** Local exponent: percent income change for 1% more of this thing. */
  elasticity: number;
  /** How many of them the org's cash could buy at the current price. */
  affordable: number;
}

export function paybacks(save: GameState): Payback[] {
  const s = settled(save);
  const mods = computeMods(s);
  const base = measure(s, mods).total;
  const out: Payback[] = [];
  const probe = (kind: Payback['kind'], id: string, owned: number, cost: number, bump: (c: GameState, n: number) => void): void => {
    const step = Math.max(1, Math.round(owned * 0.01));
    const one = structuredClone(s);
    bump(one, 1);
    const gain = measure(one).total - base;
    const many = structuredClone(s);
    bump(many, step);
    const elasticity = owned > 0 ? Math.log(measure(many).total / base) / Math.log((owned + step) / owned) : 0;
    const currency = kind === 'operation level' ? 'trophies' : 'cash';
    const purse = currency === 'cash' ? s.cash : s.trophies;
    out.push({ kind, id, owned, currency, cost, gain, paybackSeconds: currency === 'cash' && gain > 0 ? cost / gain : Infinity, elasticity, affordable: cost > 0 ? purse / cost : Infinity });
  };
  for (const op of OPERATIONS) {
    const owned = s.ops[op.id].owned;
    probe('operation', op.id, owned, unitPrice(op, owned, mods.opCostMult), (c, n) => (c.ops[op.id].owned += n));
    const level = s.ops[op.id].level;
    probe('operation level', op.id, level, operationLevelCost(level), (c, n) => (c.ops[op.id].level += n));
  }
  for (const def of STAFF) {
    const owned = s.staff[def.id] ?? 0;
    if (owned <= 0) continue;
    probe('staff', def.id, owned, staffPrice(def, owned, 1, mods.staffCostMult), (c, n) => (c.staff[def.id] = owned + n));
  }
  return out.sort((a, b) => a.paybackSeconds - b.paybackSeconds);
}

export interface Payout {
  what: string;
  amount: number;
  /** In seconds of the org's steady total income. */
  seconds: number;
}

export function payouts(save: GameState): Payout[] {
  const s = settled(save);
  const mods = computeMods(s);
  const rates = computeRates(s, mods);
  const ctx = { rng: new Rng(s), mods, rates };
  const total = rates.totalCps;
  const out: Payout[] = [];
  const add = (what: string, amount: number) => out.push({ what, amount, seconds: amount / total });
  add('Invitational champion (all three rounds)', championPrize(s, ctx));
  const team = pickTournamentTeam(s, rates);
  if (team) add('one league match win, flagship', team.winPrize);
  add('Hype Train, carriage 3', hypeTrainPayout(s, ctx, 3));
  add('Hype Train, cap', hypeTrainPayout(s, ctx, 30));
  add('Prize Pool drop', Math.min(s.cash * 0.15, rates.cpsNoBuffs * 900));
  const c = s.sponsors.active[0];
  if (c) add(`sponsor goal potential, tier ${c.tier + 1}`, goalRewardPotential(c.tier, c.goal.rewardSeconds, rates.cpsNoBuffs, c.goal.kind));
  return out.sort((a, b) => b.seconds - a.seconds);
}

export interface Envelope {
  label: string;
  merchOverOps: number;
}

/** Merch income against operations income, from stale and off-trend to fresh, on trend and buffed. */
export function merchEnvelope(save: GameState): Envelope[] {
  const s = settled(save);
  const ratio = (c: GameState) => {
    const r = computeRates(c);
    return r.merchCps / r.cps;
  };
  const stale = structuredClone(s);
  const fresh = structuredClone(s);
  for (const l of Object.values(stale.merch.lines)) {
    l.launchedAt = stale.time - 1e6;
    l.price = 3;
  }
  for (const l of Object.values(fresh.merch.lines)) {
    l.launchedAt = fresh.time;
    l.price = optimalPrice(true);
  }
  let worst = Infinity;
  let best = 0;
  for (const t of TRENDS.map((x) => x.id)) {
    stale.merch.trend = t;
    fresh.merch.trend = t;
    worst = Math.min(worst, ratio(stale));
    best = Math.max(best, ratio(fresh));
  }
  return [
    { label: 'stale designs, off trend, price 3.0', merchOverOps: worst },
    { label: 'as saved', merchOverOps: ratio(s) },
    { label: 'fresh designs, on trend, tuned price', merchOverOps: best },
    { label: `... plus a Merch Spotlight drop (x${MERCH_SPOTLIGHT_MULT})`, merchOverOps: best * MERCH_SPOTLIGHT_MULT },
    { label: `... plus a merch mania on the same product (x${MANIA_BONUS} more)`, merchOverOps: best * MERCH_SPOTLIGHT_MULT * MANIA_BONUS },
  ];
}

export interface CabinetInfo {
  achievements: number;
  possible: number;
  factors: number[];
  multiplier: number;
  /** Income gained by the next achievement, as a share. */
  marginal: number;
  /** Multiplier if every non-shadow achievement were owned. */
  atCompletion: number;
}

export function cabinetInfo(save: GameState): CabinetInfo {
  const s = settled(save);
  const mods = computeMods(s);
  const count = cabinetCount(s);
  const possible = ACHIEVEMENTS.filter((a) => !a.shadow).length;
  return {
    achievements: count,
    possible,
    factors: mods.superfanFactors,
    multiplier: cabinetIncomeMult(count, mods.superfanFactors),
    marginal: cabinetMarginalGain(count, mods.superfanFactors),
    atCompletion: cabinetIncomeMult(possible, mods.superfanFactors),
  };
}

/** The sponsor bonus as the contracts state it, against what it becomes after the Agent multiplier. */
export function sponsorChain(save: GameState): { statedPct: number; agentMult: number; effectivePct: number; contracts: number } {
  const s = settled(save);
  const mods = computeMods(s);
  return { statedPct: sponsorBonuses(s).incomePct, agentMult: mods.sponsorIncomeMult, effectivePct: mods.sponsorIncomePct, contracts: s.sponsors.active.length };
}

export interface AllIn {
  kind: 'operation' | 'staff';
  id: string;
  bought: number;
  owned: number;
  /** Income after spending all cash on this one line, over income before. */
  factor: number;
}

/** What happens if the whole bank goes into one line. Anything far above 1 is the line to watch. */
export function allIn(save: GameState): AllIn[] {
  const s = settled(save);
  const mods = computeMods(s);
  const base = measure(s, mods).total;
  const out: AllIn[] = [];
  for (const op of OPERATIONS) {
    const owned = s.ops[op.id].owned;
    const n = maxAffordable(op, owned, s.cash, mods.opCostMult);
    const c = structuredClone(s);
    c.ops[op.id].owned += n;
    out.push({ kind: 'operation', id: op.id, bought: n, owned, factor: measure(c).total / base });
  }
  for (const def of STAFF) {
    const owned = s.staff[def.id] ?? 0;
    if (owned <= 0) continue;
    const n = maxStaffAffordable(def, owned, s.cash, mods.staffCostMult);
    const c = structuredClone(s);
    c.staff[def.id] = owned + n;
    out.push({ kind: 'staff', id: def.id, bought: n, owned, factor: measure(c).total / base });
  }
  return out.sort((a, b) => b.factor - a.factor);
}

export interface Projection {
  seed: number;
  /** One row per simulated hour. */
  rows: { hour: number; totalCps: number; earned: number; fans: number; booked: Record<IncomeSource, number> }[];
  tournamentsWon: number;
  tournamentsPlayed: number;
  finite: boolean;
}

/**
 * Plays the save forward with no purchases and no sale, catching every Hype Drop, so the income
 * ledger shows which sources keep growing when the player only watches.
 */
export function projectForward(save: GameState, hours: number, seed: number): Projection {
  const s = settled(save);
  s.rng = seed;
  const rows: Projection['rows'] = [];
  let last = { ...s.incomeRun };
  const startWon = s.stats.tournamentsWon;
  const startPlayed = s.stats.tournamentsPlayed;
  let finite = true;
  for (let t = 1; t <= hours * 3600; t++) {
    if (s.drops.active.length > 0) {
      const mods = computeMods(s);
      const ctx = { rng: new Rng(s), mods, rates: computeRates(s, mods) };
      for (const d of [...s.drops.active]) clickDrop(s, d.id, ctx);
    }
    tick(s, 1);
    if (t % 3600 === 0) {
      const booked = Object.fromEntries(INCOME_SOURCES.map((k) => [k, s.incomeRun[k] - (last[k] ?? 0)])) as Record<IncomeSource, number>;
      last = { ...s.incomeRun };
      const r = computeRates(s);
      finite = finite && [s.cash, s.earnedTotal, r.totalCps, s.fans].every(Number.isFinite);
      rows.push({ hour: t / 3600, totalCps: r.totalCps, earned: s.earnedRun, fans: s.fans, booked });
    }
  }
  return { seed, rows, tournamentsWon: s.stats.tournamentsWon - startWon, tournamentsPlayed: s.stats.tournamentsPlayed - startPlayed, finite };
}
