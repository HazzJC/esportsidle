/**
 * Runs a matrix of simulations in parallel, one child process per (persona, seed, variant), then
 * writes the report. This is `npm run sim`.
 *
 *   npm run sim:quick                 active, semi and idle, two seeds, 3 hours: a couple of minutes
 *   npm run sim                       the full balance matrix (see PRESETS)
 *   npm run sim -- --preset=full --jobs=8 --out=output/sim/before
 *
 * The full preset also plays each `active` seed on from an hour after its first Legacy point, once
 * staying in the run and once selling, to measure whether restarting pays (the restart check).
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
const FULL_HOURS: Record<string, number> = { active: 8, optimal: 4, semi: 16, idle: 16, casual: 96 };
/** The restart check plays this long after the snapshot, staying or selling. */
const RESTART_HOURS = 3;
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

/** Stay-or-sell jobs, from each active seed's save an hour after its first Legacy point. */
function restartJobs(firstPass: Job[]): Job[] {
  const out: Job[] = [];
  for (const j of firstPass) {
    if (!j.name.match(/^active-\d+$/) || !existsSync(j.out)) continue;
    const record = JSON.parse(readFileSync(j.out, 'utf8')) as SimRecord;
    const snap = record.snapshots.find((x) => x.label.startsWith('first legacy'));
    if (!snap) continue;
    const save = `${OUT}/${j.name}.restart-save.txt`;
    writeFileSync(save, snap.save);
    out.push(job('active', record.seed, RESTART_HOURS, [`--from=${save}`, '--runs=1'], '.stay'));
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
  const restart = PRESET === 'full' ? restartJobs(jobs) : [];
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
