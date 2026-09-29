/**
 * Turns a folder of simulation records (matrix.ts writes them) into report.md and report.html:
 * the balance targets with pass or fail, milestone timings across seeds, where the money came from
 * over time, purchase paybacks and the outliers worth a look.
 *
 *   npx tsx scripts/sim/report.ts output/sim/full
 *   npx tsx scripts/sim/report.ts output/sim/after --compare=output/sim/before
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { INCOME_SOURCES, type IncomeSource } from '../../src/engine/types';
import {
  ACTIVE_SHARE_BANDS,
  ACTIVE_VS_IDLE_SPEEDUP,
  CROWDS_PER_ACTIVE_HOUR,
  FIRST_LEGACY_ACTIVE,
  MAX_SOURCE_SHARE,
  SELL_OVER_STAY,
  WINDOW_GRACE_SECONDS,
} from './targets';
import type { Sample, SimRecord } from './types';

declare const process: { argv: string[] };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const HOUR = 3600;
/** Crowds are counted from here: the first minutes are steady clicking with nothing else to do. */
const CROWD_FROM = 600;
const median = (xs: number[]): number => {
  if (xs.length === 0) return NaN;
  const v = [...xs].sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};
const mean = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const pct = (x: number): string => (Number.isFinite(x) ? `${(x * 100).toFixed(1)}%` : '-');
const sci = (x: number): string => (!Number.isFinite(x) ? '-' : Math.abs(x) < 1e4 ? x.toFixed(x < 10 ? 2 : 0) : x.toExponential(2).replace('e+', 'e'));
export const hms = (sec: number): string => {
  if (!Number.isFinite(sec)) return 'never';
  const minutes = Math.round(sec / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m}m`;
};
const table = (head: string[], rows: (string | number)[][]): string =>
  [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n');

/** The report's source groups: the eight biggest ledger sources, with the two smallest folded together. */
export const GROUPS: { id: string; label: string; sources: IncomeSource[] }[] = [
  { id: 'ops', label: 'Operations', sources: ['ops'] },
  { id: 'match', label: 'Matches', sources: ['match'] },
  { id: 'merch', label: 'Merch', sources: ['merch'] },
  { id: 'click', label: 'Clicks', sources: ['click'] },
  { id: 'drop', label: 'Hype Drops', sources: ['drop'] },
  { id: 'sponsor', label: 'Sponsor goals', sources: ['sponsor'] },
  { id: 'quest', label: 'Quests', sources: ['quest'] },
  { id: 'other', label: 'Invitationals & events', sources: ['tournament', 'event'] },
];
const groupOf = (booked: Record<IncomeSource, number>, g: (typeof GROUPS)[number]) => g.sources.reduce((a, k) => a + (booked[k] ?? 0), 0);

export function loadRecords(dir: string): SimRecord[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')) as SimRecord)
    // The folder also holds summary.json and paybacks.json; records are the files with a persona.
    .filter((r) => typeof r === 'object' && !Array.isArray(r) && typeof r.persona === 'string')
    .sort((a, b) => a.persona.localeCompare(b.persona) || a.variant.localeCompare(b.variant) || a.seed - b.seed);
}

/** First playthroughs from a new game: everything but the restart check. */
const fresh = (rs: SimRecord[], persona: string) => rs.filter((r) => r.persona === persona && r.variant === 'baseline' && !r.fromSave);

function milestone(r: SimRecord, key: string, run = 1): { wall: number; played: number } | null {
  const m = r.milestones.find((x) => x.key === key && x.run === run);
  return m ? { wall: m.wall, played: m.played } : null;
}
const firstLegacy = (r: SimRecord) => milestone(r, 'first legacy point')?.wall ?? Infinity;

/** Income by group over run 1, optionally only up to `until` seconds. */
function shares(r: SimRecord, until = Infinity): Record<string, number> & { total: number } {
  const sums: Record<string, number> = Object.fromEntries(GROUPS.map((g) => [g.id, 0]));
  for (const smp of r.samples) {
    if (smp.run !== 1 || smp.runWall > until + 1e-9) continue;
    for (const g of GROUPS) sums[g.id] += groupOf(smp.booked, g);
  }
  const total = Object.values(sums).reduce((a, b) => a + b, 0);
  return Object.assign(Object.fromEntries(GROUPS.map((g) => [g.id, total > 0 ? sums[g.id] / total : 0])), { total });
}

function windowShare(smp: Sample): { top: string; share: number; total: number } {
  let total = 0;
  let top = '';
  let best = -1;
  for (const g of GROUPS) {
    const v = groupOf(smp.booked, g);
    total += v;
    if (v > best) {
      best = v;
      top = g.label;
    }
  }
  return { top, share: total > 0 ? best / total : 0, total };
}

// ---------------------------------------------------------------------------
// Targets
// ---------------------------------------------------------------------------
interface TargetRow {
  target: string;
  result: string;
  pass: boolean | null;
}

function checkTargets(rs: SimRecord[]): TargetRow[] {
  const rows: TargetRow[] = [];
  const active = fresh(rs, 'active');
  const idle = fresh(rs, 'idle');

  if (active.length) {
    const times = active.map(firstLegacy);
    const med = median(times);
    rows.push({
      target: `Active player's first Legacy point between ${hms(FIRST_LEGACY_ACTIVE[0])} and ${hms(FIRST_LEGACY_ACTIVE[1])}`,
      result: `median ${hms(med)} (seeds: ${times.map(hms).join(', ')})`,
      pass: med >= FIRST_LEGACY_ACTIVE[0] && med <= FIRST_LEGACY_ACTIVE[1],
    });
    const perHour = active.map((r) => {
      const until = Math.min(firstLegacy(r), r.hours * HOUR);
      // After the opening, where a new org clicks steadily because there is nothing else to do.
      const crowds = r.samples.filter((x) => x.run === 1 && x.runWall > CROWD_FROM && x.runWall <= until + 1e-9).reduce((a, x) => a + x.crowds, 0);
      return crowds / ((until - CROWD_FROM) / HOUR);
    });
    const m = median(perHour);
    rows.push({
      target: `Active player gets a Crowd Goes Wild ${CROWDS_PER_ACTIVE_HOUR[0]}-${CROWDS_PER_ACTIVE_HOUR[1]} times an hour after the first 10 min (about every 10 min)`,
      result: `median ${m.toFixed(1)}/h`,
      pass: m >= CROWDS_PER_ACTIVE_HOUR[0] && m <= CROWDS_PER_ACTIVE_HOUR[1],
    });
    for (const [id, band] of Object.entries(ACTIVE_SHARE_BANDS)) {
      const v = median(active.map((r) => shares(r, firstLegacy(r))[id]));
      rows.push({
        target: `${id === 'merch' ? 'Merch' : 'Matches'} earn ${pct(band[0])}-${pct(band[1])} of an active run (to first Legacy)`,
        result: `median ${pct(v)}`,
        pass: v >= band[0] && v <= band[1],
      });
    }
  }
  if (active.length && idle.length) {
    const ratio = median(idle.map(firstLegacy)) / median(active.map(firstLegacy));
    rows.push({
      target: `Active play reaches the first Legacy point ${ACTIVE_VS_IDLE_SPEEDUP}x sooner than idling`,
      result: Number.isFinite(ratio) ? `${ratio.toFixed(2)}x (idle ${hms(median(idle.map(firstLegacy)))})` : `idle never got there in ${idle[0].hours}h`,
      pass: !Number.isFinite(ratio) || ratio >= ACTIVE_VS_IDLE_SPEEDUP,
    });
  }

  const baseline = rs.filter((r) => r.variant === 'baseline' && !r.persona.startsWith('audit'));
  let worstRun = { share: 0, what: '' };
  let windowsOver = 0;
  let windows = 0;
  const overBy = new Map<string, number>();
  for (const r of baseline) {
    const sh = shares(r);
    for (const g of GROUPS) if (sh[g.id] > worstRun.share) worstRun = { share: sh[g.id], what: `${g.label}, ${r.persona} seed ${r.seed}` };
    for (const smp of r.samples) {
      if (smp.run !== 1 || smp.runWall < WINDOW_GRACE_SECONDS) continue;
      const w = windowShare(smp);
      if (w.total <= 0) continue;
      windows++;
      if (w.share > MAX_SOURCE_SHARE) {
        windowsOver++;
        const k = `${w.top} (${r.persona})`;
        overBy.set(k, (overBy.get(k) ?? 0) + 1);
      }
    }
  }
  rows.push({ target: `No source earns over ${pct(MAX_SOURCE_SHARE)} of any run`, result: `largest: ${pct(worstRun.share)} (${worstRun.what})`, pass: worstRun.share <= MAX_SOURCE_SHARE });
  rows.push({
    target: `No 10-minute window after ${hms(WINDOW_GRACE_SECONDS)} is over ${pct(MAX_SOURCE_SHARE)} one source`,
    result: `${windowsOver} of ${windows} windows (${pct(windowsOver / Math.max(1, windows))})${overBy.size ? `: ${[...overBy].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, n]) => `${k} ${n}`).join(', ')}` : ''}`,
    pass: windowsOver === 0,
  });

  const stay = rs.filter((r) => r.persona === 'active' && isRestart(r, 'stay'));
  const sell = rs.filter((r) => r.persona === 'active' && isRestart(r, 'sell'));
  if (stay.length && sell.length) {
    const legacy = (r: SimRecord) => r.final.legacyLevel + r.final.pending;
    const ratios = sell.map((x) => {
      const y = stay.find((z) => z.seed === x.seed);
      return y ? legacy(x) / Math.max(1, legacy(y)) : NaN;
    });
    const m = median(ratios.filter(Number.isFinite));
    rows.push({
      target: `Selling an hour after the first Legacy point ends 3 h later with ${SELL_OVER_STAY}x the Legacy of staying`,
      result: `median ${m.toFixed(2)}x (${ratios.map((x) => x.toFixed(2)).join(', ')})`,
      pass: m >= SELL_OVER_STAY,
    });
  }
  return rows;
}

/** The restart check's records are named by matrix.ts; their first sample already has Legacy behind it. */
function isRestart(r: SimRecord, kind: 'stay' | 'sell'): boolean {
  if (!r.fromSave) return false;
  return kind === 'sell' ? r.sales.length > 0 : r.sales.length === 0;
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const MILESTONES = ['tutorial done', 'first sponsor', 'merch launched', 'earned 1e9', 'earned 1e12', 'first legacy point', 'earned 1e15'];

export interface ReportMeta {
  preset?: string;
  git?: string;
  wallSeconds?: number;
  workers?: number;
}

export function buildMarkdown(rs: SimRecord[], meta: ReportMeta, compare?: SimRecord[]): string {
  const L: string[] = [];
  const personas = [...new Set(rs.filter((r) => r.variant === 'baseline' && !r.fromSave).map((r) => r.persona))];
  const pool = (p: string) => fresh(rs, p);
  L.push(`# Balance simulation report`);
  L.push('');
  L.push(`Preset \`${meta.preset ?? '?'}\`, engine \`${meta.git ?? rs[0]?.git ?? '?'}\`, ${rs.length} simulations${meta.wallSeconds ? ` in ${hms(meta.wallSeconds)} on ${meta.workers} workers` : ''}. Personas are described in \`scripts/sim/personas.ts\`, targets in \`scripts/sim/targets.ts\`.`);
  L.push('');
  L.push('## Targets');
  L.push('');
  L.push(table(['', 'target', 'result'], checkTargets(rs).map((t) => [t.pass === null ? '·' : t.pass ? 'PASS' : 'FAIL', t.target, t.result])));
  L.push('');

  L.push('## Milestones (run 1, median across seeds, min-max in brackets)');
  L.push('');
  L.push(
    table(
      ['persona', 'seeds', ...MILESTONES],
      personas.map((p) => {
        const recs = pool(p);
        return [
          p,
          recs.length,
          ...MILESTONES.map((k) => {
            const w = recs.map((r) => milestone(r, k)?.wall ?? Infinity);
            const played = recs.map((r) => milestone(r, k)?.played ?? Infinity);
            const hit = w.filter(Number.isFinite);
            if (hit.length === 0) return 'never';
            const range = hit.length > 1 ? ` (${hms(Math.min(...hit))}-${hms(Math.max(...hit))})` : '';
            const openNote = p === 'casual' ? `, ${hms(median(played))} open` : '';
            return `${hms(median(w))}${range}${openNote}${hit.length < w.length ? `, ${w.length - hit.length} never` : ''}`;
          }),
        ];
      }),
    ),
  );
  L.push('');
  if (compare) {
    L.push('### Compared with the earlier matrix');
    L.push('');
    L.push(
      table(
        ['persona', 'first Legacy before', 'after', 'change'],
        personas.map((p) => {
          const a = median(fresh(compare, p).map(firstLegacy));
          const b = median(pool(p).map(firstLegacy));
          return [p, hms(a), hms(b), Number.isFinite(a) && Number.isFinite(b) ? `${((b / a - 1) * 100).toFixed(0)}%` : '-'];
        }),
      ),
    );
    L.push('');
  }

  L.push('## Where the money came from');
  L.push('');
  L.push('Share of run 1 income by source, mean across seeds. "To 1st Legacy" stops the books at the first Legacy point.');
  L.push('');
  const shareRows: (string | number)[][] = [];
  for (const p of personas) {
    for (const [label, until] of [
      ['whole run', (_r: SimRecord) => Infinity],
      ['to 1st Legacy', firstLegacy],
    ] as const) {
      const recs = pool(p);
      shareRows.push([p, label, ...GROUPS.map((g) => pct(mean(recs.map((r) => shares(r, until(r))[g.id]))))]);
    }
  }
  L.push(table(['persona', 'span', ...GROUPS.map((g) => g.label)], shareRows));
  L.push('');

  for (const p of personas) {
    const recs = pool(p);
    const r0 = recs[0];
    if (!r0) continue;
    L.push(`### ${p}: every 10 minutes (mean share across ${recs.length} seeds)`);
    L.push('');
    L.push('Buff columns are the share of that window\'s income that temporary buffs added (estimated). Multipliers are on all income, seed 1.');
    L.push('');
    const rows: (string | number)[][] = [];
    const n = Math.max(...recs.map((r) => r.samples.filter((x) => x.run === 1).length));
    for (let i = 0; i < n; i++) {
      const at = recs.map((r) => r.samples.filter((x) => x.run === 1)[i]).filter((x): x is Sample => !!x);
      const withIncome = at.filter((x) => windowShare(x).total > 0);
      const s0 = r0.samples.filter((x) => x.run === 1)[i];
      // Hours with the game closed (casual) book nothing; the lump lands in the window it reopens.
      if (!s0 || withIncome.length === 0) continue;
      const share = (g: (typeof GROUPS)[number]) => pct(mean(withIncome.map((x) => groupOf(x.booked, g) / windowShare(x).total)));
      const up = (k: 'crowd' | 'frenzy') => pct(mean(withIncome.map((x) => x.uplift[k] / windowShare(x).total)));
      rows.push([
        hms(s0.runWall),
        s0.attention === 'active' ? '' : s0.attention,
        sci(median(at.map((x) => windowShare(x).total / 600))),
        ...GROUPS.map(share),
        up('crowd'),
        up('frenzy'),
        `${sci(s0.mults.sponsor)} / ${sci(s0.mults.fame)} / ${sci(s0.mults.superfan)}`,
        s0.crowds,
        `${s0.drops.caught}/${s0.drops.seen}`,
      ]);
    }
    L.push(table(['time', 'state', 'income/s', ...GROUPS.map((g) => g.label), 'crowd buff', 'frenzy buff', 'sponsor/fame/superfan x', 'crowds', 'drops'], rows));
    L.push('');
  }

  L.push('## Purchases (active persona, run 1)');
  L.push('');
  const activeRecs = pool('active');
  if (activeRecs.length) {
    const buys = activeRecs.flatMap((r) => r.purchases.filter((x) => x.run === 1).map((x) => ({ ...x, seed: r.seed })));
    // Operation levels and trophy upgrades cost trophies, so a payback in seconds of cash means nothing.
    const kinds = [...new Set(buys.map((b) => b.kind))].filter((k) => k !== 'level' && k !== 'trophy-upgrade');
    const bands = [0, 1, 2, 3, 4, 6].map((h) => h * HOUR);
    L.push('Median payback (cost divided by the income it added, in seconds of that income) by kind and hour of the run. Items that add no income are left out.');
    L.push('');
    L.push(
      table(
        ['kind', 'bought', ...bands.slice(0, -1).map((b, i) => `${b / HOUR}-${bands[i + 1] / HOUR}h`)],
        kinds.map((k) => {
          const of = buys.filter((b) => b.kind === k);
          return [
            k,
            of.length,
            ...bands.slice(0, -1).map((b, i) => {
              const xs = of.filter((x) => x.at >= b && x.at < bands[i + 1] && x.gain > x.base * 0.001).map((x) => x.cost / x.gain);
              return xs.length ? `${sci(median(xs))}s (${xs.length})` : '-';
            }),
          ];
        }),
      ),
    );
    L.push('');
    const jumps = [...buys].filter((b) => b.base > 0).sort((a, b) => b.gain / b.base - a.gain / a.base).slice(0, 12);
    L.push('Biggest single income jumps (the purchase alone added this share of income):');
    L.push('');
    L.push(table(['seed', 'at', 'kind', 'id', 'income +', 'payback'], jumps.map((b) => [b.seed, hms(b.at), b.kind, b.id, pct(b.gain / b.base), `${sci(b.cost / b.gain)}s`])));
    L.push('');
    const fast = [...buys].filter((b) => b.gain > b.base * 0.01 && b.cost > b.base * 60).sort((a, b) => a.cost / a.gain - b.cost / b.gain).slice(0, 12);
    L.push('Fastest paybacks among purchases that cost at least a minute of income and add at least 1%:');
    L.push('');
    L.push(table(['seed', 'at', 'kind', 'id', 'cost (s of income)', 'payback'], fast.map((b) => [b.seed, hms(b.at), b.kind, b.id, sci(b.cost / b.base), `${sci(b.cost / b.gain)}s`])));
    L.push('');
  }

  const variants = rs.filter((r) => r.variant !== 'baseline');
  if (variants.length) {
    const base = pool('active').find((r) => r.seed === variants[0].seed);
    L.push('## What each system is worth (active persona, one seed, one system switched off)');
    L.push('');
    L.push(
      table(
        ['variant', 'first Legacy', 'earned by 3h', ...GROUPS.map((g) => g.label)],
        [base, ...variants]
          .filter((r): r is SimRecord => !!r)
          .map((r) => {
            const at3 = r.samples.filter((x) => x.run === 1 && x.runWall <= 3 * HOUR).pop()?.earnedRun ?? NaN;
            const sh = shares(r);
            return [r.variant, hms(firstLegacy(r)), sci(at3), ...GROUPS.map((g) => pct(sh[g.id]))];
          }),
      ),
    );
    L.push('');
  }

  L.push('## Sponsor goal payouts (run 1)');
  L.push('');
  L.push(
    table(
      ['persona', 'goals paid', 'median payout (s of income)', 'largest'],
      personas.map((p) => {
        const pays = pool(p).flatMap((r) => r.sponsorPayouts.filter((x) => x.run === 1));
        return [p, pays.length, sci(median(pays.map((x) => x.seconds))), sci(Math.max(0, ...pays.map((x) => x.seconds)))];
      }),
    ),
  );
  L.push('');
  return L.join('\n');
}

// ---------------------------------------------------------------------------
// HTML: share of income over time, per persona
// ---------------------------------------------------------------------------
const COLORS_LIGHT = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];
const COLORS_DARK = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'];

function shareChart(p: string, recs: SimRecord[]): string {
  const W = 760;
  const H = 220;
  const pad = { l: 44, r: 12, t: 12, b: 28 };
  const n = Math.max(0, ...recs.map((r) => r.samples.filter((x) => x.run === 1).length));
  if (n === 0) return '';
  const cols: { t: number; shares: number[]; total: number; firstLegacy: boolean }[] = [];
  for (let i = 0; i < n; i++) {
    const at = recs.map((r) => r.samples.filter((x) => x.run === 1)[i]).filter((x): x is Sample => !!x && windowShare(x).total > 0);
    const t = recs[0].samples.filter((x) => x.run === 1)[i]?.runWall ?? (i + 1) * 600;
    const sh = GROUPS.map((g) => mean(at.map((x) => groupOf(x.booked, g) / windowShare(x).total)) || 0);
    cols.push({ t, shares: sh, total: median(at.map((x) => windowShare(x).total / 600)), firstLegacy: false });
  }
  const fl = median(recs.map(firstLegacy));
  const x = (t: number) => pad.l + ((W - pad.l - pad.r) * t) / cols[cols.length - 1].t;
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v);
  const paths: string[] = [];
  const cum = cols.map(() => 0);
  GROUPS.forEach((g, gi) => {
    const top: string[] = [];
    const bottom: string[] = [];
    cols.forEach((c, i) => {
      bottom.push(`${x(c.t).toFixed(1)},${y(cum[i]).toFixed(1)}`);
      cum[i] += c.shares[gi];
      top.push(`${x(c.t).toFixed(1)},${y(cum[i]).toFixed(1)}`);
    });
    paths.push(`<polygon class="s${gi}" points="${[...top, ...bottom.reverse()].join(' ')}"><title>${g.label}</title></polygon>`);
  });
  const hover = cols
    .map((c, i) => {
      const x0 = i === 0 ? pad.l : (x(cols[i - 1].t) + x(c.t)) / 2;
      const x1 = i === cols.length - 1 ? W - pad.r : (x(c.t) + x(cols[i + 1].t)) / 2;
      const lines = GROUPS.map((g, gi) => `${g.label}: ${pct(c.shares[gi])}`).join('&#10;');
      return `<rect class="hit" x="${x0.toFixed(1)}" y="${pad.t}" width="${(x1 - x0).toFixed(1)}" height="${H - pad.t - pad.b}"><title>${hms(c.t)}, income ${sci(c.total)}/s&#10;${lines}</title></rect>`;
    })
    .join('');
  const ticks = [];
  for (let h = 0; h <= cols[cols.length - 1].t / HOUR; h += cols[cols.length - 1].t > 12 * HOUR ? 6 : 1) ticks.push(`<text class="tick" x="${x(h * HOUR).toFixed(1)}" y="${H - 8}" text-anchor="middle">${h}h</text>`);
  const yTicks = [0, 0.5, 1].map((v) => `<text class="tick" x="${pad.l - 6}" y="${y(v) + 4}" text-anchor="end">${v * 100}%</text><line class="grid" x1="${pad.l}" x2="${W - pad.r}" y1="${y(v)}" y2="${y(v)}"/>`);
  const legacyMark = Number.isFinite(fl) ? `<line class="mark" x1="${x(fl)}" x2="${x(fl)}" y1="${pad.t}" y2="${H - pad.b}"/><text class="tick" x="${x(fl) + 4}" y="${pad.t + 12}">1st Legacy ${hms(fl)}</text>` : '';
  return `<figure><figcaption><strong>${p}</strong>: share of income by source, every 10 minutes (mean of ${recs.length} seeds). Hover a column for the numbers.</figcaption><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${p} income share over time">${yTicks.join('')}${paths.join('')}${ticks.join('')}${legacyMark}${hover}</svg></figure>`;
}

function buildHtml(rs: SimRecord[], md: string): string {
  const personas = [...new Set(rs.filter((r) => r.variant === 'baseline').map((r) => r.persona))];
  const charts = personas.map((p) => shareChart(p, fresh(rs, p))).join('\n');
  const legend = GROUPS.map((g, i) => `<span><i class="s${i}"></i>${g.label}</span>`).join('');
  const series = (colors: string[]) => colors.map((c, i) => `--s${i}:${c};`).join('');
  const escaped = md.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Balance Simulation</title>
<style>
:root{color-scheme:light;--bg:#fcfcfb;--ink:#0b0b0b;--muted:#52514e;--grid:#e4e3df;${series(COLORS_LIGHT)}}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){color-scheme:dark;--bg:#1a1a19;--ink:#fff;--muted:#c3c2b7;--grid:#34332f;${series(COLORS_DARK)}}}
:root[data-theme="dark"]{color-scheme:dark;--bg:#1a1a19;--ink:#fff;--muted:#c3c2b7;--grid:#34332f;${series(COLORS_DARK)}}
body{background:var(--bg);color:var(--ink);font:14px/1.5 system-ui,sans-serif;margin:0 auto;max-width:820px;padding:16px}
figure{margin:24px 0}figcaption{color:var(--muted);margin-bottom:6px}svg{width:100%;height:auto;display:block}
${GROUPS.map((_, i) => `.s${i}{fill:var(--s${i});stroke:var(--bg);stroke-width:1}`).join('')}
.grid{stroke:var(--grid);stroke-width:1}.tick{fill:var(--muted);font-size:11px}.mark{stroke:var(--ink);stroke-dasharray:4 3}
.hit{fill:transparent}.hit:hover{fill:var(--ink);fill-opacity:.06}
.legend{display:flex;flex-wrap:wrap;gap:12px;color:var(--muted)}.legend i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:4px}
${GROUPS.map((_, i) => `.legend i.s${i}{background:var(--s${i})}`).join('')}
pre{white-space:pre-wrap;overflow-x:auto;font-size:12px;border-top:1px solid var(--grid);padding-top:16px}
</style></head><body><h1>Balance simulation</h1><div class="legend">${legend}</div>${charts}<pre>${escaped}</pre></body></html>`;
}

export function writeReport(dir: string, meta: ReportMeta = {}, compareDir?: string): { md: string; html: string } {
  const rs = loadRecords(dir);
  const md = buildMarkdown(rs, meta, compareDir ? loadRecords(compareDir) : undefined);
  const paths = { md: `${dir}/report.md`, html: `${dir}/report.html` };
  writeFileSync(paths.md, md);
  writeFileSync(paths.html, buildHtml(rs, md));
  // Strip saves out of a small summary for tools that only need the numbers.
  writeFileSync(`${dir}/summary.json`, JSON.stringify({ meta, targets: checkTargets(rs) }));
  return paths;
}

const isMain = process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/sim/report.ts');
if (isMain) {
  const dir = process.argv[2];
  const compare = process.argv.find((a) => a.startsWith('--compare='))?.split('=')[1];
  if (!dir) throw new Error('usage: report.ts <dir> [--compare=<dir>]');
  const out = writeReport(dir, {}, compare);
  console.log(`wrote ${out.md} and ${out.html}`);
}
