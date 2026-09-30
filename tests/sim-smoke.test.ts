/**
 * Keeps the balance simulator (scripts/sim) running against the current engine. The old playtest
 * runner rotted unnoticed because nothing ran it; this plays every persona for a few simulated
 * minutes on each test run.
 */
import { describe, expect, it } from 'vitest';
import { PERSONAS } from '../scripts/sim/personas';
import { runSim } from '../scripts/sim/run-sim';
import { INCOME_SOURCES } from '../src/engine/types';

const MINUTES = 5;

describe('balance simulator', () => {
  for (const id of Object.keys(PERSONAS)) {
    it(`plays ${id} for ${MINUTES} minutes and books finite income`, () => {
      const r = runSim({ persona: id, seed: 3, hours: MINUTES / 60, sampleEvery: 60 });
      expect(r.samples).toHaveLength(MINUTES);
      const booked = r.samples.reduce((a, x) => a + INCOME_SOURCES.reduce((b, k) => b + x.booked[k], 0), 0);
      expect(booked).toBeGreaterThan(0);
      for (const x of r.samples) for (const k of INCOME_SOURCES) expect(Number.isFinite(x.booked[k]), k).toBe(true);
    });
  }

  it('gives the same record for the same seed', () => {
    const strip = (r: ReturnType<typeof runSim>) => JSON.stringify({ ...r, ranSeconds: 0 });
    const a = runSim({ persona: 'active', seed: 5, hours: MINUTES / 60, sampleEvery: 60 });
    const b = runSim({ persona: 'active', seed: 5, hours: MINUTES / 60, sampleEvery: 60 });
    expect(strip(a)).toBe(strip(b));
  });
});
