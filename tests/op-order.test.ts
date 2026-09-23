import LZString from 'lz-string';
import { describe, expect, it } from 'vitest';
import { OPERATIONS } from '../src/data/operations';
import { computeRates } from '../src/engine/economy';
import { decodeSave } from '../src/engine/save';
import { foundedGame } from './fixtures';

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

describe('v5 -> v6 save migration', () => {
  /** A save written before the reorder: the three pairs still hold their old places. */
  function v5Save() {
    const s = foundedGame(0, 7) as unknown as Record<string, unknown> & ReturnType<typeof foundedGame>;
    s.ops.cafe = { owned: 80, highest: 90, level: 3, produced: 1e9 };
    s.ops.bootcamp = { owned: 20, highest: 20, level: 0, produced: 5e8 };
    s.ops.arena = { owned: 7, highest: 7, level: 1, produced: 1e10 };
    s.ops.broadcast = { owned: 0, highest: 0, level: 0, produced: 0 };
    s.upgrades.op_cafe_0 = 5;
    s.upgrades.op_cafe_2 = 6;
    s.upgrades.collab_cafe = 7;
    s.unlockedUpgrades.op_arena_0 = 8;
    s.achievements.op_cafe_50 = 9;
    const raw = JSON.parse(JSON.stringify(s));
    raw.version = 5;
    return `ESI5.${LZString.compressToBase64(JSON.stringify(raw))}`;
  }

  it("moves each org's buildings, upgrades and achievements with their old position", () => {
    const s = decodeSave(v5Save());
    // The 80 cafés sat in the 4th slot, which is now the Bootcamp House.
    expect(s.ops.bootcamp).toEqual({ owned: 80, highest: 90, level: 3, produced: 1e9 });
    expect(s.ops.cafe).toEqual({ owned: 20, highest: 20, level: 0, produced: 5e8 });
    expect(s.ops.broadcast.owned).toBe(7);
    expect(s.ops.arena.owned).toBe(0);
    expect(s.upgrades.op_bootcamp_0).toBe(5);
    expect(s.upgrades.op_bootcamp_2).toBe(6);
    expect(s.upgrades.collab_bootcamp).toBe(7);
    expect(s.upgrades.op_cafe_0).toBeUndefined();
    expect(s.unlockedUpgrades.op_broadcast_0).toBe(8);
    expect(s.achievements.op_bootcamp_50).toBe(9);
    expect(s.achievements.op_cafe_50).toBeUndefined();
  });

  it('keeps income the same across the migration', () => {
    const before = foundedGame(0, 7);
    before.ops.cafe.owned = 80;
    before.ops.bootcamp.owned = 20;
    // What those buildings earned in their old slots is what the swapped ones earn now.
    const expected = foundedGame(0, 7);
    expected.ops.bootcamp.owned = 80;
    expected.ops.cafe.owned = 20;
    const raw = JSON.parse(JSON.stringify(before));
    raw.version = 5;
    const migrated = decodeSave(`ESI5.${LZString.compressToBase64(JSON.stringify(raw))}`);
    expect(computeRates(migrated).cpsNoBuffs).toBeCloseTo(computeRates(expected).cpsNoBuffs);
  });
});
