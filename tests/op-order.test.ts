import { describe, expect, it } from 'vitest';
import { OPERATIONS } from '../src/data/operations';
describe('operation order', () => {
  it('climbs by real-world cost: bootcamp before café, broadcast before arena, game studio before platform', () => {
    expect(OPERATIONS.map((o) => o.id)).toEqual([
      'grinder',
      'streamer',
      'creator',
      'bootcamp',
      'cafe',
      'lan',
      'broadcast',
      'arena',
      'studio',
      'platform',
      'league',
      'orbital',
      'neural',
      'clone',
      'simulation',
      'multiverse',
    ]);
    for (let i = 1; i < OPERATIONS.length; i++) expect(OPERATIONS[i].baseCost).toBeGreaterThan(OPERATIONS[i - 1].baseCost);
  });
});
