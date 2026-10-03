/**
 * The room each team plays in on the Teams tab. The walls and floor follow the org's house (a
 * garage, a flat, a gaming house, a glass-walled HQ, a campus arena, an orbital station), and every
 * game dresses its room with props that parody it: a sniper rifle on the wall and a bomb under the
 * desk for Counter-Stroke, poros for League of Lanes, a loot llama for Fortnight.
 *
 * Built only from constants, numbers and validated hex colours, so the markup is safe for {@html}.
 */
import { K, circ, ell, f, group, line, op, path, rect, rr, spark, stroke, type Art } from './artKit';
import { mix } from './color';

// ---------------------------------------------------------------------------------------------
// Walls: a 480x240 tile, repeated across the room
// ---------------------------------------------------------------------------------------------

const W = 480;
const H = 240;

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

function garage(p: string): string {
  let s = rect(0, 0, W, H, mix('#3a3a3e', p, 0.05));
  // Breeze blocks.
  for (let r = 0; r < 8; r++) {
    const off = r % 2 ? 30 : 0;
    for (let k = -1; k < 9; k++) s += rect(k * 60 + off + 1, r * 30 + 1, 58, 28, '#000', op(0.07));
  }
  // A roller door, half up.
  s += rect(40, 20, 190, 200, '#2c2f35') + range(9).map((i) => rect(40, 20 + i * 14, 190, 11, '#4a4f58') + rect(40, 31 + i * 14, 190, 2, '#25282d')).join('');
  s += rect(40, 146, 190, 74, '#121316') + rect(36, 16, 198, 6, '#1d1f23');
  // Pegboard with tools.
  s += rect(290, 40, 140, 96, '#8a6c4a') + range(6).map((r) => range(13).map((k) => circ(298 + k * 10.5, 48 + r * 15, 1.1, '#5c4630')).join('')).join('');
  s += line('M312 60V104M306 60H318', '#bcc0c6', 3) + line('M340 58L362 100', '#bcc0c6', 3) + rr(372, 62, 30, 9, 2, K.red) + line('M378 71V96', K.greyD, 4) + circ(414, 80, 9, 'none', stroke('#bcc0c6', 3));
  // A bare bulb.
  s += line('M260 0V44', '#18181b', 2) + circ(260, 52, 26, '#ffe9a3', op(0.12)) + circ(260, 52, 8, '#ffe9a3');
  return s;
}

function flat(p: string): string {
  const a = mix('#3b3540', p, 0.12);
  const b = mix('#332e38', p, 0.12);
  let s = rect(0, 0, W, H, a) + range(12).map((i) => rect(i * 40, 0, 20, H, b)).join('');
  // Window onto the street at night.
  s += rr(56, 30, 150, 120, 3, '#5b4a3f') + rect(64, 38, 134, 104, '#121633');
  s += [[70, 96, 22, 46], [96, 80, 18, 62], [118, 104, 30, 38], [152, 88, 22, 54], [178, 108, 20, 34]].map(([x, y, w, h]) => rect(x, y, w, h, '#0b0e22') + rect(x + 4, y + 8, 4, 5, '#ffd98a', op(0.7))).join('');
  s += circ(176, 56, 9, '#f5efd6', op(0.8)) + line('M131 38V142M64 90H198', '#5b4a3f', 5) + rect(50, 148, 162, 8, '#6d5a4c');
  // A framed print and a shelf of figurines.
  s += rect(272, 46, 64, 80, '#20202a') + rect(278, 52, 52, 68, mix('#3c4a6b', p, 0.35)) + path('M278 120L300 86L314 104L322 94L330 120Z', '#1a2234');
  s += rect(372, 100, 84, 6, '#6d5a4c') + rr(380, 82, 12, 18, 3, K.gold) + rr(400, 78, 12, 22, 3, '#7fc7ff') + rr(420, 84, 12, 16, 3, K.red) + rr(440, 80, 10, 20, 3, '#9dff3b');
  s += rect(0, 228, W, 12, '#2a242e');
  return s;
}

function gamingHouse(p: string): string {
  let s = rect(0, 0, W, H, mix('#26242c', p, 0.08));
  // Acoustic foam in the team colour.
  for (let r = 0; r < 4; r++) for (let k = 0; k < 5; k++) {
    const x = 262 + k * 34;
    const y = 30 + r * 34;
    s += rect(x, y, 30, 30, mix('#2b2932', p, 0.25)) + path(`M${x} ${y}L${x + 15} ${y + 15}L${x + 30} ${y}Z`, '#fff', op(0.05)) + path(`M${x} ${y + 30}L${x + 15} ${y + 15}L${x + 30} ${y + 30}Z`, '#000', op(0.12));
  }
  // Window with blinds half down.
  s += rr(40, 28, 160, 124, 4, '#2a2a2f') + rect(48, 36, 144, 108, '#101330') + circ(160, 70, 12, '#f5f0d8', op(0.85));
  s += range(5).map((i) => rect(48, 36 + i * 9, 144, 6, '#3a3a42')).join('');
  // An LED strip.
  s += rect(0, 8, W, 3, p, op(0.55)) + rect(0, 222, W, 3, p, op(0.35));
  return s;
}

function teamHq(p: string): string {
  let s = rect(0, 0, W, H, '#0c1024') + rect(0, 150, W, 90, p, op(0.06));
  s += range(9).map((i) => rect(i * 56 - 8, 90 + ((i * 47) % 50), 50, 200, mix('#202850', p, 0.12), op(0.8))).join('');
  range(7).forEach((i) => {
    const x = i * 72 + ((i * 13) % 14) - 6;
    const top = 60 + ((i * 53) % 70);
    const w = 50 + ((i * 29) % 20);
    s += rect(x, top, w, H - top, '#0a0f26');
    for (let r = 0; r < 9; r++) for (let k = 0; k < 4; k++) {
      const lit = (i * 7 + r * 5 + k * 3) % 9;
      if (lit < 3) s += rect(x + 6 + k * 11, top + 8 + r * 14, 5, 7, lit === 0 ? p : '#ffd98a', op(lit === 0 ? 0.55 : 0.6));
    }
  });
  s += path('M30 0L90 0L20 240L-40 240Z M300 0L330 0L260 240L230 240Z', '#fff', op(0.035));
  s += range(5).map((i) => rect(i * 120 - 2, 0, 4, H, '#fff', op(0.08))).join('') + rect(0, 0, W, 6, '#1a1f33');
  return s;
}

function campus(p: string): string {
  let s = rect(0, 0, W, H, '#0b0d14');
  // Stadium lights.
  s += range(6).map((i) => circ(40 + i * 80, 16, 9, '#fffbe0') + circ(40 + i * 80, 16, 22, '#fffbe0', op(0.1))).join('');
  // The big screen.
  s += rr(140, 40, 200, 104, 6, '#05060a') + rect(148, 48, 184, 88, mix('#10162a', p, 0.35));
  s += path('M160 120L200 84L232 108L262 72L320 120Z', p, op(0.45)) + rect(148, 48, 184, 88, 'none', `${stroke(p, 2)} ${op(0.6)}`);
  s += rect(222, 144, 36, 18, '#14161d');
  // Banners.
  s += path('M40 44H96V110L68 96L40 110Z', mix(p, '#101018', 0.6)) + path('M384 44H440V110L412 96L384 110Z', mix(p, '#101018', 0.6));
  s += path('M56 60L68 74L80 60', 'none', `${stroke(p, 3)} ${op(0.7)}`) + path('M400 60L412 74L424 60', 'none', `${stroke(p, 3)} ${op(0.7)}`);
  // The crowd.
  s += rect(0, 168, W, 72, '#07080c') + range(40).map((i) => circ(6 + i * 12.2, 176 + ((i * 7) % 3) * 4, 6, '#14161f')).join('');
  s += range(40).map((i) => (i % 5 === 0 ? circ(6 + i * 12.2, 168 + ((i * 7) % 3) * 4, 2, p, op(0.7)) : '')).join('');
  return s;
}

function orbital(p: string): string {
  let s = rect(0, 0, W, H, '#14161a');
  s += range(4).map((i) => rect(i * 120 + 2, 4, 116, 232, '#191b20') + circ(i * 120 + 10, 12, 2, '#2c2f36') + circ(i * 120 + 110, 12, 2, '#2c2f36')).join('');
  // Portholes onto space.
  [[120, 100], [360, 100]].forEach(([cx, cy], i) => {
    s += circ(cx, cy, 70, '#2a2d33');
    let view = circ(cx, cy, 60, '#04050a');
    view += range(16).map((k) => circ(cx - 50 + ((k * 37) % 100), cy - 50 + ((k * 53) % 100), k % 4 ? 0.9 : 1.6, '#fff', op(0.8))).join('');
    if (i === 0) view += circ(cx - 10, cy + 110, 80, mix('#2a4a8a', p, 0.3)) + circ(cx - 10, cy + 110, 80, 'none', `${stroke('#9fd0ff', 3)} ${op(0.35)}`);
    else view += circ(cx + 18, cy - 12, 16, '#d9a441') + ell(cx + 18, cy - 12, 28, 5, 'none', stroke('#e8d2a0', 2));
    s += `<clipPath id="porthole${i}"><circle cx="${cx}" cy="${cy}" r="60"/></clipPath>` + group(view, `clip-path="url(#porthole${i})"`);
    s += circ(cx, cy, 60, 'none', stroke('#3a3e46', 6));
  });
  s += rect(0, 200, W, 4, p, op(0.4));
  return s;
}

const WALLS = [garage, flat, gamingHouse, teamHq, campus, orbital];

const wallCache = new Map<string, string>();

/** The room's wall for the org's house level, as a CSS background (a tile repeated across the room). */
export function roomWallBackground(level: number, primary: string): string {
  const lv = Math.max(0, Math.min(WALLS.length - 1, level));
  const key = `${lv}|${primary}`;
  const hit = wallCache.get(key);
  if (hit) return hit;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${WALLS[lv](primary)}</svg>`;
  const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  wallCache.set(key, url);
  return url;
}

/** Floor colours per house level: concrete, floorboards, carpet, polished stone, arena, deck plating. */
export const ROOM_FLOORS: { a: string; b: string; seam: string }[] = [
  { a: '#3b3b3f', b: '#28282c', seam: 'rgba(0,0,0,0.25)' },
  { a: '#4a3527', b: '#30231a', seam: 'rgba(0,0,0,0.3)' },
  { a: '#2e2433', b: '#1c1720', seam: 'rgba(0,0,0,0.2)' },
  { a: '#262a33', b: '#15181d', seam: 'rgba(255,255,255,0.05)' },
  { a: '#1d2430', b: '#11151d', seam: 'rgba(255,255,255,0.06)' },
  { a: '#22262d', b: '#121418', seam: 'rgba(255,255,255,0.08)' },
];

export function roomFloor(level: number): { a: string; b: string; seam: string } {
  return ROOM_FLOORS[Math.max(0, Math.min(ROOM_FLOORS.length - 1, level))];
}

// ---------------------------------------------------------------------------------------------
// Props: four per game on a 48x48 grid, two hung on the wall and two standing on the floor
// ---------------------------------------------------------------------------------------------

export interface GameProps {
  wallL: Art;
  wallR: Art;
  floorL: Art;
  floorR: Art;
}

const frame = (inner: string, bg: string) => rr(4, 6, 40, 36, 2, '#18181c') + rect(7, 9, 34, 30, bg) + inner;
const floorShadow = (rx = 16) => ell(24, 45, rx, 2.4, '#000', op(0.4));

/** A fluffy, wide-eyed lane creature. Every jungler has fed one. */
const poro = (dx: number, scale: number, tongue: boolean) =>
  group(
    path('M10 18L7 9L14 15Z M38 18L41 9L34 15Z', '#c9b896') +
      ell(24, 30, 17, 13, '#f4f4f6') +
      path('M8 30Q6 20 14 18Q12 26 8 30Z M40 30Q42 20 34 18Q36 26 40 30Z', '#e2e2ea') +
      circ(18, 26, 4.2, K.ink) +
      circ(30, 26, 4.2, K.ink) +
      circ(19.3, 24.8, 1.4, '#fff') +
      circ(31.3, 24.8, 1.4, '#fff') +
      ell(24, 32, 3, 1.6, '#c96f8a') +
      (tongue ? path('M22 33Q24 40 27 33Z', '#ff7d9c') : '') +
      ell(16, 43, 4, 2, '#e2e2ea') +
      ell(32, 43, 4, 2, '#e2e2ea'),
    `transform="translate(${dx} ${f(48 - 48 * scale)}) scale(${scale})"`,
  );

const crate = (x: number, y: number, s: number) =>
  rect(x, y, s, s, '#b2864f') + rect(x, y, s, s, 'none', stroke('#7d5a30', 1.6)) + line(`M${x} ${y}L${x + s} ${y + s}M${x + s} ${y}L${x} ${y + s}`, '#8f6a3b', 1.4) + rect(x + 1, y + s * 0.45, s - 2, s * 0.1, '#8f6a3b');

const GAME_PROPS: Record<string, GameProps> = {
  // Smash Siblings: a fight poster, a floating platform, the glowing smash orb and an item crate.
  smash: {
    wallL: () =>
      frame(
        circ(17, 22, 3.4, '#ff6b6b') + path('M14 26H20L22 36H12Z', '#ff6b6b') + circ(31, 22, 3.4, '#5aa9ff') + path('M28 26H34L36 36H26Z', '#5aa9ff') + spark(24, 22, 6, K.gold),
        '#2b1f3d',
      ),
    wallR: () => frame(rect(7, 9, 34, 30, '#3a2a63') + circ(32, 16, 3, '#f5efd6') + path('M12 30H36L32 34H16Z', '#6d6d80') + rect(16, 27, 16, 3, '#9a9ab0'), '#3a2a63'),
    floorL: (c) =>
      floorShadow(10) +
      circ(24, 24, 15, c, op(0.25)) +
      circ(24, 24, 11, '#fff') +
      path('M24 13A11 11 0 0 1 35 24H24Z', '#ff6b6b') +
      path('M35 24A11 11 0 0 1 24 35V24Z', K.gold) +
      path('M24 35A11 11 0 0 1 13 24H24Z', '#5aa9ff') +
      path('M13 24A11 11 0 0 1 24 13V24Z', '#9dff3b') +
      circ(24, 24, 11, 'none', stroke(K.ink, 2)) +
      line('M24 13V35M13 24H35', K.ink, 2),
    floorR: () => floorShadow(13) + crate(12, 20, 24) + path('M21 28Q21 25 24 25Q27 25 27 28Q27 30 24 31V33', 'none', `${stroke('#fff3c4', 2.2)} stroke-linecap="round"`) + circ(24, 36, 1.3, '#fff3c4'),
  },
  // Rocket Soccar: a goal on the wall, a flipping-car poster, the giant ball and a boost pad.
  rocket: {
    wallL: (c) =>
      rect(5, 10, 38, 28, '#0d1a2a') +
      Array.from({ length: 7 }, (_, i) => line(`M${8 + i * 5.3} 12V36`, '#cfe7ff', 0.6, op(0.5))).join('') +
      Array.from({ length: 5 }, (_, i) => line(`M7 ${14 + i * 5.3}H41`, '#cfe7ff', 0.6, op(0.5))).join('') +
      rect(5, 10, 38, 28, 'none', stroke(c, 2.5)),
    wallR: (c) => frame(path('M12 32L18 26H30L35 30L36 34H12Z', c) + circ(16, 34, 2.5, K.ink) + circ(32, 34, 2.5, K.ink) + path('M10 30L6 32L10 34Z', '#ff8a3d') + circ(31, 16, 5, '#e8edf5') + circ(31, 16, 5, 'none', stroke('#9aa6b8', 1)), '#1b2a44'),
    floorL: (c) =>
      floorShadow(15) +
      circ(24, 28, 15, '#e8edf5') +
      path('M24 18L29 21.5L27 27.5H21L19 21.5Z', '#3a4458') +
      path('M14 30L19 27.5L21 33L17 37Z M34 30L29 27.5L27 33L31 37Z M24 13.5L24 18', '#3a4458') +
      circ(24, 28, 15, 'none', `${stroke(c, 1.5)} ${op(0.6)}`),
    floorR: () => ell(24, 40, 18, 6, '#ff8a3d', op(0.3)) + ell(24, 39, 13, 4, '#ffb46b') + ell(24, 38.5, 8, 2.4, '#fff3c4') + path('M24 20Q30 28 26 34Q24 30 22 34Q18 28 24 20Z', '#ff8a3d', op(0.8)),
  },
  // Counter-Stroke: the big green sniper rifle on a wall rack, the "A" site sign, crates and the bomb.
  counter: {
    wallL: () =>
      rect(4, 14, 3, 20, '#3d3e45') +
      rect(41, 14, 3, 20, '#3d3e45') +
      path('M3 26H14L16 24H34L36 22H46V25H37L35 28H18L16 31H12L10 34H6Z', '#4f6b3a') +
      rect(18, 19, 12, 4, K.ink) +
      circ(17.5, 21, 2.5, K.ink) +
      circ(30.5, 21, 2.5, K.ink) +
      circ(30.5, 21, 1.1, '#7fd3ff') +
      rect(36, 23.5, 10, 1.4, '#2a2b30'),
    wallR: () => rr(8, 8, 32, 32, 2, '#d98a2a') + rr(10, 10, 28, 28, 1, 'none', stroke('#7a4a12', 1.2)) + path('M17 33L23 14H26L32 33H28L26.6 28H22.4L21 33Z M23.3 25H25.7L24.5 20.5Z', '#2a1a08'),
    floorL: () => floorShadow(18) + crate(6, 24, 20) + crate(24, 28, 16) + crate(14, 8, 16),
    floorR: () =>
      floorShadow(14) +
      rr(10, 26, 28, 16, 2, '#6d6151') +
      rect(10, 30, 28, 3, '#3b3328') +
      rr(15, 20, 18, 9, 1.5, '#2a2b30') +
      Array.from({ length: 6 }, (_, i) => rect(17 + (i % 3) * 5, 21.5 + Math.floor(i / 3) * 3.5, 3.5, 2.4, '#8f9097')).join('') +
      circ(35, 23, 2, K.red) +
      circ(35, 23, 4, K.red, op(0.25)) +
      line('M12 26Q14 18 20 20M36 26Q38 30 34 34', '#e0474c', 1.2) +
      line('M13 27Q16 22 22 21', '#4a90e2', 1.2),
  },
  // League of Lanes: the lane map, the crystal at the heart of the base, and two poros.
  lanes: {
    wallL: (c) =>
      frame(
        rect(7, 9, 34, 30, '#1f3b22') +
          line('M10 36V12H38', '#c9b98a', 2) +
          line('M10 36H38V12', '#c9b98a', 2) +
          line('M10 36L38 12', '#c9b98a', 2) +
          line('M7 18Q22 22 38 38', '#3a6fa8', 2.2, op(0.8)) +
          circ(10, 36, 2.4, c) +
          circ(38, 12, 2.4, K.red),
        '#1f3b22',
      ),
    wallR: (c) => rr(12, 38, 24, 6, 1.5, '#4a3d2e') + path('M24 6L32 20L24 36L16 20Z', c, op(0.85)) + path('M24 6L32 20L24 22Z', '#fff', op(0.35)) + circ(24, 21, 13, c, op(0.15)),
    floorL: () => poro(0, 1, true),
    floorR: () => poro(6, 0.72, false) + path('M4 40L10 34L14 40Z', '#d98a2a') + rect(4, 40, 10, 4, '#b06a1a'),
  },
  // Apex Legumes: the champion squad of heroic vegetables, the closing ring, a supply crate and a carrot hero.
  apex: {
    wallL: () =>
      frame(
        path('M13 36L16 18L19 36Z', '#ff8a3d') +
          path('M15 18Q16 13 17 18', 'none', stroke('#4caf6a', 2)) +
          ell(24, 28, 4, 8, '#7ccf5a') +
          circ(22.6, 25, 1.3, '#a6e88a') +
          circ(25.4, 29, 1.3, '#a6e88a') +
          circ(33, 24, 5, '#4caf6a') +
          rect(32, 28, 2, 8, '#8fbf5a') +
          rect(10, 14, 28, 3, '#e0474c', op(0.8)),
        '#2a2f3d',
      ),
    wallR: (c) => frame(rect(7, 9, 34, 30, '#3d5a3a') + circ(24, 24, 11, 'none', stroke(c, 2)) + circ(28, 22, 5, 'none', `${stroke('#fff', 1.4)} stroke-dasharray="2 1.5"`) + circ(28, 22, 1.4, '#fff'), '#3d5a3a'),
    floorL: (c) => floorShadow(17) + rr(7, 22, 34, 20, 2, '#2c3e5a') + rect(7, 28, 34, 3, c) + rr(19, 30, 10, 6, 1, '#16202f') + circ(11, 25, 1.4, c) + circ(37, 25, 1.4, c) + path('M7 22L13 16H35L41 22Z', '#3a5072'),
    floorR: () =>
      floorShadow(9) +
      path('M18 44L24 14L30 44Z', '#ff8a3d') +
      line('M21 24H27M20 30H28M19 36H29', '#d96a1d', 1.2) +
      path('M22 14Q20 6 24 4Q22 9 24 14Q26 9 30 6Q28 11 26 14Z', '#4caf6a') +
      rect(19, 19, 10, 3, '#e0474c') +
      circ(22, 23, 1.2, K.ink) +
      circ(26, 23, 1.2, K.ink),
  },
  // Valorunt: an agent with fire in their hands, a neon ability sign, the planted spike and smoke canisters.
  valorunt: {
    wallL: () => frame(path('M16 38Q16 24 24 22Q32 24 32 38Z', '#2a2b30') + circ(24, 18, 5, '#2a2b30') + path('M21 16H27L24 13Z', '#1a1b20') + circ(14, 28, 3.5, '#ff6a3d') + circ(34, 28, 3.5, '#ff6a3d') + circ(14, 28, 6, '#ff6a3d', op(0.25)), '#3a1f28'),
    wallR: (c) => rr(8, 10, 32, 28, 4, '#0e0e12') + path('M16 30L24 16L32 30Z', 'none', `${stroke(c, 2.2)}`) + circ(24, 25, 2.5, c) + path('M16 30L24 16L32 30Z', 'none', `${stroke(c, 6)} ${op(0.2)}`),
    floorL: (c) =>
      floorShadow(10) +
      rr(16, 18, 16, 26, 3, '#2c2d33') +
      rr(18, 22, 12, 4, 1, '#16161a') +
      rect(18, 30, 12, 2, c, op(0.8)) +
      path('M16 18L20 10H28L32 18Z', '#3d3e45') +
      circ(24, 13, 3, c) +
      circ(24, 13, 7, c, op(0.25)),
    floorR: () => floorShadow(13) + rr(12, 24, 9, 20, 3, '#5a6270') + rect(12, 28, 9, 2, '#e8edf5') + rr(26, 22, 9, 22, 3, '#5a6270') + rect(26, 26, 9, 2, '#e8edf5') + ell(30, 14, 9, 6, '#c9ced8', op(0.35)) + ell(36, 9, 6, 4, '#c9ced8', op(0.25)),
  },
  // Fortnight: a wall built in 0.8 seconds, the victory crown banner, a loot llama and a slurpy barrel.
  fortnight: {
    wallL: () => rect(6, 8, 36, 32, '#b78a55') + [8, 16, 24, 32].map((y) => rect(6, y + 7, 36, 1.4, '#7d5a30')).join('') + line('M18 8V15M30 15V23M14 23V31M34 31V40', '#7d5a30', 1.2) + rect(6, 8, 36, 32, 'none', stroke('#5c3f1f', 1.6)),
    wallR: (c) => path('M10 8H38V36L24 30L10 36Z', mix(c, '#000', 0.15)) + path('M15 22L18 14L24 19L30 14L33 22Z', K.gold) + rect(15, 22, 18, 3, K.goldD),
    floorL: () =>
      floorShadow(13) +
      rr(12, 22, 22, 13, 4, '#9a5cff') +
      rr(28, 10, 8, 16, 3, '#9a5cff') +
      path('M28 10L30 4L32 10Z M32 10L35 5L36 11Z', '#9a5cff') +
      circ(33.5, 15, 1.2, K.ink) +
      rect(14, 35, 3.5, 9, '#7d3fe0') +
      rect(28, 35, 3.5, 9, '#7d3fe0') +
      spark(20, 27, 3, K.gold) +
      spark(27, 30, 2, '#7fd3ff') +
      line('M12 26Q8 24 9 20', '#ff6bd6', 2),
    floorR: () => floorShadow(11) + rr(14, 16, 20, 28, 4, '#2c7fd6') + rr(17, 12, 14, 6, 2, '#1d5aa0') + rect(14, 24, 20, 4, '#7fd3ff', op(0.8)) + path('M20 32Q24 28 28 32Q24 38 20 32Z', '#7fd3ff'),
  },
  // StarCrafty: an emblem poster of the three races, a 400 APM readout, mineral crystals and a gas canister.
  starcrafty: {
    wallL: (c) => frame(path('M11 30L15 16L19 30Z', '#4a90e2') + path('M22 30Q24 16 26 30Z', K.gold) + circ(33, 23, 5, '#9a5cff') + path('M30 28L33 34L36 28Z', '#9a5cff') + rect(9, 34, 30, 2, c, op(0.6)), '#161a2a'),
    wallR: (c) => rr(6, 14, 36, 20, 3, '#0a0b10') + path('M10 28L13 20L16 28 M11.2 25H14.8 M19 28V20H22.5Q24.5 20 24.5 22Q24.5 24 22.5 24H19 M28 28V20L31.5 25L35 20V28', 'none', `${stroke(c, 1.6)} stroke-linecap="round" stroke-linejoin="round"`) + rect(6, 14, 36, 20, 'none', `${stroke(c, 1)} ${op(0.5)}`),
    floorL: () =>
      floorShadow(16) +
      path('M12 44L15 26L19 44Z', '#5fc8ff') +
      path('M18 44L23 18L28 44Z', '#7fd3ff') +
      path('M27 44L31 28L35 44Z', '#5fc8ff') +
      path('M23 18L25 30L23 44', 'none', stroke('#e8f6ff', 0.8)) +
      circ(23, 30, 12, '#7fd3ff', op(0.12)),
    floorR: () => floorShadow(12) + rr(14, 18, 20, 26, 3, '#3a4a3a') + rect(14, 24, 20, 3, '#4caf6a') + rr(18, 12, 12, 7, 2, '#2c3a2c') + ell(26, 9, 6, 4, '#9dff3b', op(0.35)) + ell(20, 5, 4, 3, '#9dff3b', op(0.25)),
  },
  // Overclock: a hero poster, a wall health pack, the payload and a hammer.
  overclock: {
    wallL: () => frame(circ(24, 22, 9, '#c9ced8') + rect(17, 20, 14, 4, '#ff8a3d') + rect(21, 30, 6, 6, '#8f9097') + circ(21, 22, 1.2, '#fff') + circ(27, 22, 1.2, '#fff'), '#2a3a52'),
    wallR: () => rr(10, 12, 28, 24, 3, '#f1f1f0') + rect(21, 16, 6, 16, '#e0474c') + rect(16, 21, 16, 6, '#e0474c') + rr(10, 12, 28, 24, 3, 'none', stroke('#9ea2a8', 1.2)),
    floorL: (c) => floorShadow(18) + rr(6, 22, 36, 16, 6, '#3d4250') + rr(12, 16, 24, 10, 4, '#4f5566') + circ(24, 21, 4, c) + circ(24, 21, 8, c, op(0.25)) + circ(12, 39, 4, K.ink) + circ(36, 39, 4, K.ink) + circ(24, 39, 4, K.ink),
    floorR: () => floorShadow(10) + rect(22, 16, 4, 28, '#7d5535') + rr(12, 8, 24, 12, 2, '#8f9097') + rect(12, 12, 24, 3, '#c9ced8'),
  },
  // Hearthstoned: a framed card, a tavern sign, a stack of card packs and a mug on a barrel.
  hearthstoned: {
    wallL: () => rr(12, 4, 24, 36, 3, '#5c3f1f') + rr(14, 6, 20, 32, 2, '#d9c08a') + rect(16, 9, 16, 12, '#4a6b9a') + circ(16, 8, 4, '#3a6bff') + rect(16, 24, 16, 1.2, '#8a6a3a') + rect(16, 27, 12, 1.2, '#8a6a3a'),
    wallR: () => line('M14 4V12M34 4V12', '#3d3e45', 1.4) + rr(8, 12, 32, 22, 3, '#8a5a2e') + path('M18 18H28V30H18Z', K.gold) + path('M28 21H31V27H28', 'none', stroke(K.gold, 2)) + rect(18, 18, 10, 3, '#fff3c4'),
    floorL: (c) => floorShadow(15) + rr(10, 30, 20, 13, 2, '#5c3f1f') + rr(14, 24, 20, 13, 2, '#7d5535') + rr(18, 18, 20, 13, 2, '#8a5a2e') + circ(28, 24, 3, c) + spark(28, 24, 2, '#fff'),
    floorR: () => floorShadow(13) + rr(13, 26, 22, 18, 5, '#7d5535') + rect(13, 30, 22, 2, '#3d3e45') + rect(13, 38, 22, 2, '#3d3e45') + rr(18, 14, 11, 12, 2, '#d9a441') + path('M29 17H32V23H29', 'none', stroke('#d9a441', 2)) + ell(23.5, 14, 6, 2.5, '#fff3e0'),
  },
  // Quantum Pong: a scoreboard, a paddle on the wall, a little cabinet and a ball in several places at once.
  pong: {
    wallL: (c) => rr(6, 12, 36, 22, 2, '#08090c') + path('M12 18H17V28H12 M13 23H17', 'none', stroke(c, 1.6)) + rect(22.5, 20, 2, 2, c) + rect(22.5, 25, 2, 2, c) + path('M29 18H35V23H29V28H35', 'none', stroke(c, 1.6)),
    wallR: () => rr(20, 6, 8, 30, 2, '#e8edf5') + rect(22, 36, 4, 6, '#9ea2a8') + line('M14 8V40', '#3d3e45', 1, op(0.5)),
    floorL: (c) => floorShadow(12) + rr(14, 10, 20, 34, 2, '#2c2d33') + rect(16, 13, 16, 12, '#0a0b10') + rect(18, 15, 1.6, 6, c) + rect(30, 17, 1.6, 6, c) + rect(24, 19, 1.6, 1.6, c) + circ(20, 32, 2, K.red) + circ(27, 32, 2, '#3a6bff'),
    floorR: (c) => rect(26, 22, 10, 10, c) + rect(16, 24, 8, 8, c, op(0.45)) + rect(8, 26, 6, 6, c, op(0.2)) + line('M38 27H44', c, 1.4, op(0.6)) + floorShadow(8),
  },
  // Galactic Siege VR: a hologram planet, a starship poster, a VR headset on its stand and a space helmet.
  galactic: {
    wallL: (c) => ell(24, 40, 10, 3, c, op(0.4)) + path('M16 39L20 18H28L32 39Z', c, op(0.12)) + circ(24, 18, 9, c, op(0.35)) + ell(24, 18, 14, 3, 'none', `${stroke(c, 1)} ${op(0.6)}`),
    wallR: () => frame(path('M10 26L26 20L38 24L26 28Z', '#c9ced8') + path('M20 21L16 15L24 20Z M20 27L16 33L24 28Z', '#8f9097') + path('M38 24L44 23L44 25Z', '#ff8a3d'), '#0d1020'),
    floorL: (c) => floorShadow(9) + rect(22, 26, 4, 18, '#3d3e45') + rr(13, 14, 22, 12, 5, '#2c2d33') + rr(15, 17, 18, 6, 3, c, op(0.7)) + rect(19, 23, 10, 2, '#1d1d21'),
    floorR: (c) => floorShadow(12) + circ(24, 26, 14, '#e8edf5') + rr(14, 20, 20, 13, 6, '#16202f') + path('M16 22Q20 20 24 22', 'none', `${stroke(c, 1.6)} ${op(0.8)}`) + rect(14, 37, 20, 6, '#c9ced8'),
  },
};

const propCache = new Map<string, string>();

/** One of a game's four room props as a complete inline svg, drawn in the game's colour. */
export function roomPropSvg(gameId: string, slot: keyof GameProps, color: string): string {
  const key = `${gameId}|${slot}|${color}`;
  const hit = propCache.get(key);
  if (hit !== undefined) return hit;
  const art = GAME_PROPS[gameId]?.[slot];
  const out = art ? `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${art(color)}</svg>` : '';
  propCache.set(key, out);
  return out;
}

/** Every game with room props, so a test can check none is missing. */
export const ROOM_PROP_GAMES = Object.keys(GAME_PROPS);

