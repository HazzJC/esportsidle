import { getGame } from '../data/games';
import { FAN_BASE, FAN_GROWTH, PRIZE_GROWTH, prizeSeconds, winChance } from '../data/leagues';
import { RIVAL_ORGS } from '../data/names';
import { addBuff } from './buffs';
import { applyMorale } from './players';
import type { Rng } from './rng';
import { scoreline } from './teams';
import type { GameState, Invitation, Mods, Rates, TeamEval, TournamentResult, TournamentRound } from './types';
import { addTrophy } from './stories';
import { earnCash, gainFans, gainTrophies } from './wallet';

export const ROUND_NAMES = ['Quarter-final', 'Semi-final', 'Grand Final'];
/**
 * Each round's opponent, as a share of a league opponent at the team's own tier. An Invitational
 * draws a field the team can beat: a side that wins half its league matches takes the whole thing
 * a little over half the time, and the final is still the hardest game of the three.
 */
export const ROUND_FIELD = [0.45, 0.55, 0.65];
/** Prize per round win, in multiples of a normal match prize one tier up. */
export const ROUND_PRIZE_WINS = [2, 4, 10];
/** How long an invitation waits for an answer before the team goes with no extra preparation. */
export const INVITATION_SECONDS = 120;
/** The least a paid preparation can cost, in seconds of income, so an empty bank is not a free boost. */
export const STAKE_MIN_SECONDS = 600;

export interface InvitationStake {
  id: string;
  name: string;
  desc: string;
  /** Share of cash spent. */
  share: number;
  /** Extra team rating for the event. */
  boost: number;
}

/** Ways to spend cash on a better shot at the trophy. The money is gone whatever the result. */
export const INVITATION_STAKES: InvitationStake[] = [
  { id: 'none', name: 'Just show up', desc: 'Play as you are.', share: 0, boost: 0 },
  { id: 'scrims', name: 'Paid scrims', desc: 'A week of practice against good teams.', share: 0.1, boost: 0.15 },
  { id: 'bootcamp', name: 'Bootcamp abroad', desc: 'Flights, a gaming house and a chef.', share: 0.25, boost: 0.35 },
  { id: 'allin', name: 'All in', desc: 'Analysts, sports science, the lot.', share: 0.5, boost: 0.6 },
];

/**
 * Invitationals get grander as the org climbs, so the name alone shows how far it has come. One step
 * every three league tiers.
 */
export const INVITATIONAL_NAMES = [
  'Community Invitational',
  'Open Invitational',
  'Pro Invitational',
  'Masters Invitational',
  'Elite Invitational',
  'Legends Invitational',
  'Galactic Invitational',
  'Multiverse Invitational',
];

export function invitationalName(tier: number): string {
  return INVITATIONAL_NAMES[Math.max(0, Math.min(INVITATIONAL_NAMES.length - 1, Math.floor(tier / 3)))];
}

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

/** The team an invitation is for, if it can still play; otherwise the current flagship. */
function invitedTeam(s: GameState, rates: Rates, gameId?: string): TeamEval | null {
  const ev = gameId ? rates.teams[gameId] : undefined;
  return ev?.active ? ev : pickTournamentTeam(s, rates);
}

export interface InvitationOdds {
  gameId: string;
  /** The prize tier: one above the team's league. */
  tier: number;
  /** Chance to win each round, given the rounds before it were won. */
  rounds: number[];
  /** Chance to win all three. */
  champion: number;
}

/** Round-by-round chances for a team, with an optional rating boost from paid preparation. */
export function invitationOdds(s: GameState, rates: Rates, mods: Mods, boost = 0, gameId?: string): InvitationOdds | null {
  const ev = invitedTeam(s, rates, gameId);
  if (!ev) return null;
  const rating = ev.rating * (1 + boost);
  const rounds = ROUND_FIELD.map((field) => winChance(rating, ev.opponent * field * mods.tournamentOpponentMult));
  return {
    gameId: ev.gameId,
    tier: (s.teams[ev.gameId]?.tier ?? 0) + 1,
    rounds,
    champion: rounds.reduce((p, c) => p * c, 1),
  };
}

/** What preparing for the Invitational costs right now. */
export function stakeCost(s: GameState, rates: Rates, stake: InvitationStake): number {
  if (stake.share <= 0) return 0;
  return Math.ceil(Math.max(stake.share * s.cash, stake.share * rates.cpsNoBuffs * STAKE_MIN_SECONDS));
}

/** Prize money for one "unit" of an Invitational at the given tier. */
function prizeUnit(s: GameState, ev: TeamEval, tier: number, ctx: TournamentContext): number {
  const game = getGame(ev.gameId);
  const popularity = s.games[game.id]?.popularity ?? 1;
  return (
    (game.basePrize * Math.pow(PRIZE_GROWTH, tier) + ctx.rates.cpsNoBuffs * prizeSeconds(tier)) *
    popularity *
    ctx.mods.prizeMult *
    (ctx.mods.gamePrizeMult[game.id] ?? 1) *
    (1 - ev.cut) *
    ctx.mods.tournamentRewardMult
  );
}

/** Trophies for the champions, which grow with the tier. */
export function championTrophies(tier: number): number {
  return 2 + Math.floor(tier / 4);
}

/** What the champions would take home, for the invitation screen. */
export function championPrize(s: GameState, ctx: TournamentContext, gameId?: string): number {
  const ev = invitedTeam(s, ctx.rates, gameId);
  if (!ev) return 0;
  const tier = (s.teams[ev.gameId]?.tier ?? 0) + 1;
  return prizeUnit(s, ev, tier, ctx) * ROUND_PRIZE_WINS.reduce((a, b) => a + b, 0);
}

/**
 * Plays a three-round Invitational with the flagship team (or the invited one). The field comes from
 * the team's own league; prizes and fans are paid at the tier above.
 */
export function runTournament(s: GameState, ctx: TournamentContext, boost = 0, gameId?: string, stakeSpent = 0): TournamentResult {
  const ev = invitedTeam(s, ctx.rates, gameId);
  if (!ev) throw new Error('No active team can enter an Invitational.');
  const team = s.teams[ev.gameId];
  const game = getGame(ev.gameId);
  const odds = invitationOdds(s, ctx.rates, ctx.mods, boost, ev.gameId)!;
  const tier = odds.tier;
  const popularity = s.games[game.id]?.popularity ?? 1;
  const unit = prizeUnit(s, ev, tier, ctx);

  const rounds: TournamentRound[] = [];
  const used = new Set<string>();
  for (let i = 0; i < ROUND_NAMES.length; i++) {
    const chance = odds.rounds[i];
    const win = ctx.rng.next() < chance;
    let opponent = ctx.rng.pick(RIVAL_ORGS);
    for (let guard = 0; used.has(opponent) && guard < 10; guard++) opponent = ctx.rng.pick(RIVAL_ORGS);
    used.add(opponent);
    const prize = win ? unit * ROUND_PRIZE_WINS[i] : 0;
    earnCash(s, prize, 'tournament');
    rounds.push({ name: ROUND_NAMES[i], opponent, win, score: scoreline(game.genre, win, ctx.rng), prize, chance });
    if (!win) break;
  }

  const wins = rounds.filter((r) => r.win).length;
  const champion = wins === ROUND_NAMES.length;
  const finalist = !champion && rounds.length === ROUND_NAMES.length;
  const trophies = champion ? championTrophies(tier) : finalist ? 1 : 0;
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

  const name = invitationalName(tier);
  s.stats.tournamentsPlayed++;
  if (finalist) addTrophy(s, { kind: 'runnerUp', gameId: game.id, tier, season: null, mvp: null, label: `${name} runners-up` }, trophies);
  if (champion) {
    s.stats.tournamentsWon++;
    const star = team.lineup
      .map((id) => (id ? s.players[id] : undefined))
      .filter((p) => p !== undefined)
      .sort((a, b) => b.level - a.level)[0];
    addTrophy(s, { kind: 'tournament', gameId: game.id, tier, season: null, mvp: star?.tag ?? null, label: `${name} champions` }, trophies);
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
    odds: odds.champion,
    stake: stakeSpent,
  };
  s.events.lastTournament = result;
  return result;
}

/** Sends the flagship team an invitation. Returns null when no team can play or one is already waiting. */
export function offerInvitation(s: GameState, ctx: TournamentContext): Invitation | null {
  if (s.events.invitation) return null;
  const ev = pickTournamentTeam(s, ctx.rates);
  if (!ev) return null;
  const invitation: Invitation = { id: s.nextId++, gameId: ev.gameId, expiresAt: s.time + INVITATION_SECONDS };
  s.events.invitation = invitation;
  return invitation;
}

/** Answers the invitation: pays for the chosen preparation, then plays the bracket. */
export function playInvitation(s: GameState, ctx: TournamentContext, stakeId = 'none'): TournamentResult | null {
  const invitation = s.events.invitation;
  if (!invitation) return null;
  const stake = INVITATION_STAKES.find((x) => x.id === stakeId) ?? INVITATION_STAKES[0];
  const cost = stakeCost(s, ctx.rates, stake);
  if (cost > s.cash) return null;
  if (!invitedTeam(s, ctx.rates, invitation.gameId)) {
    // The whole roster has gone; the invitation lapses.
    s.events.invitation = null;
    return null;
  }
  s.cash -= cost;
  s.events.invitation = null;
  return runTournament(s, ctx, stake.boost, invitation.gameId, cost);
}

/** An unanswered invitation plays itself when it runs out, with no extra preparation. */
export function updateInvitation(s: GameState, ctx: TournamentContext): TournamentResult | null {
  const invitation = s.events.invitation;
  if (!invitation || s.time < invitation.expiresAt) return null;
  return playInvitation(s, ctx, 'none');
}
