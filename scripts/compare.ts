/**
 * Compares two balance sim runs written with --json. Prints what changed in the income mix, the
 * pacing and the sponsor payouts, so a balance change can be judged rather than guessed at.
 *
 *   npx tsx scripts/compare.ts before.json after.json
 */
import { readFileSync } from 'node:fs';
import { fmt, fmtTime } from '../src/engine/format';
import { INCOME_SOURCES, type IncomeSource } from '../src/engine/types';

declare const process: { argv: string[] };

interface Sample {
  at: number;
  ledger: Record<IncomeSource, number>;
  cps: number;
  fans: number;
  tier: number;
  sponsors: number;
  gear: number;
  staff: number;
  players: number;
  ops: number;
  merchLines: number;
}

interface Payout {
  at: number;
  brand: string;
  tier: number;
  reward: number;
  heldSeconds: number;
  cpsAt: number;
  earnedDuring: number;
}

interface Run {
  mode: string;
  hours: number;
  milestones: { key: string; wall: number }[];
  incomeLog: Sample[];
  sponsorPayouts: Payout[];
  totals: Record<IncomeSource, number>;
  earned: number;
  fans: number;
  tier: number;
}

const [beforePath, afterPath] = process.argv.slice(2);
const before: Run = JSON.parse(readFileSync(beforePath, 'utf8'));
const after: Run = JSON.parse(readFileSync(afterPath, 'utf8'));

const row = (cells: string[]) => `| ${cells.join(' | ')} |`;
const table = (header: string[], rows: string[][]) => [row(header), row(header.map(() => '---')), ...rows.map(row)].join('\n');
const share = (part: number, whole: number) => (whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : '-');
const times = (a: number, b: number) => (b > 0 ? `×${(a / b).toFixed(2)}` : '-');

console.log(`\n${before.mode} · ${before.hours}h · before vs after\n`);

console.log('Income by source:');
console.log(
  table(
    ['source', 'before', 'share', 'after', 'share', 'change'],
    INCOME_SOURCES.filter((k) => before.totals[k] > 0 || after.totals[k] > 0)
      .sort((a, b) => after.totals[b] - after.totals[a])
      .map((k) => [k, fmt(before.totals[k]), share(before.totals[k], before.earned), fmt(after.totals[k]), share(after.totals[k], after.earned), times(after.totals[k], before.totals[k])]),
  ),
);
console.log(`\nEarned: ${fmt(before.earned)} -> ${fmt(after.earned)} (${times(after.earned, before.earned)}), fans ${fmt(before.fans)} -> ${fmt(after.fans)}, best tier ${before.tier} -> ${after.tier}.`);

const sponsorLine = (r: Run) => {
  const p = r.sponsorPayouts;
  if (p.length === 0) return 'no goals paid';
  const shareOfEarned = p.reduce((n, x) => n + (x.earnedDuring > 0 ? x.reward / x.earnedDuring : 0), 0) / p.length;
  const quick = p.filter((x) => x.heldSeconds < 60).length;
  return `${p.length} goals, ${fmt(r.totals.sponsor)} paid (${share(r.totals.sponsor, r.earned)} of the run); a goal pays ${(shareOfEarned * 100).toFixed(1)}% of what the org earned while it ran; ${quick} finished inside a minute`;
};
console.log(`\nSponsors before: ${sponsorLine(before)}`);
console.log(`Sponsors after:  ${sponsorLine(after)}`);

const keyMilestones = ['tutorial done', 'tab: market', 'first sponsor', 'merch launched', 'first legacy point', 'earned 1e6', 'earned 1e9', 'earned 1e12', 'earned 1e15'];
const when = (r: Run, key: string) => r.milestones.find((m) => m.key === key);
console.log('\nPacing:');
console.log(
  table(
    ['milestone', 'before', 'after', 'change'],
    keyMilestones.map((key) => {
      const b = when(before, key);
      const a = when(after, key);
      return [
        key,
        b ? fmtTime(b.wall) : 'never',
        a ? fmtTime(a.wall) : 'never',
        b && a ? (a.wall === b.wall ? 'same' : `${a.wall > b.wall ? '+' : '-'}${fmtTime(Math.abs(a.wall - b.wall))}`) : '-',
      ];
    }),
  ),
);

/** Income mix at a few points in the run, as a share of that interval. */
function mixAt(r: Run, at: number): string {
  const i = r.incomeLog.findIndex((x) => x.at >= at);
  if (i <= 0) return '-';
  const prev = r.incomeLog[i - 1].ledger;
  const now = r.incomeLog[i].ledger;
  const delta = Object.fromEntries(INCOME_SOURCES.map((k) => [k, now[k] - prev[k]])) as Record<IncomeSource, number>;
  const total = INCOME_SOURCES.reduce((n, k) => n + delta[k], 0);
  return INCOME_SOURCES.filter((k) => delta[k] / total >= 0.05)
    .sort((a, b) => delta[b] - delta[a])
    .map((k) => `${k} ${share(delta[k], total)}`)
    .join(', ');
}
console.log('\nMix at each half hour:');
console.log(
  table(
    ['at', 'before', 'after'],
    [1800, 3600, 7200, 10_800, 14_400, 18_000].map((at) => [fmtTime(at), mixAt(before, at), mixAt(after, at)]),
  ),
);
