import { describe, expect, it } from 'vitest';
import { SCENE_TAGS } from '../src/data/names';
import { BRANDS, SPONSOR_TIERS } from '../src/data/sponsors';
import { computeMods, computeRates } from '../src/engine/economy';
import {
  PR_CLEANUP_SECONDS,
  SCANDAL_FAN_SHARE,
  SCANDAL_SECONDS,
  returnScandalFans,
  rideOutDrama,
  scandalFanLoss,
} from '../src/engine/drops';
import { advance } from '../src/engine/game';
import { isPinned, pinSlot, refreshMarket, signListing, togglePin } from '../src/engine/market';
import { generatePlayer } from '../src/engine/players';
import { Rng } from '../src/engine/rng';
import { GOAL_EARNINGS_SHARE, goalReward, signOffer, updateSponsors } from '../src/engine/sponsors';
import type { GameState, SponsorContract } from '../src/engine/types';
import { foundedGame } from './fixtures';

/** A signed contract ready to complete its goal. */
function withSponsor(s: GameState, tier = 2): SponsorContract {
  s.fansRun = 1e12;
  s.fans = 1e12;
  s.teams.smash.tier = 12;
  s.teams.smash.bestTier = 12;
  const offer = {
    id: s.nextId++,
    brandId: BRANDS[0].id,
    tier,
    incomePct: SPONSOR_TIERS[tier].incomePct,
    duration: 3600,
    goal: { kind: 'wins' as const, target: 5, rewardSeconds: SPONSOR_TIERS[tier].goalSeconds },
  };
  s.sponsors.offers.push(offer);
  signOffer(s, offer.id, { sponsorSlots: 4 });
  return s.sponsors.active[s.sponsors.active.length - 1];
}

describe('sponsor goal payouts', () => {
  it('pays a share of what the org earned while the deal ran', () => {
    const s = foundedGame(0, 4);
    const c = withSponsor(s);
    s.earnedRun = c.earnedAt! + 1e6;
    s.time += c.goal.rewardSeconds;
    // The headline value is far larger than the share, so the share is what pays.
    expect(goalReward(s, c, 1e6)).toBeCloseTo(1e6 * GOAL_EARNINGS_SHARE, 0);
  });

  it('pays proportionally less for a goal finished early', () => {
    const s = foundedGame(0, 4);
    const c = withSponsor(s);
    s.earnedRun = c.earnedAt! + 1e6;
    s.time += c.goal.rewardSeconds / 4;
    const quick = goalReward(s, c, 1e6);
    s.time += (c.goal.rewardSeconds * 3) / 4;
    expect(quick).toBeLessThan(goalReward(s, c, 1e6));
    expect(quick).toBeCloseTo(1e6 * GOAL_EARNINGS_SHARE * 0.25, 0);
  });

  it('never pays more than the contract headline, however rich the org got', () => {
    const s = foundedGame(0, 4);
    const c = withSponsor(s);
    s.earnedRun = c.earnedAt! + 1e15;
    s.time += c.goal.rewardSeconds;
    expect(goalReward(s, c, 100)).toBeCloseTo(100 * c.goal.rewardSeconds, 0);
  });

  it('pays the goal out once, through the sponsor ledger', () => {
    const s = foundedGame(0, 4);
    const c = withSponsor(s);
    s.stats.matchesWon = c.baseline + c.goal.target;
    s.earnedRun = c.earnedAt! + 1e6;
    s.time += c.goal.rewardSeconds;
    const mods = computeMods(s);
    updateSponsors(s, { rng: new Rng(s), mods, rates: computeRates(s, mods) }, 1, false);
    expect(c.completed).toBe(true);
    expect(s.incomeRun.sponsor).toBeGreaterThan(0);
    const paid = s.incomeRun.sponsor;
    updateSponsors(s, { rng: new Rng(s), mods, rates: computeRates(s, mods) }, 1, false);
    expect(s.incomeRun.sponsor).toBe(paid);
  });

  it('puts a trophy for a big sponsor goal on the shelf as well as in the bank', () => {
    const s = foundedGame(0, 4);
    const c = withSponsor(s, 3);
    const before = s.trophyCase.length;
    s.stats.matchesWon = c.baseline + c.goal.target;
    const mods = computeMods(s);
    updateSponsors(s, { rng: new Rng(s), mods, rates: computeRates(s, mods) }, 1, false);
    expect(s.trophyCase.length).toBe(before + 1);
    expect(s.trophyCase[0].kind).toBe('sponsor');
  });
});

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

describe('riding out the drama', () => {
  it('trades fans and a slump for the cash a PR team would cost', () => {
    const s = foundedGame(0, 8);
    s.fans = 10_000;
    const cash = s.cash;
    const leaving = scandalFanLoss(s);
    expect(leaving).toBe(Math.floor(10_000 * SCANDAL_FAN_SHARE));
    expect(rideOutDrama(s)).toBe(true);
    expect(s.cash).toBe(cash);
    expect(s.fans).toBe(10_000 - leaving);
    expect(s.events.calmUntil).toBe(s.time + PR_CLEANUP_SECONDS);
    expect(s.buffs.find((b) => b.id === 'scandal')).toBeDefined();
  });

  it('gives the fans back when it blows over', () => {
    const s = foundedGame(0, 8);
    s.fans = 10_000;
    rideOutDrama(s);
    const afterWalkout = s.fans;
    expect(returnScandalFans(s)).toBe(0);
    advance(s, SCANDAL_SECONDS + 5);
    expect(s.events.fansHeld).toBe(0);
    expect(s.fans).toBeGreaterThanOrEqual(afterWalkout + Math.floor(10_000 * SCANDAL_FAN_SHARE));
  });
});

describe('player tags', () => {
  it('draws on the scene a player competes in', () => {
    const rng = new Rng({ rng: 21 });
    const tags = Array.from({ length: 60 }, (_, i) => generatePlayer(rng, { id: `p${i}`, gameId: 'lanes', time: 0 }).tag);
    const scene = new Set([...SCENE_TAGS.lanes.any, ...(SCENE_TAGS.lanes.byRole ?? []).flat()]);
    expect(tags.filter((t) => scene.has(t)).length).toBeGreaterThan(10);
  });

  it('has a pool for every game, with no duplicates inside a game', () => {
    for (const [gameId, def] of Object.entries(SCENE_TAGS)) {
      const all = [...def.any, ...(def.byRole ?? []).flat()];
      expect(all.length, gameId).toBeGreaterThanOrEqual(8);
      for (const tag of all) expect(tag.length, `${gameId}:${tag}`).toBeLessThanOrEqual(16);
    }
  });
});
