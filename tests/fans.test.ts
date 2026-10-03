import { describe, expect, it } from 'vitest';
import { FAN_STAGES } from '../src/data/fanStages';
import { FAN_VALUE_FLOOR, FAN_VALUE_FLOOR_FANS, FAN_VALUE_KNEE_FANS, effectiveFans, fameMultiplier, fanStage, fanValue } from '../src/engine/economy';

describe('what a fan is worth', () => {
  it('counts every fan in full up to the knee, then each new fan for less', () => {
    expect(fanValue(0)).toBe(1);
    expect(fanValue(FAN_VALUE_KNEE_FANS)).toBe(1);
    expect(fanValue(4 * FAN_VALUE_KNEE_FANS)).toBeCloseTo(0.5, 9);
    expect(fanValue(100 * FAN_VALUE_KNEE_FANS)).toBeCloseTo(0.1, 9);
    expect(fanValue(1e9)).toBeLessThan(fanValue(1e8 * 2));
  });

  it('falls to the floor and stays there, never reaching zero', () => {
    expect(fanValue(FAN_VALUE_FLOOR_FANS)).toBeCloseTo(FAN_VALUE_FLOOR, 12);
    for (const f of [FAN_VALUE_FLOOR_FANS * 10, 1e15, 1e20, 1e40]) expect(fanValue(f)).toBe(FAN_VALUE_FLOOR);
  });

  it('counts effective fans as the sum of what each fan is worth: continuous, always rising, with the right slopes', () => {
    expect(effectiveFans(5e7)).toBe(5e7);
    expect(effectiveFans(FAN_VALUE_KNEE_FANS)).toBe(FAN_VALUE_KNEE_FANS);
    let last = 0;
    for (const f of [1, 1e3, 1e6, 1e8, 3e8, 1e9, 3e10, 1e12, 3e12, 1e15, 1e18, 1e24]) {
      const e = effectiveFans(f);
      expect(e).toBeGreaterThan(last);
      expect(e).toBeLessThanOrEqual(f);
      last = e;
    }
    // Past the floor a new fan adds exactly the floor.
    const a = FAN_VALUE_FLOOR_FANS * 10;
    expect((effectiveFans(a + 1e9) - effectiveFans(a)) / 1e9).toBeCloseTo(FAN_VALUE_FLOOR, 9);
    // At the knee a new fan still adds almost a full fan.
    expect((effectiveFans(FAN_VALUE_KNEE_FANS + 1e4) - effectiveFans(FAN_VALUE_KNEE_FANS)) / 1e4).toBeGreaterThan(0.99);
  });

  it('keeps fame rising with every fan, however many there are, and unchanged before the knee', () => {
    const exp = 0.13;
    expect(fameMultiplier(0, exp)).toBe(1);
    expect(fameMultiplier(1e6, exp)).toBeCloseTo(Math.pow(1 + 1e6 / 100, exp), 12);
    let last = 0;
    for (const f of [1e8, 3e9, 1e10, 1e12, 1e13, 1e15, 1e18, 1e21]) {
      const m = fameMultiplier(f, exp);
      expect(m).toBeGreaterThan(last);
      last = m;
    }
    // Slowly: a thousand times the fans past a trillion is far from a thousand times the fame.
    expect(fameMultiplier(1e15, exp) / fameMultiplier(1e12, exp)).toBeLessThan(3);
  });
});

describe('fan stages', () => {
  it('start at zero, rise in order and have a name and a line each', () => {
    expect(FAN_STAGES[0].from).toBe(0);
    for (let i = 1; i < FAN_STAGES.length; i++) expect(FAN_STAGES[i].from).toBeGreaterThan(FAN_STAGES[i - 1].from);
    expect(new Set(FAN_STAGES.map((s) => s.id)).size).toBe(FAN_STAGES.length);
    for (const s of FAN_STAGES) {
      expect(s.name.length).toBeGreaterThan(2);
      expect(s.blurb.length).toBeGreaterThan(10);
    }
  });

  it('keeps the value per fan at 1 until the knee and at its floor by the last stage', () => {
    expect(fanValue(FAN_STAGES.find((s) => s.id === 'mainstream')!.from)).toBe(1);
    expect(fanValue(FAN_STAGES.find((s) => s.id === 'household')!.from)).toBe(1);
    const last = FAN_STAGES[FAN_STAGES.length - 1];
    expect(last.name).toBe('The Team Everyone Knows');
    expect(fanValue(last.from)).toBeCloseTo(FAN_VALUE_FLOOR, 9);
  });

  it('says which stage the org is in, how far through it, and what is next', () => {
    expect(fanStage(0).stage.id).toBe('lobby');
    expect(fanStage(0).progress).toBe(0);
    expect(fanStage(5e3).stage.id).toBe('local');
    const mid = fanStage(Math.sqrt(1e3 * 1e4));
    expect(mid.stage.id).toBe('local');
    expect(mid.progress).toBeCloseTo(0.5, 6);
    expect(mid.next?.id).toBe('rising');
    const top = fanStage(1e30);
    expect(top.stage.id).toBe('everyone');
    expect(top.next).toBeNull();
    expect(top.value).toBe(FAN_VALUE_FLOOR);
  });
});
