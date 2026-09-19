import { describe, expect, it } from 'vitest';
import { getOp } from '../src/data/operations';
import { bulkPrice, buyOperation, maxAffordable, sellOperation, sellRefund, unitPrice } from '../src/engine/operations';
import { foundedGame } from './fixtures';

const grinder = getOp('grinder');

describe('operation pricing', () => {
  it('starts at the base cost and grows by 15%', () => {
    expect(unitPrice(grinder, 0)).toBe(15);
    expect(unitPrice(grinder, 1)).toBe(Math.ceil(15 * 1.15));
    expect(unitPrice(grinder, 10)).toBe(Math.ceil(15 * Math.pow(1.15, 10)));
  });

  it('bulk price matches the sum of the geometric series', () => {
    let sum = 0;
    for (let i = 0; i < 10; i++) sum += 15 * Math.pow(1.15, i);
    expect(bulkPrice(grinder, 0, 10)).toBe(Math.ceil(sum));
  });

  it('computes the max affordable amount exactly', () => {
    for (const cash of [0, 14, 15, 100, 1234, 99999, 1e9]) {
      const n = maxAffordable(grinder, 3, cash);
      if (n > 0) expect(bulkPrice(grinder, 3, n)).toBeLessThanOrEqual(cash);
      expect(bulkPrice(grinder, 3, n + 1)).toBeGreaterThan(cash);
    }
  });

  it('refunds 25% of what the last units cost', () => {
    expect(sellRefund(grinder, 10, 1)).toBe(Math.floor(bulkPrice(grinder, 9, 1) * 0.25));
    expect(sellRefund(grinder, 2, 5)).toBe(Math.floor(bulkPrice(grinder, 0, 2) * 0.25));
  });
});

describe('buying and selling', () => {
  it('buys when affordable and deducts cash', () => {
    const s = foundedGame(0, 1);
    s.cash = 100;
    expect(buyOperation(s, 'grinder', 1)).toBe(1);
    expect(s.cash).toBe(85);
    expect(s.ops.grinder.owned).toBe(1);
  });

  it('refuses purchases it cannot afford', () => {
    const s = foundedGame(0, 1);
    s.cash = 10;
    expect(buyOperation(s, 'grinder', 1)).toBe(0);
    expect(s.cash).toBe(10);
  });

  it('buys max and sells all', () => {
    const s = foundedGame(0, 1);
    s.cash = 10_000;
    const n = buyOperation(s, 'grinder', -1);
    expect(n).toBeGreaterThan(10);
    expect(s.ops.grinder.highest).toBe(n);
    const refund = sellOperation(s, 'grinder', -1);
    expect(refund).toBeGreaterThan(0);
    expect(s.ops.grinder.owned).toBe(0);
    expect(s.ops.grinder.highest).toBe(n);
  });
});
