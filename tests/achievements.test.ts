import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS } from '../src/data/achievements';
import { TITLE_WINS } from '../src/data/leagues';
import { checkAchievements } from '../src/engine/achievements';
import { computeRates } from '../src/engine/economy';
import { advance } from '../src/engine/game';
import { generatePlayer } from '../src/engine/players';
import { Rng } from '../src/engine/rng';
import { endSeason } from '../src/engine/teams';
import { foundedGame } from './fixtures';

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
