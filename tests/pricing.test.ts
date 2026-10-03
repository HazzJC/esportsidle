/**
 * Freezes the operation price curve. The 16 base costs and outputs are Cookie Clicker's building
 * table, line for line, with ×1.15 growth and a 25% sell-back, except that the top four operations
 * grow faster per unit and have dearer tier upgrades (WS3: a run that has climbed the ladder levels
 * off by buying more of them). A change here has to be deliberate.
 */
import { describe, expect, it } from 'vitest';
import { OPERATIONS } from '../src/data/operations';
import { TIER_COST_MULT, TIER_NEED } from '../src/data/upgrades';
import { UPGRADE_MAP } from '../src/data/upgrades';
import { SELL_REFUND, bulkPrice, maxAffordable, sellRefund, unitPrice } from '../src/engine/operations';
import { PRICE_GROWTH, geometricMax, geometricPrice } from '../src/engine/pricing';

/** [id, base cost, base output per second], in store order. */
const TABLE: [string, number, number][] = [
  ['grinder', 15, 0.1],
  ['streamer', 100, 1],
  ['creator', 1100, 8],
  ['bootcamp', 12_000, 47],
  ['cafe', 130_000, 260],
  ['lan', 1.4e6, 1400],
  ['broadcast', 2e7, 7800],
  ['arena', 3.3e8, 44_000],
  ['studio', 5.1e9, 260_000],
  ['platform', 7.5e10, 1.6e6],
  ['league', 1e12, 1e7],
  ['orbital', 1.4e13, 6.5e7],
  ['neural', 1.7e14, 4.3e8],
  ['clone', 2.1e15, 2.9e9],
  ['simulation', 2.6e16, 2.1e10],
  ['multiverse', 3.1e17, 1.5e11],
];

describe('the operation table', () => {
  it('matches the 16-row table in order', () => {
    expect(OPERATIONS.map((o) => [o.id, o.baseCost, o.baseCps])).toEqual(TABLE);
    OPERATIONS.forEach((o, i) => expect(o.index).toBe(i));
  });

  it('keeps each operation dearer and more productive than the one before', () => {
    for (let i = 1; i < OPERATIONS.length; i++) {
      expect(OPERATIONS[i].baseCost).toBeGreaterThan(OPERATIONS[i - 1].baseCost);
      expect(OPERATIONS[i].baseCps).toBeGreaterThan(OPERATIONS[i - 1].baseCps);
      // Payback of the first unit lengthens down the list (the grinder, like the cursor, is the exception).
      if (i >= 2) expect(OPERATIONS[i].baseCost / OPERATIONS[i].baseCps).toBeGreaterThan(OPERATIONS[i - 1].baseCost / OPERATIONS[i - 1].baseCps);
    }
  });

  it('unlocks the doubling tiers at the same counts and prices', () => {
    expect(TIER_NEED).toEqual([1, 5, 25, 50, 100, 150, 200, 250, 300, 350, 400, 450]);
    expect(TIER_COST_MULT).toEqual([10, 50, 500, 5e4, 5e6, 5e8, 5e11, 5e14, 5e17, 5e20, 5e24, 5e28]);
  });

  it('makes only the top four steeper, each steeper than the one below', () => {
    expect(OPERATIONS.map((o) => o.priceGrowth ?? PRICE_GROWTH)).toEqual([...Array(12).fill(1.15), 1.2, 1.25, 1.4, 1.6]);
    expect(OPERATIONS.map((o) => o.tierCostScale ?? 1)).toEqual([...Array(12).fill(1), 100, 100, 100, 100]);
    expect(UPGRADE_MAP.get('op_multiverse_0')!.cost).toBe(3.1e17 * 10 * 100);
    expect(UPGRADE_MAP.get('op_league_0')!.cost).toBe(1e12 * 10);
  });
});

describe('the price curve', () => {
  it('grows by each operation’s own rate a unit (15% for all but the top four)', () => {
    expect(PRICE_GROWTH).toBe(1.15);
    for (const op of OPERATIONS) {
      const g = op.priceGrowth ?? 1.15;
      for (const owned of [0, 1, 10, 100, 400]) expect(unitPrice(op, owned) / Math.ceil(op.baseCost * g ** owned)).toBeCloseTo(1, 12);
    }
  });

  it('prices a bulk buy as the sum of the units', () => {
    for (const op of [OPERATIONS[0], OPERATIONS[7], OPERATIONS[15]]) {
      for (const [owned, amount] of [
        [0, 10],
        [25, 100],
        [300, 1],
      ]) {
        let sum = 0;
        for (let i = 0; i < amount; i++) sum += op.baseCost * (op.priceGrowth ?? 1.15) ** (owned + i);
        // Rounded up to whole cash once, for the whole purchase.
        expect(bulkPrice(op, owned, amount)).toBeGreaterThanOrEqual(sum * (1 - 1e-12));
        expect(bulkPrice(op, owned, amount)).toBeLessThanOrEqual(sum * (1 + 1e-12) + 1);
      }
    }
  });

  it('applies a cost multiplier to the whole bulk price', () => {
    expect(geometricPrice(100, 5, 10, 0.5) / geometricPrice(100, 5, 10)).toBeCloseTo(0.5, 6);
  });

  it('finds the most units cash can buy, exactly, for every operation', () => {
    for (const op of OPERATIONS) {
      for (const owned of [0, 7, 150]) {
        for (const k of [0.5, 1, 3, 40, 1e3, 1e6]) {
          const cash = unitPrice(op, owned) * k;
          const n = maxAffordable(op, owned, cash);
          if (n > 0) expect(bulkPrice(op, owned, n)).toBeLessThanOrEqual(cash);
          expect(bulkPrice(op, owned, n + 1)).toBeGreaterThan(cash);
        }
      }
    }
    expect(geometricMax(15, 0, 14)).toBe(0);
  });

  it('refunds a quarter of what the sold units cost', () => {
    expect(SELL_REFUND).toBe(0.25);
    for (const op of [OPERATIONS[0], OPERATIONS[9]]) {
      expect(sellRefund(op, 50, 10)).toBe(Math.floor(bulkPrice(op, 40, 10) * 0.25));
      // Selling more than you own sells what you have.
      expect(sellRefund(op, 3, 10)).toBe(Math.floor(bulkPrice(op, 0, 3) * 0.25));
    }
  });
});
