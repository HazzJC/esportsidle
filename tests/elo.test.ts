import { describe, expect, it } from 'vitest';
import { ELO_BASE, ELO_PER_TIER, PROMOTE_MARGIN, RELEGATE_MARGIN, opponentRating, winChance } from '../src/data/leagues';
import { canPromote, eloExpected, promotionElo, recordEloResult, relegationElo, teamElo, tierElo } from '../src/engine/elo';
import { Rng } from '../src/engine/rng';

describe('team Elo', () => {
  it('spaces tiers by what a doubling of the opposition is worth', () => {
    expect(ELO_PER_TIER).toBeCloseTo(301.03, 1);
    expect(tierElo(0)).toBe(ELO_BASE);
    expect(tierElo(3)).toBeCloseTo(ELO_BASE + 3 * ELO_PER_TIER, 9);
    // The win curve and the Elo curve agree: a team rated one tier up wins as often as Elo says it should.
    const oneUp = winChance(2 * opponentRating(0), opponentRating(0));
    expect(eloExpected(tierElo(1), tierElo(0))).toBeCloseTo(oneUp, 2);
  });

  it('puts promotion just under the next tier and relegation well under this one', () => {
    expect(promotionElo(2)).toBe(tierElo(3) - PROMOTE_MARGIN);
    expect(relegationElo(2)).toBe(tierElo(2) - RELEGATE_MARGIN);
    expect(relegationElo(0)).toBe(-Infinity);
    expect(promotionElo(2)).toBeGreaterThan(tierElo(2));
    expect(relegationElo(2)).toBeLessThan(tierElo(2));
  });

  it('moves a lot for an upset and almost nothing for a stomp', () => {
    const upset = { tier: 3, elo: tierElo(3) - 300 };
    recordEloResult(upset, true);
    const stomp = { tier: 3, elo: tierElo(3) + 300 };
    recordEloResult(stomp, true);
    expect(upset.elo - (tierElo(3) - 300)).toBeGreaterThan(15);
    expect(stomp.elo - (tierElo(3) + 300)).toBeLessThan(5);
    expect(upset.elo - (tierElo(3) - 300)).toBeGreaterThan((stomp.elo - (tierElo(3) + 300)) * 4);
    // Losing to a side it should beat costs a lot.
    const bad = { tier: 3, elo: tierElo(3) + 300 };
    recordEloResult(bad, false);
    expect(bad.elo).toBeLessThan(tierElo(3) + 300 - 15);
  });

  it('fills in a missing Elo from the tier, for teams from before Elo', () => {
    const old = { tier: 2 } as { tier: number; elo?: number };
    expect(teamElo(old)).toBe(tierElo(2));
    recordEloResult(old, true);
    expect(old.elo).toBeGreaterThan(tierElo(2));
  });

  it('settles at the level the roster really plays at, so a stronger roster ends up higher', () => {
    const settle = (ratio: number) => {
      const tier = 2;
      const opp = opponentRating(tier);
      const p = winChance(opp * ratio, opp);
      const team = { tier, elo: tierElo(tier) };
      const rng = new Rng({ rng: 17 });
      let sum = 0;
      for (let i = 0; i < 600; i++) {
        recordEloResult(team, rng.next() < p);
        if (i >= 300) sum += team.elo;
      }
      return sum / 300;
    };
    const even = settle(1);
    const better = settle(1.5);
    const crushing = settle(4);
    expect(better).toBeGreaterThan(even + 100);
    expect(crushing).toBeGreaterThan(better + 100);
    // It tracks the log of the rating: about 1000 Elo per factor of ten, within noise.
    expect(crushing - even).toBeGreaterThan(1000 * Math.log10(4) * 0.8);
    expect(crushing - even).toBeLessThan(1000 * Math.log10(4) * 1.3);
  });

  it('gates promotion: a roster close to the league rating does not qualify, a clearly stronger one does', () => {
    const tier = 1;
    const opp = opponentRating(tier);
    const reach = (ratio: number, seed: number) => {
      const rng = new Rng({ rng: seed });
      const p = winChance(opp * ratio, opp);
      const team = { tier, elo: tierElo(tier) };
      for (let i = 0; i < 160; i++) recordEloResult(team, rng.next() < p);
      return canPromote(team);
    };
    expect(reach(1, 5)).toBe(false);
    expect(reach(1.2, 6)).toBe(false);
    expect(reach(3, 7)).toBe(true);
  });
});
