/**
 * Is the run paced like Cookie Clicker? Plays the `active` persona (selling as the matrix does) and,
 * every 30 minutes, measures the shape of the economy against the price curve:
 *
 *   A  income doubling time: minutes until income is twice what it is now (should lengthen)
 *   B  payback of the next unit of the most-owned operation (a sawtooth: ×1.15 a unit, dropping at
 *      each doubling tier, trending up)
 *   C  cost coupling: how much of the income growth since the last reading came from things bought
 *      on the ×1.15 wall (units, upgrades and levels) versus multipliers that are not (fame, superfan,
 *      sponsors, Legacy, matches and merch)
 *   D  seconds of income the next purchase of each kind (the best payback) costs (flat or rising
 *      after hour 2)
 *   E  best payback of each kind (nothing becomes free: no kind's payback collapses)
 *   F  the Legacy level term as a share of the whole income multiplier (a minority, not ×1e11)
 *
 * The late-game reference save (tests/fixtures/lategame-save.txt) gets the same readings once.
 * A and D are also targets in the matrix report (targets.ts); this script is the long form.
 *
 *   npx tsx scripts/sim/price-curve.ts [--seed=1] [--hours=12] [--runs=1] [--out=output/sim/price-curve]
 * writes price-curve.md and price-curve.json in the out folder. About a minute per simulated hour.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { OPERATIONS } from '../../src/data/operations';
import { TIER_NEED } from '../../src/data/upgrades';
import { computeMods, computeRates } from '../../src/engine/economy';
import { unitPrice } from '../../src/engine/operations';
import { decodeSave } from '../../src/engine/save';
import type { GameState } from '../../src/engine/types';
import { candidates, totalCps } from './buyers';
import { hms } from './report';
import { runSim } from './run-sim';
import { DOUBLING_MINUTES } from './targets';
import type { PurchaseKind, Sample } from './types';

declare const process: { argv: string[] };

const args = Object.fromEntries(
  process.argv.slice(2).map((a: string) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? 'true'];
  }),
);
const SEED = Number(args.seed ?? 1);
const HOURS = Number(args.hours ?? 12);
const OUT = String(args.out ?? 'output/sim/price-curve');
/** Runs to play: 999 sells as the matrix does; 1 stays in the first run to see where it levels off. */
const RUNS = Number(args.runs ?? 999);
const EVERY = 1800;

/** Income multipliers, as factors whose product is the unbuffed total income. */
const FACTORS = ['units', 'upgrades', 'fame', 'superfan', 'sponsor', 'legacy', 'global', 'matches', 'merch'] as const;
type Factor = (typeof FACTORS)[number];
/** Factors the player pays for on the ×1.15 price wall. */
const PRICED: Factor[] = ['units', 'upgrades'];
const KINDS: PurchaseKind[] = ['op', 'upgrade', 'staff', 'gear', 'merch', 'decor'];

interface Reading {
  run: number;
  wall: number;
  runWall: number;
  income: number;
  factors: Record<Factor, number>;
  /** B: the most-owned operation (not the grinder), how many are owned, the next tier and the payback of one more. */
  topOp: { id: string; owned: number; nextTier: number | null; payback: number };
  afford: Partial<Record<PurchaseKind, number>>;
  payback: Partial<Record<PurchaseKind, number>>;
  legacyLevel: number;
  /** Index of the highest operation owned (0 grinder … 15 Multiverse Championship), and the total multiplier on raw units. */
  topTier: number;
  mult: number;
  fans: number;
  achievements: number;
  /** Each operation's income and units owned. */
  ops: Record<string, { cps: number; owned: number }>;
}

function read(s: GameState, sample?: Sample): Omit<Reading, 'run' | 'wall' | 'runWall'> {
  const mods = computeMods(s);
  const r = computeRates(s, mods);
  const inc = r.buffIncomeMult || 1;
  const ops = r.cpsNoBuffs;
  const match = r.matchCps / inc;
  const merch = r.merchCps / inc;
  const income = ops + match + merch;
  let units = 0;
  for (const op of OPERATIONS) units += op.baseCps * s.ops[op.id].owned;
  const sponsor = 1 + mods.sponsorIncomePct;
  const legacy = 1 + s.prestige.level * mods.legacyLevelPct;
  // Matches and merch are counted as one factor on top of operations, split in proportion.
  const extra = ops > 0 ? income / ops : 1;
  const matchShare = match + merch > 0 ? match / (match + merch) : 0.5;
  const factors: Record<Factor, number> = {
    units,
    upgrades: units > 0 ? r.baseCps / units : 1,
    fame: r.fameMult,
    superfan: r.superfanMult,
    sponsor,
    legacy,
    global: mods.globalMult / sponsor / legacy,
    matches: Math.pow(extra, matchShare),
    merch: Math.pow(extra, 1 - matchShare),
  };

  const byOwned = OPERATIONS.filter((o) => o.id !== 'grinder').sort((a, b) => s.ops[b.id].owned - s.ops[a.id].owned)[0];
  const owned = s.ops[byOwned.id].owned;
  const base = totalCps(s, mods);
  s.ops[byOwned.id].owned++;
  const gain = totalCps(s, mods) - base;
  s.ops[byOwned.id].owned--;
  const topOp = { id: byOwned.id, owned, nextTier: TIER_NEED.find((n) => n > owned) ?? null, payback: gain > 0 ? unitPrice(byOwned, owned, mods.opCostMult, mods.opFirstUnits[byOwned.id]) / gain : Infinity };

  const afford: Reading['afford'] = sample?.afford ?? {};
  const payback: Reading['payback'] = {};
  for (const c of candidates(s, base, { decor: true, merch: true, teams: true, everything: true })) {
    if (!(c.gain > 0) || !Number.isFinite(c.cost)) continue;
    if (c.cost / c.gain >= (payback[c.kind] ?? Infinity)) continue;
    payback[c.kind] = c.cost / c.gain;
    if (!sample) afford[c.kind] = c.cost / base;
  }
  const topTier = Math.max(0, ...OPERATIONS.filter((o) => s.ops[o.id].owned > 0).map((o) => o.index));
  return { income, factors, topOp, afford, payback, legacyLevel: s.prestige.level, topTier, mult: units > 0 ? income / units : 0, fans: s.fans, achievements: r.cabinetCount, ops: Object.fromEntries(OPERATIONS.map((o) => [o.id, { cps: r.opCps[o.id] / (r.buffIncomeMult || 1), owned: s.ops[o.id].owned }])) };
}

/**
 * Minutes until income first reaches twice the reading's, within the same run, interpolated on a log
 * scale between readings; a lower bound if it never does.
 */
function doubling(readings: Reading[], i: number): { minutes: number; bound: boolean } {
  const from = readings[i];
  for (let j = i + 1; j < readings.length && readings[j].run === from.run; j++) {
    if (readings[j].income >= 2 * from.income) {
      const a = readings[j - 1];
      const b = readings[j];
      const f = Math.log((2 * from.income) / a.income) / Math.log(b.income / a.income);
      return { minutes: (a.runWall + f * (b.runWall - a.runWall) - from.runWall) / 60, bound: false };
    }
  }
  const last = [...readings].reverse().find((x) => x.run === from.run)!;
  return { minutes: (last.runWall - from.runWall) / 60, bound: true };
}

/** Share of the log income growth between two readings carried by each factor. */
function coupling(a: Reading, b: Reading): Record<Factor, number> | null {
  const total = Math.log(b.income / a.income);
  if (!(Math.abs(total) > 1e-9) || a.run !== b.run) return null;
  return Object.fromEntries(FACTORS.map((f) => [f, Math.log(b.factors[f] / a.factors[f]) / total])) as Record<Factor, number>;
}

/** F: the Legacy level term's share of the whole multiplier on top of raw units. */
const legacyShare = (x: Reading) => {
  const whole = Math.log(x.income / Math.max(1e-300, x.factors.units));
  return whole > 0 ? Math.log(x.factors.legacy) / whole : 0;
};

const sci = (x: number): string => (!Number.isFinite(x) ? '-' : Math.abs(x) < 1e4 ? x.toFixed(x < 10 ? 2 : 0) : x.toExponential(2).replace('e+', 'e'));
const secs = (x: number | undefined): string => (x === undefined ? '-' : `${sci(x)}s`);
const pct = (x: number): string => (Number.isFinite(x) ? `${(x * 100).toFixed(0)}%` : '-');
const table = (head: string[], rows: (string | number)[][]): string =>
  [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n');

function main(): void {
  const readings: Reading[] = [];
  const started = Date.now();
  const record = runSim({
    persona: 'active',
    seed: SEED,
    hours: HOURS,
    runs: RUNS,
    sampleEvery: EVERY,
    onSample: (s, smp) => readings.push({ run: smp.run, wall: smp.wall, runWall: smp.runWall, ...read(s, smp) }),
  });
  const reference = read(decodeSave(readFileSync('tests/fixtures/lategame-save.txt', 'utf8').trim()));

  const L: string[] = [];
  L.push('# Price curve');
  L.push('');
  L.push(`Active persona, seed ${SEED}, ${HOURS} h, selling as the matrix does (${record.sales.length} sales, at ${record.sales.map((x) => hms(x.wall)).join(', ') || 'none'}). Readings every 30 minutes; see the header of \`scripts/sim/price-curve.ts\` for what each check means. Ran in ${hms((Date.now() - started) / 1000)}.`);
  L.push('');
  L.push('## A, B, F: doubling time, the most-owned operation, the Legacy term');
  L.push('');
  L.push(
    table(
      ['time', 'run', 'income/s', 'A: min to double', 'B: most-owned op', 'owned (next tier)', 'B: payback of one more', 'Legacy level', 'F: Legacy share of multiplier'],
      readings.map((x, i) => {
        const d = doubling(readings, i);
        return [hms(x.wall), x.run, sci(x.income), `${d.bound ? '>' : ''}${d.minutes.toFixed(0)}`, x.topOp.id, `${x.topOp.owned} (${x.topOp.nextTier ?? '-'})`, hms(x.topOp.payback), x.legacyLevel, pct(legacyShare(x))];
      }),
    ),
  );
  L.push('');
  L.push(`Targets for A (targets.ts): ${DOUBLING_MINUTES.map(([h, m]) => `at least ${m} min ${h} h after the first Legacy point`).join(', ')}.`);
  L.push('');
  L.push('## C: where each half hour of growth came from');
  L.push('');
  L.push(`Share of the log income growth since the previous reading. **Priced** is ${PRICED.join(' + ')}: what the player buys on the ×1.15 wall. A Cookie-Clicker-like run has priced factors carrying most of the growth.`);
  L.push('');
  const cRows: (string | number)[][] = [];
  for (let i = 1; i < readings.length; i++) {
    const c = coupling(readings[i - 1], readings[i]);
    if (!c) continue;
    cRows.push([hms(readings[i].wall), `×${sci(readings[i].income / readings[i - 1].income)}`, pct(PRICED.reduce((a, f) => a + c[f], 0)), ...FACTORS.map((f) => pct(c[f]))]);
  }
  L.push(table(['time', 'growth', 'priced', ...FACTORS], cRows));
  L.push('');
  L.push('## D and E: what the next purchase costs, and its payback, by kind');
  L.push('');
  L.push('D is the cost of the best-payback purchase of each kind (what a player buys next), in seconds of income; E is the best payback of each kind (cost ÷ income added).');
  L.push('');
  L.push(table(['time', 'run', ...KINDS.map((k) => `D ${k}`), ...KINDS.map((k) => `E ${k}`)], readings.map((x) => [hms(x.wall), x.run, ...KINDS.map((k) => secs(x.afford[k])), ...KINDS.map((k) => hms(x.payback[k] ?? NaN))])));
  L.push('');
  L.push('## The late-game reference save');
  L.push('');
  L.push(
    table(
      ['income/s', 'Legacy level', 'F: Legacy share', 'most-owned op', 'B: payback', ...KINDS.map((k) => `E ${k}`)],
      [[sci(reference.income), sci(reference.legacyLevel), pct(legacyShare({ ...reference, run: 0, wall: 0, runWall: 0 })), `${reference.topOp.id} ${reference.topOp.owned}`, hms(reference.topOp.payback), ...KINDS.map((k) => hms(reference.payback[k] ?? NaN))]],
    ),
  );
  L.push('');
  L.push(`Multipliers in the reference save: ${FACTORS.map((f) => `${f} ×${sci(reference.factors[f])}`).join(', ')}.`);
  L.push('');

  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/price-curve.md`, L.join('\n'));
  writeFileSync(`${OUT}/price-curve.json`, JSON.stringify({ seed: SEED, hours: HOURS, readings, reference }));
  const first = record.milestones.find((m) => m.key === 'first legacy point' && m.run === 1);
  console.log(`first Legacy ${first ? hms(first.wall) : 'never'}; sales at ${record.sales.map((x) => hms(x.wall)).join(', ') || 'none'}`);
  console.log('time run income  top mult   double(min)');
  readings.forEach((x, i) => {
    const d = doubling(readings, i);
    console.log(`${hms(x.wall).padEnd(6)}${String(x.run).padEnd(4)}${sci(x.income).padEnd(9)}${String(x.topTier).padEnd(4)}${sci(x.mult).padEnd(9)}${d.bound ? '>' : ''}${d.minutes.toFixed(0)}`);
  });
  console.log(`wrote ${OUT}/price-curve.md (${readings.length} readings)`);
}

main();
