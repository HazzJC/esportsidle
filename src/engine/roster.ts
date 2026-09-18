import { getGame } from '../data/games';
import { addToTeam, assignSlot, evaluateTeam } from './teams';
import type { GameState, Mods, Player, TeamState } from './types';

/** Prize context is irrelevant to rating and win chance, so previews use a neutral one. */
const CTX = { cpsNoBuffs: 0, incomeBuff: 1, fansMult: 1 };

export interface TeamSnapshot {
  rating: number;
  win: number;
  /** 0-1: how settled the lineup is. Worth up to +20% rating in team games. */
  chemistry: number;
}

export interface RosterPreview {
  gameId: string;
  /** Where the player ends up. */
  placement: 'lineup' | 'bench' | 'full' | 'noTeam';
  slot: number | null;
  role: string | null;
  /** Playing their preferred role; off-role players perform at 85%. */
  onRole: boolean;
  /** The starter who makes room, when assigning over someone. */
  displaced: string | null;
  /** Whether the displaced starter swaps into the player's old slot or drops to the bench. */
  displacedTo: 'swap' | 'bench' | null;
  before: TeamSnapshot;
  after: TeamSnapshot;
  /** For a signing that lands on the bench: the best slot they would improve if started. */
  couldStart: { slot: number; role: string; after: TeamSnapshot } | null;
}

/** A what-if copy of the state in which only one team (and optionally one extra player) can change. */
function whatIf(s: GameState, gameId: string, extra?: Player): { s2: GameState; team: TeamState } {
  const original = s.teams[gameId];
  const team: TeamState = { ...original, lineup: [...original.lineup], bench: [...original.bench] };
  const players = extra ? { ...s.players, [extra.id]: extra } : s.players;
  return { s2: { ...s, players, teams: { ...s.teams, [gameId]: team } }, team };
}

function snapshot(s: GameState, team: TeamState, mods: Mods): TeamSnapshot {
  const ev = evaluateTeam(s, team, mods, CTX);
  return { rating: ev.rating, win: ev.winChance, chemistry: team.chemistry };
}

/** What signing `player` would do to their team, without changing anything. */
export function previewSigning(s: GameState, player: Player, mods: Mods): RosterPreview {
  const game = getGame(player.gameId);
  const empty: RosterPreview = {
    gameId: player.gameId,
    placement: 'noTeam',
    slot: null,
    role: null,
    onRole: true,
    displaced: null,
    displacedTo: null,
    before: { rating: 0, win: 0, chemistry: 0 },
    after: { rating: 0, win: 0, chemistry: 0 },
    couldStart: null,
  };
  if (!s.teams[player.gameId]) return empty;

  const before = snapshot(s, s.teams[player.gameId], mods);
  const { s2, team } = whatIf(s, player.gameId, player);
  if (!addToTeam(s2, player, mods)) return { ...empty, placement: 'full', before, after: before };

  const slot = team.lineup.indexOf(player.id);
  const after = snapshot(s2, team, mods);
  if (slot >= 0) {
    return { ...empty, placement: 'lineup', slot, role: game.roles[slot], onRole: game.teamSize === 1 || slot === player.role, before, after };
  }

  // On the bench: would starting them anywhere help?
  let couldStart: RosterPreview['couldStart'] = null;
  for (let i = 0; i < team.lineup.length; i++) {
    const trial = whatIf(s2, player.gameId);
    if (!assignSlot(trial.s2, player.gameId, player.id, i)) continue;
    const result = snapshot(trial.s2, trial.team, mods);
    if (result.win > before.win && (!couldStart || result.win > couldStart.after.win)) couldStart = { slot: i, role: game.roles[i], after: result };
  }
  return { ...empty, placement: 'bench', before, after, couldStart };
}

/** What moving `playerId` into lineup `slot` would do, without changing anything. */
export function previewAssign(s: GameState, gameId: string, playerId: string, slot: number, mods: Mods): RosterPreview | null {
  const original = s.teams[gameId];
  const p = s.players[playerId];
  if (!original || !p) return null;
  const game = getGame(gameId);
  const before = snapshot(s, original, mods);
  const displacedId = original.lineup[slot];
  const fromSlot = original.lineup.indexOf(playerId);
  const { s2, team } = whatIf(s, gameId);
  if (!assignSlot(s2, gameId, playerId, slot)) return null;
  return {
    gameId,
    placement: 'lineup',
    slot,
    role: game.roles[slot],
    onRole: game.teamSize === 1 || slot === p.role,
    displaced: displacedId && displacedId !== playerId ? (s.players[displacedId]?.tag ?? null) : null,
    displacedTo: displacedId && displacedId !== playerId ? (fromSlot >= 0 ? 'swap' : 'bench') : null,
    before,
    after: snapshot(s2, team, mods),
    couldStart: null,
  };
}
