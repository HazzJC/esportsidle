import { describe, expect, it } from 'vitest';
import { GEAR_SLOTS } from '../src/data/gear';
import { UPGRADES } from '../src/data/upgrades';
import {
  applyDropOutcome,
  clickDrop,
  dramaShare,
  PR_CLEANUP_SECONDS,
  returnScandalFans,
  rideOutDrama,
  SCANDAL_FAN_SHARE,
  SCANDAL_SECONDS,
  scandalFanLoss,
  spawnDrop,
  updateDrops,
} from '../src/engine/drops';
import { baseIncome } from '../src/engine/baseIncome';
import { computeMods, computeRates } from '../src/engine/economy';
import { advance } from '../src/engine/game';
import { refreshMarket, signListing } from '../src/engine/market';
import { levelUpOperation } from '../src/engine/operations';
import { gearUpgradeCost } from '../src/engine/players';
import { Rng } from '../src/engine/rng';
import { createBaseState } from '../src/engine/state';
import { unlockGame } from '../src/engine/teams';
import { INVITATION_STAKES, invitationOdds, playInvitation, runTournament, updateInvitation } from '../src/engine/tournament';
import type { GameState } from '../src/engine/types';
import { fireEvent, offerChoice, resolveChoice, retentionBids, updateWorldEvents, WORLD_EVENTS } from '../src/engine/worldEvents';
import { foundedGame } from './fixtures';

function ctxFor(s: GameState) {
  const mods = computeMods(s);
  return { rng: new Rng(s), mods, rates: computeRates(s, mods) };
}

/** A mid-game state with several players, operations and a ranked team. */
function richState(): GameState {
  const s = foundedGame(0, 17);
  s.cash = 1e12;
  s.ops.streamer.owned = 30;
  s.ops.creator.owned = 12;
  s.fans = 10_000;
  unlockGame(s, 'rocket');
  refreshMarket(s, new Rng(s), { scoutLuck: 0, marketSize: 12 });
  for (const listing of [...s.market.listings]) signListing(s, listing.player.id, computeMods(s));
  s.teams.smash.tier = 3;
  s.teams.smash.bestTier = 3;
  for (const p of Object.values(s.players)) p.gear.mouse = 5;
  return s;
}

describe('hype drops', () => {
  it('schedules, spawns and expires drops', () => {
    const s = foundedGame(0, 9);
    updateDrops(s, ctxFor(s));
    expect(s.drops.nextAt).toBeGreaterThan(0);
    s.time = s.drops.nextAt;
    updateDrops(s, ctxFor(s));
    expect(s.drops.active).toHaveLength(1);
    s.time = s.drops.active[0].expiresAt + 0.1;
    updateDrops(s, ctxFor(s));
    expect(s.drops.active).toHaveLength(0);
    expect(s.stats.dropsMissed).toBe(1);
  });

  it('clicking a drop resolves it once', () => {
    const s = richState();
    const drop = spawnDrop(s, ctxFor(s));
    const result = clickDrop(s, drop.id, ctxFor(s));
    expect(result).not.toBeNull();
    expect(s.stats.dropsClicked + s.stats.dramaClicked).toBe(1);
    expect(clickDrop(s, drop.id, ctxFor(s))).toBeNull();
  });

  it('every outcome can be applied', () => {
    for (const id of ['frenzy', 'prize', 'clutch', 'viral', 'rush', 'train', 'tournament', 'scandal', 'outage', 'ragebait', 'leak', 'backlash']) {
      const s = richState();
      expect(() => applyDropOutcome(s, id, ctxFor(s))).not.toThrow();
    }
  });

  it('LAN Frenzy multiplies income and Prize Pool pays out', () => {
    const s = richState();
    const before = computeRates(s).cps;
    applyDropOutcome(s, 'frenzy', ctxFor(s));
    expect(computeRates(s).cps).toBeCloseTo(before * 7);
    const cash = s.cash;
    applyDropOutcome(s, 'prize', ctxFor(s));
    expect(s.cash).toBeGreaterThan(cash);
  });

  it('drama drops only appear after drama upgrades', () => {
    const s = foundedGame(0, 9);
    expect(dramaShare(s, computeMods(s))).toBe(0);
    s.upgrades.drama_0 = 0;
    expect(dramaShare(s, computeMods(s))).toBeCloseTo(0.33);
    s.events.calmUntil = s.time + 100;
    expect(dramaShare(s, computeMods(s))).toBe(0);
  });
});

describe('tournaments', () => {
  it('a dominant team wins and earns trophies', () => {
    const s = foundedGame(0, 21);
    const founder = s.players.founder;
    for (const slot of GEAR_SLOTS) founder.gear[slot.id] = 15;
    const result = runTournament(s, ctxFor(s));
    expect(result.champion).toBe(true);
    expect(result.rounds).toHaveLength(3);
    expect(s.trophies).toBeGreaterThanOrEqual(2);
    expect(s.stats.tournamentsWon).toBe(1);
    expect(s.events.lastTournament?.id).toBe(result.id);
  });

  it('a hopeless team is knocked out early', () => {
    const s = foundedGame(0, 21);
    for (const key of Object.keys(s.players.founder.stats)) s.players.founder.stats[key as keyof typeof s.players.founder.stats] = 1;
    s.teams.smash.tier = 12;
    const result = runTournament(s, ctxFor(s));
    expect(result.champion).toBe(false);
    expect(result.rounds.length).toBeLessThan(3);
    expect(result.trophies).toBe(0);
  });

  it('an even league team is more likely than not to win an Invitational', () => {
    const s = foundedGame(0, 21);
    const ctx = ctxFor(s);
    const ev = ctx.rates.teams.smash;
    // Put the team level with its league: rating equals the league opponent.
    ev.rating = ev.opponent;
    const odds = invitationOdds(s, ctx.rates, ctx.mods, 0, 'smash')!;
    expect(odds.champion).toBeGreaterThan(0.5);
    expect(odds.rounds[0]).toBeGreaterThan(odds.rounds[2]);
    const boosted = invitationOdds(s, ctx.rates, ctx.mods, INVITATION_STAKES[3].boost, 'smash')!;
    expect(boosted.champion).toBeGreaterThan(odds.champion);
  });

  it('a Hype Drop sends an invitation that plays itself when it runs out', () => {
    const s = foundedGame(0, 21);
    applyDropOutcome(s, 'tournament', ctxFor(s));
    const inv = s.events.invitation;
    expect(inv).not.toBeNull();
    expect(updateInvitation(s, ctxFor(s))).toBeNull();
    s.time = inv!.expiresAt;
    const result = updateInvitation(s, ctxFor(s));
    expect(result).not.toBeNull();
    expect(result?.stake).toBe(0);
    expect(s.events.invitation).toBeNull();
    expect(s.stats.tournamentsPlayed).toBe(1);
  });

  it('paid preparation costs cash up front and is refused when unaffordable', () => {
    const s = foundedGame(0, 21);
    s.ops.streamer.owned = 30;
    applyDropOutcome(s, 'tournament', ctxFor(s));
    // With income coming in, even an empty bank has a price for preparation.
    s.cash = 0;
    expect(playInvitation(s, ctxFor(s), 'allin')).toBeNull();
    expect(s.events.invitation).not.toBeNull();
    s.cash = 1e12;
    const rates = computeRates(s);
    const result = playInvitation(s, ctxFor(s), 'bootcamp');
    // Preparation with a fixed benefit has a fixed price in base income, however full the bank.
    expect(result?.stake).toBe(Math.ceil(150 * baseIncome(s, rates)));
    expect(result!.stake).toBeLessThan(1e12 * 0.01);
    expect(s.events.invitation).toBeNull();
  });
});

describe('world events', () => {
  it('every event can fire in a rich state', () => {
    let fired = 0;
    for (const def of WORLD_EVENTS) {
      const s = richState();
      expect(() => (fireEvent(s, def.id, ctxFor(s)) ? fired++ : 0)).not.toThrow();
    }
    expect(fired).toBeGreaterThanOrEqual(WORLD_EVENTS.length - 2);
  });

  it('the poaching choice can sell a player', () => {
    const s = richState();
    expect(fireEvent(s, 'poaching', ctxFor(s))).toBe(true);
    const choice = s.events.pending[0];
    const playerId = String(choice.data.playerId);
    const cash = s.cash;
    expect(resolveChoice(s, choice.id, 0, ctxFor(s))).toBe(true);
    expect(s.players[playerId]).toBeUndefined();
    expect(s.cash).toBeGreaterThan(cash);
    expect(s.stats.choicesMade).toBe(1);
  });

  it('unanswered choices resolve to their default', () => {
    const s = richState();
    const p = Object.values(s.players).find((x) => !x.founder)!;
    const morale = p.morale;
    offerChoice(s, {
      eventId: 'contract',
      title: 't',
      body: 'b',
      icon: 'x',
      defaultOption: 1,
      data: { playerId: p.id },
      options: [
        { label: 'a', desc: '', tone: 'good' },
        { label: 'b', desc: '', tone: 'bad' },
      ],
    });
    s.time += 1000;
    s.events.nextAt = s.time + 1000;
    updateWorldEvents(s, ctxFor(s));
    expect(s.events.pending).toHaveLength(0);
    expect(p.morale).toBeLessThan(morale);
    expect(s.stats.choicesMade).toBe(0);
  });

  it('a flash sale lowers gear prices until it expires', () => {
    const s = richState();
    const p = s.players.founder;
    const before = gearUpgradeCost(p, 'pc', computeMods(s), 0);
    fireEvent(s, 'gear_sale', ctxFor(s));
    expect(gearUpgradeCost(p, 'pc', computeMods(s), 0)).toBeLessThan(before);
    s.time += 1000;
    s.events.nextAt = s.time + 1000;
    updateWorldEvents(s, ctxFor(s));
    expect(gearUpgradeCost(p, 'pc', computeMods(s), 0)).toBe(before);
  });
});

describe('trophies', () => {
  it('level up operations for +1% each', () => {
    const s = foundedGame(0, 4);
    s.ops.grinder.owned = 10;
    s.teams.smash.lineup = [null];
    const before = computeRates(s).cps;
    expect(levelUpOperation(s, 'grinder')).toBe(false);
    s.trophies = 3;
    expect(levelUpOperation(s, 'grinder')).toBe(true);
    expect(levelUpOperation(s, 'grinder')).toBe(true);
    expect(s.trophies).toBe(0);
    expect(s.ops.grinder.level).toBe(2);
    expect(computeRates(s).cps).toBeCloseTo(before * 1.02);
  });

  it('trophy upgrades are priced in trophies', () => {
    const trophyUpgrades = UPGRADES.filter((u) => u.group === 'trophy');
    expect(trophyUpgrades.length).toBeGreaterThan(0);
    expect(trophyUpgrades.every((u) => u.currency === 'trophies')).toBe(true);
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

describe('Transfer Choice Priority', () => {
  it('unshifts poaching transfer offers to front of pending queue', () => {
    const s = createBaseState(0, 1);
    s.events.pending = [
      {
        id: 1,
        eventId: 'generic_event',
        title: 'Regular Event',
        body: 'Just a normal event',
        icon: 'newspaper',
        options: [],
        defaultOption: 0,
        data: {},
        expiresAt: 100,
      },
    ];

    offerChoice(s, {
      eventId: 'poaching_offer',
      title: 'Transfer Offer',
      body: 'Rival wants your player',
      icon: 'handshake',
      options: [],
      defaultOption: 0,
      data: {},
    });

    expect(s.events.pending[0].eventId).toBe('poaching_offer');
    expect(s.events.pending[1].eventId).toBe('generic_event');
  });
});

describe('retention bids', () => {
  it('prices retention from current cash and the player career', () => {
    const s = foundedGame(0, 6);
    const p = s.players.founder;
    s.cash = 1e6;
    const early = retentionBids(s, p);
    p.level = 41;
    p.seasons = 8;
    const veteran = retentionBids(s, p);
    expect(veteran[0]).toBeGreaterThan(early[0]);
    expect(veteran[0]).toBeGreaterThanOrEqual(s.cash * 0.05);
    expect(veteran[2]).toBeLessThanOrEqual(s.cash * 0.25);
  });

  it('never prices retention below a few minutes of base income, so an empty bank is no free ride', () => {
    const s = foundedGame(0, 6);
    const p = s.players.founder;
    s.cash = 0;
    const bids = retentionBids(s, p, 100);
    expect(bids[0]).toBeGreaterThanOrEqual(2 * 60 * 100);
    expect(bids[2]).toBeGreaterThan(bids[1]);
    expect(bids[1]).toBeGreaterThan(bids[0]);
  });

  it('never prices retention above a fraction of what the rival is offering, so a full vault is not drained for a rookie', () => {
    const s = foundedGame(0, 6);
    const p = s.players.founder;
    s.cash = 1e15;
    const offer = 1000;
    const bids = retentionBids(s, p, 1e6, offer);
    expect(bids[0]).toBeLessThanOrEqual(offer * 0.5 + 1);
    expect(bids[1]).toBeLessThanOrEqual(offer * 0.9 + 1);
    expect(bids[2]).toBeLessThanOrEqual(offer * 1.4 + 1);
  });
});
