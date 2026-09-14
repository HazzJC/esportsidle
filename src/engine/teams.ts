import { GAMES, getGame, type Genre } from '../data/games';
import {
  FAN_BASE,
  FAN_GROWTH,
  LOSS_FAN_RATIO,
  LOSS_PRIZE_RATIO,
  PRIZE_GROWTH,
  PROMOTE_WINS,
  RELEGATE_WINS,
  SEASON_LENGTH,
  TITLE_WINS,
  opponentRating,
  prizeSeconds,
  tierName,
  winChance,
} from '../data/leagues';
import { RIVAL_ORGS } from '../data/names';
import { emit } from './bus';
import { money } from './format';
import {
  STAND_IN_RATING,
  applyMorale,
  drainEnergy,
  grantXp,
  isAvailable,
  moraleBase,
  playerFansMult,
  playerRating,
  playerXpMult,
  skillRating,
  traitsOf,
} from './players';
import type { Rng } from './rng';
import type { GameState, MatchRecord, Mods, Player, TeamEval, TeamState } from './types';
import { earnCash, gainFans, gainTrophies } from './wallet';

export const HISTORY_LENGTH = 12;
export const MAX_MATCHES_PER_TICK = 20;

export function createTeam(gameId: string): TeamState {
  const game = getGame(gameId);
  return {
    gameId,
    lineup: Array.from({ length: game.teamSize }, () => null),
    bench: [],
    tier: 0,
    bestTier: 0,
    seasonNumber: 1,
    seasonPlayed: 0,
    seasonWins: 0,
    progress: 0,
    autoPromote: true,
    autoSub: true,
    chemistry: 0,
    history: [],
    wins: 0,
    losses: 0,
    streak: 0,
    titles: 0,
    earnings: 0,
  };
}

// ---------------------------------------------------------------------------
// Roster management
// ---------------------------------------------------------------------------

export function teamPlayerIds(team: TeamState): string[] {
  return [...team.lineup.filter((id): id is string => id !== null), ...team.bench];
}

export function rosterCapacity(team: TeamState, mods: Pick<Mods, 'benchSlots'>): number {
  return team.lineup.length + mods.benchSlots;
}

export function hasRosterSpace(s: GameState, gameId: string, mods: Pick<Mods, 'benchSlots'>): boolean {
  const team = s.teams[gameId];
  if (!team) return false;
  return team.lineup.includes(null) || team.bench.length < mods.benchSlots;
}

export function addToTeam(s: GameState, p: Player, mods: Pick<Mods, 'benchSlots'>): boolean {
  const team = s.teams[p.gameId];
  if (!team) return false;
  let slot = team.lineup[p.role] === null ? p.role : -1;
  if (slot < 0) slot = team.lineup.indexOf(null);
  if (slot >= 0) {
    team.lineup[slot] = p.id;
    team.chemistry *= 0.75;
    return true;
  }
  if (team.bench.length < mods.benchSlots) {
    team.bench.push(p.id);
    return true;
  }
  return false;
}

export function removeFromTeams(s: GameState, playerId: string): void {
  for (const team of Object.values(s.teams)) {
    const slot = team.lineup.indexOf(playerId);
    if (slot >= 0) {
      team.lineup[slot] = null;
      team.chemistry *= 0.75;
    }
    team.bench = team.bench.filter((id) => id !== playerId);
  }
}

/** Moves a player into a lineup slot, swapping with whoever is there. */
export function assignSlot(s: GameState, gameId: string, playerId: string, slot: number): boolean {
  const team = s.teams[gameId];
  if (!team || slot < 0 || slot >= team.lineup.length) return false;
  const current = team.lineup[slot];
  if (current === playerId) return true;
  const fromSlot = team.lineup.indexOf(playerId);
  const benchIndex = team.bench.indexOf(playerId);
  if (fromSlot >= 0) {
    team.lineup[fromSlot] = current;
  } else if (benchIndex >= 0) {
    team.bench.splice(benchIndex, 1);
    if (current) team.bench.push(current);
  } else {
    return false;
  }
  team.lineup[slot] = playerId;
  team.chemistry *= 0.85;
  return true;
}

export function benchPlayer(s: GameState, gameId: string, playerId: string, mods: Pick<Mods, 'benchSlots'>): boolean {
  const team = s.teams[gameId];
  if (!team) return false;
  const slot = team.lineup.indexOf(playerId);
  if (slot < 0 || team.bench.length >= mods.benchSlots) return false;
  team.lineup[slot] = null;
  team.bench.push(playerId);
  team.chemistry *= 0.85;
  return true;
}

/** Swaps exhausted or unavailable starters for rested bench players. */
export function autoSubstitute(s: GameState, team: TeamState): boolean {
  if (!team.autoSub || team.bench.length === 0) return false;
  const game = getGame(team.gameId);
  let changed = false;
  for (let slot = 0; slot < team.lineup.length; slot++) {
    const id = team.lineup[slot];
    const starter = id ? s.players[id] : undefined;
    const needsSub = !starter || !isAvailable(starter, s.time) || starter.energy < 35;
    if (!needsSub) continue;
    let best: Player | undefined;
    let bestRating = -1;
    for (const benchId of team.bench) {
      const b = s.players[benchId];
      if (!b || !isAvailable(b, s.time)) continue;
      if (starter && isAvailable(starter, s.time) && b.energy < 60) continue;
      const r = playerRating(b, game, team.tier, slot);
      if (r > bestRating) {
        best = b;
        bestRating = r;
      }
    }
    if (best) {
      assignSlot(s, team.gameId, best.id, slot);
      changed = true;
    }
  }
  return changed;
}

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------

export interface TeamContext {
  cpsNoBuffs: number;
  incomeBuff: number;
  fansMult: number;
}

export function evaluateTeam(s: GameState, team: TeamState, mods: Mods, ctx: TeamContext): TeamEval {
  const game = getGame(team.gameId);
  const ratings: number[] = [];
  let available = 0;
  let filled = 0;
  let cutSum = 0;
  let fansSum = 0;
  let teamMult = 1;
  team.lineup.forEach((id, slot) => {
    const p = id ? s.players[id] : undefined;
    if (p) filled++;
    if (p && isAvailable(p, s.time)) {
      ratings.push(playerRating(p, game, team.tier, slot));
      available++;
      cutSum += p.cut;
      fansSum += playerFansMult(p);
      for (const t of traitsOf(p)) if (t.teamMult) teamMult *= t.teamMult;
    } else {
      ratings.push(STAND_IN_RATING);
    }
  });
  const active = available > 0;
  const average = ratings.reduce((a, b) => a + b, 0) / Math.max(1, ratings.length);
  const chemistry = game.teamSize > 1 ? 1 + 0.2 * team.chemistry : 1;
  const rating = average * teamMult * chemistry * mods.teamRatingMult;
  const opponent = opponentRating(team.tier);
  const chance = active ? winChance(rating, opponent) : 0;
  const popularity = s.games[team.gameId]?.popularity ?? 1;
  const cut = available > 0 ? cutSum / available : 0;
  const gross =
    (game.basePrize * Math.pow(PRIZE_GROWTH, team.tier) + ctx.cpsNoBuffs * prizeSeconds(team.tier)) *
    popularity *
    mods.prizeMult *
    ctx.incomeBuff;
  const winPrize = gross * (1 - cut);
  const lossPrize = winPrize * LOSS_PRIZE_RATIO;
  const fansWin = FAN_BASE * Math.pow(FAN_GROWTH, team.tier) * popularity * ctx.fansMult * (available > 0 ? fansSum / available : 1);
  const interval = game.matchSeconds / mods.matchSpeed;
  return {
    gameId: team.gameId,
    rating,
    opponent,
    winChance: chance,
    winPrize,
    lossPrize,
    fansWin,
    cut,
    filled,
    available,
    active,
    interval,
    cps: active ? (chance * winPrize + (1 - chance) * lossPrize) / interval : 0,
    fansPerSec: active ? (chance * fansWin + (1 - chance) * fansWin * LOSS_FAN_RATIO) / interval : 0,
  };
}

// ---------------------------------------------------------------------------
// Matches
// ---------------------------------------------------------------------------

export function scoreline(genre: Genre, win: boolean, rng: Rng): string {
  const pair = (w: number, l: number) => (win ? `${w}-${l}` : `${l}-${w}`);
  switch (genre) {
    case 'fighting':
    case 'rts':
    case 'cardgame':
    case 'heroshooter':
      return pair(3, rng.int(0, 2));
    case 'moba':
    case 'vr':
      return pair(2, rng.int(0, 1));
    case 'tacfps':
      return pair(13, rng.int(3, 11));
    case 'carsoccer': {
      const w = rng.int(1, 6);
      return pair(w, rng.int(0, w - 1));
    }
    case 'battleroyale':
      return win ? '#1' : `#${rng.int(2, 20)}`;
    case 'pong':
      return pair(11, rng.int(3, 9));
  }
}

export function playMatch(s: GameState, team: TeamState, ev: TeamEval, mods: Mods, rng: Rng): MatchRecord {
  const game = getGame(team.gameId);
  const win = rng.next() < ev.winChance;
  const prize = win ? ev.winPrize : ev.lossPrize;
  const fans = win ? ev.fansWin : ev.fansWin * LOSS_FAN_RATIO;
  earnCash(s, prize);
  gainFans(s, fans);

  const record: MatchRecord = {
    win,
    score: scoreline(game.genre, win, rng),
    opponent: rng.pick(RIVAL_ORGS),
    prize,
    fans,
    tier: team.tier,
    time: s.time,
  };
  team.history.unshift(record);
  if (team.history.length > HISTORY_LENGTH) team.history.length = HISTORY_LENGTH;
  team.earnings += prize;
  if (win) {
    team.wins++;
    team.streak = team.streak >= 0 ? team.streak + 1 : 1;
    s.stats.matchesWon++;
  } else {
    team.losses++;
    team.streak = team.streak <= 0 ? team.streak - 1 : -1;
    s.stats.matchesLost++;
  }
  s.stats.prizeMoneyTotal += prize;
  team.seasonPlayed++;
  if (win) team.seasonWins++;
  if (game.teamSize > 1) team.chemistry = Math.min(1, team.chemistry + 0.01);

  for (const id of team.lineup) {
    const p = id ? s.players[id] : undefined;
    if (!p || !isAvailable(p, s.time)) continue;
    p.matches++;
    if (win) p.wins++;
    grantXp(p, (win ? 15 : 10) * mods.xpMult * playerXpMult(p), rng);
    applyMorale(p, win ? 3 : -4);
    drainEnergy(p);
  }

  if (team.seasonPlayed >= SEASON_LENGTH) endSeason(s, team, ev);
  return record;
}

export function endSeason(s: GameState, team: TeamState, ev: TeamEval): void {
  const game = getGame(team.gameId);
  const wins = team.seasonWins;
  const record = `${wins}-${SEASON_LENGTH - wins}`;
  if (wins >= TITLE_WINS) {
    team.titles++;
    s.stats.seasonTitles++;
    gainTrophies(s, 1);
    const bonus = ev.winPrize * 3;
    earnCash(s, bonus);
    emit({
      type: 'toast',
      title: `${game.name}: season champions!`,
      body: `${record} in the ${tierName(team.tier)}. +1 trophy and ${money(bonus)} bonus.`,
      icon: 'trophy',
      tone: 'gold',
    });
  }
  if (wins >= PROMOTE_WINS && team.autoPromote) {
    team.tier++;
    team.bestTier = Math.max(team.bestTier, team.tier);
    s.stats.promotions++;
    emit({ type: 'toast', title: `${game.name}: promoted!`, body: `${record} season. Welcome to the ${tierName(team.tier)}.`, icon: 'trending-up', tone: 'good' });
  } else if (wins <= RELEGATE_WINS && team.tier > 0) {
    team.tier--;
    emit({ type: 'toast', title: `${game.name}: relegated`, body: `${record} season. Back down to the ${tierName(team.tier)}.`, icon: 'trending-down', tone: 'bad' });
  }
  team.seasonNumber++;
  team.seasonPlayed = 0;
  team.seasonWins = 0;
}

/** Win chance needed to challenge into a tier the team has never reached. */
export const CHALLENGE_WIN_CHANCE = 0.75;

/**
 * Manually move a team down, back up to a tier it already reached, or one tier higher when it is
 * dominating its current tier. Resets the current season.
 */
export function changeTier(s: GameState, gameId: string, delta: number, winChance = 0): boolean {
  const team = s.teams[gameId];
  if (!team || (delta !== 1 && delta !== -1)) return false;
  const next = team.tier + delta;
  if (next < 0) return false;
  if (delta === 1 && next > team.bestTier && winChance < CHALLENGE_WIN_CHANCE) return false;
  team.tier = next;
  team.bestTier = Math.max(team.bestTier, next);
  team.seasonPlayed = 0;
  team.seasonWins = 0;
  team.progress = 0;
  return true;
}

export function updateTeams(s: GameState, dt: number, offline: boolean, factor: number, mods: Mods, teams: Record<string, TeamEval>, rng: Rng): void {
  for (const game of GAMES) {
    const team = s.teams[game.id];
    const ev = teams[game.id];
    if (!team || !ev || !s.games[game.id]?.unlocked) continue;
    if (offline) {
      if (ev.active) {
        earnCash(s, ev.cps * dt * factor);
        gainFans(s, ev.fansPerSec * dt * factor);
      }
      continue;
    }
    if (!ev.active) {
      team.progress = 0;
      if (team.bench.length > 0 && autoSubstitute(s, team)) team.progress = 0;
      continue;
    }
    team.progress += dt;
    let played = 0;
    while (team.progress >= ev.interval && played < MAX_MATCHES_PER_TICK) {
      team.progress -= ev.interval;
      playMatch(s, team, ev, mods, rng);
      autoSubstitute(s, team);
      played++;
    }
    if (played >= MAX_MATCHES_PER_TICK) team.progress = 0;
  }
}

/** Energy recovery, morale drift and recovery from illness. */
export function updatePlayers(s: GameState, dt: number): void {
  const starters = new Set<string>();
  for (const team of Object.values(s.teams)) for (const id of team.lineup) if (id) starters.add(id);
  for (const p of Object.values(s.players)) {
    const resting = !starters.has(p.id);
    // Recovery scales with missing energy, so starters settle at an equilibrium instead of burning out.
    const rate = resting ? 0.04 : 0.01;
    p.energy = Math.min(100, p.energy + (100 - p.energy) * Math.min(1, rate * dt));
    const base = moraleBase(p);
    p.morale += (base - p.morale) * Math.min(1, 0.01 * dt);
    if (p.status.kind !== 'healthy' && p.status.until <= s.time) {
      p.status = { kind: 'healthy', until: 0, reason: '' };
    }
  }
}

// ---------------------------------------------------------------------------
// Games
// ---------------------------------------------------------------------------

export function nextLockedGame(s: GameState) {
  return GAMES.find((g) => !s.games[g.id]?.unlocked);
}

export function canUnlockGame(s: GameState, gameId: string): boolean {
  const game = getGame(gameId);
  if (s.games[gameId]?.unlocked) return false;
  const prev = GAMES[game.index - 1];
  if (prev && !s.games[prev.id]?.unlocked) return false;
  return s.cash >= game.unlockCost;
}

export function unlockGame(s: GameState, gameId: string): boolean {
  if (!canUnlockGame(s, gameId)) return false;
  const game = getGame(gameId);
  s.cash -= game.unlockCost;
  s.games[gameId].unlocked = true;
  if (!s.teams[gameId]) s.teams[gameId] = createTeam(gameId);
  return true;
}

export function bestPlayerRating(s: GameState, team: TeamState): number {
  let best = 0;
  for (const id of teamPlayerIds(team)) {
    const p = s.players[id];
    if (p) best = Math.max(best, skillRating(p));
  }
  return best;
}
