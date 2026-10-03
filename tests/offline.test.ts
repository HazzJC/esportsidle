/**
 * Strict offline (docs/implementation-plan.md, WS4): offline is a floor, not a strategy. The full
 * offline rate for a window, half of it to a hard 24-hour cap, nothing after.
 */
import { describe, expect, it } from 'vitest';
import { BASE_OFFLINE_RATE, BASE_OFFLINE_WINDOW_HOURS, MAX_OFFLINE_RATE, MAX_OFFLINE_WINDOW_HOURS, computeMods, computeRates } from '../src/engine/economy';
import { applyOfflineProgress, offlineCredit } from '../src/engine/game';
import { foundedGame } from './fixtures';

const H = 3600;

describe('offline credit', () => {
  const base = { offlineWindowHours: BASE_OFFLINE_WINDOW_HOURS };

  it('counts the window in full, then half of the time to 24 hours, then nothing', () => {
    expect(offlineCredit(2 * H, base).counted).toBe(2 * H);
    expect(offlineCredit(6 * H, base).counted).toBe(6 * H);
    expect(offlineCredit(12 * H, base)).toEqual({ window: 6 * H, full: 6 * H, taper: 3 * H, counted: 9 * H });
    expect(offlineCredit(24 * H, base).counted).toBe(6 * H + 9 * H);
    expect(offlineCredit(72 * H, base).counted).toBe(offlineCredit(24 * H, base).counted);
  });

  it('with the longest window, a day away still counts for less than a day', () => {
    const c = offlineCredit(24 * H, { offlineWindowHours: MAX_OFFLINE_WINDOW_HOURS });
    expect(c.counted).toBe(12 * H + 6 * H);
    // At the highest rate, a day away is worth at most 30% of a day with the game open.
    expect((c.counted * MAX_OFFLINE_RATE) / (24 * H)).toBeCloseTo(0.3, 9);
  });

  it('starts every org at the base rate and window', () => {
    const m = computeMods(foundedGame(0, 1));
    expect(m.offlineRate).toBe(BASE_OFFLINE_RATE);
    expect(m.offlineWindowHours).toBe(BASE_OFFLINE_WINDOW_HOURS);
  });

  it('pays operations at the offline rate over the credited time, and reports it plainly', () => {
    const s = foundedGame(0, 1);
    s.ops.grinder.owned = 50;
    s.ops.streamer.owned = 20;
    const cps = computeRates(s).cpsNoBuffs;
    s.lastSaved = 0;
    const report = applyOfflineProgress(s, 12 * H * 1000)!;
    expect(report.countedSeconds).toBe(9 * H);
    expect(report.fullSeconds).toBe(6 * H);
    expect(report.taperSeconds).toBe(3 * H);
    expect(report.rate).toBe(BASE_OFFLINE_RATE);
    // Operations alone: income at the offline rate for nine credited hours (fans may lift it a little).
    expect(report.earned).toBeGreaterThanOrEqual(cps * BASE_OFFLINE_RATE * 9 * H * 0.999);
    expect(report.earned).toBeLessThan(report.openEstimate * 0.5);
  });
});
