/**
 * What every purchase is worth at points in a realistic run. Takes the saves the `active` persona
 * snapshots (30 min, 1 h, 2 h, 3 h and an hour after its first Legacy point) and, for each one,
 * prices every thing the player could buy next and measures it on a copy of the game:
 *
 *  - money makers (operations, upgrades, staff, gear, merch finish, decor): income added and the
 *    payback in seconds of that income;
 *  - everything else: what actually changed (modifiers, fans, win chance, match or merch income), so
 *    a purchase that changes nothing in a real game shows up as dead;
 *  - cards with a simple stated effect (operation ×N, income +N%, prize ×N, merch ×N, clicks ×N) are
 *    checked against what they did;
 *  - Legacy nodes and Dynasty ranks, as income multiplier per point, at the post-Legacy snapshot.
 *
 * Outliers are flagged against the median payback of their own kind at the same snapshot.
 *
 *   npx tsx scripts/sim/paybacks.ts output/sim/full/active-1.json
 * writes output/sim/paybacks.md and paybacks.json next to the record's folder.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { DECOR } from '../../src/data/decor';
import { GAMES } from '../../src/data/games';
import { GEAR_SLOTS } from '../../src/data/gear';
import { DYNASTY, LEGACY_NODES } from '../../src/data/legacy';
import { PRODUCTS } from '../../src/data/merch';
import { OPERATIONS } from '../../src/data/operations';
import { STAFF } from '../../src/data/staff';
import { UPGRADES } from '../../src/data/upgrades';
import { computeMods, computeRates } from '../../src/engine/economy';
import { MAX_MERCH_QUALITY, merchQualityCost } from '../../src/engine/merch';
import { operationLevelCost, unitPrice } from '../../src/engine/operations';
import { gearUpgradeCost, playerRating } from '../../src/engine/players';
import { dynastyCost, dynastyRank } from '../../src/engine/prestige';
import { decodeSave } from '../../src/engine/save';
import { staffPrice } from '../../src/engine/staff';
import type { Effect, GameState, Rates } from '../../src/engine/types';
import { upgradePrice } from '../../src/engine/upgrades';
import { settled } from '../lategame-lib';
import { hms } from './report';
import type { SimRecord } from './types';

declare const process: { argv: string[] };

interface Row {
  snapshot: string;
  kind: string;
  id: string;
  name: string;
  /** In the store now (unlocked and affordable within ten minutes of income). */
  visible: boolean;
  currency: 'cash' | 'trophies' | 'legacy';
  cost: number;
  /** Seconds of current income the cost represents. */
  costSeconds: number;
  gain: number;
  /** Total income before, to express a gain as a multiplier. */
  base: number;
  payback: number;
  /** What changed besides total income. */
  effects: string[];
  flags: string[];
}

const flat = (o: unknown, prefix = '', out: Record<string, number> = {}): Record<string, number> => {
  if (typeof o === 'number') out[prefix] = o;
  else if (Array.isArray(o)) o.forEach((v, i) => flat(v, `${prefix}[${i}]`, out));
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) flat(v, prefix ? `${prefix}.${k}` : k, out);
  return out;
};

function view(s: GameState): Record<string, number> {
  const mods = computeMods(s);
  const r = computeRates(s, mods);
  const teams = Object.values(r.teams);
  return {
    ...flat(mods, 'mods'),
    'rates.fansPerSec': r.fansPerSec,
    'rates.click': r.click,
    'rates.matchCps': r.matchCps,
    'rates.merchCps': r.merchCps,
    'rates.cps': r.cps,
    'rates.winChance': teams.length ? teams.reduce((a, t) => a + t.winChance, 0) / teams.length : 0,
  };
}

function diff(before: Record<string, number>, after: Record<string, number>): string[] {
  const out: string[] = [];
  for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const a = before[k] ?? 0;
    const b = after[k] ?? 0;
    if (a === b || (Math.abs(b - a) <= 1e-9 * Math.max(Math.abs(a), Math.abs(b)))) continue;
    out.push(a !== 0 ? `${k} ×${(b / a).toPrecision(3)}` : `${k} ${a}→${b.toPrecision(3)}`);
  }
  return out;
}

/** The ratio a simple card promises for one rate, if it has a simple stated effect. */
function promise(effects: Effect[], r: Rates): { rate: 'cps' | 'matchCps' | 'merchCps' | 'click'; ratio: number } | null {
  if (effects.length !== 1) return null;
  const e = effects[0];
  switch (e.kind) {
    case 'opMult':
      return r.cps > 0 ? { rate: 'cps', ratio: 1 + ((r.opCps[e.op] ?? 0) / r.cps) * (e.mult - 1) } : null;
    case 'prizeMult':
      return { rate: 'matchCps', ratio: e.mult };
    case 'merchMult':
      return { rate: 'merchCps', ratio: e.mult };
    case 'clickMult':
      return { rate: 'click', ratio: e.mult };
    default:
      return null;
  }
}

function audit(label: string, save: GameState): Row[] {
  const s = settled(save);
  const mods = computeMods(s);
  const rates = computeRates(s, mods);
  const base = rates.totalCps;
  const before = view(s);
  const rows: Row[] = [];
  const add = (kind: string, id: string, name: string, visible: boolean, currency: Row['currency'], cost: number, apply: (c: GameState) => void, effects?: Effect[]) => {
    const c = structuredClone(s);
    apply(c);
    const after = view(c);
    const r2 = computeRates(c);
    const gain = r2.totalCps - base;
    const changes = diff(before, after);
    const flags: string[] = [];
    if (changes.length === 0 && Math.abs(gain) <= base * 1e-9) flags.push('dead: changes nothing here');
    const p = effects ? promise(effects, rates) : null;
    if (p && rates[p.rate] > 0) {
      const got = r2[p.rate] / rates[p.rate];
      if (Math.abs(got - p.ratio) > 0.05 * p.ratio) flags.push(`says ${p.rate} ×${p.ratio.toPrecision(3)}, did ×${got.toPrecision(3)}`);
    }
    rows.push({
      snapshot: label,
      kind,
      id,
      name,
      visible,
      currency,
      cost,
      costSeconds: currency === 'cash' && base > 0 ? cost / base : NaN,
      gain,
      base,
      payback: currency === 'cash' && gain > base * 1e-9 ? cost / gain : Infinity,
      effects: changes.filter((x) => !x.startsWith('rates.cps') || gain === 0).slice(0, 4),
      flags,
    });
  };
  const soon = (cost: number) => cost <= Math.max(s.cash, base * 600);

  for (const op of OPERATIONS) {
    const st = s.ops[op.id];
    const cost = unitPrice(op, st.owned, mods.opCostMult);
    add('operation', op.id, op.name, soon(cost), 'cash', cost, (c) => c.ops[op.id].owned++);
    if (st.owned > 0) add('op level', op.id, `${op.name} level ${st.level + 1}`, operationLevelCost(st.level) <= s.trophies, 'trophies', operationLevelCost(st.level), (c) => c.ops[op.id].level++);
  }
  for (const def of UPGRADES) {
    if (s.upgrades[def.id] !== undefined) continue;
    const unlocked = s.unlockedUpgrades[def.id] !== undefined;
    const cost = upgradePrice(def, mods);
    // Upgrades far beyond reach say little about this moment; keep those within a day of income.
    if (!unlocked && def.currency === 'cash' && cost > base * 86_400) continue;
    add(`upgrade: ${def.group}`, def.id, def.name, unlocked && soon(cost), def.currency, cost, (c) => (c.upgrades[def.id] = 0), def.effects);
  }
  for (const def of STAFF) {
    const owned = s.staff[def.id] ?? 0;
    const cost = staffPrice(def, owned, 1, mods.staffCostMult);
    add('staff', def.id, `${def.name} #${owned + 1}`, soon(cost), 'cash', cost, (c) => (c.staff[def.id] = owned + 1));
  }
  for (const team of Object.values(s.teams)) {
    const game = GAMES.find((g) => g.id === team.gameId)!;
    const starters = team.lineup.map((id) => (id ? s.players[id] : undefined)).filter((p) => p !== undefined);
    if (starters.length === 0) continue;
    const weakest = starters.reduce((a, b) => (playerRating(a, game, team.tier, null) <= playerRating(b, game, team.tier, null) ? a : b));
    for (const slot of GEAR_SLOTS) {
      const cost = gearUpgradeCost(weakest, slot.id, mods);
      if (!Number.isFinite(cost)) continue;
      add('gear', `${team.gameId}:${slot.id}`, `${game.name} ${slot.name} tier ${(weakest.gear[slot.id] ?? 0) + 1}`, soon(cost), 'cash', cost, (c) => c.players[weakest.id].gear[slot.id]++);
    }
  }
  for (const [productId, line] of Object.entries(s.merch.lines)) {
    if (!line.designId || (line.quality ?? 0) >= MAX_MERCH_QUALITY) continue;
    const cost = merchQualityCost(s, productId);
    add('merch finish', productId, `${productId} finish ${(line.quality ?? 0) + 1}`, soon(cost), 'cash', cost, (c) => (c.merch.lines[productId].quality = (c.merch.lines[productId].quality ?? 0) + 1));
  }
  for (const p of PRODUCTS) {
    if (s.merch.unlocked[p.id] || s.fansRun < p.unlockFans) continue;
    const designId = Object.values(s.merch.lines)[0]?.designId ?? Object.keys(s.designs)[0] ?? null;
    add('merch line', p.id, p.name, soon(p.unlockCost), 'cash', p.unlockCost, (c) => {
      c.merch.unlocked[p.id] = true;
      const first = Object.values(c.merch.lines)[0];
      c.merch.lines[p.id] = { ...(first ?? {}), designId, quality: 0 } as (typeof c.merch.lines)[string];
    });
  }
  for (const def of DECOR) {
    if (s.decor[def.id]) continue;
    add('decor', def.id, def.name, soon(def.cost), 'cash', def.cost, (c) => (c.decor[def.id] = true));
  }
  if (label.startsWith('first legacy')) {
    for (const def of LEGACY_NODES) {
      if (s.prestige.nodes[def.id] !== undefined || !def.effects?.length) continue;
      add('legacy node', def.id, def.name, true, 'legacy', def.cost, (c) => (c.prestige.nodes[def.id] = 0), def.effects);
    }
    for (const d of DYNASTY) add('dynasty', d.id, `${d.name} rank ${dynastyRank(s, d.id) + 1}`, true, 'legacy', dynastyCost(dynastyRank(s, d.id)), (c) => (c.prestige.dynasty[d.id] = dynastyRank(s, d.id) + 1));
  }

  // Outliers against the median payback of the same kind at this snapshot.
  const kinds = new Set(rows.map((r) => r.kind.replace(/:.*/, '')));
  for (const k of kinds) {
    const same = rows.filter((r) => r.kind.replace(/:.*/, '') === k && r.visible && Number.isFinite(r.payback));
    if (same.length < 4) continue;
    const med = [...same.map((r) => r.payback)].sort((a, b) => a - b)[Math.floor(same.length / 2)];
    for (const r of same) {
      // Things that cost under a second of income (old operations late in a run) make the median
      // comparison noise. What matters for them is whether they are free money.
      if (r.currency === 'cash' && r.costSeconds < 1) {
        if (r.payback < 10) r.flags.push('free: costs under a second of income and pays back in under 10 s');
        continue;
      }
      if (r.payback < med / 10) r.flags.push(`pays back ${(med / r.payback).toFixed(0)}x faster than its kind (median ${hms(med)})`);
      if (r.payback > med * 10) r.flags.push(`pays back ${(r.payback / med).toFixed(0)}x slower than its kind (median ${hms(med)})`);
    }
  }
  return rows;
}

const fmt = (x: number): string => (!Number.isFinite(x) ? '-' : Math.abs(x) < 1e4 ? x.toFixed(x < 10 ? 2 : 0) : x.toExponential(2).replace('e+', 'e'));

function markdown(all: Row[], source: string): string {
  const L: string[] = ['# Purchase payback audit', '', `From the snapshots in \`${source}\`. Payback is cost ÷ income added, in seconds; "cost" is in seconds of the income at the time. Buffs are cleared before measuring.`, ''];
  const snaps = [...new Set(all.map((r) => r.snapshot))];
  L.push('## Median payback of what is in the store, by kind', '');
  const kinds = [...new Set(all.map((r) => r.kind.replace(/:.*/, '')))];
  L.push(`| kind | ${snaps.join(' | ')} |`, `| --- | ${snaps.map(() => '---').join(' | ')} |`);
  for (const k of kinds) {
    const cells = snaps.map((sn) => {
      const xs = all.filter((r) => r.snapshot === sn && r.kind.replace(/:.*/, '') === k && r.visible && Number.isFinite(r.payback)).map((r) => r.payback).sort((a, b) => a - b);
      return xs.length ? `${hms(xs[Math.floor(xs.length / 2)])} (${xs.length})` : '-';
    });
    L.push(`| ${k} | ${cells.join(' | ')} |`);
  }
  L.push('');
  for (const sn of snaps) {
    const rows = all.filter((r) => r.snapshot === sn);
    L.push(`## ${sn}`, '');
    const flagged = rows.filter((r) => r.flags.length && (r.visible || r.kind.startsWith('legacy') || r.kind === 'dynasty'));
    L.push(`### Flagged (${flagged.length})`, '');
    L.push('| kind | item | cost (s) | payback | what changed | flags |', '| --- | --- | --- | --- | --- | --- |');
    // Rows with the same kind and verdict (a whole team's gear, say) collapse into one line.
    const groups = new Map<string, Row[]>();
    for (const r of flagged) {
      const shared = r.flags.some((f) => f.startsWith('dead') || f.startsWith('free'));
      const key = shared ? `${r.kind}|${r.flags.join('; ')}` : `${r.kind}|${r.id}`;
      groups.set(key, [...(groups.get(key) ?? []), r]);
    }
    for (const rs of [...groups.values()].slice(0, 60)) {
      const r = rs[0];
      const name = rs.length > 1 ? `${rs.length} items: ${rs.slice(0, 3).map((x) => x.name).join(', ')}${rs.length > 3 ? ', ...' : ''}` : r.name;
      const payback = rs.length > 1 ? `up to ${hms(Math.max(...rs.map((x) => (Number.isFinite(x.payback) ? x.payback : 0))))}` : Number.isFinite(r.payback) ? hms(r.payback) : '-';
      L.push(`| ${r.kind} | ${name} | ${fmt(Math.max(...rs.map((x) => x.costSeconds)))} | ${payback} | ${r.effects.join('; ') || '-'} | ${r.flags.join('; ')} |`);
    }
    L.push('');
    const best = rows.filter((r) => r.visible && Number.isFinite(r.payback)).sort((a, b) => a.payback - b.payback).slice(0, 15);
    L.push('### Best buys in the store', '', '| kind | item | cost (s) | payback |', '| --- | --- | --- | --- |');
    for (const r of best) L.push(`| ${r.kind} | ${r.name} | ${fmt(r.costSeconds)} | ${hms(r.payback)} |`);
    L.push('');
    const legacy = rows.filter((r) => r.currency === 'legacy');
    if (legacy.length) {
      L.push('### Legacy, income multiplier per point', '', '| item | cost | income × | per point | what changed |', '| --- | --- | --- | --- | --- |');
      const ratio = (r: Row) => (r.base > 0 ? 1 + r.gain / r.base : 1);
      const perPoint = (r: Row) => Math.pow(ratio(r), 1 / Math.max(1, r.cost));
      for (const r of legacy.sort((a, b) => perPoint(b) - perPoint(a))) {
        L.push(`| ${r.name} | ${r.cost} | ×${ratio(r).toPrecision(4)} | ×${perPoint(r).toPrecision(4)} | ${r.effects.join('; ') || '-'} |`);
      }
      L.push('');
    }
  }
  return L.join('\n');
}

const file = process.argv[2];
if (!file) throw new Error('usage: paybacks.ts <record.json with snapshots>');
const record = JSON.parse(readFileSync(file, 'utf8')) as SimRecord;
const all: Row[] = [];
for (const snap of record.snapshots) {
  const label = snap.label.startsWith('first legacy') ? `first legacy +1h (${hms(snap.runWall)})` : hms(snap.runWall);
  all.push(...audit(label, decodeSave(snap.save)));
}
const dir = file.replace(/[\\/][^\\/]+$/, '');
writeFileSync(`${dir}/paybacks.json`, JSON.stringify(all));
writeFileSync(`${dir}/paybacks.md`, markdown(all, file));
console.log(`${all.length} purchases priced over ${record.snapshots.length} snapshots -> ${dir}/paybacks.md`);
