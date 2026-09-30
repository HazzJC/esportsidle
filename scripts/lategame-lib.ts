/**
 * Shared helpers for the ultra-lategame balance audit: load the reference save, measure income
 * under a hypothetical, and sweep "what if this were gone" ablations over everything that scales.
 *
 * The reference save (tests/fixtures/lategame-save.txt) is a real player's org: 12 sales, a
 * complete Legacy tree, ~5.5 trillion Legacy levels, 1e50 lifetime earnings. Everything here treats
 * it as read-only; each hypothetical works on a structuredClone.
 */
import { readFileSync } from 'node:fs';
import { DECOR } from '../src/data/decor';
import { DYNASTY, LEGACY_NODES, CHALLENGES } from '../src/data/legacy';
import { OPERATIONS } from '../src/data/operations';
import { STAFF } from '../src/data/staff';
import { UPGRADES } from '../src/data/upgrades';
import { computeMods, computeRates } from '../src/engine/economy';
import { decodeSave } from '../src/engine/save';
import type { GameState, IncomeSource, Mods, Rates } from '../src/engine/types';

export const SAVE_PATH = 'tests/fixtures/lategame-save.txt';

export function loadLategameSave(path = SAVE_PATH): GameState {
  return decodeSave(readFileSync(path, 'utf8'));
}

/** The save was exported mid-debuff; clearing buffs gives the steady-state income. */
export function settled(s: GameState): GameState {
  const c = structuredClone(s);
  c.buffs = [];
  return c;
}

export interface Measure {
  total: number;
  ops: number;
  match: number;
  merch: number;
  fansPerSec: number;
  click: number;
  globalMult: number;
}

export function measure(s: GameState, mods?: Mods): Measure {
  const r: Rates = computeRates(s, mods ?? computeMods(s));
  return { total: r.totalCps, ops: r.cps, match: r.matchCps, merch: r.merchCps, fansPerSec: r.fansPerSec, click: r.click, globalMult: r.globalMult };
}

export const log10 = (x: number): number => (x > 0 ? Math.log10(x) : -Infinity);

export interface Ablation {
  group: string;
  id: string;
  /** Legacy points it cost, when that applies. */
  cost?: number;
  /** total income with the thing / total income without it. */
  factor: number;
  matchFactor: number;
  merchFactor: number;
  opsFactor: number;
}

/** Compares income with and without whatever `remove` takes away. */
function ablate(base: Measure, s: GameState, group: string, id: string, remove: (c: GameState) => void, cost?: number): Ablation {
  const c = structuredClone(s);
  remove(c);
  const m = measure(c);
  const ratio = (a: number, b: number) => (b > 0 ? a / b : a > 0 ? Infinity : 1);
  return { group, id, cost, factor: ratio(base.total, m.total), matchFactor: ratio(base.match, m.match), merchFactor: ratio(base.merch, m.merch), opsFactor: ratio(base.ops, m.ops) };
}

/** Removes each owned thing in turn and records how much income disappears. */
export function sweepAblations(save: GameState): Ablation[] {
  const s = settled(save);
  const base = measure(s);
  const out: Ablation[] = [];

  // Legacy ------------------------------------------------------------------
  for (const id of Object.keys(s.prestige.nodes)) {
    const def = LEGACY_NODES.find((n) => n.id === id);
    if (!def?.effects?.length) continue;
    out.push(ablate(base, s, 'legacy node', id, (c) => delete c.prestige.nodes[id], def.cost));
  }
  for (const d of DYNASTY) {
    const rank = s.prestige.dynasty[d.id] ?? 0;
    if (rank > 0) out.push(ablate(base, s, 'dynasty track', `${d.id} (rank ${rank})`, (c) => (c.prestige.dynasty[d.id] = 0)));
  }
  for (const ch of CHALLENGES) {
    if (s.prestige.challengesDone[ch.id] !== undefined) out.push(ablate(base, s, 'challenge reward', ch.id, (c) => delete c.prestige.challengesDone[ch.id]));
  }
  out.push(ablate(base, s, 'legacy level', 'all levels (level=0)', (c) => (c.prestige.level = 0)));
  out.push(ablate(base, s, 'legacy level', 'half the levels', (c) => (c.prestige.level = Math.floor(c.prestige.level / 2))));
  if (s.prestige.legends.length) out.push(ablate(base, s, 'legends', `${s.prestige.legends.length} retired legends`, (c) => (c.prestige.legends = [])));
  if (s.prestige.charter) out.push(ablate(base, s, 'charter', s.prestige.charter, (c) => (c.prestige.charter = null)));

  // Everything else ------------------------------------------------------------
  for (const def of UPGRADES) {
    if (s.upgrades[def.id] === undefined) continue;
    out.push(ablate(base, s, `upgrade:${def.group}`, def.id, (c) => delete c.upgrades[def.id]));
  }
  for (const def of STAFF) {
    if ((s.staff[def.id] ?? 0) > 0) out.push(ablate(base, s, 'staff', `${def.id} (${s.staff[def.id]})`, (c) => (c.staff[def.id] = 0)));
  }
  for (const op of OPERATIONS) {
    if (s.ops[op.id].owned > 0) out.push(ablate(base, s, 'operation', `${op.id} (${s.ops[op.id].owned})`, (c) => (c.ops[op.id].owned = 0)));
  }
  for (const def of DECOR) if (s.decor[def.id]) out.push(ablate(base, s, 'decor', def.id, (c) => delete c.decor[def.id]));
  out.push(ablate(base, s, 'sponsors', `${s.sponsors.active.length} active contracts`, (c) => (c.sponsors.active = [])));
  out.push(ablate(base, s, 'merch', 'all product lines', (c) => (c.merch.lines = {})));
  out.push(ablate(base, s, 'fans', 'fans = 0 (fame bonus)', (c) => (c.fans = 0)));
  out.push(ablate(base, s, 'achievements', 'trophy cabinet (superfan)', (c) => (c.achievements = {})));
  for (const [gameId, team] of Object.entries(s.teams)) {
    out.push(ablate(base, s, 'team', `${gameId} (tier ${team.tier})`, (c) => delete c.teams[gameId]));
  }
  return out.sort((a, b) => b.factor - a.factor);
}

/** Index by group, for reports. */
export function topBy(list: Ablation[], group: string, n = 8): Ablation[] {
  return list.filter((a) => a.group === group || a.group.startsWith(`${group}:`)).slice(0, n);
}

export interface Headroom {
  what: string;
  value: number;
  /** Orders of magnitude between the value and the float ceiling (1.79e308). */
  decadesLeft: number;
}

const FLOAT_MAX_LOG = Math.log10(Number.MAX_VALUE);

export const headroom = (what: string, value: number): Headroom => ({ what, value, decadesLeft: FLOAT_MAX_LOG - log10(Math.abs(value)) });

/** Every persistent number that can only go up, and how close it is to Infinity. */
export function headrooms(s: GameState): Headroom[] {
  const r = computeRates(settled(s));
  const out: Headroom[] = [
    headroom('cash', s.cash),
    headroom('earnedTotal', s.earnedTotal),
    headroom('totalCps', r.totalCps),
    headroom('fans', s.fans),
    headroom('legacy level', s.prestige.level),
    headroom('merch revenue', s.stats.merchRevenue),
    headroom('merch sold', s.stats.merchSold),
    headroom('prize money', s.stats.prizeMoneyTotal),
  ];
  for (const src of Object.keys(s.incomeTotal) as IncomeSource[]) out.push(headroom(`incomeTotal.${src}`, s.incomeTotal[src]));
  return out;
}
