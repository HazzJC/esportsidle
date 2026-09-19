import { getGame } from '../data/games';
import { FIRST_PLAYER_PRICE } from '../data/tutorial';
import { signingFee } from './market';
import { generatePlayer, makeTagUnique } from './players';
import type { Rng } from './rng';
import { addToTeam, createTeam, ensureTeam, evaluateTeam } from './teams';
import type { Appearance, GameState, MarketListing, Mods, Player, Rarity } from './types';

/** The first team is always the solo game, so one signing makes a full lineup. */
export const DRAFT_GAME = 'smash';

/** A brand-new org's first player: an ordinary rookie, reached after 25 clicks. */
export { FIRST_PLAYER_PRICE };
export const FIRST_PLAYER_RARITY: Rarity = 'rookie';
/** Later runs without a founder start with a better prospect, priced like the market. */
export const LATER_PLAYER_RARITY: Rarity = 'talent';

export const MAX_TAG = 16;
export const MAX_NAME = 20;

/** The run's first-player prospect. The player can rename and restyle them before signing. */
export function createDraft(s: GameState, rng: Rng): MarketListing[] {
  const firstRun = s.prestige.runs === 0;
  const rarity = firstRun ? FIRST_PLAYER_RARITY : LATER_PLAYER_RARITY;
  const player = generatePlayer(rng, { id: `p${s.nextId++}`, gameId: DRAFT_GAME, time: s.time, rarity });
  player.tag = makeTagUnique(new Set(Object.values(s.players).map((p) => p.tag)), player.tag);
  return [{ player, price: firstRun ? FIRST_PLAYER_PRICE : signingFee(player) }];
}

export interface DraftCustomisation {
  tag?: string;
  first?: string;
  last?: string;
  look?: Partial<Appearance>;
}

const clean = (text: string, max: number) => text.replace(/\s+/g, ' ').trim().slice(0, max);

/** Renames or restyles the prospect before they sign. Blank names are ignored. */
export function customiseDraft(s: GameState, fields: DraftCustomisation): boolean {
  const p = s.draft?.[0]?.player;
  if (!p) return false;
  if (fields.tag !== undefined && clean(fields.tag, MAX_TAG)) p.tag = clean(fields.tag, MAX_TAG);
  if (fields.first !== undefined && clean(fields.first, MAX_NAME)) p.first = clean(fields.first, MAX_NAME);
  if (fields.last !== undefined && clean(fields.last, MAX_NAME)) p.last = clean(fields.last, MAX_NAME);
  if (fields.look) Object.assign(p.look, fields.look);
  return true;
}

export type DraftResult = { ok: true; player: Player } | { ok: false; reason: string };

/**
 * Signs the prospect, which founds the team. An org's first signing becomes its founding player:
 * they take no cut of prize money, cannot be sold, and return with the same name and look every
 * time the org is sold and starts again.
 */
export function signDraftPick(s: GameState, playerId: string, mods: Pick<Mods, 'benchSlots'>): DraftResult {
  const pick = s.draft?.find((l) => l.player.id === playerId);
  if (!pick) return { ok: false, reason: 'That prospect is no longer available.' };
  if (s.cash < pick.price) return { ok: false, reason: `Not enough cash yet. ${getGame(pick.player.gameId).name} prospects sign for their listed fee.` };
  s.cash -= pick.price;
  ensureTeam(s, pick.player.gameId);
  const founding = !s.players.founder;
  const player: Player = {
    ...pick.player,
    ...(founding ? { id: 'founder', founder: true, cut: 0 } : {}),
    fee: pick.price,
    signedAt: s.time,
    signedLevel: pick.player.level,
  };
  s.players[player.id] = player;
  addToTeam(s, player, mods);
  s.stats.playersSigned++;
  s.draft = null;
  return { ok: true, player };
}

export interface DraftOutlook {
  /** Win chance in the bottom league. */
  win: number;
  /** The highest league tier where this prospect alone still wins at least half the time; -1 for none. */
  reach: number;
}

/** Tiers checked when working out how far a prospect could carry a team. */
const REACH_LIMIT = 12;

/**
 * How a prospect would do as the org's first team. Stronger prospects are not paid more per win at
 * the bottom (they stomp it, and lopsided wins pay less); their value is how far up they can climb.
 */
export function draftOutlook(s: GameState, player: Player, mods: Mods): DraftOutlook {
  const team = createTeam(player.gameId);
  team.lineup[0] = player.id;
  const s2: GameState = { ...s, players: { ...s.players, [player.id]: player }, teams: { ...s.teams, [player.gameId]: team } };
  const ctx = { cpsNoBuffs: 0, incomeBuff: 1, fansMult: mods.fansMult };
  const win = evaluateTeam(s2, team, mods, ctx).winChance;
  let reach = win >= 0.5 ? 0 : -1;
  for (let tier = 1; reach >= 0 && tier <= REACH_LIMIT; tier++) {
    team.tier = tier;
    if (evaluateTeam(s2, team, mods, ctx).winChance < 0.5) break;
    reach = tier;
  }
  return { win, reach };
}
