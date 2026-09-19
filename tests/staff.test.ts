import { describe, expect, it } from 'vitest';
import { DECOR, ROOMS } from '../src/data/decor';
import { STAFF } from '../src/data/staff';
import { computeMods, computeRates } from '../src/engine/economy';
import { healthChances, rollHealth } from '../src/engine/health';
import { refreshMarket, signListing } from '../src/engine/market';
import { isAvailable } from '../src/engine/players';
import type { Rng } from '../src/engine/rng';
import { buyDecor, hireStaff, roomLevel, staffPrice } from '../src/engine/staff';
import { createNewGame } from '../src/engine/state';
import { autoSubstitute, updatePlayers } from '../src/engine/teams';

/** An RNG stub that always rolls the given value. */
function fixedRng(value: number): Rng {
  return {
    next: () => value,
    range: (min: number) => min,
    int: (min: number) => min,
    chance: () => value < 0.5,
    pick: <T>(items: readonly T[]) => items[0],
    weighted: <T>(items: readonly T[]) => items[0],
    gauss: () => 0,
    shuffle: <T>(items: T[]) => items,
  } as unknown as Rng;
}

describe('staff hiring', () => {
  it('has unique ids and escalating prices', () => {
    expect(new Set(STAFF.map((d) => d.id)).size).toBe(STAFF.length);
    const coach = STAFF.find((d) => d.id === 'coach')!;
    expect(staffPrice(coach, 1, 1)).toBeGreaterThan(staffPrice(coach, 0, 1));
  });

  it('only hires unlocked staff and deducts cash', () => {
    const s = createNewGame(0, 3);
    s.cash = 1e9;
    expect(hireStaff(s, 'coach', 1)).toBe(0);
    s.stats.playersSigned = 1;
    expect(hireStaff(s, 'coach', 5)).toBe(5);
    expect(s.staff.coach).toBe(5);
    expect(s.cash).toBeLessThan(1e9);
    expect(s.stats.staffHired).toBe(5);
  });

  it('coaches raise ratings and analysts weaken opponents', () => {
    const s = createNewGame(0, 3);
    const before = computeRates(s).teams.smash;
    s.staff.coach = 20;
    s.staff.analyst = 20;
    const after = computeRates(s).teams.smash;
    expect(after.rating).toBeGreaterThan(before.rating);
    expect(after.opponent).toBeLessThan(before.opponent);
    expect(after.winChance).toBeGreaterThan(before.winChance);
  });

  it('chefs speed up energy recovery', () => {
    const slow = createNewGame(0, 3);
    const fast = createNewGame(0, 3);
    fast.staff.chef = 40;
    slow.players.founder.energy = 20;
    fast.players.founder.energy = 20;
    updatePlayers(slow, 10, computeMods(slow));
    updatePlayers(fast, 10, computeMods(fast));
    expect(fast.players.founder.energy).toBeGreaterThan(slow.players.founder.energy);
  });
});

describe('health', () => {
  it('chefs, physios and chairs lower illness and injury chances', () => {
    const s = createNewGame(0, 3);
    const p = s.players.founder;
    const base = healthChances(p, computeMods(s));
    s.staff.chef = 30;
    s.staff.physio = 30;
    p.gear.chair = 5;
    const improved = healthChances(p, computeMods(s));
    expect(improved.sick).toBeLessThan(base.sick);
    expect(improved.injured).toBeLessThan(base.injured);
  });

  it('a bad roll sidelines a player and a bench player subs in', () => {
    const s = createNewGame(0, 3);
    s.cash = 1e9;
    refreshMarket(s, fixedRng(0.9), { scoutLuck: 0, marketSize: 6 });
    const sub = s.market.listings.find((l) => l.player.gameId === 'smash');
    expect(sub).toBeDefined();
    expect(signListing(s, sub!.player.id, computeMods(s)).ok).toBe(true);

    const founder = s.players.founder;
    expect(rollHealth(s, founder, computeMods(s), fixedRng(0), true)).toBe('sick');
    expect(isAvailable(founder, s.time)).toBe(false);
    expect(s.stats.illnesses).toBe(1);

    expect(autoSubstitute(s, s.teams.smash)).toBe(true);
    expect(s.teams.smash.lineup[0]).toBe(sub!.player.id);

    // Recovery is on a timer. Step straight past it without playing matches, so a fresh random
    // illness later in the window cannot make this depend on the RNG sequence.
    s.time = founder.status.until + 1;
    updatePlayers(s, 1, computeMods(s));
    expect(founder.status.kind).toBe('healthy');
    expect(isAvailable(founder, s.time)).toBe(true);
  });

  it('a lucky roll changes nothing', () => {
    const s = createNewGame(0, 3);
    expect(rollHealth(s, s.players.founder, computeMods(s), fixedRng(0.999), false)).toBeNull();
    expect(s.players.founder.status.kind).toBe('healthy');
  });
});

describe('gaming house', () => {
  it('moves into bigger rooms as the org earns', () => {
    const s = createNewGame(0, 3);
    expect(roomLevel(s)).toBe(0);
    s.earnedRun = ROOMS[2].threshold;
    expect(roomLevel(s)).toBe(2);
  });

  it('decor needs enough room and cash, and applies its bonus', () => {
    const s = createNewGame(0, 3);
    const fridge = DECOR.find((d) => d.id === 'fridge')!;
    s.cash = 1e9;
    expect(buyDecor(s, 'fridge')).toBe(false);
    s.earnedRun = ROOMS[fridge.room].threshold;
    const before = computeMods(s).energyRecoveryMult;
    expect(buyDecor(s, 'fridge')).toBe(true);
    expect(buyDecor(s, 'fridge')).toBe(false);
    expect(computeMods(s).energyRecoveryMult).toBeGreaterThan(before);
  });
});
