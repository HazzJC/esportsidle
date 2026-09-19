import { describe, expect, it } from 'vitest';
import { GEAR_SLOTS } from '../src/data/gear';
import { UPGRADES } from '../src/data/upgrades';
import { applyDropOutcome, clickDrop, dramaShare, spawnDrop, updateDrops } from '../src/engine/drops';
import { computeMods, computeRates } from '../src/engine/economy';
import { refreshMarket, signListing } from '../src/engine/market';
import { levelUpOperation } from '../src/engine/operations';
import { gearUpgradeCost } from '../src/engine/players';
import { Rng } from '../src/engine/rng';
import { foundedGame } from './fixtures';
import { runTournament } from '../src/engine/tournament';
import { unlockGame } from '../src/engine/teams';
import type { GameState } from '../src/engine/types';
import { WORLD_EVENTS, fireEvent, offerChoice, resolveChoice, updateWorldEvents } from '../src/engine/worldEvents';

function ctxFor(s: GameState) {
  const mods = computeMods(s);
  return { rng: new Rng(s), mods, rates: computeRates(s, mods) };
}

/** A mid-game state with several players, operations and a ranked team. */
function richState(): GameState {
  const s = foundedGame(0, 17);
  s.cash = 1e12;
  s.ops.streamer.owned = 30;
  s.ops.creator.owned = 12;
  s.fans = 10_000;
  unlockGame(s, 'rocket');
  refreshMarket(s, new Rng(s), { scoutLuck: 0, marketSize: 12 });
  for (const listing of [...s.market.listings]) signListing(s, listing.player.id, computeMods(s));
  s.teams.smash.tier = 3;
  s.teams.smash.bestTier = 3;
  for (const p of Object.values(s.players)) p.gear.mouse = 5;
  return s;
}

describe('hype drops', () => {
  it('schedules, spawns and expires drops', () => {
    const s = foundedGame(0, 9);
    updateDrops(s, ctxFor(s));
    expect(s.drops.nextAt).toBeGreaterThan(0);
    s.time = s.drops.nextAt;
    updateDrops(s, ctxFor(s));
    expect(s.drops.active).toHaveLength(1);
    s.time = s.drops.active[0].expiresAt + 0.1;
    updateDrops(s, ctxFor(s));
    expect(s.drops.active).toHaveLength(0);
    expect(s.stats.dropsMissed).toBe(1);
  });

  it('clicking a drop resolves it once', () => {
    const s = richState();
    const drop = spawnDrop(s, ctxFor(s));
    const result = clickDrop(s, drop.id, ctxFor(s));
    expect(result).not.toBeNull();
    expect(s.stats.dropsClicked + s.stats.dramaClicked).toBe(1);
    expect(clickDrop(s, drop.id, ctxFor(s))).toBeNull();
  });

  it('every outcome can be applied', () => {
    for (const id of ['frenzy', 'prize', 'clutch', 'viral', 'rush', 'train', 'tournament', 'scandal', 'outage', 'ragebait', 'leak', 'backlash']) {
      const s = richState();
      expect(() => applyDropOutcome(s, id, ctxFor(s))).not.toThrow();
    }
  });

  it('LAN Frenzy multiplies income and Prize Pool pays out', () => {
    const s = richState();
    const before = computeRates(s).cps;
    applyDropOutcome(s, 'frenzy', ctxFor(s));
    expect(computeRates(s).cps).toBeCloseTo(before * 7);
    const cash = s.cash;
    applyDropOutcome(s, 'prize', ctxFor(s));
    expect(s.cash).toBeGreaterThan(cash);
  });

  it('drama drops only appear after drama upgrades', () => {
    const s = foundedGame(0, 9);
    expect(dramaShare(s, computeMods(s))).toBe(0);
    s.upgrades.drama_0 = 0;
    expect(dramaShare(s, computeMods(s))).toBeCloseTo(0.33);
    s.events.calmUntil = s.time + 100;
    expect(dramaShare(s, computeMods(s))).toBe(0);
  });
});

describe('tournaments', () => {
  it('a dominant team wins and earns trophies', () => {
    const s = foundedGame(0, 21);
    const founder = s.players.founder;
    for (const slot of GEAR_SLOTS) founder.gear[slot.id] = 15;
    const result = runTournament(s, ctxFor(s));
    expect(result.champion).toBe(true);
    expect(result.rounds).toHaveLength(3);
    expect(s.trophies).toBeGreaterThanOrEqual(2);
    expect(s.stats.tournamentsWon).toBe(1);
    expect(s.events.lastTournament?.id).toBe(result.id);
  });

  it('a hopeless team is knocked out early', () => {
    const s = foundedGame(0, 21);
    for (const key of Object.keys(s.players.founder.stats)) s.players.founder.stats[key as keyof typeof s.players.founder.stats] = 1;
    s.teams.smash.tier = 12;
    const result = runTournament(s, ctxFor(s));
    expect(result.champion).toBe(false);
    expect(result.rounds.length).toBeLessThan(3);
    expect(result.trophies).toBe(0);
  });
});

describe('world events', () => {
  it('every event can fire in a rich state', () => {
    let fired = 0;
    for (const def of WORLD_EVENTS) {
      const s = richState();
      expect(() => (fireEvent(s, def.id, ctxFor(s)) ? fired++ : 0)).not.toThrow();
    }
    expect(fired).toBeGreaterThanOrEqual(WORLD_EVENTS.length - 2);
  });

  it('the poaching choice can sell a player', () => {
    const s = richState();
    expect(fireEvent(s, 'poaching', ctxFor(s))).toBe(true);
    const choice = s.events.pending[0];
    const playerId = String(choice.data.playerId);
    const cash = s.cash;
    expect(resolveChoice(s, choice.id, 0, ctxFor(s))).toBe(true);
    expect(s.players[playerId]).toBeUndefined();
    expect(s.cash).toBeGreaterThan(cash);
    expect(s.stats.choicesMade).toBe(1);
  });

  it('unanswered choices resolve to their default', () => {
    const s = richState();
    const p = Object.values(s.players).find((x) => !x.founder)!;
    const morale = p.morale;
    offerChoice(s, {
      eventId: 'contract',
      title: 't',
      body: 'b',
      icon: 'x',
      defaultOption: 1,
      data: { playerId: p.id },
      options: [
        { label: 'a', desc: '', tone: 'good' },
        { label: 'b', desc: '', tone: 'bad' },
      ],
    });
    s.time += 1000;
    s.events.nextAt = s.time + 1000;
    updateWorldEvents(s, ctxFor(s));
    expect(s.events.pending).toHaveLength(0);
    expect(p.morale).toBeLessThan(morale);
    expect(s.stats.choicesMade).toBe(0);
  });

  it('a flash sale lowers gear prices until it expires', () => {
    const s = richState();
    const p = s.players.founder;
    const before = gearUpgradeCost(p, 'pc', computeMods(s));
    fireEvent(s, 'gear_sale', ctxFor(s));
    expect(gearUpgradeCost(p, 'pc', computeMods(s))).toBeLessThan(before);
    s.time += 1000;
    s.events.nextAt = s.time + 1000;
    updateWorldEvents(s, ctxFor(s));
    expect(gearUpgradeCost(p, 'pc', computeMods(s))).toBe(before);
  });
});

describe('trophies', () => {
  it('level up operations for +1% each', () => {
    const s = foundedGame(0, 4);
    s.ops.grinder.owned = 10;
    s.teams.smash.lineup = [null];
    const before = computeRates(s).cps;
    expect(levelUpOperation(s, 'grinder')).toBe(false);
    s.trophies = 3;
    expect(levelUpOperation(s, 'grinder')).toBe(true);
    expect(levelUpOperation(s, 'grinder')).toBe(true);
    expect(s.trophies).toBe(0);
    expect(s.ops.grinder.level).toBe(2);
    expect(computeRates(s).cps).toBeCloseTo(before * 1.02);
  });

  it('trophy upgrades are priced in trophies', () => {
    const trophyUpgrades = UPGRADES.filter((u) => u.group === 'trophy');
    expect(trophyUpgrades.length).toBeGreaterThan(0);
    expect(trophyUpgrades.every((u) => u.currency === 'trophies')).toBe(true);
  });
});
