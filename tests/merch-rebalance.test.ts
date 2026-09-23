import { describe, expect, it } from 'vitest';
import { QUESTS } from '../src/data/quests';
import { STAFF_MAP, effectAmount } from '../src/data/staff';
import { PRODUCTS, TRENDS } from '../src/data/merch';
import { HYPE_ASSIST_LEVEL, HYPE_MAX, HYPE_QUEST_ID, decayHype, hypeAssistActive } from '../src/engine/clicker';
import { addDesign, analyzeDesign, generateDesign } from '../src/engine/designs';
import { computeMods, computeRates } from '../src/engine/economy';
import { MANIA_SECONDS, TRENDING_THRESHOLD, TREND_SECONDS, noveltyOf, rotateTrend, setLineDesign, trendLength, unlockProduct } from '../src/engine/merch';
import { Rng } from '../src/engine/rng';
import { staffPower } from '../src/engine/staff';
import { foundedGame } from './fixtures';

describe('merch designers', () => {
  const designer = STAFF_MAP.get('designer')!;
  const mods = (hires: number) => {
    const s = foundedGame(0, 11);
    s.staff.designer = hires;
    return computeMods(s);
  };

  it('keeps designs fresh and trends running longer, with every bonus levelling off', () => {
    const few = mods(20);
    const lots = mods(5000);
    expect(few.noveltyMult).toBeGreaterThan(1);
    expect(few.trendLengthMult).toBeGreaterThan(1);
    // However many are hired: at most twice as fresh, trends 75% longer, merch sales +30%.
    expect(lots.noveltyMult).toBeLessThanOrEqual(2);
    expect(lots.trendLengthMult).toBeLessThanOrEqual(1.75);
    expect(lots.merchMult).toBeLessThanOrEqual(1.3 + 1e-9);
  });

  it('describes the capped amount it applies', () => {
    const e = designer.effects.find((x) => x.stat === 'freshness')!;
    expect(effectAmount(e, staffPower(10_000))).toBeLessThanOrEqual(e.max!);
    expect(effectAmount(e, staffPower(5))).toBeLessThan(e.max! / 2);
    expect(effectAmount(e, 0)).toBe(0);
  });

  it('lengthens each trend', () => {
    const s = foundedGame(0, 12);
    s.staff.designer = 200;
    const m = computeMods(s);
    rotateTrend(s, new Rng(s), false, m);
    expect(s.merch.trendEndsAt - s.time).toBeCloseTo(trendLength(m));
    expect(trendLength(m)).toBeGreaterThan(TREND_SECONDS);
  });
});

describe('merch pays for keeping up with trends', () => {
  function merchGame(seed: number) {
    const s = foundedGame(0, seed);
    s.cash = 1e15;
    s.fansRun = 1e12;
    // A late-game spread of operations, so merch is measured against a real income.
    for (const id of Object.keys(s.ops)) s.ops[id].owned = 100;
    for (const p of PRODUCTS) unlockProduct(s, p.id);
    return s;
  }

  it('earns far more from a fresh on-trend design than a stale off-trend one', () => {
    const s = merchGame(21);
    const trend = s.merch.trend;
    const offTrend = TRENDS.find((t) => t.id !== trend)!.id;
    const stale = addDesign(s, generateDesign(new Rng(s), 32, 'old', offTrend))!;
    for (const p of PRODUCTS) setLineDesign(s, p.id, stale);
    s.time += 4 * 3600;
    const staleCps = computeRates(s).merchCps;
    const fresh = addDesign(s, generateDesign(new Rng(s), 32, 'new', trend))!;
    expect(analyzeDesign(s.designs[fresh], trend).trend).toBeGreaterThanOrEqual(TRENDING_THRESHOLD);
    for (const p of PRODUCTS) setLineDesign(s, p.id, fresh);
    expect(computeRates(s).merchCps).toBeGreaterThan(staleCps * 6);
  });

  it('leaves a set-and-forget store below operations income', () => {
    const s = merchGame(22);
    const d = addDesign(s, generateDesign(new Rng(s), 32, 'forgot'))!;
    for (const p of PRODUCTS) {
      setLineDesign(s, p.id, d);
      s.merch.lines[p.id].quality = 10;
    }
    s.time += 6 * 3600;
    const r = computeRates(s);
    expect(r.merchCps).toBeLessThan(r.cpsNoBuffs);
  });

  it("doesn't refresh a design by swapping it off a line and back", () => {
    const s = merchGame(23);
    const a = addDesign(s, generateDesign(new Rng(s), 32, 'a'))!;
    const b = addDesign(s, generateDesign(new Rng(s), 32, 'b'))!;
    const line = s.merch.lines[PRODUCTS[0].id];
    setLineDesign(s, PRODUCTS[0].id, a);
    s.time += 3600;
    const before = noveltyOf(line, s.time, computeMods(s));
    setLineDesign(s, PRODUCTS[0].id, b);
    setLineDesign(s, PRODUCTS[0].id, a);
    expect(noveltyOf(line, s.time, computeMods(s))).toBeCloseTo(before);
  });

  it('keeps mania to a minute or two', () => {
    expect(MANIA_SECONDS[1]).toBeLessThanOrEqual(120);
  });
});

describe('trend-briefed designs', () => {
  it('match the trend they were briefed for', () => {
    const rng = new Rng({ rng: 99 });
    for (const t of TRENDS) {
      for (let i = 0; i < 8; i++) {
        const d = { ...generateDesign(rng, 32, 'x', t.id), id: `${t.id}${i}`, createdAt: 0, version: 1 };
        expect(analyzeDesign(d, t.id, false).trend, t.id).toBeGreaterThanOrEqual(TRENDING_THRESHOLD);
      }
    }
  });
});

describe('hype streak assist', () => {
  it('warms the crowd up to 80% while the quest is live, and not otherwise', () => {
    const s = foundedGame(0, 31);
    expect(QUESTS.some((q) => q.id === HYPE_QUEST_ID)).toBe(true);
    s.quests.active = [{ id: HYPE_QUEST_ID, ready: false, base: 0 } as never];
    expect(hypeAssistActive(s)).toBe(true);
    s.hype = 0;
    s.lastClickTime = -1000;
    for (let i = 0; i < 200; i++) {
      s.time += 1;
      decayHype(s, 1);
    }
    expect(s.hype).toBeCloseTo(HYPE_MAX * HYPE_ASSIST_LEVEL);
    s.quests.active = [];
    for (let i = 0; i < 200; i++) {
      s.time += 1;
      decayHype(s, 1);
    }
    expect(s.hype).toBe(0);
  });
});
