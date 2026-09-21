import { K, circ, ell, f, line, op, path, rect, rr, shadow, spark, stroke } from './artKit';
import { mix, shade } from './color';

/**
 * Bespoke art for every merch product, drawn on the same 48x48 grid as the gear art.
 *
 * A product physically changes as its finish improves, the way gear does between tiers:
 *
 *   Q0  the basic item            (a blank tee, a diner mug, a taped-up print)
 *   Q2  a better-made item        (a ringer tee, a team mug, a framed print)
 *   Q4  the premium item          (a raglan crest tee, a metal tankard, a lightbox)
 *   Q6  holographic foil that sweeps with light
 *   Q7  a numbered limited-run hang tag
 *   Q8  signed in gold by your star, with a glow behind it
 *   Q9  presented in a velvet-lined collector's box
 *   Q10 under glass on a gold-plaqued plinth: the Hall of Fame edition
 *
 * In between, the finish shows on the item itself: contrast piping from Q3, woven texture and
 * visible stitching from Q5. Every product takes the org's two colours and reports where the
 * player's own design is printed, which the preview overlays on top.
 *
 * Output is built only from constants in this file and validated hex colours, so it is safe to
 * render with {@html}. Animations are SMIL, so they travel with the markup; pass `animate: false`
 * for small icons and reduced motion.
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

interface Ctx {
  /** Org primary and secondary, and lighter and darker versions of each. */
  p: string;
  s: string;
  pd: string;
  pl: string;
  sd: string;
  sl: string;
  q: number;
  anim: boolean;
  /** Unique prefix for this drawing's gradients, patterns and clips. */
  u: string;
  /** Extra <defs> a look needs. */
  defs: string[];
}

interface Look {
  name: string;
  /** The silhouette, for shading, texture and the foil sweep. May hold several subpaths. */
  body: string;
  draw: (c: Ctx) => string;
  /** Seams that take contrast piping from Q3 and visible stitching from Q5. */
  seams: string;
  print: PrintWindow;
  /** Where a limited-run hang tag hangs from. */
  tag: [number, number];
  /** Where the signature goes: left x, baseline y, width. */
  sign: [number, number, number];
}

interface Product {
  /** Q0-1, Q2-3 and Q4+. */
  looks: [Look, Look, Look];
}

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

const HEX = /^#[0-9a-f]{3,8}$/i;
const safe = (c: string, fallback: string) => (HEX.test(c.trim()) ? c.trim() : fallback);

/** A rounded rectangle as a path, so it can be used as a clip. */
const rrPath = (x: number, y: number, w: number, h: number, r: number) =>
  `M${f(x + r)} ${f(y)}H${f(x + w - r)}Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)}V${f(y + h - r)}Q${f(x + w)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)}H${f(x + r)}Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - r)}V${f(y + r)}Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)}Z`;
/** A circle as a path. */
const circPath = (cx: number, cy: number, r: number) => `M${f(cx - r)} ${f(cy)}A${r} ${r} 0 1 0 ${f(cx + r)} ${f(cy)}A${r} ${r} 0 1 0 ${f(cx - r)} ${f(cy)}Z`;

const outline = (w = 0.9) => stroke(K.ink, w);

/** Curls of steam that rise and fade, or sit still when the art is not animated. */
function steam(c: Ctx, xs: number[], y: number): string {
  return xs
    .map((x, i) => {
      const d = `M${x} ${y}q-2.4 -2.8 0 -5.6`;
      if (!c.anim) return line(d, K.greyL, 1.1, op(0.5));
      const begin = `${f(i * 0.9)}s`;
      return (
        `<path d="${d}" fill="none" stroke="${K.greyL}" stroke-width="1.1" stroke-linecap="round" opacity="0">` +
        `<animate attributeName="opacity" values="0;0.65;0" dur="2.6s" begin="${begin}" repeatCount="indefinite"/>` +
        `<animateTransform attributeName="transform" type="translate" values="0 1.5;0 -2.5" dur="2.6s" begin="${begin}" repeatCount="indefinite"/></path>`
      );
    })
    .join('');
}

/** A keycap: darker skirt, lighter dished top. */
const cap = (x: number, y: number, w: number, h: number, base: string, top: string) =>
  rr(x, y, w, h, 1.2, shade(base, -0.25), outline(0.55)) + rr(x + w * 0.14, y + h * 0.1, w * 0.72, h * 0.62, 1, top);

// Base silhouettes shared between looks.
const TEE = 'M18 10L24 13L30 10L40 15L36.5 22L33 20.5V41H15V20.5L11.5 22L8 15Z';
const TEE_CURVED = 'M18 10L24 13L30 10L40 15L36.5 22L33 20.5V39.5Q24 42.6 15 39.5V20.5L11.5 22L8 15Z';
const CREW = 'M18.6 10.3Q24 15.2 29.4 10.3Q24 12.6 18.6 10.3Z';
const HOODIE = 'M17 12L24 10L31 12L41 17L37 25L34 23.5V42H14V23.5L11 25L7 17Z';
const HOOD_UP = 'M16.6 13Q15.8 5.5 24 5Q32.2 5.5 31.4 13L28.6 17.4H19.4Z';
const HOOD_LINING = 'M19 13.4Q19 8 24 7.6Q29 8 29 13.4Q27.2 16.8 24 16.8Q20.8 16.8 19 13.4Z';
const HOOD_FACE = 'M19.9 13.4Q20 8.7 24 8.4Q28 8.7 28.1 13.4Q26.6 16 24 16Q21.4 16 19.9 13.4Z';
const JERSEY = 'M18 10L24 14L30 10L40 15L36.5 22L33 20.5V41H15V20.5L11.5 22L8 15Z';
const VNECK = 'M18 10L24 14.5L30 10L27.8 11.6L24 16.4L20.2 11.6Z';

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

const ART: Record<string, Product> = {
  tee: {
    looks: [
      {
        name: 'Blank tee',
        body: TEE,
        draw: (c) =>
          shadow(15) +
          path(TEE, c.s, outline()) +
          path(CREW, K.ink, op(0.4)) +
          line('M18.6 10.3Q24 15.2 29.4 10.3', c.sl, 0.8) +
          line('M20 26Q22 30 21 35M28 24Q27 29 29 33', K.ink, 0.5, op(0.18)),
        seams: 'M15 40.8H33M15 21V40.5M33 21V40.5',
        print: { x: 18.5, y: 19, w: 11, h: 11 },
        tag: [36.8, 21.6],
        sign: [17.5, 37, 13],
      },
      {
        name: 'Ringer tee',
        body: TEE,
        draw: (c) =>
          shadow(15) +
          path(TEE, c.s, outline()) +
          path(CREW, K.ink, op(0.4)) +
          line('M18.3 10.2Q24 15.6 29.7 10.2', c.p, 1.8) +
          path('M8 15L9.9 14.1L13.2 21.2L11.5 22Z', c.p) +
          path('M40 15L38.1 14.1L34.8 21.2L36.5 22Z', c.p) +
          rect(15, 39.1, 18, 1.9, c.p),
        seams: 'M15 21V39M33 21V39',
        print: { x: 18.5, y: 18.5, w: 11, h: 11 },
        tag: [36.8, 21.6],
        sign: [17.5, 37, 13],
      },
      {
        name: 'Raglan crest tee',
        body: TEE_CURVED,
        draw: (c) =>
          shadow(15) +
          path(TEE_CURVED, c.s, outline()) +
          path('M18 10L21.2 11.6L15 21L11.5 22L8 15Z', c.p, outline(0.6)) +
          path('M30 10L26.8 11.6L33 21L36.5 22L40 15Z', c.p, outline(0.6)) +
          line('M9.4 17.2L12.4 15.9M10.3 19L13.3 17.7', K.white, 0.7, op(0.85)) +
          line('M38.6 17.2L35.6 15.9M37.7 19L34.7 17.7', K.white, 0.7, op(0.85)) +
          path(CREW, K.ink, op(0.45)) +
          line('M18.3 10.2Q24 15.6 29.7 10.2', c.pd, 1.6) +
          path('M27.6 15.2H31.2V17.5Q31.2 19.2 29.4 19.9Q27.6 19.2 27.6 17.5Z', c.pd, stroke(K.gold, 0.45)) +
          circ(29.4, 17.3, 0.7, K.gold) +
          line('M15.2 38.6Q24 41.6 32.8 38.6', c.p, 1.2),
        seams: 'M21.2 11.6L15 21M26.8 11.6L33 21M15 22V38.6M33 22V38.6',
        print: { x: 17.5, y: 21, w: 11, h: 11 },
        tag: [36.8, 21.6],
        sign: [16.5, 36.6, 14],
      },
    ],
  },

  cap: {
    looks: [
      {
        name: 'Dad cap',
        body: 'M11.5 31Q12 17.5 24 17Q36 17.5 36.5 31Z',
        draw: (c) =>
          shadow(15) +
          path('M11.5 31Q12 17.5 24 17Q36 17.5 36.5 31Z', c.s, outline()) +
          path('M24 17Q36 17.5 36.5 31H31.5Q31.5 20 24 17Z', K.ink, op(0.22)) +
          circ(24, 17, 1.3, c.sd) +
          path('M9.5 31Q24 28 38.5 31Q40 34.5 36 36Q24 33.2 12 36Q8 34.5 9.5 31Z', c.sd, outline(0.8)) +
          line('M12 33.2Q24 30.6 36 33.2', K.white, 0.5, op(0.25)),
        seams: 'M24 17.2V31M18 18.5Q16.2 24 16.8 31',
        print: { x: 18.5, y: 21.5, w: 11, h: 7 },
        tag: [36.4, 30],
        sign: [18, 34.4, 12],
      },
      {
        name: 'Snapback',
        body: 'M11 31Q11 12 24 12Q37 12 37 31Z',
        draw: (c) =>
          shadow(15) +
          path('M11 31Q11 12 24 12Q37 12 37 31Z', c.s, outline()) +
          path('M24 12Q37 12 37 31H31Q32 15 24 12Z', K.ink, op(0.3)) +
          circ(24, 11.5, 1.8, c.p) +
          path('M10 31H38Q43 31 43.5 35.5Q43 38 37 38H11Q9 35 10 31Z', c.p, outline(0.8)) +
          rect(10.5, 29.5, 27, 2, K.ink, op(0.55)),
        seams: 'M24 12V31M17 14.5Q15 22 15.5 31M31 14.5Q33 22 32.5 31',
        print: { x: 17, y: 17, w: 14, h: 10 },
        tag: [37, 30],
        sign: [15, 36, 17],
      },
      {
        name: 'Pro fitted cap',
        body: 'M11 31Q11 12 24 12Q37 12 37 31Z',
        draw: (c) =>
          shadow(16) +
          path('M11 31Q11 12 24 12Q37 12 37 31Z', c.s, outline()) +
          path('M15.5 31Q15 16.5 24 12.4Q33 16.5 32.5 31Z', c.p, outline(0.5)) +
          path('M24 12Q37 12 37 31H32.5Q33 16.5 24 12.4Z', K.ink, op(0.28)) +
          circ(13.8, 20.5, 0.7, K.ink, op(0.6)) +
          circ(34.2, 20.5, 0.7, K.ink, op(0.6)) +
          circ(24, 11.6, 1.8, c.s, outline(0.5)) +
          path('M10 31H38Q43.5 31 44 35.5Q43.5 38.5 37 38.5H11Q8.5 35.5 10 31Z', c.sd, outline(0.8)) +
          line('M12 33.3H37.5Q41.2 33.4 41.6 35.6', K.white, 0.35, `stroke-dasharray="0.8 0.6" ${op(0.7)}`) +
          rect(10.5, 29.6, 27, 1.6, K.ink, op(0.55)) +
          circ(38, 35.2, 2, K.gold, stroke(K.goldD, 0.4)) +
          circ(38, 35.2, 1.1, 'none', stroke(K.goldD, 0.35)),
        seams: 'M24 12.4V31M15.5 31Q15 16.5 24 12.4M32.5 31Q33 16.5 24 12.4',
        print: { x: 18, y: 17.5, w: 12, h: 9 },
        tag: [37, 30],
        sign: [13, 36.3, 15],
      },
    ],
  },

  mug: {
    looks: [
      {
        name: 'Diner mug',
        body: rrPath(12, 15, 20, 27, 3),
        draw: (c) =>
          shadow(12) +
          path('M31 21Q38 21 38 27Q38 33 31 33V30.2Q35 30.2 35 27Q35 23.8 31 23.8Z', '#e9e6df', outline(0.8)) +
          rr(12, 15, 20, 27, 3, '#e9e6df', outline()) +
          rect(12, 18.3, 20, 2.4, c.s) +
          ell(22, 15.4, 10, 1.6, '#f7f5f0') +
          ell(22, 15.5, 8.6, 1.1, '#5b4636'),
        seams: 'M12.8 39.8H31.2',
        print: { x: 16, y: 23, w: 12, h: 12, round: 0.08 },
        tag: [37.6, 26],
        sign: [14.5, 39, 11],
      },
      {
        name: 'Team mug',
        body: rrPath(11, 14, 21, 28, 2.5),
        draw: (c) =>
          shadow(13) +
          steam(c, [20, 27], 11) +
          path('M31 20Q39 20 39 26.5Q39 33 31 33V30Q35.5 30 35.5 26.5Q35.5 23 31 23Z', c.p, outline(0.8)) +
          rr(11, 14, 21, 28, 2.5, c.s, outline()) +
          path('M11 14H32V17.5H11Z', K.white, op(0.85)) +
          ell(21.5, 14.4, 10.5, 1.8, K.white, op(0.9)) +
          ell(21.5, 14.5, 9, 1.1, c.pd),
        seams: 'M12.5 39.5H30.5',
        print: { x: 15.5, y: 19.5, w: 13, h: 13, round: 0.08 },
        tag: [37.8, 24],
        sign: [13.5, 39.4, 13],
      },
      {
        name: 'Gamer tankard',
        body: 'M11.5 12.5H33L32 41.5H12.5Z',
        draw: (c) =>
          shadow(14) +
          steam(c, [18.5, 25.5], 9) +
          path('M32.5 17Q41.5 17 41.5 25.5Q41.5 34 32.5 34V30.5Q38 30.5 38 25.5Q38 20.5 32.5 20.5Z', c.p, outline(0.8)) +
          path('M11.5 12.5H33L32 41.5H12.5Z', c.s, outline()) +
          line('M15.5 15V38M28.8 15V38', K.white, 0.6, op(0.2)) +
          ell(22.2, 11.4, 10.8, 1.5, c.pl) +
          rr(10.5, 11, 23.5, 3.4, 1, K.silver, outline(0.6)) +
          circ(14, 12.7, 0.5, K.silverD) +
          circ(22.2, 12.7, 0.5, K.silverD) +
          circ(30.4, 12.7, 0.5, K.silverD) +
          rr(11.3, 37.8, 21.9, 3.8, 1, K.silver, outline(0.6)) +
          line('M12 39.7H32.4', K.silverD, 0.5) +
          path('M33 11.2L36.6 7.6L38.1 8.9L35 12.3Z', K.silverD, outline(0.5)),
        seams: 'M12.3 15V37.5M32.3 15V37.5',
        print: { x: 15, y: 17, w: 14, h: 18, round: 0.04 },
        tag: [40.6, 29.5],
        sign: [14.5, 35.6, 14],
      },
    ],
  },

  mousepad: {
    looks: [
      {
        name: 'Basic pad',
        body: 'M9 35L14 22H38L33 35Z',
        draw: (c) =>
          shadow(14) +
          path('M9 35H33V36.3H9Z', c.sd) +
          path('M33 35L38 22V23.3L33 36.3Z', K.ink, op(0.4)) +
          path('M9 35L14 22H38L33 35Z', c.s, outline()) +
          path('M28.5 17.5Q28.5 14.5 31 14.5Q33.5 14.5 33.5 17.5V21Q31 22.5 28.5 21Z', K.greyL, outline(0.7)) +
          line('M31 14.9V17.4', K.black3, 0.6),
        seams: 'M10.8 33.8L15.1 23.2H36.2L31.9 33.8Z',
        print: { x: 15.5, y: 24.5, w: 16, h: 8, round: 0.06 },
        tag: [38.2, 23],
        sign: [12, 33.2, 12],
      },
      {
        name: 'XXL desk mat',
        body: 'M6 36L13 19H43L36 36Z',
        draw: (c) =>
          shadow(17) +
          path('M6 36L13 19H43L36 36Z', c.s, outline()) +
          path('M6 36L13 19L15 19L8 36Z', K.ink, op(0.3)) +
          line('M8.5 34.5L14.5 20.5H41L35 34.5Z', c.p, 0.8, op(0.55)) +
          path('M36 36L43 19L45 21.5Q45.5 24 43.5 27L39 36Z', K.black2, outline(0.8)) +
          ell(41.5, 22, 2.4, 3.4, K.black3) +
          path('M30 14Q30 11 32.5 11Q35 11 35 14V17.5Q32.5 19 30 17.5Z', K.greyL, outline(0.7)) +
          line('M32.5 11.5V14', K.black3, 0.7),
        seams: 'M8.5 34.5L14.5 20.5H41L35 34.5Z',
        print: { x: 13, y: 22, w: 21, h: 12, round: 0.06 },
        tag: [43.5, 22],
        sign: [9.5, 33.4, 13],
      },
      {
        name: 'RGB desk mat',
        body: 'M5 34L12 18H44L37 34Z',
        draw: (c) => {
          const flow = c.anim
            ? `<animateTransform attributeName="gradientTransform" type="translate" values="0 0;1 0" dur="3s" repeatCount="indefinite"/>`
            : '';
          c.defs.push(
            `<linearGradient id="${c.u}-rgb" x1="0" y1="0" x2="1" y2="0" spreadMethod="repeat">` +
              ['#ff3b5c', '#ffb13b', '#5bff7a', '#3bd8ff', '#8b5cff', '#ff3bd1', '#ff3b5c']
                .map((col, i) => `<stop offset="${f(i / 6)}" stop-color="${col}"/>`)
                .join('') +
              `${flow}</linearGradient>`,
          );
          return (
            shadow(18) +
            path('M5 34H37V36.4H5Z', K.black2) +
            path('M37 34L44 18V20.4L37 36.4Z', K.black) +
            path('M5 34L12 18H44L37 34Z', 'none', `stroke="url(#${c.u}-rgb)" stroke-width="3.2" ${op(0.35)}`) +
            path('M5 34L12 18H44L37 34Z', c.s, outline(0.8)) +
            path('M5 34L12 18H44L37 34Z', 'none', `stroke="url(#${c.u}-rgb)" stroke-width="1.1"`) +
            line('M44 18.6Q46.4 14 44.6 9.5', K.black3, 0.8) +
            path('M31 12Q31 9 33.5 9Q36 9 36 12V16Q33.5 17.6 31 16Z', K.black2, outline(0.7)) +
            line('M33.5 9.4V12', `url(#${c.u}-rgb)`, 0.7) +
            rr(31.6, 13.6, 3.8, 0.8, 0.4, `url(#${c.u}-rgb)`)
          );
        },
        seams: 'M7.6 32.6L13.2 19.4H41.4L35.8 32.6Z',
        print: { x: 13.5, y: 21, w: 21, h: 10, round: 0.05 },
        tag: [44, 19],
        sign: [8.5, 31.6, 13],
      },
    ],
  },

  hoodie: {
    looks: [
      {
        name: 'Pullover hoodie',
        body: HOODIE,
        draw: (c) =>
          shadow(15) +
          path(HOODIE, c.s, outline()) +
          path('M16.8 12.2Q24 6.8 31.2 12.2Q28.5 16 24 16Q19.5 16 16.8 12.2Z', c.sd, outline(0.6)) +
          path('M19.5 12.6Q24 15.2 28.5 12.6Q24 13.6 19.5 12.6Z', K.ink, op(0.45)) +
          line('M21.5 14.6V20M26.5 14.6V20', K.white, 1, op(0.75)) +
          path('M16.5 31.5H31.5L30 38H18Z', K.ink, op(0.18)) +
          rect(14, 39.8, 20, 2.2, c.sd),
        seams: 'M14 39.8H34M14 26V39.5M34 26V39.5',
        print: { x: 17.5, y: 20.5, w: 13, h: 9.5 },
        tag: [37.2, 24.6],
        sign: [18, 36.4, 12],
      },
      {
        name: 'Zip hoodie',
        body: `${HOODIE} ${HOOD_UP}`,
        draw: (c) =>
          shadow(15) +
          path(HOODIE, c.s, outline()) +
          path(HOOD_UP, c.s, outline()) +
          path(HOOD_LINING, c.p) +
          path(HOOD_FACE, K.ink, op(0.78)) + path('M20.4 10.6Q24 8.2 27.6 10.6Q24 9.6 20.4 10.6Z', K.white, op(0.12)) +
          line('M24 16.6V42', K.silverD, 1.1) +
          line('M24 16.6V42', K.silver, 0.45) +
          rr(23.2, 19, 1.6, 3, 0.5, K.silver, outline(0.3)) +
          line('M21.2 15.8V21.5M26.8 15.8V21.5', K.white, 0.9, op(0.85)) +
          rect(20.7, 21.2, 1, 1.6, K.silver) +
          rect(26.3, 21.2, 1, 1.6, K.silver) +
          path('M15.5 31H22.3L21.6 38.5H15.5Z', K.ink, op(0.18)) +
          path('M32.5 31H25.7L26.4 38.5H32.5Z', K.ink, op(0.18)) +
          rect(14, 39.8, 20, 2.2, c.p) +
          path('M7 17L8.6 16.2L12.4 24.2L11 25Z', c.p) +
          path('M41 17L39.4 16.2L35.6 24.2L37 25Z', c.p),
        seams: 'M14 26V39.5M34 26V39.5',
        print: { x: 26, y: 22.5, w: 7, h: 7 },
        tag: [37.2, 24.6],
        sign: [15.6, 29, 7.5],
      },
      {
        name: 'Tech fleece',
        body: `${HOODIE} ${HOOD_UP}`,
        draw: (c) =>
          shadow(16) +
          path(HOODIE, c.s, outline()) +
          path('M14 25V40H16.6V24.2Z', c.sd) +
          path('M34 25V40H31.4V24.2Z', c.sd) +
          path('M16.8 12.3L7 17L8.3 19.6Q16 16.6 24 17.8Q32 16.6 39.7 19.6L41 17L31.2 12.3Q28 16.6 24 16.6Q20 16.6 16.8 12.3Z', c.p, outline(0.5)) +
          path(HOOD_UP, c.sd, outline()) +
          path(HOOD_LINING, c.p) +
          path(HOOD_FACE, K.ink, op(0.78)) + path('M20.4 10.6Q24 8.2 27.6 10.6Q24 9.6 20.4 10.6Z', K.white, op(0.12)) +
          line('M24 16.8V26.5', K.silverD, 1.1) +
          line('M24 16.8V26.5', K.silver, 0.45) +
          rr(23.2, 24.4, 1.6, 3, 0.5, K.silver, outline(0.3)) +
          line('M9.6 21.4L12.8 19.8M38.4 21.4L35.2 19.8', K.white, 0.8, op(0.8)) +
          circ(10.2, 23.8, 0.6, K.ink, op(0.6)) +
          circ(37.8, 23.8, 0.6, K.ink, op(0.6)) +
          rect(14, 40, 20, 2, c.p),
        seams: 'M16.8 12.3Q20 16.6 24 16.6Q28 16.6 31.2 12.3M8.3 19.6Q16 16.6 24 17.8Q32 16.6 39.7 19.6',
        print: { x: 18, y: 28, w: 12, h: 10 },
        tag: [37.2, 24.6],
        sign: [26.2, 25.4, 6.5],
      },
    ],
  },

  poster: {
    looks: [
      {
        name: 'Taped print',
        body: 'M11 9H37V40H11Z',
        draw: (c) =>
          rr(11, 9, 26, 31, 0.6, K.white, outline()) +
          rect(12.5, 10.5, 23, 28, c.s, op(0.92)) +
          path('M37 34L31.5 40H37Z', '#dedbd2', outline(0.6)) +
          path('M9.5 6.5L16.5 9.5L14.5 12.4L7.5 9.4Z', '#e8dca8', op(0.85)) +
          path('M38.5 6.5L31.5 9.5L33.5 12.4L40.5 9.4Z', '#e8dca8', op(0.85)),
        seams: 'M12.5 10.5H35.5V38.5H12.5Z',
        print: { x: 13.5, y: 11.5, w: 21, h: 23, round: 0.02 },
        tag: [37, 12],
        sign: [22, 36.8, 10],
      },
      {
        name: 'Framed print',
        body: 'M9 7H39V42H9Z',
        draw: (c) =>
          shadow(15, 44.2) +
          line('M16 8L24 3.4L32 8', K.greyL, 0.5) +
          circ(24, 3.2, 0.9, K.silverD) +
          rr(9, 7, 30, 35, 1.2, K.black, outline()) +
          rect(10.3, 8.3, 27.4, 32.4, K.black3) +
          rect(11.3, 9.3, 25.4, 30.4, K.white) +
          rect(13.5, 11.5, 21, 26, c.s) +
          line('M9.6 7.6H38.4', K.white, 0.4, op(0.35)),
        seams: 'M11.3 9.3H36.7V39.7H11.3Z',
        print: { x: 14, y: 12, w: 20, h: 25 },
        tag: [39, 10],
        sign: [23.5, 39.2, 10],
      },
      {
        name: 'Lightbox',
        body: 'M10.5 8.5H37.5V40.5H10.5Z',
        draw: (c) => {
          const pulse = c.anim ? `<animate attributeName="opacity" values="0.14;0.34;0.14" dur="3.4s" repeatCount="indefinite"/>` : '';
          return (
            `<rect x="4.5" y="2.5" width="39" height="43" rx="6" fill="${c.p}" opacity="0.2">${pulse}</rect>` +
            shadow(15, 45) +
            line('M24 43.5Q24 46.2 28.5 46.6', K.black3, 0.7) +
            rr(7.5, 5.5, 33, 38, 2.2, K.black2, outline()) +
            rr(9.5, 7.5, 29, 34, 1.2, 'none', `stroke="${c.pl}" stroke-width="2.6" ${op(0.35)}`) +
            rect(10.5, 8.5, 27, 32, c.s) +
            rr(9.5, 7.5, 29, 34, 1.2, 'none', `stroke="${c.pl}" stroke-width="1"`) +
            line('M8.2 6.2H39.8', K.white, 0.4, op(0.3))
          );
        },
        seams: 'M9.5 7.5H38.5V41.5H9.5Z',
        print: { x: 12, y: 10, w: 24, h: 26 },
        tag: [40.5, 10],
        sign: [23.5, 39, 11],
      },
    ],
  },

  keycaps: {
    looks: [
      {
        name: 'Bagged caps',
        body: rrPath(16.5, 15.5, 15, 14, 1.2),
        draw: (c) =>
          shadow(16) +
          cap(8, 25, 9, 9, c.sd, c.s) +
          cap(31, 26, 9, 9, K.black3, K.greyD) +
          cap(16.5, 15.5, 15, 14, c.s, c.sl) +
          rr(6, 10, 36, 30, 2.2, K.white, `fill-opacity="0.07" ${stroke(K.white, 0.4)} stroke-opacity="0.45"`) +
          line('M6.6 13H41.4', K.white, 0.6, op(0.45)) +
          path('M8 12L14 12L9 22Z', K.white, op(0.12)),
        seams: 'M16.5 29.5H31.5',
        print: { x: 18.8, y: 17, w: 10.4, h: 8.4, round: 0.12 },
        tag: [41.5, 12],
        sign: [15, 37.6, 18],
      },
      {
        name: 'Keycap set',
        body: rrPath(6, 12, 36, 26, 2),
        draw: (c) =>
          shadow(15) +
          rr(6, 12, 36, 26, 2, K.black2, outline()) +
          [0, 1, 2]
            .map((r) => [0, 1, 2].map((k) => cap(9 + k * 10.5, 15 + r * 8, 8, 6, K.black3, K.greyD)).join(''))
            .join('') +
          cap(17, 16.5, 14, 13, c.s, c.sl) +
          circ(38, 33, 3.2, c.p, outline(0.7)) +
          circ(38, 33, 1.3, K.ink, op(0.5)),
        seams: 'M7.5 13.5H40.5V36.5H7.5Z',
        print: { x: 19, y: 17.8, w: 10, h: 8, round: 0.12 },
        tag: [42, 14],
        sign: [9.5, 36.2, 13],
      },
      {
        name: 'Artisan set',
        body: rrPath(5, 13, 38, 26, 2.4),
        draw: (c) => {
          const spin = c.anim
            ? `<animateTransform attributeName="transform" type="rotate" values="0 37.5 33.6;360 37.5 33.6" dur="8s" repeatCount="indefinite"/>`
            : '';
          const caps = [0, 1, 2]
            .map((r) =>
              [0, 1, 2, 3]
                .map((k) => {
                  const col = mix(c.s, c.p, r / 2);
                  return cap(7.5 + k * 8.5, 15.5 + r * 7.2, 7, 5.8, col, shade(col, 0.2));
                })
                .join(''),
            )
            .join('');
          return (
            shadow(16) +
            rr(5, 13, 38, 26, 2.4, K.black, outline()) +
            rr(6.5, 14.5, 35, 23, 1.8, '#232329') +
            caps +
            cap(16, 15.5, 16, 13.5, c.pd, c.p) +
            circ(37.5, 33.6, 5.2, c.p, op(0.22)) +
            circ(37.5, 33.6, 4.2, '#bfe9ff', `${op(0.4)} ${stroke(K.white, 0.4)}`) +
            circ(37.5, 33.6, 1.8, c.p) +
            `<g>${ell(37.5, 33.6, 3.2, 0.9, 'none', stroke(c.pl, 0.5))}${spin}</g>` +
            path('M35 31Q36.5 30 38 30.4', 'none', `${stroke(K.white, 0.6)} stroke-linecap="round" ${op(0.8)}`)
          );
        },
        seams: 'M6.5 14.5H41.5V37.5H6.5Z',
        print: { x: 18.2, y: 17, w: 11.6, h: 8.2, round: 0.12 },
        tag: [43, 15],
        sign: [8, 37.3, 14],
      },
    ],
  },

  jersey: {
    looks: [
      {
        name: 'Practice jersey',
        body: JERSEY,
        draw: (c) => shadow(15) + path(JERSEY, c.s, outline()) + path(VNECK, K.ink, op(0.35)) + line('M20 26Q22 31 21 36M28 24Q27 30 29 34', K.ink, 0.5, op(0.16)),
        seams: 'M15 40.8H33',
        print: { x: 17.5, y: 19.5, w: 13, h: 11 },
        tag: [36.8, 21.6],
        sign: [17, 37.4, 14],
      },
      {
        name: 'Replica jersey',
        body: JERSEY,
        draw: (c) =>
          shadow(15) +
          path(JERSEY, c.s, outline()) +
          path(VNECK, K.ink, op(0.35)) +
          line('M18.4 10.3L24 14.6L29.6 10.3', c.p, 1.4) +
          rect(15, 32.2, 18, 3.4, c.p, op(0.9)) +
          line('M18 33.9H30', K.white, 0.8, op(0.7)) +
          line('M9.8 16L13.3 14.2M10.8 18L14.3 16.2', c.p, 0.9) +
          line('M38.2 16L34.7 14.2M37.2 18L33.7 16.2', c.p, 0.9),
        seams: 'M15 21V40.5M33 21V40.5M15 40.8H33',
        print: { x: 18, y: 18.5, w: 12, h: 12 },
        tag: [36.8, 21.6],
        sign: [17.5, 39.2, 13],
      },
      {
        name: 'Pro match kit',
        body: JERSEY,
        draw: (c) => {
          c.defs.push(
            `<pattern id="${c.u}-dg" width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="1.3" height="3.2" fill="${c.sd}" opacity="0.55"/></pattern>`,
          );
          return (
            shadow(16) +
            path(JERSEY, c.s, outline()) +
            path(JERSEY, `url(#${c.u}-dg)`) +
            path('M15 22V40H17.2V22.8Z', c.sd) +
            path('M33 22V40H30.8V22.8Z', c.sd) +
            path('M18 10L8 15L9.7 18.4L20.6 13.2Z', c.p, outline(0.5)) +
            path('M30 10L40 15L38.3 18.4L27.4 13.2Z', c.p, outline(0.5)) +
            path(VNECK, K.ink, op(0.4)) +
            line('M18.4 10.3L24 14.6L29.6 10.3', c.pd, 1.5) +
            line('M18.4 10.3L24 14.6L29.6 10.3', K.gold, 0.45) +
            rr(10.2, 19, 3, 2.2, 0.4, K.white, 'transform="rotate(-25 11.7 20.1)"') +
            rr(34.8, 19, 3, 2.2, 0.4, K.gold, 'transform="rotate(25 36.3 20.1)"') +
            `<text x="24" y="39.4" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="7" fill="${c.p}" stroke="${K.gold}" stroke-width="0.35">10</text>`
          );
        },
        seams: 'M20.6 13.2L9.7 18.4M27.4 13.2L38.3 18.4M17.2 22.8V40M30.8 22.8V40',
        print: { x: 18, y: 17.5, w: 12, h: 12 },
        tag: [36.8, 21.6],
        sign: [17, 35.6, 14],
      },
    ],
  },

  sneakers: {
    looks: [
      {
        name: 'Canvas lows',
        body: 'M7 34.5Q7 27 12.5 25.8Q17 25 20 27.4L25.5 30.6Q31 32.2 38 32.8Q42.5 33.2 42.5 35H7Z',
        draw: (c) =>
          shadow(16) +
          path('M7 34.5Q7 27 12.5 25.8Q17 25 20 27.4L25.5 30.6Q31 32.2 38 32.8Q42.5 33.2 42.5 35H7Z', c.s, outline()) +
          path('M36 32.6Q42.5 33 42.5 35H35Q35 33.6 36 32.6Z', K.white, outline(0.5)) +
          path('M6.2 35H43.2V37.6Q43.2 38.8 41.8 38.8H7.6Q6.2 38.8 6.2 37.6Z', K.white, outline(0.8)) +
          line('M6.6 36.6H42.8', K.greyL, 0.6) +
          line('M18 27.5L21.5 28.9M20 29.4L23.5 30.6M22.3 30.8L25.6 31.9', K.white, 0.9),
        seams: 'M7.2 34.2H42.3',
        print: { x: 9.5, y: 28.5, w: 8, h: 4.8, rotate: -3, round: 0.1 },
        tag: [8, 28],
        sign: [26.5, 34.2, 9],
      },
      {
        name: 'Court sneakers',
        body: 'M6 33Q6 22 12 19Q17 16.5 20 20L26 27Q30 30 38 31Q43 31.5 43 35H6Z',
        draw: (c) =>
          shadow(16) +
          path('M6 33Q6 22 12 19Q17 16.5 20 20L26 27Q30 30 38 31Q43 31.5 43 35H6Z', c.s, outline()) +
          path('M5 35H43.5Q44 39.5 40 40H8.5Q4.5 39.5 5 35Z', K.white, outline(0.8)) +
          rect(5.5, 37, 38, 1.2, c.p, op(0.85)) +
          path('M12 19Q17 16.5 20 20L16 24Q12.5 21.5 12 19Z', K.ink, op(0.3)) +
          line('M13.5 22.5L17.5 20.5M14.5 25.5L18.5 23.5M16 28.5L20 26.5', K.white, 0.9, op(0.8)) +
          path('M30 28.5Q35 31 41 31.5', 'none', `${stroke(c.p, 1.6)} ${op(0.9)}`),
        seams: 'M6.5 34H42.5',
        print: { x: 19, y: 25, w: 10, h: 6.5, rotate: -6, round: 0.1 },
        tag: [7, 22],
        sign: [28, 33.4, 11],
      },
      {
        name: 'Signature high-tops',
        body: 'M8 33.5Q7 17 11 12.8Q15 10.4 20.5 12.2L21.5 21.5Q24.5 27.5 31 29.6Q42.5 31 43.5 34.5H8Z',
        draw: (c) => {
          const bubble = c.anim
            ? `<animate attributeName="x" values="29.8;35.6;29.8" dur="2.8s" repeatCount="indefinite"/>`
            : '';
          return (
            shadow(17) +
            path('M8 33.5Q7 17 11 12.8Q15 10.4 20.5 12.2L21.5 21.5Q24.5 27.5 31 29.6Q42.5 31 43.5 34.5H8Z', c.s, outline()) +
            path('M11 12.8Q15 10.4 20.5 12.2L20.8 14.6Q15.5 13 11.4 15Z', c.sd) +
            path('M13.6 31.8Q25 31.6 35.6 27.8Q30 33 16 33.4Z', c.p) +
            path('M8.2 16.8Q6.5 18 7.1 23L9.1 22.1Q8.7 18.8 9.5 17.5Z', c.p, outline(0.5)) +
            path('M10.2 19.6L21.4 17.8L21.8 21.6L10.6 23.8Z', c.p, outline(0.6)) +
            circ(20.3, 19.8, 0.6, K.silver) +
            line('M21 22.4L24 24.4M22.6 25.2L25.6 26.8M24.5 27.5L27.4 28.8', K.white, 0.9) +
            path('M7 34.5H44Q44.6 40 40.5 40.6H9.5Q6.4 40 7 34.5Z', K.white, outline(0.8)) +
            rect(7.3, 37.2, 36.5, 1.1, c.p, op(0.85)) +
            rr(29, 35.2, 9.5, 3, 1.5, '#9ee8ff', outline(0.4)) +
            `<rect x="29.8" y="35.7" width="2.4" height="1.6" rx="0.8" fill="#ffffff" opacity="0.75">${bubble}</rect>`
          );
        },
        seams: 'M8.2 33.6H43M10.2 19.6L21.4 17.8',
        print: { x: 11.5, y: 24.5, w: 9, h: 5.8, rotate: -6, round: 0.1 },
        tag: [8.4, 14.5],
        sign: [23.5, 33.3, 12],
      },
    ],
  },

  plushie: {
    looks: [
      {
        name: 'Bean plush',
        body: circPath(24, 27, 14),
        draw: (c) =>
          shadow(12) +
          circ(24, 27, 14, c.s, outline()) +
          line('M24 13.2V17', K.ink, 0.5, op(0.35)) +
          circ(19, 24, 1.8, K.ink) +
          circ(29, 24, 1.8, K.ink) +
          circ(19.6, 23.4, 0.55, K.white) +
          circ(29.6, 23.4, 0.55, K.white) +
          line('M21.5 29Q24 31 26.5 29', K.ink, 0.9),
        seams: 'M11.5 31Q24 38 36.5 31',
        print: { x: 19.5, y: 31, w: 9, h: 6, round: 0.3 },
        tag: [36.5, 20],
        sign: [16.5, 38.6, 15],
      },
      {
        name: 'Team plush',
        body: `${circPath(24, 26, 14)} M14 14Q12 7 17 9Q20 10.5 21 12.5Q24 11.8 27 12.5Q28 10.5 31 9Q36 7 34 14Z`,
        draw: (c) =>
          shadow(13) +
          path('M14 14Q12 7 17 9Q20 10.5 21 12.5Q24 11.8 27 12.5Q28 10.5 31 9Q36 7 34 14Z', c.s, outline()) +
          circ(24, 26, 14, c.s, outline()) +
          ell(24, 29.5, 9.5, 8.5, K.white, op(0.14)) +
          circ(18.5, 21, 1.7, K.ink) +
          circ(29.5, 21, 1.7, K.ink) +
          circ(19.1, 20.4, 0.6, K.white) +
          circ(30.1, 20.4, 0.6, K.white) +
          path('M22 24.5Q24 26.5 26 24.5', 'none', `${stroke(K.ink, 1.1)} stroke-linecap="round"`) +
          circ(16, 15, 2, c.p, op(0.85)) +
          circ(32, 15, 2, c.p, op(0.85)),
        seams: 'M13 32Q24 40 35 32',
        print: { x: 18, y: 27, w: 12, h: 8.5, round: 0.3 },
        tag: [37, 18],
        sign: [16, 38.6, 16],
      },
      {
        name: 'Pro gamer plush',
        body: `${circPath(24, 26.5, 15.2)} M13.5 16L12 6.5L20.5 12Z M34.5 16L36 6.5L27.5 12Z`,
        draw: (c) => {
          // A fuzzy edge: little bumps all round the body, outlined, then the body over them.
          const bumps = Array.from({ length: 30 }, (_, i) => {
            const a = (i / 30) * Math.PI * 2;
            return circ(24 + Math.cos(a) * 14.4, 26.5 + Math.sin(a) * 14.4, 1.5, c.s, outline(0.7));
          }).join('');
          return (
            shadow(15) +
            path('M13.5 16L12 6.5L20.5 12Z', c.s, outline()) +
            path('M34.5 16L36 6.5L27.5 12Z', c.s, outline()) +
            path('M14.4 13.8L13.6 8.9L18 12.1Z', c.p) +
            path('M33.6 13.8L34.4 8.9L30 12.1Z', c.p) +
            bumps +
            circ(24, 26.5, 14.2, c.s) +
            line('M11.5 22Q11 9.5 24 9.2Q37 9.5 36.5 22', K.ink, 2.8) +
            line('M11.5 22Q11 9.5 24 9.2Q37 9.5 36.5 22', c.pd, 1.8) +
            rr(8.8, 20, 5.2, 8, 2.2, c.p, outline(0.6)) +
            rr(34, 20, 5.2, 8, 2.2, c.p, outline(0.6)) +
            line('M11.2 27Q13 31.6 18.4 31.2', K.black2, 0.9) +
            circ(18.8, 31.1, 0.9, K.black3) +
            circ(19, 24, 2.3, K.ink) +
            circ(29, 24, 2.3, K.ink) +
            circ(19.8, 23.1, 0.8, K.white) +
            circ(29.8, 23.1, 0.8, K.white) +
            circ(18.4, 24.8, 0.35, K.white) +
            circ(28.4, 24.8, 0.35, K.white) +
            ell(15.8, 28, 1.9, 1.1, '#ff7aa8', op(0.55)) +
            ell(32.2, 28, 1.9, 1.1, '#ff7aa8', op(0.55)) +
            path('M22.4 27.6Q24 29.2 25.6 27.6', 'none', `${stroke(K.ink, 0.9)} stroke-linecap="round"`) +
            ell(17.4, 38.2, 2.6, 2, c.s, outline(0.5)) +
            ell(30.6, 38.2, 2.6, 2, c.s, outline(0.5)) +
            rr(18.2, 35.8, 11.6, 4.8, 2.3, K.black2, outline(0.6)) +
            line('M20.2 38.2H22M21.1 37.3V39.1', K.white, 0.5, op(0.8)) +
            circ(26.6, 37.6, 0.6, c.p) +
            circ(27.9, 38.7, 0.6, c.pl)
          );
        },
        seams: 'M12.5 33Q24 41 35.5 33',
        print: { x: 19.5, y: 29.8, w: 9, h: 5.4, round: 0.25 },
        tag: [38, 17],
        sign: [26.5, 34, 8],
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Finish layers
// ---------------------------------------------------------------------------

/** Which of a product's three looks a finish level uses. */
export function lookIndex(quality: number): number {
  return quality >= 4 ? 2 : quality >= 2 ? 1 : 0;
}

/** Collector's box at Q9 and the display case at Q10 shrink the product to fit inside. */
function presentation(q: number): { tx: number; ty: number; k: number } | null {
  if (q >= 10) return { tx: 8.4, ty: 5.2, k: 0.65 };
  if (q >= 9) return { tx: 4.8, ty: 2.2, k: 0.8 };
  return null;
}

/** A gold signature, written on stroke by stroke when animated. */
const SIGNATURE = 'M0 3.2C1.2 0.4 2.2 0 2.6 1.6S2.4 4.6 3.8 3.1S5.6 0.2 6.4 1.4S6.6 4 8 3S9.6 0.8 10.6 1.9S11.4 3.6 13 2.6S15.5 1.2 17 2.2';

function signature(c: Ctx, [x, y, w]: [number, number, number]): string {
  const k = w / 17;
  const at = `transform="translate(${f(x)} ${f(y - 3.2 * k)}) scale(${f(k)})"`;
  const write = c.anim ? `<animate attributeName="stroke-dashoffset" values="1;0" dur="1.3s" fill="freeze"/>` : '';
  return (
    `<path d="${SIGNATURE}" ${at} fill="none" stroke="${K.ink}" stroke-width="${f(1.7 / k)}" stroke-linecap="round" stroke-linejoin="round" opacity="0.35"/>` +
    `<path d="${SIGNATURE}" ${at} fill="none" stroke="url(#${c.u}-gd)" stroke-width="${f(0.95 / k)}" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="0">${write}</path>`
  );
}

function hangTag(c: Ctx, [x, y]: [number, number]): string {
  return (
    line(`M${f(x)} ${f(y)}Q${f(x + 1.4)} ${f(y + 1.2)} ${f(x + 1.6)} ${f(y + 3)}`, '#d9d6cf', 0.45) +
    `<g transform="translate(${f(x + 0.4)} ${f(y + 2.8)}) rotate(14)">` +
    rr(0, 0, 5.4, 7.4, 0.9, `url(#${c.u}-gd)`, outline(0.4)) +
    circ(2.7, 1.3, 0.55, K.ink) +
    `<text x="2.7" y="5.6" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="2.2" fill="${K.ink}">LTD</text></g>`
  );
}

/** Holographic foil that shifts colour, and a band of light that sweeps across now and then. */
function foil(c: Ctx, look: Look): string {
  const sweep = c.anim
    ? `<rect x="-18" y="-6" width="9" height="60" fill="url(#${c.u}-sw)" transform="skewX(-20)"><animate attributeName="x" values="-18;-18;62" keyTimes="0;0.55;1" dur="4.2s" repeatCount="indefinite"/></rect>`
    : `<rect x="16" y="-6" width="9" height="60" fill="url(#${c.u}-sw)" transform="skewX(-20)" opacity="0.5"/>`;
  return `<path d="${look.body}" fill="url(#${c.u}-ho)" opacity="0.3" style="mix-blend-mode:screen"/><g clip-path="url(#${c.u}-cl)">${sweep}</g>`;
}

function twinkle(c: Ctx, x: number, y: number, size: number, color: string, delay: number): string {
  const star = spark(0, 0, size, color);
  if (!c.anim) return `<g transform="translate(${x} ${y})">${star}</g>`;
  return (
    `<g transform="translate(${x} ${y})"><g transform="scale(0)">${star}` +
    `<animateTransform attributeName="transform" type="scale" values="0;1;0;0" keyTimes="0;0.18;0.36;1" dur="2.8s" begin="${f(delay)}s" repeatCount="indefinite"/></g></g>`
  );
}

function sparkles(c: Ctx): string {
  const spots: [number, number, number, string, number][] =
    c.q >= 10
      ? [
          [6, 10, 1.8, K.white, 0],
          [42, 7.5, 2.3, K.gold, 0.7],
          [43, 27, 1.5, K.white, 1.4],
          [5, 30, 1.4, K.gold, 2.1],
        ]
      : c.q >= 9
        ? [
            [40, 8, 2.1, c.p, 0],
            [8, 7, 1.5, K.white, 1],
            [44, 30, 1.3, K.gold, 1.9],
          ]
        : [
            [38.5, 9.5, 2.1, c.p, 0],
            [9.5, 33, 1.5, K.white, 1.2],
          ];
  return spots.map(([x, y, s, col, d]) => twinkle(c, x, y, s, col, d)).join('');
}

/** The open collector's box: lid leaning back, velvet inside. Drawn behind the product. */
function boxBack(c: Ctx): string {
  const velvet = shade(c.p, -0.45);
  return (
    path('M6.5 12L10.5 2.5H37.5L41.5 12Z', shade(c.p, -0.6), outline(0.8)) +
    path('M8.4 11L11.6 4H36.4L39.6 11Z', velvet) +
    line('M10.5 2.5H37.5', K.gold, 0.7) +
    rr(5, 11, 38, 31, 2, shade(c.p, -0.65), outline()) +
    rr(7, 13, 34, 27, 1.5, velvet) +
    path('M7 13H41V19Q24 15.5 7 19Z', '#000', op(0.25))
  );
}

/** The box's front wall, over the bottom of the product. */
function boxFront(c: Ctx): string {
  const wall = shade(c.p, -0.55);
  return (
    ell(24, 45.2, 20.5, 1.4, '#000', op(0.4)) +
    path('M4 35.5H44L42.6 44.6H5.4Z', wall, outline()) +
    line('M4.6 36.3H43.4', K.gold, 0.8) +
    circ(24, 40.2, 2.1, K.gold, stroke(K.goldD, 0.4)) +
    circ(24, 40.2, 1.1, wall)
  );
}

/** The display case: a spotlight from above and the back of the glass. */
function caseBack(c: Ctx): string {
  const pulse = c.anim ? `<animate attributeName="opacity" values="0.7;1;0.7" dur="3.6s" repeatCount="indefinite"/>` : '';
  return (
    `<path d="M17 0H31L43 37H5Z" fill="url(#${c.u}-sp)">${pulse}</path>` +
    rr(8.5, 4.5, 31, 31.5, 1, '#9fd8ff', op(0.05)) +
    line('M8.5 4.5V36M39.5 4.5V36', '#cfe8ff', 0.4, op(0.3))
  );
}

/** The plinth, the gold plaque and the front of the glass, with a glint running across it. */
function caseFront(c: Ctx): string {
  const glint = c.anim
    ? `<rect x="-14" y="0" width="7" height="40" fill="url(#${c.u}-sw)" transform="skewX(-24)"><animate attributeName="x" values="-14;-14;58" keyTimes="0;0.6;1" dur="5s" repeatCount="indefinite"/></rect>`
    : '';
  return (
    ell(24, 36.4, 11, 1.2, c.p, op(0.35)) +
    rr(6.5, 36, 35, 4.2, 0.8, '#1d1a14', outline(0.8)) +
    rect(6.5, 36, 35, 0.9, `url(#${c.u}-gd)`) +
    rr(4.5, 40, 39, 4.8, 1, '#141210', outline(0.8)) +
    rect(4.5, 40, 39, 0.7, K.goldD) +
    rr(17.5, 41.4, 13, 2.5, 0.5, `url(#${c.u}-gd)`, stroke(K.goldD, 0.3)) +
    line('M19.5 42.65H28.5', K.ink, 0.4, op(0.5)) +
    rr(8, 4, 32, 32, 1.2, '#dff1ff', op(0.04)) +
    rr(8, 4, 32, 32, 1.2, 'none', `${stroke('#dff1ff', 0.7)} ${op(0.55)}`) +
    path('M11 6H15L10 16.5L8.6 13.5Z', K.white, op(0.2)) +
    path('M34.5 30.5L38.4 22.5V27.5L36.4 32.5Z', K.white, op(0.1)) +
    `<g clip-path="url(#${c.u}-gc)">${glint}</g>` +
    rr(7, 2.4, 34, 2.3, 0.6, `url(#${c.u}-gd)`, stroke(K.goldD, 0.3))
  );
}

function definitions(c: Ctx, look: Look): string {
  const q = c.q;
  let d =
    `<linearGradient id="${c.u}-sh" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="#fff" stop-opacity="0.3"/><stop offset="0.42" stop-color="#fff" stop-opacity="0"/>` +
    `<stop offset="0.7" stop-color="#000" stop-opacity="0.06"/><stop offset="1" stop-color="#000" stop-opacity="0.36"/></linearGradient>`;
  if (q >= 5) {
    d += `<pattern id="${c.u}-kn" width="1.8" height="1.8" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><rect width="0.6" height="1.8" fill="#000" opacity="0.08"/></pattern>`;
  }
  if (q >= 6) {
    const shift = c.anim
      ? `<animateTransform attributeName="gradientTransform" type="translate" values="-0.5 -0.5;0.5 0.5;-0.5 -0.5" dur="6s" repeatCount="indefinite"/>`
      : '';
    d +=
      `<clipPath id="${c.u}-cl"><path d="${look.body}"/></clipPath>` +
      `<linearGradient id="${c.u}-ho" x1="0" y1="0" x2="1" y2="1" spreadMethod="reflect">` +
      ['#ff6fb1', '#ffd66b', '#7bffbf', '#6fc8ff', '#c38bff'].map((col, i) => `<stop offset="${i / 4}" stop-color="${col}"/>`).join('') +
      `${shift}</linearGradient>` +
      `<linearGradient id="${c.u}-sw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/>` +
      `<stop offset="0.5" stop-color="#fff" stop-opacity="0.6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
  }
  if (q >= 7) {
    d += `<linearGradient id="${c.u}-gd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1b8"/><stop offset="0.45" stop-color="${K.gold}"/><stop offset="1" stop-color="${K.goldD}"/></linearGradient>`;
  }
  if (q >= 8) {
    d += `<radialGradient id="${c.u}-ha"><stop offset="0" stop-color="${c.p}" stop-opacity="0.5"/><stop offset="1" stop-color="${c.p}" stop-opacity="0"/></radialGradient>`;
  }
  if (q >= 10) {
    d +=
      `<linearGradient id="${c.u}-sp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
      `<clipPath id="${c.u}-gc"><rect x="8" y="4" width="32" height="32"/></clipPath>`;
  }
  return `<defs>${d}${c.defs.join('')}</defs>`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface MerchMilestone {
  /** The finish level where it arrives. */
  q: number;
  name: string;
  desc: string;
}

/** Every change you can see on a product as its finish improves, in order. */
export function merchMilestones(id: string): MerchMilestone[] {
  const looks = ART[id]?.looks;
  if (!looks) return [];
  return [
    { q: 0, name: looks[0].name, desc: 'Plain stock, straight off the pallet.' },
    { q: 2, name: looks[1].name, desc: 'A better-made item, with your colours worked into it.' },
    { q: 4, name: looks[2].name, desc: 'The premium version, with a stitched finish and a texture you can feel.' },
    { q: 6, name: 'Holographic foil', desc: 'A foil finish that shifts colour and catches the light.' },
    { q: 8, name: 'Signed edition', desc: 'Signed in gold by your star player.' },
    { q: 9, name: "Collector's box", desc: 'Presented in a velvet-lined box.' },
    { q: 10, name: 'Hall of Fame case', desc: 'Under glass on a gold-plaqued plinth.' },
  ];
}

/** The most recent visible change a finish level has reached. */
export function merchLookName(id: string, quality: number): string {
  const reached = merchMilestones(id).filter((m) => m.q <= quality);
  return reached[reached.length - 1]?.name ?? '';
}

/** The next visible change above this finish level, if any. */
export function nextMerchMilestone(id: string, quality: number): MerchMilestone | undefined {
  return merchMilestones(id).find((m) => m.q > quality);
}

export const MERCH_ART_IDS: string[] = Object.keys(ART);

export function hasMerchArt(id: string): boolean {
  return id in ART;
}

const clampQ = (q: number) => Math.max(0, Math.min(10, Math.floor(q)));

/** Where the player's design is printed on a product at this finish, in 48-grid units. */
export function merchPrintWindow(id: string, quality = 0): PrintWindow {
  const q = clampQ(quality);
  const look = ART[id]?.looks[lookIndex(q)];
  if (!look) return { x: 16, y: 16, w: 16, h: 16 };
  const frame = presentation(q);
  if (!frame) return look.print;
  const { x, y, w, h } = look.print;
  return { ...look.print, x: frame.tx + x * frame.k, y: frame.ty + y * frame.k, w: w * frame.k, h: h * frame.k };
}

let serial = 0;

/** Inner SVG markup for one product in the org's colours at a finish level. */
export function merchArtMarkup(id: string, primary: string, secondary: string, quality = 0, animate = false): string {
  const product = ART[id];
  if (!product) return '';
  const q = clampQ(quality);
  const p = safe(primary, '#22e4ff');
  const s = safe(secondary, '#8b5cff');
  const c: Ctx = {
    p,
    s,
    pd: shade(p, -0.35),
    pl: shade(p, 0.35),
    sd: shade(s, -0.35),
    sl: shade(s, 0.25),
    q,
    anim: animate,
    u: `mx${(++serial).toString(36)}`,
    defs: [],
  };
  const look = product.looks[lookIndex(q)];

  let item = look.draw(c);
  // Volume: light from the top left. Bulk stock stays flatter.
  item += `<path d="${look.body}" fill="url(#${c.u}-sh)" opacity="${q < 2 ? 0.55 : 1}"/>`;
  if (q >= 5) item += `<path d="${look.body}" fill="url(#${c.u}-kn)"/>`;
  if (q >= 3) item += line(look.seams, p, q >= 5 ? 1 : 0.9, op(0.9));
  if (q >= 5) item += line(look.seams, K.white, 0.35, `stroke-dasharray="0.9 0.7" ${op(0.75)}`);
  if (q >= 6) item += foil(c, look);
  if (q >= 7) item += hangTag(c, look.tag);
  if (q >= 8) item += signature(c, look.sign);

  let out = '';
  if (q >= 8 && q < 10) {
    const pulse = c.anim ? `<animate attributeName="opacity" values="0.65;1;0.65" dur="3.2s" repeatCount="indefinite"/>` : '';
    out += `<circle cx="24" cy="24" r="22" fill="url(#${c.u}-ha)">${pulse}</circle>`;
  }
  if (q === 9) out += boxBack(c);
  if (q >= 10) out += caseBack(c);
  const frame = presentation(q);
  out += frame ? `<g transform="translate(${frame.tx} ${frame.ty}) scale(${frame.k})">${item}</g>` : item;
  if (q === 9) out += boxFront(c);
  if (q >= 10) out += caseFront(c);
  if (q >= 8) out += sparkles(c);

  return definitions(c, look) + out;
}

/** A standalone 48x48 SVG, for product tiles, previews and tooltips. */
export function merchArtSvg(id: string, primary: string, secondary: string, quality = 0, animate = false): string {
  return `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${merchArtMarkup(id, primary, secondary, quality, animate)}</svg>`;
}
