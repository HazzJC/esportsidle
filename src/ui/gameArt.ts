import { K, circ, ell, line, op, path, rect, rr, spark, stroke } from './artKit';
import { roundedRect, withDepth } from './logoDepth';

/**
 * Parody logos for the twelve games, on a 48x48 emblem. Each one riffs on the shape of the game it
 * sends up (a split circle, a hexagon with a gold L, a broken ring) with a joke in the name worked in:
 * a legume in the Apex A, a calendar for Fortnight, a clock for Overclock. Colours come from the game
 * data, so the markup is safe to render with {@html}.
 */
type Logo = (c: string) => string;

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

const ink = '#0f1117';
const white = '#f4f5f7';

/** The emblem every logo sits on: a dark rounded plate with a glow of the game colour. */
const plate = (c: string) =>
  rr(1.5, 1.5, 45, 45, 12, ink) +
  circ(24, 18, 22, c, op(0.14)) +
  rr(1.5, 1.5, 45, 45, 12, 'none', `${stroke(c, 1.6)} ${op(0.7)}`);

const LOGOS: Record<string, Logo> = {
  // A circle split by two bars, and a second, smaller circle: the sibling.
  smash: (c) =>
    circ(22, 25, 14, white) +
    rect(24.5, 8, 4.5, 34, ink) +
    rect(6, 27.5, 32, 4.5, ink) +
    circ(37, 12, 5, c) +
    rect(37.8, 7, 1.6, 10, ink) +
    rect(32, 12.8, 10, 1.6, ink),
  // A ball on a rocket trail.
  rocket: (c) =>
    path('M5 33Q12 26 22 27L20 35Q12 36 5 33Z', '#ffb03d') +
    path('M8 32Q14 29 21 30L20 33Q14 34 8 32Z', '#ffe066') +
    circ(29, 24, 11, white) +
    path('M29 18L34 21.5L32 27.5H26L24 21.5Z', ink) +
    line('M29 18V13M34 21.5L39 20M32 27.5L35 32M26 27.5L23 32M24 21.5L19 20', ink, 1.4) +
    circ(29, 24, 11, 'none', stroke(c, 1.8)),
  // A crosshair with a brush stroke through it.
  counter: (c) =>
    circ(24, 24, 13, 'none', stroke(white, 2.4)) +
    line('M24 6V14M24 34V42M6 24H14M34 24H42', white, 2.4) +
    path('M8 31Q20 20 41 17Q30 24 13 34Q9 35 8 31Z', c) +
    circ(24, 24, 1.8, white),
  // A gold L in a hexagon, with the three lanes behind it.
  lanes: (c) =>
    path('M24 5L40 14V34L24 43L8 34V14Z', 'none', stroke(K.gold, 2)) +
    line('M13 17L35 36M13 17V36H35', c, 1.4, op(0.55)) +
    path('M17 12H24V31H33V37H17Z', K.gold) +
    path('M17 12H24V31H33V37H17Z', 'none', stroke(K.goldD, 1)),
  // A red A, with a bean for a crossbar.
  apex: (c) =>
    path('M24 6L42 40H33L24 22L15 40H6Z', '#e5403f') +
    path('M24 6L42 40H37L24 15Z', '#b52b2b') +
    ell(24, 32, 7, 4, c, 'transform="rotate(-12 24 32)"') +
    ell(22, 31, 2.2, 1, white, op(0.5) + ' transform="rotate(-12 22 31)"'),
  // A split V, still running: speed lines off the back.
  valorunt: (c) =>
    path('M7 10L22 38H32L13 10Z', c) +
    path('M41 10L32 26H26L35 10Z', c, op(0.85)) +
    line('M4 30H11M3 35H13M6 40H16', white, 1.8, op(0.7)),
  // A chunky F beside a two-week calendar.
  fortnight: (c) =>
    path('M7 8H24V15H15V21H22V28H15V40H7Z', c) +
    path('M7 8H24V15H15V21H22V28H15V40H7Z', 'none', stroke(ink, 1.2) + ' ' + op(0.5)) +
    rr(26, 17, 16, 20, 2.5, white) +
    rect(26, 17, 16, 5, '#e5403f') +
    `<text x="34" y="33.5" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="10" fill="${ink}">14</text>`,
  // A four-point star, folded from paper, with blades for wings.
  starcrafty: (c) =>
    path('M5 26L17 22L24 8L20 24Z', c, op(0.55)) +
    path('M43 26L31 22L24 8L28 24Z', c, op(0.55)) +
    path('M24 8L28.5 21.5L42 26L28.5 30.5L24 44L19.5 30.5L6 26L19.5 21.5Z', white) +
    path('M24 8L28.5 21.5L42 26L24 26Z', '#d7dbe2') +
    line('M24 8V44M6 26H42', ink, 0.8, op(0.3)),
  // A broken ring around a clock face.
  overclock: (c) =>
    path('M24 6A18 18 0 0 1 41 18L35 21A12 12 0 0 0 24 12Z', c) +
    path('M41 30A18 18 0 0 1 12 38L17 33A12 12 0 0 0 36 28Z', c) +
    path('M9 34A18 18 0 0 1 16 8L19 14A12 12 0 0 0 14 30Z', c) +
    circ(24, 24, 8.5, white) +
    line('M24 24V18.5M24 24L28 26', ink, 1.8),
  // A round stone in a gold setting, with a sleepy swirl.
  hearthstoned: (c) =>
    circ(24, 24, 18, K.goldD) +
    circ(24, 24, 15.5, '#6b5a45') +
    circ(24, 24, 15.5, 'none', stroke(K.gold, 1.4)) +
    path('M24 24m-6 0a6 6 0 1 1 6 6a3.5 3.5 0 1 1 -3.5 -3.5a1.5 1.5 0 1 1 1.5 1.5', 'none', stroke(c, 2.2) + ' stroke-linecap="round"') +
    `<text x="35" y="14" font-family="sans-serif" font-weight="900" font-size="7" fill="${white}" opacity="0.8">z</text>`,
  // Two paddles and a ball that is in two places at once.
  pong: (c) =>
    rr(7, 12, 4, 16, 1.5, white) +
    rr(37, 20, 4, 16, 1.5, white) +
    rect(23.3, 6, 1.4, 36, white, op(0.25)) +
    circ(21, 20, 3.2, c) +
    circ(29, 28, 3.2, c, op(0.45)) +
    ell(25, 24, 10, 3.5, 'none', stroke(c, 1) + ' ' + op(0.6) + ' transform="rotate(35 25 24)"'),
  // A ringed planet wearing a VR headset.
  galactic: (c) =>
    circ(24, 25, 13, c) +
    circ(20, 21, 5, white, op(0.18)) +
    ell(24, 27, 21, 5.5, 'none', stroke(white, 1.8) + ' transform="rotate(-14 24 27)"') +
    rr(13, 17, 22, 8, 3, ink) +
    rr(15, 18.5, 8, 5, 2, c, op(0.7)) +
    rr(25, 18.5, 8, 5, 2, c, op(0.7)),
};

/** A game's parody logo on its emblem. Games without a drawing get their initials. */
export function gameLogoSvg(gameId: string, color: string, name = ''): string {
  const draw = LOGOS[gameId];
  const inner = draw
    ? draw(color)
    : `<text x="24" y="30" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="16" fill="${color}">${name.slice(0, 2).toUpperCase().replace(/[^A-Z0-9]/g, '')}</text>`;
  const body = withDepth({ plate: plate(color), emblem: inner, outline: roundedRect(1.5, 1.5, 45, 45, 12) });
  return `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${body}</svg>`;
}

export const GAME_LOGO_IDS = Object.keys(LOGOS);

// ---------------------------------------------------------------------------------------------
// Screens: what each game looks like on a player's monitor, on a 48x30 grid
// ---------------------------------------------------------------------------------------------

/** A small crosshair, centred on the screen unless placed. */
const crosshair = (c: string, x = 24, y = 15) => line(`M${x - 3.5} ${y}H${x - 1.2}M${x + 1.2} ${y}H${x + 3.5}M${x} ${y - 3.5}V${y - 1.2}M${x} ${y + 1.2}V${y + 3.5}`, c, 0.9);
/** A health bar in the bottom-left corner. */
const hp = (c: string) => rect(2, 26, 12, 2, '#000', op(0.5)) + rect(2.4, 26.4, 8, 1.2, c);

const SCREENS: Record<string, Logo> = {
  // Two fighters trading blows on a floating stage, damage percentages underneath.
  smash: (c) =>
    rect(0, 0, 48, 30, '#2d1f57') +
    rect(0, 0, 48, 12, '#3f2c7a') +
    circ(40, 6, 2.5, '#f5efd6') +
    circ(9, 5, 0.6, '#fff') +
    circ(22, 3, 0.6, '#fff') +
    path('M8 19H40L36 23H12Z', '#6a6a8c') +
    rect(8, 18, 32, 1.5, c) +
    path('M12 23L24 28L36 23Z', '#45455f') +
    circ(19, 13, 2.2, '#ff6b6b') +
    path('M17 15H21L22 18H16Z', '#ff6b6b') +
    circ(29, 12, 2.2, '#5aa9ff') +
    path('M27 14H31L32 18H26Z', '#5aa9ff') +
    spark(24, 13, 3, K.gold) +
    rr(2, 25, 9, 4, 1, '#ff6b6b', op(0.85)) +
    rr(37, 25, 9, 4, 1, '#5aa9ff', op(0.85)),
  // The pitch from the stands: a car boosting at the ball, goals at both ends, the clock on top.
  rocket: (c) =>
    rect(0, 0, 48, 30, '#173a5c') +
    path('M0 11H48V30H0Z', '#1f7a43') +
    path('M0 11H48V14H0Z M0 18H48V22H0Z', '#24894c') +
    line('M24 11V30', '#fff', 0.6, op(0.6)) +
    ell(24, 20, 7, 3.5, 'none', `${stroke('#fff', 0.6)} ${op(0.6)}`) +
    rect(0, 14, 3, 8, '#fff', op(0.35)) +
    rect(45, 14, 3, 8, '#fff', op(0.35)) +
    circ(30, 16, 3, '#e8edf5') +
    circ(30, 16, 3, 'none', stroke('#9aa6b8', 0.5)) +
    path('M14 21L17 18H23L25 20V22H14Z', c) +
    circ(16, 22, 1.3, K.ink) +
    circ(23, 22, 1.3, K.ink) +
    path('M14 19.5L8 18L9 21L14 21Z', '#ff8a3d') +
    path('M11 19.5L5 19L7 20.5Z', '#ffe066') +
    rr(18, 1, 12, 5, 1, '#0a0f1c') +
    rect(19.5, 2.5, 3.5, 2, c) +
    rect(25, 2.5, 3.5, 2, '#ff8a3d'),
  // First person on a sandy bombsite: an arch, crates, the scoped rifle and a green crosshair.
  counter: (c) =>
    rect(0, 0, 48, 30, '#d9b77a') +
    rect(0, 0, 48, 9, '#9cc4e4') +
    rect(0, 9, 48, 21, '#c8a46a') +
    path('M14 9H34V24H30V16Q24 11 18 16V24H14Z', '#b18a52') +
    path('M18 24V16Q24 11 30 16V24Z', '#3a2c1a') +
    rect(4, 17, 7, 7, '#a07a44') +
    rect(4, 17, 7, 7, 'none', stroke('#6e5028', 0.6)) +
    rect(0, 24, 48, 6, '#b8925a') +
    path('M32 30L36 22H44L48 24V30Z', '#3b4a2e') +
    rect(36, 21, 8, 2, '#22261c') +
    crosshair('#4dff6a') +
    rr(2, 1, 8, 3, 0.8, '#000', op(0.45)) +
    rect(3, 2, 2, 1, c) +
    hp('#7dff8a'),
  // The lanes from above: three paths, the river, minions meeting mid, a champion and the ability bar.
  lanes: (c) =>
    rect(0, 0, 48, 30, '#26472a') +
    path('M0 30L48 0V6L6 30Z', '#2f5a33') +
    path('M10 0Q20 12 28 16Q38 22 48 22V26Q36 26 26 20Q16 14 6 0Z', '#2a5f88') +
    line('M4 27V4H44M4 27H44V4M4 27L44 4', '#c9b98a', 1.6) +
    circ(4, 27, 2.5, '#5aa9ff') +
    circ(44, 4, 2.5, K.red) +
    circ(21, 17, 1, '#5aa9ff') +
    circ(23, 15.5, 1, '#5aa9ff') +
    circ(26, 14, 1, K.red) +
    circ(28, 12.5, 1, K.red) +
    circ(17, 20, 2, c) +
    circ(17, 20, 2.8, 'none', stroke('#fff', 0.5)) +
    rect(13, 26, 22, 4, '#0d1117') +
    [14, 19, 24, 29].map((x, i) => rr(x, 26.6, 4, 2.8, 0.5, i === 3 ? K.gold : '#3a6fa8')).join(''),
  // A hillside drop with the ring closing in, a supply beacon and the squad's shields.
  apex: (c) =>
    rect(0, 0, 48, 30, '#8cc3e6') +
    path('M0 18Q10 10 20 15Q30 8 48 14V30H0Z', '#6c9a52') +
    path('M0 22Q14 17 26 21Q38 17 48 20V30H0Z', '#5a8443') +
    path('M36 0Q30 15 36 30H48V0Z', '#4fa3ff', op(0.35)) +
    line('M36 0Q30 15 36 30', '#bfe1ff', 0.8) +
    rect(13, 14, 2, 6, '#3a5072') +
    circ(14, 13, 1.6, c) +
    line('M14 13V4', c, 0.6, op(0.5)) +
    crosshair('#fff', 22, 17) +
    [0, 1, 2].map((i) => rect(2, 2 + i * 3, 8, 1.8, i === 0 ? c : '#e8edf5', op(0.85))).join('') +
    path('M38 30L40 24H46L48 26V30Z', '#ff8a3d'),
  // A site in shadow: a neon-lit wall, the planted spike counting down and the agent's ability keys.
  valorunt: (c) =>
    rect(0, 0, 48, 30, '#2a2530') +
    path('M0 0H20L16 24H0Z', '#3a3340') +
    path('M30 0H48V24H34Z', '#342e3a') +
    rect(0, 24, 48, 6, '#1c1a22') +
    rect(20, 4, 10, 1, c, op(0.8)) +
    path('M22 18L25 12L28 18Z', K.red) +
    circ(25, 16, 1, '#fff') +
    circ(25, 15, 5, K.red, op(0.15)) +
    rr(19, 1, 10, 3, 0.8, '#000', op(0.6)) +
    rect(20.5, 2, 7, 1, K.red) +
    circ(24, 15, 0.7, '#7dfff0') +
    [16, 21, 26, 31].map((x, i) => rr(x, 25.5, 4, 3.2, 0.6, i === 3 ? c : '#3a3a48')).join('') +
    hp('#7dfff0'),
  // Sky, a ramp built in a hurry, the storm creeping in and the building hotbar.
  fortnight: (c) =>
    rect(0, 0, 48, 30, '#6ec0ff') +
    path('M0 20Q24 16 48 20V30H0Z', '#58b846') +
    path('M38 0H48V30H34Q40 15 38 0Z', '#8a4fe0', op(0.55)) +
    path('M12 22L22 12H26L16 22Z', '#b78a55') +
    line('M12 22L22 12', '#7d5a30', 0.6) +
    rect(22, 6, 7, 8, '#b78a55') +
    rect(22, 6, 7, 8, 'none', stroke('#7d5a30', 0.6)) +
    line('M22 10H29M25.5 6V14', '#7d5a30', 0.5) +
    circ(9, 18, 1.4, '#ffd27a') +
    rect(8, 19.4, 2, 3, c) +
    crosshair('#fff', 24, 15) +
    [14, 19, 24, 29].map((x, i) => rr(x, 25.5, 4, 3.4, 0.6, i === 0 ? c : '#1c2640', op(0.9))).join(''),
  // A base from above: buildings, a swarm of units, mineral fields and the minimap.
  starcrafty: (c) =>
    rect(0, 0, 48, 30, '#3a3326') +
    ell(36, 8, 12, 7, '#5a2f6a', op(0.6)) +
    [[30, 3], [33, 1], [36, 3], [39, 1.5]].map(([x, y]) => path(`M${x} ${y + 4}L${x + 1.5} ${y}L${x + 3} ${y + 4}Z`, '#5fc8ff')).join('') +
    rr(8, 6, 9, 7, 1, '#7a8494') +
    rect(10, 8, 5, 3, c, op(0.7)) +
    rr(19, 12, 6, 5, 1, '#7a8494') +
    rr(9, 15, 6, 5, 1, '#6a7484') +
    range(9).map((i) => circ(24 + (i % 3) * 3, 20 + Math.floor(i / 3) * 2.5, 0.9, c)).join('') +
    range(5).map((i) => circ(36 + (i % 3) * 2.5, 18 + Math.floor(i / 3) * 3, 0.9, K.red)).join('') +
    rect(0, 22, 9, 8, '#0d0f14') +
    rect(1, 23, 7, 6, '#1d2a1d') +
    circ(3, 27, 0.7, c) +
    circ(6.5, 24.5, 0.7, K.red) +
    rr(36, 0.8, 11, 3, 0.8, '#000', op(0.5)) +
    path('M37 3.2L38 1.4L39 3.2Z', '#5fc8ff'),
  // Escorting the payload down a sunny street, the hero's blaster in hand.
  overclock: (c) =>
    rect(0, 0, 48, 30, '#93cdf2') +
    rect(0, 4, 10, 18, '#e8d6b8') +
    rect(38, 2, 10, 20, '#d9c09a') +
    rect(2, 7, 3, 4, '#5a7aa0') +
    rect(41, 6, 3, 4, '#5a7aa0') +
    rect(0, 22, 48, 8, '#a89a88') +
    rr(16, 15, 14, 6, 1.5, '#4f5566') +
    circ(23, 15, 2.5, c) +
    circ(23, 15, 4, c, op(0.3)) +
    circ(18, 21.5, 1.3, K.ink) +
    circ(28, 21.5, 1.3, K.ink) +
    path('M34 30L37 22H44L46 25L48 26V30Z', '#f1f1f0') +
    rect(37, 23, 7, 1.5, c) +
    rr(17, 1, 14, 3, 1, '#000', op(0.4)) +
    rect(18, 2, 8, 1, c) +
    crosshair('#fff', 24, 11) +
    hp('#ffe066'),
  // The board: two heroes, a row of minions, the hand fanned at the bottom and mana crystals.
  hearthstoned: (c) =>
    rect(0, 0, 48, 30, '#5c3f1f') +
    ell(24, 15, 22, 12, '#c9a46a') +
    ell(24, 15, 22, 12, 'none', stroke('#8a6a3a', 1)) +
    circ(24, 4, 3.4, '#7d5535') +
    circ(24, 4, 3.4, 'none', stroke(K.gold, 0.8)) +
    [12, 18, 24, 30, 36].map((x, i) => rr(x - 2.2, 12, 4.4, 5.6, 1.6, i % 2 ? '#7d5535' : '#4a6b9a')).join('') +
    [14, 19, 24, 29, 34].map((x, i) => rr(x - 2.5, 24 + Math.abs(i - 2) * 0.6, 5, 7, 0.8, '#d9c08a', `transform="rotate(${(i - 2) * 8} ${x} 28)"`)).join('') +
    range(4).map((i) => path(`M${40 + i * 2} 25L${41 + i * 2} 23.5L${42 + i * 2} 25L${41 + i * 2} 26.5Z`, '#3a8bff')).join('') +
    circ(24, 23, 2.6, c) +
    circ(24, 23, 2.6, 'none', stroke(K.gold, 0.8)),
  // Black, a dotted net, two paddles, and a ball that is in two places at once.
  pong: (c) =>
    rect(0, 0, 48, 30, '#05060a') +
    range(7).map((i) => rect(23.5, 1 + i * 4.2, 1, 2.4, '#fff', op(0.5))).join('') +
    rect(4, 8, 1.6, 8, '#fff') +
    rect(42.4, 14, 1.6, 8, '#fff') +
    rect(15, 10, 2, 2, c) +
    rect(31, 18, 2, 2, c, op(0.5)) +
    line('M17 11L31 19', c, 0.4, `${op(0.4)} stroke-dasharray="1 1"`) +
    rect(16, 2, 2.4, 3.5, '#fff', op(0.8)) +
    rect(29.6, 2, 2.4, 3.5, '#fff', op(0.8)),
  // From the cockpit: starfield, a target in the reticle and the instrument frame.
  galactic: (c) =>
    rect(0, 0, 48, 30, '#04060e') +
    range(14).map((i) => circ((i * 17) % 48, (i * 11) % 22, i % 3 ? 0.4 : 0.7, '#fff', op(0.8))).join('') +
    circ(36, 7, 4, '#6a4a9a') +
    ell(36, 7, 6.5, 1.2, 'none', stroke('#b49ae0', 0.5)) +
    path('M21 13L27 13L24 16Z', '#c9ced8') +
    path('M20 14L22 13L22 15Z M28 14L26 13L26 15Z', '#8f9097') +
    circ(24, 14, 5, 'none', `${stroke(c, 0.7)}`) +
    line('M24 7V9M24 19V21M17 14H19M29 14H31', c, 0.7) +
    path('M0 30L8 20H40L48 30Z', '#0d1a14') +
    path('M0 30L8 20H40L48 30', 'none', `${stroke(c, 0.8)} ${op(0.7)}`) +
    rect(12, 24, 6, 2, c, op(0.7)) +
    rect(30, 24, 6, 2, c, op(0.4)),
};

/**
 * What a player of this game has on their monitor, as svg markup on a 48x30 grid (wrap it in an svg
 * with that viewBox). Games without a screen get an empty string, so the plain screen shows instead.
 */
export function gameScreenSvg(gameId: string, color: string): string {
  return SCREENS[gameId]?.(color) ?? '';
}

export const GAME_SCREEN_IDS = Object.keys(SCREENS);
