import { describe, expect, it } from 'vitest';
import { DECLINE_AGE, SEASONS_PER_YEAR } from '../src/data/seasonPlans';
import { computeMods, computeRates } from '../src/engine/economy';
import { sellPlayer } from '../src/engine/market';
import { generatePlayer, sellValue, transferValue } from '../src/engine/players';
import { Rng } from '../src/engine/rng';
import { decodeSave, encodeSave } from '../src/engine/save';
import { createNewGame } from '../src/engine/state';
import { endSeason, evaluateTeam, playMatch, setSeasonPlan } from '../src/engine/teams';
import type { GameState, Player } from '../src/engine/types';

const CTX = { cpsNoBuffs: 0, incomeBuff: 1, fansMult: 1 };

/** A new game with one extra Smash player on the bench. */
function withBenchPlayer(age = 24): { s: GameState; p: Player } {
  const s = createNewGame(0, 5);
  const p = generatePlayer(new Rng({ rng: 3 }), { id: 'px', gameId: 'smash', time: 0 });
  p.age = age;
  s.players.px = p;
  s.teams.smash.bench.push('px');
  return { s, p };
}

function finishSeasons(s: GameState, n: number): void {
  const rng = new Rng({ rng: 11 });
  for (let i = 0; i < n; i++) endSeason(s, s.teams.smash, computeRates(s).teams.smash, rng);
}

describe('season plans', () => {
  it('trade results now against growth later', () => {
    const s = createNewGame(0, 5);
    const team = s.teams.smash;
    const mods = computeMods(s);
    const rating = () => evaluateTeam(s, team, mods, CTX).rating;
    team.plan = 'balanced';
    const balanced = rating();
    team.plan = 'push';
    expect(rating()).toBeGreaterThan(balanced);
    team.plan = 'development';
    expect(rating()).toBeLessThan(balanced);
  });

  it('are season-level: a mid-season change waits for the next season', () => {
    const s = createNewGame(0, 5);
    const team = s.teams.smash;
    expect(setSeasonPlan(s, 'smash', 'push')).toBe(true);
    expect(team.plan).toBe('push');

    team.seasonPlayed = 5;
    setSeasonPlan(s, 'smash', 'development');
    expect(team.plan).toBe('push');
    expect(team.nextPlan).toBe('development');
    finishSeasons(s, 1);
    expect(team.plan).toBe('development');
    expect(team.nextPlan).toBeNull();
  });

  it('switching back to the current plan cancels a queued change', () => {
    const s = createNewGame(0, 5);
    s.teams.smash.seasonPlayed = 3;
    setSeasonPlan(s, 'smash', 'push');
    setSeasonPlan(s, 'smash', 'balanced');
    expect(s.teams.smash.nextPlan).toBeNull();
  });

  it('Development trains the bench; Push does not', () => {
    const xpAfterMatch = (plan: 'development' | 'push') => {
      const { s, p } = withBenchPlayer();
      s.teams.smash.plan = plan;
      const mods = computeMods(s);
      playMatch(s, s.teams.smash, computeRates(s, mods).teams.smash, mods, new Rng({ rng: 2 }));
      return p.xp + (p.level - 1) * 1000;
    };
    expect(xpAfterMatch('development')).toBeGreaterThan(0);
    expect(xpAfterMatch('push')).toBe(0);
  });

  it('Push tires starters faster than Development', () => {
    const energyAfter = (plan: 'development' | 'push') => {
      const s = createNewGame(0, 5);
      s.teams.smash.plan = plan;
      const mods = computeMods(s);
      playMatch(s, s.teams.smash, computeRates(s, mods).teams.smash, mods, new Rng({ rng: 2 }));
      return s.players.founder.energy;
    };
    expect(energyAfter('push')).toBeLessThan(energyAfter('development'));
  });
});

describe('ageing and retirement', () => {
  it('players age a year every few seasons', () => {
    const { s, p } = withBenchPlayer(24);
    finishSeasons(s, SEASONS_PER_YEAR);
    expect(p.age).toBe(25);
    expect(p.seasons).toBe(SEASONS_PER_YEAR);
  });

  it('veterans lose a little skill and ceiling on each birthday', () => {
    const { s, p } = withBenchPlayer(DECLINE_AGE - 1);
    const potential = p.potential;
    finishSeasons(s, SEASONS_PER_YEAR);
    expect(p.age).toBe(DECLINE_AGE);
    expect(p.potential).toBe(potential - 2);
    for (const v of Object.values(p.stats)) expect(v).toBeLessThanOrEqual(p.potential);
  });

  it('announces retirement a season ahead, then retires', () => {
    const { s, p } = withBenchPlayer(33);
    finishSeasons(s, SEASONS_PER_YEAR);
    expect(p.age).toBe(34);
    expect(p.retiring).toBe(true);
    expect(s.players.px).toBeDefined();
    finishSeasons(s, 1);
    expect(s.players.px).toBeUndefined();
    expect(s.teams.smash.bench).not.toContain('px');
    expect(s.stats.playersRetired).toBe(1);
  });

  it('the founder never ages or retires', () => {
    const s = createNewGame(0, 5);
    const age = s.players.founder.age;
    finishSeasons(s, SEASONS_PER_YEAR * 20);
    expect(s.players.founder).toBeDefined();
    expect(s.players.founder.age).toBe(age);
  });
});

describe('transfer value', () => {
  it('pays nothing extra for a player you have not developed, so flipping does not work', () => {
    const { p } = withBenchPlayer(25);
    p.fee = 1_000;
    p.level = 5;
    p.signedLevel = 5;
    expect(transferValue(p, 1e9, 1)).toBe(Math.floor(sellValue(p)));
  });

  it('rewards levels gained on your books, priced from the income the player brings in', () => {
    const { p } = withBenchPlayer(25);
    p.fee = 1_000;
    p.signedLevel = 1;
    p.level = 21;
    const value = transferValue(p, 3_000, 1);
    expect(value).toBeGreaterThan(sellValue(p) + 3_000 * 20 * 30);
  });

  it('values youth and discounts retirees', () => {
    const { p } = withBenchPlayer(22);
    p.signedLevel = 1;
    p.level = 11;
    const young = transferValue(p, 1_000, 1);
    p.age = 32;
    const veteran = transferValue(p, 1_000, 1);
    p.retiring = true;
    const retiring = transferValue(p, 1_000, 1);
    expect(young).toBeGreaterThan(veteran);
    expect(veteran).toBeGreaterThan(retiring);
  });

  it('selling pays the transfer value and never works for the founder', () => {
    const { s, p } = withBenchPlayer(24);
    p.signedLevel = 1;
    p.level = 11;
    const expected = transferValue(p, 2_000, 1);
    const cash = s.cash;
    expect(sellPlayer(s, 'px', 2_000)).toBe(expected);
    expect(s.cash).toBe(cash + expected);
    expect(sellPlayer(s, 'founder', 2_000)).toBe(0);
  });

  it('gives players from older saves no credit for levels gained before tracking', () => {
    const { s, p } = withBenchPlayer(24);
    p.level = 30;
    const raw = s as unknown as { players: Record<string, Record<string, unknown>> };
    delete raw.players.px.signedLevel;
    const loaded = decodeSave(encodeSave(s));
    expect(loaded.players.px.signedLevel).toBe(30);
  });
});
