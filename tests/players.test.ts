import { describe, expect, it } from 'vitest';
import { GAMES, getGame } from '../src/data/games';
import { PARODY_TAGS, SCENE_TAGS } from '../src/data/names';
import { computeMods } from '../src/engine/economy';
import { rollHealth } from '../src/engine/health';
import {
  baseStat,
  effectivePotential,
  effectiveStat,
  generatePlayer,
  PARODY_TAG_CHANCE,
  playerRating,
  playerXpMult,
  randomTag,
} from '../src/engine/players';
import { Rng } from '../src/engine/rng';
import { hireStaff } from '../src/engine/staff';
import { ensureTeam, evaluateTeam, playMatch } from '../src/engine/teams';
import type { TeamEval } from '../src/engine/types';
import { foundedGame } from './fixtures';

describe('player tags', () => {
  it('draws on the scene a player competes in', () => {
    const rng = new Rng({ rng: 21 });
    const tags = Array.from({ length: 60 }, (_, i) => generatePlayer(rng, { id: `p${i}`, gameId: 'lanes', time: 0 }).tag);
    const scene = new Set([...SCENE_TAGS.lanes.any, ...(SCENE_TAGS.lanes.byRole ?? []).flat()]);
    expect(tags.filter((t) => scene.has(t)).length).toBeGreaterThan(10);
  });

  it('has a pool for every game, with no duplicates inside a game', () => {
    for (const [gameId, def] of Object.entries(SCENE_TAGS)) {
      const all = [...def.any, ...(def.byRole ?? []).flat()];
      expect(all.length, gameId).toBeGreaterThanOrEqual(8);
      for (const tag of all) expect(tag.length, `${gameId}:${tag}`).toBeLessThanOrEqual(16);
    }
  });
});

describe('Parody Tags & Names', () => {
  it('defines parody gamer tags for all 12 games', () => {
    for (const g of GAMES) {
      const tags = PARODY_TAGS[g.id];
      expect(tags, `Missing parody tags for game ${g.id}`).toBeDefined();
      expect(tags.length).toBeGreaterThanOrEqual(15);
    }
  });

  it('rolls a parody tag when the parody chance triggers', () => {
    // A mock rng that only passes the parody roll
    const rng = new Rng({ rng: 12345 });
    const mockRng = {
      ...rng,
      chance: (p: number) => p === PARODY_TAG_CHANCE,
      pick: <T>(arr: readonly T[]): T => arr[0],
      int: (min: number, max: number) => min,
    } as unknown as Rng;

    const tag = randomTag(mockRng, 'smash');
    expect(PARODY_TAGS['smash']).toContain(tag);
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
