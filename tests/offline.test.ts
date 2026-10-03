/**
 * Offline is a floor, not a strategy: the full rate for a window, then a fading rate that never
 * quite stops, so a longer absence always pays a little more than a shorter one.
 */
import { describe, expect, it } from 'vitest';
import { BASE_OFFLINE_RATE, BASE_OFFLINE_WINDOW_HOURS, OFFLINE_FADE_HOURS, computeMods, computeRates } from '../src/engine/economy';
import { applyOfflineProgress, offlineCredit } from '../src/engine/game';
import { foundedGame } from './fixtures';

const H = 3600;

describe('offline credit', () => {
  const base = { offlineWindowHours: BASE_OFFLINE_WINDOW_HOURS };

  it('counts the window in full, then a fading share of the time after it', () => {
    expect(offlineCredit(2 * H, base).counted).toBe(2 * H);
    expect(offlineCredit(6 * H, base).counted).toBe(6 * H);
    const twelve = offlineCredit(12 * H, base);
    expect(twelve.window).toBe(6 * H);
    expect(twelve.full).toBe(6 * H);
    // The first extra hours are worth almost their full length.
    expect(twelve.taper).toBeGreaterThan(4 * H);
    expect(twelve.taper).toBeLessThan(6 * H);
    expect(twelve.counted).toBe(twelve.full + twelve.taper);
  });

  it('never stops paying: every extra hour away is worth something, each a little less', () => {
    let previous = offlineCredit(0, base).counted;
    let previousStep = Infinity;
    for (const hours of [6, 12, 24, 48, 72, 168, 720]) {
      const counted = offlineCredit(hours * H, base).counted;
      expect(counted).toBeGreaterThan(previous);
      previous = counted;
    }
    for (let h = 7; h < 200; h += 10) {
      const step = offlineCredit((h + 1) * H, base).counted - offlineCredit(h * H, base).counted;
      expect(step).toBeGreaterThan(0);
      expect(step).toBeLessThanOrEqual(previousStep + 1e-9);
      previousStep = step;
    }
  });

  it('is continuous at the end of the window', () => {
    const inside = offlineCredit(6 * H - 1, base).counted;
    const after = offlineCredit(6 * H + 1, base).counted;
    expect(after - inside).toBeLessThan(3);
  });

  it('fades by the stated time constant: FADE hours past the window count as FADE · ln 2', () => {
    const c = offlineCredit(6 * H + OFFLINE_FADE_HOURS * H, base);
    expect(c.taper).toBeCloseTo(OFFLINE_FADE_HOURS * H * Math.log(2), 6);
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
    expect(report.countedSeconds).toBeCloseTo(offlineCredit(12 * H, computeMods(s)).counted, 3);
    expect(report.fullSeconds).toBe(6 * H);
    expect(report.taperSeconds).toBeGreaterThan(0);
    expect(report.rate).toBe(BASE_OFFLINE_RATE);
    // Operations alone: income at the offline rate over the credited time (fans may lift it a little).
    expect(report.earned).toBeGreaterThanOrEqual(cps * BASE_OFFLINE_RATE * report.countedSeconds * 0.999);
    expect(report.earned).toBeLessThan(report.openEstimate * 0.6);
  });
});
