/**
 * Ultra-lategame balance suite, built on a real save (tests/fixtures/lategame-save.txt): 12 sales,
 * every Legacy node, Legacy level 5.5e12, 1.8e50 lifetime earnings.
 *
 * Two kinds of test:
 *  - invariants (plain `it`): the save loads, nothing goes non-finite, and every thing a budget looks
 *    up still exists. These must always pass.
 *  - budgets (`it.fails`): ceilings on how much any one thing may pay or multiply. Every budget marked
 *    `it.fails` is out of hand today. When a balance change brings one back under its ceiling the test
 *    flips to failing with "expected to fail", which is the cue to delete the `.fails`. A plain `it`
 *    budget passes today and guards against regression.
 *
 * `it.fails` passes on any thrown error, so a budget whose lookup found nothing would pass for the
 * wrong reason. The "finds everything the budgets measure" invariant fails loudly instead.
 *
 * Slow (the save is huge and the projection plays thirty minutes), so it is not part of `npm test`:
 *   npm run test:slow
 * The full write-up is `npx tsx scripts/lategame-audit.ts`.
 */
import { describe, expect, it } from 'vitest';
import { allIn, cabinetInfo, merchEnvelope, paybacks, payouts, projectForward, sponsorChain } from '../../scripts/lategame-checks';
import { headrooms, loadLategameSave, measure, settled, sweepAblations } from '../../scripts/lategame-lib';
import { computeMods, computeRates } from '../../src/engine/economy';
import { fmt } from '../../src/engine/format';
import { legacyFor } from '../../src/engine/prestige';

const HOUR = 3600;

/** Computed on first use, so collecting the file (or filtering it out) costs nothing. */
function lazy<T>(make: () => T): () => T {
  let value: T | undefined;
  let made = false;
  return () => {
    if (!made) {
      value = make();
      made = true;
    }
    return value as T;
  };
}

const ctx = lazy(() => {
  const save = loadLategameSave();
  const s = settled(save);
  const mods = computeMods(s);
  return { save, s, mods, rates: computeRates(s, mods), base: measure(s) };
});
const pay = lazy(() => payouts(ctx().save));
const ablations = lazy(() => sweepAblations(ctx().save));
const merch = lazy(() => merchEnvelope(ctx().save));
const cashPaybacks = lazy(() => paybacks(ctx().save).filter((p) => p.currency === 'cash' && Number.isFinite(p.paybackSeconds)));

const PAYOUTS_USED = ['Invitational champion', 'sponsor goal'];
const ABLATIONS_USED = ['all levels', '3 active contracts'];
const payout = (name: string) => pay().find((p) => p.what.startsWith(name));
const factor = (id: string) => ablations().find((a) => a.id.startsWith(id))?.factor ?? NaN;

describe('lategame save: invariants', () => {
  it('loads as the expected org', () => {
    const { s } = ctx();
    expect(s.prestige.runs).toBe(12);
    expect(s.prestige.level).toBeGreaterThan(1e12);
    expect(Object.keys(s.prestige.nodes).length).toBeGreaterThan(40);
  });

  it('finds everything the budgets measure', () => {
    for (const name of PAYOUTS_USED) expect(payout(name), name).toBeDefined();
    for (const id of ABLATIONS_USED) expect(Number.isFinite(factor(id)), id).toBe(true);
    expect(merch().length).toBeGreaterThanOrEqual(3);
    expect(cashPaybacks().some((p) => p.owned >= 100)).toBe(true);
    expect(Number.isFinite(sponsorChain(ctx().save).agentMult)).toBe(true);
  });

  it('has finite income, and every ever-growing number is 200+ decades from Infinity', () => {
    expect(Number.isFinite(ctx().base.total)).toBe(true);
    for (const h of headrooms(ctx().save)) if (h.value > 0) expect(h.decadesLeft, h.what).toBeGreaterThan(200);
  });

  it('stays finite for thirty simulated minutes of play', () => {
    const p = projectForward(ctx().save, 0.5, 1);
    expect(p.finite).toBe(true);
  }, 60_000);

  it('formats every headline number without NaN or Infinity', () => {
    const { s, rates } = ctx();
    for (const v of [s.cash, s.earnedTotal, s.fans, rates.totalCps, s.prestige.level, ...Object.values(s.incomeTotal)]) {
      expect(fmt(v)).not.toMatch(/NaN|Infinity/);
    }
  });

  it('is worth the Legacy the save says it is', () => {
    const { s } = ctx();
    expect(legacyFor(s.earnedTotal)).toBeGreaterThanOrEqual(s.prestige.level);
  });
});

describe('lategame budgets: lump sums', () => {
  it('an Invitational title pays under an hour of income', () => {
    expect(payout('Invitational champion')!.seconds).toBeLessThan(HOUR);
  });

  it('nothing pays out more than a day of income in one go', () => {
    for (const p of pay()) expect(p.seconds, p.what).toBeLessThan(24 * HOUR);
  });

  it('a sponsor goal pays under an hour of income', () => {
    expect(payout('sponsor goal')!.seconds).toBeLessThan(HOUR);
  });
});

describe('lategame budgets: income mix', () => {
  it('matches are not more than 90% of steady income', () => {
    const { base } = ctx();
    expect(base.match / base.total).toBeLessThan(0.9);
  });

  it('operations are at least 5% of steady income', () => {
    const { base } = ctx();
    expect(base.ops / base.total).toBeGreaterThan(0.05);
  });

  it.fails('merch, at its best, is at most 3x operations income', () => {
    expect(Math.max(...merch().map((m) => m.merchOverOps))).toBeLessThan(3);
  });

  it.fails('merch swings under 10x between its worst and best design state', () => {
    const rows = merch();
    expect(rows[2].merchOverOps / rows[0].merchOverOps).toBeLessThan(10);
  });
});

describe('lategame budgets: multipliers', () => {
  it('no non-Legacy line is worth more than 1e5 of income', () => {
    const rest = ablations().filter((a) => !a.group.startsWith('legacy'));
    for (const a of rest.slice(0, 5)) expect(a.factor, `${a.group} ${a.id}`).toBeLessThan(1e5);
  });

  it.fails('the Legacy level term is under 1e6 of income', () => {
    expect(factor('all levels')).toBeLessThan(1e6);
  });

  it('the trophy cabinet is under 1e5, and its next achievement adds under 5%', () => {
    const c = cabinetInfo(ctx().save);
    expect(c.multiplier).toBeLessThan(1e5);
    expect(c.marginal).toBeLessThan(0.05);
  });

  it('the Agent line multiplies sponsor income by under 10', () => {
    expect(sponsorChain(ctx().save).agentMult).toBeLessThan(10);
  });

  it('sponsor contracts are worth under 100x income', () => {
    expect(factor('3 active contracts')).toBeLessThan(100);
  });

  it("a veteran's prize multiplier stack is under 50 (a fresh run's is held under 15 in effects.test.ts)", () => {
    expect(ctx().mods.prizeMult).toBeLessThan(50);
  });
});

describe('lategame budgets: spending', () => {
  it('no line with 100+ owned repays its next unit in under 30 seconds', () => {
    for (const p of cashPaybacks().filter((x) => x.owned >= 100)) expect(p.paybackSeconds, `${p.kind} ${p.id}`).toBeGreaterThan(30);
  });

  it.fails('no line is worth more than 0.5% income per 1% more of it', () => {
    for (const p of cashPaybacks()) expect(p.elasticity, `${p.kind} ${p.id}`).toBeLessThan(0.5);
  });

  it('spending the whole bank on one line never more than doubles income', () => {
    expect(allIn(ctx().save)[0].factor).toBeLessThan(2);
  });
});
