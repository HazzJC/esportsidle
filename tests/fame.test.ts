import { describe, expect, it } from 'vitest';
import { LEGACY_NODES } from '../src/data/legacy';
import { UPGRADES } from '../src/data/upgrades';
import { BASE_FAME_EXP, BASE_OFFLINE_RATE, MAX_FAME_EXP, computeMods, computeRates } from '../src/engine/economy';
import type { Effect } from '../src/engine/types';
import { foundedGame } from './fixtures';

const addOf = (e: Effect, kind: 'fameExp' | 'offlineRate') => (e.kind === kind ? e.add : 0);

describe('fame', () => {
  it('pays for every Fame upgrade and legacy fame node, bought in order', () => {
    const s = foundedGame(0, 3);
    s.fans = 1e12;
    s.ops.streamer.owned = 10;
    let before = computeRates(s).fameMult;
    const sources = [
      ...UPGRADES.filter((u) => u.group === 'fame').map((u) => () => (s.upgrades[u.id] = 0)),
      ...LEGACY_NODES.filter((n) => (n.effects ?? []).some((e) => e.kind === 'fameExp' || e.kind === 'fameBonus')).map((n) => () => (s.prestige.nodes[n.id] = 1)),
    ];
    expect(sources.length).toBe(14);
    for (const buy of sources) {
      buy();
      const after = computeRates(s).fameMult;
      expect(after).toBeGreaterThan(before * 1.01);
      before = after;
    }
  });

  it('keeps every fame-exponent source under the cap, so the cap never swallows a purchase', () => {
    const fromUpgrades = UPGRADES.flatMap((u) => u.effects).reduce((n, e) => n + addOf(e, 'fameExp'), 0);
    const fromLegacy = LEGACY_NODES.flatMap((n) => n.effects ?? []).reduce((n, e) => n + addOf(e, 'fameExp'), 0);
    expect(BASE_FAME_EXP + fromUpgrades + fromLegacy).toBeLessThanOrEqual(MAX_FAME_EXP + 1e-9);
  });
});

describe('capped bonuses', () => {
  it('keeps offline efficiency sources within 100%, so none of them is wasted', () => {
    const fromLegacy = LEGACY_NODES.flatMap((n) => n.effects ?? []).reduce((n, e) => n + addOf(e, 'offlineRate'), 0);
    const fromUpgrades = UPGRADES.flatMap((u) => u.effects).reduce((n, e) => n + addOf(e, 'offlineRate'), 0);
    expect(BASE_OFFLINE_RATE + fromLegacy + fromUpgrades).toBeLessThanOrEqual(1 + 1e-9);
  });

  it('never sells an upgrade that does nothing: each one, bought in cost order, changes the modifiers', () => {
    const s = foundedGame(0, 4);
    const dead: string[] = [];
    let before = JSON.stringify(computeMods(s));
    for (const u of [...UPGRADES].sort((a, b) => a.cost - b.cost)) {
      s.upgrades[u.id] = 0;
      const after = JSON.stringify(computeMods(s));
      if (after === before) dead.push(u.id);
      before = after;
    }
    expect(dead).toEqual([]);
  });
});
