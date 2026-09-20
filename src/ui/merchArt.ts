import { K, circ, ell, f, glow, grid2, line, op, path, rect, rr, shadow, spark, stroke } from './artKit';

/**
 * Bespoke art for every merch product, drawn on the same 48x48 grid as the gear art so a hoodie in
 * the Studio reads like a mouse in the gear list. Each product takes the org's two colours, so the
 * shelf looks like your org's shelf, and reports the window where the player's own design is
 * printed, which the preview overlays on top.
 *
 * Finish quality shows: mid-quality lines gain contrast piping, high-quality lines gain a gloss
 * sweep, and a maxed line sparkles. Output is built only from constants here and validated hex
 * colours, so it is safe to render with {@html}.
 */

/** Where a design sits on a product, in 48-grid units. */
export interface PrintWindow {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Degrees, for surfaces that sit at an angle. */
  rotate?: number;
  /** Rounded corners on the print, as a share of its width. */
  round?: number;
}

export interface MerchArtDef {
  draw: (primary: string, secondary: string, quality: number) => string;
  print: PrintWindow;
}

/** Piping along a seam once the finish is worth paying for. */
const piping = (d: string, c: string, quality: number) => (quality >= 3 ? line(d, c, 0.9, op(0.9)) : '');
/** A gloss sweep across the product for a premium finish. */
const sheen = (d: string, quality: number) => (quality >= 6 ? path(d, '#ffffff', op(0.14)) : '');
/** A maxed-out line catches the light. */
const sparkle = (points: [number, number][], c: string, quality: number) =>
  quality >= 9 ? points.map(([x, y], i) => spark(x, y, i === 0 ? 2.4 : 1.6, i === 0 ? c : '#ffffff')).join('') : '';

const ART: Record<string, MerchArtDef> = {
  // T-shirt: folded flat, sleeves out, ribbed collar.
  tee: {
    print: { x: 17.5, y: 19, w: 13, h: 13 },
    draw: (p, s, q) =>
      shadow(15) +
      path('M18 10L24 13L30 10L40 15L36.5 22L33 20.5V41H15V20.5L11.5 22L8 15Z', s, stroke(K.ink, 0.9)) +
      path('M18 10L24 13L30 10L27.5 15.5H20.5Z', K.ink, op(0.35)) +
      line('M20.5 15.5Q24 17.5 27.5 15.5', p, 1.2) +
      piping('M15 41H33M15 24V40M33 24V40', p, q) +
      sheen('M15 20.5L23 20.5L15 41Z', q) +
      sparkle(
        [
          [34, 16],
          [13, 33],
        ],
        p,
        q,
      ),
  },

  // Snapback: six-panel dome, flat brim, button on top.
  cap: {
    print: { x: 17, y: 17, w: 14, h: 10 },
    draw: (p, s, q) =>
      shadow(15) +
      path('M11 31Q11 12 24 12Q37 12 37 31Z', s, stroke(K.ink, 0.9)) +
      path('M24 12Q37 12 37 31H31Q32 15 24 12Z', K.ink, op(0.3)) +
      circ(24, 11.5, 1.8, p) +
      path('M10 31H38Q43 31 43.5 35.5Q43 38 37 38H11Q9 35 10 31Z', p, stroke(K.ink, 0.8)) +
      rect(10.5, 29.5, 27, 2, K.ink, op(0.55)) +
      piping('M24 12V31M17 14.5Q15 22 15.5 31M31 14.5Q33 22 32.5 31', p, q) +
      sheen('M13 28Q14 15 24 13L20 29Z', q) +
      sparkle(
        [
          [35, 17],
          [41, 34],
        ],
        p,
        q,
      ),
  },

  // Mug: chunky ceramic, fat handle, a curl of steam.
  mug: {
    print: { x: 15.5, y: 19, w: 13, h: 13, round: 0.08 },
    draw: (p, s, q) =>
      shadow(13) +
      line('M20 11Q17.5 8 20 5M27 11Q24.5 8 27 5', K.greyL, 1.2, op(0.5)) +
      path('M31 20Q39 20 39 26.5Q39 33 31 33V30Q35.5 30 35.5 26.5Q35.5 23 31 23Z', p, stroke(K.ink, 0.8)) +
      rr(11, 14, 21, 28, 2.5, s, stroke(K.ink, 0.9)) +
      path('M11 14H32V17.5H11Z', K.white, op(0.85)) +
      ell(21.5, 14.4, 10.5, 1.8, K.white, op(0.9)) +
      piping('M12.5 39.5H30.5', p, q) +
      sheen('M13.5 17.5H17.5L15 41.5H13.5Z', q) +
      sparkle(
        [
          [33, 16],
          [12, 37],
        ],
        p,
        q,
      ),
  },

  // XXL mousepad: rolled at one end, stitched edge, mouse for scale.
  mousepad: {
    print: { x: 13, y: 22, w: 21, h: 12, round: 0.06 },
    draw: (p, s, q) =>
      shadow(17) +
      path('M6 36L13 19H43L36 36Z', s, stroke(K.ink, 0.9)) +
      path('M6 36L13 19L15 19L8 36Z', K.ink, op(0.3)) +
      line('M8.5 34.5L14.5 20.5H41L35 34.5Z', p, 0.8, op(q >= 3 ? 0.95 : 0.5)) +
      path('M36 36L43 19L45 21.5Q45.5 24 43.5 27L39 36Z', K.black2, stroke(K.ink, 0.8)) +
      ell(41.5, 22, 2.4, 3.4, K.black3) +
      path('M30 14Q30 11 32.5 11Q35 11 35 14V17.5Q32.5 19 30 17.5Z', K.greyL, stroke(K.ink, 0.7)) +
      line('M32.5 11.5V14', K.black3, 0.7) +
      sheen('M15 20.5H19L12.5 34.5H10Z', q) +
      sparkle(
        [
          [41, 32],
          [9, 22],
        ],
        p,
        q,
      ),
  },

  // Hoodie: hood up, kangaroo pocket, drawstrings.
  hoodie: {
    print: { x: 17.5, y: 21.5, w: 13, h: 11 },
    draw: (p, s, q) =>
      shadow(15) +
      path('M17 12L24 9L31 12L41 17L37 25L34 23.5V42H14V23.5L11 25L7 17Z', s, stroke(K.ink, 0.9)) +
      path('M17 12Q24 5 31 12Q28 17 24 17Q20 17 17 12Z', K.ink, op(0.42)) +
      line('M20.5 15.5V21M27.5 15.5V21', K.white, 1.1, op(0.8)) +
      circ(20.5, 21.6, 0.9, p) +
      circ(27.5, 21.6, 0.9, p) +
      path('M16 31H32V38H16Z', K.ink, op(0.22)) +
      line('M16 31H32M16 38H32', p, q >= 3 ? 1 : 0.7, op(0.8)) +
      piping('M14 42H34M14 26V41M34 26V41', p, q) +
      sheen('M14 24L21 24L14 42Z', q) +
      sparkle(
        [
          [35, 15],
          [12, 34],
        ],
        p,
        q,
      ),
  },

  // Poster: taped to the wall, corner curling.
  poster: {
    print: { x: 12.5, y: 10.5, w: 23, h: 27, round: 0.03 },
    draw: (p, s, q) =>
      rr(10, 8, 28, 32, 0.8, K.white, stroke(K.ink, 0.9)) +
      rect(11.5, 9.5, 25, 29, s, op(0.9)) +
      path('M38 34L32 40H38Z', '#dedbd2', stroke(K.ink, 0.6)) +
      path('M9 5.5L17 9L14.5 12.5L7 9Z', p, op(0.8)) +
      path('M39 5.5L31 9L33.5 12.5L41 9Z', p, op(0.8)) +
      piping('M11.5 9.5H36.5V38.5H11.5Z', p, q) +
      sheen('M13 9.5H19L13 38.5H11.5Z', q) +
      sparkle(
        [
          [37, 12],
          [11, 36],
        ],
        p,
        q,
      ),
  },

  // Keycap set: a tray of artisan caps, the centre one printed.
  keycaps: {
    print: { x: 17.5, y: 17.5, w: 13, h: 11, round: 0.12 },
    draw: (p, s, q) =>
      shadow(15) +
      rr(6, 12, 36, 26, 2, K.black2, stroke(K.ink, 0.9)) +
      grid2(9, 15, 3, 3, 8, 6, 2.5, 2, K.black3, stroke(K.ink, 0.5)) +
      rr(17, 16.5, 14, 13, 2, s, stroke(K.ink, 0.8)) +
      path('M17 16.5H31L28.5 19H19.5Z', K.white, op(0.16)) +
      circ(38, 33, 3.2, p, stroke(K.ink, 0.7)) +
      circ(38, 33, 1.3, K.ink, op(0.5)) +
      piping('M7.5 13.5H40.5V36.5H7.5Z', p, q) +
      sheen('M9 15H13L9 37H7.5Z', q) +
      sparkle(
        [
          [36, 16],
          [10, 34],
        ],
        p,
        q,
      ),
  },

  // Replica jersey: V-neck, sponsor bar, squad number.
  jersey: {
    print: { x: 17.5, y: 20, w: 13, h: 11 },
    draw: (p, s, q) =>
      shadow(15) +
      path('M18 10L24 14L30 10L40 15L36.5 22L33 20.5V41H15V20.5L11.5 22L8 15Z', s, stroke(K.ink, 0.9)) +
      path('M18 10L24 14L30 10L27 16H21Z', K.ink, op(0.4)) +
      path('M15 24H33V28H15Z', p, op(0.85)) +
      path('M15 33H33V35.5H15Z', K.ink, op(0.25)) +
      line('M21 36.5V40M24 36.5V40M27 36.5V40', K.white, 1.4, op(0.75)) +
      piping('M15 41H33M15 24V40M33 24V40', p, q) +
      sheen('M15 20.5L22 20.5L15 41Z', q) +
      sparkle(
        [
          [34, 16],
          [13, 34],
        ],
        p,
        q,
      ),
  },

  // Signature sneakers: side profile, chunky sole, printed panel.
  sneakers: {
    print: { x: 16.5, y: 20.5, w: 13, h: 9, rotate: -6, round: 0.1 },
    draw: (p, s, q) =>
      shadow(16) +
      path('M6 33Q6 22 12 19Q17 16.5 20 20L26 27Q30 30 38 31Q43 31.5 43 35H6Z', s, stroke(K.ink, 0.9)) +
      path('M5 35H43.5Q44 39.5 40 40H8.5Q4.5 39.5 5 35Z', K.white, stroke(K.ink, 0.8)) +
      rect(5.5, 37, 38, 1.2, p, op(0.85)) +
      path('M12 19Q17 16.5 20 20L16 24Q12.5 21.5 12 19Z', K.ink, op(0.3)) +
      line('M13.5 22.5L17.5 20.5M14.5 25.5L18.5 23.5M16 28.5L20 26.5', K.white, 0.9, op(0.8)) +
      path('M30 28.5Q35 31 41 31.5', p, `${stroke(p, 1.6)} fill="none" opacity="0.9"`) +
      piping('M6.5 34H42.5', p, q) +
      sheen('M9 24Q7.5 29 7.5 33H10Q10 28 12 24Z', q) +
      sparkle(
        [
          [37, 25],
          [9, 21],
        ],
        p,
        q,
      ),
  },

  // Player plushie: round mascot with a printed belly patch.
  plushie: {
    print: { x: 18, y: 24.5, w: 12, h: 10, round: 0.3 },
    draw: (p, s, q) =>
      shadow(13) +
      path('M14 14Q12 7 17 9Q20 10.5 21 12.5Q24 11.8 27 12.5Q28 10.5 31 9Q36 7 34 14Z', s, stroke(K.ink, 0.9)) +
      circ(24, 26, 14, s, stroke(K.ink, 0.9)) +
      ell(24, 29.5, 9.5, 8.5, K.white, op(0.14)) +
      circ(18.5, 21, 1.7, K.ink) +
      circ(29.5, 21, 1.7, K.ink) +
      circ(19.1, 20.4, 0.6, K.white) +
      circ(30.1, 20.4, 0.6, K.white) +
      path('M22 24.5Q24 26.5 26 24.5', 'none', `${stroke(K.ink, 1.1)} stroke-linecap="round"`) +
      circ(16, 15, 2, p, op(0.85)) +
      circ(32, 15, 2, p, op(0.85)) +
      piping('M13 32Q24 40 35 32', p, q) +
      sheen('M15 18Q11 24 12.5 31L16 29Q14.5 23 17.5 19Z', q) +
      sparkle(
        [
          [36, 14],
          [12, 36],
        ],
        p,
        q,
      ),
  },
};

export const MERCH_ART_IDS: string[] = Object.keys(ART);

export function hasMerchArt(id: string): boolean {
  return id in ART;
}

/** Where the player's design is printed on a product, as percentages for the preview overlay. */
export function merchPrintWindow(id: string): PrintWindow {
  return ART[id]?.print ?? { x: 16, y: 16, w: 16, h: 16 };
}

/** Inner SVG markup for one product in the org's colours at a finish quality. */
export function merchArtMarkup(id: string, primary: string, secondary: string, quality = 0): string {
  const def = ART[id];
  return def ? def.draw(primary, secondary, quality) : '';
}

/** A standalone 48x48 SVG, for product headers and tooltips. */
export function merchArtSvg(id: string, primary: string, secondary: string, quality = 0): string {
  return `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${merchArtMarkup(id, primary, secondary, quality)}</svg>`;
}
