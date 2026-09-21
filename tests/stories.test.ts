import { describe, expect, it } from 'vitest';
import { TITLE_WINS } from '../src/data/leagues';
import { computeRates } from '../src/engine/economy';
import { subscribe } from '../src/engine/bus';
import { generatePlayer } from '../src/engine/players';
import { LEGACY_DIVISOR, sellOrg } from '../src/engine/prestige';
import { Rng } from '../src/engine/rng';
import { foundedGame } from './fixtures';
import {
  RIVAL_AFTER_MATCHES,
  RIVAL_CHANCE,
  RIVAL_VANQUISH_LEAD,
  addMilestone,
  checkPlayerMilestones,
  checkServiceMilestones,
  pickOpponent,
  recordRivalMatch,
} from '../src/engine/stories';
import { endSeason } from '../src/engine/teams';
import type { GameState } from '../src/engine/types';

function experienced(): GameState {
  const s = foundedGame(0, 6);
  s.stats.matchesWon = RIVAL_AFTER_MATCHES;
  return s;
}

describe('the rival', () => {
  it('only takes notice once the org has some history', () => {
    const s = foundedGame(0, 6);
    pickOpponent(s, new Rng({ rng: 1 }));
    expect(s.rival).toBeNull();
    s.stats.matchesWon = RIVAL_AFTER_MATCHES;
    pickOpponent(s, new Rng({ rng: 1 }));
    expect(s.rival).not.toBeNull();
  });

  it('turns up in roughly the intended share of matches', () => {
    const s = experienced();
    const rng = new Rng({ rng: 42 });
    let derbies = 0;
    const n = 4000;
    for (let i = 0; i < n; i++) if (pickOpponent(s, rng).rival) derbies++;
    expect(derbies / n).toBeGreaterThan(RIVAL_CHANCE * 0.8);
    expect(derbies / n).toBeLessThan(RIVAL_CHANCE * 1.2);
  });

  it('keeps a head-to-head record and streaks', () => {
    const s = experienced();
    pickOpponent(s, new Rng({ rng: 1 }));
    recordRivalMatch(s, true, 'smash');
    recordRivalMatch(s, true, 'smash');
    recordRivalMatch(s, false, 'smash');
    expect(s.rival).toMatchObject({ wins: 2, losses: 1, streak: -1 });
  });

  it('is left behind after a decisive lead, and a new rival steps up', () => {
    const s = experienced();
    pickOpponent(s, new Rng({ rng: 1 }));
    const first = s.rival!.name;
    for (let i = 0; i < RIVAL_VANQUISH_LEAD; i++) recordRivalMatch(s, true, 'smash');
    expect(s.rival).toBeNull();
    expect(s.rivalHistory[0]).toMatchObject({ name: first, wins: RIVAL_VANQUISH_LEAD });
    pickOpponent(s, new Rng({ rng: 2 }));
    expect(s.rival!.name).not.toBe(first);
  });

  it('survives selling the org', () => {
    const s = experienced();
    pickOpponent(s, new Rng({ rng: 1 }));
    const name = s.rival!.name;
    s.earnedTotal = LEGACY_DIVISOR;
    sellOrg(s, { charter: 'operator' });
    expect(s.rival?.name).toBe(name);
  });
});

describe('season recaps and the trophy shelf', () => {
  it('announces a title, bonus, MVP, and promotion together', () => {
    const s = foundedGame(0, 6);
    const team = s.teams.smash;
    team.seasonWins = TITLE_WINS;
    team.seasonPlayed = 16;
    team.seasonStats = { founder: TITLE_WINS };
    const notices: string[] = [];
    const unsubscribe = subscribe((event) => {
      if (event.type === 'toast') notices.push(`${event.title} ${event.body ?? ''}`);
    });
    try {
      endSeason(s, team, computeRates(s).teams.smash);
    } finally {
      unsubscribe();
    }
    expect(notices).toHaveLength(1);
    expect(notices[0]).toContain('league champions');
    expect(notices[0]).toContain('bonus');
    expect(notices[0]).toContain(`MVP: ${s.players.founder.tag}`);
    expect(notices[0]).toContain('Promoted');
  });

  it('records each season with its outcome and MVP', () => {
    const s = foundedGame(0, 6);
    const team = s.teams.smash;
    team.seasonWins = TITLE_WINS;
    team.seasonPlayed = 16;
    team.seasonEarnings = 1234;
    team.seasonStats = { founder: TITLE_WINS };
    endSeason(s, team, computeRates(s).teams.smash);
    expect(s.seasonLog[0]).toMatchObject({ gameId: 'smash', season: 1, title: true, mvp: s.players.founder.tag, earnings: 1234 });
    expect(team.lastSeason).toEqual(s.seasonLog[0]);
    // The season's running totals reset for the next one.
    expect(team.seasonEarnings).toBe(0);
    expect(team.seasonStats).toEqual({});
  });

  it('puts a trophy on the shelf for a title, and keeps it through a sale', () => {
    const s = foundedGame(0, 6);
    const team = s.teams.smash;
    team.seasonWins = TITLE_WINS;
    team.seasonPlayed = 16;
    endSeason(s, team, computeRates(s).teams.smash);
    expect(s.trophyCase).toHaveLength(1);
    expect(s.trophyCase[0]).toMatchObject({ kind: 'title', gameId: 'smash', tier: 0, run: 1 });
    s.earnedTotal = LEGACY_DIVISOR;
    sellOrg(s, { charter: 'operator' });
    expect(s.trophyCase).toHaveLength(1);
  });
});

describe('player milestones', () => {
  it('marks a first win and crossing level thresholds', () => {
    const s = foundedGame(0, 6);
    const p = s.players.founder;
    p.wins = 1;
    checkPlayerMilestones(s, p, true, 0);
    p.level = 11;
    checkPlayerMilestones(s, p, false, 2);
    expect(p.milestones.map((m) => m.id)).toEqual(['level-10', 'wins-1']);
  });

  it('never records the same milestone twice', () => {
    const s = foundedGame(0, 6);
    const p = s.players.founder;
    expect(addMilestone(s, p, 'x', 'Something', false)).toBe(true);
    expect(addMilestone(s, p, 'x', 'Something', false)).toBe(false);
    expect(p.milestones).toHaveLength(1);
  });

  it('marks long service', () => {
    const s = foundedGame(0, 6);
    const p = generatePlayer(new Rng({ rng: 3 }), { id: 'px', gameId: 'smash', time: 0 });
    p.seasons = 10;
    checkServiceMilestones(s, p);
    expect(p.milestones[0].label).toMatch(/club legend/);
  });
});
