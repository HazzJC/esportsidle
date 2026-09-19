import { getGame } from '../data/games';
import { FAN_BASE, FAN_GROWTH, PRIZE_GROWTH, opponentRating, prizeSeconds, winChance } from '../data/leagues';
import { RIVAL_ORGS } from '../data/names';
import { addBuff } from './buffs';
import { applyMorale } from './players';
import type { Rng } from './rng';
import { scoreline } from './teams';
import type { GameState, Mods, Rates, TeamEval, TournamentResult, TournamentRound } from './types';
import { addTrophy } from './stories';
import { earnCash, gainFans, gainTrophies } from './wallet';

export const ROUND_NAMES = ['Quarter-final', 'Semi-final', 'Grand Final'];
/** Opponents get tougher each round. */
export const ROUND_DIFFICULTY = [1, 1.12, 1.25];
/** Prize per round win, in multiples of a normal match prize at the tournament tier. */
export const ROUND_PRIZE_WINS = [2, 4, 10];

export interface TournamentContext {
  rng: Rng;
  mods: Mods;
  rates: Rates;
}

/** The org's flagship team: highest tier, then highest win chance. */
export function pickTournamentTeam(s: GameState, rates: Rates): TeamEval | null {
  let best: TeamEval | null = null;
  let bestTier = -1;
  for (const ev of Object.values(rates.teams)) {
    if (!ev.active) continue;
    const tier = s.teams[ev.gameId]?.tier ?? 0;
    if (tier > bestTier || (tier === bestTier && best && ev.winChance > best.winChance)) {
      best = ev;
      bestTier = tier;
    }
  }
  return best;
}

/** Plays a three-round invitational one tier above the flagship team's league. */
export function runTournament(s: GameState, ctx: TournamentContext): TournamentResult {
  const ev = pickTournamentTeam(s, ctx.rates);
  if (!ev) throw new Error('No active team can enter a tournament.');
  const team = s.teams[ev.gameId];
  const game = getGame(ev.gameId);
  const tier = team.tier + 1;
  const popularity = s.games[game.id]?.popularity ?? 1;
  const baseOpponent = opponentRating(tier) * ctx.mods.opponentMult * ctx.mods.tournamentOpponentMult;
  const prizeUnit =
    (game.basePrize * Math.pow(PRIZE_GROWTH, tier) + ctx.rates.cpsNoBuffs * prizeSeconds(tier)) *
    popularity *
    ctx.mods.prizeMult *
    (ctx.mods.gamePrizeMult[game.id] ?? 1) *
    (1 - ev.cut) *
    ctx.mods.tournamentRewardMult;

  const rounds: TournamentRound[] = [];
  const used = new Set<string>();
  for (let i = 0; i < ROUND_NAMES.length; i++) {
    const chance = winChance(ev.rating, baseOpponent * ROUND_DIFFICULTY[i]);
    const win = ctx.rng.next() < chance;
    let opponent = ctx.rng.pick(RIVAL_ORGS);
    for (let guard = 0; used.has(opponent) && guard < 10; guard++) opponent = ctx.rng.pick(RIVAL_ORGS);
    used.add(opponent);
    const prize = win ? prizeUnit * ROUND_PRIZE_WINS[i] : 0;
    earnCash(s, prize, 'tournament');
    rounds.push({ name: ROUND_NAMES[i], opponent, win, score: scoreline(game.genre, win, ctx.rng), prize, chance });
    if (!win) break;
  }

  const wins = rounds.filter((r) => r.win).length;
  const champion = wins === ROUND_NAMES.length;
  const finalist = !champion && rounds.length === ROUND_NAMES.length;
  const trophies = champion ? 2 + Math.floor(tier / 4) : finalist ? 1 : 0;
  gainTrophies(s, trophies);

  const fanUnit = FAN_BASE * Math.pow(FAN_GROWTH, tier) * popularity * ctx.mods.fansMult;
  const fans = champion ? fanUnit * 25 : fanUnit * 3 * wins;
  gainFans(s, fans);

  if (champion) {
    addBuff(s, {
      id: 'champions',
      name: 'Champions!',
      icon: 'trophy',
      tone: 'good',
      desc: 'Income ×2',
      duration: 120 * ctx.mods.buffDurationMult,
      effects: [{ kind: 'income', mult: 2 }],
    });
  }
  for (const id of team.lineup) {
    const p = id ? s.players[id] : undefined;
    if (p) applyMorale(p, champion ? 12 : wins > 0 ? 3 : -5, ctx.mods);
  }

  s.stats.tournamentsPlayed++;
  if (finalist) addTrophy(s, { kind: 'runnerUp', gameId: game.id, tier, season: null, mvp: null, label: 'Invitational runner-up' }, trophies);
  if (champion) {
    s.stats.tournamentsWon++;
    const star = team.lineup
      .map((id) => (id ? s.players[id] : undefined))
      .filter((p) => p !== undefined)
      .sort((a, b) => b.level - a.level)[0];
    addTrophy(s, { kind: 'tournament', gameId: game.id, tier, season: null, mvp: star?.tag ?? null, label: 'Invitational champions' }, trophies);
  }

  const result: TournamentResult = {
    id: s.nextId++,
    gameId: game.id,
    tier,
    rounds,
    champion,
    trophies,
    fans,
    totalPrize: rounds.reduce((sum, r) => sum + r.prize, 0),
    seen: false,
  };
  s.events.lastTournament = result;
  return result;
}
