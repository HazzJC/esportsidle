import { GAMES, getGame } from '../data/games';
import { RARITY_MAP, generatePlayer, makeTagUnique, transferValue } from './players';
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

/** Tags already in use, so a new face never shares one. */
function takenTags(s: GameState): Set<string> {
  return new Set([...Object.values(s.players).map((p) => p.tag), ...s.market.listings.map((l) => l.player.tag)]);
}

export const EASTER_EGG_CANDIDATES = [
  { tag: 'Faker', first: 'Sang-hyeok', last: 'Lee', gameId: 'lanes', nation: 'KR', rarity: 'legend' as const },
  { tag: 'TheOnlyCook', first: 'The', last: 'Cook', gameId: 'smash', nation: 'GB', rarity: 'legend' as const },
  { tag: 'Varantha', first: 'Victor', last: 'Varantha', gameId: 'counter', nation: 'CA', rarity: 'star' as const },
  { tag: 'Bubbystr', first: 'Bubby', last: 'Star', gameId: 'rocket', nation: 'US', rarity: 'star' as const },
  { tag: 'Nijacat22', first: 'Nija', last: 'Neko', gameId: 'apex', nation: 'JP', rarity: 'star' as const },
  { tag: 'MrKonRadical', first: 'Konrad', last: 'Radical', gameId: 'valorunt', nation: 'AU', rarity: 'star' as const },
];

function makeEasterEggListing(s: GameState, rng: Rng, candidate: typeof EASTER_EGG_CANDIDATES[0]): MarketListing {
  const player = generatePlayer(rng, {
    id: `p${s.nextId++}`,
    gameId: candidate.gameId,
    time: s.time,
    rarity: candidate.rarity,
  });
  player.tag = candidate.tag;
  player.first = candidate.first;
  player.last = candidate.last;
  player.nation = candidate.nation;
  return {
    player,
    price: 5,
    currency: 'legacy',
    isEasterEgg: true,
  };
}

function makeListing(s: GameState, rng: Rng, gameId: string, mods: ListingMods): MarketListing {
  const hasBias = s.prestige.nodes.scout_bias !== undefined;
  const hasTrait = s.prestige.nodes.scout_trait !== undefined;
  const rarityBias = hasBias ? s.market.scouting?.rarityBias : null;
  const traitFocus = hasTrait ? s.market.scouting?.traitFocus : null;

  const player = generatePlayer(rng, {
    id: `p${s.nextId++}`,
    gameId,
    time: s.time,
    luck: mods.scoutLuck,
    rarityBias,
    traitFocus,
  });
  player.tag = makeTagUnique(takenTags(s), player.tag);
  return { player, price: Math.ceil(signingFee(player) * (mods.feeMult ?? 1)), currency: 'cash' };
}

/** A pin slot: one per role of one game, so a roster's worth of prospects can be held at most. */
export function pinSlot(p: Player): string {
  return `${p.gameId}:${p.role}`;
}

export function isPinned(s: GameState, playerId: string): boolean {
  return s.market.pinned.includes(playerId);
}

/** The pinned listing that holds the same slot as this player, if there is one. */
export function pinnedRival(s: GameState, p: Player): MarketListing | undefined {
  return s.market.listings.find((l) => l.player.id !== p.id && isPinned(s, l.player.id) && pinSlot(l.player) === pinSlot(p));
}

/** Pins a listing so market refreshes keep it. Pinning replaces any pin on the same role. */
export function togglePin(s: GameState, playerId: string): boolean {
  const listing = s.market.listings.find((l) => l.player.id === playerId);
  if (!listing) return false;
  if (isPinned(s, playerId)) {
    s.market.pinned = s.market.pinned.filter((id) => id !== playerId);
    return true;
  }
  const slot = pinSlot(listing.player);
  const kept = s.market.pinned.filter((id) => {
    const other = s.market.listings.find((l) => l.player.id === id);
    return other !== undefined && pinSlot(other.player) !== slot;
  });
  s.market.pinned = [...kept, playerId];
  return true;
}

/** Drops pins for players who are no longer on the board. */
export function prunePins(s: GameState): void {
  s.market.pinned = s.market.pinned.filter((id) => s.market.listings.some((l) => l.player.id === id));
}

export function refreshMarket(s: GameState, rng: Rng, mods: ListingMods & Pick<Mods, 'marketSize'>): void {
  const unlocked = GAMES.filter((g) => s.games[g.id]?.unlocked);
  if (unlocked.length === 0) return;

  const hasBias = s.prestige.nodes.scout_bias !== undefined;
  const gameBias = hasBias ? s.market.scouting?.gameBias : null;

  // Very low chance for an easter egg player to appear as a legacy purchase
  const takenEggTags = new Set([...Object.values(s.players).map((p) => p.tag.toLowerCase()), ...s.market.listings.map((l) => l.player.tag.toLowerCase())]);
  const availableEggs = EASTER_EGG_CANDIDATES.filter((c) => !takenEggTags.has(c.tag.toLowerCase()) && s.games[c.gameId]?.unlocked);
  const spawnEgg = availableEggs.length > 0 && rng.chance(0.01);
  let eggAdded = false;

  // Pinned prospects wait out the refresh; the rest of the board is new.
  const held = s.market.listings.filter((l) => isPinned(s, l.player.id));
  const listings: MarketListing[] = [...held];
  for (let i = held.length; i < marketSize(mods); i++) {
    if (spawnEgg && !eggAdded) {
      const eggCandidate = rng.pick(availableEggs);
      listings.push(makeEasterEggListing(s, rng, eggCandidate));
      eggAdded = true;
      continue;
    }
    const game =
      rng.weighted(unlocked, (g) => {
        const team = s.teams[g.id];
        const open = team ? team.lineup.filter((id) => id === null).length : 0;
        let weight = 1 + open * 2 + g.index * 0.5;
        if (gameBias && g.id === gameBias) weight *= 5;
        return weight;
      }) ?? unlocked[0];
    listings.push(makeListing(s, rng, game.id, mods));
  }
  listings.sort((a, b) => getGame(a.player.gameId).index - getGame(b.player.gameId).index || a.price - b.price);
  s.market.listings = listings;
  s.market.nextRefresh = s.time + MARKET_REFRESH_SECONDS;
  prunePins(s);
}

/** Adds fresh listings for a newly unlocked game, replacing the oldest ones. */
export function seedMarketForGame(s: GameState, rng: Rng, gameId: string, count: number, mods: ListingMods): void {
  const fresh = Array.from({ length: count }, () => makeListing(s, rng, gameId, mods));
  const size = Math.max(MARKET_BASE_SIZE, s.market.listings.length);
  const held = s.market.listings.filter((l) => isPinned(s, l.player.id));
  const rest = s.market.listings.filter((l) => !isPinned(s, l.player.id));
  s.market.listings = [...held, ...fresh, ...rest].slice(0, Math.max(size, held.length + fresh.length));
  prunePins(s);
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

  const isLegacy = listing.currency === 'legacy';
  if (isLegacy) {
    if (s.prestige.points < listing.price) return { ok: false, reason: 'Not enough legacy points.' };
    s.prestige.points -= listing.price;
    s.prestige.spent += listing.price;
  } else {
    if (s.cash < listing.price) return { ok: false, reason: 'Not enough cash.' };
    s.cash -= listing.price;
  }

  const player: Player = { ...listing.player, fee: listing.price, signedAt: s.time, signedLevel: listing.player.level };
  s.players[player.id] = player;
  addToTeam(s, player, mods);
  s.market.listings.splice(index, 1);
  prunePins(s);
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
