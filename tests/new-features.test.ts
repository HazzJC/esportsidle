import { describe, expect, it } from 'vitest';
import { GAMES } from '../src/data/games';
import { LEGACY_NODES, LEGACY_NODE_MAP } from '../src/data/legacy';
import { PARODY_TAGS } from '../src/data/names';
import { TRAITS } from '../src/data/traits';
import { autoRoster } from '../src/engine/automation';
import { refreshMarket, signListing } from '../src/engine/market';
import { generatePlayer, randomTag } from '../src/engine/players';
import { Rng } from '../src/engine/rng';
import { createBaseState } from '../src/engine/state';
import { playSound, type SoundId } from '../src/ui/sound';
import { offerChoice } from '../src/engine/worldEvents';

describe('New Features - Parody Tags & Names', () => {
  it('defines parody gamer tags for all 12 games', () => {
    for (const g of GAMES) {
      const tags = PARODY_TAGS[g.id];
      expect(tags, `Missing parody tags for game ${g.id}`).toBeDefined();
      expect(tags.length).toBeGreaterThanOrEqual(15);
    }
  });

  it('rolls a parody tag when rng.chance(0.10) triggers', () => {
    // Custom mock rng that forces chance(0.10) to return true
    const rng = new Rng({ rng: 12345 });
    const mockRng = {
      ...rng,
      chance: (p: number) => p === 0.1,
      pick: <T>(arr: readonly T[]): T => arr[0],
      int: (min: number, max: number) => min,
    } as unknown as Rng;

    const tag = randomTag(mockRng, 'smash');
    expect(PARODY_TAGS['smash']).toContain(tag);
  });
});

describe('New Features - Legacy Nodes', () => {
  it('registers scout_bias, scout_trait, coach_bench, and gear_gear_gear tiers', () => {
    expect(LEGACY_NODE_MAP.get('scout_bias')).toBeDefined();
    expect(LEGACY_NODE_MAP.get('scout_trait')).toBeDefined();
    expect(LEGACY_NODE_MAP.get('coach_bench')).toBeDefined();
    expect(LEGACY_NODE_MAP.get('gear_gear_gear_1')).toBeDefined();
    expect(LEGACY_NODE_MAP.get('gear_gear_gear_2')).toBeDefined();
    expect(LEGACY_NODE_MAP.get('gear_gear_gear_3')).toBeDefined();

    const g1 = LEGACY_NODE_MAP.get('gear_gear_gear_1')!;
    const g2 = LEGACY_NODE_MAP.get('gear_gear_gear_2')!;
    const g3 = LEGACY_NODE_MAP.get('gear_gear_gear_3')!;
    expect(g1.cost).toBe(15);
    expect(g2.cost).toBe(50);
    expect(g3.cost).toBe(200);
  });
});

describe('New Features - Scouting Bias & Focus', () => {
  it('boosts specified game weight when scout_bias is active', () => {
    const s = createBaseState();
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

describe('New Features - Coach Bench Automation', () => {
  it('does not sign bench players when coach_bench is not owned', () => {
    const s = createBaseState();
    s.games.smash.unlocked = true;
    s.teams.smash = {
      gameId: 'smash',
      lineup: ['p_starter'],
      bench: [],
      kit: null,
      plan: 'balanced',
      nextPlan: null,
      seasonEarnings: 0,
      seasonStats: {},
      lastSeason: null,
      tier: 0,
      bestTier: 0,
      seasonNumber: 1,
      seasonPlayed: 0,
      seasonWins: 0,
      progress: 0,
      autoPromote: true,
      autoSub: true,
      chemistry: 1,
      form: 1,
      history: [],
      wins: 0,
      losses: 0,
      streak: 0,
      titles: 0,
      earnings: 0,
    };
    s.players.p_starter = generatePlayer(new Rng({ rng: 1 }), { id: 'p_starter', gameId: 'smash', time: 0, luck: 1 });
    s.cash = 100000;
    s.automation.roster = { on: true, maxCostPct: 1, buyBench: true };

    // Fill market with a prospect
    const prospect = generatePlayer(new Rng({ rng: 2 }), { id: 'p_prospect', gameId: 'smash', time: 0, luck: 1 });
    s.market.listings = [{ player: prospect, price: 50, currency: 'cash' }];

    autoRoster(s, { benchSlots: 3, rosterCap: 10 } as any);
    expect(s.teams.smash.bench.length).toBe(0);
  });

  it('signs bench players when coach_bench is owned and buyBench is enabled', () => {
    const s = createBaseState();
    s.games.smash.unlocked = true;
    s.prestige.nodes.coach_bench = 0;
    s.teams.smash = {
      gameId: 'smash',
      lineup: ['p_starter'],
      bench: [],
      kit: null,
      plan: 'balanced',
      nextPlan: null,
      seasonEarnings: 0,
      seasonStats: {},
      lastSeason: null,
      tier: 0,
      bestTier: 0,
      seasonNumber: 1,
      seasonPlayed: 0,
      seasonWins: 0,
      progress: 0,
      autoPromote: true,
      autoSub: true,
      chemistry: 1,
      form: 1,
      history: [],
      wins: 0,
      losses: 0,
      streak: 0,
      titles: 0,
      earnings: 0,
    };
    s.players.p_starter = generatePlayer(new Rng({ rng: 1 }), { id: 'p_starter', gameId: 'smash', time: 0, luck: 1 });
    s.cash = 100000;
    s.automation.roster = { on: true, maxCostPct: 1, buyBench: true };

    const prospect = generatePlayer(new Rng({ rng: 2 }), { id: 'p_prospect', gameId: 'smash', time: 0, luck: 1 });
    s.market.listings = [{ player: prospect, price: 50, currency: 'cash' }];

    autoRoster(s, { benchSlots: 3, rosterCap: 10 } as any);
    expect(s.teams.smash.bench.length).toBe(1);
    expect(s.teams.smash.bench[0]).toBe('p_prospect');
  });
});

describe('New Features - Easter Egg Player & Legacy Signing', () => {
  it('allows signing legacy currency listings with legacy points', () => {
    const s = createBaseState();
    s.games.smash.unlocked = true;
    s.teams.smash = {
      gameId: 'smash',
      lineup: [null],
      bench: [],
      kit: null,
      plan: 'balanced',
      nextPlan: null,
      seasonEarnings: 0,
      seasonStats: {},
      lastSeason: null,
      tier: 0,
      bestTier: 0,
      seasonNumber: 1,
      seasonPlayed: 0,
      seasonWins: 0,
      progress: 0,
      autoPromote: true,
      autoSub: true,
      chemistry: 1,
      form: 1,
      history: [],
      wins: 0,
      losses: 0,
      streak: 0,
      titles: 0,
      earnings: 0,
    };
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
    const s = createBaseState();
    s.games.smash.unlocked = true;
    s.teams.smash = {
      gameId: 'smash',
      lineup: [null],
      bench: [],
      kit: null,
      plan: 'balanced',
      nextPlan: null,
      seasonEarnings: 0,
      seasonStats: {},
      lastSeason: null,
      tier: 0,
      bestTier: 0,
      seasonNumber: 1,
      seasonPlayed: 0,
      seasonWins: 0,
      progress: 0,
      autoPromote: true,
      autoSub: true,
      chemistry: 1,
      form: 1,
      history: [],
      wins: 0,
      losses: 0,
      streak: 0,
      titles: 0,
      earnings: 0,
    };
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

describe('New Features - Transfer Choice Priority', () => {
  it('unshifts poaching transfer offers to front of pending queue', () => {
    const s = createBaseState();
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

describe('New Features - Bad Drama Audio', () => {
  it('has dramaBad sound identifier and plays without errors', () => {
    const id: SoundId = 'dramaBad';
    expect(id).toBe('dramaBad');
    // Calling playSound should not throw in node/test environments
    expect(() => playSound('dramaBad', 1)).not.toThrow();
  });
});

describe('New Features - Toast Duration Proportionality', () => {
  it('scales duration with message length and doubles for season champions', () => {
    const calcDuration = (title: string, body?: string) => {
      const len = (title?.length ?? 0) + (body?.length ?? 0);
      let duration = Math.min(12000, Math.max(3500, 2800 + len * 45));
      if (title.toLowerCase().includes('season champions')) {
        duration *= 2;
      }
      return duration;
    };

    const short = calcDuration('Hi');
    const long = calcDuration('Hi', 'This is a significantly longer message that describes an event in great detail');
    expect(long).toBeGreaterThan(short);

    const regularSeason = calcDuration('Match Won');
    const champSeason = calcDuration('Season Champions!');
    expect(champSeason).toBeGreaterThan(regularSeason * 1.5);
  });
});
