import { describe, expect, it } from 'vitest';
import { GEAR_MAX_TIER, GEAR_SLOTS } from '../src/data/gear';
import { GEAR_ART_SLOTS, gearArtMarkup, gearArtSvg, gearArtTiers } from '../src/ui/gearArt';

const count = (s: string, needle: string) => s.split(needle).length - 1;

describe('gear art', () => {
  it('draws every tier of every slot', () => {
    expect(new Set(GEAR_ART_SLOTS)).toEqual(new Set(GEAR_SLOTS.map((g) => g.id)));
    for (const slot of GEAR_SLOTS) {
      expect(gearArtTiers(slot.id)).toBe(GEAR_MAX_TIER + 1);
      expect(slot.tiers).toHaveLength(GEAR_MAX_TIER + 1);
    }
  });

  it('produces well-formed markup with no missing values', () => {
    for (const slot of GEAR_ART_SLOTS) {
      for (let t = 0; t <= GEAR_MAX_TIER; t++) {
        const m = gearArtMarkup(slot, t);
        const where = `${slot} tier ${t}`;
        expect(m.length, where).toBeGreaterThan(40);
        expect(m, where).not.toMatch(/undefined|NaN|Infinity|\[object/);
        expect(count(m, '<'), where).toBe(count(m, '>'));
        expect(count(m, '<g '), where).toBe(count(m, '</g>'));
        expect(count(m, '<clipPath'), where).toBe(count(m, '</clipPath>'));
      }
    }
  });

  it('gives each tier its own drawing', () => {
    for (const slot of GEAR_ART_SLOTS) {
      for (let t = 1; t <= GEAR_MAX_TIER; t++) expect(gearArtMarkup(slot, t), `${slot} ${t}`).not.toBe(gearArtMarkup(slot, t - 1));
    }
  });

  it('is rendered with {@html}, so it must never contain anything executable', () => {
    for (const slot of GEAR_ART_SLOTS) {
      for (let t = 0; t <= GEAR_MAX_TIER; t++) {
        const svg = gearArtSvg(slot, t);
        expect(svg).not.toMatch(/<script|<foreignObject|\son[a-z]+=|javascript:|href=/i);
      }
    }
  });

  it('clamps tiers outside the range', () => {
    expect(gearArtMarkup('pc', -3)).toBe(gearArtMarkup('pc', 0));
    expect(gearArtMarkup('pc', 99)).toBe(gearArtMarkup('pc', GEAR_MAX_TIER));
  });
});
