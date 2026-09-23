import { K, circ, ell, f, line, op, path, rect, rr, stroke } from './artKit';

/**
 * The HQ's operations, drawn the way Cookie Clicker draws its buildings: every operation has its own
 * little world, a strip of scenery, and every unit you own is a building or character standing in it.
 *
 * Sprites are drawn on the same 48x48 grid as the gear and merch art, lit from the top left: each
 * shape has an ink outline, a lighter face towards the light, a shaded face away from it and a soft
 * ground shadow, and lit parts glow in the operation's colour `c`. Sprites use no gradients or
 * filters, because hundreds of copies share the page (some inside hidden columns) and shared
 * gradient ids break there. Scenes are 400x72 strips with the ground from y=48, drawn as CSS
 * backgrounds, so each is its own document and can use gradients freely.
 *
 * Output is built only from constants here and the operation colours, so it is safe to render with
 * {@html}.
 */

// ---------------------------------------------------------------------------
// Sprites
// ---------------------------------------------------------------------------
type Sprite = (c: string) => string;

const ink = K.ink;
const skin = '#e8b893';
const white = '#f4f5f7';
const warm = '#ffe7a3';

/** Ink outline, rounded joins. */
const o = (w = 1) => `${stroke(ink, w)} stroke-linejoin="round"`;
/** A soft ground shadow under a sprite. */
const ground = (rx = 17) => ell(24, 44.6, rx, 2.4, '#000', op(0.38));
/** Light falling on a surface. */
const lit = (d: string, a = 0.22) => path(d, '#ffffff', op(a));
/** The side turned away from the light. */
const shade = (d: string, a = 0.28) => path(d, '#000000', op(a));

const SPRITES: Record<string, Sprite> = {
  // A gamer behind their monitor, face lit by the screen, in a team-colour chair.
  grinder: (c) =>
    ground(18) +
    rr(12, 6, 24, 30, 7, c, o()) +
    shade('M30 8Q36 10 36 16V36H30Z', 0.3) +
    lit('M13 12Q14 7 20 6.5V16H13Z', 0.18) +
    path('M14 34Q14 23 24 23Q34 23 34 34Z', K.black3, o()) +
    circ(24, 16, 6.2, skin, o()) +
    path('M17.8 15Q18 9 24 9Q30 9 30.2 15Q27 11.5 24 12Q21 11.5 17.8 15Z', '#3b2a22') +
    line('M16.5 16Q16.5 8.5 24 8.5Q31.5 8.5 31.5 16', K.black2, 1.6) +
    rr(14.4, 14.2, 3.4, 5.4, 1.2, c, o(0.7)) +
    rr(30.2, 14.2, 3.4, 5.4, 1.2, c, o(0.7)) +
    circ(24, 17, 7, c, op(0.14)) +
    rr(9, 24, 30, 13, 2, K.black2, o()) +
    lit('M10 25H38V27H10Z', 0.1) +
    circ(24, 30.5, 2.6, c) +
    circ(24, 30.5, 4.4, c, op(0.25)) +
    rect(21, 37, 6, 2, K.black3) +
    rr(3, 38.5, 42, 4, 1, K.wood, o()) +
    lit('M4 39H44V40.2H4Z', 0.3) +
    rect(5, 42.5, 38, 1.2, c, op(0.75)),

  // A streamer framed by a ring light, live on air.
  streamer: (c) =>
    ground(15) +
    line('M24 33V43M24 43L17 45M24 43L31 45', K.greyD, 1.6) +
    circ(24, 18, 15.5, c, op(0.14)) +
    circ(24, 18, 13.5, 'none', o(4.6)) +
    circ(24, 18, 13.5, 'none', stroke(c, 3.2)) +
    circ(24, 18, 13.5, 'none', `${stroke('#ffffff', 1)} ${op(0.55)} stroke-dasharray="10 32"`) +
    path('M14.5 36Q14.5 26 24 26Q33.5 26 33.5 36Z', c, o()) +
    shade('M27 26.6Q33.5 28 33.5 36H27Z', 0.25) +
    circ(24, 19, 6.2, skin, o()) +
    shade('M27.5 15Q30.2 18 28.5 23Q27 24.6 25 25Q28.5 20 27.5 15Z', 0.12) +
    path('M17.8 18Q17.6 11.8 24 11.8Q30.4 11.8 30.2 18Q27.5 14.8 24 15.2Q20.5 14.8 17.8 18Z', '#6b3f2a') +
    circ(21.8, 19.6, 0.8, ink) +
    circ(26.2, 19.6, 0.8, ink) +
    path('M22.2 22Q24 23.3 25.8 22', 'none', stroke(ink, 0.8)) +
    line('M34 30L38 24', K.black3, 1.2) +
    rr(36.2, 20, 3.6, 6, 1.8, K.black2, o(0.7)) +
    rr(31, 3, 14, 6.5, 1.6, K.red, o(0.8)) +
    circ(34, 6.2, 1.1, white) +
    `<text x="40" y="8.2" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="4.2" fill="${white}">LIVE</text>`,

  // A cinema camera on a tripod, lens catching the light.
  creator: (c) =>
    ground(15) +
    line('M24 30L13 44M24 30L35 44M24 30V44', K.black3, 2) +
    line('M24 30L13 44M24 30L35 44', K.greyL, 0.6, op(0.5)) +
    rr(19, 27, 10, 4, 1, K.black2, o(0.8)) +
    rr(7, 12, 26, 16, 3, K.black2, o()) +
    lit('M8 13H32V15.5H8Z', 0.14) +
    shade('M8 24H32V27H8Z', 0.3) +
    rr(12, 8, 12, 5, 1.2, K.black3, o(0.8)) +
    circ(19, 20, 7.2, ink) +
    circ(19, 20, 5.6, c) +
    circ(19, 20, 3.3, K.ink) +
    circ(19, 20, 1.6, c, op(0.7)) +
    circ(16.8, 17.6, 1.4, '#ffffff', op(0.85)) +
    path('M33 14.5L42 10.5V29.5L33 25.5Z', K.black3, o()) +
    shade('M33 21L42 23V29.5L33 25.5Z', 0.3) +
    circ(11, 15.6, 2.4, K.red, op(0.3)) +
    circ(11, 15.6, 1.2, K.red),

  // A corner café: striped awning, warm window, a sign above the door.
  cafe: (c) =>
    ground(19) +
    rect(6, 16, 36, 27, '#eadfc6', o()) +
    shade('M34 16H42V43H34Z', 0.14) +
    rr(4, 11, 40, 6, 1, K.woodD, o()) +
    lit('M5 11.6H43V13H5Z', 0.25) +
    rr(14, 5.5, 20, 6, 1.4, K.black2, o(0.8)) +
    `<text x="24" y="10.2" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="4.4" fill="${c}">CAFÉ</text>` +
    path('M4 17H44L42 24.5H6Z', c, o()) +
    [0, 1, 2, 3, 4].map((i) => path(`M${8 + i * 8} 17H${12 + i * 8}L${f(11.6 + i * 8)} 24.5H${f(7.6 + i * 8)}Z`, '#ffffff', op(0.85))).join('') +
    [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => circ(8 + i * 4, 24.6, 2, i % 2 ? '#ffffff' : c, o(0.5))).join('') +
    shade('M4 17H44L43.6 18.6H4.3Z', 0.2) +
    rr(9, 28, 15, 11, 1, warm, o()) +
    circ(16.5, 33.5, 7, warm, op(0.25)) +
    line('M16.5 28V39M9 33.5H24', K.woodD, 1) +
    path('M11 38.5Q13 34 15 38.5ZM18 38.5Q20 33 22 38.5Z', K.woodD, op(0.55)) +
    rr(28, 28, 10, 15, 1, K.woodD, o()) +
    rr(30, 30, 6, 6, 0.6, warm, op(0.8)) +
    circ(36.2, 37, 0.8, K.gold) +
    rect(3, 43, 42, 1.6, K.greyD),

  // A bootcamp house: tiled roof, a team flag, windows lit up late.
  bootcamp: (c) =>
    ground(18) +
    rect(9, 22, 30, 21, '#eadfc6', o()) +
    shade('M31 22H39V43H31Z', 0.13) +
    rect(33, 9, 4.5, 9, '#9a5a44', o(0.8)) +
    path('M5 23.5L24 7.5L43 23.5Z', '#c9483b', o()) +
    shade('M24 7.5L43 23.5H24Z', 0.2) +
    line('M11 18.5H37M15.5 14.5H32.5', '#8f2f26', 0.8, op(0.7)) +
    line('M24 7.5V2.5', K.greyD, 0.9) +
    path('M24 2.8L30 4.4L24 6Z', c, o(0.5)) +
    rr(12.5, 26, 8, 6.5, 0.8, c, o(0.8)) +
    rr(27.5, 26, 8, 6.5, 0.8, c, o(0.8)) +
    line('M16.5 26V32.5M12.5 29.2H20.5M31.5 26V32.5M27.5 29.2H35.5', '#ffffff', 0.7, op(0.6)) +
    circ(16.5, 29.2, 6, c, op(0.16)) +
    circ(31.5, 29.2, 6, c, op(0.16)) +
    rr(21, 33, 6, 10, 0.8, K.woodD, o(0.8)) +
    circ(25.5, 38.5, 0.6, K.gold) +
    circ(9.5, 41.5, 3.4, '#3f8f4a', o(0.7)) +
    circ(38.5, 41.5, 3.4, '#3f8f4a', o(0.7)) +
    line('M7.4 40Q9 38.4 10.8 39.4', '#ffffff', 0.9, op(0.35)),

  // A LAN centre: neon sign, glowing booths, a network mast on the roof.
  lan: (c) =>
    ground(19) +
    line('M16 12V4M16 4L12 8M16 4L20 8', K.greyL, 1) +
    circ(16, 3.6, 1.4, c) +
    circ(16, 3.6, 3, c, op(0.25)) +
    rr(5, 12, 38, 31, 1.6, '#2b2f3c', o()) +
    lit('M6 13H42V15H6Z', 0.12) +
    shade('M35 13H42V42H35Z', 0.22) +
    rr(9, 16, 26, 7, 1.6, ink, o(0.6)) +
    rr(9, 16, 26, 7, 1.6, c, op(0.2)) +
    `<text x="22" y="21.6" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="5.6" fill="${c}">LAN</text>` +
    [0, 1, 2].map((i) => rr(9 + i * 9.5, 26, 7, 5, 0.6, c, op(i === 1 ? 0.9 : 0.55))).join('') +
    [0, 1, 2].map((i) => rr(9 + i * 9.5, 33, 7, 4, 0.6, c, op(i === 0 ? 0.8 : 0.4))).join('') +
    rr(35.5, 26, 4, 11, 0.6, c, op(0.3)) +
    rr(19.5, 38, 9, 5, 0.6, ink) +
    rect(19.5, 38, 9, 1, c, op(0.9)),

  // A stadium bowl, pitch lit green, floodlights blazing.
  arena: (c) =>
    ground(21) +
    line('M6 30V9M42 30V9', K.black3, 1.4) +
    circ(6, 8, 5, c, op(0.2)) +
    circ(42, 8, 5, c, op(0.2)) +
    rr(2.5, 6, 7, 3.5, 0.8, c, o(0.6)) +
    rr(38.5, 6, 7, 3.5, 0.8, c, o(0.6)) +
    path('M2 29Q24 15 46 29V37Q24 48 2 37Z', '#9aa2b0', o()) +
    lit('M3 29Q24 16 45 29L44 30.5Q24 18 4 30.5Z', 0.35) +
    shade('M2 33Q24 44 46 33V37Q24 48 2 37Z', 0.25) +
    ell(24, 30.2, 17, 6.2, '#4b5160', o(0.7)) +
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => circ(9 + i * 3, 26.6 + Math.abs(i - 5) * 0.35, 0.9, i % 3 === 0 ? c : i % 3 === 1 ? '#ffffff' : '#f5c451', op(0.85))).join('') +
    ell(24, 31.2, 11.5, 3.8, '#3f9a4f', o(0.6)) +
    line('M24 27.5V35', '#ffffff', 0.6, op(0.7)) +
    ell(24, 31.2, 2.4, 1, 'none', `${stroke('#ffffff', 0.5)} ${op(0.7)}`),

  // An outside-broadcast truck with a dish beaming the signal out.
  broadcast: (c) =>
    ground(20) +
    line('M11 21V15', K.greyD, 1.2) +
    path('M3.5 16Q5 5 18 7L11 16.5Z', '#e6e8ec', o()) +
    shade('M11 16.5L18 7Q16 13 11 16.5Z', 0.18) +
    line('M11 12L7.5 9', K.greyD, 0.8) +
    line('M21 6Q24 9 21 12M24 3.5Q28.5 9 24 14.5', c, 1.4) +
    rr(3, 21, 31, 16, 2, '#eef0f3', o()) +
    lit('M4 22H33V23.6H4Z', 0.5) +
    shade('M4 33H33V36H4Z', 0.12) +
    path('M34 25H40Q43.5 25 44.5 29.5V37H34Z', '#dde0e6', o()) +
    path('M35.5 26.5H39.6Q41.8 26.5 42.7 30.5H35.5Z', '#6fa8d8', o(0.6)) +
    lit('M36 27L38.5 27L36.4 30Z', 0.45) +
    rect(3, 29.5, 41.5, 3, c) +
    rr(6, 24, 8, 4, 0.6, K.black3, op(0.6)) +
    circ(11, 38.5, 3.8, ink) +
    circ(11, 38.5, 1.6, K.greyL) +
    circ(37, 38.5, 3.8, ink) +
    circ(37, 38.5, 1.6, K.greyL),

  // A streaming platform's server rack, a play button glowing on the front.
  platform: (c) =>
    ground(14) +
    path('M35 6L40 9V43H35Z', '#15161a', o()) +
    rr(10, 4, 26, 40, 2, K.black2, o()) +
    lit('M11 5H35V7H11Z', 0.12) +
    [0, 1, 2, 3].map(
      (i) =>
        rr(12.5, 14 + i * 7, 21, 5, 0.6, K.black3, o(0.5)) +
        line(`M14.5 ${16.5 + i * 7}H24.5`, '#000', 0.9, op(0.45)) +
        circ(30.5, 16.5 + i * 7, 0.9, i % 2 ? '#4ade80' : c) +
        circ(28, 16.5 + i * 7, 0.9, c, op(0.5)),
    ).join('') +
    rr(12.5, 6.5, 21, 6, 0.8, ink, o(0.5)) +
    path('M20.5 7.6L27 9.5L20.5 11.4Z', c) +
    circ(23, 9.5, 4.6, c, op(0.18)) +
    rect(10, 42, 26, 1.4, c, op(0.7)),

  // A game studio tower with a code sign on the roof.
  studio: (c) =>
    ground(16) +
    path('M34 10L40 13V43H34Z', '#26314a', o()) +
    rect(9, 10, 25, 33, '#34425e', o()) +
    lit('M10 11H33V12.5H10Z', 0.18) +
    [0, 1, 2, 3].map((row) =>
      [0, 1, 2].map((col) => rr(11.5 + col * 7.4, 14.5 + row * 5.6, 5.6, 3.8, 0.5, (row + col) % 3 === 0 ? warm : '#7fb0dc', op((row + col) % 3 === 0 ? 0.9 : 0.55))).join(''),
    ).join('') +
    rr(15, 36.5, 13, 6.5, 0.6, K.black2, o(0.6)) +
    rect(15, 36.5, 13, 1.2, c) +
    rr(11, 2.5, 21, 7, 1.4, ink, o(0.6)) +
    line('M17 4.5L14.5 6L17 7.5M26 4.5L28.5 6L26 7.5M22.6 4L20.4 8', c, 1.1) +
    circ(21.5, 6, 6, c, op(0.14)),

  // Gold, silver and bronze steps, with the league trophy on top.
  league: (c) =>
    ground(20) +
    rect(4, 31, 13, 12, '#c9ced6', o()) +
    lit('M5 31.6H16V33H5Z', 0.45) +
    rect(17, 25, 14, 18, K.gold, o()) +
    lit('M18 25.6H30V27H18Z', 0.45) +
    shade('M27 25H31V43H27Z', 0.14) +
    rect(31, 34, 13, 9, K.copper, o()) +
    lit('M32 34.6H43V36H32Z', 0.35) +
    `<text x="10.5" y="40" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="6" fill="#7d838d">2</text>` +
    `<text x="24" y="36" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="7" fill="${K.goldD}">1</text>` +
    `<text x="37.5" y="41.6" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="5" fill="#8a4f2b">3</text>` +
    circ(24, 12, 9, K.gold, op(0.18)) +
    path('M17.5 5H30.5V10Q30.5 17 24 17Q17.5 17 17.5 10Z', K.gold, o()) +
    path('M17.5 7Q13.5 7 14 10Q14.5 12.8 18.2 12.6M30.5 7Q34.5 7 34 10Q33.5 12.8 29.8 12.6', 'none', o(1.8)) +
    path('M17.5 7Q13.5 7 14 10Q14.5 12.8 18.2 12.6M30.5 7Q34.5 7 34 10Q33.5 12.8 29.8 12.6', 'none', stroke(K.gold, 1)) +
    lit('M19.5 6H22V14Q19.5 12.5 19.5 10Z', 0.45) +
    shade('M27 6H30.5V10Q30.5 14 27 16Z', 0.18) +
    rect(22.5, 17, 3, 3.5, K.goldD, o(0.6)) +
    rr(19.5, 20.5, 9, 3.5, 0.6, K.goldD, o(0.7)) +
    circ(24, 10.5, 1.8, c) +
    rect(8, 12, 1.6, 2.6, c, 'transform="rotate(25 8.8 13.3)"') +
    rect(38, 10, 1.6, 2.6, '#ffffff', 'transform="rotate(-30 38.8 11.3)"') +
    rect(40.5, 20, 1.4, 2.4, K.gold, 'transform="rotate(15 41.2 21.2)"'),

  // An orbital station: a spinning ring, a hub and wings of solar panels.
  orbital: (c) =>
    ell(24, 44.6, 12, 1.6, '#000', op(0.2)) +
    [
      [5, 6],
      [44, 12],
      [40, 38],
      [7, 34],
    ].map(([x, y]) => circ(x, y, 0.7, '#ffffff', op(0.8))).join('') +
    path('M5 24A19 7.5 0 0 1 43 24', 'none', o(4.8)) +
    path('M5 24A19 7.5 0 0 1 43 24', 'none', stroke('#c7ccd6', 3)) +
    line('M9.5 24H38.5', K.greyD, 1.2) +
    rr(1, 20.5, 8.5, 7, 0.6, '#2f5fb0', o(0.8)) +
    line('M3.8 20.5V27.5M6.6 20.5V27.5M1 24H9.5', '#9ec5ff', 0.5, op(0.6)) +
    rr(38.5, 20.5, 8.5, 7, 0.6, '#2f5fb0', o(0.8)) +
    line('M41.4 20.5V27.5M44.2 20.5V27.5M38.5 24H47', '#9ec5ff', 0.5, op(0.6)) +
    circ(24, 24, 7, '#a7afbd', o()) +
    shade('M27 18.4A7 7 0 0 1 24 31A7 7 0 0 0 27 18.4Z', 0.25) +
    line('M19.5 20Q21 17.6 24 17.4', '#ffffff', 1, op(0.55)) +
    circ(24, 24, 3, c) +
    circ(24, 24, 5.2, c, op(0.25)) +
    path('M5 24A19 7.5 0 0 0 43 24', 'none', o(4.8)) +
    path('M5 24A19 7.5 0 0 0 43 24', 'none', stroke('#dfe3ea', 3)) +
    [10, 17, 31, 38].map((x) => circ(x, 24 + 7.5 * Math.sqrt(Math.max(0, 1 - ((x - 24) / 19) ** 2)), 0.9, c)).join(''),

  // A brain under a glass dome, wired up and glowing.
  neural: (c) =>
    ground(15) +
    path('M11 36H37L40 43H8Z', K.black2, o()) +
    rect(10, 38.5, 28, 1.3, c, op(0.85)) +
    circ(24, 26, 13, c, op(0.12)) +
    path('M13.5 29Q12.5 18 24 17.5Q35.5 18 34.5 29Q34 35 24 35Q14 35 13.5 29Z', '#f2a6b8', o()) +
    line('M18 22Q20.5 24 18.5 27M23.5 20Q26 22.5 23.5 25.5M28.5 22.5Q26.5 25 29 28M19.5 30Q23 28.5 26 31', '#c26d84', 1) +
    line('M16 22Q17 19 21 18.4', '#ffffff', 1, op(0.5)) +
    line('M20 18.5L17 11M28 18.5L31 11M24 17.5V10', K.greyD, 0.9) +
    circ(17, 10.5, 1.6, c) +
    circ(31, 10.5, 1.6, c) +
    circ(24, 9.5, 1.6, c) +
    path('M9 36A15 15 0 0 1 39 36', '#bfe9ff', `${op(0.16)}`) +
    path('M9 36A15 15 0 0 1 39 36', 'none', `${stroke('#ffffff', 1.2)} ${op(0.6)}`) +
    line('M12.5 29Q13.5 22 19 18.6', '#ffffff', 1.2, op(0.5)),

  // A cloning pod: a figure floating in glowing fluid, bubbles rising.
  clone: (c) =>
    ground(15) +
    circ(24, 23, 15, c, op(0.14)) +
    rr(12.5, 6, 23, 33, 11, c, op(0.3)) +
    rr(12.5, 20, 23, 19, 9, c, op(0.28)) +
    circ(24, 15, 3.2, ink, op(0.55)) +
    path('M19.5 33Q19.5 19.5 24 19.5Q28.5 19.5 28.5 33Z', ink, op(0.5)) +
    [
      [17.5, 30, 1],
      [30, 25, 0.8],
      [16.5, 17, 0.7],
      [31, 12, 0.6],
    ]
      .map(([x, y, r]) => circ(x, y, r, '#ffffff', op(0.75)))
      .join('') +
    rr(12.5, 6, 23, 33, 11, 'none', `${stroke(K.greyL, 1.4)}`) +
    lit('M15 12Q15.5 8 19 7.4V30H15Z', 0.22) +
    rr(10, 2, 28, 6, 2, K.silver, o()) +
    lit('M11 2.6H37V4H11Z', 0.5) +
    rr(9, 37.5, 30, 6.5, 2, K.silverD, o()) +
    rect(12, 40, 24, 1.4, c) +
    line('M38 41H44V30', K.greyD, 1.4),

  // A world in a box: a wireframe cube projected over a terminal.
  simulation: (c) =>
    ground(14) +
    path('M17 35L10 17H38L31 35Z', c, op(0.12)) +
    path('M24 4L36 10.5L24 17L12 10.5Z', c, op(0.42)) +
    path('M12 10.5L24 17V30L12 23.5Z', c, op(0.24)) +
    path('M36 10.5L24 17V30L36 23.5Z', c, op(0.12)) +
    line('M24 4L36 10.5V23.5L24 30L12 23.5V10.5ZM24 17L36 10.5M24 17L12 10.5M24 17V30', c, 1.2) +
    line('M24 4L36 10.5L24 17L12 10.5Z', '#ffffff', 0.5, op(0.6)) +
    [
      [8, 8],
      [40, 26],
      [7, 28],
      [41, 6],
    ].map(([x, y], i) => rect(x, y, 1.2, 3, c, op(0.5 + (i % 2) * 0.3))).join('') +
    rr(11, 35, 26, 8, 1.6, K.black2, o()) +
    rect(13.5, 37.5, 21, 2.5, c, op(0.8)) +
    lit('M12 35.6H36V36.8H12Z', 0.15),

  // A portal to other worlds, set in a ring of stone.
  multiverse: (c) =>
    ground(14) +
    circ(24, 21, 20, c, op(0.12)) +
    circ(24, 21, 15, 'none', o(7)) +
    circ(24, 21, 15, 'none', stroke('#5d5768', 5)) +
    path('M11.5 13A15 15 0 0 1 24 6', 'none', `${stroke('#ffffff', 1.4)} ${op(0.35)}`) +
    [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
      const a = (i / 8) * Math.PI * 2;
      return line(`M${f(24 + Math.cos(a) * 12.6)} ${f(21 + Math.sin(a) * 12.6)}L${f(24 + Math.cos(a) * 17.4)} ${f(21 + Math.sin(a) * 17.4)}`, ink, 0.8, op(0.6));
    }).join('') +
    circ(24, 21, 12.5, c, op(0.35)) +
    circ(24, 21, 10, 'none', stroke('#ff8ad8', 1.6)) +
    circ(24, 21, 7, 'none', stroke('#9ec5ff', 1.4)) +
    path('M24 21m-4 0a4 4 0 1 1 4 4a2.4 2.4 0 1 1 -2.4 -2.4', 'none', stroke(c, 1.3)) +
    circ(24, 21, 1.6, '#ffffff') +
    rr(15, 37.5, 18, 6, 1.4, '#3f3a4a', o()) +
    lit('M16 38H32V39.4H16Z', 0.2),
};

/** Built art by id and colour. The strings never change, and the HQ asks for them every frame. */
const spriteCache = new Map<string, string>();
const backgroundCache = new Map<string, string>();

export function opSpriteSvg(id: string, c: string): string {
  const key = `${id}|${c}`;
  const hit = spriteCache.get(key);
  if (hit) return hit;
  const draw = SPRITES[id];
  const inner = draw ? draw(c) : circ(24, 24, 12, c);
  const svg = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${inner}</svg>`;
  spriteCache.set(key, svg);
  return svg;
}

// ---------------------------------------------------------------------------
// Scenes
// ---------------------------------------------------------------------------
const W = 400;
const H = 72;
/** Where the floor starts. Both rows of units stand below it. */
const GROUND = 48;

/** Repeats a drawing along the strip; the steps divide 400 so the strip tiles seamlessly. */
const repeat = (count: number, step: number, draw: (x: number, i: number) => string) =>
  Array.from({ length: count }, (_, i) => draw(i * step, i)).join('');

/** A vertical gradient, defined inline: each scene is its own SVG document. */
const vgrad = (id: string, stops: [number, string, number?][]) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map(([at, col, a]) => `<stop offset="${at}" stop-color="${col}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('')}</linearGradient>`;
const rgrad = (id: string, col: string, a: number) =>
  `<radialGradient id="${id}"><stop offset="0" stop-color="${col}" stop-opacity="${a}"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>`;

/** The sky, a floor with a lit front edge and a soft shadow line where they meet. */
function base(sky: [string, string], floor: [string, string], c: string, edge = 0.5): string {
  return (
    `<defs>${vgrad('sky', [
      [0, sky[0]],
      [1, sky[1]],
    ])}${vgrad('floor', [
      [0, floor[0]],
      [1, floor[1]],
    ])}${rgrad('glow', c, 0.45)}${vgrad('vig', [
      [0, '#000', 0.35],
      [0.25, '#000', 0],
      [0.8, '#000', 0],
      [1, '#000', 0.4],
    ])}</defs>` +
    rect(0, 0, W, H, 'url(#sky)') +
    rect(0, GROUND, W, H - GROUND, 'url(#floor)') +
    rect(0, GROUND, W, 1.2, '#ffffff', op(0.08 * edge * 2)) +
    rect(0, GROUND - 2, W, 2, '#000', op(0.25))
  );
}
/** A darkening at the top and bottom edges, drawn last. */
const vignette = () => rect(0, 0, W, H, 'url(#vig)');

type Scene = (c: string) => string;

const SCENES: Record<string, Scene> = {
  // A gamer's bedroom at night: posters, fairy lights, a moonlit window, wooden floor.
  grinder: (c) =>
    base(['#2a2238', '#1b1726'], ['#5a3f2e', '#3a291e'], c) +
    repeat(2, 200, (x) => rr(x + 120, 8, 36, 26, 2, '#0e1424', o(1)) + rect(x + 122, 10, 32, 22, '#16244a') + circ(x + 146, 16, 4, '#f4f1d8', op(0.9)) + line(`M${x + 138} 10V32M${x + 122} 21H${x + 154}`, '#0e1424', 1.4)) +
    repeat(4, 100, (x, i) => rr(x + 22, 12, 22, 28, 1, i % 2 ? c : '#3a2f52', `${o(0.8)} ${op(0.85)}`) + rect(x + 25, 16, 16, 12, '#ffffff', op(0.12)) + rect(x + 25, 31, 12, 2, '#ffffff', op(0.3))) +
    path(`M0 6Q50 12 100 6T200 6T300 6T400 6`, 'none', `${stroke('#3a3348', 0.8)}`) +
    repeat(20, 20, (x, i) => circ(x + 10, 6 + 3 * Math.abs(Math.sin(((x + 10) / 100) * Math.PI)), 1.4, i % 2 ? c : '#ffd36b')) +
    repeat(20, 20, (x, i) => circ(x + 10, 6 + 3 * Math.abs(Math.sin(((x + 10) / 100) * Math.PI)), 3.2, i % 2 ? c : '#ffd36b', op(0.18))) +
    rect(0, GROUND - 4, W, 4, '#2a2034') +
    repeat(10, 40, (x) => line(`M${x} ${GROUND}V${H}`, '#000', 0.8, op(0.22))) +
    repeat(5, 80, (x) => line(`M${x + 20} ${GROUND + 12}H${x + 60}`, '#000', 0.6, op(0.12))) +
    vignette(),

  // A streaming room: acoustic foam, a neon sign and purple mood lighting.
  streamer: (c) =>
    base(['#2b1a3a', '#1c1128'], ['#231733', '#160e22'], c) +
    repeat(25, 16, (x, i) => repeat(3, 1, (_, r) => path(`M${x + 2} ${6 + r * 13}L${x + 14} ${6 + r * 13}L${x + 8} ${16 + r * 13}Z`, i % 2 === r % 2 ? '#3a2550' : '#301e44'))) +
    ell(100, 20, 60, 22, 'url(#glow)') +
    ell(300, 20, 60, 22, 'url(#glow)') +
    repeat(2, 200, (x) => rr(x + 70, 12, 60, 16, 8, 'none', `${stroke(c, 2.4)}`) + rr(x + 70, 12, 60, 16, 8, 'none', `${stroke('#ffffff', 0.8)} ${op(0.6)}`)) +
    rect(0, 2, W, 2, c, op(0.7)) +
    rect(0, 4, W, 6, c, op(0.12)) +
    repeat(4, 100, (x) => ell(x + 50, GROUND + 12, 40, 6, c, op(0.08))) +
    vignette(),

  // A photo studio: a grey sweep, softboxes and tape marks on the floor.
  creator: (c) =>
    base(['#3a3d44', '#2a2c31'], ['#2a2c31', '#1c1d21'], c) +
    repeat(4, 100, (x) => path(`M${x + 35} 6L${x + 65} 6L${x + 80} ${GROUND}H${x + 20}Z`, '#ffffff', op(0.05))) +
    repeat(4, 100, (x) => rr(x + 36, 2, 28, 8, 1.5, '#1c1d21', o(0.8)) + rect(x + 38, 4, 24, 4, '#f4f5f7', op(0.9)) + line(`M${x + 50} 10V16`, '#1c1d21', 1.2)) +
    repeat(8, 50, (x) => path(`M${x + 12} ${GROUND + 8}h8M${x + 16} ${GROUND + 4}v8`, 'none', `${stroke(c, 1.4)} ${op(0.5)}`)) +
    line(`M0 ${GROUND + 0.5}H${W}`, c, 0.8, op(0.35)) +
    vignette(),

  // A shopping street at dusk: shopfronts, street lamps, a lit pavement.
  cafe: (c) =>
    base(['#f08a5d', '#6d3b6f'], ['#5c5462', '#3e3845'], c) +
    repeat(8, 50, (x, i) => rect(x, 10 + (i % 3) * 5, 46, 40, i % 2 ? '#3d3246' : '#453950') + rect(x + 6, 18 + (i % 3) * 5, 10, 8, warm, op(0.35)) + rect(x + 28, 18 + (i % 3) * 5, 10, 8, warm, op(i % 3 ? 0.15 : 0.4))) +
    repeat(8, 50, (x) => path(`M${x + 2} ${GROUND - 8}H${x + 44}L${x + 42} ${GROUND - 4}H${x + 4}Z`, c, op(0.55))) +
    repeat(4, 100, (x) => line(`M${x + 25} ${GROUND}V14`, '#2a2530', 1.6) + circ(x + 25, 13, 2.4, '#ffd98a') + circ(x + 25, 13, 9, '#ffd98a', op(0.18)) + ell(x + 25, GROUND + 3, 18, 3, '#ffd98a', op(0.12))) +
    rect(0, GROUND + 10, W, 1.4, '#7a7280') +
    repeat(10, 40, (x) => rect(x + 6, GROUND + 16, 22, 1.4, '#ffffff', op(0.12))) +
    vignette(),

  // Suburbia at sunset: rolling hills, round trees, a picket fence.
  bootcamp: (c) =>
    base(['#ffb37a', '#6f7fb5'], ['#3c7a45', '#2a5a33'], c) +
    circ(320, 22, 9, '#ffe7a3', op(0.9)) +
    circ(320, 22, 20, '#ffe7a3', op(0.2)) +
    path(`M0 34Q60 22 120 32T240 30T400 34V${GROUND}H0Z`, '#5a8fa8', op(0.5)) +
    path(`M0 40Q70 30 140 38T280 36T400 40V${GROUND}H0Z`, '#3f7a52') +
    repeat(8, 50, (x, i) => line(`M${x + 20} ${GROUND - 2}V${GROUND - 10}`, '#5a3a24', 2) + circ(x + 20, GROUND - 14 - (i % 2) * 2, 7 + (i % 3), i % 2 ? '#2f6b3c' : '#3c8048') + circ(x + 17, GROUND - 16 - (i % 2) * 2, 3, '#ffffff', op(0.12))) +
    repeat(40, 10, (x) => rect(x + 2, GROUND - 6, 2, 8, '#f1e9d6')) +
    rect(0, GROUND - 3, W, 1.4, '#f1e9d6') +
    repeat(20, 20, (x) => path(`M${x + 4} ${GROUND + 10}l2 -3l2 3`, 'none', `${stroke('#5da35f', 0.8)}`)) +
    vignette(),

  // A city at night on a synthwave grid, windows lit in the team colour.
  lan: (c) =>
    base(['#0b1130', '#1c1446'], ['#120a26', '#0a0616'], c) +
    ell(200, GROUND, 260, 16, c, op(0.18)) +
    repeat(16, 25, (x, i) => rect(x, 22 - (i % 4) * 5, 22, 30 + (i % 4) * 5, '#141a38')) +
    repeat(10, 40, (x, i) => rect(x + 4, 14 - (i % 3) * 5, 30, 36 + (i % 3) * 5, '#1b2248') + repeat(3, 1, (_, r) => rect(x + 9, 20 + r * 8 - (i % 3) * 3, 4, 3, c, op(0.25 + ((i + r) % 3) * 0.2)) + rect(x + 22, 20 + r * 8 - (i % 3) * 3, 4, 3, c, op(0.2 + ((i + r + 1) % 3) * 0.2)))) +
    repeat(20, 20, (x) => line(`M${x + 10} ${GROUND}L${(x + 10 - 200) * 2.2 + 200} ${H}`, c, 0.6, op(0.4))) +
    repeat(4, 1, (_, i) => line(`M0 ${GROUND + 3 + i * i * 2}H${W}`, c, 0.6, op(0.35))) +
    rect(0, GROUND, W, 1.2, c, op(0.8)) +
    vignette(),

  // A packed stadium: tiers of fans, spotlight beams, an LED board and the pitch.
  arena: (c) =>
    base(['#10141e', '#1c2230'], ['#2d7a3a', '#1f5a2a'], c) +
    path('M40 0L90 40H10Z', '#ffffff', op(0.06)) +
    path('M200 0L250 40H150Z', '#ffffff', op(0.05)) +
    path('M340 0L390 40H290Z', '#ffffff', op(0.06)) +
    repeat(4, 1, (_, r) => rect(0, 12 + r * 7, W, 7, r % 2 ? '#262c3a' : '#2c3344')) +
    repeat(80, 5, (x, i) => circ(x + 2.5, 14 + (i % 4) * 7 - ((i * 7) % 3), 2.1, ['#e8b893', '#c99470', '#8a5a3c', '#f2d0b0'][i % 4], op(0.85))) +
    repeat(40, 10, (x, i) => (i % 5 === 0 ? rect(x + 3, 9 + (i % 4) * 7, 3, 4, c, op(0.9)) : '')) +
    rect(0, GROUND - 7, W, 6, '#0b0e14') +
    repeat(8, 50, (x, i) => rect(x + 4, GROUND - 6, 42, 4, i % 2 ? c : '#ffffff', op(i % 2 ? 0.75 : 0.2))) +
    repeat(8, 50, (x) => rect(x, GROUND + 2, 25, H - GROUND - 2, '#ffffff', op(0.04))) +
    line(`M0 ${GROUND + 14}H${W}`, '#ffffff', 0.8, op(0.35)) +
    vignette(),

  // Blue hills under a night sky, transmission masts beaming.
  broadcast: (c) =>
    base(['#101a30', '#233452'], ['#2a3a44', '#1c2830'], c) +
    repeat(25, 16, (x, i) => circ(x + 5, 4 + ((i * 11) % 20), i % 4 === 0 ? 0.9 : 0.5, '#ffffff', op(0.6))) +
    path(`M0 38Q100 22 200 36T400 32V${GROUND}H0Z`, '#1f2d45') +
    path(`M0 44Q80 34 160 42T320 40T400 44V${GROUND}H0Z`, '#26384f') +
    repeat(4, 100, (x) => line(`M${x + 50} 36L${x + 50} 6M${x + 44} 36L${x + 50} 6L${x + 56} 36M${x + 46} 26H${x + 54}M${x + 47.5} 16H${x + 52.5}`, '#6d7890', 0.9) + circ(x + 50, 6, 1.8, c) + circ(x + 50, 6, 6, c, op(0.2)) + path(`M${x + 58} 4Q${x + 62} 8 ${x + 58} 12M${x + 62} 1Q${x + 68} 8 ${x + 62} 15`, 'none', `${stroke(c, 0.9)} ${op(0.5)}`)) +
    rect(0, GROUND + 10, W, 8, '#161f26') +
    repeat(10, 40, (x) => rect(x + 8, GROUND + 13.4, 18, 1.2, '#ffd98a', op(0.5))) +
    vignette(),

  // A data centre aisle: racks of blinking servers over a tiled raised floor.
  platform: (c) =>
    base(['#101626', '#1a2234'], ['#1f2838', '#121822'], c) +
    repeat(10, 40, (x) => rr(x + 4, 4, 32, 42, 1.4, '#252d3d', o(0.8)) + rect(x + 5, 5, 30, 1.4, '#ffffff', op(0.08)) + repeat(6, 1, (_, r) => rect(x + 7, 7 + r * 6.4, 26, 4.6, '#303a4e'))) +
    repeat(80, 5, (x, i) => circ(x + 3, 9 + (i % 6) * 6.4, 0.9, i % 7 === 0 ? '#4ade80' : c, op(0.35 + ((i * 3) % 5) * 0.12))) +
    ell(200, 6, 220, 8, '#9ec5ff', op(0.08)) +
    repeat(20, 20, (x) => line(`M${x} ${GROUND}L${(x - 200) * 1.6 + 200} ${H}`, '#ffffff', 0.5, op(0.08))) +
    repeat(3, 1, (_, i) => line(`M0 ${GROUND + 5 + i * 6}H${W}`, '#ffffff', 0.5, op(0.06))) +
    rect(0, GROUND, W, 1.2, c, op(0.45)) +
    vignette(),

  // A business district: glass towers, lit office floors, a street at the bottom.
  studio: (c) =>
    base(['#2a3a64', '#4a5e8a'], ['#2d3442', '#1e232d'], c) +
    repeat(8, 50, (x, i) => rect(x + 2, 18 + (i % 3) * 6, 46, 34, '#2a3552')) +
    repeat(10, 40, (x, i) => rect(x + 6, 6 + (i % 3) * 7, 28, 44, '#34426a', o(0.6)) + path(`M${x + 6} ${6 + (i % 3) * 7}h10l-10 20Z`, '#ffffff', op(0.08)) + repeat(5, 1, (_, r) => repeat(3, 1, (__, k) => rect(x + 9 + k * 8.5, 11 + r * 7 + (i % 3) * 7, 5.5, 3.6, (i + r + k) % 4 === 0 ? warm : '#8fb8e8', op((i + r + k) % 4 === 0 ? 0.85 : 0.35))))) +
    repeat(10, 40, (x, i) => (i % 3 === 0 ? rect(x + 12, 3 + (i % 3) * 7, 16, 3, c, op(0.8)) : '')) +
    rect(0, GROUND + 8, W, 10, '#171b22') +
    repeat(10, 40, (x) => rect(x + 8, GROUND + 12.4, 20, 1.2, '#ffffff', op(0.35))) +
    vignette(),

  // A final: flags over the stands, banners in the team colour, confetti in the air.
  league: (c) =>
    base(['#131c2a', '#223047'], ['#2d7a3a', '#1f5a2a'], c) +
    repeat(4, 1, (_, r) => rect(0, 18 + r * 6, W, 6, r % 2 ? '#2a3548' : '#303c52')) +
    repeat(80, 5, (x, i) => circ(x + 2.5, 20 + (i % 4) * 6, 1.8, ['#e8b893', '#c99470', '#8a5a3c', '#f2d0b0'][i % 4], op(0.7))) +
    repeat(10, 40, (x, i) => line(`M${x + 20} 18V3`, '#8a93a3', 0.9) + path(`M${x + 20} 3L${x + 33} 6.5L${x + 20} 10Z`, i % 2 ? c : K.gold, op(0.95)) + path(`M${x + 20} 3L${x + 33} 6.5L${x + 20} 5Z`, '#ffffff', op(0.2))) +
    rect(0, GROUND - 7, W, 6, '#0b0e14') +
    repeat(4, 100, (x) => rect(x + 10, GROUND - 6, 80, 4, c, op(0.7)) + rect(x + 10, GROUND - 6, 80, 1.2, '#ffffff', op(0.3))) +
    repeat(40, 10, (x, i) => rect(x + 4, 4 + ((i * 13) % 34), 1.8, 3, [c, K.gold, '#ffffff', '#ff6f9a'][i % 4], `${op(0.8)} transform="rotate(${(i * 37) % 90} ${x + 5} ${6 + ((i * 13) % 34)})"`)) +
    line(`M0 ${GROUND + 14}H${W}`, '#ffffff', 0.8, op(0.35)) +
    vignette(),

  // Low orbit: a starfield over a planet's curve, the atmosphere glowing at the horizon.
  orbital: (c) =>
    base(['#03050c', '#0a1024'], ['#1c3a6a', '#0d1c3a'], c) +
    repeat(40, 10, (x, i) => circ(x + 4, 3 + ((i * 17) % 40), i % 5 === 0 ? 1 : 0.5, '#ffffff', op(0.5 + (i % 3) * 0.2))) +
    circ(330, 16, 7, '#c9cbd6') +
    circ(333, 14, 7, '#0a1024', op(0.35)) +
    path(`M0 ${GROUND + 6}Q200 ${GROUND - 14} 400 ${GROUND + 6}V${H}H0Z`, c, op(0.3)) +
    path(`M0 ${GROUND + 8}Q200 ${GROUND - 10} 400 ${GROUND + 8}V${H}H0Z`, '#2a5a9a') +
    path(`M0 ${GROUND + 12}Q200 ${GROUND - 4} 400 ${GROUND + 12}V${H}H0Z`, '#1c3a6a') +
    repeat(5, 80, (x) => ell(x + 40, GROUND + 12, 16, 2.5, '#ffffff', op(0.12))),

  // A neural lab: circuit traces glowing on the wall.
  neural: (c) =>
    base(['#1d1428', '#140e1c'], ['#1e1626', '#120d18'], c) +
    repeat(10, 40, (x, i) => line(`M${x} ${10 + (i % 3) * 9}H${x + 16}V${32 - (i % 2) * 8}H${x + 40}`, c, 1, op(0.35))) +
    repeat(10, 40, (x, i) => line(`M${x + 8} 44V${36 - (i % 3) * 4}H${x + 30}V${8 + (i % 2) * 6}`, c, 0.6, op(0.2))) +
    repeat(10, 40, (x, i) => circ(x + 16, 10 + (i % 3) * 9, 1.8, c, op(0.7)) + circ(x + 16, 10 + (i % 3) * 9, 4.5, c, op(0.15))) +
    repeat(4, 100, (x) => ell(x + 50, 26, 30, 18, 'url(#glow)')) +
    rect(0, GROUND, W, 1.2, c, op(0.5)) +
    repeat(10, 40, (x) => rect(x + 4, GROUND + 6, 32, 1, '#ffffff', op(0.05))) +
    vignette(),

  // A clean lab: tiled walls, glowing tanks in the background, a steel floor.
  clone: (c) =>
    base(['#233036', '#1a2428'], ['#2a3438', '#161e21'], c) +
    repeat(40, 10, (x) => line(`M${x} 0V${GROUND}`, '#ffffff', 0.4, op(0.06))) +
    repeat(5, 1, (_, i) => line(`M0 ${i * 10}H${W}`, '#ffffff', 0.4, op(0.06))) +
    repeat(5, 80, (x) => rr(x + 26, 8, 22, 38, 10, c, op(0.18)) + rr(x + 26, 8, 22, 38, 10, 'none', `${stroke('#9fb0b6', 1)} ${op(0.5)}`) + rr(x + 24, 5, 26, 5, 2, '#6e7c82') + circ(x + 37, 26, 3, '#0b1216', op(0.4))) +
    rect(0, GROUND, W, 1.4, c, op(0.55)) +
    repeat(20, 20, (x) => line(`M${x} ${GROUND}V${H}`, '#000', 0.6, op(0.2))) +
    vignette(),

  // Inside the machine: a glowing grid racing to the horizon, code falling like rain.
  simulation: (c) =>
    base(['#020805', '#04140c'], ['#03120a', '#010603'], c) +
    ell(200, GROUND, 240, 12, c, op(0.25)) +
    repeat(21, 20, (x) => line(`M${x} ${GROUND}L${(x - 200) * 2.6 + 200} ${H}`, c, 0.6, op(0.45))) +
    repeat(5, 1, (_, i) => line(`M0 ${GROUND + 2 + i * i * 1.6}H${W}`, c, 0.6, op(0.4))) +
    rect(0, GROUND - 0.6, W, 1.2, c, op(0.9)) +
    repeat(40, 10, (x, i) => repeat(4, 1, (_, k) => rect(x + 4, ((i * 7 + k * 9) % 40) + 2, 1.4, 3.4, c, op(0.15 + ((i + k) % 4) * 0.15)))),

  // Between worlds: nebula clouds, stars and floating islands.
  multiverse: (c) =>
    base(['#0c0718', '#1a0f2e'], ['#1a1030', '#0c0718'], c) +
    ell(90, 26, 80, 20, c, op(0.18)) +
    ell(250, 30, 100, 22, '#ff8ad8', op(0.12)) +
    ell(360, 18, 60, 16, '#9ec5ff', op(0.14)) +
    repeat(40, 10, (x, i) => circ(x + 6, 3 + ((i * 13) % 42), i % 6 === 0 ? 1 : 0.5, '#ffffff', op(0.7))) +
    repeat(4, 100, (x, i) => path(`M${x + 20} ${24 + (i % 2) * 6}h${24}l-6 8h-12Z`, '#3d2f55', o(0.6)) + rect(x + 20, 24 + (i % 2) * 6, 24, 2, '#6a5a8a') + circ(x + 32, 21 + (i % 2) * 6, 3, '#4a8a5a')) +
    rect(0, GROUND, W, 1.2, c, op(0.5)) +
    vignette(),
};

/** A 400x72 backdrop strip for an operation. */
export function opSceneSvg(id: string, c: string): string {
  const draw = SCENES[id];
  const inner = draw ? draw(c) : rect(0, 0, W, H, '#1b1c21');
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

/** The backdrop as a CSS background, so it tiles across a lane of any width at its natural height. */
export function opSceneBackground(id: string, c: string): string {
  const key = `${id}|${c}`;
  const hit = backgroundCache.get(key);
  if (hit) return hit;
  const url = `url("data:image/svg+xml,${encodeURIComponent(opSceneSvg(id, c))}")`;
  backgroundCache.set(key, url);
  return url;
}

export const OP_ART_IDS = Object.keys(SPRITES);
