import { describe, expect, it } from 'vitest';
import { DESIGN_PALETTE, PRODUCTS, TRENDS } from '../src/data/merch';
import { effectAmount, STAFF_MAP } from '../src/data/staff';
import { addDesign, analyzeDesign, encodePixels, generateDesign } from '../src/engine/designs';
import { computeMods, computeRates } from '../src/engine/economy';
import {
  MANIA_SECONDS,
  merchQualityCost,
  noveltyOf,
  rotateTrend,
  setLineDesign,
  TREND_SECONDS,
  TRENDING_THRESHOLD,
  trendLength,
  unlockProduct,
  upgradeMerchQuality,
} from '../src/engine/merch';
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

describe('merch finish and mania', () => {
  it('makes upgraded, fresh merch and mania materially more profitable', () => {
    const s = foundedGame(0, 4);
    s.cash = 1e8;
    s.ops.grinder.owned = 100;
    s.fans = 1e6;
    s.merch.unlocked.tee = true;
    s.designs.test = {
      id: 'test', name: 'Neon', size: 16, palette: [...DESIGN_PALETTE],
      pixels: encodePixels(Array.from({ length: 256 }, (_, i) => i % 4 === 0 ? 7 : 9)),
      handmade: true, createdAt: 0, version: 1,
    };
    s.merch.lines.tee = { designId: 'test', price: 1, launchedAt: 0, sold: 0, revenue: 0, quality: 0 };
    const base = computeRates(s).merchCps;
    expect(base).toBeGreaterThan(0);
    const cost = merchQualityCost(s, 'tee');
    expect(upgradeMerchQuality(s, 'tee')).toBe(true);
    expect(s.cash).toBe(1e8 - cost);
    expect(computeRates(s).merchCps).toBeGreaterThan(base);
    s.merch.mania = { trend: s.merch.trend, productId: 'tee', endsAt: 400 };
    expect(computeRates(s).merchCps).toBeGreaterThan(base * 4);
    s.time = 500;
    expect(computeRates(s).merchCps).toBeLessThan(base * 2);
  });
});
