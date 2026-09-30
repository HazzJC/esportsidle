import { describe, expect, it } from 'vitest';
import { OPERATIONS } from '../src/data/operations';
import { autoOperations, autoRoster, runAutomation } from '../src/engine/automation';
import { computeMods } from '../src/engine/economy';
import { unitPrice } from '../src/engine/operations';
import { generatePlayer } from '../src/engine/players';
import { Rng } from '../src/engine/rng';
import { createBaseState } from '../src/engine/state';
import { autoSubstitute, createTeam, ensureTeam, updateTeams } from '../src/engine/teams';
import type { SponsorOffer, TeamEval } from '../src/engine/types';
import { foundedGame } from './fixtures';

describe('UI auto-action pauses', () => {
  it('respects pauseMarket option', () => {
    const s = foundedGame(0, 1);
    const team = ensureTeam(s, 'smash');
    team.lineup[0] = null;
    s.staff.scout = 10; // Unlocks roster automation
    s.cash = 1e6;
    s.automation.roster.on = true;
    s.automation.roster.maxCostPct = 1;
    const baseP = Object.values(s.players)[0];
    s.market.listings = [
      {
        player: { ...baseP, id: 'test_player', tag: 'NewGuy', gameId: 'smash' },
        price: 100,
      },
    ];
    const mods = computeMods(s);

    // With pauseMarket, player is not bought
    runAutomation(s, mods, { pauseMarket: true });
    expect(s.players.test_player).toBeUndefined();

    // Without pauseMarket, player is bought
    runAutomation(s, mods);
    expect(s.players.test_player).toBeDefined();
  });

  it('respects pauseGear option', () => {
    const s = foundedGame(0, 1);
    const team = ensureTeam(s, 'smash');
    const player = Object.values(s.players)[0];
    team.lineup[0] = player.id;
    s.staff.coach = 25; // Unlocks gear automation
    s.cash = 1e6;
    s.automation.gear.on = true;
    s.automation.gear.maxCostPct = 1;
    const initialGear = { ...player.gear };
    const mods = computeMods(s);

    // With pauseGear, no gear is bought
    runAutomation(s, mods, { pauseGear: true });
    expect(player.gear).toEqual(initialGear);

    // Without pauseGear, gear is bought
    runAutomation(s, mods);
    expect(player.gear.mouse).toBeGreaterThan(initialGear.mouse);
  });

  it('respects pauseTeams in updateTeams', () => {
    const s = foundedGame(0, 1);
    const team = ensureTeam(s, 'smash');
    s.staff.scout = 10;
    s.automation.roster.on = true;
    const player = Object.values(s.players)[0];
    // Empty the lineup and put player on bench
    team.lineup[0] = null;
    team.bench = [player.id];
    const mods = computeMods(s);
    const ev = {
      gameId: 'smash',
      active: false,
      cps: 0,
      fansPerSec: 0,
      rating: 10,
      opponent: 10,
      stakes: 1,
      cut: 0,
      filled: 1,
      available: 1,
      interval: 15,
      winChance: 0.5,
      winPrize: 10,
      lossPrize: 1,
      fansWin: 5,
    } as TeamEval;
    const teamEvals = { smash: ev };

    // With pauseTeams, autoSubstitute is not called
    updateTeams(s, 1, false, 1, mods, teamEvals, new Rng({ rng: 1 }), true);
    expect(team.lineup[0]).toBeNull();

    // Without pauseTeams, bench player fills slot
    updateTeams(s, 1, false, 1, mods, teamEvals, new Rng({ rng: 1 }), false);
    expect(team.lineup[0]).toBe(player.id);
  });
});

describe('lineup filler toggle bug', () => {
  it('keeps vacant slot empty when lineup filler (automation.roster) is toggled off', () => {
    const s = foundedGame(0, 1);
    const team = ensureTeam(s, 'smash');
    s.staff.scout = 10;
    s.automation.roster.on = false;
    const player = Object.values(s.players)[0];
    team.lineup[0] = null;
    team.bench = [player.id];

    autoSubstitute(s, team);
    expect(team.lineup[0]).toBeNull();

    // When turned back on, it substitutes
    s.automation.roster.on = true;
    autoSubstitute(s, team);
    expect(team.lineup[0]).toBe(player.id);
  });
});

describe('auto-buy sponsor tier filter bug', () => {
  it('strictly adheres to the chosen tier', () => {
    const s = foundedGame(0, 1);
    const team = ensureTeam(s, 'smash');
    team.bestTier = 5;
    s.fansRun = 1e9;
    s.staff.agent = 5; // Unlocks sponsor automation
    s.automation.sponsors.on = true;
    s.automation.sponsors.minTier = 2; // Tier 2 selected (index 1)
    s.sponsors.offers = [
      { id: 101, brandId: 'monstar', tier: 0, duration: 100, incomePct: 0.1, goal: { kind: 'wins', target: 5, rewardSeconds: 30 } } as SponsorOffer,
      { id: 102, brandId: 'redbullet', tier: 1, duration: 100, incomePct: 0.2, goal: { kind: 'wins', target: 5, rewardSeconds: 30 } } as SponsorOffer,
      { id: 103, brandId: 'gfuelish', tier: 2, duration: 100, incomePct: 0.3, goal: { kind: 'wins', target: 5, rewardSeconds: 30 } } as SponsorOffer,
    ];
    const mods = computeMods(s);

    runAutomation(s, mods);

    // Only tier 1 (Tier 2 in UI) should be signed
    expect(s.sponsors.active.some((c) => c.tier === 1)).toBe(true);
    expect(s.sponsors.active.some((c) => c.tier === 0)).toBe(false);
    expect(s.sponsors.active.some((c) => c.tier === 2)).toBe(false);
  });

  it('signs any tier when minTier is 0', () => {
    const s = foundedGame(0, 1);
    const team = ensureTeam(s, 'smash');
    team.bestTier = 5;
    s.fansRun = 1e9;
    s.staff.agent = 5;
    s.automation.sponsors.on = true;
    s.automation.sponsors.minTier = 0; // Any tier
    s.sponsors.offers = [
      { id: 101, brandId: 'monstar', tier: 0, duration: 100, incomePct: 0.1, goal: { kind: 'wins', target: 5, rewardSeconds: 30 } } as SponsorOffer,
    ];
    const mods = computeMods(s);

    runAutomation(s, mods);
    expect(s.sponsors.active.length).toBe(1);
  });
});

describe('Coach Bench Automation', () => {
  it('does not sign bench players when coach_bench is not owned', () => {
    const s = createBaseState(0, 1);
    s.games.smash.unlocked = true;
    s.teams.smash = { ...createTeam('smash'), lineup: ['p_starter'] };
    s.players.p_starter = generatePlayer(new Rng({ rng: 1 }), { id: 'p_starter', gameId: 'smash', time: 0, luck: 1 });
    s.cash = 100000;
    s.automation.roster = { on: true, maxCostPct: 1, buyBench: true };

    // Fill market with a prospect
    const prospect = generatePlayer(new Rng({ rng: 2 }), { id: 'p_prospect', gameId: 'smash', time: 0, luck: 1 });
    s.market.listings = [{ player: prospect, price: 50, currency: 'cash' }];

    autoRoster(s, { benchSlots: 3, rosterCap: 10 } as any);
    expect(s.teams.smash.bench.length).toBe(0);
  });

  it('signs bench players when coach_bench is owned and buyBench is enabled', () => {
    const s = createBaseState(0, 1);
    s.games.smash.unlocked = true;
    s.prestige.nodes.coach_bench = 0;
    s.teams.smash = { ...createTeam('smash'), lineup: ['p_starter'] };
    s.players.p_starter = generatePlayer(new Rng({ rng: 1 }), { id: 'p_starter', gameId: 'smash', time: 0, luck: 1 });
    s.cash = 100000;
    s.automation.roster = { on: true, maxCostPct: 1, buyBench: true };

    const prospect = generatePlayer(new Rng({ rng: 2 }), { id: 'p_prospect', gameId: 'smash', time: 0, luck: 1 });
    s.market.listings = [{ player: prospect, price: 50, currency: 'cash' }];

    autoRoster(s, { benchSlots: 3, rosterCap: 10 } as any);
    expect(s.teams.smash.bench.length).toBe(1);
    expect(s.teams.smash.bench[0]).toBe('p_prospect');
  });
});

describe('operations manager', () => {
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
});
