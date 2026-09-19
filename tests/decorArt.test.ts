import { describe, expect, it } from 'vitest';
import { DECOR, ROOMS } from '../src/data/decor';
import { ACHIEVEMENTS } from '../src/data/achievements';
import { OPERATIONS } from '../src/data/operations';
import { RARITY_COLORS } from '../src/data/palette';
import { DECOR_ART_IDS, decorArtMarkup, decorArtSvg } from '../src/ui/decorArt';
import { opBand, roomColor, tierColor, upgradeBand } from '../src/ui/theme';

const count = (s: string, needle: string) => s.split(needle).length - 1;

describe('decor art', () => {
  it('draws every decor item', () => {
    expect(new Set(DECOR_ART_IDS)).toEqual(new Set(DECOR.map((d) => d.id)));
  });

  it('produces well-formed markup for cards and scenes', () => {
    for (const id of DECOR_ART_IDS) {
      for (const scene of [false, true]) {
        const m = decorArtMarkup(id, '#4f9dff', scene);
        expect(m.length, id).toBeGreaterThan(40);
        expect(m, id).not.toMatch(/undefined|NaN|Infinity|\[object/);
        expect(count(m, '<'), id).toBe(count(m, '>'));
        expect(count(m, '<g '), id).toBe(count(m, '</g>'));
      }
    }
  });

  it('never repeats an attribute on one element', () => {
    for (const id of DECOR_ART_IDS) {
      for (const el of decorArtSvg(id, '#fff').match(/<[a-z]+ [^>]*>/g) ?? []) {
        const names = [...el.matchAll(/\s([a-z-]+)=/g)].map((m) => m[1]);
        expect(new Set(names).size, `${id}: ${el}`).toBe(names.length);
      }
    }
  });

  it('is rendered with {@html}, so it must never contain anything executable', () => {
    for (const id of DECOR_ART_IDS) {
      expect(decorArtSvg(id, '#a97bff')).not.toMatch(/<script|<foreignObject|\son[a-z]+=|javascript:|href=/i);
    }
  });
});

describe('one rarity ladder', () => {
  it('gives each room its own band, from common to mythic', () => {
    expect(ROOMS.map((_, i) => roomColor(i))).toEqual([...RARITY_COLORS]);
  });

  it('never ranks a later operation below an earlier one', () => {
    for (let i = 1; i < OPERATIONS.length; i++) expect(opBand(i)).toBeGreaterThanOrEqual(opBand(i - 1));
    expect(opBand(0)).toBe(0);
    expect(opBand(OPERATIONS.length - 1)).toBe(RARITY_COLORS.length - 1);
  });

  it('maps upgrade tiers onto the same six colours', () => {
    for (let t = 1; t <= 13; t++) expect(upgradeBand(t)).toBeGreaterThanOrEqual(upgradeBand(t - 1));
    for (let t = 0; t <= 13; t++) expect(RARITY_COLORS).toContain(tierColor(t));
    expect(upgradeBand(0)).toBe(0);
    expect(upgradeBand(13)).toBe(5);
  });

  it('rates every achievement, and ladders climb', () => {
    for (const a of ACHIEVEMENTS) {
      expect(Number.isInteger(a.rarity), a.id).toBe(true);
      expect(a.rarity, a.id).toBeGreaterThanOrEqual(0);
      expect(a.rarity, a.id).toBeLessThan(RARITY_COLORS.length);
    }
    const earn = ACHIEVEMENTS.filter((a) => a.id.startsWith('earn_'));
    expect(earn[0].rarity).toBe(0);
    expect(earn[earn.length - 1].rarity).toBe(5);
    // Every band is used, so the colours carry information.
    for (let b = 0; b < RARITY_COLORS.length; b++) expect(ACHIEVEMENTS.some((a) => a.rarity === b)).toBe(true);
  });
});
