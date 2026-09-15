import { describe, expect, it } from 'vitest';
import { CHALLENGES, LEGACY_NODES } from '../src/data/legacy';
import { addDesign, generateDesign, setOrgLogo } from '../src/engine/designs';
import { spawnDrop, updateDrops } from '../src/engine/drops';
import { computeMods, computeRates } from '../src/engine/economy';
import { refreshMarket, signListing } from '../src/engine/market';
import { buyGear } from '../src/engine/players';
import {
  LEGACY_DIVISOR,
  buyNode,
  canSell,
  checkChallenge,
  legacyFor,
  nodeState,
  pendingLegacy,
  sellOrg,
} from '../src/engine/prestige';
import { Rng } from '../src/engine/rng';
import { decodeSave, encodeSave } from '../src/engine/save';
import { hireStaff } from '../src/engine/staff';
import { createNewGame } from '../src/engine/state';
import { hasRosterSpace, unlockGame } from '../src/engine/teams';
import type { GameState } from '../src/engine/types';

function wealthy(level = 3): GameState {
  const s = createNewGame(0, 31);
  s.earnedTotal = Math.pow(level, 3) * LEGACY_DIVISOR;
  s.earnedRun = s.earnedTotal;
  return s;
}

describe('legacy points', () => {
  it('follow a cube-root curve', () => {
    expect(legacyFor(0)).toBe(0);
    expect(legacyFor(LEGACY_DIVISOR)).toBe(1);
    expect(legacyFor(8 * LEGACY_DIVISOR)).toBe(2);
    expect(legacyFor(1000 * LEGACY_DIVISOR)).toBe(10);
  });

  it('only count earnings beyond levels already banked', () => {
    const s = wealthy(4);
    expect(pendingLegacy(s)).toBe(4);
    s.prestige.level = 3;
    expect(pendingLegacy(s)).toBe(1);
    s.prestige.level = 4;
    expect(canSell(s)).toBe(false);
  });

  it('legacy levels boost income by 1% each', () => {
    const s = createNewGame(0, 2);
    s.ops.grinder.owned = 20;
    s.teams.smash.lineup = [null];
    const before = computeRates(s).cps;
    s.prestige.level = 50;
    expect(computeRates(s).cps).toBeCloseTo(before * 1.5);
  });
});

describe('the legacy tree', () => {
  it('has unique ids and valid parents', () => {
    const ids = new Set(LEGACY_NODES.map((n) => n.id));
    expect(ids.size).toBe(LEGACY_NODES.length);
    for (const n of LEGACY_NODES) for (const r of n.requires) expect(ids.has(r)).toBe(true);
    expect(LEGACY_NODES.filter((n) => n.requires.length === 0)).toHaveLength(1);
  });

  it('requires parents and points', () => {
    const s = createNewGame(0, 2);
    expect(buyNode(s, 'legacy')).toBe(false);
    s.prestige.points = 10;
    expect(nodeState(s, 'income_1')).toBe('locked');
    expect(buyNode(s, 'income_1')).toBe(false);
    expect(buyNode(s, 'legacy')).toBe(true);
    expect(nodeState(s, 'income_1')).toBe('available');
    expect(buyNode(s, 'income_1')).toBe(true);
    expect(s.prestige.points).toBe(4);
    expect(s.prestige.spent).toBe(6);
  });
});

describe('selling the org', () => {
  it('resets the run but keeps long-term progress', () => {
    const s = wealthy(3);
    s.cash = 5e12;
    s.ops.streamer.owned = 100;
    s.ops.streamer.level = 4;
    s.trophies = 12;
    s.upgrades.grind_0 = 0;
    s.upgrades.trophy_0 = 0;
    s.achievements.earn_0 = 1;
    s.staff.coach = 10;
    s.org.name = 'Legacy Gaming';
    const designId = addDesign(s, generateDesign(new Rng({ rng: 4 }), 32, 'Crest'))!;
    setOrgLogo(s, designId);
    s.players.founder.tag = 'FounderTag';
    const founderLook = { ...s.players.founder.look };

    const entry = sellOrg(s)!;
    expect(entry.legacyGained).toBe(3);
    expect(entry.orgName).toBe('Legacy Gaming');
    expect(s.prestige.level).toBe(3);
    expect(s.prestige.points).toBe(3);
    expect(s.prestige.hallOfFame).toHaveLength(1);

    expect(s.cash).toBe(0);
    expect(s.earnedRun).toBe(0);
    expect(s.ops.streamer.owned).toBe(0);
    expect(s.ops.streamer.level).toBe(4);
    expect(s.staff.coach).toBe(0);
    expect(s.upgrades.grind_0).toBeUndefined();
    expect(s.upgrades.trophy_0).toBeDefined();
    expect(s.trophies).toBe(12);
    expect(s.achievements.earn_0).toBe(1);
    expect(s.designs[designId]).toBeDefined();
    expect(s.org.logo).toBe(designId);
    expect(s.players.founder.tag).toBe('FounderTag');
    expect(s.players.founder.look).toEqual(founderLook);
    expect(s.teams.smash.lineup[0]).toBe('founder');
    expect(s.market.listings.length).toBeGreaterThan(0);
    expect(s.stats.orgsSold).toBe(1);
    expect(canSell(s)).toBe(false);
  });

  it('refuses to sell without pending legacy', () => {
    const s = createNewGame(0, 2);
    expect(sellOrg(s)).toBeNull();
  });

  it('applies starting bonuses from the tree', () => {
    const s = wealthy(5);
    s.prestige.points = 1000;
    for (const id of ['legacy', 'start_cash_1', 'start_cash_2', 'start_ops', 'teams_1', 'start_rocket', 'start_counter', 'staff_start']) {
      expect(buyNode(s, id)).toBe(true);
    }
    sellOrg(s);
    expect(s.cash).toBe(1e6);
    expect(s.ops.grinder.owned).toBe(25);
    expect(s.games.rocket.unlocked).toBe(true);
    expect(s.games.counter.unlocked).toBe(true);
    expect(s.teams.counter).toBeDefined();
    expect(s.staff.coach).toBe(5);
  });

  it('keeps a franchise player and retires a legend', () => {
    const s = wealthy(5);
    s.prestige.points = 1000;
    for (const id of ['legacy', 'teams_1', 'scouting', 'keep_player', 'legends']) expect(buyNode(s, id)).toBe(true);
    s.cash = 1e15;
    unlockGame(s, 'rocket');
    refreshMarket(s, new Rng(s), { scoutLuck: 0, marketSize: 12 });
    const mods = computeMods(s);
    for (const l of [...s.market.listings]) signListing(s, l.player.id, mods);
    const rocketPlayers = Object.values(s.players).filter((p) => p.gameId === 'rocket');
    const smashPlayer = Object.values(s.players).find((p) => p.gameId === 'smash' && !p.founder);
    expect(rocketPlayers.length).toBeGreaterThan(0);
    const keep = rocketPlayers[0];
    keep.gear.pc = 7;
    keep.level = 20;
    const retire = smashPlayer ?? rocketPlayers[1];
    expect(retire).toBeDefined();

    const entry = sellOrg(s, { keepPlayerId: keep.id, retirePlayerId: retire.id })!;
    expect(entry.kept).toBe(keep.tag);
    expect(entry.retired).toBe(retire.tag);
    expect(s.prestige.legends).toHaveLength(1);
    // Rocket isn't unlocked in the new run, so the kept player waits in reserve.
    expect(s.prestige.reserve.map((p) => p.id)).toContain(keep.id);
    s.cash = 1e6;
    expect(unlockGame(s, 'rocket')).toBe(true);
    expect(s.players[keep.id]).toBeDefined();
    expect(s.players[keep.id].gear.pc).toBe(0);
    expect(s.players[keep.id].level).toBe(20);
    expect(s.prestige.reserve).toHaveLength(0);
    expect(computeMods(s).gameRatingMult[retire.gameId]).toBeCloseTo(1.05);
  });

  it('prestige state survives a save round trip', () => {
    const s = wealthy(2);
    sellOrg(s);
    const loaded = decodeSave(encodeSave(s));
    expect(loaded.prestige.level).toBe(2);
    expect(loaded.prestige.hallOfFame[0].orgName).toBe(s.org.name);
  });
});

describe('challenges', () => {
  function challengeRun(id: string): GameState {
    const s = wealthy(2);
    s.prestige.points = 100;
    buyNode(s, 'legacy');
    buyNode(s, 'challenges');
    sellOrg(s, { challenge: id });
    expect(s.prestige.challenge).toBe(id);
    return s;
  }

  it('Potato League blocks gear', () => {
    const s = challengeRun('potato');
    s.cash = 1e9;
    expect(buyGear(s, 'founder', 'pc', computeMods(s))).toBe(false);
  });

  it('Solo Queue allows one player per team', () => {
    const s = challengeRun('solo');
    expect(hasRosterSpace(s, 'smash', computeMods(s))).toBe(false);
    s.cash = 1e6;
    unlockGame(s, 'rocket');
    expect(hasRosterSpace(s, 'rocket', computeMods(s))).toBe(true);
  });

  it('Skeleton Crew blocks hiring', () => {
    const s = challengeRun('nostaff');
    s.cash = 1e9;
    s.stats.playersSigned = 5;
    expect(hireStaff(s, 'coach', 1)).toBe(0);
  });

  it('No Hype stops drops and Tabloid Darling makes them all drama', () => {
    const s = challengeRun('nodrops');
    const mods = computeMods(s);
    const ctx = { rng: new Rng(s), mods, rates: computeRates(s, mods) };
    updateDrops(s, ctx);
    s.time = s.drops.nextAt + 1;
    updateDrops(s, ctx);
    expect(s.drops.active).toHaveLength(0);

    const t = challengeRun('drama');
    const tmods = computeMods(t);
    const drop = spawnDrop(t, { rng: new Rng(t), mods: tmods, rates: computeRates(t, tmods) });
    expect(drop.kind).toBe('drama');
  });

  it('completing a challenge grants its permanent reward', () => {
    const s = challengeRun('solo');
    s.ops.grinder.owned = 10;
    s.teams.smash.lineup = [null];
    const before = computeRates(s).cps;
    s.earnedRun = 1e9;
    expect(checkChallenge(s)).toBe(true);
    expect(s.prestige.challenge).toBeNull();
    expect(s.prestige.challengesDone.solo).toBeDefined();
    expect(computeRates(s).cps).toBeCloseTo(before * 1.1);
    expect(CHALLENGES.length).toBe(5);
  });
});
