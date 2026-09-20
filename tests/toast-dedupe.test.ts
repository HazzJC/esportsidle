import { afterEach, describe, expect, it, vi } from 'vitest';
import { game } from '../src/ui/game.svelte';

afterEach(() => {
  game.toasts = [];
  vi.useRealTimers();
});

describe('purchase warning popups', () => {
  it('keeps one warning per item while allowing another item', () => {
    vi.useFakeTimers();
    const warning = { title: 'Not enough cash', tone: 'bad' as const, dedupeKey: 'operation:grinder' };
    game.toast(warning, 3500);
    game.toast(warning, 3500);
    expect(game.toasts).toHaveLength(1);
    game.toast({ ...warning, dedupeKey: 'operation:streamer' }, 3500);
    expect(game.toasts).toHaveLength(2);
    game.dismissToast(game.toasts[0].id);
    game.toast(warning, 3500);
    expect(game.toasts).toHaveLength(1);
    vi.advanceTimersByTime(3500);
    expect(game.toasts).toHaveLength(0);
    game.toast(warning, 3500);
    expect(game.toasts).toHaveLength(1);
  });
});
