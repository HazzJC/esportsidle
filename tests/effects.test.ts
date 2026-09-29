import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS } from '../src/data/achievements';
import { AUTOMATIONS } from '../src/data/automation';
import { CHALLENGES, DYNASTY, LEGACY_NODES } from '../src/data/legacy';
import { OPERATIONS } from '../src/data/operations';
import { STAFF } from '../src/data/staff';
import { UPGRADES } from '../src/data/upgrades';
import { computeMods, computeRates, emptyMods, applyEffect } from '../src/engine/economy';
import { marketSize } from '../src/engine/market';
import { LEGACY_DIVISOR, buyNode, sellOrg } from '../src/engine/prestige';
import { maxSponsorTier } from '../src/engine/sponsors';
import { evaluateTeam, rosterCapacity } from '../src/engine/teams';
import type { Effect, GameState } from '../src/engine/types';
import { foundedGame } from './fixtures';

/** An org with every store upgrade, legacy node, challenge and dynasty rank, and every operation and staff type. */
function everythingOwned(): GameState {
  const s = foundedGame(0, 7);
  for (const op of OPERATIONS) {
    s.ops[op.id].owned = 100;
    s.ops[op.id].highest = 100;
  }
  for (const st of STAFF) s.staff[st.id] = 20;
  s.fans = 1e9;
  s.fansRun = 1e9;
  for (const n of LEGACY_NODES) s.prestige.nodes[n.id] = 1;
  s.prestige.level = 50;
  for (const d of DYNASTY) s.prestige.dynasty[d.id] = 10;
  for (const c of CHALLENGES) s.prestige.challengesDone[c.id] = 1;
  s.achievements = Object.fromEntries(ACHIEVEMENTS.filter((a) => !a.shadow).slice(0, 100).map((a) => [a.id, 1]));
  for (const u of UPGRADES) s.upgrades[u.id] = 0;
  return s;
}

function flatten(o: unknown, prefix = '', out: Record<string, number> = {}): Record<string, number> {
  if (typeof o === 'number') out[prefix] = o;
  else if (Array.isArray(o)) o.forEach((x, i) => flatten(x, `${prefix}[${i}]`, out));
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  return out;
}

/** Everything a player could see change: every modifier, plus the rates they feed. */
function outputs(s: GameState): Record<string, number> {
  const mods = computeMods(s);
  const r = computeRates(s, mods);
  const rates = { cps: r.cps, click: r.click, fame: r.fameMult, superfan: r.superfanMult, fans: r.fansPerSec, match: r.matchCps, unit: r.opUnit };
  return { ...flatten(mods, 'mods'), ...flatten(rates, 'rates') };
}

/** The biggest relative change across every output between two states. */
function biggestChange(a: Record<string, number>, b: Record<string, number>): number {
  let best = 0;
  for (const k of Object.keys(a)) {
    const rel = Math.abs(a[k] - (b[k] ?? 0)) / Math.max(1e-12, Math.abs(a[k]));
    if (rel > best) best = rel;
  }
  return best;
}

describe('every upgrade still pays when everything else is owned', () => {
  const full = outputs(everythingOwned());

  it('changes something for each store upgrade, so no cap or clamp swallows it', () => {
    const dead: string[] = [];
    for (const u of UPGRADES) {
      const s = everythingOwned();
      delete s.upgrades[u.id];
      if (biggestChange(full, outputs(s)) < 0.001) dead.push(u.id);
    }
    expect(dead).toEqual([]);
  });

  it('changes something for each legacy node that has an effect', () => {
    const dead: string[] = [];
    for (const n of LEGACY_NODES) {
      if (!n.effects) continue;
      const s = everythingOwned();
      delete s.prestige.nodes[n.id];
      if (biggestChange(full, outputs(s)) < 0.001) dead.push(n.id);
    }
    expect(dead).toEqual([]);
  });

  it('changes something for each dynasty rank and each challenge reward', () => {
    for (const d of DYNASTY) {
      const s = everythingOwned();
      s.prestige.dynasty[d.id] -= 1;
      expect(biggestChange(full, outputs(s)), d.id).toBeGreaterThan(0.001);
    }
    for (const c of CHALLENGES) {
      const s = everythingOwned();
      delete s.prestige.challengesDone[c.id];
      expect(biggestChange(full, outputs(s)), c.id).toBeGreaterThan(0.001);
    }
  });

  it('leaves no effect kind that the modifier set ignores', () => {
    const sources: Effect[] = [
      ...UPGRADES.flatMap((u) => u.effects),
      ...LEGACY_NODES.flatMap((n) => n.effects ?? []),
      ...CHALLENGES.flatMap((c) => c.rewardEffects),
      ...DYNASTY.flatMap((d) => d.effects(3)),
    ];
    for (const e of sources) {
      const m = emptyMods();
      const before = JSON.stringify(m);
      applyEffect(m, e);
      expect(JSON.stringify(m), JSON.stringify(e)).not.toBe(before);
    }
  });
});

describe('effects reach the game, not just the modifier set', () => {
  it('clicking is multiplied as a whole, so a click multiplier is not lost next to the income share', () => {
    const s = foundedGame(0, 4);
    s.ops.grinder.owned = 40;
    s.ops.streamer.owned = 30;
    s.upgrades.click_0 = 0;
    const plain = computeRates(s).click;
    s.upgrades.trophy_1 = 0; // Golden Controller: clicks ×2
    expect(computeRates(s).click / plain).toBeCloseTo(2, 6);
  });

  it('match prize money covers the income share, so prize upgrades move real payouts', () => {
    const s = foundedGame(0, 5);
    s.ops.grinder.owned = 100;
    const ctx = () => {
      const r = computeRates(s);
      return { cpsNoBuffs: r.cpsNoBuffs, incomeBuff: 1, fansMult: 1 };
    };
    const before = evaluateTeam(s, s.teams.smash, computeMods(s), ctx()).winPrize;
    s.upgrades.prize_0 = 0;
    const after = evaluateTeam(s, s.teams.smash, computeMods(s), ctx()).winPrize;
    expect(after / before).toBeCloseTo(1.15, 3);
  });

  it('keeps every match-prize source small enough that matches cannot run away from operations', () => {
    const s = everythingOwned();
    // Everything owned with ten Pedigree ranks. A veteran with 150+ ranks is allowed up to 50
    // (tests/slow/lategame-audit.test.ts); Pedigree has no ceiling, so that cap is the one that bites.
    expect(computeMods(s).prizeMult).toBeLessThan(15);
  });

  it('bench, market and sponsor slots come out at what the cards promise', () => {
    const s = everythingOwned();
    const mods = computeMods(s);
    const team = s.teams.smash;
    // Base 1, Folding Chairs, Substitutes' Lounge, Academy Pipeline and Deep Bench.
    expect(mods.benchSlots).toBe(1 + 3 + 1);
    expect(rosterCapacity(team, mods)).toBe(team.lineup.length + mods.benchSlots);
    // Base 6, Talent Database and Global Scouting Network (+2 each), Talent Pipeline (+2).
    expect(marketSize(mods)).toBe(6 + 2 + 2 + 2);
    // Base 2, Sponsorship Manager, Brand Partnerships Team, Brand Heritage.
    expect(mods.sponsorSlots).toBe(2 + 1 + 1 + 1);
  });

  it('reaches, but never exceeds, the offline caps the cards advertise', () => {
    const mods = computeMods(everythingOwned());
    expect(mods.offlineRate).toBeCloseTo(1, 9);
    expect(mods.offlineCapHours).toBe(12 + 12 + 48);
  });

  it('can unlock every Superfan upgrade: enough non-shadow achievements exist', () => {
    const need = Math.max(...UPGRADES.filter((u) => u.group === 'superfan').map((u) => Number(/\d+/.exec(u.requirement)![0])));
    expect(ACHIEVEMENTS.filter((a) => !a.shadow).length).toBeGreaterThanOrEqual(need);
  });

  it('counts only cabinet achievements towards Superfan unlocks, like the bonus itself', () => {
    const s = foundedGame(0, 9);
    const shadow = ACHIEVEMENTS.filter((a) => a.shadow).slice(0, 3);
    expect(shadow.length).toBeGreaterThan(0);
    const cabinet = ACHIEVEMENTS.filter((a) => !a.shadow);
    const first = UPGRADES.find((u) => u.id === 'superfan_0')!;
    s.achievements = Object.fromEntries([...shadow, ...cabinet.slice(0, 11)].map((a) => [a.id, 1]));
    expect(first.unlock(s)).toBe(false);
    s.achievements[cabinet[11].id] = 1;
    s.achievements[cabinet[12].id] = 1;
    expect(first.unlock(s)).toBe(true);
  });
});

describe('legacy unlocks that change how a run starts or plays', () => {
  function sold(nodes: string[], setup?: (s: GameState) => void): GameState {
    const s = foundedGame(0, 31);
    s.earnedTotal = Math.pow(5, 3) * LEGACY_DIVISOR;
    s.earnedRun = s.earnedTotal;
    s.prestige.points = 10_000;
    s.prestige.nodes.legacy = 1;
    for (const id of nodes) {
      s.prestige.nodes[id] = 1;
    }
    setup?.(s);
    expect(sellOrg(s)).not.toBeNull();
    return s;
  }

  it('IPO Money starts each run with $1 billion, not the smaller sums', () => {
    const s = sold(['start_cash_1', 'start_cash_2', 'start_cash_3']);
    expect(s.cash).toBe(1e9);
  });

  it('Family Home keeps decor and Merch Archive keeps unlocked products, and without them nothing is kept', () => {
    const keep = sold(['keep_decor', 'keep_merch'], (s) => {
      s.decor.posters = true;
      s.merch.unlocked.tee = true;
    });
    expect(keep.decor.posters).toBe(true);
    expect(keep.merch.unlocked.tee).toBe(true);
    const lose = sold([], (s) => {
      s.decor.posters = true;
      s.merch.unlocked.tee = true;
    });
    expect(lose.decor.posters).toBeUndefined();
    expect(lose.merch.unlocked.tee).toBeUndefined();
  });

  it('Global Brand Portfolio opens sponsor tiers 6 to 10', () => {
    const s = foundedGame(0, 3);
    const before = maxSponsorTier(s);
    s.prestige.nodes.sponsor_tiers = 1;
    expect(maxSponsorTier(s)).toBeGreaterThan(before);
    expect(maxSponsorTier(s)).toBe(9);
  });

  it('Operations Manager is the only thing that unlocks the building buyer', () => {
    const s = foundedGame(0, 3);
    const auto = AUTOMATIONS.find((a) => a.id === 'operations')!;
    expect(auto.unlock(s)).toBe(false);
    expect(buyNode(s, 'operations_manager')).toBe(false);
    s.prestige.points = 100;
    s.prestige.nodes.legacy = 1;
    expect(buyNode(s, 'operations_manager')).toBe(true);
    expect(auto.unlock(s)).toBe(true);
  });
});
