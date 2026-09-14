import { describe, expect, it } from 'vitest';
import { advance, applyOfflineProgress } from '../src/engine/game';
import { computeRates } from '../src/engine/economy';
import {
  BACKUP_KEYS,
  CORRUPT_KEY,
  SAVE_KEY,
  decodeSave,
  encodeSave,
  mergeDefaults,
  readSave,
  writeSave,
  type StorageLike,
} from '../src/engine/save';
import { createNewGame } from '../src/engine/state';

class MemoryStorage implements StorageLike {
  data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
}

describe('save encoding', () => {
  it('round-trips a game state', () => {
    const s = createNewGame(1000, 42);
    s.cash = 123456.5;
    s.ops.streamer.owned = 12;
    s.upgrades.grind_0 = 5;
    s.org.name = 'Natus Vinegar';
    const decoded = decodeSave(encodeSave(s));
    expect(decoded).toEqual(s);
  });

  it('tolerates whitespace in pasted saves', () => {
    const s = createNewGame(1000, 42);
    const text = encodeSave(s);
    const spaced = `  ${text.slice(0, 20)}\n${text.slice(20)}  `;
    expect(decodeSave(spaced).rng).toBe(42);
  });

  it('rejects garbage', () => {
    expect(() => decodeSave('hello')).toThrow();
    expect(() => decodeSave('ESI1.!!!!')).toThrow();
  });

  it('rejects saves from the future', () => {
    const text = encodeSave(createNewGame(0, 1)).replace(/^ESI\d+/, 'ESI999');
    expect(() => decodeSave(text)).toThrow(/newer/);
  });

  it('fills in missing fields with defaults', () => {
    const merged = mergeDefaults(
      { a: 1, nested: { b: 2, c: 3 }, list: [1], nullable: null },
      { a: 5, nested: { b: 'bad' }, extra: true, nullable: 'x' },
    );
    expect(merged).toEqual({ a: 5, nested: { b: 2, c: 3 }, list: [1], extra: true, nullable: 'x' });
  });
});

describe('storage', () => {
  it('writes, rotates backups and reads back', () => {
    const storage = new MemoryStorage();
    const s = createNewGame(0, 7);
    writeSave(storage, s, 1_000_000);
    expect(storage.getItem(SAVE_KEY)).toBeTruthy();
    expect(storage.getItem(BACKUP_KEYS[0])).toBeTruthy();
    s.cash = 50;
    writeSave(storage, s, 1_000_000 + 11 * 60 * 1000);
    expect(storage.getItem(BACKUP_KEYS[1])).toBeTruthy();
    expect(readSave(storage).state?.cash).toBe(50);
  });

  it('falls back to a backup when the main save is corrupted', () => {
    const storage = new MemoryStorage();
    const s = createNewGame(0, 7);
    s.cash = 99;
    writeSave(storage, s, 1_000_000);
    storage.setItem(SAVE_KEY, 'ESI1.corrupted');
    const result = readSave(storage);
    expect(result.state?.cash).toBe(99);
    expect(result.source).toBe(BACKUP_KEYS[0]);
    expect(storage.getItem(CORRUPT_KEY)).toBe('ESI1.corrupted');
  });
});

describe('progress over time', () => {
  it('advances production online', () => {
    const s = createNewGame(0, 1);
    // Grinders generate no fans, so income stays constant over the interval.
    s.ops.grinder.owned = 10;
    const cps = computeRates(s).cps;
    advance(s, 60);
    expect(s.cash).toBeCloseTo(cps * 60, 0);
  });

  it('credits offline progress at the offline rate, capped', () => {
    const s = createNewGame(0, 1);
    s.ops.streamer.owned = 10;
    s.lastSaved = 0;
    const cps = computeRates(s).cps;
    const report = applyOfflineProgress(s, 3600 * 1000);
    expect(report).not.toBeNull();
    expect(report!.countedSeconds).toBe(3600);
    expect(s.cash).toBeGreaterThan(cps * 3600 * 0.2 * 0.99);

    const t = createNewGame(0, 1);
    t.lastSaved = 0;
    const capped = applyOfflineProgress(t, 48 * 3600 * 1000);
    expect(capped!.countedSeconds).toBe(12 * 3600);
  });

  it('ignores short absences', () => {
    const s = createNewGame(0, 1);
    s.lastSaved = 0;
    expect(applyOfflineProgress(s, 5000)).toBeNull();
  });
});
