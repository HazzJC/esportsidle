import { describe, expect, it } from 'vitest';
import { TRAITS } from '../src/data/traits';
import { GEAR_SLOTS } from '../src/data/gear';
import { getGame } from '../src/data/games';
import { opponentRating, winChance } from '../src/data/leagues';
import { computeMods, computeRates } from '../src/engine/economy';
import { advance } from '../src/engine/game';
import { refreshMarket, sellPlayer, signListing } from '../src/engine/market';
import { buyGear, generatePlayer, gearUpgradeCost, grantXp, skillRating } from '../src/engine/players';
import { Rng } from '../src/engine/rng';
import { decodeSave, encodeSave } from '../src/engine/save';
import { createBaseState, createNewGame } from '../src/engine/state';
import { assignSlot, changeTier, endSeason, evaluateTeam, unlockGame } from '../src/engine/teams';

describe('player generation', () => {
  it('is deterministic for a seed', () => {
    const a = generatePlayer(new Rng({ rng: 99 }), { id: 'x', gameId: 'counter', time: 0 });
    const b = generatePlayer(new Rng({ rng: 99 }), { id: 'x', gameId: 'counter', time: 0 });
    expect(a).toEqual(b);
  });

  it('produces valid players', () => {
    const rng = new Rng({ rng: 7 });
    for (let i = 0; i < 200; i++) {
      const p = generatePlayer(rng, { id: `p${i}`, gameId: 'lanes', time: 0 });
      expect(p.traits.length).toBeGreaterThan(0);
      expect(new Set(p.traits).size).toBe(p.traits.length);
      expect(p.traits.every((t) => TRAITS.some((d) => d.id === t))).toBe(true);
      expect(p.role).toBeGreaterThanOrEqual(0);
      expect(p.role).toBeLessThan(5);
      expect(p.potential).toBeGreaterThanOrEqual(Math.max(...Object.values(p.stats)));
      expect(p.cut).toBeGreaterThan(0);
    }
  });

  it('levels up and grows stats up to potential', () => {
    const rng = new Rng({ rng: 3 });
    const p = generatePlayer(rng, { id: 'p', gameId: 'smash', time: 0, rarity: 'rookie' });
    const before = Object.values(p.stats).reduce((a, b) => a + b, 0);
    const levels = grantXp(p, 5000, rng);
    expect(levels).toBeGreaterThan(5);
    const after = Object.values(p.stats).reduce((a, b) => a + b, 0);
    expect(after).toBeGreaterThan(before);
    expect(Math.max(...Object.values(p.stats))).toBeLessThanOrEqual(p.potential);
  });
});

describe('ratings and gear', () => {
  it('gear raises rating and gets more expensive', () => {
    const s = createNewGame(0, 11);
    const founder = s.players.founder;
    const mods = computeMods(s);
    const base = skillRating(founder);
    s.cash = 1e9;
    for (const slot of GEAR_SLOTS) {
      const c1 = gearUpgradeCost(founder, slot.id, mods);
      expect(buyGear(s, 'founder', slot.id, mods)).toBe(true);
      expect(gearUpgradeCost(founder, slot.id, mods)).toBeGreaterThan(c1);
    }
    expect(skillRating(founder)).toBeGreaterThan(base * 1.2);
  });

  it('win chance is even at equal ratings and rises with rating', () => {
    expect(winChance(100, 100)).toBeCloseTo(0.5);
    expect(winChance(200, 100)).toBeGreaterThan(0.8);
    expect(opponentRating(1)).toBeGreaterThan(opponentRating(0));
  });
});

describe('teams and matches', () => {
  it('starts with an active solo team', () => {
    const s = createNewGame(0, 5);
    const r = computeRates(s);
    expect(r.teams.smash.active).toBe(true);
    expect(r.teams.smash.winChance).toBeGreaterThan(0.5);
    expect(r.matchCps).toBeGreaterThan(0);
  });

  it('plays matches over time and records history', () => {
    const s = createNewGame(0, 5);
    advance(s, 120);
    const team = s.teams.smash;
    expect(team.wins + team.losses).toBeGreaterThanOrEqual(7);
    expect(team.history.length).toBeGreaterThan(0);
    expect(s.cash).toBeGreaterThan(0);
    expect(s.players.founder.matches).toBe(team.wins + team.losses);
  });

  it('keeps a solo starter from burning out completely', () => {
    const s = createNewGame(0, 5);
    advance(s, 600);
    expect(s.players.founder.energy).toBeGreaterThan(40);
  });

  it('promotes after a strong season and relegates after a poor one', () => {
    const s = createNewGame(0, 5);
    const team = s.teams.smash;
    const ev = computeRates(s).teams.smash;
    team.seasonWins = 8;
    team.seasonPlayed = 10;
    endSeason(s, team, ev);
    expect(team.tier).toBe(1);
    team.seasonWins = 1;
    endSeason(s, team, ev);
    expect(team.tier).toBe(0);
    expect(changeTier(s, 'smash', 1)).toBe(true);
    expect(changeTier(s, 'smash', 5)).toBe(false);
  });

  it('empty teams do not play', () => {
    const s = createNewGame(0, 5);
    s.cash = 1e6;
    expect(unlockGame(s, 'rocket')).toBe(true);
    const ev = evaluateTeam(s, s.teams.rocket, computeMods(s), { cpsNoBuffs: 0, incomeBuff: 1, fansMult: 1 });
    expect(ev.active).toBe(false);
    expect(ev.cps).toBe(0);
  });

  it('requires unlocking games in order', () => {
    const s = createNewGame(0, 5);
    s.cash = 1e30;
    expect(unlockGame(s, 'counter')).toBe(false);
    expect(unlockGame(s, 'rocket')).toBe(true);
    expect(unlockGame(s, 'counter')).toBe(true);
  });
});

describe('transfer market', () => {
  it('signs players into open slots and respects capacity', () => {
    const s = createNewGame(0, 21);
    s.cash = 1e12;
    unlockGame(s, 'rocket');
    const mods = computeMods(s);
    refreshMarket(s, new Rng(s), { scoutLuck: 0, marketSize: 10 });
    const rocketListings = () => s.market.listings.filter((l) => l.player.gameId === 'rocket');
    let signed = 0;
    while (rocketListings().length > 0 && signed < 10) {
      const result = signListing(s, rocketListings()[0].player.id, mods);
      if (!result.ok) break;
      signed++;
    }
    const team = s.teams.rocket;
    const filled = team.lineup.filter(Boolean).length + team.bench.length;
    expect(filled).toBe(Math.min(signed, getGame('rocket').teamSize + mods.benchSlots));
    expect(filled).toBeLessThanOrEqual(4);
  });

  it('sells players for part of their fee but never the founder', () => {
    const s = createNewGame(0, 21);
    s.cash = 1e9;
    const listing = s.market.listings.find((l) => l.player.gameId === 'smash')!;
    const result = signListing(s, listing.player.id, computeMods(s));
    expect(result.ok).toBe(true);
    const cashBefore = s.cash;
    expect(sellPlayer(s, listing.player.id)).toBeGreaterThan(0);
    expect(s.cash).toBeGreaterThan(cashBefore);
    expect(s.players[listing.player.id]).toBeUndefined();
    expect(sellPlayer(s, 'founder')).toBe(0);
  });

  it('can move bench players into the lineup', () => {
    const s = createNewGame(0, 21);
    s.cash = 1e9;
    const listing = s.market.listings.find((l) => l.player.gameId === 'smash')!;
    signListing(s, listing.player.id, computeMods(s));
    expect(s.teams.smash.bench).toContain(listing.player.id);
    expect(assignSlot(s, 'smash', listing.player.id, 0)).toBe(true);
    expect(s.teams.smash.lineup[0]).toBe(listing.player.id);
    expect(s.teams.smash.bench).toContain('founder');
  });
});

describe('save migration', () => {
  it('upgrades a v1 save with no players by creating the founder', () => {
    const v1 = createBaseState(0, 1) as unknown as Record<string, unknown>;
    delete v1.players;
    delete v1.teams;
    delete v1.games;
    delete v1.market;
    v1.version = 1;
    const text = encodeSave(v1 as never).replace(/^ESI\d+/, 'ESI1');
    const s = decodeSave(text);
    expect(s.players.founder).toBeDefined();
    expect(s.teams.smash.lineup[0]).toBe('founder');
    expect(s.games.smash.unlocked).toBe(true);
  });
});
