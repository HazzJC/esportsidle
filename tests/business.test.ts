import { describe, expect, it } from 'vitest';
import { DESIGN_PALETTE, PRODUCTS } from '../src/data/merch';
import { BRANDS, BRAND_MAP, SPONSOR_TIERS } from '../src/data/sponsors';
import {
  addDesign,
  analyzeDesign,
  blankPixels,
  decodePixels,
  deleteDesign,
  encodePixels,
  generateDesign,
  MAX_DESIGNS,
  sanitizeDesign,
  setOrgLogo,
} from '../src/engine/designs';
import { computeMods, computeRates } from '../src/engine/economy';
import { advance } from '../src/engine/game';
import {
  NOVELTY_FLOOR,
  noveltyOf,
  optimalPrice,
  priceFactor,
  setLineDesign,
  setLinePrice,
  unlockProduct,
} from '../src/engine/merch';
import { Rng } from '../src/engine/rng';
import { decodeSave, encodeSave } from '../src/engine/save';
import { cancelContract, generateOffer, goalProgress, refreshOffers, signOffer, updateSponsors } from '../src/engine/sponsors';
import { createNewGame } from '../src/engine/state';
import type { Design, GameState, SponsorOffer } from '../src/engine/types';

function design(size: number, fill: (x: number, y: number) => number, handmade = true): Design {
  const values = new Uint8Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) values[y * size + x] = fill(x, y);
  return { id: 'test', name: 'Test', size, palette: [...DESIGN_PALETTE], pixels: encodePixels(values), handmade, createdAt: 0, version: 1 };
}

function ctxFor(s: GameState) {
  const mods = computeMods(s);
  return { rng: new Rng(s), mods, rates: computeRates(s, mods) };
}

describe('designs', () => {
  it('encodes and decodes pixels', () => {
    const values = [0, 1, 5, 32, 35, 0];
    expect(Array.from(decodePixels({ size: 0, pixels: encodePixels(values) }))).toEqual([]);
    const d = design(16, (x, y) => (x + y) % 33);
    expect(decodePixels(d)[17]).toBe(2);
    expect(d.pixels).toHaveLength(256);
  });

  it('sanitizes malformed designs', () => {
    const d = sanitizeDesign({ id: 'x', size: 999, palette: ['#fff', 'nope', '#123456'], pixels: 'ZZZZ###' });
    expect(d.size).toBe(32);
    expect(d.palette).toEqual(['#123456']);
    expect(d.pixels).toHaveLength(32 * 32);
    expect(decodePixels(d).every((v) => v <= 1)).toBe(true);
  });

  it('scores empty designs at zero and good designs highly', () => {
    const empty = design(16, () => 0);
    expect(analyzeDesign(empty, 'neon', false).total).toBe(0);
    // A symmetric neon diamond on transparent background.
    const diamond = design(32, (x, y) => (Math.abs(x - 15.5) + Math.abs(y - 15.5) < 11 ? (Math.abs(x - 15.5) + Math.abs(y - 15.5) < 5 ? 9 : 7) : 0));
    const a = analyzeDesign(diamond, 'neon', false);
    expect(a.symmetry).toBeGreaterThan(0.95);
    expect(a.total).toBeGreaterThan(0.6);
    const noise = design(32, (x, y) => ((x * 7 + y * 13) % 30) + 1, false);
    expect(analyzeDesign(noise, 'minimal', false).total).toBeLessThan(a.total);
  });

  it('gives hints for weak designs', () => {
    const speck = design(32, (x, y) => (x === 3 && y === 4 ? 1 : 0));
    expect(analyzeDesign(speck, 'bold', false).hints.length).toBeGreaterThan(0);
  });

  it('generates valid symmetric designs', () => {
    const rng = new Rng({ rng: 5 });
    for (const size of [16, 32, 64]) {
      const g = generateDesign(rng, size, 'Auto');
      const d = sanitizeDesign({ ...g, id: 'g' });
      expect(d.pixels).toBe(g.pixels);
      expect(analyzeDesign(d, 'neon', false).symmetry).toBe(1);
    }
  });

  it('limits and cleans up designs', () => {
    const s = createNewGame(0, 2);
    const id = addDesign(s, { name: 'Logo', size: 16, palette: [...DESIGN_PALETTE], pixels: blankPixels(16), handmade: true })!;
    expect(setOrgLogo(s, id)).toBe(true);
    expect(s.stats.designsCreated).toBe(1);
    expect(deleteDesign(s, id)).toBe(true);
    expect(s.org.logo).toBeNull();
    for (let i = 0; i < MAX_DESIGNS; i++) addDesign(s, { name: `d${i}`, size: 16, palette: [...DESIGN_PALETTE], pixels: blankPixels(16), handmade: false });
    expect(addDesign(s, { name: 'overflow', size: 16, palette: [...DESIGN_PALETTE], pixels: blankPixels(16), handmade: false })).toBeNull();
  });

  it('designs survive a save round trip', () => {
    const s = createNewGame(0, 2);
    const d = generateDesign(new Rng({ rng: 9 }), 32, 'Round trip');
    const id = addDesign(s, d)!;
    s.org.jersey = id;
    const loaded = decodeSave(encodeSave(s));
    expect(loaded.designs[id].pixels).toBe(d.pixels);
    expect(loaded.org.jersey).toBe(id);
  });
});

describe('merch', () => {
  it('prices have a sweet spot', () => {
    const best = optimalPrice(false);
    expect(priceFactor(best, false)).toBeCloseTo(1);
    expect(priceFactor(best * 2, false)).toBeLessThan(1);
    expect(priceFactor(0.5, false)).toBeLessThan(1);
    expect(optimalPrice(true)).toBeGreaterThan(best);
  });

  it('novelty fades to a floor', () => {
    const line = { designId: 'x', price: 1, launchedAt: 0, sold: 0, revenue: 0 };
    expect(noveltyOf(line, 0, { noveltyMult: 1 })).toBe(1);
    expect(noveltyOf(line, 1e6, { noveltyMult: 1 })).toBe(NOVELTY_FLOOR);
    expect(noveltyOf(line, 1800, { noveltyMult: 2 })).toBeGreaterThan(noveltyOf(line, 1800, { noveltyMult: 1 }));
  });

  it('a product line with a design earns money', () => {
    const s = createNewGame(0, 2);
    s.cash = 1e9;
    s.fansRun = 1e6;
    s.fans = 1e6;
    s.ops.streamer.owned = 50;
    const tee = PRODUCTS[0];
    expect(unlockProduct(s, tee.id)).toBe(true);
    expect(computeRates(s).merchCps).toBe(0);
    const id = addDesign(s, generateDesign(new Rng({ rng: 3 }), 32, 'Tee'))!;
    expect(setLineDesign(s, tee.id, id)).toBe(true);
    expect(setLinePrice(s, tee.id, 99)).toBe(true);
    expect(s.merch.lines[tee.id].price).toBe(3);
    setLinePrice(s, tee.id, optimalPrice(false));
    const rates = computeRates(s);
    expect(rates.merchCps).toBeGreaterThan(0);
    expect(rates.totalCps).toBeCloseTo(rates.cps + rates.matchCps + rates.merchCps);
    const before = s.stats.merchRevenue;
    advance(s, 30);
    expect(s.stats.merchRevenue).toBeGreaterThan(before);
    expect(s.merch.lines[tee.id].sold).toBeGreaterThan(0);
  });

  it('products need fans and cash to unlock', () => {
    const s = createNewGame(0, 2);
    s.cash = 1e12;
    expect(unlockProduct(s, 'tee')).toBe(false);
    s.fansRun = PRODUCTS.find((p) => p.id === 'tee')!.unlockFans;
    expect(unlockProduct(s, 'tee')).toBe(true);
    expect(unlockProduct(s, 'tee')).toBe(false);
  });
});

describe('sponsors', () => {
  function offerFor(s: GameState, brandId: string, tier = 0): SponsorOffer {
    const offer = generateOffer(s, new Rng({ rng: 1 }));
    offer.brandId = brandId;
    offer.tier = tier;
    s.sponsors.offers.push(offer);
    return offer;
  }

  it('has unique brands in every category', () => {
    expect(new Set(BRANDS.map((b) => b.id)).size).toBe(BRANDS.length);
    expect(SPONSOR_TIERS).toHaveLength(5);
  });

  it('generates offers once fans arrive', () => {
    const s = createNewGame(0, 2);
    s.fansRun = 2_000;
    refreshOffers(s, new Rng(s));
    expect(s.sponsors.offers).toHaveLength(3);
    expect(s.sponsors.nextRefresh).toBeGreaterThan(s.time);
  });

  it('signing respects requirements, slots and category exclusivity', () => {
    const s = createNewGame(0, 2);
    const mods = computeMods(s);
    const a = offerFor(s, 'monstar');
    expect(signOffer(s, a.id, mods).ok).toBe(false);
    s.fansRun = 1e6;
    expect(signOffer(s, a.id, mods).ok).toBe(true);
    const b = offerFor(s, 'redbullet');
    const sameCategory = signOffer(s, b.id, mods);
    expect(sameCategory.ok).toBe(false);
    const c = offerFor(s, 'razr');
    expect(signOffer(s, c.id, mods).ok).toBe(true);
    const d = offerFor(s, 'nikey');
    expect(signOffer(s, d.id, computeMods(s)).ok).toBe(false);
    expect(s.sponsors.active).toHaveLength(2);
  });

  it('active sponsors raise income and apply perks', () => {
    const s = createNewGame(0, 2);
    s.ops.grinder.owned = 20;
    s.teams.smash.lineup = [null];
    s.fansRun = 1e6;
    const before = computeRates(s);
    const baseGear = computeMods(s).gearCostMult;
    const offer = offerFor(s, 'razr');
    expect(signOffer(s, offer.id, computeMods(s)).ok).toBe(true);
    const after = computeRates(s);
    expect(after.cps).toBeCloseTo(before.cps * (1 + offer.incomePct));
    expect(computeMods(s).gearCostMult).toBeLessThan(baseGear);
    expect(BRAND_MAP.get('razr')?.category).toBe('peripherals');
  });

  it('completing a goal pays out and contracts expire', () => {
    const s = createNewGame(0, 2);
    s.fansRun = 1e6;
    const offer = offerFor(s, 'monstar');
    offer.goal = { kind: 'wins', target: 3, rewardSeconds: 300 };
    const result = signOffer(s, offer.id, computeMods(s));
    expect(result.ok).toBe(true);
    const contract = s.sponsors.active[0];
    s.stats.matchesWon += 3;
    expect(goalProgress(s, contract)).toBe(3);
    const cash = s.cash;
    updateSponsors(s, ctxFor(s), 0.1, false);
    expect(contract.completed).toBe(true);
    expect(s.cash).toBeGreaterThan(cash);
    expect(s.stats.sponsorGoals).toBe(1);
    s.time = contract.endsAt + 1;
    updateSponsors(s, ctxFor(s), 0.1, true);
    expect(s.sponsors.active).toHaveLength(0);
    expect(s.sponsors.history[0].completed).toBe(true);
  });

  it('contracts can be cancelled', () => {
    const s = createNewGame(0, 2);
    s.fansRun = 1e6;
    const offer = offerFor(s, 'snorvpn');
    signOffer(s, offer.id, computeMods(s));
    expect(cancelContract(s, s.sponsors.active[0].id)).toBe(true);
    expect(s.sponsors.active).toHaveLength(0);
  });
});
