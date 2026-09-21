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
import { DECLINE_AGE, RETIRE_AGE, RETIRE_CHANCE_PER_YEAR, SEASONS_PER_YEAR, SEASON_PLANS, type SeasonPlan } from '../data/seasonPlans';
import { emit } from './bus';
import { fmt, money } from './format';
import { BENCH_RECOVERY_MULT, rollHealth } from './health';
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
import { MOODS, STAKES_START, recordForm, resetFormForTier, stakesMult, teamMood } from './mood';
import { calmStart } from './tutorial';
import { Rng } from './rng';
import { automationActive } from './automation';
import { playerEasterEgg } from './easterEggs';
import type { GameState, MatchRecord, Mods, Player, StatKey, TeamEval, TeamKit, TeamState } from './types';
import { RIVAL_FANS_MULT, addTrophy, checkPlayerMilestones, checkServiceMilestones, pickOpponent, recordRivalMatch, recordSeason } from './stories';
import { earnCash, gainFans, gainTrophies } from './wallet';

export const HISTORY_LENGTH = 12;
export const MAX_MATCHES_PER_TICK = 20;
/**
 * Win chance needed to challenge into a tier the team has never reached. The same point where crowds
 * start losing interest, so the button lights up exactly when staying put starts to cost money.
 */
export const CHALLENGE_WIN_CHANCE = STAKES_START;

export function createTeam(gameId: string): TeamState {
  const game = getGame(gameId);
  return {
    gameId,
    kit: null,
    plan: 'balanced',
    nextPlan: null,
    seasonEarnings: 0,
    seasonStats: {},
    lastSeason: null,
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
    form: 0.5,
    history: [],
    wins: 0,
    losses: 0,
    streak: 0,
    titles: 0,
    earnings: 0,
  };
}

/** Gives a game its team if it has none yet: the first signing in a game founds the team. */
export function ensureTeam(s: GameState, gameId: string): TeamState {
  s.games[gameId].unlocked = true;
  s.teams[gameId] ??= createTeam(gameId);
  return s.teams[gameId];
}

export function teamPlan(team: TeamState) {
  return SEASON_PLANS[team.plan] ?? SEASON_PLANS.balanced;
}

/** Plans are season-level: a change waits for the next season unless this one has not started. */
export function setSeasonPlan(s: GameState, gameId: string, plan: SeasonPlan): boolean {
  const team = s.teams[gameId];
  if (!team || !SEASON_PLANS[plan]) return false;
  if (team.seasonPlayed === 0) {
    team.plan = plan;
    team.nextPlan = null;
  } else {
    team.nextPlan = plan === team.plan ? null : plan;
  }
  return true;
}

/** The colours a team plays in: its own kit if it has one, otherwise the org's team colours. */
export function teamKit(s: GameState, gameId: string): TeamKit {
  return s.teams[gameId]?.kit ?? { primary: s.org.primary, secondary: s.org.secondary };
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
  // Solo Queue challenge: one player per team.
  if (s.prestige.challenge === 'solo') return teamPlayerIds(team).length === 0;
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
    if (!starter && !automationActive(s, 'roster')) continue;
    const needsSub = !starter || !isAvailable(starter, s.time) || starter.energy < teamPlan(team).subAt;
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
      if (playerEasterEgg(p) === 'faker' && team.gameId === 'lanes') teamMult *= 1.25;
    } else {
      ratings.push(STAND_IN_RATING);
    }
  });
  const active = available > 0;
  const average = ratings.reduce((a, b) => a + b, 0) / Math.max(1, ratings.length);
  const chemistry = game.teamSize > 1 ? 1 + 0.2 * team.chemistry : 1;
  const rating =
    average *
    teamMult *
    chemistry *
    mods.teamRatingMult *
    (mods.genreRatingMult[game.genre] ?? 1) *
    (mods.gameRatingMult[game.id] ?? 1) *
    teamPlan(team).rating;
  const opponent = opponentRating(team.tier) * mods.opponentMult;
  const chance = active ? winChance(rating, opponent) : 0;
  // Foregone conclusions draw smaller crowds and purses (see mood.ts).
  const stakes = stakesMult(chance);
  const popularity = s.games[team.gameId]?.popularity ?? 1;
  const cut = available > 0 ? cutSum / available : 0;
  // Prize upgrades multiply the flat tier prize only. The income-linked share exists to keep matches
  // relevant as operations grow; multiplying it as well would make each team a scaled copy of the
  // whole economy, so total income became a large multiple of operations income and ran away.
  const flat = game.basePrize * Math.pow(PRIZE_GROWTH, team.tier) * mods.prizeMult * (mods.gamePrizeMult[game.id] ?? 1);
  const share = ctx.cpsNoBuffs * prizeSeconds(team.tier);
  const gross = (flat + share) * popularity * ctx.incomeBuff;
  const winPrize = gross * (1 - cut) * stakes;
  const lossPrize = winPrize * LOSS_PRIZE_RATIO;
  const fansWin = FAN_BASE * Math.pow(FAN_GROWTH, team.tier) * popularity * ctx.fansMult * (available > 0 ? fansSum / available : 1) * stakes;
  const interval = game.matchSeconds / mods.matchSpeed;
  return {
    gameId: team.gameId,
    rating,
    opponent,
    winChance: chance,
    stakes,
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

/** A win at less than this chance counts as an upset. */
export const UPSET_CHANCE = 0.1;

/** Whether the founding player is the only player the org has signed. */
function onlyFounder(s: GameState): boolean {
  const players = Object.values(s.players);
  return players.length === 1 && players[0].founder;
}

export function playMatch(s: GameState, team: TeamState, ev: TeamEval, mods: Mods, rng: Rng): MatchRecord {
  const game = getGame(team.gameId);
  const roll = rng.next();
  // An org's very first match is always a win, so the tutorial starts on a high.
  const firstEver = s.stats.matchesWon + s.stats.matchesLost === 0;
  let win = firstEver || roll < ev.winChance;
  const hasBubbystr = team.lineup.some((id) => id && playerEasterEgg(s.players[id]) === 'bubbystr');
  if (!win && hasBubbystr) {
    s.stats.bubbystrLosses = (s.stats.bubbystrLosses ?? 0) + 1;
    if (s.stats.bubbystrLosses % 5 === 0) {
      win = true;
    }
  }
  const opponent = pickOpponent(s, rng);
  const prize = (win ? ev.winPrize : ev.lossPrize) * (opponent.rival ? 1.5 + Math.min(1.5, (s.rival?.heat ?? 0) * 0.2) : 1);
  // Grudge matches: wins against the rival bring in extra fans.
  const fans = (win ? ev.fansWin : ev.fansWin * LOSS_FAN_RATIO) * (opponent.rival && win ? RIVAL_FANS_MULT : 1);
  earnCash(s, prize, 'match');
  gainFans(s, fans);
  if (opponent.rival) recordRivalMatch(s, win, team.gameId);

  const record: MatchRecord = {
    win,
    score: scoreline(game.genre, win, rng),
    opponent: opponent.name,
    rival: opponent.rival,
    prize,
    fans,
    tier: team.tier,
    time: s.time,
  };
  team.history.unshift(record);
  if (team.history.length > HISTORY_LENGTH) team.history.length = HISTORY_LENGTH;
  team.earnings += prize;
  team.seasonEarnings += prize;
  if (win) {
    team.wins++;
    team.streak = team.streak >= 0 ? team.streak + 1 : 1;
    s.stats.matchesWon++;
  } else {
    team.losses++;
    team.streak = team.streak <= 0 ? team.streak - 1 : -1;
    s.stats.matchesLost++;
  }
  if (win && !firstEver && ev.winChance < UPSET_CHANCE) s.stats.upsetWins++;
  s.stats.bestWinStreak = Math.max(s.stats.bestWinStreak, team.streak);
  s.stats.worstLoseStreak = Math.max(s.stats.worstLoseStreak, -team.streak);
  s.stats.prizeMoneyTotal += prize;
  team.seasonPlayed++;
  if (win) team.seasonWins++;
  if (game.teamSize > 1) team.chemistry = Math.min(1, team.chemistry + 0.01);

  const hasBench = team.bench.length > 0;
  const plan = teamPlan(team);
  // Mood reflects the run of results before this match; this result then joins the form.
  const mood = MOODS[teamMood(team)];
  recordForm(team, win);
  const baseXp = (win ? 15 : 10) * mods.xpMult;
  for (const id of team.lineup) {
    const p = id ? s.players[id] : undefined;
    if (!p || !isAvailable(p, s.time)) continue;
    p.matches++;
    if (win) {
      p.wins++;
      team.seasonStats[p.id] = (team.seasonStats[p.id] ?? 0) + 1;
    }
    const levels = grantXp(p, baseXp * plan.xp * mood.xp * playerXpMult(p), rng);
    checkPlayerMilestones(s, p, win, levels);
    applyMorale(p, (win ? mood.moraleWin : mood.moraleLoss) - (opponent.rival && !win ? 4 + Math.min(12, (s.rival?.heat ?? 0) * 2) : 0), mods);
    drainEnergy(p, mods, plan.drain);
    if (!calmStart(s)) rollHealth(s, p, mods, rng, hasBench, plan.injuryRisk);
  }
  // Bench players train alongside; how much depends on the plan.
  if (plan.benchXp > 0) {
    for (const id of team.bench) {
      const p = s.players[id];
      if (p && isAvailable(p, s.time)) grantXp(p, baseXp * plan.benchXp * playerXpMult(p), rng);
    }
  }

  if (team.seasonPlayed >= SEASON_LENGTH) endSeason(s, team, ev, rng);
  return record;
}

export function endSeason(s: GameState, team: TeamState, ev: TeamEval, rng: Rng = new Rng(s)): void {
  const game = getGame(team.gameId);
  const wins = team.seasonWins;
  const record = `${wins}-${SEASON_LENGTH - wins}`;
  const promoted = wins >= PROMOTE_WINS && team.autoPromote;
  const relegated = !promoted && wins <= RELEGATE_WINS && team.tier > 0;
  recordSeason(s, team, { title: wins >= TITLE_WINS, promoted, relegated });
  const resultBody: string[] = [`${record} in the ${tierName(team.tier)}.`];
  if (wins >= TITLE_WINS) {
    team.titles++;
    s.stats.seasonTitles++;
    if (wins >= SEASON_LENGTH) s.stats.perfectSeasons++;
    if (onlyFounder(s)) s.stats.soloFounderTitles++;
    gainTrophies(s, 1);
    addTrophy(s, { kind: 'title', gameId: team.gameId, tier: team.tier, season: team.seasonNumber, mvp: team.lastSeason?.mvp ?? null });
    const bonus = ev.winPrize * 12;
    earnCash(s, bonus, 'match');
    resultBody.push(`+1 trophy and ${money(bonus)} bonus.`);
    if (team.lastSeason?.mvp) resultBody.push(`Season MVP: ${team.lastSeason.mvp}.`);
  }
  if (wins >= PROMOTE_WINS && team.autoPromote) {
    team.tier++;
    resetFormForTier(team);
    team.bestTier = Math.max(team.bestTier, team.tier);
    s.stats.promotions++;
    resultBody.push(`Promoted to the ${tierName(team.tier)}.`);
  } else if (relegated) {
    team.tier--;
    resetFormForTier(team);
    resultBody.push(`Relegated to the ${tierName(team.tier)}.`);
  }
  if (wins >= TITLE_WINS || promoted || relegated) emit({
    type: 'toast',
    title: wins >= TITLE_WINS ? `${game.name}: league champions!` : promoted ? `${game.name}: promoted!` : `${game.name}: relegated`,
    body: resultBody.join(' '),
    icon: wins >= TITLE_WINS ? 'trophy' : promoted ? 'trending-up' : 'trending-down',
    tone: wins >= TITLE_WINS ? 'gold' : promoted ? 'good' : 'bad',
    channel: 'matches',
  });
  ageSquad(s, team, rng);
  if (team.nextPlan) {
    team.plan = team.nextPlan;
    team.nextPlan = null;
  }
  team.seasonNumber++;
  team.seasonPlayed = 0;
  team.seasonWins = 0;
  team.seasonEarnings = 0;
  team.seasonStats = {};
}

/** End of a season: announced retirements take effect and everyone else gets a season older. */
function ageSquad(s: GameState, team: TeamState, rng: Rng): void {
  for (const id of teamPlayerIds(team)) {
    const p = s.players[id];
    if (!p || p.founder) continue;
    if (p.retiring) {
      retirePlayer(s, p);
      continue;
    }
    p.seasons++;
    checkServiceMilestones(s, p);
    if (p.seasons % SEASONS_PER_YEAR !== 0) continue;
    p.age++;
    if (p.age >= DECLINE_AGE) {
      p.potential = Math.max(20, p.potential - 2);
      p.stats.mechanics = Math.max(5, p.stats.mechanics - 2);
      p.stats.stamina = Math.max(5, p.stats.stamina - 2);
      for (const k of Object.keys(p.stats) as StatKey[]) p.stats[k] = Math.min(p.stats[k], p.potential);
    }
    if (p.age >= RETIRE_AGE && rng.chance(RETIRE_CHANCE_PER_YEAR * (p.age - RETIRE_AGE + 1))) {
      p.retiring = true;
      emit({
        type: 'toast',
        title: `${p.tag} will retire after next season`,
        body: `Aged ${p.age}. Sell before then if you want a fee for them.`,
        icon: 'calendar-clock',
        tone: 'info',
        channel: 'players',
      });
    }
  }
}

export function retirePlayer(s: GameState, p: Player): void {
  removeFromTeams(s, p.id);
  delete s.players[p.id];
  s.stats.playersRetired++;
  emit({
    type: 'toast',
    title: `${p.tag} retires`,
    body: `${p.seasons} seasons and ${fmt(p.wins)} wins with ${s.org.name}. Thanks for everything.`,
    icon: 'heart',
    tone: 'gold',
    channel: 'players',
  });
}

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
  resetFormForTier(team);
  team.seasonPlayed = 0;
  team.seasonWins = 0;
  team.progress = 0;
  return true;
}

export function updateTeams(s: GameState, dt: number, offline: boolean, factor: number, mods: Mods, teams: Record<string, TeamEval>, rng: Rng, pauseTeams = false): void {
  for (const game of GAMES) {
    const team = s.teams[game.id];
    const ev = teams[game.id];
    if (!team || !ev || !s.games[game.id]?.unlocked) continue;
    if (offline) {
      if (ev.active) {
        earnCash(s, ev.cps * dt * factor, 'match');
        gainFans(s, ev.fansPerSec * dt * factor);
      }
      continue;
    }
    if (!ev.active) {
      team.progress = 0;
      if (!pauseTeams && team.bench.length > 0) autoSubstitute(s, team);
      continue;
    }
    team.progress += dt;
    let played = 0;
    while (team.progress >= ev.interval && played < MAX_MATCHES_PER_TICK) {
      team.progress -= ev.interval;
      if (!pauseTeams) autoSubstitute(s, team);
      playMatch(s, team, ev, mods, rng);
      played++;
    }
    if (played >= MAX_MATCHES_PER_TICK) team.progress = 0;
  }
}

/** Energy recovery, morale drift and recovery from illness. */
export function updatePlayers(s: GameState, dt: number, mods: Mods): void {
  const starters = new Set<string>();
  const recovery = new Map<string, number>();
  for (const team of Object.values(s.teams)) {
    for (const id of team.lineup) if (id) starters.add(id);
    for (const id of teamPlayerIds(team)) recovery.set(id, teamPlan(team).recovery);
  }
  let unavailable = 0;
  for (const p of Object.values(s.players)) {
    const resting = !starters.has(p.id);
    // Recovery scales with missing energy, so starters settle at an equilibrium instead of burning out.
    const rate = (resting ? 0.04 : 0.01) * mods.energyRecoveryMult * (recovery.get(p.id) ?? 1);
    p.energy = Math.min(100, p.energy + (100 - p.energy) * Math.min(1, rate * dt));
    const base = moraleBase(p, mods);
    p.morale += (base - p.morale) * Math.min(1, 0.01 * dt);
    if (p.status.kind !== 'healthy') {
      // Rest works: off the stage, the clock on an illness or injury runs faster.
      if (resting) p.status.until -= dt * (BENCH_RECOVERY_MULT - 1);
      if (p.status.until <= s.time) {
        p.status = { kind: 'healthy', until: 0, reason: '' };
        emit({ type: 'toast', title: `${p.tag} is back`, body: 'Recovered and ready to compete.', icon: 'heart-pulse', tone: 'good', channel: 'players' });
      } else {
        unavailable++;
      }
    }
  }
  if (unavailable > s.stats.mostUnavailable) s.stats.mostUnavailable = unavailable;
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
  // Franchise players kept from a previous run join once their game is back.
  const waiting = s.prestige.reserve.filter((p) => p.gameId === gameId);
  if (waiting.length > 0) {
    s.prestige.reserve = s.prestige.reserve.filter((p) => p.gameId !== gameId);
    for (const p of waiting) {
      s.players[p.id] = p;
      addToTeam(s, p, { benchSlots: 1 });
    }
  }
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
