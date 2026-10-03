import { afterEach, describe, expect, it } from 'vitest';
import { readCollapse, withUrgent, writeCollapse } from '../src/ui/collapse';

describe('collapsible HQ cards', () => {
  const g = globalThis as { localStorage?: Storage };
  const had = g.localStorage;
  afterEach(() => {
    g.localStorage = had;
  });

  it('opens a closed card for a new urgent item', () => {
    const closed = { open: false, seenUrgent: null };
    expect(withUrgent(closed, 'Sell the org for +12 legacy')).toEqual({ open: true, seenUrgent: 'Sell the org for +12 legacy' });
  });

  it('stays closed once the player closes it for the same urgent item', () => {
    const dismissed = { open: false, seenUrgent: 'injury' };
    expect(withUrgent(dismissed, 'injury')).toBe(dismissed);
  });

  it('opens again for the next urgent item, including the same one coming back later', () => {
    const dismissed = { open: false, seenUrgent: 'injury' };
    expect(withUrgent(dismissed, 'scandal').open).toBe(true);
    const cleared = withUrgent(dismissed, null);
    expect(cleared).toEqual({ open: false, seenUrgent: null });
    expect(withUrgent(cleared, 'injury').open).toBe(true);
  });

  it('leaves an open card alone when nothing is urgent', () => {
    const open = { open: true, seenUrgent: null };
    expect(withUrgent(open, null)).toBe(open);
  });

  it('remembers each card, and starts open when storage is empty or unavailable', () => {
    const store = new Map<string, string>();
    g.localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) } as Storage;
    expect(readCollapse('next-steps')).toEqual({ open: true, seenUrgent: null });
    writeCollapse('next-steps', { open: false, seenUrgent: 'x' });
    expect(readCollapse('next-steps')).toEqual({ open: false, seenUrgent: 'x' });
    expect(readCollapse('org-activity').open).toBe(true);
    g.localStorage = undefined;
    expect(readCollapse('next-steps')).toEqual({ open: true, seenUrgent: null });
    expect(() => writeCollapse('next-steps', { open: false, seenUrgent: null })).not.toThrow();
  });
});
