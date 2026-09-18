import { getGame } from '../data/games';
import { tierName } from '../data/leagues';
import { RIVAL_ORGS } from '../data/names';
import { emit } from './bus';
import { money } from './format';
import type { Rng } from './rng';
import type { GameState, Player, RivalState, SeasonRecap, TeamState, TrophyEntry } from './types';

/** Share of matches played against the rival once one has emerged. */
export const RIVAL_CHANCE = 0.12;
/** Matches the org plays before a rival takes notice. */
export const RIVAL_AFTER_MATCHES = 12;
/** A head-to-head lead this large leaves the rival behind, and a new one steps up. */
export const RIVAL_VANQUISH_LEAD = 10;
/** Derby wins bring this many times the usual fans. */
export const RIVAL_FANS_MULT = 2;
export const SEASON_LOG_SIZE = 40;
export const TROPHY_CASE_SIZE = 300;
export const RIVAL_HISTORY_SIZE = 10;
export const MILESTONE_LOG_SIZE = 12;

const WIN_MILESTONES = [1, 50, 100, 250, 500, 1000];
/** Win milestones big enough to announce. */
const ANNOUNCED_WINS = new Set([100, 250, 500, 1000]);
const LEVEL_MILESTONES = [10, 25, 50, 75, 100];
const ANNOUNCED_LEVELS = new Set([25, 50, 100]);

// ---------------------------------------------------------------------------
// Rival
// ---------------------------------------------------------------------------
function newRival(s: GameState, rng: Rng): RivalState {
  const past = new Set(s.rivalHistory.map((r) => r.name));
  const fresh = RIVAL_ORGS.filter((n) => !past.has(n));
  return { name: rng.pick(fresh.length > 0 ? fresh : RIVAL_ORGS), wins: 0, losses: 0, streak: 0, since: s.time };
}

/** Picks the opponent for a match, establishing a rival once the org has some history. */
export function pickOpponent(s: GameState, rng: Rng): { name: string; rival: boolean } {
  if (!s.rival && s.stats.matchesWon + s.stats.matchesLost >= RIVAL_AFTER_MATCHES) {
    s.rival = newRival(s, rng);
    emit({ type: 'toast', title: 'A rivalry begins', body: `${s.rival.name} have noticed ${s.org.name}. Expect to see a lot of them.`, icon: 'swords', tone: 'info' });
  }
  if (s.rival && rng.chance(RIVAL_CHANCE)) return { name: s.rival.name, rival: true };
  const others = RIVAL_ORGS.filter((n) => n !== s.rival?.name);
  return { name: rng.pick(others), rival: false };
}

export function recordRivalMatch(s: GameState, win: boolean, gameId: string): void {
  const r = s.rival;
  if (!r) return;
  if (win) {
    r.wins++;
    r.streak = r.streak >= 0 ? r.streak + 1 : 1;
  } else {
    r.losses++;
    r.streak = r.streak <= 0 ? r.streak - 1 : -1;
  }
  const game = getGame(gameId).name;
  if (r.wins + r.losses === 1) {
    emit({
      type: 'toast',
      title: win ? `First blood against ${r.name}` : `${r.name} strike first`,
      body: `The first derby, in ${game}. It will not be the last.`,
      icon: 'swords',
      tone: win ? 'good' : 'bad',
    });
  } else if (Math.abs(r.streak) === 3 || Math.abs(r.streak) === 5) {
    emit({
      type: 'toast',
      title: win ? `${Math.abs(r.streak)} straight wins over ${r.name}` : `${r.name} have won ${Math.abs(r.streak)} in a row`,
      body: `Head to head: ${r.wins}-${r.losses}.`,
      icon: 'swords',
      tone: win ? 'good' : 'bad',
    });
  }
  if (r.wins - r.losses >= RIVAL_VANQUISH_LEAD) {
    s.rivalHistory.unshift({ name: r.name, wins: r.wins, losses: r.losses, until: s.time });
    if (s.rivalHistory.length > RIVAL_HISTORY_SIZE) s.rivalHistory.length = RIVAL_HISTORY_SIZE;
    emit({ type: 'toast', title: `${r.name} left behind`, body: `A ${r.wins}-${r.losses} rivalry, settled. Someone new will step up.`, icon: 'crown', tone: 'gold' });
    s.rival = null;
  }
}

// ---------------------------------------------------------------------------
// Seasons and trophies
// ---------------------------------------------------------------------------
/** The starter with the most wins this season. */
export function seasonMvp(s: GameState, team: TeamState): Player | null {
  let best: Player | null = null;
  let most = 0;
  for (const [id, wins] of Object.entries(team.seasonStats)) {
    const p = s.players[id];
    if (p && wins > most) {
      most = wins;
      best = p;
    }
  }
  return best;
}

export function recordSeason(s: GameState, team: TeamState, flags: { title: boolean; promoted: boolean; relegated: boolean }): SeasonRecap {
  const mvp = seasonMvp(s, team);
  const recap: SeasonRecap = {
    run: s.prestige.runs + 1,
    gameId: team.gameId,
    season: team.seasonNumber,
    tier: team.tier,
    wins: team.seasonWins,
    played: team.seasonPlayed,
    ...flags,
    mvp: mvp?.tag ?? null,
    earnings: team.seasonEarnings,
    time: s.time,
  };
  s.seasonLog.unshift(recap);
  if (s.seasonLog.length > SEASON_LOG_SIZE) s.seasonLog.length = SEASON_LOG_SIZE;
  team.lastSeason = recap;
  if (flags.title && mvp) addMilestone(s, mvp, `mvp-${team.gameId}-${team.seasonNumber}-${recap.run}`, `Season MVP: ${tierName(team.tier)} champions`, true);
  return recap;
}

export function addTrophy(s: GameState, t: Omit<TrophyEntry, 'id' | 'run' | 'time'>): TrophyEntry {
  const entry: TrophyEntry = { ...t, id: s.nextId++, run: s.prestige.runs + 1, time: s.time };
  s.trophyCase.unshift(entry);
  if (s.trophyCase.length > TROPHY_CASE_SIZE) s.trophyCase.length = TROPHY_CASE_SIZE;
  return entry;
}

export function seasonSummary(r: SeasonRecap): string {
  const result = r.title ? 'champions' : r.promoted ? 'promoted' : r.relegated ? 'relegated' : 'held on';
  return `${r.wins}-${r.played - r.wins}, ${result}${r.mvp ? ` · MVP ${r.mvp}` : ''} · ${money(r.earnings)}`;
}

// ---------------------------------------------------------------------------
// Player milestones
// ---------------------------------------------------------------------------
export function addMilestone(s: GameState, p: Player, id: string, label: string, announce: boolean): boolean {
  if (p.milestones.some((m) => m.id === id)) return false;
  p.milestones.unshift({ id, label, time: s.time, run: s.prestige.runs + 1 });
  if (p.milestones.length > MILESTONE_LOG_SIZE) p.milestones.length = MILESTONE_LOG_SIZE;
  if (announce) emit({ type: 'toast', title: `${p.tag}: ${label}`, body: `A career milestone with ${s.org.name}.`, icon: 'medal', tone: 'gold' });
  return true;
}

/** Called after each match a player starts. */
export function checkPlayerMilestones(s: GameState, p: Player, win: boolean, levelsGained: number): void {
  if (win && WIN_MILESTONES.includes(p.wins)) {
    addMilestone(s, p, `wins-${p.wins}`, p.wins === 1 ? 'First win for the org' : `${p.wins} wins`, ANNOUNCED_WINS.has(p.wins));
  }
  if (levelsGained > 0) {
    for (const level of LEVEL_MILESTONES) {
      if (p.level >= level && p.level - levelsGained < level) addMilestone(s, p, `level-${level}`, `Reached level ${level}`, ANNOUNCED_LEVELS.has(level));
    }
  }
}

/** Called when a player completes a season with the org. */
export function checkServiceMilestones(s: GameState, p: Player): void {
  if (p.seasons === 4) addMilestone(s, p, 'service-2', 'Two years with the org', false);
  if (p.seasons === 10) addMilestone(s, p, 'service-5', 'Five years: a club legend', true);
}
