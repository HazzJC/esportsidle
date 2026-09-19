import { describe, expect, it } from 'vitest';
import { CHARTERS } from '../src/data/charters';
import { MANDATES, MANDATE_CHOICES } from '../src/data/mandates';
import { automationUnlocked, runAutomation } from '../src/engine/automation';
import { computeMods } from '../src/engine/economy';
import { refreshMarket } from '../src/engine/market';
import { FOUNDING_POINTS, LEGACY_DIVISOR, mandateOffers, sellOrg } from '../src/engine/prestige';
import { Rng } from '../src/engine/rng';
import { generateOffer, sponsorsUnlocked } from '../src/engine/sponsors';
import { foundedGame } from './fixtures';
import type { GameState } from '../src/engine/types';
import { refreshUpgradeUnlocks } from '../src/engine/upgrades';

/** A first-run org with enough lifetime earnings to sell for `points` legacy. */
function sellable(points = 1): GameState {
  const s = foundedGame(0, 7);
  s.earnedTotal = Math.pow(points, 3) * LEGACY_DIVISOR;
  s.earnedRun = s.earnedTotal;
  return s;
}

describe('the first sale', () => {
  it('gives the root node free, so every earned point is a real choice', () => {
    const s = sellable(1);
    sellOrg(s, { charter: 'operator' });
    expect(s.prestige.nodes.legacy).toBeDefined();
    expect(s.prestige.points).toBe(1 + FOUNDING_POINTS);
  });

  it('locks in a Founding Charter and applies its start straight away', () => {
    const s = sellable(1);
    sellOrg(s, { charter: 'operator' });
    expect(s.prestige.charter).toBe('operator');
    expect(s.ops.grinder.owned).toBeGreaterThanOrEqual(25);
    expect(s.ops.streamer.owned).toBeGreaterThanOrEqual(10);
    expect(s.cash).toBeGreaterThanOrEqual(5_000);
    expect(automationUnlocked(s, 'upgrades')).toBe(true);
    expect(automationUnlocked(s, 'roster')).toBe(false);
  });

  it('keeps the charter for good: a later sale cannot swap it', () => {
    const s = sellable(1);
    sellOrg(s, { charter: 'scout' });
    s.earnedTotal = 8 * LEGACY_DIVISOR;
    sellOrg(s, { charter: 'operator' });
    expect(s.prestige.charter).toBe('scout');
  });

  it('The Scout starts every run with a second team and a signed Talent', () => {
    const s = sellable(1);
    sellOrg(s, { charter: 'scout' });
    expect(s.games.rocket.unlocked).toBe(true);
    const rocketPlayers = Object.values(s.players).filter((p) => p.gameId === 'rocket');
    expect(rocketPlayers).toHaveLength(1);
    expect(rocketPlayers[0].rarity).toBe('talent');
    expect(s.teams.rocket.lineup).toContain(rocketPlayers[0].id);
  });

  it('The Promoter starts with sponsors already calling and an extra slot', () => {
    const s = sellable(1);
    const before = computeMods(s).sponsorSlots;
    sellOrg(s, { charter: 'promoter' });
    expect(sponsorsUnlocked(s)).toBe(true);
    expect(computeMods(s).sponsorSlots).toBe(before + 1);
  });

  it('ignores an unknown charter', () => {
    const s = sellable(1);
    sellOrg(s, { charter: 'nope' });
    expect(s.prestige.charter).toBeNull();
  });

  it('bundles a distinct automation with every charter', () => {
    expect(new Set(CHARTERS.map((c) => c.automation)).size).toBe(CHARTERS.length);
  });
});

describe('run mandates', () => {
  it('offers the same distinct choices until the org is sold', () => {
    const s = sellable(1);
    const a = mandateOffers(s).map((m) => m.id);
    expect(a).toHaveLength(MANDATE_CHOICES);
    expect(new Set(a).size).toBe(MANDATE_CHOICES);
    expect(mandateOffers(s).map((m) => m.id)).toEqual(a);
  });

  it('applies a chosen mandate for one run only', () => {
    const s = sellable(1);
    const pick = mandateOffers(s)[0];
    sellOrg(s, { charter: 'operator', mandate: pick.id });
    expect(s.prestige.mandate).toBe(pick.id);
    s.earnedTotal = 8 * LEGACY_DIVISOR;
    sellOrg(s, {});
    expect(s.prestige.mandate).toBeNull();
  });

  it('refuses a mandate that was not on offer', () => {
    const s = sellable(1);
    const offered = new Set(mandateOffers(s).map((m) => m.id));
    const other = MANDATES.find((m) => !offered.has(m.id))!;
    sellOrg(s, { mandate: other.id });
    expect(s.prestige.mandate).toBeNull();
  });

  it('shapes the run through its effects, fees included', () => {
    const s = sellable(1);
    s.prestige.mandate = 'academy';
    const m = computeMods(s);
    expect(m.xpMult).toBeCloseTo(2);
    expect(m.feeMult).toBeCloseTo(1.5);
    const plain = foundedGame(0, 7);
    refreshMarket(plain, new Rng({ rng: 3 }), computeMods(plain));
    refreshMarket(s, new Rng({ rng: 3 }), m);
    expect(s.market.listings[0].price).toBeGreaterThan(plain.market.listings[0].price);
  });

  it('every mandate has a real downside', () => {
    for (const m of MANDATES) expect(m.downside.length).toBeGreaterThan(5);
  });
});

describe('front office automation', () => {
  it('does nothing while a routine is locked, even if switched on', () => {
    const s = foundedGame(0, 7);
    s.ops.grinder.owned = 1;
    refreshUpgradeUnlocks(s);
    s.cash = 1e6;
    s.automation.upgrades.on = true;
    runAutomation(s, computeMods(s));
    expect(Object.keys(s.upgrades)).toHaveLength(0);
  });

  it('buys upgrades only under the chosen share of cash', () => {
    const s = foundedGame(0, 7);
    s.prestige.charter = 'operator';
    s.ops.grinder.owned = 1;
    refreshUpgradeUnlocks(s);
    s.automation.upgrades.on = true;
    s.automation.upgrades.maxCostPct = 0.25;
    s.cash = 300; // the first grinder upgrade costs 100: over the 25% cap
    runAutomation(s, computeMods(s));
    expect(s.upgrades.grind_0).toBeUndefined();
    s.cash = 1_000;
    runAutomation(s, computeMods(s));
    expect(s.upgrades.grind_0).toBeDefined();
  });

  it('fills an empty lineup slot from the market', () => {
    const s = foundedGame(0, 7);
    s.prestige.charter = 'scout';
    s.cash = 1e9;
    s.games.rocket.unlocked = true;
    s.teams.rocket = { ...s.teams.smash, gameId: 'rocket', lineup: [null, null, null], bench: [], kit: null };
    refreshMarket(s, new Rng({ rng: 9 }), { scoutLuck: 0, marketSize: 20 });
    s.automation.roster.on = true;
    runAutomation(s, computeMods(s));
    expect(s.teams.rocket.lineup.filter(Boolean).length).toBeGreaterThan(0);
    expect(s.automationLog[0].text).toMatch(/Scouts signed/);
  });

  it('upgrades gear within one budget per pass, never more', () => {
    const s = foundedGame(0, 7);
    s.prestige.charter = 'coach';
    s.cash = 5_000;
    s.automation.gear.on = true;
    s.automation.gear.maxCostPct = 0.1;
    runAutomation(s, computeMods(s));
    const founder = s.players.founder;
    expect(Object.values(founder.gear).reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
    // Regression: re-checking the share after every purchase once let a pass spend ~90% of the bank.
    expect(s.cash).toBeGreaterThanOrEqual(4_500);
  });

  it('signs sponsors by the rules: best offer first, no crypto, one per category', () => {
    const s = foundedGame(0, 7);
    s.prestige.charter = 'promoter';
    s.fansRun = 1e9;
    s.automation.sponsors.on = true;
    const rng = new Rng({ rng: 5 });
    const make = (brandId: string, incomePct: number) => ({ ...generateOffer(s, rng), brandId, tier: 0, incomePct });
    s.sponsors.offers = [make('blockcoin', 0.9), make('monstar', 0.2), make('redbullet', 0.5), make('crunchy', 0.1)];
    runAutomation(s, computeMods(s));
    const signed = s.sponsors.active.map((c) => c.brandId);
    expect(signed).not.toContain('blockcoin');
    expect(signed).toContain('redbullet');
    expect(signed).not.toContain('monstar');
    expect(signed.length).toBeLessThanOrEqual(computeMods(s).sponsorSlots);
  });
});
