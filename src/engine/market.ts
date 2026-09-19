import { GAMES, getGame } from '../data/games';
import { RARITY_MAP, generatePlayer, transferValue } from './players';
import type { Rng } from './rng';
import type { GameState, MarketListing, Mods, Player } from './types';
import { addToTeam, ensureTeam, hasRosterSpace, removeFromTeams } from './teams';

export const MARKET_BASE_SIZE = 6;
export const MARKET_REFRESH_SECONDS = 180;

export function marketSize(mods: Pick<Mods, 'marketSize'>): number {
  return MARKET_BASE_SIZE + mods.marketSize;
}

export function signingFee(p: Player): number {
  const rarity = RARITY_MAP.get(p.rarity)!;
  const core = (p.stats.mechanics + p.stats.gameSense + p.stats.teamwork + p.stats.composure) / 4;
  const quality = Math.max(0, Math.min(1, (core - rarity.statMin) / Math.max(1, rarity.statMax - rarity.statMin)));
  return Math.ceil(rarity.fee * getGame(p.gameId).costScale * (0.8 + 0.5 * quality) * (1 + (p.potential - rarity.potMin) / 100));
}

type ListingMods = Pick<Mods, 'scoutLuck'> & Partial<Pick<Mods, 'feeMult'>>;

function makeListing(s: GameState, rng: Rng, gameId: string, mods: ListingMods): MarketListing {
  const player = generatePlayer(rng, { id: `p${s.nextId++}`, gameId, time: s.time, luck: mods.scoutLuck });
  return { player, price: Math.ceil(signingFee(player) * (mods.feeMult ?? 1)) };
}

export function refreshMarket(s: GameState, rng: Rng, mods: ListingMods & Pick<Mods, 'marketSize'>): void {
  const unlocked = GAMES.filter((g) => s.games[g.id]?.unlocked);
  if (unlocked.length === 0) return;
  const listings: MarketListing[] = [];
  for (let i = 0; i < marketSize(mods); i++) {
    const game =
      rng.weighted(unlocked, (g) => {
        const team = s.teams[g.id];
        const open = team ? team.lineup.filter((id) => id === null).length : 0;
        return 1 + open * 2 + g.index * 0.5;
      }) ?? unlocked[0];
    listings.push(makeListing(s, rng, game.id, mods));
  }
  listings.sort((a, b) => getGame(a.player.gameId).index - getGame(b.player.gameId).index || a.price - b.price);
  s.market.listings = listings;
  s.market.nextRefresh = s.time + MARKET_REFRESH_SECONDS;
}

/** Adds fresh listings for a newly unlocked game, replacing the oldest ones. */
export function seedMarketForGame(s: GameState, rng: Rng, gameId: string, count: number, mods: ListingMods): void {
  const fresh = Array.from({ length: count }, () => makeListing(s, rng, gameId, mods));
  s.market.listings = [...fresh, ...s.market.listings].slice(0, Math.max(MARKET_BASE_SIZE, s.market.listings.length));
}

export function updateMarket(s: GameState, rng: Rng, mods: Pick<Mods, 'scoutLuck' | 'marketSize'>): void {
  if (s.time >= s.market.nextRefresh) refreshMarket(s, rng, mods);
}

export function rerollCost(cpsNoBuffs: number, rerolls: number): number {
  return Math.ceil(Math.max(50, cpsNoBuffs * 60) * (1 + rerolls * 0.25));
}

export function rerollMarket(s: GameState, rng: Rng, mods: Pick<Mods, 'scoutLuck' | 'marketSize'>, cpsNoBuffs: number): boolean {
  const cost = rerollCost(cpsNoBuffs, s.market.rerolls);
  if (s.cash < cost) return false;
  s.cash -= cost;
  s.market.rerolls++;
  refreshMarket(s, rng, mods);
  return true;
}

export type SignResult = { ok: true; player: Player } | { ok: false; reason: string };

export function signListing(s: GameState, playerId: string, mods: Pick<Mods, 'benchSlots'>): SignResult {
  const index = s.market.listings.findIndex((l) => l.player.id === playerId);
  if (index < 0) return { ok: false, reason: 'That player is no longer available.' };
  const listing = s.market.listings[index];
  const gameId = listing.player.gameId;
  if (!s.games[gameId]?.unlocked) return { ok: false, reason: `You don't have a ${getGame(gameId).name} team yet.` };
  // The first signing in an unlocked game founds its team.
  if (!s.teams[gameId]) ensureTeam(s, gameId);
  if (!hasRosterSpace(s, gameId, mods)) return { ok: false, reason: 'That roster is full. Sell a player or buy more bench space.' };
  if (s.cash < listing.price) return { ok: false, reason: 'Not enough cash.' };
  s.cash -= listing.price;
  const player: Player = { ...listing.player, fee: listing.price, signedAt: s.time, signedLevel: listing.player.level };
  s.players[player.id] = player;
  addToTeam(s, player, mods);
  s.market.listings.splice(index, 1);
  s.stats.playersSigned++;
  s.draft = null;
  return { ok: true, player };
}

/** Sells to a rival org. `teamCps` is the player's team income, which prices their development. */
export function sellPlayer(s: GameState, playerId: string, teamCps = 0): number {
  const p = s.players[playerId];
  if (!p || p.founder) return 0;
  const value = transferValue(p, teamCps, getGame(p.gameId).teamSize);
  removeFromTeams(s, playerId);
  delete s.players[playerId];
  s.cash += value;
  s.stats.playersSold++;
  return value;
}
