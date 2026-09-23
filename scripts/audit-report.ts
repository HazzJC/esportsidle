/**
 * Turns the JSON records written by scripts/audit.ts into a markdown report of progression outliers.
 *
 *   npx tsx scripts/audit-report.ts output/progression-audit > output/progression-audit/report.md
 */
import { readdirSync, readFileSync } from 'node:fs';

declare const process: { argv: string[] };

type Source = 'ops' | 'click' | 'match' | 'merch' | 'sponsor' | 'quest' | 'drop' | 'event' | 'tournament';
interface Sample {
  run: number;
  wall: number;
  runWall: number;
  earnedRun: number;
  totalCps: number;
  opsCps: number;
  matchCps: number;
  merchCps: number;
  booked: Record<Source, number>;
  bestTier: number;
  quest: string | null;
  questsClaimed: number;
  legacyLevel: number;
  pending: number;
  merchFinish: number;
  merchLines: number;
  invitationals: [number, number];
}
interface Purchase {
  run: number;
  at: number;
  kind: string;
  id: string;
  cost: number;
  gain: number;
  base: number;
}
interface Record_ {
  mode: string;
  seed: number;
  hours: number;
  ranSeconds: number;
  purchases: Purchase[];
  samples: Sample[];
  sales: { run: number; wall: number; runWall: number; gained: number; levelAfter: number; bought: string[]; dynasty: Record<string, number>; nodeValues: { id: string; cost: number; ratio: number }[] }[];
  milestones: { run: number; key: string; wall: number; runWall: number }[];
  sponsorPayouts: { run: number; at: number; amount: number; seconds: number }[];
  final: { run: number; earnedTotal: number; legacyLevel: number; questsClaimed: number };
}

const dir = process.argv[2] ?? 'output/progression-audit';
const records: Record_[] = readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')) as Record_)
  .sort((a, b) => a.mode.localeCompare(b.mode) || a.seed - b.seed);

const SOURCES: Source[] = ['ops', 'match', 'merch', 'sponsor', 'tournament', 'quest', 'drop', 'event', 'click'];
const t = (sec: number) => {
  if (!Number.isFinite(sec)) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m}m`;
};
const num = (v: number) => {
  if (!Number.isFinite(v)) return '—';
  const a = Math.abs(v);
  if (a < 1000) return v.toFixed(a < 10 ? 2 : 0);
  const units = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
  let i = -1;
  let x = a;
  while (x >= 1000 && i < units.length - 1) {
    x /= 1000;
    i++;
  }
  return `${v < 0 ? '-' : ''}${x.toFixed(2)}${units[i]}`;
};
const pct = (v: number) => `${(v * 100).toFixed(v < 0.1 ? 1 : 0)}%`;
const median = (xs: number[]) => {
  if (xs.length === 0) return NaN;
  const a = [...xs].sort((p, q) => p - q);
  return a[Math.floor(a.length / 2)];
};
const quantile = (xs: number[], q: number) => {
  if (xs.length === 0) return NaN;
  const a = [...xs].sort((p, r) => p - r);
  return a[Math.min(a.length - 1, Math.floor(a.length * q))];
};
const table = (head: string[], rows: (string | number)[][]) =>
  [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n');
const label = (r: Record_) => `${r.mode} ${r.seed}`;

const out: string[] = [];
out.push(`# Progression audit data\n`);
out.push(`${records.length} simulations: ${[...new Set(records.map((r) => r.mode))].join(', ')}; ${records[0]?.hours ?? 0} simulated hours each.\n`);

// 1. Runs and sales ---------------------------------------------------------------------------
out.push('## Runs and sales\n');
out.push(
  table(
    ['sim', 'sales (run length → legacy gained)', 'legacy at end', 'earned all time', 'quests claimed'],
    records.map((r) => [
      label(r),
      r.sales.map((x) => `R${x.run}: ${t(x.runWall)} → +${x.gained}`).join('; ') || 'none',
      `${r.final.legacyLevel}`,
      num(r.final.earnedTotal),
      `${r.final.questsClaimed}`,
    ]),
  ),
);

// 2. Milestones per run ------------------------------------------------------------------------
const KEYS = ['tutorial done', 'first sponsor', 'merch launched', 'earned 1e9', 'earned 1e12', 'first legacy point', 'tier 9', 'tier 15'];
out.push('\n## Milestones (time into each run)\n');
const mRows: (string | number)[][] = [];
for (const r of records) {
  const runs = Math.max(...r.milestones.map((m) => m.run), 1);
  for (let run = 1; run <= runs; run++) {
    mRows.push([`${label(r)} R${run}`, ...KEYS.map((k) => t(r.milestones.find((m) => m.run === run && m.key === k)?.runWall ?? NaN))]);
  }
}
out.push(table(['sim/run', ...KEYS], mRows));

// 3. Speed-up after a sale --------------------------------------------------------------------
out.push('\n## How much faster run 2 reaches run 1 milestones\n');
const speedRows: (string | number)[][] = [];
for (const r of records) {
  const first = new Map(r.milestones.filter((m) => m.run === 1).map((m) => [m.key, m.runWall]));
  const ratios: number[] = [];
  for (const m of r.milestones.filter((x) => x.run === 2)) {
    const a = first.get(m.key);
    if (a && a > 60 && m.runWall > 0) ratios.push(a / Math.max(1, m.runWall));
  }
  if (ratios.length) speedRows.push([label(r), ratios.length, `${median(ratios).toFixed(1)}×`, `${Math.min(...ratios).toFixed(1)}×`, `${Math.max(...ratios).toFixed(1)}×`]);
}
out.push(speedRows.length ? table(['sim', 'milestones compared', 'median speed-up', 'slowest', 'fastest'], speedRows) : 'No sim reached a second run.');

// 4. Income share per run ---------------------------------------------------------------------
out.push('\n## Where each run’s money came from\n');
const shareRows: (string | number)[][] = [];
const peakRows: (string | number)[][] = [];
for (const r of records) {
  const runs = [...new Set(r.samples.map((x) => x.run))];
  for (const run of runs) {
    const ss = r.samples.filter((x) => x.run === run);
    const tot = Object.fromEntries(SOURCES.map((k) => [k, ss.reduce((a, x) => a + (x.booked[k] ?? 0), 0)])) as Record<Source, number>;
    const sum = SOURCES.reduce((a, k) => a + tot[k], 0) || 1;
    shareRows.push([`${label(r)} R${run}`, ...SOURCES.map((k) => pct(tot[k] / sum))]);
    // The single interval where one source took the largest share.
    let best = { share: 0, src: '', at: 0 };
    for (const x of ss) {
      const s2 = SOURCES.reduce((a, k) => a + (x.booked[k] ?? 0), 0);
      if (s2 <= 0) continue;
      for (const k of SOURCES) if ((x.booked[k] ?? 0) / s2 > best.share) best = { share: (x.booked[k] ?? 0) / s2, src: k, at: x.runWall };
    }
    peakRows.push([`${label(r)} R${run}`, best.src, pct(best.share), t(best.at)]);
  }
}
out.push(table(['sim/run', ...SOURCES], shareRows));
out.push('\n### Most one-sided 10 minutes of each run\n');
out.push(table(['sim/run', 'source', 'share', 'at'], peakRows));

// 5. Merch against operations -----------------------------------------------------------------
out.push('\n## Merch income against operations income\n');
out.push(
  table(
    ['sim', 'median merch ÷ ops', 'last run median', 'peak merch ÷ ops', 'at', 'final merch ÷ ops', 'finish levels at end', 'lines'],
    records.map((r) => {
      let peak = { ratio: 0, at: 0, run: 1 };
      for (const x of r.samples) if (x.opsCps > 0 && x.merchCps / x.opsCps > peak.ratio) peak = { ratio: x.merchCps / x.opsCps, at: x.runWall, run: x.run };
      const last = r.samples[r.samples.length - 1];
      const med = (xs: number[]) => (xs.length ? [...xs].sort((p, q) => p - q)[Math.floor(xs.length / 2)] : 0);
      const live = r.samples.filter((x) => x.merchCps > 0 && x.opsCps > 0);
      const lastRun = Math.max(...r.samples.map((x) => x.run));
      const all = med(live.map((x) => x.merchCps / x.opsCps));
      const tail = med(live.filter((x) => x.run === lastRun).map((x) => x.merchCps / x.opsCps));
      return [label(r), `${all.toFixed(2)}×`, `${tail.toFixed(2)}×`, `${peak.ratio.toFixed(1)}×`, `R${peak.run} ${t(peak.at)}`, last && last.opsCps > 0 ? `${(last.merchCps / last.opsCps).toFixed(1)}×` : '—', last?.merchFinish ?? 0, last?.merchLines ?? 0];
    }),
  ),
);

// 6. Growth spikes and stalls -----------------------------------------------------------------
out.push('\n## Income jumps and stalls (income per second, sample to sample)\n');
const jumpRows: (string | number)[][] = [];
for (const r of records) {
  let biggest = { ratio: 0, at: 0, run: 1, from: 0, to: 0 };
  let stall = { len: 0, at: 0, run: 1 };
  for (let i = 1; i < r.samples.length; i++) {
    const a = r.samples[i - 1];
    const b = r.samples[i];
    if (a.run !== b.run || a.totalCps <= 0) continue;
    const ratio = b.totalCps / a.totalCps;
    if (ratio > biggest.ratio) biggest = { ratio, at: b.runWall, run: b.run, from: a.totalCps, to: b.totalCps };
  }
  // Longest stretch where income grew less than 1.5× in total.
  for (let i = 0; i < r.samples.length; i++) {
    for (let j = i + 1; j < r.samples.length; j++) {
      if (r.samples[j].run !== r.samples[i].run) break;
      if (r.samples[j].totalCps > r.samples[i].totalCps * 1.5) break;
      const len = r.samples[j].runWall - r.samples[i].runWall;
      if (len > stall.len) stall = { len, at: r.samples[i].runWall, run: r.samples[i].run };
    }
  }
  jumpRows.push([label(r), `${biggest.ratio.toFixed(1)}×`, `R${biggest.run} ${t(biggest.at)}`, `${num(biggest.from)} → ${num(biggest.to)}/s`, t(stall.len), `R${stall.run} from ${t(stall.at)}`]);
}
out.push(table(['sim', 'biggest 10-min jump', 'at', 'income', 'longest near-flat stretch (<1.5×)', 'where'], jumpRows));

// 7. Purchases --------------------------------------------------------------------------------
out.push('\n## What purchases paid back (seconds of the income they added to repay their cost)\n');
const kinds = ['op', 'upgrade', 'gear', 'staff', 'merch'];
const payRows: (string | number)[][] = [];
for (const mode of [...new Set(records.map((r) => r.mode))]) {
  const ps = records.filter((r) => r.mode === mode).flatMap((r) => r.purchases);
  for (const k of kinds) {
    const pb = ps.filter((p) => p.kind === k && p.gain > 0).map((p) => p.cost / p.gain);
    if (!pb.length) continue;
    const spent = ps.filter((p) => p.kind === k).reduce((a, p) => a + p.cost, 0);
    payRows.push([mode, k, pb.length, t(median(pb)), t(quantile(pb, 0.1)), num(spent)]);
  }
}
out.push(table(['mode', 'kind', 'bought', 'median payback', 'fastest 10%', 'total spent'], payRows));

out.push('\n### Single purchases that multiplied total income the most\n');
const big = records
  .flatMap((r) => r.purchases.map((p) => ({ ...p, sim: label(r) })))
  .filter((p) => p.base > 0)
  .map((p) => ({ ...p, ratio: (p.base + p.gain) / p.base }))
  .sort((a, b) => b.ratio - a.ratio);
const seenIds = new Set<string>();
const bigRows: (string | number)[][] = [];
for (const p of big) {
  const key = `${p.kind}:${p.id}`;
  if (seenIds.has(key)) continue;
  seenIds.add(key);
  bigRows.push([`${p.kind}:${p.id}`, `${p.ratio.toFixed(2)}×`, num(p.cost), `${p.sim} R${p.run} ${t(p.at)}`]);
  if (bigRows.length >= 20) break;
}
out.push(table(['purchase', 'income multiplier', 'cost', 'where'], bigRows));

// 8. Legacy -----------------------------------------------------------------------------------
out.push('\n## Legacy nodes: income multiplier on the spot, per Legacy point\n');
const nodeAgg = new Map<string, { cost: number; ratios: number[] }>();
for (const r of records) for (const sale of r.sales) for (const nv of sale.nodeValues) {
  const e = nodeAgg.get(nv.id) ?? { cost: nv.cost, ratios: [] };
  e.ratios.push(nv.ratio);
  nodeAgg.set(nv.id, e);
}
const nodeRows = [...nodeAgg.entries()]
  .map(([id, e]) => {
    const ratio = median(e.ratios);
    return { id, cost: e.cost, ratio, perPoint: (ratio - 1) / Math.max(1, e.cost) };
  })
  .sort((a, b) => b.perPoint - a.perPoint);
out.push(table(['node', 'cost (points)', 'income ×', 'gain per point'], nodeRows.map((n) => [n.id, n.cost, `${n.ratio.toFixed(3)}×`, pct(n.perPoint)])));

out.push('\n### Legacy bought at each sale\n');
out.push(table(['sim', 'sale', 'bought'], records.flatMap((r) => r.sales.map((x) => [label(r), `R${x.run} (+${x.gained})`, x.bought.join(', ') || 'Dynasty only']))));

// 9. Quests -----------------------------------------------------------------------------------
out.push('\n## Quests that held the line up longest\n');
const questRows: (string | number)[][] = [];
for (const r of records) {
  let worst = { quest: '', len: 0, run: 1, at: 0 };
  let cur = { quest: '', since: 0, run: 0 };
  for (const x of r.samples) {
    if (x.quest !== cur.quest || x.run !== cur.run) cur = { quest: x.quest ?? '', since: x.runWall, run: x.run };
    const len = x.runWall - cur.since;
    if (x.quest && len > worst.len) worst = { quest: x.quest, len, run: x.run, at: cur.since };
  }
  questRows.push([label(r), worst.quest || '—', t(worst.len), `R${worst.run} from ${t(worst.at)}`, r.final.questsClaimed]);
}
out.push(table(['sim', 'stuck quest', 'stuck for', 'where', 'claimed in total'], questRows));

// 10. Sponsors and Invitationals -------------------------------------------------------------
out.push('\n## Sponsor goal windfalls and Invitationals\n');
out.push(
  table(
    ['sim', 'goal payouts', 'largest (seconds of income)', 'Invitationals won/played'],
    records.map((r) => {
      const max = r.sponsorPayouts.reduce((a, p) => Math.max(a, p.seconds), 0);
      const last = r.samples[r.samples.length - 1];
      return [label(r), r.sponsorPayouts.length, t(max), last ? `${last.invitationals[0]}/${last.invitationals[1]}` : '—'];
    }),
  ),
);

console.log(out.join('\n'));
