/**
 * Plays the real engine second by second as a simulated player and writes the record as JSON: a way to
 * watch what a playstyle does, with nothing to pass or fail. (The old balance targets and the matrix
 * report that checked them are gone; see docs/archive/README.md.) Look at one persona and seed:
 *
 *   npx tsx scripts/sim/cli.ts --persona=active --seed=1 --hours=4 --json=output/sim/active-1.json
 *
 * Flags: --persona --seed --hours --runs --variant --interval --from=<save file> --sellnow
 * --maxrun --snapshots=1800,3600 --snapfirst=<seconds after first legacy point> --charter --mandate
 * --quests=cash|perk|off --slow (measure purchases without the modifier reuse, for checking it)
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { measureSettings } from './buyers';
import { runSim } from './run-sim';
import type { Variant } from './types';

declare const process: { argv: string[] };

const args = Object.fromEntries(
  process.argv.slice(2).map((a: string) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? 'true'];
  }),
);

if (args.slow === 'true') measureSettings.reuseMods = false;

const persona = String(args.persona ?? 'active');
const seed = Number(args.seed ?? 1);
const out = String(args.json ?? `output/sim/${persona}-${seed}.json`);
const record = runSim({
  persona,
  seed,
  hours: Number(args.hours ?? 4),
  runs: args.runs ? Number(args.runs) : undefined,
  variant: (args.variant as Variant | undefined) ?? 'baseline',
  sampleEvery: args.interval ? Number(args.interval) : undefined,
  from: args.from ? readFileSync(String(args.from), 'utf8') : undefined,
  sellNow: args.sellnow === 'true',
  maxRunSeconds: args.maxrun ? Number(args.maxrun) : undefined,
  snapshotsAt: args.snapshots ? String(args.snapshots).split(',').map(Number) : undefined,
  snapshotAfterFirstLegacy: args.snapfirst ? Number(args.snapfirst) : undefined,
  charter: args.charter ? String(args.charter) : undefined,
  mandate: args.mandate === undefined ? undefined : args.mandate === 'none' ? null : String(args.mandate),
  quests: (args.quests as 'cash' | 'perk' | 'off' | undefined) ?? 'cash',
});
if (args.git) record.git = String(args.git);

mkdirSync(out.replace(/[\\/][^\\/]+$/, ''), { recursive: true });
writeFileSync(out, JSON.stringify(record));
const first = record.milestones.find((m) => m.key === 'first legacy point' && m.run === 1);
console.log(
  `${persona}${record.variant === 'baseline' ? '' : `/${record.variant}`} seed ${seed}: ${record.hours}h, first legacy ${first ? `${(first.wall / 3600).toFixed(2)}h` : 'never'}, ${record.purchases.length} purchases in ${record.ranSeconds.toFixed(0)}s -> ${out}`,
);
