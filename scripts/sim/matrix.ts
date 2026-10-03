/**
 * Runs a matrix of simulations in parallel, one child process per (persona, seed, variant), then
 * writes the report. This is `npm run sim`.
 *
 *   npm run sim:quick                 active, semi and idle, two seeds, 3 hours: a couple of minutes
 *   npm run sim                       the full balance matrix (see PRESETS)
 *   npm run sim -- --preset=full --jobs=8 --out=output/sim/before
 *   npm run sim -- --preset=tune               active x3 seeds and the restart check, for balance passes
 *   npm run sim -- --preset=offline --days=7   everyone for a week, selling as they go (slow; WS4)
 *
 * The full and tune presets also sell each `active` seed an hour after its first Legacy point and play
 * run 2, to measure how much faster and further a second run goes (the restart check).
 */
import { spawn, execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { writeReport } from './report';
import type { SimRecord } from './types';

declare const process: { argv: string[]; execPath: string; exitCode?: number };

interface Job {
  name: string;
  args: string[];
  out: string;
}

const args = Object.fromEntries(
  process.argv.slice(2).map((a: string) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? 'true'];
  }),
);
const PRESET = String(args.preset ?? 'full');
const OUT = String(args.out ?? `output/sim/${PRESET}`);
const JOBS = Math.max(1, Number(args.jobs ?? availableParallelism() - 2));

/** Hours per persona, long enough to reach the first Legacy point with room to spare. */
const FULL_HOURS: Record<string, number> = { active: 9, optimal: 4, semi: 16, idle: 16, casual: 96, hermit: 336 };
/** The offline preset plays everyone this many days, selling as they go, to compare presence with absence. */
const OFFLINE_DAYS = Number(args.days ?? 3);
const OFFLINE_PERSONAS = ['active', 'semi', 'idle', 'casual', 'hermit', 'hermit-12', 'hermit-72'];
/** The restart check sells at the snapshot and plays run 2 this long: past the time run 1 had played. */
const RESTART_HOURS = 6;
/** The restart check starts this long after the first Legacy point. */
const RESTART_AFTER = 3600;

function job(persona: string, seed: number, hours: number, extra: string[] = [], tag = ''): Job {
  const name = `${persona}${tag}-${seed}`;
  const out = `${OUT}/${name}.json`;
  return { name, out, args: [`--persona=${persona}`, `--seed=${seed}`, `--hours=${hours}`, `--json=${out}`, ...extra] };
}

const PRESETS: Record<string, () => Job[]> = {
  quick: () => ['active', 'semi', 'idle'].flatMap((p) => [1, 2].map((seed) => job(p, seed, 5))),
  full: () => [
    ...Object.entries(FULL_HOURS).flatMap(([p, hours]) =>
      [1, 2, 3, 4, 5].map((seed) =>
        job(p, seed, hours, p === 'active' ? [`--snapshots=1800,3600,7200,10800`, `--snapfirst=${RESTART_AFTER}`] : []),
      ),
    ),
    ...['no-drops', 'no-merch', 'no-teams', 'no-clicks'].map((v) => job('active', 1, FULL_HOURS.active, [`--variant=${v}`], `.${v}`)),
  ],
  // For tuning the active player's pace: three seeds and the restart check, a few minutes.
  tune: () => [1, 2, 3].map((seed) => job('active', seed, FULL_HOURS.active, [`--snapfirst=${RESTART_AFTER}`])),
  // Slow: an always-open persona takes about 8 minutes a simulated day. Run it in the background.
  offline: () => OFFLINE_PERSONAS.flatMap((p) => [1, 2].map((seed) => job(p, seed, OFFLINE_DAYS * 24, ['--runs=999']))),
};

function run(j: Job, git: string): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['--import', 'tsx', 'scripts/sim/cli.ts', ...j.args, `--git=${git}`], { stdio: ['ignore', 'pipe', 'pipe'] });
    let err = '';
    child.stdout?.on('data', (d) => console.log(d.toString().trim()));
    child.stderr?.on('data', (d) => (err += d.toString()));
    child.on('exit', (code) => {
      if (code !== 0) console.error(`${j.name} failed (${code}):\n${err}`);
      resolve(code === 0);
    });
  });
}

async function runAll(jobs: Job[], git: string): Promise<number> {
  let next = 0;
  let failed = 0;
  const worker = async () => {
    while (next < jobs.length) {
      const j = jobs[next++];
      if (!(await run(j, git))) failed++;
    }
  };
  await Promise.all(Array.from({ length: Math.min(JOBS, jobs.length) }, worker));
  return failed;
}

/** Sell-and-replay jobs, from each active seed's save an hour after its first Legacy point. */
function restartJobs(firstPass: Job[]): Job[] {
  const out: Job[] = [];
  for (const j of firstPass) {
    if (!j.name.match(/^active-\d+$/) || !existsSync(j.out)) continue;
    const record = JSON.parse(readFileSync(j.out, 'utf8')) as SimRecord;
    const snap = record.snapshots.find((x) => x.label.startsWith('first legacy'));
    if (!snap) continue;
    const save = `${OUT}/${j.name}.restart-save.txt`;
    writeFileSync(save, snap.save);
    out.push(job('active', record.seed, RESTART_HOURS, [`--from=${save}`, '--runs=2', '--sellnow', '--maxrun=999999'], '.sell'));
  }
  return out;
}

async function main(): Promise<void> {
  const make = PRESETS[PRESET];
  if (!make) throw new Error(`Unknown preset "${PRESET}". Known: ${Object.keys(PRESETS).join(', ')}`);
  mkdirSync(OUT, { recursive: true });
  let git = 'unknown';
  try {
    git = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    if (execSync('git status --porcelain -- src', { encoding: 'utf8' }).trim()) git += '+dirty';
  } catch {
    // Not a git checkout.
  }
  const started = Date.now();
  const jobs = make();
  console.log(`${jobs.length} simulations on ${Math.min(JOBS, jobs.length)} workers -> ${OUT} (engine ${git})`);
  let failed = await runAll(jobs, git);
  const restart = PRESET === 'full' || PRESET === 'tune' ? restartJobs(jobs) : [];
  if (restart.length > 0) {
    console.log(`restart check: ${restart.length} simulations`);
    failed += await runAll(restart, git);
  }
  const seconds = (Date.now() - started) / 1000;
  const report = writeReport(OUT, { preset: PRESET, git, wallSeconds: seconds, workers: Math.min(JOBS, jobs.length) });
  console.log(`done in ${seconds.toFixed(0)}s; ${failed} failed. Report: ${report.md} and ${report.html}`);
  if (failed > 0) process.exitCode = 1;
}

void main();
