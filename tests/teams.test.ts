import { describe, expect, it } from 'vitest';
import { TRAITS } from '../src/data/traits';
import { GEAR_INCOME_FLOOR_SECONDS, GEAR_SLOTS } from '../src/data/gear';
import { getGame } from '../src/data/games';
import { SEASON_LENGTH, opponentRating, winChance } from '../src/data/leagues';
import { addBuff } from '../src/engine/buffs';
import { canPromote, promotionElo, relegationElo, tierElo } from '../src/engine/elo';
import { computeMods, computeRates } from '../src/engine/economy';
import { advance } from '../src/engine/game';
import { refreshMarket, sellPlayer, signListing } from '../src/engine/market';
import { buyGear, gearPrice, generatePlayer, gearUpgradeCost, grantXp, skillRating, teamIncome } from '../src/engine/players';
import { Rng } from '../src/engine/rng';
import { decodeSave, encodeSave } from '../src/engine/save';
import { createBaseState } from '../src/engine/state';
import { foundedGame } from './fixtures';
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
    const s = foundedGame(0, 11);
    const founder = s.players.founder;
    const mods = computeMods(s);
    const base = skillRating(founder);
    s.cash = 1e9;
    for (const slot of GEAR_SLOTS) {
      const c1 = gearUpgradeCost(founder, slot.id, mods, 0);
      expect(buyGear(s, 'founder', slot.id, mods, computeRates(s, mods))).toBe(true);
      expect(gearUpgradeCost(founder, slot.id, mods, 0)).toBeGreaterThan(c1);
    }
    expect(skillRating(founder)).toBeGreaterThan(base * 1.2);
  });

  it('never prices gear below half a minute of what the team earns at base income', () => {
    const s = foundedGame(0, 11);
    const founder = s.players.founder;
    const mods = computeMods(s);
    const byLeague = gearUpgradeCost(founder, 'pc', mods, 0);
    // A poor team: the league price stands.
    expect(gearUpgradeCost(founder, 'pc', mods, 0, 1)).toBe(byLeague);
    // A team earning far more than its gear costs: the floor takes over.
    const income = byLeague * 1000;
    expect(gearUpgradeCost(founder, 'pc', mods, 0, income)).toBe(Math.ceil(GEAR_INCOME_FLOOR_SECONDS * income * mods.gearCostMult));
  });

  it('measures gear against base income, so hype, popularity and injuries never move the price', () => {
    const s = foundedGame(0, 11);
    s.ops.grinder.owned = 400;
    s.priceIncome = computeRates(s).cpsNoBuffs;
    const founder = s.players.founder;
    const mods = computeMods(s);
    const rates = computeRates(s, mods);
    const base = teamIncome(s, 'smash', mods, rates);
    expect(base).toBeGreaterThan(0);
    const price = gearPrice(s, founder, 'pc', mods, rates);
    // A hype streak, a popularity crash and an injured starter: the price stays put.
    addBuff(s, { id: 'x', name: 'x', icon: 'x', tone: 'good', desc: '', duration: 60, effects: [{ kind: 'income', mult: 10 }] });
    s.games.smash.popularity = 0.25;
    founder.status = { kind: 'injured', until: s.time + 600, reason: 'test' };
    const during = computeRates(s, computeMods(s));
    expect(during.cps).toBeGreaterThan(rates.cps);
    expect(teamIncome(s, 'smash', mods, during)).toBe(base);
    expect(gearPrice(s, founder, 'pc', mods, during)).toBe(price);
  });

  it('win chance is even at equal ratings and rises with rating', () => {
    expect(winChance(100, 100)).toBeCloseTo(0.5);
    expect(winChance(200, 100)).toBeGreaterThan(0.8);
    expect(opponentRating(1)).toBeGreaterThan(opponentRating(0));
  });
});

describe('teams and matches', () => {
  it('starts with an active solo team', () => {
    const s = foundedGame(0, 5);
    const r = computeRates(s);
    expect(r.teams.smash.active).toBe(true);
    expect(r.teams.smash.winChance).toBeGreaterThan(0.5);
    expect(r.matchCps).toBeGreaterThan(0);
  });

  it('plays matches over time and records history', () => {
    const s = foundedGame(0, 5);
    advance(s, 120);
    const team = s.teams.smash;
    expect(team.wins + team.losses).toBeGreaterThanOrEqual(7);
    expect(team.history.length).toBeGreaterThan(0);
    expect(s.cash).toBeGreaterThan(0);
    expect(s.players.founder.matches).toBe(team.wins + team.losses);
  });

  it('keeps a solo starter from burning out completely', () => {
    const s = foundedGame(0, 5);
    advance(s, 600);
    expect(s.players.founder.energy).toBeGreaterThan(40);
  });

  it('promotes once Elo has shown the team belongs a tier up, whatever its record, and relegates when Elo falls well behind', () => {
    const s = foundedGame(0, 5);
    const team = s.teams.smash;
    const ev = computeRates(s).teams.smash;
    // A middling record but a high Elo: promoted. Elo, not wins, decides.
    team.seasonWins = 8;
    team.seasonPlayed = SEASON_LENGTH;
    team.elo = promotionElo(0) - 1;
    endSeason(s, team, ev);
    expect(team.tier).toBe(0);
    team.seasonWins = 8;
    team.elo = promotionElo(0);
    endSeason(s, team, ev);
    expect(team.tier).toBe(1);
    // Far behind the new tier: back down.
    team.elo = relegationElo(1) - 1;
    endSeason(s, team, ev);
    expect(team.tier).toBe(0);
    // No relegation from the bottom tier, and no relegation while Elo holds up.
    team.elo = 0;
    endSeason(s, team, ev);
    expect(team.tier).toBe(0);
    team.tier = 1;
    team.elo = tierElo(1);
    endSeason(s, team, ev);
    expect(team.tier).toBe(1);
  });

  it('only lets a team challenge up a new tier once its Elo qualifies', () => {
    const s = foundedGame(0, 5);
    const team = s.teams.smash;
    team.elo = promotionElo(0) - 5;
    expect(canPromote(team)).toBe(false);
    expect(changeTier(s, 'smash', 1)).toBe(false);
    team.elo = promotionElo(0);
    expect(changeTier(s, 'smash', 1)).toBe(true);
    expect(changeTier(s, 'smash', 1)).toBe(false);
    expect(changeTier(s, 'smash', -1)).toBe(true);
    // Back up to a tier it has already reached is always allowed.
    expect(changeTier(s, 'smash', 1)).toBe(true);
  });

  it('prize multipliers cover the income-linked share, which is nearly all of a prize', () => {
    const s = foundedGame(0, 5);
    const mods = computeMods(s);
    const ctx = { cpsNoBuffs: 1e9, incomeBuff: 1, fansMult: 1 };
    const plain = evaluateTeam(s, s.teams.smash, mods, ctx);
    const boosted = evaluateTeam(s, s.teams.smash, { ...mods, prizeMult: 2 }, ctx);
    // The flat tier prize is tiny next to a 1e9 income share. A multiplier that skipped the share
    // paid nothing (the whole Prize line used to be dead), so it must double the payout.
    expect(boosted.winPrize / plain.winPrize).toBeCloseTo(2, 6);
    const event = evaluateTeam(s, s.teams.smash, { ...mods, gamePrizeMult: { smash: 1.5 } }, ctx);
    expect(event.winPrize / plain.winPrize).toBeCloseTo(1.5, 6);
  });

  it('empty teams do not play', () => {
    const s = foundedGame(0, 5);
    s.cash = 1e6;
    expect(unlockGame(s, 'rocket')).toBe(true);
    const ev = evaluateTeam(s, s.teams.rocket, computeMods(s), { cpsNoBuffs: 0, incomeBuff: 1, fansMult: 1 });
    expect(ev.active).toBe(false);
    expect(ev.cps).toBe(0);
  });

  it('requires unlocking games in order', () => {
    const s = foundedGame(0, 5);
    s.cash = 1e30;
    expect(unlockGame(s, 'counter')).toBe(false);
    expect(unlockGame(s, 'rocket')).toBe(true);
    expect(unlockGame(s, 'counter')).toBe(true);
  });
});

describe('transfer market', () => {
  it('signs players into open slots and respects capacity', () => {
    const s = foundedGame(0, 21);
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
    const s = foundedGame(0, 21);
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
    const s = foundedGame(0, 21);
    s.cash = 1e9;
    const listing = s.market.listings.find((l) => l.player.gameId === 'smash')!;
    signListing(s, listing.player.id, computeMods(s));
    expect(s.teams.smash.bench).toContain(listing.player.id);
    expect(assignSlot(s, 'smash', listing.player.id, 0)).toBe(true);
    expect(s.teams.smash.lineup[0]).toBe(listing.player.id);
    expect(s.teams.smash.bench).toContain('founder');
  });
});
