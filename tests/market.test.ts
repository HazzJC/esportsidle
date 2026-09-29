import { describe, expect, it } from 'vitest';
import { isPinned, pinSlot, refreshMarket, signListing, togglePin } from '../src/engine/market';
import { generatePlayer } from '../src/engine/players';
import { Rng } from '../src/engine/rng';
import { createBaseState } from '../src/engine/state';
import { createTeam } from '../src/engine/teams';
import { foundedGame } from './fixtures';

describe('pinned market listings', () => {
  it('keeps a pinned prospect through a refresh', () => {
    const s = foundedGame(0, 7);
    refreshMarket(s, new Rng(s), { scoutLuck: 0, marketSize: 0 });
    const keep = s.market.listings[0].player.id;
    expect(togglePin(s, keep)).toBe(true);
    refreshMarket(s, new Rng(s), { scoutLuck: 0, marketSize: 0 });
    expect(s.market.listings.some((l) => l.player.id === keep)).toBe(true);
    expect(isPinned(s, keep)).toBe(true);
  });

  it('allows only one pin per game and role', () => {
    const s = foundedGame(0, 7);
    const a = generatePlayer(new Rng({ rng: 2 }), { id: 'pa', gameId: 'smash', time: 0 });
    const b = generatePlayer(new Rng({ rng: 3 }), { id: 'pb', gameId: 'smash', time: 0 });
    s.market.listings = [
      { player: a, price: 10 },
      { player: b, price: 10 },
    ];
    expect(pinSlot(a)).toBe(pinSlot(b));
    togglePin(s, 'pa');
    togglePin(s, 'pb');
    expect(isPinned(s, 'pa')).toBe(false);
    expect(isPinned(s, 'pb')).toBe(true);
    expect(s.market.pinned).toHaveLength(1);
  });

  it('drops the pin once the player is signed', () => {
    const s = foundedGame(0, 7);
    refreshMarket(s, new Rng(s), { scoutLuck: 0, marketSize: 0 });
    const listing = s.market.listings.find((l) => l.player.gameId === 'smash')!;
    togglePin(s, listing.player.id);
    s.cash = listing.price;
    signListing(s, listing.player.id, { benchSlots: 2 });
    expect(s.market.pinned).toHaveLength(0);
  });
});

describe('Scouting Bias & Focus', () => {
  it('boosts specified game weight when scout_bias is active', () => {
    const s = createBaseState(0, 1);
    s.games.smash.unlocked = true;
    s.games.rocket.unlocked = true;
    s.prestige.nodes.scout_bias = 0;
    s.market.scouting = { gameBias: 'rocket', rarityBias: null, traitFocus: null };

    const rng = new Rng({ rng: 42 });
    let rocketCount = 0;
    const totalRuns = 50;
    for (let i = 0; i < totalRuns; i++) {
      s.market.listings = [];
      refreshMarket(s, rng, { scoutLuck: 1, marketSize: 4 });
      rocketCount += s.market.listings.filter((l) => l.player.gameId === 'rocket').length;
    }
    // Rocket should heavily dominate due to 5x weight
    expect(rocketCount / (totalRuns * 4)).toBeGreaterThan(0.65);
  });

  it('boosts specified rarity when rarityBias is provided', () => {
    const rng = new Rng({ rng: 999 });
    let starWithBias = 0;
    let starWithoutBias = 0;
    const N = 500;

    for (let i = 0; i < N; i++) {
      const p1 = generatePlayer(rng, { id: `p${i}`, gameId: 'smash', time: 0, luck: 1, rarityBias: 'star' });
      if (p1.rarity === 'star') starWithBias++;

      const p2 = generatePlayer(rng, { id: `p${i}`, gameId: 'smash', time: 0, luck: 1, rarityBias: null });
      if (p2.rarity === 'star') starWithoutBias++;
    }

    expect(starWithBias).toBeGreaterThan(starWithoutBias);
  });

  it('doubles trait frequency when traitFocus is provided', () => {
    const rng = new Rng({ rng: 777 });
    let wonderkidWithFocus = 0;
    let wonderkidWithoutFocus = 0;
    const N = 600;

    for (let i = 0; i < N; i++) {
      const p1 = generatePlayer(rng, { id: `p${i}`, gameId: 'smash', time: 0, luck: 1, traitFocus: 'wonderkid' });
      if (p1.traits.includes('wonderkid')) wonderkidWithFocus++;

      const p2 = generatePlayer(rng, { id: `p${i}`, gameId: 'smash', time: 0, luck: 1, traitFocus: null });
      if (p2.traits.includes('wonderkid')) wonderkidWithoutFocus++;
    }

    expect(wonderkidWithFocus).toBeGreaterThan(wonderkidWithoutFocus);
  });
});

describe('Easter Egg Player & Legacy Signing', () => {
  it('allows signing legacy currency listings with legacy points', () => {
    const s = createBaseState(0, 1);
    s.games.smash.unlocked = true;
    s.teams.smash = { ...createTeam('smash'), lineup: [null] };
    s.prestige.points = 10;

    const eggPlayer = generatePlayer(new Rng({ rng: 5 }), { id: 'p_egg', gameId: 'smash', time: 0, luck: 1 });
    eggPlayer.tag = 'Mew2King';
    s.market.listings = [{ player: eggPlayer, price: 5, currency: 'legacy', isEasterEgg: true }];

    const res = signListing(s, 'p_egg', { benchSlots: 3 } as any);
    expect(res.ok).toBe(true);
    expect(s.prestige.points).toBe(5);
    expect(s.players['p_egg']).toBeDefined();
    expect(s.teams.smash.lineup[0]).toBe('p_egg');
  });

  it('rejects legacy signing if points are insufficient', () => {
    const s = createBaseState(0, 1);
    s.games.smash.unlocked = true;
    s.teams.smash = { ...createTeam('smash'), lineup: [null] };
    s.prestige.points = 2; // Needs 5

    const eggPlayer = generatePlayer(new Rng({ rng: 5 }), { id: 'p_egg', gameId: 'smash', time: 0, luck: 1 });
    s.market.listings = [{ player: eggPlayer, price: 5, currency: 'legacy', isEasterEgg: true }];

    const res = signListing(s, 'p_egg', { benchSlots: 3 } as any);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toMatch(/legacy/i);
    }
    expect(s.prestige.points).toBe(2);
  });
});
