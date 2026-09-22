import { K, circ, ell, line, op, path, rect, rr, stroke } from './artKit';
import { roundedRect, withDepth } from './logoDepth';

/**
 * Parody logos for the twelve games, on a 48x48 emblem. Each one riffs on the shape of the game it
 * sends up (a split circle, a hexagon with a gold L, a broken ring) with a joke in the name worked in:
 * a legume in the Apex A, a calendar for Fortnight, a clock for Overclock. Colours come from the game
 * data, so the markup is safe to render with {@html}.
 */
type Logo = (c: string) => string;

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
