import { describe, expect, it } from 'vitest';
import { OPERATIONS } from '../src/data/operations';
import { DESIGN_PALETTE } from '../src/data/merch';
import { autoOperations } from '../src/engine/automation';
import { clickLogo, decayHype } from '../src/engine/clicker';
import { encodePixels } from '../src/engine/designs';
import { computeMods, computeRates } from '../src/engine/economy';
import { merchQualityCost, upgradeMerchQuality } from '../src/engine/merch';
import { unitPrice } from '../src/engine/operations';
import { retentionBids } from '../src/engine/worldEvents';
import { foundedGame } from './fixtures';

describe('balance update', () => {
  it('lets intermittent hype accumulate but drains it after a long pause', () => {
    const s = foundedGame(0, 3);
    for (let i = 0; i < 20; i++) clickLogo(s);
    const filled = s.hype;
    s.time += 12;
    decayHype(s, 12);
    expect(s.hype).toBeGreaterThan(filled / 2);
    clickLogo(s);
    expect(s.hype).toBeGreaterThan(filled / 2);
    s.time += 180;
    decayHype(s, 180);
    expect(s.hype).toBe(0);
  });

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

  it('has the legacy manager buy the priciest building within its cash budget', () => {
    const s = foundedGame(0, 5);
    s.cash = 1e8;
    s.prestige.nodes.operations_manager = Date.now();
    s.automation.operations = { on: true, maxCostPct: 0.1 };
    const budget = s.cash * s.automation.operations.maxCostPct;
    const mods = computeMods(s);
    const expected = [...OPERATIONS].reverse().find((op) => unitPrice(op, 0, mods.opCostMult) <= budget)!;
    autoOperations(s, mods);
    expect(s.ops[expected.id].owned).toBe(1);
    expect(1e8 - s.cash).toBeLessThanOrEqual(budget);
    expect(OPERATIONS.filter((op) => op.baseCost > expected.baseCost).every((op) => s.ops[op.id].owned === 0)).toBe(true);
  });

  it('prices retention from current cash and the player career', () => {
    const s = foundedGame(0, 6);
    const p = s.players.founder;
    s.cash = 1e6;
    const early = retentionBids(s, p);
    p.level = 41;
    p.seasons = 8;
    const veteran = retentionBids(s, p);
    expect(veteran[0]).toBeGreaterThan(early[0]);
    expect(veteran[0]).toBeGreaterThanOrEqual(s.cash * 0.05);
    expect(veteran[2]).toBeLessThanOrEqual(s.cash * 0.25);
  });
});
