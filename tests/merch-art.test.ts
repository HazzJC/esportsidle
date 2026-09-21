import { describe, expect, it } from 'vitest';
import { PRODUCTS } from '../src/data/merch';
import { MERCH_ART_IDS, lookIndex, merchArtMarkup, merchMilestones, merchPrintWindow } from '../src/ui/merchArt';

describe('merch art', () => {
  it('draws every product', () => {
    expect([...MERCH_ART_IDS].sort()).toEqual(PRODUCTS.map((p) => p.id).sort());
  });

  it('renders every finish level, animated or not, with no broken numbers', () => {
    for (const id of MERCH_ART_IDS) {
      for (let q = 0; q <= 10; q++) {
        for (const animate of [false, true]) {
          const svg = merchArtMarkup(id, '#22e4ff', '#8b5cff', q, animate);
          expect(svg.length, `${id} Q${q}`).toBeGreaterThan(200);
          expect(svg, `${id} Q${q}`).not.toMatch(/NaN|undefined/);
        }
      }
    }
  });

  it('changes shape at Q2 and Q4, and adds presentation from Q8', () => {
    for (const id of MERCH_ART_IDS) {
      const at = (q: number) => merchArtMarkup(id, '#22e4ff', '#8b5cff', q).replace(/mx[0-9a-z]+/g, 'mx');
      expect(lookIndex(0)).toBe(0);
      expect(lookIndex(2)).toBe(1);
      expect(lookIndex(4)).toBe(2);
      // Different bodies, not just a different frame.
      expect(at(2)).not.toBe(at(0));
      expect(at(4)).not.toBe(at(2));
      expect(at(8)).toContain('pathLength="1"');
      expect(at(10)).toContain('-gc');
      expect(merchMilestones(id).map((m) => m.q)).toEqual([0, 2, 4, 6, 8, 9, 10]);
    }
  });

  it('keeps the design print on the canvas at every finish', () => {
    for (const id of MERCH_ART_IDS) {
      for (let q = 0; q <= 10; q++) {
        const w = merchPrintWindow(id, q);
        expect(w.x, `${id} Q${q}`).toBeGreaterThanOrEqual(0);
        expect(w.y, `${id} Q${q}`).toBeGreaterThanOrEqual(0);
        expect(w.x + w.w, `${id} Q${q}`).toBeLessThanOrEqual(48);
        expect(w.y + w.h, `${id} Q${q}`).toBeLessThanOrEqual(48);
      }
    }
  });

  it('never puts an unchecked colour into the markup', () => {
    const svg = merchArtMarkup('tee', '"><script>alert(1)</script>', 'red;x', 6);
    expect(svg).not.toContain('<script>');
    expect(svg).not.toContain('red;x');
  });
});
