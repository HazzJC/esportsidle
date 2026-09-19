import { GEAR_MAX_TIER, gearRarity, type GearSlot } from '../data/gear';
import { K, circ, ell, f, glow, grid, grid2, group, line, op, path, rect, rings, rr, shadow, spark, stars, stroke, type Art } from './artKit';

/**
 * Bespoke item art for every gear slot and tier, drawn on a 48x48 grid with shapes bold enough to read
 * at icon size. Each drawing follows its tier name. Glowing parts take the item's rarity colour `c`,
 * which ties the art to the rarity frame around it. Output is built only from constants in this file.
 */

// ---------------------------------------------------------------------------
// PC
// ---------------------------------------------------------------------------
const tower = (tx: number, ty: number, w: number, h: number, fill: string, edge = K.black3) => rr(tx, ty, w, h, 2, fill, stroke(edge));
const fan = (cx: number, cy: number, r: number, ring: string) =>
  circ(cx, cy, r, K.black) +
  circ(cx, cy, r - 0.7, 'none', stroke(ring, 1.4)) +
  line(
    `M${f(cx - r * 0.55)} ${f(cy - r * 0.2)}L${f(cx + r * 0.55)} ${f(cy + r * 0.2)}M${f(cx - r * 0.2)} ${f(cy + r * 0.55)}L${f(cx + r * 0.2)} ${f(cy - r * 0.55)}`,
    K.black3,
    1.1,
  ) +
  circ(cx, cy, r * 0.22, K.black3);
const glass = (gx: number, gy: number, w: number, h: number) => rr(gx, gy, w, h, 1.5, '#16171b', stroke(K.black3, 0.8));

const PC: Art[] = [
  // Hand-me-down Laptop: cracked screen, taped lid.
  () =>
    shadow(19) +
    rr(10, 9, 28, 21, 2, K.greyD) +
    rect(12, 11, 24, 16, '#2c3833') +
    line('M19 11L23 18L21 27', '#5d6b64', 0.8) +
    rect(29, 11.5, 6, 2.5, '#e8dca8', op(0.9)) +
    path('M6 31H42L45.5 38H2.5Z', K.grey) +
    rect(9, 32.5, 30, 1.4, K.greyD) +
    rect(12, 35, 24, 1.2, K.greyD),
  // Office Tower: beige box, floppy slot.
  () =>
    shadow(12) +
    tower(14, 6, 20, 37, K.beige, K.beigeD) +
    rect(17, 10, 14, 3.5, K.beigeD) +
    rect(17, 15.5, 14, 3.5, K.beigeD) +
    rect(20, 22, 8, 1, '#6b6452') +
    circ(24, 33, 2.4, K.beigeD) +
    circ(29.5, 38.5, 0.9, '#4ade80'),
  // Budget Gaming PC: black box, a red racing slash, one fan.
  (c) => shadow(12) + tower(13, 6, 22, 37, K.black2) + path('M13 36L35 18V22.5L13 40.5Z', K.red) + fan(24, 16, 6.5, K.black3) + circ(31, 39.5, 0.9, c),
  // RGB Mid-Tower: glass side with three rainbow fans.
  () => shadow(13) + tower(12, 5, 24, 38, K.black) + glass(14.5, 7.5, 19, 33) + fan(24, 14, 5, '#ff5f7e') + fan(24, 24, 5, '#f5c451') + fan(24, 34, 5, '#4ade80'),
  // Pre-Built Beast: wide glass tower, lit fans, a GPU and a CPU cooler.
  (c) =>
    shadow(16) +
    tower(8, 4, 32, 39, K.black) +
    glass(10.5, 6.5, 27, 34) +
    fan(15.5, 13, 4, c) +
    fan(15.5, 23, 4, c) +
    fan(15.5, 33, 4, c) +
    rr(23, 9, 10, 9, 1.2, K.black3) +
    circ(28, 13.5, 3, K.black2) +
    rr(22, 26, 14, 5, 1, K.black3) +
    rect(22, 30, 14, 1.2, c),
  // Custom Loop Build: coolant reservoir and hard-line tubing.
  (c) =>
    shadow(15) +
    tower(9, 4, 30, 39, K.black) +
    glass(11.5, 6.5, 25, 34) +
    rr(28, 9, 5.5, 22, 2.5, c, op(0.85)) +
    rr(28, 9, 5.5, 5, 2.5, K.black3) +
    rr(14, 12, 9, 9, 1.5, K.black3) +
    circ(18.5, 16.5, 2.5, c, op(0.9)) +
    line('M23 16.5H26.5V33H18.5V21', c, 2) +
    line('M30.8 31V36H14', c, 2),
  // Twin-GPU Monster: two stacked graphics cards in a wide case.
  (c) =>
    shadow(18) +
    tower(5, 7, 38, 36, K.black) +
    glass(7.5, 9.5, 33, 31) +
    rr(10, 15, 28, 8, 1.2, K.black3) +
    circ(17, 19, 3, K.black2, stroke(c)) +
    circ(31, 19, 3, K.black2, stroke(c)) +
    rr(10, 27, 28, 8, 1.2, K.black3) +
    circ(17, 31, 3, K.black2, stroke(c)) +
    circ(31, 31, 3, K.black2, stroke(c)) +
    rect(10, 23, 28, 1, c) +
    rect(10, 35, 28, 1, c),
  // Open-Air Test Bench: bare motherboard on standoffs, GPU standing up.
  (c) =>
    shadow(18) +
    path('M6 36L10 30H38L42 36Z', K.greyD) +
    line('M9 36V42M39 36V42', K.greyD, 2) +
    rect(11, 16, 26, 14, K.pcb) +
    rr(14, 19, 7, 7, 1, K.black3) +
    rect(24, 18, 1.8, 9, c) +
    rect(27, 18, 1.8, 9, c) +
    rr(31, 8, 5, 20, 1, K.black2) +
    circ(33.5, 13, 1.6, K.black3) +
    circ(33.5, 21, 1.6, K.black3),
  // Server Rack Rig: rack units with blinking status lights.
  (c) =>
    shadow(13) +
    rr(12, 3, 24, 41, 1.5, K.black) +
    [0, 1, 2, 3, 4]
      .map((i) => rr(14, 6 + i * 7.3, 20, 6, 0.8, K.black2) + circ(31, 9 + i * 7.3, 0.9, i % 2 ? '#4ade80' : K.gold) + rect(16, 8.3 + i * 7.3, 10, 1.2, K.black3))
      .join('') +
    rect(12, 3, 24, 1.5, c),
  // Liquid Nitrogen Rig: a frosty pot pouring vapour.
  () =>
    shadow(17) +
    rect(8, 34, 32, 4, K.pcb) +
    line('M11 38V43M37 38V43', K.greyD, 2) +
    rr(19, 14, 10, 20, 1.5, K.silver) +
    rect(19, 14, 10, 3, K.silverD) +
    rect(21, 19, 1.5, 12, '#fff', op(0.5)) +
    circ(24, 10, 4.5, K.ice, op(0.8)) +
    circ(19, 8, 3.5, K.ice, op(0.6)) +
    circ(29, 7, 3.2, K.ice, op(0.55)) +
    circ(24, 4, 2.6, K.ice, op(0.4)) +
    stars([[16, 30], [32, 27], [15, 22], [33, 20]], K.ice),
  // Quantum Rig: the gold chandelier of a quantum computer.
  (c) =>
    rect(10, 3, 28, 2.5, K.greyD) +
    line('M16 5.5V11M24 5.5V11M32 5.5V11', K.goldD, 1.2) +
    ell(24, 12, 13, 2.8, K.gold) +
    line('M18 13V19M24 13V19M30 13V19', K.goldD, 1.2) +
    ell(24, 20, 10, 2.4, K.gold) +
    line('M20 21V27M24 21V27M28 21V27', K.goldD, 1.2) +
    ell(24, 28, 7, 2, K.gold) +
    line('M22 29V34M26 29V34', K.goldD, 1.2) +
    glow(24, 37, 6, c, 0.3) +
    circ(24, 37, 2.8, c),
  // Neural Mainframe: a brain under a glass dome.
  (c) =>
    shadow(15) +
    rr(10, 35, 28, 7, 1.5, K.black2) +
    rect(10, 35, 28, 1.2, c) +
    path('M11 35C11 15 37 15 37 35Z', c, op(0.14)) +
    path('M11 35C11 15 37 15 37 35', 'none', stroke(c, 1.2)) +
    ell(20.5, 27, 5.5, 5, '#f4a7b6') +
    ell(27.5, 27, 5.5, 5, '#f4a7b6') +
    line('M18 25C19 27 21 26 22 28M26 24C27 26 29 25 30 27M24 23V31', '#c9788a', 0.9),
  // Fusion-Powered Tower: a glowing torus reactor at the core.
  (c) =>
    shadow(13) +
    tower(11, 4, 26, 39, K.black) +
    glow(24, 23, 12, c, 0.18) +
    circ(24, 23, 8.5, 'none', stroke(c, 3)) +
    circ(24, 23, 3.2, '#fff') +
    glow(24, 23, 5, c, 0.5) +
    rect(14, 38, 20, 1.5, c),
  // Black Hole Cooler Build: an accretion disc swallowing the heat.
  (c) =>
    shadow(13) +
    tower(11, 4, 26, 39, K.black) +
    ell(24, 23, 12, 3.8, 'none', stroke(c, 2)) +
    circ(24, 23, 6, '#000', stroke(c, 0.8)) +
    path('M12 23C12 25 17 26.8 24 26.8C31 26.8 36 25 36 23', 'none', stroke(K.goldL, 1.4)) +
    circ(24, 23, 7.5, 'none', `${stroke(c, 0.6)} ${op(0.5)}`),
  // Dyson Sphere Box: a star wrapped in a lattice of panels.
  (c) =>
    glow(24, 23, 16, c, 0.15) +
    circ(24, 23, 5, K.goldL) +
    glow(24, 23, 7.5, K.gold, 0.45) +
    circ(24, 23, 13, 'none', stroke(c, 1.4)) +
    ell(24, 23, 13, 5, 'none', stroke(c)) +
    ell(24, 23, 5, 13, 'none', stroke(c)) +
    line('M11 23H37M24 10V36', c, 0.8) +
    shadow(12),
  // The Omniframe: a floating monolith inside orbiting rings.
  (c) =>
    shadow(10) +
    glow(24, 21, 15, c, 0.12) +
    rr(19, 6, 10, 30, 1, K.ink, stroke(c)) +
    rect(23.3, 9, 1.4, 24, c, op(0.8)) +
    ell(24, 21, 17, 5, 'none', `${stroke(c, 1.3)} transform="rotate(-18 24 21)"`) +
    ell(24, 21, 17, 5, 'none', `${stroke(K.gold)} transform="rotate(22 24 21)"`) +
    spark(9, 9, 2.5, c) +
    spark(40, 34, 2, K.gold),
];

// ---------------------------------------------------------------------------
// Monitor
// ---------------------------------------------------------------------------
const stand = (col: string) => rect(22, 33, 4, 6, col) + ell(24, 40, 9, 2, col);
const panel = (px: number, py: number, w: number, h: number, bezel: string, screen: string, b = 2) =>
  rr(px, py, w, h, 1.5, bezel) + rect(px + b, py + b, w - b * 2, h - b * 2, screen);
const blinders = (col: string) => path('M3 10L7 12V30L3 32Z', col) + path('M45 10L41 12V30L45 32Z', col);

const MONITOR: Art[] = [
  // Grandma's CRT: a deep beige box with a curved screen and knobs.
  () =>
    shadow(17) +
    path('M9 7H39L42 12V36H6V12Z', K.beigeD) +
    rr(6, 10, 33, 27, 2, K.beige) +
    rr(9, 13, 22, 19, 5, '#2f3d35') +
    path('M12 16C15 15 18 15 20 15.5', 'none', `${stroke('#fff')} ${op(0.3)}`) +
    circ(35, 17, 1.6, K.beigeD) +
    circ(35, 23, 1.6, K.beigeD) +
    rect(33, 30, 4, 1.5, K.beigeD),
  // 60Hz Office Screen: thick beige bezel, dull picture.
  () => shadow(12) + stand(K.beigeD) + panel(6, 9, 36, 24, K.beige, '#44525a', 3),
  // 75Hz Budget Panel: black bezel showing a desktop.
  () => shadow(12) + stand(K.black3) + panel(6, 9, 36, 24, K.black2, '#2b3542', 2.5) + grid(10.5, 13, 1, 3, 3, 3, 1.5, K.greyL) + rect(8.5, 28.5, 31, 2, K.black3),
  // 144Hz Gaming Monitor: thin bezel, V stand, crosshair.
  () =>
    shadow(14) +
    path('M24 33L15 41H19L24 36L29 41H33Z', K.black3) +
    panel(4, 8, 40, 25, K.black, '#263545', 1.5) +
    line('M24 16V19.5M24 22.5V26M18.5 21H22M26 21H29.5', K.red, 1.4) +
    rect(4, 32, 40, 1.2, K.red),
  // 165Hz IPS: vivid sunset on a slim panel.
  () =>
    shadow(14) +
    rect(22.5, 33, 3, 6, K.greyD) +
    ell(24, 40, 8, 1.8, K.greyD) +
    panel(4, 8, 40, 25, K.black, '#e8894a', 1.2) +
    circ(30, 17, 4, '#ffd27a') +
    path('M5.2 31.8V25C12 20 18 24 24 22C30 20 36 24 42.8 21V31.8Z', '#3b5a3a') +
    path('M5.2 31.8V28C15 25 26 30 42.8 26V31.8Z', '#2b432b'),
  // 240Hz Esports Panel: small panel on an articulated arm, game HUD on screen.
  (c) =>
    line('M38 42V34L30 30L24 33', K.greyD, 2.5) +
    rect(34, 41, 8, 2, K.greyD) +
    panel(7, 9, 34, 22, K.black, '#1f2a26', 1.2) +
    rect(10, 26, 10, 2, c) +
    rr(33, 12, 6, 6, 0.8, 'none', stroke(K.greyL, 0.8)) +
    circ(24, 19, 1, K.white),
  // 280Hz OLED: razor bezel, true blacks, a streak of colour.
  (c) =>
    shadow(14) +
    rect(23, 32, 2, 7, K.silverD) +
    ell(24, 40, 7, 1.5, K.silverD) +
    panel(4, 8, 40, 24, K.ink, '#050506', 0.8) +
    path('M8 30L26 10H31L13 30Z', c, op(0.7)) +
    path('M15 30L33 10H35L17 30Z', c, op(0.35)),
  // 360Hz Pro Panel: pro screen between tournament blinders.
  (c) => shadow(14) + stand(K.black3) + blinders(K.black3) + panel(8, 9, 32, 23, K.black, '#1b2530', 1.2) + circ(24, 20.5, 2.5, 'none', stroke(c, 1.3)) + circ(24, 20.5, 0.7, c),
  // 480Hz OLED: curved ultrawide.
  (c) =>
    shadow(18) +
    rect(22.5, 32, 3, 7, K.black3) +
    ell(24, 40, 9, 1.8, K.black3) +
    path('M2 10Q24 5 46 10V31Q24 27 2 31Z', K.black) +
    path('M3.5 11.3Q24 6.6 44.5 11.3V29.6Q24 25.9 3.5 29.6Z', '#070708') +
    path('M3.5 29.6Q24 25.9 44.5 29.6', 'none', stroke(c, 1.5)),
  // 540Hz Tournament Panel: blinders, trimmed bezel, a star on the stand.
  (c) => shadow(14) + stand(K.black3) + blinders(K.black2) + panel(8, 9, 32, 23, c, '#161d26', 1.2) + spark(24, 37, 3, K.gold) + line('M19 20.5H29', c),
  // 1000Hz Prototype: colour bars, dangling wires, hazard tape.
  () =>
    shadow(14) +
    rect(22, 32, 4, 7, K.greyD) +
    panel(5, 8, 38, 24, K.greyD, '#000', 1.5) +
    ['#e8e6e1', '#f5c451', '#4fb3c8', '#4caf6a', '#c74aa0', '#e0474c', '#3553b8'].map((col, i) => rect(6.5 + i * 5, 9.5, 5, 21, col)).join('') +
    path('M10 32C10 37 14 36 14 41', 'none', stroke(K.red, 1.2)) +
    path('M36 32C36 38 31 36 32 42', 'none', stroke('#4ade80', 1.2)) +
    group(rect(28, 5, 14, 4, K.gold) + line('M30 5.5L32 9M34 5.5L36 9M38 5.5L40 9', K.ink, 1.1), 'transform="rotate(12 35 7)"'),
  // Holographic Display: a projected screen floating above its emitter.
  (c) =>
    path('M17 36L9 11H39L31 36Z', c, op(0.12)) +
    rr(7, 7, 34, 21, 1, c, op(0.22)) +
    rr(7, 7, 34, 21, 1, 'none', stroke(c, 1.2)) +
    line('M11 12H24M11 16H20', c, 1.2) +
    ell(24, 39, 11, 3, K.black2) +
    ell(24, 37.5, 7, 1.6, c),
  // Retinal Projector: a visor beaming straight into the eye.
  (c) =>
    path('M28 19L46 10V32Z', c, op(0.2)) +
    line('M4 26C4 16 14 12 22 14', K.black3, 3) +
    rr(20, 14, 10, 10, 3, K.black2) +
    circ(25, 19, 3.2, c) +
    circ(25, 19, 1.2, '#fff') +
    line('M30 19H45', c, 1),
  // Direct Optic-Nerve Feed: an eye wired straight in.
  (c) =>
    path('M4 24C12 13 30 13 38 24C30 35 12 35 4 24Z', K.white) +
    circ(21, 24, 7, c) +
    circ(21, 24, 3.2, K.ink) +
    circ(19.5, 22.5, 1.2, '#fff') +
    line('M38 24C41 24 42 28 45 28M36 20C40 18 42 14 45 14M36 28C40 30 41 35 44 36', c, 1.3) +
    circ(45, 28, 1.3, c),
  // Precognitive Display: a clock on screen, with its future frames ghosting behind.
  (c) =>
    rr(12, 4, 30, 21, 1.5, 'none', `${stroke(c)} ${op(0.3)}`) +
    rr(9, 7, 30, 21, 1.5, 'none', `${stroke(c)} ${op(0.55)}`) +
    panel(6, 10, 30, 21, K.black, '#101014', 1.2) +
    circ(21, 20.5, 7, 'none', stroke(c, 1.3)) +
    line('M21 20.5V16M21 20.5L24.5 22', K.white, 1.3) +
    shadow(10),
  // Screen of Infinite Hertz: an infinity-shaped display.
  (c) =>
    path('M24 24C19 16 6 16 6 24C6 32 19 32 24 24C29 16 42 16 42 24C42 32 29 32 24 24Z', c, op(0.18)) +
    path('M24 24C19 16 6 16 6 24C6 32 19 32 24 24C29 16 42 16 42 24C42 32 29 32 24 24Z', 'none', stroke(c, 2.6)) +
    spark(13, 24, 2.4, '#fff') +
    spark(35, 24, 2.4, '#fff') +
    spark(24, 10, 2.2, K.gold) +
    spark(24, 38, 1.8, c),
];

// ---------------------------------------------------------------------------
// Mouse (top-down, pointing up)
// ---------------------------------------------------------------------------
const MOUSE = 'M24 7C33 7 36 15 36 25C36 36 31 42 24 42C17 42 12 36 12 25C12 15 15 7 24 7Z';
const mouse = (fill: string, seam = K.black3, wheel = K.black3) => path(MOUSE, fill) + line('M24 7.5V19', seam, 0.9) + rr(22.6, 10.5, 2.8, 6, 1.4, wheel);
const cable = (col: string) => line('M24 7C24 3 30 4 31 1', col, 1.4);
function hexes(cx: number, cy: number, fill: string): string {
  let s = '';
  for (let r = 0; r < 4; r++)
    for (let k = 0; k < 3; k++) {
      const hx = cx - 5 + k * 5 + (r % 2 ? 2.5 : 0);
      const hy = f(cy + r * 4.3);
      s += path(`M${hx} ${f(hy - 1.8)}L${f(hx + 1.6)} ${f(hy - 0.9)}V${f(hy + 0.9)}L${hx} ${f(hy + 1.8)}L${f(hx - 1.6)} ${f(hy + 0.9)}V${f(hy - 0.9)}Z`, fill);
    }
  return s;
}
function weave(): string {
  let s = '';
  for (let i = -2; i < 8; i++) s += line(`M${10 + i * 4} 42L${22 + i * 4} 8`, K.black3, 0.7) + line(`M${10 + i * 4} 8L${22 + i * 4} 42`, K.black3, 0.7);
  return s;
}

const MOUSE_ART: Art[] = [
  // Ball Mouse: boxy, beige, grubby, curly cord.
  () =>
    shadow(11) +
    line('M24 10C24 5 18 6 19 3C20 1 25 2 27 0', K.greyD, 1.4) +
    rr(13, 9, 22, 33, 7, K.beige) +
    line('M13.5 21H34.5M24 9.5V21', K.beigeD) +
    circ(18, 30, 0.8, '#8a7f63') +
    circ(28, 34, 0.7, '#8a7f63') +
    circ(22, 37, 0.6, '#8a7f63'),
  // Office Mouse: grey, corded, sensible.
  () => shadow(11) + cable(K.greyD) + mouse(K.grey, K.greyD, K.greyD),
  // Rubber-Grip Mouse: side grips and a red wheel.
  () =>
    shadow(11) +
    cable(K.black3) +
    mouse(K.black2, K.black3, K.red) +
    rr(11.5, 20, 3.5, 14, 1.5, K.greyD) +
    rr(33, 20, 3.5, 14, 1.5, K.greyD) +
    grid(12.4, 21.5, 1, 5, 1.6, 1.4, 1.2, K.black3) +
    grid(34, 21.5, 1, 5, 1.6, 1.4, 1.2, K.black3),
  // Honeycomb Mouse: a shell full of hex holes, paracord cable.
  () => shadow(11) + cable(K.greyL) + mouse(K.black2) + hexes(24, 23, K.ink),
  // Ultralight Wireless: white shell, no cable, dongle beside it.
  (c) =>
    shadow(11) +
    path(MOUSE, '#e9e8e4') +
    line('M24 7.5V19', K.greyL, 0.9) +
    rr(22.6, 10.5, 2.8, 6, 1.4, K.greyD) +
    hexes(24, 25, '#c9c8c3') +
    rr(39, 32, 5, 9, 1, K.black2) +
    rect(40.5, 30, 2, 2.5, K.greyL) +
    circ(24, 38, 0.9, c),
  // Magnesium Shell: a silver skeleton with the internals showing.
  (c) =>
    shadow(11) +
    path(MOUSE, K.silver) +
    ell(24, 28, 7, 8, K.black2) +
    ell(18.5, 18, 2.5, 3, K.black2) +
    ell(29.5, 18, 2.5, 3, K.black2) +
    rect(20, 26, 8, 4, K.pcb) +
    line('M24 7.5V13', K.silverD, 0.9) +
    rr(22.6, 9, 2.8, 5, 1.4, c),
  // Carbon Fibre Glide: woven black shell and a stripe.
  (c) =>
    shadow(11) +
    `<clipPath id="ga-carbon"><path d="${MOUSE}"/></clipPath>` +
    path(MOUSE, K.black) +
    group(weave(), 'clip-path="url(#ga-carbon)"') +
    line('M24 22V40', c, 1.6) +
    rr(22.6, 10.5, 2.8, 6, 1.4, K.black3),
  // Titanium Precision: an angular, faceted shell with side buttons.
  (c) =>
    shadow(11) +
    path('M24 6L33 11L36 26L31 41H17L12 26L15 11Z', '#b8bcc2') +
    path('M24 6L33 11L30 24H18L15 11Z', K.silver) +
    path('M18 24H30L31 41H17Z', K.silverD) +
    line('M24 6V18', K.greyD, 0.8) +
    rr(10, 20, 3, 5, 1, c) +
    rr(10, 26.5, 3, 5, 1, c),
  // 8K Polling Mouse: signal arcs pouring off the front.
  (c) => shadow(11) + mouse(K.black2, K.black3, c) + line('M17 5Q24 0 31 5', c, 1.3, op(0.9)) + line('M14 3.5Q24 -2 34 3.5', c, 1.1, op(0.55)) + rect(20, 36, 8, 1.2, c),
  // Frictionless Hover Mouse: lifted clear of its own shadow.
  (c) => ell(26, 44, 11, 2.2, '#000', op(0.25)) + group(mouse('#2b2c31', K.black3, c), 'transform="translate(-2 -3)"') + line('M8 34H13M6 38H11M35 36H40', c, 1.2, op(0.7)),
  // Maglev Mouse: floating over its magnetic pad, field lines between.
  (c) =>
    rr(6, 38, 36, 5, 1.5, K.black2) +
    rect(6, 38, 36, 1, c) +
    line('M12 38C12 30 17 30 17 26M36 38C36 30 31 30 31 26M24 38V33', c, 1, op(0.7)) +
    group(mouse(K.black2, K.black3, c), 'transform="translate(24 17) scale(0.62) translate(-24 -24)"'),
  // Neural-Linked Mouse: no cable, just a spray of synapses.
  (c) =>
    shadow(11) +
    mouse(K.black2, K.black3, c) +
    line('M24 7C24 3 20 2 17 1M24 7C25 3 29 3 31 0M24 7C22 4 23 2 24 0', c, 1.1) +
    circ(17, 1.2, 1.1, c) +
    circ(31, 0.8, 1.1, c) +
    circ(24, 0.8, 1.1, c),
  // Quantum Tracking Mouse: in two places at once.
  (c) =>
    shadow(12) +
    group(path(MOUSE, c), 'transform="translate(-4 1)" opacity="0.45"') +
    group(mouse(K.black2, K.black3, c), 'transform="translate(4 -1)" opacity="0.85"') +
    line('M4 20Q8 16 12 20T20 20', c),
  // Graviton Mouse: spacetime warped around it.
  (c) =>
    line('M2 12Q24 26 46 12M2 36Q24 22 46 36M12 2Q24 24 12 46M36 2Q24 24 36 46', c, 0.9, op(0.6)) +
    group(mouse(K.ink, K.black3, c), 'transform="translate(24 24) scale(0.7) translate(-24 -24)"'),
  // Thought Cursor: no mouse at all, just a glowing pointer and a thought.
  (c) =>
    glow(20, 22, 13, c, 0.2) +
    path('M13 8L13 34L20 27L25 38L29.5 36L24.5 25.5H34Z', c, stroke('#fff', 1.4)) +
    circ(36, 12, 4.5, 'none', stroke(c, 1.2)) +
    circ(40, 20, 2, 'none', stroke(c)) +
    circ(42, 25, 1.1, c),
  // The Mouse of Destiny: gold, crowned and radiant.
  (c) =>
    line('M24 22L4 12M24 22L44 12M24 22L2 30M24 22L46 30M24 22L24 1', c, 1.2, op(0.5)) +
    shadow(11) +
    group(mouse(K.gold, K.goldD, K.goldD) + path('M17 16C18 12 21 11 23 11', 'none', `${stroke('#fff', 1.4)} ${op(0.6)}`), 'transform="translate(0 3)"') +
    path('M18 9L20 3L24 7L28 3L30 9Z', K.goldL, stroke(K.goldD, 0.8)),
];

// ---------------------------------------------------------------------------
// Keyboard
// ---------------------------------------------------------------------------
const board = (bx: number, by: number, w: number, h: number, fill: string, edge = K.black3) => rr(bx, by, w, h, 2, fill, stroke(edge, 0.8));

const KEYBOARD: Art[] = [
  // Sticky Membrane Board: flat beige keys and a coffee ring.
  () => shadow(20) + board(3, 16, 42, 18, K.beige, K.beigeD) + grid(5, 18, 13, 4, 2.2, 2.7, 0.7, K.beigeD) + circ(34, 26, 4, 'none', `${stroke('#7a4f2c', 1.3)} ${op(0.55)}`),
  // Office Keyboard: grey full-size, number pad and all.
  () => shadow(20) + board(3, 16, 42, 18, K.greyD) + grid(5, 18, 10, 4, 2.3, 2.7, 0.7, K.grey) + grid(37, 18, 3, 4, 2, 2.7, 0.6, K.grey),
  // Budget Mechanical: taller caps with a red underglow.
  () => shadow(20) + board(3, 17, 42, 17, K.black) + rect(4, 32.5, 40, 1, K.red, op(0.9)) + grid(5, 18.5, 12, 4, 2.3, 2.6, 0.9, K.black3) + grid2(5, 18.5, 12, 4, 2.3, 0.9, 0.9, 2.6, '#4b4c53'),
  // Hot-Swap TKL: tenkeyless, one cap pulled to show the switch.
  (c) =>
    shadow(17) +
    board(7, 19, 34, 16, K.black2) +
    grid(9, 21, 10, 4, 2.3, 2.5, 0.8, K.black3) +
    rect(21.5, 23.8, 2.3, 2.5, K.ink) +
    line('M22.6 24.3V25.7M21.9 25H23.3', K.red, 0.8) +
    rr(20.5, 9, 4.5, 4, 1, K.black3) +
    line('M22.7 13.5V18', c, 1, 'stroke-dasharray="1 1"'),
  // Custom 65%: compact, pastel caps and an artisan escape key.
  (c) =>
    shadow(16) +
    board(8, 18, 32, 15, '#e8e4da', K.beigeD) +
    grid(10, 20, 9, 4, 2.2, 2.2, 0.8, '#f4f1ea') +
    grid(10, 20, 1, 4, 2.2, 2.2, 0.8, c) +
    circ(11.1, 21.1, 1.6, K.red) +
    rr(21, 29, 9, 2.2, 0.6, c),
  // Optical Switch Board: every key lit by a beam of light.
  (c) => shadow(20) + board(3, 17, 42, 17, K.black) + grid(5, 18.5, 12, 4, 2.3, 2.6, 0.9, K.black3) + grid2(5.8, 19.3, 12, 4, 0.7, 0.7, 2.5, 2.8, c),
  // Rapid-Trigger Board: lightning on the keys that matter.
  (c) =>
    shadow(20) +
    board(3, 17, 42, 17, K.black) +
    grid(5, 18.5, 12, 4, 2.3, 2.6, 0.9, K.black3) +
    [9.4, 15.8, 22.2].map((kx) => path(`M${f(kx + 1.3)} 21.8L${kx} 24.8H${f(kx + 1.1)}L${f(kx + 0.6)} 27.5L${f(kx + 2.1)} 24H${kx + 1}Z`, c)).join(''),
  // Hall-Effect Magnetic: field lines arcing over the caps.
  (c) =>
    shadow(20) +
    board(3, 19, 42, 15, K.black) +
    grid(5, 20.5, 12, 4, 2.3, 2.2, 0.9, K.black3) +
    line('M8 20C8 10 20 10 20 20M28 20C28 10 40 10 40 20M14 20C14 14 34 14 34 20', c, 1.1, op(0.8)),
  // Titanium Plate Custom: brushed metal case with visible screws.
  (c) =>
    shadow(18) +
    board(5, 16, 38, 19, K.silver, K.silverD) +
    rect(7, 18, 34, 15, K.silverD) +
    grid(8, 19, 11, 4, 2.2, 2.6, 0.7, K.black2) +
    [7, 41].flatMap((sx) => [17.5, 33.5].map((sy) => circ(sx, sy, 0.9, K.greyD))).join('') +
    rect(8, 33.3, 32, 0.8, c),
  // Zero-Actuation Board: caps hovering above the plate.
  (c) =>
    shadow(20) +
    board(3, 25, 42, 10, K.black2) +
    rect(4, 25, 40, 1, c, op(0.8)) +
    grid2(5, 26.5, 12, 3, 2.3, 1.2, 0.8, 1.8, '#000', op(0.4)) +
    grid(5, 16, 12, 3, 2.3, 2.3, 0.8, K.black3),
  // Neural Keypad: nine keys and a brainwave.
  (c) => shadow(11) + board(13, 20, 22, 18, K.black2) + grid(15, 22, 3, 3, 5, 4, 1.2, K.black3) + line('M8 13H14L16 8L19 17L22 5L25 15L27 11H40', c, 1.4),
  // Holographic Keys: a slim emitter projecting a translucent keyboard.
  (c) =>
    path('M10 36L4 18H44L38 36Z', c, op(0.1)) +
    grid(6, 19, 11, 3, 2.6, 3, 0.9, 'none', `${stroke(c, 0.7)} ${op(0.85)}`) +
    rr(10, 36, 28, 4, 2, K.black2) +
    rect(14, 36, 20, 1.2, c),
  // Thought-Stroke Board: one key, pressed by thinking about it.
  (c) =>
    glow(24, 28, 13, c, 0.2) +
    rings(24, 28, [12, 16], c) +
    rr(15, 21, 18, 14, 3, K.black2) +
    rr(17, 22, 14, 10, 2.5, c) +
    circ(35, 10, 3, 'none', stroke(c)) +
    circ(31, 15, 1.4, c),
  // Tachyon Switches: keys leaving speed trails.
  (c) =>
    line('M1 21H10M3 25H12M0 29H9', c, 1.3, op(0.6)) +
    shadow(16) +
    board(12, 17, 33, 17, K.black) +
    grid(14, 18.5, 9, 4, 2.3, 2.6, 0.9, K.black3) +
    grid(14, 18.5, 2, 4, 2.3, 2.6, 0.9, c),
  // Keyboard of Babel: a ziggurat of keyboards reaching upward.
  (c) =>
    shadow(20) +
    [0, 1, 2, 3, 4]
      .map((i) => {
        const w = 40 - i * 7;
        const bx = 24 - w / 2;
        const by = 36 - i * 7;
        const top = i === 4;
        return board(bx, by, w, 6, top ? c : K.black2) + grid(bx + 1.5, by + 1.5, Math.max(2, Math.floor((w - 3) / 3.1)), 1, 2.3, 2.6, 0.8, top ? K.goldL : K.black3);
      })
      .join('') +
    glow(24, 6, 6, c, 0.35),
  // The Last Keyboard: a cracked stone tablet with glowing rune keys.
  (c) =>
    shadow(20) +
    path('M4 17L10 14H40L44 18V34L40 37H8L4 33Z', '#6b6b70') +
    path('M4 17L10 14H40L44 18V20H4Z', '#7c7c82') +
    grid(8, 21, 8, 3, 3, 3, 1.3, c, op(0.9)) +
    line('M20 14L22 20L19 24M34 37L32 31L35 28', '#4a4a4f', 0.9) +
    spark(42, 9, 2.2, c) +
    spark(6, 8, 1.6, c),
];

// ---------------------------------------------------------------------------
// Headset (front view)
// ---------------------------------------------------------------------------
const band = (col: string, w = 3.5) => line('M11 26C11 8 37 8 37 26', col, w);
const cups = (col: string, cw = 8, ch = 13) => rr(7 - (cw - 8) / 2, 22, cw, ch, 3.5, col) + rr(33 - (cw - 8) / 2, 22, cw, ch, 3.5, col);
const mic = (col: string, tip: string) => line('M10 33C10 40 15 42 21 41', col, 1.8) + circ(22, 41, 1.8, tip);

const HEADSET: Art[] = [
  // Tangled Earbuds: two buds and a hopeless knot.
  () =>
    line('M14 20C18 30 8 30 14 36C20 42 30 30 24 28C18 26 22 38 30 36C38 34 32 24 34 20', K.greyL, 1.2) +
    circ(14, 17, 3.5, K.white) +
    circ(34, 17, 3.5, K.white) +
    circ(14, 17, 1.4, K.greyL) +
    circ(34, 17, 1.4, K.greyL) +
    line('M24 36V43', K.greyL, 1.2) +
    rect(22.8, 42, 2.4, 3, K.greyD),
  // Phone Headphones: thin white band, little round pads.
  () => band(K.white, 2) + circ(11, 29, 4.5, K.white) + circ(37, 29, 4.5, K.white) + circ(11, 29, 2.4, K.greyL) + circ(37, 29, 2.4, K.greyL),
  // Budget Headset: black plastic with a mic boom.
  () => band(K.black2) + cups(K.black2) + mic(K.black3, K.black3),
  // Surround Sound Headset: bigger cups with speaker rings.
  (c) => band(K.black2, 4) + cups(K.black, 9, 14) + circ(11, 29, 3, 'none', stroke(c, 1.2)) + circ(37, 29, 3, 'none', stroke(c, 1.2)) + mic(K.black3, c),
  // Wireless Pro Headset: sleek, cable-free, a stub mic and status light.
  (c) => band(K.greyD, 3) + band(K.black2, 1.5) + cups(K.black2) + circ(11, 25, 0.9, c) + line('M9 33L13 36', K.black3, 2) + circ(37, 25, 0.9, c),
  // Studio Monitors: silver yokes and a coiled cable.
  () =>
    band(K.black2, 3) +
    line('M8 24V20L11 18M40 24V20L37 18', K.silver, 1.6) +
    cups(K.black, 9, 14) +
    circ(11, 29, 2.5, K.black3) +
    circ(37, 29, 2.5, K.black3) +
    line('M11 36L9 38L13 39L9 40L13 41L9 42L13 43', K.black3, 1.1),
  // Planar Magnetic Cans: big open-back cups with metal grilles.
  () =>
    band(K.black2) +
    circ(10, 30, 8, K.black2) +
    circ(38, 30, 8, K.black2) +
    circ(10, 30, 6, K.silverD) +
    circ(38, 30, 6, K.silverD) +
    line('M7 25V35M10 24V36M13 25V35M35 25V35M38 24V36M41 25V35', K.black3, 0.8),
  // Noise-Cancelling Titan: enormous cups that swallow sound.
  (c) =>
    band(K.black, 5) +
    rr(1, 18, 14, 20, 6, K.black2) +
    rr(33, 18, 14, 20, 6, K.black2) +
    line('M5 28H11M37 28H43', c, 1.4) +
    line('M16 12L20 16M32 12L28 16M24 9V14', c, 1.2, op(0.5)),
  // Bone-Conduction Rig: a band that wraps behind, pads on the cheekbones.
  (c) => line('M12 30C8 44 40 44 36 30', K.black2, 3) + rr(9, 21, 6, 10, 3, K.black3) + rr(33, 21, 6, 10, 3, K.black3) + line('M5 22C3 25 3 28 5 31M43 22C45 25 45 28 43 31', c, 1.2),
  // Spatial Audio Halo: a ring of speakers floating overhead.
  (c) =>
    ell(24, 16, 18, 6, 'none', stroke(c, 2)) +
    [
      [6, 16],
      [15, 21],
      [24, 22],
      [33, 21],
      [42, 16],
    ]
      .map(([hx, hy]) => circ(hx, hy, 2.3, K.black2, stroke(c)))
      .join('') +
    line('M24 30V40', c, 1, op(0.4)) +
    ell(24, 40, 8, 1.5, c, op(0.3)),
  // Echolocation Array: a dish on top, pinging.
  (c) =>
    band(K.black2) +
    cups(K.black2) +
    line('M24 10V7', K.greyD, 1.5) +
    path('M17 7Q24 2 31 7Z', K.greyL) +
    line('M14 4.5Q24 0 34 4.5', c, 1.1) +
    line('M11 2.5Q24 -2 37 2.5', c, 1, op(0.5)),
  // Neural Audio Link: two temple nodes and the signal between them.
  (c) =>
    line('M9 26C9 12 39 12 39 26', K.black3) +
    circ(9, 28, 4, K.black2, stroke(c, 1.2)) +
    circ(39, 28, 4, K.black2, stroke(c, 1.2)) +
    line('M13 28Q18 22 24 28T35 28', c, 1.4) +
    circ(9, 28, 1.3, c) +
    circ(39, 28, 1.3, c),
  // Precognitive Sound: the headset, and the echo of where it will be.
  (c) =>
    group(band(c) + cups(c), 'transform="translate(4 -4)" opacity="0.3"') +
    group(band(c), 'transform="translate(2 -2)" opacity="0.55"') +
    band(K.black2) +
    cups(K.black2) +
    circ(11, 29, 2, c) +
    circ(37, 29, 2, c),
  // Harmonic Resonator: a tuning-fork headset humming in rings.
  (c) =>
    rings(24, 26, [9, 14, 19], c) +
    line('M16 36V14C16 8 20 6 24 6C28 6 32 8 32 14V36', K.silver, 3) +
    rect(22.5, 36, 3, 8, K.silverD) +
    circ(16, 36, 2.5, K.black2) +
    circ(32, 36, 2.5, K.black2),
  // Sound of the Cosmos: each cup holds a galaxy.
  (c) =>
    band(K.black) +
    circ(11, 29, 7.5, '#0b0b0f', stroke(c)) +
    circ(37, 29, 7.5, '#0b0b0f', stroke(c)) +
    line('M11 29C14 27 14 32 11 33C7 34 6 28 9 26C12 24 16 26 16 29', c) +
    line('M37 29C40 27 40 32 37 33C33 34 32 28 35 26C38 24 42 26 42 29', c) +
    stars([
      [8, 25],
      [14, 34],
      [34, 25],
      [40, 33],
      [24, 6],
    ]),
  // The Silence Breaker: a golden crown of a headset and its shockwave.
  (c) =>
    rings(24, 28, [18, 22], c) +
    line('M11 26C11 8 37 8 37 26', K.gold, 4) +
    path('M16 11L18 4L21 9L24 2L27 9L30 4L32 11Z', K.gold, stroke(K.goldD, 0.8)) +
    cups(K.gold) +
    circ(11, 29, 2.3, c) +
    circ(37, 29, 2.3, c),
];

// ---------------------------------------------------------------------------
// Chair (front view)
// ---------------------------------------------------------------------------
const starBase = (col: string, lift = K.black3) =>
  rect(22.5, 30, 3, 7, lift) + line('M11 41L24 37L37 41M24 37V42', col, 2.2) + circ(11, 42, 1.6, K.ink) + circ(37, 42, 1.6, K.ink) + circ(24, 43, 1.6, K.ink);

const CHAIR: Art[] = [
  // Wobbly Stool: one leg too short.
  () =>
    shadow(12) +
    line('M16 23L12 42M24 24V43M32 23L34 36', K.woodD, 2.2) +
    ell(24, 21, 12, 3.5, K.wood) +
    ell(24, 20, 12, 3, '#c08e5f') +
    line('M38 33Q41 35 38 37M40 30Q44 33 40 36', K.greyD, 1),
  // Kitchen Chair: wooden slats.
  () =>
    shadow(13) +
    rect(13, 5, 3, 22, K.woodD) +
    rect(32, 5, 3, 22, K.woodD) +
    rect(16, 8, 16, 2.5, K.wood) +
    rect(16, 13.5, 16, 2.5, K.wood) +
    rect(16, 19, 16, 2.5, K.wood) +
    rr(11, 25, 26, 4, 1, '#c08e5f') +
    rect(13, 29, 3, 14, K.woodD) +
    rect(32, 29, 3, 14, K.woodD),
  // Office Chair: grey, sensible, five wheels.
  () => shadow(14) + rr(14, 5, 20, 19, 5, K.greyD) + rr(11, 24, 26, 6, 3, K.grey) + starBase(K.black3),
  // Racing-Style Chair: bucket wings and racing stripes.
  (c) =>
    shadow(14) +
    path('M13 4H35L38 11L34 25H14L10 11Z', K.black2) +
    rect(20, 4, 2.5, 21, c) +
    rect(25.5, 4, 2.5, 21, c) +
    rr(16, 7, 3.5, 5, 1.5, K.ink) +
    rr(28.5, 7, 3.5, 5, 1.5, K.ink) +
    rr(10, 25, 28, 6, 3, K.black2) +
    rect(10, 25, 28, 1.2, c) +
    starBase(K.black2),
  // Mesh Ergo Chair: breathable mesh back, lumbar support, armrests.
  (c) =>
    shadow(14) +
    rr(13, 3, 22, 22, 6, K.black3) +
    rr(15, 5, 18, 18, 5, '#26272c') +
    line('M15 9H33M15 13H33M15 17H33M19 5V23M24 5V23M29 5V23', K.black3, 0.6) +
    path('M16 19Q24 23 32 19V21Q24 25 16 21Z', c) +
    line('M9 21V28H14M39 21V28H34', K.black3, 2) +
    rr(11, 25, 26, 5, 2.5, K.black2) +
    starBase(K.silverD),
  // Premium Ergo Throne: tall padded back, headrest and contrast stitching.
  (c) =>
    shadow(15) +
    rr(13, 1, 22, 26, 6, K.black) +
    rr(16, 3, 16, 5, 2.5, K.black3) +
    rr(15.5, 10, 17, 15, 4, 'none', `${stroke(c, 0.8)} stroke-dasharray="1.4 1"`) +
    rr(8, 20, 5, 8, 2, K.black2) +
    rr(35, 20, 5, 8, 2, K.black2) +
    rr(10, 25, 28, 6, 3, K.black2) +
    starBase(K.silver, K.silverD),
  // Heated Massage Chair: overstuffed, radiating warmth, remote on a cord.
  () =>
    shadow(16) +
    line('M17 6Q15 3 17 0M24 6Q22 3 24 0M31 6Q29 3 31 0', '#ff9a3c', 1.3) +
    rr(11, 7, 26, 22, 9, '#5a2f35') +
    rr(15, 11, 18, 5, 2.5, '#6e3a42') +
    rr(15, 18, 18, 5, 2.5, '#6e3a42') +
    rr(6, 17, 8, 18, 4, '#4a262b') +
    rr(34, 17, 8, 18, 4, '#4a262b') +
    rr(10, 29, 28, 8, 3, '#5a2f35') +
    rect(12, 37, 4, 6, K.black2) +
    rect(32, 37, 4, 6, K.black2) +
    line('M42 30C46 32 45 38 43 40', K.black3) +
    rr(41, 39, 4, 6, 1, K.black2),
  // Zero-G Recliner: tipped back with the feet up.
  (c) =>
    shadow(18) +
    group(rr(4, 10, 11, 22, 4, K.black2), 'transform="rotate(-40 12 28)"') +
    path('M13 28L33 25L44 17L46 20L35 29L14 33Z', K.black2) +
    line('M14 33L30 29', c, 1.2) +
    line('M18 32L14 42M30 30L34 42', K.silverD, 2),
  // Anti-Gravity Seat: no legs at all.
  (c) =>
    ell(24, 44, 11, 2, '#000', op(0.25)) +
    rr(14, 3, 20, 19, 5, K.black2) +
    rect(14, 13, 20, 1.2, c) +
    rr(11, 22, 26, 6, 3, K.black2) +
    line('M14 31H34M17 34.5H31M20 38H28', c, 1.2, op(0.7)),
  // Posture-AI Throne: a robot arm hovering over the chair, scanning.
  (c) =>
    shadow(15) +
    path('M35 12L40 18L20 20Z', c, op(0.2)) +
    rr(13, 6, 22, 22, 6, K.black) +
    rr(10, 26, 28, 6, 3, K.black2) +
    starBase(K.silver, K.silverD) +
    line('M6 44V20L14 6L30 4', K.greyD, 2.4) +
    circ(6, 20, 1.8, K.black3) +
    circ(14, 6, 1.8, K.black3) +
    rr(29, 1, 9, 6, 2, K.black2) +
    circ(35, 4, 1.6, c),
  // Levitating Cushion: just a cushion, hovering on its own glow.
  (c) =>
    ell(24, 40, 14, 3, c, op(0.35)) +
    glow(24, 33, 9, c, 0.12) +
    path('M8 20C8 14 12 13 24 13C36 13 40 14 40 20V26C40 32 36 33 24 33C12 33 8 32 8 26Z', '#e8e2f0') +
    path('M8 20C8 14 12 13 24 13C36 13 40 14 40 20', 'none', stroke('#fff', 1.2)) +
    circ(16, 23, 1.2, '#b9b2c6') +
    circ(24, 23, 1.2, '#b9b2c6') +
    circ(32, 23, 1.2, '#b9b2c6'),
  // Cryo-Rest Pod: a frosted capsule.
  (c) =>
    shadow(13) +
    rr(12, 2, 24, 42, 12, K.silver) +
    rr(15.5, 7, 17, 26, 8.5, K.ice, op(0.85)) +
    stars(
      [
        [19, 12],
        [28, 15],
        [21, 22],
        [27, 27],
        [23, 17],
      ],
      '#fff',
    ) +
    rect(12, 36, 24, 1.8, c) +
    circ(24, 40, 1.4, c),
  // Hover Throne: a throne riding on thrusters.
  (c) =>
    path('M16 36L13 44H19ZM32 36L29 44H35Z', '#ff9a3c', op(0.85)) +
    path('M12 4L16 8L20 3L24 7L28 3L32 8L36 4V26H12Z', K.black) +
    rr(15, 10, 18, 14, 3, '#26272c') +
    rr(9, 25, 30, 7, 3, K.black2) +
    rect(9, 25, 30, 1.2, c) +
    rr(13, 32, 6, 4, 1, K.black3) +
    rr(29, 32, 6, 4, 1, K.black3),
  // Chair of Perfect Posture: a minimal frame drawn on the golden spiral.
  () =>
    line('M24 24C24 20 28 20 28 24C28 30 20 30 20 24C20 14 34 14 34 24C34 38 14 38 14 24', K.gold, 1, op(0.6)) +
    shadow(12) +
    line('M16 4V26H33M16 26L14 43M33 26V43M20 26L22 43', K.white, 2) +
    line('M16 4H22', K.white, 2),
  // Celestial Throne: a throne cut from the night sky.
  (c) =>
    glow(24, 20, 17, c, 0.14) +
    path('M11 42V12Q11 3 24 1Q37 3 37 12V42H33V30H15V42Z', '#0d0d16', stroke(c, 1.2)) +
    stars([
      [18, 10],
      [29, 8],
      [24, 16],
      [16, 22],
      [32, 20],
      [21, 26],
      [28, 25],
    ]) +
    path('M29 12A3 3 0 1 0 29 17A2.2 2.2 0 1 1 29 12Z', K.goldL) +
    rr(9, 30, 30, 4, 1.5, c, op(0.7)),
  // The Iron Seat: a throne of welded blades.
  () =>
    shadow(17) +
    [-18, -11, -5, 0, 5, 11, 18].map((a) => group(path('M23 30L24 4L25 30Z', '#8a8e95'), `transform="rotate(${a} 24 30)"`)).join('') +
    rr(12, 22, 24, 10, 2, '#5f636a') +
    rr(9, 30, 30, 6, 2, '#6f737a') +
    line('M12 36V43M36 36V43M20 36V43M28 36V43', '#5f636a', 2.2) +
    rect(9, 30, 30, 1, '#a8acb3'),
];

// ---------------------------------------------------------------------------
// Desk
// ---------------------------------------------------------------------------
const topSlab = (tx: number, ty: number, w: number, h: number, fill: string) => rr(tx, ty, w, h, 1, fill);

const DESK: Art[] = [
  // Cardboard Box: the org's first desk.
  () =>
    shadow(17) +
    path('M9 20L14 14H42L38 20Z', '#d8b183') +
    path('M38 20L42 14V36L38 42Z', '#a87e52') +
    rect(9, 20, 29, 22, '#c49a6c') +
    path('M9 20L4 15L12 13L14 14Z', '#b88d5e') +
    rect(9, 27, 29, 3, '#e8d9a8', op(0.75)) +
    line('M14 35H22', '#8f6a45', 1),
  // Folding Table: flimsy X legs.
  () => shadow(19) + topSlab(4, 17, 40, 3, K.greyL) + line('M8 20L20 42M20 20L8 42M40 20L28 42M28 20L40 42', K.greyD, 1.6),
  // Flat-Pack Desk: birch veneer, with the allen key it came with.
  () =>
    shadow(18) +
    topSlab(5, 16, 38, 4, '#e6dcc6') +
    rect(8, 20, 3, 22, '#d5c8ac') +
    rect(37, 20, 3, 22, '#d5c8ac') +
    rect(11, 20, 26, 8, '#dcd0b5') +
    line('M42 43H46V38', K.greyD, 1.6),
  // Gaming Desk: black top with an LED edge and Z legs.
  (c) =>
    shadow(19) +
    topSlab(3, 17, 42, 4, K.black2) +
    rect(3, 20.5, 42, 1.2, c) +
    rr(10, 15.8, 16, 1.4, 0.5, K.ink) +
    line('M9 22L15 32L9 42M39 22L33 32L39 42', K.black, 2.8),
  // Standing Desk: telescoping legs and a height controller.
  (c) =>
    shadow(17) +
    topSlab(6, 7, 36, 3.5, '#e6dcc6') +
    rect(10, 10.5, 3.5, 15, K.silverD) +
    rect(10.5, 25.5, 2.5, 16, K.silver) +
    rect(34.5, 10.5, 3.5, 15, K.silverD) +
    rect(35, 25.5, 2.5, 16, K.silver) +
    rect(7, 41, 9, 2, K.greyD) +
    rect(32, 41, 9, 2, K.greyD) +
    rr(27, 10.5, 6, 3, 0.8, K.black2) +
    circ(29, 12, 0.6, c) +
    circ(31, 12, 0.6, c),
  // Motorised L-Desk: an L-shaped top and a motor keypad.
  (c) =>
    shadow(20) +
    path('M3 22L10 14H45L41 19H23L16 27H3Z', K.black2) +
    path('M3 27H16V30H3Z', K.black) +
    path('M16 27L23 19H41V22H24L16 30Z', K.black) +
    line('M5 30V43M14 30V41M39 22V36', K.black3, 2.4) +
    rr(6, 27.5, 5, 2, 0.6, c),
  // Carbon Command Centre: a wide desk with a monitor shelf and cable tray.
  (c) =>
    shadow(21) +
    rect(8, 12, 32, 2.5, K.black2) +
    rect(12, 14.5, 2, 10, K.black3) +
    rect(34, 14.5, 2, 10, K.black3) +
    topSlab(2, 24, 44, 4, K.black) +
    line('M4 25L10 27M10 25L16 27M16 25L22 27M22 25L28 27M28 25L34 27M34 25L40 27', K.black3, 0.6) +
    rect(2, 27.5, 44, 1, c) +
    rect(10, 30, 28, 3, K.black2) +
    line('M6 28V43M42 28V43', K.black2, 2.6),
  // Holo-Table: a pedestal table projecting a spinning cube.
  (c) =>
    shadow(15) +
    path('M18 25L10 6H38L30 25Z', c, op(0.12)) +
    path('M24 8L30 11V18L24 21L18 18V11Z', 'none', stroke(c, 1.2)) +
    line('M24 14V21M18 11L24 14L30 11', c, 0.9) +
    ell(24, 26, 16, 3.5, K.black2) +
    ell(24, 25.5, 11, 2, c, op(0.7)) +
    rect(22, 28, 4, 12, K.black3) +
    ell(24, 41, 9, 2, K.black2),
  // Smart Battle Station: a touchscreen desktop between light pillars.
  (c) =>
    shadow(20) +
    rr(3, 6, 4, 36, 2, K.black2) +
    rr(41, 6, 4, 36, 2, K.black2) +
    rect(4.2, 8, 1.6, 30, c, op(0.85)) +
    rect(42.2, 8, 1.6, 30, c, op(0.85)) +
    path('M8 22L12 16H36L40 22Z', K.black) +
    path('M11 21L14 17H34L37 21Z', c, op(0.35)) +
    rect(8, 22, 32, 3, K.black2) +
    line('M11 25V42M37 25V42', K.black2, 2.4),
  // Anti-Vibration Slab: a block of stone on sprung dampers.
  () =>
    shadow(20) +
    rr(3, 14, 42, 11, 1.5, '#8a8a8e') +
    rr(3, 14, 42, 3, 1.5, '#9c9ca0') +
    stars(
      [
        [9, 20],
        [15, 22],
        [23, 19],
        [31, 22],
        [38, 20],
        [42, 23],
      ],
      '#6c6c70',
    ) +
    line('M9 25L6 28L12 31L6 34L12 37L6 40L9 42M39 25L36 28L42 31L36 34L42 37L36 40L39 42', K.silverD, 1.3) +
    rect(5, 42, 8, 2, K.black3) +
    rect(35, 42, 8, 2, K.black3),
  // Mission Control Console: rows of buttons and twin readouts.
  (c) =>
    shadow(20) +
    path('M3 24L9 12H39L45 24V38H3Z', K.black2) +
    path('M9 12H39L45 24H3Z', '#26272c') +
    rr(11, 14, 10, 7, 1, '#0c0c0e', stroke(c, 0.8)) +
    rr(27, 14, 10, 7, 1, '#0c0c0e', stroke(c, 0.8)) +
    line('M13 18.5L15 16.5L17 19L19 16', c, 0.9) +
    ['#4ade80', '#f5c451', '#e0474c', c, '#4ade80', c, '#f5c451', '#e0474c'].map((col, i) => circ(9 + i * 4.3, 28, 1.2, col)).join('') +
    grid(8, 32, 8, 1, 3.4, 2, 1, K.black3),
  // Zero-G Workstation: a slab tethered in mid-air, the pen floating off.
  (c) =>
    ell(24, 44, 14, 2, '#000', op(0.2)) +
    line('M8 20L14 0M40 20L34 0', K.greyD, 0.9, 'stroke-dasharray="1.5 1.5"') +
    topSlab(4, 20, 40, 4.5, K.black2) +
    rect(4, 23.5, 40, 1, c) +
    group(rr(29, 12, 9, 2, 1, K.greyL) + path('M38 12L40 13L38 14Z', K.gold), 'transform="rotate(-18 33 13)"') +
    rr(12, 13, 5, 7, 1.2, K.white) +
    line('M8 31H14M34 33H40', c, 1.2, op(0.6)),
  // Orbital Command Deck: a round deck with a planet above it.
  (c) =>
    shadow(19) +
    ell(24, 32, 21, 7, K.black2) +
    ell(24, 30, 21, 7, '#26272c', stroke(c, 1.2)) +
    line('M5 30V24M43 30V24M14 36V30M34 36V30', K.greyD, 1.2) +
    ell(24, 24, 21, 6.5, 'none', stroke(K.greyD, 0.8)) +
    circ(24, 12, 6, '#d9795b') +
    path('M18.5 10C21 12 27 12 29.5 10', 'none', stroke('#b85f45', 1)) +
    ell(24, 12, 10, 2.4, 'none', `${stroke(c, 1.2)} transform="rotate(-12 24 12)"`),
  // Singularity Desk: the middle of the desk falling into itself.
  (c) =>
    shadow(20) +
    path('M3 17H17C20 17 21 25 24 25C27 25 28 17 31 17H45V21H31C28 21 27 30 24 30C21 30 20 21 17 21H3Z', K.black2) +
    circ(24, 27, 5, '#000', stroke(c, 1)) +
    line('M24 27C26 25 28 28 25 30C21 32 19 26 22 23C26 20 31 24 30 29', c, 1) +
    line('M6 21V42M42 21V42', K.black2, 2.4),
  // Desk at the Edge of Time: an hourglass on a desk that is crumbling away.
  (c) =>
    shadow(18) +
    path('M3 21H30L32 23L30 25H3Z', K.black2) +
    path('M3 25H30V27H3Z', K.black) +
    path('M33 20L38 21L36 25L32 24Z', K.black2) +
    path('M40 17L44 18L42 21Z', K.black2, op(0.7)) +
    path('M44 11L46 12L45 14Z', K.black2, op(0.45)) +
    line('M6 27V42', K.black2, 2.4) +
    line('M27 27V38', K.black2, 2.4) +
    rect(11, 3, 12, 2, K.goldD) +
    rect(11, 19, 12, 2, K.goldD) +
    path('M12.5 5H21.5L17 12L21.5 19H12.5L17 12Z', K.ice, op(0.8)) +
    path('M14 17H20L17 13Z', c),
  // The Grand Station: a golden arc of a console around a glowing orb.
  (c) =>
    shadow(21) +
    glow(24, 14, 10, c, 0.25) +
    circ(24, 14, 5, c) +
    circ(22.5, 12.5, 1.6, '#fff', op(0.8)) +
    path('M2 30Q24 16 46 30V36Q24 23 2 36Z', K.gold) +
    path('M2 30Q24 16 46 30', 'none', stroke(K.goldL, 1.2)) +
    line('M8 34V43M40 34V43M16 29V41M32 29V41', K.goldD, 2.2) +
    spark(8, 12, 2, K.goldL) +
    spark(41, 9, 2.4, c),
];

// ---------------------------------------------------------------------------
// Shoes (side view, toe to the right)
// ---------------------------------------------------------------------------
const SHOE = 'M5 33C5 27 11 23 17 23L25 21C29 21 31 24 35 26L41 28C44 29 44 33 42 35H7C5.5 35 5 34.5 5 33Z';
const sole = (col: string, h = 3.5, sy = 34) => rr(4, sy, 40, h, 1.8, col);
const laces = (col = K.white) => line('M17 24L20 28M20.5 22.8L23.5 27M24 22L27 26', col, 1.1);
const HIGHTOP = 'M6 33V14C6 11 9 9 12 9H19C21 9 21 12 21 15V20L27 21C31 21 33 24 36 26L41 28C44 29 44 33 42 35H7C6 35 6 34 6 33Z';

const SHOES: Art[] = [
  // Socks: well-worn tube socks.
  () =>
    shadow(15) +
    path('M15 6H27V25C27 29 31 30 35 31C40 32 41 38 37 40H18C14 40 15 36 15 33Z', K.white) +
    rect(15, 8, 12, 2, K.red) +
    rect(15, 12, 12, 2, K.red) +
    path('M31 30.5C36 31 40 33 38 38L36 39C37 35 34 33 31 33Z', K.greyL) +
    circ(22, 35, 1.4, K.greyL),
  // Flip-Flops: a foam sole and a Y strap.
  () => shadow(19) + rr(4, 33, 40, 5, 2.5, '#3aa39a') + rr(4, 33, 40, 2, 1, '#57c2b8') + line('M11 34Q18 25 26 25Q32 25 36 34M26 25V31', K.white, 2),
  // Sport-Mode Crocs: holes everywhere, strap flipped forward.
  () =>
    shadow(19) +
    path('M5 34C5 25 13 20 22 21C30 21 34 25 38 27C43 29 45 33 43 35H6Z', '#7bc96f') +
    sole('#5ea853', 3, 34) +
    [
      [15, 26],
      [21, 25],
      [27, 25.5],
      [33, 28],
      [18, 30],
      [24, 30],
      [30, 31],
    ]
      .map(([hx, hy]) => circ(hx, hy, 1.3, '#4e8d45'))
      .join('') +
    line('M8 30Q10 19 20 21', '#5ea853', 2.6),
  // Canvas Sneakers: rubber toe cap and classic laces.
  () =>
    shadow(19) +
    path(SHOE, '#ecebe6') +
    path('M35 26L41 28C44 29 44 33 42 35H33C33 31 33 28 35 26Z', '#f7f6f2', stroke(K.greyL, 0.8)) +
    sole('#f7f6f2', 3.5) +
    rect(4, 35.5, 40, 1, K.red) +
    laces(K.ink) +
    circ(9, 27, 1.8, K.ink),
  // Running Shoes: mesh upper, swoosh and a thick foam sole.
  (c) =>
    shadow(19) +
    path(SHOE, '#d6d9de') +
    line('M8 31Q20 31 34 25', c, 2.4) +
    sole(K.white, 5) +
    rr(4, 36.5, 40, 1.4, 0.7, c) +
    laces(K.greyD),
  // High-Tops: a tall collar and an ankle strap.
  (c) =>
    shadow(19) +
    path(HIGHTOP, K.white) +
    path('M6 20H21V26H6Z', K.black2) +
    path('M6 14C6 11 9 9 12 9H19C21 9 21 12 21 14Z', K.red) +
    rr(5, 16, 17, 2.5, 1, c) +
    sole(K.white, 3.5) +
    laces(K.ink),
  // Limited Drop Kicks: loud colour blocking and a hang tag.
  () =>
    shadow(19) +
    path(SHOE, K.white) +
    path('M5 33C5 27 11 23 17 23L20 22.5V35H7C5.5 35 5 34.5 5 33Z', K.red) +
    path('M28 21.5C31 22 32 24 35 26L41 28C44 29 44 33 42 35H32Z', K.black2) +
    sole(K.ink, 3.5) +
    line('M17 24C14 20 12 16 13 13', K.greyD, 0.8) +
    rr(10, 9, 7, 5, 1, K.gold) +
    rect(11.5, 10.8, 4, 1.2, K.ink),
  // Self-Lacing Sneakers: no laces, a motor dial and light strips.
  (c) =>
    shadow(19) +
    path(HIGHTOP, K.greyL) +
    path('M6 14C6 11 9 9 12 9H19C21 9 21 12 21 14V17H6Z', K.greyD) +
    circ(14, 24, 3, K.black2, stroke(c, 1.2)) +
    sole(K.black2, 3.5) +
    rect(4, 34.5, 40, 1.2, c) +
    rect(6, 16.4, 15, 1, c),
  // Air-Cushion Units: a window of air in the sole.
  (c) => shadow(19) + path(SHOE, '#e2e2e0') + line('M9 30Q20 28 32 26', K.black3, 2) + sole(K.white, 6) + rr(9, 35.3, 14, 3.4, 1.7, c, op(0.55)) + rect(11, 35.8, 8, 0.8, '#fff', op(0.8)) + laces(K.black3),
  // Grip-Tech Trainers: an aggressive tread.
  (c) => shadow(19) + path(SHOE, K.black2) + line('M8 31Q20 30 34 25', c, 1.6) + sole(K.black3, 3) + path('M5 37L7 40L9 37L11 40L13 37L15 40L17 37L19 40L21 37L23 40L25 37L27 40L29 37L31 40L33 37L35 40L37 37L39 40L41 37Z', K.ink) + laces(K.greyL),
  // Hoverboots: glowing thrusters and a gap to the ground.
  (c) =>
    ell(24, 44.5, 14, 2, c, op(0.3)) +
    path('M9 39H39L36 44H12Z', c, op(0.2)) +
    group(path(HIGHTOP, K.black2) + sole(K.black3, 3) + rect(8, 37, 32, 1.5, c) + rect(6, 16, 15, 1.4, c), 'transform="translate(0 -3)"'),
  // Anti-Gravity Boots: floating inside their own orbit.
  (c) =>
    ell(24, 44.5, 10, 1.5, '#000', op(0.2)) +
    ell(24, 28, 22, 5, 'none', `${stroke(c, 1.2)} ${op(0.6)}`) +
    group(path(HIGHTOP, '#e6e6e8') + path('M6 14C6 11 9 9 12 9H19C21 9 21 12 21 14V18H6Z', c) + sole(K.black2, 3), 'transform="translate(0 -5)"') +
    ell(24, 34, 18, 3.5, 'none', stroke(c, 1.2)),
  // Rocket Sneakers: a nozzle on the heel, fully lit.
  (c) =>
    path('M8 26L1 22.5V33.5L8 30Z', '#ff9a3c') +
    path('M8 27L4 25.5V31.5L8 29.5Z', K.goldL) +
    shadow(17) +
    group(path(SHOE, K.white) + line('M8 31Q20 30 34 25', c, 2) + sole(K.black2, 3.5) + laces(K.black3), 'transform="translate(3 0) scale(0.94)"') +
    rr(5, 24, 5, 6, 1.5, K.greyD),
  // Quantum Loafers: a smart loafer caught in several states at once.
  (c) =>
    shadow(19) +
    group(path('M5 33C5 28 10 25 16 25H26C31 25 35 27 40 29C44 31 44 34 42 35H7C5.5 35 5 34.5 5 33Z', c), 'transform="translate(-3 -4)" opacity="0.3"') +
    group(path('M5 33C5 28 10 25 16 25H26C31 25 35 27 40 29C44 31 44 34 42 35H7C5.5 35 5 34.5 5 33Z', c), 'transform="translate(3 -2)" opacity="0.45"') +
    path('M5 33C5 28 10 25 16 25H26C31 25 35 27 40 29C44 31 44 34 42 35H7C5.5 35 5 34.5 5 33Z', K.black2) +
    rect(20, 26, 9, 2.4, K.ink) +
    circ(24.5, 27.2, 0.8, K.gold) +
    sole(K.ink, 2.5),
  // Golden Kicks of Clutch: solid gold and sparkling.
  (c) =>
    shadow(19) +
    path(SHOE, K.gold) +
    path('M9 29Q20 26 33 24', 'none', `${stroke('#fff', 1.4)} ${op(0.6)}`) +
    sole(K.goldD, 3.5) +
    laces(K.goldL) +
    spark(38, 16, 3, K.goldL) +
    spark(8, 18, 2.2, c) +
    spark(44, 24, 1.6, '#fff'),
  // Sneakers of the Gods: winged, haloed, white and gold.
  (c) =>
    ell(14, 8, 8, 2.2, 'none', stroke(K.gold, 1.4)) +
    shadow(19) +
    path(HIGHTOP, K.white) +
    path('M8 16C3 12 2 6 5 2C7 7 9 9 12 10C9 6 9 3 11 0.5C13 5 16 8 19 10', K.goldL, stroke(K.goldD, 0.8)) +
    sole(K.gold, 3.5) +
    rect(4, 34, 40, 1, c) +
    laces(K.goldD),
];

// ---------------------------------------------------------------------------
// Jersey (front)
// ---------------------------------------------------------------------------
const SHIRT = 'M15 8L20 6C21.5 9.5 26.5 9.5 28 6L33 8L42 15L37.5 21L34 18.5V42H14V18.5L10.5 21L6 15Z';
const shirt = (fill: string, extra = '') => path(SHIRT, fill, extra);
const collar = (col: string) => line('M20 6C21.5 9.5 26.5 9.5 28 6', col, 1.4);
const clipped = (id: string, inner: string) => `<clipPath id="${id}"><path d="${SHIRT}"/></clipPath>` + group(inner, `clip-path="url(#${id})"`);
/** A simple "10" for shirt numbers, drawn so it needs no font. */
const ten = (col: string, nx = 24, ny = 24, s = 1) => rect(nx - 5 * s, ny - 5 * s, 2.2 * s, 10 * s, col) + ell(nx + 2.5 * s, ny, 2.8 * s, 5 * s, 'none', stroke(col, 2 * s));

const JERSEY: Art[] = [
  // Plain T-Shirt.
  () => shadow(14) + shirt('#a7a9ad') + collar('#8a8c91'),
  // Printed Tee: a little graphic on the chest.
  () => shadow(14) + shirt(K.white) + collar(K.greyL) + circ(24, 21, 5, K.red) + path('M21 21L24 17L27 21L24 25Z', K.white) + rect(19, 29, 10, 1.4, K.black3) + rect(20.5, 32, 7, 1.2, K.black3),
  // Team Polo: collar and a button placket.
  () =>
    shadow(14) +
    shirt('#3d6b5a') +
    path('M20 6L24 12L28 6L30 7L25 14H23L18 7Z', '#e8e6e1') +
    rect(23.3, 14, 1.4, 8, '#2f5647') +
    circ(24, 16, 0.7, '#e8e6e1') +
    circ(24, 19.5, 0.7, '#e8e6e1'),
  // Replica Jersey: V-neck, cuffs and a number.
  () => shadow(14) + shirt('#c8283c') + path('M20 6L24 13L28 6Z', K.white) + line('M8 16.5L11.5 20M40 16.5L36.5 20', K.white, 1.6) + ten(K.white, 23, 27),
  // Pro Jersey: sleeve stripes and a sponsor patch.
  (c) =>
    shadow(14) +
    shirt(K.black2) +
    clipped('ga-pro', rect(0, 13, 48, 2, c) + rect(0, 16.5, 48, 1.2, c)) +
    collar(c) +
    rr(17, 15, 7, 4, 0.8, K.white) +
    ten(K.white, 25, 30, 0.9),
  // Signed Pro Jersey: the same kit, signed in marker.
  (c) =>
    shadow(14) +
    shirt(K.white) +
    clipped('ga-signed', rect(0, 13, 48, 2, c)) +
    collar(c) +
    ten(c, 24, 20, 0.8) +
    line('M16 33C18 29 19 36 21 31C22 28 23 35 25 31C26 29 28 34 30 30C31 28 33 31 34 29', K.ink, 1.3),
  // Moisture-Wicking Kit: breathable dotted side panels.
  (c) => shadow(14) + shirt('#e8e6e1') + clipped('ga-wick', grid(12, 18, 3, 8, 1, 1, 1.8, K.greyL) + grid(29, 18, 3, 8, 1, 1, 1.8, K.greyL) + rect(0, 40, 48, 2, c)) + collar(c),
  // Carbon-Weave Jersey: woven black fibre.
  (c) => shadow(14) + shirt(K.black) + clipped('ga-carbonj', weave()) + collar(c) + rect(23.2, 12, 1.6, 30, c, op(0.8)),
  // LED-Trim Jersey: glowing seams.
  (c) => shadow(14) + shirt(K.black2) + path(SHIRT, 'none', stroke(c, 1.3)) + collar(c) + line('M14 30H34', c, 1) + ten(c, 24, 23, 0.8),
  // Holographic Jersey: iridescent bands that shift with the light.
  (c) =>
    shadow(14) +
    shirt(K.silver) +
    clipped(
      'ga-holo',
      ['#ff7a9c', '#f5c451', '#5fd3a8', c, '#ff7a9c'].map((col, i) => path(`M${-8 + i * 11} 48L${10 + i * 11} 0H${16 + i * 11}L${-2 + i * 11} 48Z`, col, op(0.55))).join(''),
    ) +
    collar('#fff'),
  // Adaptive Smart Fabric: a hex lattice with a circuit running through it.
  (c) => shadow(14) + shirt('#1c1d22') + clipped('ga-smart', hexes(18, 14, '#2a2b31') + hexes(30, 14, '#2a2b31') + hexes(24, 28, '#2a2b31')) + line('M17 20H22L24 24H31M24 24V34', c, 1.1) + circ(31, 24, 1, c) + collar(c),
  // Nano-Weave Kit: a fine luminous mesh.
  (c) => {
    let mesh = '';
    for (let i = 0; i < 24; i++) mesh += line(`M${i * 2} 0V48`, c, 0.35, op(0.5)) + line(`M0 ${i * 2}H48`, c, 0.35, op(0.35));
    return shadow(14) + shirt('#16171b') + clipped('ga-nano', mesh) + collar(c);
  },
  // Starlight Jersey: a night sky with a constellation.
  (c) =>
    shadow(14) +
    shirt('#0e0e16') +
    stars([
      [12, 15],
      [17, 23],
      [30, 13],
      [36, 17],
      [20, 34],
      [28, 38],
      [31, 28],
      [16, 39],
    ]) +
    line('M18 18L23 24L29 21L27 30', c, 0.8) +
    [
      [18, 18],
      [23, 24],
      [29, 21],
      [27, 30],
    ]
      .map(([sx, sy]) => circ(sx, sy, 1.1, c))
      .join('') +
    collar(c),
  // Aurora Kit: northern lights rippling across the chest.
  () =>
    shadow(14) +
    shirt('#101216') +
    clipped(
      'ga-aurora',
      path('M0 22C10 16 18 26 28 20C36 15 42 20 48 16V24C42 28 36 23 28 28C18 34 10 24 0 30Z', '#4ade80', op(0.55)) +
        path('M0 28C10 22 20 32 30 26C38 22 44 26 48 24V29C44 31 38 27 30 31C20 37 10 27 0 33Z', '#2dd4bf', op(0.5)) +
        path('M0 16C12 10 20 20 30 14C38 10 44 14 48 12V16C44 18 38 14 30 18C20 24 12 14 0 20Z', '#ff7a9c', op(0.4)),
    ) +
    collar('#5fd3a8'),
  // Legendary Jersey: gold, with a laurel wreath.
  () =>
    shadow(14) +
    shirt(K.gold) +
    collar(K.goldD) +
    line('M18 34C15 29 16 23 20 20M30 34C33 29 32 23 28 20', K.goldD, 1.3) +
    [
      [16.5, 30],
      [16.3, 25.5],
      [18, 22],
      [31.5, 30],
      [31.7, 25.5],
      [30, 22],
    ]
      .map(([lx, ly]) => ell(lx, ly, 1.8, 1, K.goldD))
      .join('') +
    ten(K.white, 24, 27, 0.7),
  // Jersey of a Thousand Champions: covered in stars and medals.
  (c) =>
    glow(24, 24, 20, c, 0.14) +
    shadow(14) +
    shirt(K.black2, stroke(K.gold, 0.8)) +
    clipped(
      'ga-champ',
      [
        [12, 15],
        [18, 22],
        [30, 21],
        [36, 16],
        [17, 32],
        [24, 37],
        [31, 32],
        [24, 27],
      ]
        .map(([sx, sy], i) => spark(sx, sy, i === 7 ? 3.5 : 2, K.gold))
        .join(''),
    ) +
    collar(K.gold) +
    line('M22 9L22 14M26 9L26 14', c, 1) +
    circ(24, 16, 2.4, K.gold, stroke(c, 0.8)),
];

// ---------------------------------------------------------------------------
// Lucky charm
// ---------------------------------------------------------------------------
const duck = (body: string, shade: string, beak: string) =>
  ell(22, 31, 14, 9, body) +
  path('M11 29Q18 34 26 29', 'none', stroke(shade, 1.4)) +
  circ(30, 18, 8, body) +
  path('M36 18L44 20L36 23Z', beak) +
  circ(32, 16, 1.4, K.ink) +
  circ(32.5, 15.5, 0.5, '#fff');

const CHARM: Art[] = [
  // Lucky Penny.
  () => shadow(11) + circ(24, 23, 14, K.copper) + circ(24, 23, 11, 'none', stroke('#9d5a2e', 1.2)) + rect(22.5, 16, 3, 14, '#9d5a2e') + path('M22.5 16L19.5 19L20.5 20L22.5 18Z', '#9d5a2e') + path('M14 17C16 13 20 11 24 11', 'none', `${stroke('#f0b58a', 1.4)} ${op(0.7)}`),
  // Rubber Duck.
  () => shadow(14) + duck('#ffd23f', '#e0b423', '#ff9a3c'),
  // Four-Leaf Clover.
  () =>
    line('M24 26C24 34 22 40 18 44', K.green, 2) +
    [0, 90, 180, 270].map((a) => group(circ(20, 16, 5.2, K.green) + circ(28, 16, 5.2, K.green) + path('M15.5 18L24 26L32.5 18Z', K.green), `transform="rotate(${a} 24 22)"`)).join('') +
    circ(24, 22, 2, '#3d9458'),
  // Plush Mascot: a well-loved bear.
  () =>
    shadow(13) +
    circ(15, 10, 4.5, '#c9976a') +
    circ(33, 10, 4.5, '#c9976a') +
    circ(15, 10, 2.2, '#e9c09a') +
    circ(33, 10, 2.2, '#e9c09a') +
    ell(24, 34, 12, 10, '#d6a77a') +
    circ(24, 17, 10, '#d6a77a') +
    ell(24, 21, 4.5, 3.5, '#e9c09a') +
    circ(24, 19.8, 1.4, K.ink) +
    circ(20, 15, 1.3, K.ink) +
    circ(28, 15, 1.3, K.ink) +
    line('M24 28V40', '#b88a5e', 0.8, 'stroke-dasharray="1.2 1"') +
    ell(16, 42, 4, 2.5, '#c9976a') +
    ell(32, 42, 4, 2.5, '#c9976a'),
  // Unwashed Lucky Socks: a lucky pair, and you can tell.
  () =>
    line('M14 8Q12 5 14 2M20 7Q18 4 20 1M26 8Q24 5 26 2', '#8fbf5a', 1.3) +
    group(path('M10 12H20V30C20 34 23 35 27 36C31 37 32 42 28 43H13C10 43 10 40 10 37Z', '#dcd8ce'), 'transform="rotate(-8 20 28)"') +
    path('M22 12H32V30C32 34 35 35 39 36C43 37 44 42 40 43H25C22 43 22 40 22 37Z', K.white) +
    rect(22, 14, 10, 2, K.red) +
    ell(29, 33, 3, 2, '#b8a98a', op(0.6)) +
    ell(14, 24, 2.5, 1.8, '#b8a98a', op(0.6)),
  // Crystal Pendant: a faceted crystal on a fine chain.
  (c) =>
    line('M10 2L24 14L38 2', K.silver, 1) +
    circ(24, 14, 1.5, K.silver) +
    glow(24, 29, 12, c, 0.18) +
    path('M24 16L31 22L28 40L24 44L20 40L17 22Z', c, op(0.85)) +
    path('M24 16L31 22L24 26L17 22Z', '#fff', op(0.45)) +
    line('M24 26V44M17 22L20 40M31 22L28 40', '#fff', 0.6, op(0.5)),
  // Golden Duck.
  (c) => shadow(14) + duck(K.gold, K.goldD, '#ff9a3c') + path('M14 26C16 23 20 22 22 22', 'none', `${stroke('#fff', 1.4)} ${op(0.6)}`) + spark(8, 14, 2.4, K.goldL) + spark(40, 34, 1.8, c),
  // Rabbit's Foot Keychain: a split ring, a key and the foot.
  () =>
    circ(14, 10, 6, 'none', stroke(K.silver, 1.6)) +
    line('M18 14L22 18', K.silver, 1.2) +
    path('M20 18C26 16 32 20 34 26C36 33 32 41 25 42C19 43 16 37 17 31C18 26 17 21 20 18Z', '#f2ead8') +
    ell(26, 38, 2.4, 1.6, '#e2c9b0') +
    ell(21.5, 37, 1.8, 1.3, '#e2c9b0') +
    ell(30.5, 36, 1.8, 1.3, '#e2c9b0') +
    group(circ(8, 22, 3, 'none', stroke(K.gold, 1.6)) + rect(7.2, 25, 1.6, 12, K.gold) + rect(8.8, 32, 3, 1.4, K.gold) + rect(8.8, 35, 2.2, 1.4, K.gold), 'transform="rotate(12 8 22)"'),
  // Fortune Cat: waving for luck, clutching a coin.
  () =>
    shadow(13) +
    path('M14 8L16 14L20 10Z', '#fff') +
    path('M34 8L32 14L28 10Z', '#fff') +
    path('M15 10L16.5 13L18.5 11Z', '#ff9fb2') +
    ell(24, 33, 12, 11, '#fff') +
    circ(24, 17, 10, '#fff') +
    rr(33, 6, 5, 14, 2.5, '#fff') +
    path('M17 16Q19 14 21 16M27 16Q29 14 31 16', 'none', stroke(K.ink, 1.1)) +
    path('M22.5 20.5L24 22L25.5 20.5', 'none', stroke(K.ink, 0.9)) +
    rr(14, 25, 20, 3, 1.5, K.red) +
    circ(24, 29, 1.6, K.gold) +
    ell(24, 36, 5.5, 4, K.gold, stroke(K.goldD, 0.8)) +
    rect(23, 34, 2, 4, K.goldD),
  // Mystic Amulet: a gold setting around an all-knowing gem.
  (c) =>
    line('M13 2L24 10L35 2', K.goldD, 1) +
    circ(24, 26, 15, K.gold) +
    circ(24, 26, 12, K.goldD) +
    [0, 45, 90, 135, 180, 225, 270, 315].map((a) => group(circ(24, 12.5, 1.2, K.goldL), `transform="rotate(${a} 24 26)"`)).join('') +
    circ(24, 26, 8.5, c) +
    path('M17 26C20 21 28 21 31 26C28 31 20 31 17 26Z', '#fff', op(0.85)) +
    circ(24, 26, 2.8, K.ink),
  // Dice of Fate: two dice mid-roll.
  (c) =>
    shadow(16) +
    group(
      rr(5, 18, 18, 18, 3, K.white) + circ(10, 23, 1.6, K.ink) + circ(14, 27, 1.6, K.ink) + circ(18, 31, 1.6, K.ink),
      'transform="rotate(-14 14 27)"',
    ) +
    glow(33, 22, 12, c, 0.2) +
    group(
      rr(24, 12, 18, 18, 3, K.white, stroke(c, 1.4)) + [28, 38].flatMap((dx) => [16, 26].map((dy) => circ(dx, dy, 1.6, c))).join('') + circ(33, 21, 1.6, c),
      'transform="rotate(16 33 21)"',
    ),
  // Horseshoe of Kings: gold, nail holes and a crown.
  (c) =>
    shadow(12) +
    path('M12 43V26C12 16 17 11 24 11C31 11 36 16 36 26V43H30V26C30 20 28 17 24 17C20 17 18 20 18 26V43Z', K.gold, stroke(K.goldD, 0.8)) +
    [
      [15, 38],
      [15, 30],
      [17, 22],
      [33, 38],
      [33, 30],
      [31, 22],
    ]
      .map(([nx, ny]) => circ(nx, ny, 0.9, K.goldD))
      .join('') +
    path('M17 9L18.5 2L22 6L24 0L26 6L29.5 2L31 9Z', K.goldL, stroke(K.goldD, 0.8)) +
    circ(24, 5.5, 1, c),
  // Cursed Idol: carved stone with eyes that follow you.
  () =>
    circ(24, 24, 20, '#ff5f7e', op(0.08)) +
    circ(24, 24, 15, '#ff5f7e', op(0.08)) +
    shadow(12) +
    rr(13, 5, 22, 38, 5, '#5b5048') +
    rect(13, 16, 22, 2, '#453c35') +
    rect(13, 30, 22, 2, '#453c35') +
    rr(16, 9, 6, 5, 1.5, '#2c2621') +
    rr(26, 9, 6, 5, 1.5, '#2c2621') +
    circ(19, 11.5, 1.4, '#ff5f7e') +
    circ(29, 11.5, 1.4, '#ff5f7e') +
    rr(18, 21, 12, 6, 2, '#2c2621') +
    line('M19 24H29M21 22V26M24 22V26M27 22V26', '#5b5048', 0.9),
  // Star Fragment: a shard of a fallen star.
  (c) =>
    glow(24, 23, 16, c, 0.22) +
    path('M24 3L28 17L42 16L31 25L37 40L24 31L11 41L16 26L5 17L20 17Z', c) +
    path('M24 3L28 17L24 31L20 17Z', '#fff', op(0.45)) +
    spark(40, 6, 2.4, '#fff') +
    spark(8, 36, 1.8, '#fff'),
  // Probability Totem: a cube, a sphere and a pyramid, stacked just so.
  (c) =>
    shadow(11) +
    rr(15, 31, 18, 12, 1.5, K.black2, stroke(c, 1)) +
    circ(20, 37, 1.3, c) +
    circ(28, 37, 1.3, c) +
    circ(24, 23, 7.5, K.black3, stroke(c, 1)) +
    line('M21 26L27 20', K.white, 1.1) +
    circ(21.5, 21, 1.2, K.white) +
    circ(26.5, 25, 1.2, K.white) +
    path('M24 2L31 15H17Z', K.gold) +
    path('M24 2L31 15H24Z', K.goldD),
  // The Eye of Clutch: it sees the play before it happens.
  (c) =>
    line('M24 22L4 4M24 22L44 4M24 22L1 24M24 22L47 24M24 22L6 44M24 22L42 44', c, 1.2, op(0.45)) +
    path('M24 3L44 38H4Z', '#1a1a1f', stroke(K.gold, 2)) +
    path('M11 27C16 19 32 19 37 27C32 35 16 35 11 27Z', K.white) +
    circ(24, 27, 5.5, c) +
    circ(24, 27, 2.4, K.ink) +
    circ(22.5, 25.5, 1, '#fff'),
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
const ART: Record<GearSlot, Art[]> = {
  pc: PC,
  monitor: MONITOR,
  mouse: MOUSE_ART,
  keyboard: KEYBOARD,
  headset: HEADSET,
  chair: CHAIR,
  desk: DESK,
  shoes: SHOES,
  jersey: JERSEY,
  charm: CHARM,
};

export const GEAR_ART_SLOTS = Object.keys(ART) as GearSlot[];

export function gearArtTiers(slot: GearSlot): number {
  return ART[slot].length;
}

/** The drawing for one item, without the wrapping svg element. */
export function gearArtMarkup(slot: GearSlot, tier: number): string {
  const t = Math.max(0, Math.min(GEAR_MAX_TIER, Math.round(tier)));
  return ART[slot][t](gearRarity(t).color);
}

/** A complete inline svg for one item. */
export function gearArtSvg(slot: GearSlot, tier: number): string {
  return `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${gearArtMarkup(slot, tier)}</svg>`;
}
