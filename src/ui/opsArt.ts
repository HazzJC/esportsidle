import { K, circ, ell, line, op, path, rect, rr, stroke } from './artKit';

/**
 * The HQ's operations, drawn the way Cookie Clicker draws its buildings: every operation has its own
 * little world, a strip of scenery, and every unit you own is a sprite standing in it. Sprites are
 * 24x24; scenes are 400x56 strips with the ground at y=46. Accents take the operation's colour `c`.
 * Output is built only from constants here, so it is safe to render with {@html}.
 */

// ---------------------------------------------------------------------------
// Sprites
// ---------------------------------------------------------------------------
type Sprite = (c: string) => string;

const SPRITES: Record<string, Sprite> = {
  // A player hunched at a glowing monitor.
  grinder: (c) =>
    rr(3, 5, 12, 9, 1, K.black2) +
    rect(4, 6, 10, 7, c, op(0.85)) +
    rect(8, 14, 2, 3, K.black3) +
    rect(3, 17, 12, 1.5, K.wood) +
    circ(18.5, 9, 3.2, '#e8b893') +
    path('M14 22Q14 13.5 18.5 13.5Q23 13.5 23 22Z', K.black3) +
    path('M15.2 7.2Q18.5 3.8 21.8 7.2', 'none', stroke(K.black, 1.3)),
  // A streamer under a ring light, live.
  streamer: (c) =>
    circ(12, 9, 7, 'none', stroke(c, 1.6)) +
    circ(12, 9.5, 3.4, '#e8b893') +
    path('M8.5 9Q12 4 15.5 9', 'none', stroke(K.black, 1.4)) +
    path('M6 22Q6 14 12 14Q18 14 18 22Z', c, op(0.9)) +
    circ(20, 4, 1.5, K.red),
  // A camera on a tripod.
  creator: (c) =>
    rr(5, 6, 12, 8, 1.5, K.black2) +
    circ(11, 10, 3, c) +
    circ(11, 10, 1.3, K.ink) +
    path('M17 7.5L21 5.5V14.5L17 12.5Z', K.black3) +
    line('M11 14L6 22M11 14L16 22M11 14V22', K.greyD, 1.2),
  // A little café with a striped awning.
  cafe: (c) =>
    rect(4, 9, 16, 13, K.beige) +
    path('M3 6H21L20 10H4Z', c) +
    line('M7 6L6.6 10M11 6V10M15 6L15.4 10', '#ffffff', 0.9, op(0.7)) +
    rect(6, 12, 6, 5, '#ffe7a3', op(0.9)) +
    rect(14, 13, 4, 9, K.woodD),
  // A bootcamp house with lit windows.
  bootcamp: (c) =>
    path('M3 11L12 4L21 11Z', K.red) +
    rect(5, 11, 14, 11, K.beige) +
    rect(7, 13, 4, 3.5, c, op(0.9)) +
    rect(13, 13, 4, 3.5, c, op(0.9)) +
    rect(10.5, 17, 3, 5, K.woodD),
  // A LAN centre with network links on the roof.
  lan: (c) =>
    rect(4, 8, 16, 14, K.black2) +
    line('M7 5L12 2L17 5M7 5V8M17 5V8M12 2V8', c, 1) +
    circ(7, 5, 1.2, c) +
    circ(17, 5, 1.2, c) +
    circ(12, 2, 1.2, c) +
    rect(6, 11, 12, 2, c, op(0.7)) +
    rect(6, 15, 12, 2, c, op(0.5)) +
    rect(10, 19, 4, 3, K.black3),
  // A stadium bowl with floodlights.
  arena: (c) =>
    path('M2 15Q12 7 22 15V20Q12 24 2 20Z', K.greyD) +
    ell(12, 15, 8, 3, K.green) +
    ell(12, 15, 8, 3, 'none', stroke('#ffffff', 0.5)) +
    line('M3 15V5M21 15V5', K.black3, 1) +
    rect(1.5, 3, 3, 2, c) +
    rect(19.5, 3, 3, 2, c),
  // A satellite truck with a dish sending waves.
  broadcast: (c) =>
    rr(3, 13, 16, 7, 1.5, K.white) +
    rect(14, 10, 5, 3, K.white) +
    circ(6.5, 20.5, 1.8, K.ink) +
    circ(15.5, 20.5, 1.8, K.ink) +
    path('M6 12Q6 5 12 5L6 12Z', K.greyL) +
    line('M13 3Q15 5 13 7M15.5 1.5Q18.5 5 15.5 8.5', c, 1.1),
  // A server rack streaming video.
  platform: (c) =>
    rr(6, 2, 12, 20, 1.5, K.black2) +
    rect(8, 4, 8, 3, K.black3) +
    rect(8, 9, 8, 3, K.black3) +
    rect(8, 14, 8, 3, K.black3) +
    circ(14.5, 5.5, 0.8, c) +
    circ(14.5, 10.5, 0.8, c) +
    circ(14.5, 15.5, 0.8, K.green) +
    path('M9.5 18.8L12.5 20.3L9.5 21.8Z', c),
  // A game studio with a code sign.
  studio: (c) =>
    rect(4, 7, 16, 15, '#3b4f6b') +
    rect(4, 5, 16, 3, K.black2) +
    line('M9 11L7 13L9 15M15 11L17 13L15 15M13 10.5L11 15.5', c, 1.2) +
    rect(6, 18, 3, 2, '#ffe7a3', op(0.8)) +
    rect(15, 18, 3, 2, '#ffe7a3', op(0.8)),
  // A podium with the league trophy.
  league: (c) =>
    rect(3, 16, 6, 6, K.silver) +
    rect(9, 13, 6, 9, K.gold) +
    rect(15, 18, 6, 4, K.copper) +
    path('M9.5 4H14.5V7.5Q14.5 10 12 10Q9.5 10 9.5 7.5Z', K.gold) +
    rect(11.2, 10, 1.6, 2, K.goldD) +
    rect(10, 12, 4, 1, K.goldD) +
    circ(12, 6, 1, c),
  // A ring station in orbit.
  orbital: (c) =>
    ell(12, 12, 10, 4, 'none', stroke(K.greyL, 1.6)) +
    circ(12, 12, 4, K.black2) +
    circ(12, 12, 2, c) +
    rect(2, 11, 3, 2, c, op(0.8)) +
    rect(19, 11, 3, 2, c, op(0.8)),
  // A neural headset over a glowing brain.
  neural: (c) =>
    path('M6 13Q5 5 12 5Q19 5 18 13Q18 18 12 18Q6 18 6 13Z', '#f2a6b8') +
    line('M9 8Q11 10 9 12M13 7Q15 9 13 11M15 12Q13 14 15 16', '#c26d84', 0.9) +
    path('M5 12Q5 3 12 3Q19 3 19 12', 'none', stroke(K.black3, 1.6)) +
    circ(5, 13, 1.8, c) +
    circ(19, 13, 1.8, c) +
    line('M12 18V22', c, 1.2),
  // A cloning vat with a figure inside.
  clone: (c) =>
    rr(6, 2, 12, 20, 5, K.black3) +
    rr(7.5, 4, 9, 16, 4, c, op(0.35)) +
    circ(12, 8, 2, K.ink, op(0.6)) +
    path('M9.5 18Q9.5 11 12 11Q14.5 11 14.5 18Z', K.ink, op(0.6)) +
    circ(9.5, 15, 0.8, '#ffffff', op(0.8)) +
    circ(14, 7, 0.6, '#ffffff', op(0.8)) +
    rect(6, 20, 12, 2, K.black2),
  // A wireframe cube: a world inside a server.
  simulation: (c) =>
    path('M12 3L20 7.5V16.5L12 21L4 16.5V7.5Z', c, op(0.15)) +
    line('M12 3L20 7.5V16.5L12 21L4 16.5V7.5ZM12 12L20 7.5M12 12L4 7.5M12 12V21', c, 1),
  // A portal between universes.
  multiverse: (c) =>
    circ(12, 12, 9, 'none', stroke(c, 1.6)) +
    circ(12, 12, 6, 'none', stroke('#ff8ad8', 1.2)) +
    circ(12, 12, 3, 'none', stroke('#9ec5ff', 1)) +
    circ(12, 12, 1.2, '#ffffff'),
};

export function opSpriteSvg(id: string, c: string): string {
  const draw = SPRITES[id];
  const inner = draw ? draw(c) : circ(12, 12, 6, c);
  return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${inner}</svg>`;
}

// ---------------------------------------------------------------------------
// Scenes
// ---------------------------------------------------------------------------
const GROUND = 46;

/** Repeats a drawing along the strip. */
const repeat = (count: number, step: number, draw: (x: number, i: number) => string) =>
  Array.from({ length: count }, (_, i) => draw(i * step, i)).join('');

type Scene = (c: string) => string;

const SCENES: Record<string, Scene> = {
  // A bedroom wall with posters and a long desk.
  grinder: (c) =>
    rect(0, 0, 400, 56, '#1d1b26') +
    repeat(6, 70, (x) => rr(x + 14, 8, 22, 16, 1, c, op(0.18))) +
    rect(0, GROUND - 2, 400, 3, K.wood, op(0.8)) +
    rect(0, GROUND + 1, 400, 9, '#141218'),
  // A streaming room lit in purple, with acoustic foam.
  streamer: (c) =>
    rect(0, 0, 400, 56, '#241631') +
    repeat(20, 20, (x, i) => rect(x + 2, 6 + (i % 2) * 8, 14, 7, c, op(0.08))) +
    rect(0, GROUND, 400, 10, '#1a1024'),
  // A studio with softboxes.
  creator: (c) =>
    rect(0, 0, 400, 56, '#202226') +
    repeat(5, 84, (x) => path(`M${x + 20} 6L${x + 44} 6L${x + 38} 20L${x + 26} 20Z`, '#ffffff', op(0.08))) +
    rect(0, GROUND, 400, 10, '#18191c') +
    line('M0 46H400', c, 0.6, op(0.4)),
  // A shopping street at dusk.
  cafe: (c) =>
    rect(0, 0, 400, 56, '#2a2330') +
    repeat(8, 52, (x, i) => rect(x, 14 + (i % 3) * 4, 48, 32, '#3a3140')) +
    repeat(8, 52, (x) => rect(x + 8, 22, 10, 8, '#ffe7a3', op(0.2))) +
    rect(0, GROUND, 400, 10, '#595160') +
    repeat(10, 40, (x) => rect(x + 4, GROUND + 4, 20, 1.2, c, op(0.25))),
  // Suburban hills with fences.
  bootcamp: (c) =>
    rect(0, 0, 400, 56, '#1e2a3a') +
    path('M0 36Q60 24 120 34T240 32T400 30V56H0Z', '#24402f') +
    rect(0, GROUND, 400, 10, '#2c4a35') +
    repeat(20, 20, (x) => rect(x + 2, GROUND - 5, 1.4, 5, K.beige, op(0.5))) +
    line('M0 43H400', K.beige, 0.8, op(0.4)) +
    circ(340, 12, 5, c, op(0.25)),
  // A city at night on a glowing grid.
  lan: (c) =>
    rect(0, 0, 400, 56, '#0e1320') +
    repeat(14, 29, (x, i) => rect(x, 20 - (i % 4) * 4, 24, 26 + (i % 4) * 4, '#172036')) +
    repeat(14, 29, (x, i) => rect(x + 6, 26, 3, 3, c, op(i % 2 ? 0.35 : 0.15))) +
    rect(0, GROUND, 400, 10, '#0b0f19') +
    repeat(20, 20, (x) => line(`M${x} ${GROUND}L${x - 8} 56`, c, 0.5, op(0.3))),
  // A crowd under spotlights.
  arena: (c) =>
    rect(0, 0, 400, 56, '#141820') +
    path('M60 0L90 46H30Z', c, op(0.08)) +
    path('M300 0L340 46H260Z', c, op(0.08)) +
    repeat(40, 10, (x, i) => circ(x + 5, 40 - (i % 3), 3.2, '#2a3040')) +
    rect(0, GROUND, 400, 10, '#1d2a1f'),
  // Hills with transmission masts.
  broadcast: (c) =>
    rect(0, 0, 400, 56, '#18202e') +
    path('M0 40Q100 26 200 38T400 34V56H0Z', '#23313f') +
    repeat(4, 100, (x) => line(`M${x + 50} 38L${x + 50} 8M${x + 45} 38L${x + 50} 8L${x + 55} 38`, K.greyD, 0.8)) +
    repeat(4, 100, (x) => circ(x + 50, 8, 1.6, c)) +
    rect(0, GROUND, 400, 10, '#1b2530'),
  // A data centre floor.
  platform: (c) =>
    rect(0, 0, 400, 56, '#12141a') +
    repeat(10, 40, (x) => rr(x + 6, 8, 28, 36, 1, '#1b1e26')) +
    repeat(40, 10, (x, i) => circ(x + 4, 14 + (i % 5) * 6, 0.8, c, op(0.45))) +
    rect(0, GROUND, 400, 10, '#0e1015') +
    repeat(20, 20, (x) => line(`M${x} ${GROUND}V56`, '#ffffff', 0.4, op(0.08))),
  // An office skyline.
  studio: (c) =>
    rect(0, 0, 400, 56, '#1c2436') +
    repeat(10, 40, (x, i) => rect(x + 4, 10 + (i % 3) * 6, 32, 36 - (i % 3) * 6, '#26324a')) +
    repeat(30, 13, (x, i) => rect(x + 6, 16 + (i % 4) * 6, 3, 2, i % 3 ? '#ffe7a3' : c, op(0.3))) +
    rect(0, GROUND, 400, 10, '#161c2a'),
  // Flags over a stadium stand.
  league: (c) =>
    rect(0, 0, 400, 56, '#16202a') +
    repeat(10, 40, (x, i) => line(`M${x + 20} 34V8`, K.greyD, 0.8) + path(`M${x + 20} 8L${x + 32} 11L${x + 20} 14Z`, i % 2 ? c : K.gold, op(0.7))) +
    rect(0, 34, 400, 12, '#243240') +
    rect(0, GROUND, 400, 10, '#1f3a26'),
  // A starfield over a planet's curve.
  orbital: (c) =>
    rect(0, 0, 400, 56, '#070a14') +
    repeat(30, 13, (x, i) => circ(x + 4, 5 + ((i * 17) % 34), i % 4 === 0 ? 0.9 : 0.5, '#ffffff', op(0.7))) +
    path('M0 56Q200 30 400 56Z', c, op(0.2)) +
    path('M0 56Q200 38 400 56Z', '#1b2a4a'),
  // Circuit traces.
  neural: (c) =>
    rect(0, 0, 400, 56, '#16111c') +
    repeat(12, 34, (x, i) => line(`M${x} ${10 + (i % 3) * 8}H${x + 18}V${30 - (i % 2) * 6}H${x + 34}`, c, 0.7, op(0.3))) +
    repeat(12, 34, (x, i) => circ(x + 18, 10 + (i % 3) * 8, 1.2, c, op(0.5))) +
    rect(0, GROUND, 400, 10, '#120e17'),
  // A clean lab with tiled walls.
  clone: (c) =>
    rect(0, 0, 400, 56, '#1a2327') +
    repeat(40, 10, (x) => line(`M${x} 0V${GROUND}`, '#ffffff', 0.3, op(0.06))) +
    repeat(5, 10, (_, i) => line(`M0 ${i * 10}H400`, '#ffffff', 0.3, op(0.06))) +
    rect(0, GROUND, 400, 10, '#10181b') +
    line('M0 46H400', c, 0.8, op(0.45)),
  // A green wireframe grid receding into the distance.
  simulation: (c) =>
    rect(0, 0, 400, 56, '#060d0a') +
    repeat(21, 20, (x) => line(`M200 20L${x} 56`, c, 0.5, op(0.25))) +
    repeat(5, 1, (_, i) => line(`M0 ${22 + i * i * 2.2}H400`, c, 0.5, op(0.2))) +
    repeat(24, 17, (x, i) => rect(x + 4, 2 + ((i * 7) % 16), 1.2, 3, c, op(0.35))),
  // A nebula swirl.
  multiverse: (c) =>
    rect(0, 0, 400, 56, '#0c0716') +
    ell(90, 26, 70, 18, c, op(0.14)) +
    ell(260, 30, 90, 20, '#ff8ad8', op(0.1)) +
    ell(350, 20, 50, 14, '#9ec5ff', op(0.12)) +
    repeat(26, 15, (x, i) => circ(x + 6, 4 + ((i * 13) % 44), 0.5, '#ffffff', op(0.6))),
};

/** A 400x56 backdrop strip for an operation. */
export function opSceneSvg(id: string, c: string): string {
  const draw = SCENES[id];
  const inner = draw ? draw(c) : rect(0, 0, 400, 56, '#1b1c21');
  return `<svg viewBox="0 0 400 56" width="400" height="56" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

/** The backdrop as a CSS background, so it tiles across a lane of any width at its natural height. */
export function opSceneBackground(id: string, c: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(opSceneSvg(id, c))}")`;
}

export const OP_ART_IDS = Object.keys(SPRITES);
