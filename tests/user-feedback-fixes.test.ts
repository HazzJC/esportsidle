import { describe, expect, it } from 'vitest';
import { runAutomation } from '../src/engine/automation';
import { computeMods } from '../src/engine/economy';
import { getGame } from '../src/data/games';
import { rollHealth } from '../src/engine/health';
import { LEGACY_DIVISOR, canSell, legacyFor } from '../src/engine/prestige';
import { baseStat, effectivePotential, effectiveStat, playerRating, playerXpMult } from '../src/engine/players';
import { Rng } from '../src/engine/rng';
import { hireStaff } from '../src/engine/staff';
import { autoSubstitute, ensureTeam, evaluateTeam, playMatch, updatePlayers, updateTeams } from '../src/engine/teams';
import type { Player, SponsorOffer, TeamEval } from '../src/engine/types';
import { foundedGame } from './fixtures';

describe('user feedback fixes', () => {
  describe('flu recovery mechanic', () => {
    it('heals purely based on time without requiring benching', () => {
      const s = foundedGame(0, 1);
      const team = ensureTeam(s, 'smash');
      const player = Object.values(s.players)[0];
      // Put player in active team slot
      team.lineup[0] = player.id;
      player.status = { kind: 'sick', until: s.time + 30, reason: 'Flu' };
      const mods = computeMods(s);

      // 10 seconds pass: still sick
      s.time += 10;
      updatePlayers(s, 10, mods);
      expect(player.status.kind).toBe('sick');

      // 25 more seconds pass: recovered while still on active roster
      s.time += 25;
      updatePlayers(s, 25, mods);
      expect(player.status.kind).toBe('healthy');
      expect(player.status.until).toBe(0);
      expect(team.lineup[0]).toBe(player.id);
    });
  });

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

  describe('player easter eggs', () => {
    it('TheOnlyCook caps chefs at 1 and eliminates illness', () => {
      const s = foundedGame(0, 1);
      s.cash = 1e9;
      s.stats.matchesWon = 40; // Unlocks chef
      const player = Object.values(s.players)[0];
      player.tag = 'TheOnlyCook';

      expect(hireStaff(s, 'chef', 3)).toBe(1);
      expect(s.staff.chef).toBe(1);
      // Attempting to hire more fails
      expect(hireStaff(s, 'chef', 1)).toBe(0);

      // Illness roll cures illness
      const mods = computeMods(s);
      const rng = { next: () => 0.0001, range: (a: number) => a, pick: <T>(a: T[]) => a[0] } as unknown as Rng;
      const result = rollHealth(s, player, mods, rng, true);
      // rollHealth never inflicts sickness because c.sick = 0
      expect(result).not.toBe('sick');
    });

    it('Varantha grants flat +35 teamwork', () => {
      const s = foundedGame(0, 1);
      const player = Object.values(s.players)[0];
      const originalTeamwork = baseStat(player, 'teamwork');

      player.tag = 'Varantha';
      expect(baseStat(player, 'teamwork')).toBe(originalTeamwork + 35);

      // Reverts when renamed
      player.tag = 'Normal';
      expect(baseStat(player, 'teamwork')).toBe(originalTeamwork);
    });

    it('mrkonradical grants stat, role, and xp modifiers', () => {
      const s = foundedGame(0, 1);
      const player = Object.values(s.players)[0];
      player.traits = [];
      player.tag = 'mrkonradical';
      player.stats.teamwork = 50;

      expect(baseStat(player, 'teamwork')).toBeGreaterThanOrEqual(75);
      expect(playerXpMult(player)).toBe(1.5);

      // Off role rating has 0.3x penalty instead of 0.85x
      const counterGame = getGame('counter');
      player.gameId = 'counter';
      player.role = 0;
      const onRole = playerRating(player, counterGame, 0, 0);
      const offRole = playerRating(player, counterGame, 0, 1);
      expect(offRole / onRole).toBeCloseTo(0.3, 2);
    });

    it('Bubbystr has composure debuff and pop off passive', () => {
      const s = foundedGame(0, 1);
      const team = ensureTeam(s, 'smash');
      const player = Object.values(s.players)[0];
      player.tag = 'Bubbystr';
      const mods = computeMods(s);

      expect(effectiveStat(player, 'composure')).toBeLessThan(baseStat(player, 'composure'));

      // Pop off passive forces win on 5th loss
      team.lineup[0] = player.id;
      s.stats.matchesWon = 1; // Not first match ever
      s.stats.bubbystrLosses = 4;
      const ev = {
        gameId: 'smash',
        active: true,
        cps: 0,
        fansPerSec: 0,
        rating: 10,
        opponent: 10,
        stakes: 1,
        cut: 0,
        filled: 1,
        available: 1,
        interval: 15,
        winChance: 0, // Would guarantee loss
        winPrize: 10,
        lossPrize: 1,
        fansWin: 5,
      } as TeamEval;
      const losingRng = {
        next: () => 0.999,
        range: (a: number) => a,
        int: (a: number) => a,
        pick: <T>(a: T[]) => a[0],
      } as unknown as Rng;

      const res = playMatch(s, team, ev, mods, losingRng);
      expect(res.win).toBe(true);
      expect(s.stats.bubbystrLosses).toBe(5);
    });

    it('Faker debuffed outside lanes, +25% team rating in lanes', () => {
      const s = foundedGame(0, 1);
      const player = Object.values(s.players)[0];
      player.tag = 'Faker';
      player.gameId = 'smash';
      const mods = computeMods(s);

      // Outside lanes: 0.5x stat penalty
      expect(effectiveStat(player, 'mechanics')).toBe(Math.round(baseStat(player, 'mechanics') * 0.5));

      // Inside lanes: +25% team rating
      player.gameId = 'lanes';
      player.role = 2; // Mid
      s.games.lanes.unlocked = true;
      const lanesTeam = ensureTeam(s, 'lanes');
      lanesTeam.lineup[2] = player.id;
      const ctx = { cpsNoBuffs: 1, incomeBuff: 1, fansMult: 1 };
      player.tag = 'Normal';
      const normalRating = evaluateTeam(s, lanesTeam, mods, ctx).rating;
      player.tag = 'Faker';
      const fakerRating = evaluateTeam(s, lanesTeam, mods, ctx).rating;
      expect(fakerRating / normalRating).toBeCloseTo(1.25, 2);
    });

    it('Nijacat22 has 99 potential and 0.25x XP', () => {
      const s = foundedGame(0, 1);
      const player = Object.values(s.players)[0];
      player.traits = [];
      player.potential = 40;
      player.tag = 'Nijacat22';

      expect(effectivePotential(player)).toBe(99);
      expect(playerXpMult(player)).toBe(0.25);
    });
  });

  describe('legacy / prestige lockout', () => {
    it('has LEGACY_DIVISOR at 1e12 and allows sale at 1T', () => {
      expect(LEGACY_DIVISOR).toBe(1e12);
      const s = foundedGame(0, 1);
      s.earnedTotal = 1e12;

      expect(legacyFor(s.earnedTotal)).toBe(1);
      expect(canSell(s)).toBe(true);
    });
  });
});
