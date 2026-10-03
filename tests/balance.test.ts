import { describe, expect, it } from 'vitest';
import { DYNASTY, DYNASTY_BASE_COST, LEGACY_NODES } from '../src/data/legacy';
import { OPPONENT_GROWTH, PRIZE_GROWTH, winChance } from '../src/data/leagues';
import { computeMods, computeRates } from '../src/engine/economy';
import {
  BORED_FORM,
  FRUSTRATED_FORM,
  ENGAGEMENT_FLOOR,
  ENGAGEMENT_PEAK,
  MOODS,
  engagementMult,
  moodFor,
  recordForm,
  resetFormForTier,
  teamMood,
} from '../src/engine/mood';
import { buyDynasty, dynastyCost, dynastyRank, legacyBonuses, treeComplete } from '../src/engine/prestige';
import { Rng } from '../src/engine/rng';
import { foundedGame } from './fixtures';
import { changeTier, playMatch } from '../src/engine/teams';

describe('engagement', () => {
  it('peaks at a little more wins than losses and falls away either side, never to zero', () => {
    expect(engagementMult(ENGAGEMENT_PEAK)).toBeCloseTo(1, 9);
    for (const p of [0, 0.1, 0.3, 0.45, 0.65, 0.8, 0.95, 1]) {
      expect(engagementMult(p), `${p}`).toBeLessThan(1);
      expect(engagementMult(p), `${p}`).toBeGreaterThan(ENGAGEMENT_FLOOR);
    }
    // Foregone conclusions pay less the more foregone they are; so do hopeless ones.
    expect(engagementMult(0.9)).toBeLessThan(engagementMult(0.8));
    expect(engagementMult(0.8)).toBeLessThan(engagementMult(0.65));
    expect(engagementMult(0.2)).toBeLessThan(engagementMult(0.4));
    // Winning slightly more than half is the best place to be: better than an even match.
    expect(engagementMult(0.55)).toBeGreaterThan(engagementMult(0.5));
    expect(engagementMult(0.55)).toBeGreaterThan(engagementMult(0.65));
  });

  it('makes pushing up a tier pay more than stomping the tier below', () => {
    // Expected prize per match, relative to the tier's purse, for a team whose rating is k times
    // the opposition. One tier down the opposition is OPPONENT_GROWTH times weaker and the purse
    // PRIZE_GROWTH times smaller.
    const perMatch = (ratio: number, purse: number) => {
      const w = winChance(ratio, 1);
      return w * engagementMult(w) * purse;
    };
    for (const ratio of [0.8, 1, 1.5, 2, 3]) {
      const up = perMatch(ratio, PRIZE_GROWTH);
      const down = perMatch(ratio * OPPONENT_GROWTH, 1);
      expect(up, `rating ${ratio}x`).toBeGreaterThan(down);
    }
  });

  it('shrinks prize money, fans and XP in a lopsided league, and tires players sooner', () => {
    const s = foundedGame(0, 6);
    const even = computeRates(s).teams.smash;
    // Crush the league: an enormous rating makes every match a certainty.
    s.players.founder.stats.mechanics = 400;
    s.players.founder.stats.gameSense = 400;
    const crushing = computeRates(s).teams.smash;
    expect(crushing.winChance).toBeGreaterThan(0.95);
    expect(crushing.stakes).toBeLessThan(0.45);
    expect(even.stakes).toBeGreaterThan(crushing.stakes);
    const xpOf = (ev: typeof even) => {
      const s2 = foundedGame(0, 6);
      s2.teams.smash.form = 0.5;
      const p = s2.players.founder;
      const before = p.xp + p.level * 1e6;
      const energy = p.energy;
      playMatch(s2, s2.teams.smash, ev, computeMods(s2), new Rng({ rng: 5 }));
      return { xp: p.xp + p.level * 1e6 - before, drain: energy - p.energy };
    };
    const hard = xpOf(even);
    const easy = xpOf(crushing);
    expect(easy.xp).toBeLessThan(hard.xp);
    expect(easy.drain).toBeGreaterThan(hard.drain);
  });
});

describe('team mood', () => {
  it('reads form into moods', () => {
    expect(moodFor(0.5)).toBe('engaged');
    expect(moodFor(BORED_FORM)).toBe('bored');
    expect(moodFor(BORED_FORM, true)).toBe('rolling');
    expect(moodFor(FRUSTRATED_FORM)).toBe('frustrated');
    expect(moodFor(0.8)).toBe('settled');
  });

  it('gets bored only when held back with auto-promote off', () => {
    const s = foundedGame(0, 6);
    const team = s.teams.smash;
    for (let i = 0; i < 30; i++) recordForm(team, true);
    expect(team.form).toBeGreaterThan(BORED_FORM);
    expect(teamMood(team)).toBe('rolling');
    team.autoPromote = false;
    expect(teamMood(team)).toBe('bored');
  });

  it('bored players lose morale and learn less, even while winning', () => {
    const run = (autoPromote: boolean) => {
      const s = foundedGame(0, 6);
      const team = s.teams.smash;
      team.autoPromote = autoPromote;
      team.form = 0.95;
      const p = s.players.founder;
      p.morale = 70;
      const xpBefore = p.xp + p.level * 1e6;
      const ev = { ...computeRates(s).teams.smash, winChance: 1 };
      playMatch(s, team, ev, computeMods(s), new Rng({ rng: 5 }));
      return { morale: p.morale, xp: p.xp + p.level * 1e6 - xpBefore };
    };
    const bored = run(false);
    const rolling = run(true);
    expect(bored.morale).toBeLessThan(70);
    expect(rolling.morale).toBeGreaterThan(70);
    expect(bored.xp).toBeLessThan(rolling.xp);
    expect(MOODS.bored.xp).toBeLessThan(MOODS.engaged.xp);
  });

  it('a new tier freshens form up', () => {
    const s = foundedGame(0, 6);
    const team = s.teams.smash;
    team.form = 0.95;
    team.bestTier = 3;
    expect(changeTier(s, 'smash', 1)).toBe(true);
    expect(team.form).toBeCloseTo(0.725);
    resetFormForTier(team);
    expect(team.form).toBeLessThan(0.7);
  });
});

describe('dynasty ranks', () => {
  it('open with the root node and cost more each rank', () => {
    const s = foundedGame(0, 6);
    s.prestige.points = 1e6;
    expect(buyDynasty(s, 'renown')).toBe(0);
    s.prestige.nodes.legacy = 1;
    expect(buyDynasty(s, 'renown')).toBe(1);
    expect(s.prestige.points).toBe(1e6 - DYNASTY_BASE_COST);
    expect(dynastyCost(1)).toBeGreaterThan(dynastyCost(0));
    expect(dynastyCost(40)).toBeGreaterThan(dynastyCost(20) * 10);
  });

  it('buy max spends as far as the points go and never below zero', () => {
    const s = foundedGame(0, 6);
    s.prestige.nodes.legacy = 1;
    s.prestige.points = 1000;
    const bought = buyDynasty(s, 'pedigree', true);
    expect(bought).toBeGreaterThan(5);
    expect(s.prestige.points).toBeGreaterThanOrEqual(0);
    expect(s.prestige.points).toBeLessThan(dynastyCost(dynastyRank(s, 'pedigree')));
  });

  it('adds its effects to the legacy bonuses', () => {
    const s = foundedGame(0, 6);
    s.prestige.nodes.legacy = 1;
    const before = computeMods(s).globalMult;
    s.prestige.dynasty.renown = 10;
    const renown = DYNASTY.find((d) => d.id === 'renown')!;
    expect(legacyBonuses(s).effects).toContainEqual(renown.effects(10)[0]);
    expect(computeMods(s).globalMult).toBeGreaterThan(before);
  });

  it('keeps legacy points useful after the whole tree is bought', () => {
    const s = foundedGame(0, 6);
    for (const n of LEGACY_NODES) s.prestige.nodes[n.id] = 1;
    expect(treeComplete(s)).toBe(true);
    s.prestige.points = 50;
    expect(buyDynasty(s, 'following')).toBe(1);
  });
});
