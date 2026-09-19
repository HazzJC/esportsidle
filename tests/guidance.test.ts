import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS } from '../src/data/achievements';
import { TITLE_WINS } from '../src/data/leagues';
import { checkAchievements } from '../src/engine/achievements';
import { signDraftPick } from '../src/engine/draft';
import { computeMods, computeRates } from '../src/engine/economy';
import { advance } from '../src/engine/game';
import { generatePlayer } from '../src/engine/players';
import { Rng } from '../src/engine/rng';
import { MARKET_UNLOCK_CASH, sectionOpen, updateSections } from '../src/engine/sections';
import { createNewGame } from '../src/engine/state';
import { endSeason, playMatch } from '../src/engine/teams';
import { skipTutorial } from '../src/engine/tutorial';
import { foundedGame } from './fixtures';

describe('the first match', () => {
  it('is always a win, however unlikely', () => {
    const s = foundedGame(0, 3);
    const team = s.teams.smash;
    team.tier = 20;
    const ev = computeRates(s).teams.smash;
    expect(ev.winChance).toBeLessThan(0.01);
    expect(playMatch(s, team, ev, computeMods(s), new Rng({ rng: 1 })).win).toBe(true);
    // Only the first: the rest go the way the odds say.
    let wins = 0;
    for (let i = 0; i < 10; i++) if (playMatch(s, team, ev, computeMods(s), new Rng({ rng: 2 + i })).win) wins++;
    expect(wins).toBe(0);
    expect(s.stats.worstLoseStreak).toBe(10);
    expect(s.stats.bestWinStreak).toBe(1);
    // A forced win is not an upset.
    expect(s.stats.upsetWins).toBe(0);
  });
});

describe('the market', () => {
  it('opens after the tutorial, the first time the org has $500', () => {
    const s = createNewGame(0, 1);
    s.cash = 100;
    signDraftPick(s, s.draft![0].player.id, computeMods(s));
    s.cash = 1e6;
    updateSections(s);
    expect(sectionOpen(s, 'market')).toBe(false); // still in the tutorial
    skipTutorial(s);
    s.cash = MARKET_UNLOCK_CASH - 1;
    updateSections(s);
    expect(sectionOpen(s, 'market')).toBe(false);
    s.cash = MARKET_UNLOCK_CASH;
    updateSections(s);
    expect(sectionOpen(s, 'market')).toBe(true);
    s.cash = 0;
    updateSections(s);
    expect(sectionOpen(s, 'market')).toBe(true);
  });

  it('leaves the Teams tab open from the very start', () => {
    const s = createNewGame(0, 1);
    expect(sectionOpen(s, 'teams')).toBe(true);
  });
});

describe('secret achievements', () => {
  const unlock = (s: ReturnType<typeof foundedGame>) => checkAchievements(s, computeRates(s)).map((a) => a.id);

  it('are all hidden, with a hint', () => {
    const secrets = ACHIEVEMENTS.filter((a) => a.group === 'secrets');
    expect(secrets.length).toBeGreaterThanOrEqual(8);
    for (const a of secrets) {
      expect(a.secret, a.id).toBe(true);
      expect(a.hint, a.id).toBeTruthy();
    }
  });

  it('rewards a title won by the founding player alone', () => {
    const s = foundedGame(0, 4);
    const team = s.teams.smash;
    team.seasonWins = 16;
    endSeason(s, team, computeRates(s).teams.smash);
    expect(s.stats.soloFounderTitles).toBe(1);
    expect(s.stats.perfectSeasons).toBe(1);
    const got = unlock(s);
    expect(got).toContain('one_man_army');
    expect(got).toContain('flawless');
  });

  it('does not count a title once the org has signed anyone else', () => {
    const s = foundedGame(0, 4);
    const p = generatePlayer(new Rng({ rng: 3 }), { id: 'px', gameId: 'smash', time: 0 });
    s.players.px = p;
    s.teams.smash.bench.push('px');
    s.teams.smash.seasonWins = TITLE_WINS;
    endSeason(s, s.teams.smash, computeRates(s).teams.smash);
    expect(s.stats.seasonTitles).toBe(1);
    expect(s.stats.soloFounderTitles).toBe(0);
    expect(s.stats.perfectSeasons).toBe(0);
  });

  it('counts an idle million only when the logo was never clicked', () => {
    const s = foundedGame(0, 4);
    s.earnedRun = 2e6;
    expect(unlock(s)).toContain('hands_off');
    const t = foundedGame(0, 4);
    t.earnedRun = 2e6;
    t.stats.clicksRun = 1;
    expect(unlock(t)).not.toContain('hands_off');
  });

  it('tracks losing streaks through real matches', () => {
    const s = foundedGame(0, 3);
    s.teams.smash.tier = 25;
    advance(s, 400);
    expect(s.stats.matchesWon).toBe(1);
    expect(s.stats.worstLoseStreak).toBeGreaterThanOrEqual(10);
    expect(s.achievements.rock_bottom).toBeDefined();
  });
});
