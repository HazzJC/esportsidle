import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS } from '../src/data/achievements';
import { OPERATIONS } from '../src/data/operations';
import { UPGRADES } from '../src/data/upgrades';
import { addBuff } from '../src/engine/buffs';
import { clickLogo, CROWD_BUFF_ID, HYPE_MAX, HYPE_PER_CLICK } from '../src/engine/clicker';
import { computeRates, fameMultiplier } from '../src/engine/economy';
import { createNewGame } from '../src/engine/state';
import { buyUpgrade, refreshUpgradeUnlocks, storeUpgrades } from '../src/engine/upgrades';

describe('content integrity', () => {
  it('has unique upgrade and achievement ids', () => {
    expect(new Set(UPGRADES.map((u) => u.id)).size).toBe(UPGRADES.length);
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
  });

  it('defines 16 operations with increasing costs', () => {
    expect(OPERATIONS).toHaveLength(16);
    for (let i = 1; i < OPERATIONS.length; i++) {
      expect(OPERATIONS[i].baseCost).toBeGreaterThan(OPERATIONS[i - 1].baseCost);
      expect(OPERATIONS[i].baseCps).toBeGreaterThan(OPERATIONS[i - 1].baseCps);
    }
  });

  it('ships a deep upgrade list', () => {
    expect(UPGRADES.length).toBeGreaterThan(250);
  });
});

describe('rates', () => {
  it('sums operation production', () => {
    const s = createNewGame(0, 1);
    s.ops.grinder.owned = 10;
    s.ops.streamer.owned = 2;
    const r = computeRates(s);
    expect(r.baseCps).toBeCloseTo(10 * 0.1 + 2 * 1);
    expect(r.cps).toBeCloseTo(r.baseCps * r.globalMult);
  });

  it('applies grinder doublings to grinders and clicks', () => {
    const s = createNewGame(0, 1);
    s.ops.grinder.owned = 1;
    s.upgrades.grind_0 = 0;
    s.upgrades.grind_1 = 0;
    const r = computeRates(s);
    expect(r.baseCps).toBeCloseTo(0.4);
    expect(r.click).toBeCloseTo(4);
  });

  it('adds the thousand-game bonus per non-grinder operation', () => {
    const s = createNewGame(0, 1);
    s.ops.grinder.owned = 2;
    s.ops.streamer.owned = 10;
    s.upgrades.grind_3 = 0;
    const r = computeRates(s);
    // grinder unit = 0.1 + 0.1 * 10 = 1.1
    expect(r.baseCps).toBeCloseTo(2 * 1.1 + 10);
    expect(r.click).toBeCloseTo(1 + 1);
  });

  it('applies per-owned synergies', () => {
    const s = createNewGame(0, 1);
    s.ops.streamer.owned = 10;
    s.ops.creator.owned = 1;
    s.upgrades.collab_creator = 0;
    const r = computeRates(s);
    // streamers x2 => 20, creator +1% per streamer => 8 * 1.10
    expect(r.baseCps).toBeCloseTo(20 + 8 * 1.1);
  });

  it('scales with fans and buffs', () => {
    const s = createNewGame(0, 1);
    s.ops.streamer.owned = 1;
    s.fans = 900;
    const r = computeRates(s);
    expect(r.fameMult).toBeCloseTo(fameMultiplier(900, 0.08));
    addBuff(s, { id: 'x', name: 'x', icon: 'x', tone: 'good', desc: '', duration: 10, effects: [{ kind: 'income', mult: 7 }] });
    expect(computeRates(s).cps).toBeCloseTo(r.cps * 7);
  });
});

describe('upgrades', () => {
  it('reveals and buys upgrades', () => {
    const s = createNewGame(0, 1);
    s.ops.grinder.owned = 1;
    refreshUpgradeUnlocks(s);
    const store = storeUpgrades(s);
    expect(store.map((u) => u.id)).toContain('grind_0');
    expect(buyUpgrade(s, 'grind_0')).toBe(false);
    s.cash = 100;
    expect(buyUpgrade(s, 'grind_0')).toBe(true);
    expect(s.cash).toBe(0);
    expect(storeUpgrades(s).map((u) => u.id)).not.toContain('grind_0');
  });
});

describe('clicking', () => {
  it('earns cash and fills the hype meter into a crowd buff', () => {
    const s = createNewGame(0, 1);
    const clicksNeeded = Math.ceil(HYPE_MAX / HYPE_PER_CLICK);
    let crowd = false;
    for (let i = 0; i < clicksNeeded; i++) crowd = clickLogo(s).crowd || crowd;
    expect(s.cash).toBe(clicksNeeded);
    expect(crowd).toBe(true);
    expect(s.buffs.some((b) => b.id === CROWD_BUFF_ID)).toBe(true);
    expect(s.hype).toBe(0);
  });
});
