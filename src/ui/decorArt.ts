import { K, circ, ell, glow, grid, line, op, path, rect, rr, shadow, spark, stars, stroke } from './artKit';

/** Draws one item. `scene` is true inside the house, where a few items are mounted differently. */
type DecorDraw = (c: string, scene: boolean) => string;

/**
 * Bespoke art for every Gaming House decor item, on the same 48x48 grid as the gear art. The glow
 * colour `c` is the item's rarity on a shop card and the org's team colour inside the house scene,
 * so the same drawing reads as a collectible in the shop and as part of the org's own room.
 */

/** A small trophy: bowl, handles, stem and base, scaled around its centre line. */
function cup(cx: number, top: number, s: number, fill: string, shade: string): string {
  const l = cx - 5 * s;
  const r = cx + 5 * s;
  const bowl = top + 3 * s;
  return (
    line(`M${l} ${top + 1.2 * s}C${l - 3 * s} ${top + 1.2 * s} ${l - 3 * s} ${top + 5.2 * s} ${l + 0.6 * s} ${top + 5.6 * s}`, shade, 1.1 * s) +
    line(`M${r} ${top + 1.2 * s}C${r + 3 * s} ${top + 1.2 * s} ${r + 3 * s} ${top + 5.2 * s} ${r - 0.6 * s} ${top + 5.6 * s}`, shade, 1.1 * s) +
    path(`M${l} ${top}H${r}V${bowl}A${5 * s} ${5.5 * s} 0 0 1 ${l} ${bowl}Z`, fill) +
    path(`M${cx} ${top}H${r}V${bowl}A${5 * s} ${5.5 * s} 0 0 1 ${cx} ${bowl + 5.5 * s}Z`, shade, op(0.35)) +
    rect(cx - 0.9 * s, bowl + 5 * s, 1.8 * s, 3 * s, shade) +
    rr(cx - 4 * s, bowl + 7.8 * s, 8 * s, 2.2 * s, 0.5, fill)
  );
}

const LED = ['#ff5f7e', '#f5c451', '#4ade80', '#4f9dff', '#a97bff'];

interface DecorArtDef {
  draw: DecorDraw;
  /** Floor items get a ground shadow on cards; wall items hang without one. */
  floor: boolean;
}

const ART: Record<string, DecorArtDef> = {
  // Two signed posters, taped up at an angle.
  posters: {
    floor: false,
    draw: (c) =>
      `<g transform="rotate(-8 16 21)">` +
      rr(6, 7, 20, 28, 1, K.black2, stroke(K.black3, 0.8)) +
      rect(8, 9, 16, 17, c, op(0.35)) +
      circ(16, 15.5, 4, K.white, op(0.85)) +
      path('M9 26C10 20 22 20 23 26Z', K.white, op(0.85)) +
      rect(9, 28.5, 14, 1.6, K.white, op(0.6)) +
      rect(9, 31.5, 9, 1.2, K.greyD) +
      `</g><g transform="rotate(6 31 25)">` +
      rr(21, 11, 21, 29, 1, '#17171b', stroke(c, 1.2)) +
      glow(31.5, 22, 7, c, 0.25) +
      spark(31.5, 22, 6.5, c) +
      circ(31.5, 22, 1.8, K.white) +
      rect(24, 32, 15, 1.6, K.white, op(0.7)) +
      rect(24, 35, 10, 1.2, K.greyD) +
      line('M32 36.5c1-1.4 2.2-1.4 3 0s2 1.4 3 0', K.white, 0.6, op(0.7)) +
      `</g>` +
      rect(12, 5.5, 7, 3, K.beige, 'opacity="0.85" transform="rotate(-20 15 7)"') +
      rect(29, 8.5, 7, 3, K.beige, 'opacity="0.85" transform="rotate(15 32 10)"'),
  },

  // A reel of LED strip, half unwound, every diode a different colour.
  rgb: {
    floor: true,
    draw: (c) => {
      const pts: [number, number][] = [
        [28.5, 33.6],
        [32, 33.4],
        [35, 29.8],
        [38.2, 27.6],
        [41.2, 26.6],
        [43.4, 22.4],
      ];
      return (
        circ(17, 27, 12.5, K.black2) +
        circ(17, 27, 11.5, 'none', stroke(LED[0], 1.4)) +
        circ(17, 27, 9.6, 'none', stroke(LED[1], 1.4)) +
        circ(17, 27, 7.7, 'none', stroke(LED[2], 1.4)) +
        circ(17, 27, 5.8, 'none', stroke(LED[3], 1.4)) +
        circ(17, 27, 4, K.black3) +
        circ(17, 27, 1.6, K.ink) +
        glow(17, 27, 13, c, 0.12) +
        line('M26 34C31 37 33 24 39 28S44 21 45.5 18', K.black3, 3.4) +
        pts.map(([px, py], i) => glow(px, py, 2.4, LED[i % LED.length], 0.35) + circ(px, py, 1, LED[i % LED.length])).join('')
      );
    },
  },

  // A leafy plant in a terracotta pot, with a little care tag.
  plants: {
    floor: true,
    draw: (c) =>
      line('M24 32V12M24 30L16 21M24 30L31.5 19M24 32L13.5 29M24 32L35 28', '#2f7a47', 1.2) +
      ell(15.5, 20, 7.5, 3.6, '#3f9d5c', 'transform="rotate(-35 15.5 20)"') +
      ell(31.5, 18, 7.8, 3.8, '#4caf6a', 'transform="rotate(30 31.5 18)"') +
      ell(24, 10.5, 4, 7.6, '#5cc77a') +
      ell(12.5, 28.5, 6.2, 3, '#3f9d5c', 'transform="rotate(-12 12.5 28.5)"') +
      ell(35.5, 27.5, 6.2, 3, '#3f9d5c', 'transform="rotate(12 35.5 27.5)"') +
      line('M24 4.5V16M12 16.5L19 23.5M36.5 14L27.5 22', '#2a6b3f', 0.6, op(0.7)) +
      path('M15 32H33L30.5 44H17.5Z', K.copper) +
      rect(14, 30.5, 20, 3.5, '#d98c55') +
      rect(17.5, 37, 13, 1, '#a8603a', op(0.6)) +
      line('M31 40V33', K.beigeD, 0.8) +
      rr(28.8, 30.5, 4.6, 3.3, 0.5, c),
  },

  // A glass-door mini fridge lit from inside: energy drinks and one sad yoghurt.
  fridge: {
    floor: true,
    draw: (c) =>
      rr(12, 8, 24, 35, 2.5, K.silver, stroke(K.silverD, 0.8)) +
      rr(14.5, 10.5, 19, 27, 1.5, '#15161a') +
      rect(14.5, 10.5, 19, 27, c, op(0.2)) +
      [16, 20, 24, 28].map((cx, i) => rr(cx, 12.5, 3.2, 6.8, 0.8, i % 2 === 0 ? '#4ade80' : c) + rect(cx, 13.6, 3.2, 1.2, K.white, op(0.6))).join('') +
      rect(15, 19.8, 18, 0.8, K.greyL, op(0.6)) +
      [16, 20.5, 25].map((cx) => rr(cx, 21.5, 3.6, 7.5, 1, '#e0474c') + rect(cx + 1, 20.5, 1.6, 1.2, K.greyL)).join('') +
      rect(15, 29.4, 18, 0.8, K.greyL, op(0.6)) +
      path('M21 31.5H26L25.3 35.6H21.7Z', K.white) +
      rect(20.8, 31, 5.4, 0.9, '#c7e0ff') +
      line('M17 12L21 36', '#fff', 0.8, op(0.22)) +
      rr(31.6, 15, 1.4, 14, 0.7, K.greyD) +
      rect(14, 43, 3, 1.5, K.greyD) +
      rect(31, 43, 3, 1.5, K.greyD),
  },

  // A pile of two beanbags; the front one in the glow colour.
  beanbags: {
    floor: true,
    draw: (c) =>
      path('M6 42C2 30 10 17 20 19C28 20 31 30 30 42Z', K.black3) +
      line('M10 36C9 29 13 23 18 22.5', '#fff', 1, op(0.15)) +
      path('M17 43C14 33 21 25 32 26C41 27 45.5 35 43.5 43Z', c) +
      path('M17 43C16.5 40 18 38.5 21 38.5L40 39C43 40 44 42 43.5 43Z', '#000', op(0.22)) +
      line('M21 37C22.5 31 27 28.5 33 29', '#fff', 1.2, op(0.35)) +
      line('M27 34Q31 36.5 36 33', '#000', 1, op(0.25)),
  },

  // A whiteboard on an easel, covered in arrows nobody understands. Wall-mounted in the house.
  whiteboard: {
    floor: true,
    draw: (c, scene) =>
      (scene ? '' : line('M14 34L9.5 44M34 34L38.5 44M24 34V44', K.greyD, 1.6)) +
      rr(6, 6, 36, 29, 1.5, K.silverD) +
      rr(7.5, 7.5, 33, 26, 1, '#eef0f5') +
      rect(10, 34.5, 28, 1.6, K.greyD) +
      rr(13, 33, 5, 1.6, 0.6, K.red) +
      rr(19.5, 33, 5, 1.6, 0.6, '#4f9dff') +
      line('M11 11L14 14M14 11L11 14M11 22L14 25M14 22L11 25', K.red, 1.2) +
      circ(34.5, 12.5, 2, 'none', stroke('#4f9dff', 1.2)) +
      circ(35, 26, 2, 'none', stroke('#4f9dff', 1.2)) +
      line('M15.5 13C22 9 26 17 31 13.6', c, 1.3) +
      path('M32.3 13L29.4 12.2L30.4 15.2Z', c) +
      line('M15.5 23.5Q24 29.5 31.8 25.6', K.red, 1.1, 'stroke-dasharray="1.6 1.4"') +
      path('M33 25L30.2 24.7L31.5 27.4Z', K.red) +
      line('M21 18.5c1.5-2.6 5.5-1.6 4 .6-1.2 1.6-1 2.6-1 2.6', K.greyD, 0.9) +
      circ(24, 23.6, 0.5, K.greyD),
  },

  // Lag, the house cat, asleep on a keyboard at a critical moment.
  cat: {
    floor: true,
    draw: (c) =>
      rr(4, 35, 40, 8, 1.5, K.black2, stroke(K.black3, 0.7)) +
      grid(6, 36.6, 13, 2, 2.2, 1.9, 0.75, K.black3) +
      rect(6, 41, 36, 0.8, c, op(0.7)) +
      line('M11 37C4 36 3.5 29 9 28.5', '#1b1b22', 3.2) +
      path('M9 37.5C8 27 16 23 25 24C33 25 37.5 30 36.5 37.5Z', '#1b1b22') +
      line('M13 30C16 26.5 21 25.5 25 26', '#fff', 0.8, op(0.12)) +
      circ(33, 26, 6.4, '#1b1b22') +
      path('M28.2 22.4L29.2 15.4L33 20.4ZM33.8 20.4L37.8 15.6L38.6 23Z', '#1b1b22') +
      path('M29.7 21.3L30.2 17.6L32 20.4Z', '#4a3a48') +
      ell(30.8, 26, 1.4, 0.75, '#c5e84a') +
      ell(35.4, 26, 1.4, 0.75, '#c5e84a') +
      rect(30.6, 25.3, 0.45, 1.4, K.ink) +
      rect(35.2, 25.3, 0.45, 1.4, K.ink) +
      path('M33.1 28.4L32.3 27.7H33.9Z', '#e38aa0') +
      line('M37.5 28L43 26.8M37.5 29.2L43 29.8M28.6 28L23.5 26.8', K.greyL, 0.5, op(0.6)),
  },

  // A chrome espresso machine mid-pour.
  espresso: {
    floor: true,
    draw: (c) =>
      rr(13, 5.5, 4.5, 3.5, 0.6, K.white) +
      rr(19, 5.5, 4.5, 3.5, 0.6, K.white) +
      rr(9, 9, 30, 29, 2.5, K.silver, stroke(K.silverD, 0.8)) +
      rect(9, 9, 30, 5, K.silverD) +
      circ(32, 20, 3.4, K.ink) +
      circ(32, 20, 2.6, K.white) +
      line('M32 20L33.6 18.4', K.red, 0.7) +
      circ(13.5, 18, 1.2, c) +
      glow(13.5, 18, 2.6, c, 0.35) +
      rr(15, 16.5, 11, 4, 1, K.black3) +
      rr(5, 21, 16, 2.6, 1.3, K.black) +
      rr(17, 20.5, 6, 3, 0.8, K.black3) +
      rect(19.6, 23.5, 0.9, 5, '#5a3a22') +
      path('M16 28.5H24L23 33.5H17Z', K.white) +
      line('M24 29.8c2.2 0 2.2 2.6 0 2.6', K.white, 1) +
      line('M35 23V31', K.greyD, 1.2) +
      line('M36 30c1.5-1.2-.5-2.5 1-3.8', K.white, 0.8, op(0.55)) +
      rr(11, 33.5, 26, 4.5, 1, K.black3) +
      grid(12.6, 34.8, 9, 1, 1.9, 1.6, 0.9, K.black2) +
      rect(11, 38, 3, 2, K.greyD) +
      rect(34, 38, 3, 2, K.greyD),
  },

  // An upright arcade cabinet: lit marquee, pixel invaders, joystick and three buttons.
  arcade: {
    floor: true,
    draw: (c) =>
      path('M13 3H35V12.5L37 19.5V44H11V19.5L13 12.5Z', K.black2) +
      path('M11 19.5L13 12.5V44H11Z', c, op(0.55)) +
      path('M37 19.5L35 12.5V44H37Z', c, op(0.55)) +
      glow(24, 7.5, 11, c, 0.2) +
      rr(14, 4.5, 20, 6, 1, c, op(0.9)) +
      rect(17, 6.8, 14, 1.4, K.white, op(0.85)) +
      rr(14.5, 12, 19, 14.5, 1, K.ink) +
      rr(16, 13.5, 16, 11.5, 1, '#0d1a2a') +
      grid(18, 15, 5, 2, 1.4, 1.4, 1.4, '#4ade80') +
      path('M22.5 22H25.5V23.4H27V24.6H21V23.4H22.5Z', K.white) +
      path('M12 27.5H36L37.5 33H10.5Z', K.black3) +
      rect(16.8, 25.5, 1, 4, K.greyL) +
      circ(17.3, 25.2, 1.8, K.red) +
      circ(26, 30.3, 1.3, K.gold) +
      circ(29.5, 30.3, 1.3, '#4f9dff') +
      circ(33, 30.3, 1.3, K.red) +
      rr(19, 35.5, 10, 6, 1, K.black3) +
      rect(21, 37, 1.5, 3, c) +
      rect(25.5, 37, 1.5, 3, c),
  },

  // A neon "GG" sign hanging on chains.
  neon: {
    floor: false,
    draw: (c) => {
      const gg = 'M20.5 15H13.5V26H20.5V21H17.5M35 15H28V26H35V21H32';
      return (
        line('M11 3V10M37 3V10', K.greyD, 0.9) +
        rr(5, 9, 38, 22, 3, '#101014', stroke(K.black3, 1)) +
        rr(8, 12, 32, 16, 3, c, op(0.12)) +
        line(gg, c, 3.4, op(0.35)) +
        line(gg, c, 1.8) +
        line(gg, '#fff', 0.6, op(0.8)) +
        circ(24, 20.5, 1, c) +
        line('M40 31C42 36 38 38 42 44', K.black3, 1)
      );
    },
  },

  // Gold, silver and bronze on a wooden shelf under a spotlight.
  shelf: {
    floor: false,
    draw: (c) =>
      path('M24 1L7 30H41Z', c, op(0.12)) +
      cup(13, 13.7, 1.2, K.silver, K.silverD) +
      cup(35, 13.7, 1.2, K.copper, '#9a6436') +
      cup(24, 8.2, 1.6, K.gold, K.goldD) +
      line('M22 13.5c0 3 .6 5 2 6.2', '#fff', 0.8, op(0.5)) +
      rr(4, 30, 40, 3.5, 0.8, K.wood) +
      rect(4, 33.5, 40, 1, K.woodD) +
      path('M8.5 34.5H12.5L8.5 39.5Z', K.greyD) +
      path('M35.5 34.5H39.5V39.5Z', K.greyD),
  },

  // A lit fish tank on a stand: Ping, Pong, weeds and bubbles.
  aquarium: {
    floor: true,
    draw: (c) =>
      rr(8, 36, 32, 8, 1, K.black2) +
      rect(10, 38, 12, 4, K.black3) +
      rect(26, 38, 12, 4, K.black3) +
      rr(5.5, 11.5, 37, 24.5, 1, '#1d6fa8', op(0.6)) +
      rect(5.5, 11.5, 37, 4, '#9ad4ff', op(0.22)) +
      rect(5.5, 11.5, 37, 24.5, c, op(0.1)) +
      path('M5.5 32Q15 29 24 31.5T42.5 30.5V36H5.5Z', '#d9c38f') +
      line('M11 32C9 27 13 24 11 18M14.5 32C16.5 27 12.5 25 15.5 21M37 31C35 26 39 23 37 17', '#3f9d5c', 1.5) +
      ell(24, 20, 4, 2.4, '#ff9a3c') +
      path('M20.3 20L17 17.5V22.5Z', '#ff9a3c') +
      circ(26.4, 19.5, 0.6, K.ink) +
      ell(31, 27, 3, 1.8, K.gold) +
      path('M33.8 27L36.5 25V29Z', K.gold) +
      circ(29.3, 26.6, 0.5, K.ink) +
      circ(34, 17, 1, 'none', stroke('#fff', 0.6)) +
      circ(35.5, 14.2, 0.7, 'none', stroke('#fff', 0.5)) +
      line('M9 15L12.5 30', '#fff', 0.8, op(0.3)) +
      rr(5, 10.5, 38, 26, 1.5, 'none', stroke(K.black3, 1.4)) +
      rect(4.5, 9.5, 39, 2.4, K.black3) +
      rect(7, 10.2, 34, 1, c),
  },

  // A reclining massage chair with glowing rollers and a remote.
  massage: {
    floor: true,
    draw: (c) =>
      path('M10 44L14 36H38L40 44Z', K.black2) +
      path('M12 36C12 31 16 29 22 29H36C40 29 41 33 40 36Z', K.black3) +
      path('M8 34C5 26 7 13 13 8C16 6 19 8 19 11L21 29C18 31 12 33 8 34Z', K.black3) +
      line('M10.5 30C9.5 24 10.5 17 13.5 12', K.greyD, 0.6, op(0.6)) +
      ell(13.5, 9.5, 4.6, 3.2, K.black2, 'transform="rotate(-30 13.5 9.5)"') +
      [
        [12.3, 16],
        [13.2, 21],
        [14.6, 26],
      ]
        .map(([px, py]) => glow(px, py, 2.6, c, 0.3) + circ(px, py, 1.2, c))
        .join('') +
      path('M36 30C40 30 43 33 44 38L41 40C39 36 37 34 34 34Z', K.black3) +
      rr(18, 25, 16, 3, 1.5, K.black2) +
      rr(29, 22.5, 4, 2.4, 0.6, c),
  },

  // A white egg pod with a glowing interior and a pillow. Zzz.
  napPods: {
    floor: true,
    draw: (c) =>
      ell(24, 42, 12, 2.5, K.greyD) +
      ell(24, 25, 15, 17, '#ecebe6') +
      ell(28.5, 27, 10.5, 14, '#cfcdc6', op(0.55)) +
      ell(21, 25, 9.5, 11.5, '#15161a') +
      ell(21, 25, 9.5, 11.5, c, op(0.3)) +
      ell(21, 25, 9.5, 11.5, 'none', stroke(c, 0.9)) +
      ell(19, 19.5, 5, 2.4, K.white, op(0.9)) +
      line('M31 9H34L31 12H34', K.white, 0.9) +
      line('M36 4.5H38L36 6.5H38', K.white, 0.7, op(0.8)),
  },

  // A replay table projecting a holographic arena.
  holotable: {
    floor: true,
    draw: (c) =>
      path('M16 44L19 35H29L32 44Z', K.black2) +
      path('M13 33L18 7H30L35 33Z', c, op(0.13)) +
      ell(24, 34, 16, 4, K.black3) +
      ell(24, 33.2, 14, 3, '#15161a') +
      ell(24, 33.2, 12, 2.4, c, op(0.4)) +
      ell(24, 20, 9, 3, 'none', stroke(c, 0.9)) +
      ell(24, 14.5, 6, 2, 'none', stroke(c, 0.8)) +
      line('M15 20L18 14.5M33 20L30 14.5M24 23V17', c, 0.7) +
      circ(20.5, 19.4, 0.9, K.white) +
      circ(27.5, 20.6, 0.9, K.white) +
      rect(15, 11, 18, 0.5, c, op(0.4)) +
      rect(15, 25.5, 18, 0.5, c, op(0.4)) +
      spark(33.5, 9.5, 1.8, K.white),
  },

  // A lounge floating in orbit, with a planet and a drifting drink.
  zeroG: {
    floor: false,
    draw: (c) =>
      circ(24, 24, 20, '#0d0f1a') +
      circ(24, 24, 20, 'none', `${stroke(c, 1)} ${op(0.6)}`) +
      stars([
        [12, 12],
        [20, 8],
        [9, 22],
        [16, 34],
        [38, 30],
        [30, 38],
        [40, 20],
      ]) +
      circ(34, 14, 5, c, op(0.85)) +
      ell(34, 14, 8.5, 2, 'none', `${stroke(K.white, 0.7)} ${op(0.7)}`) +
      path('M9 28C11 35 22 37 31 32.5L33 29C25 32.5 16 31.5 12.5 26Z', K.white) +
      path('M14 29C18 31.5 24 31.5 30 29.5', 'none', `${stroke(c, 1.4)}`) +
      circ(15.5, 17, 2, '#4ade80', op(0.85)) +
      circ(18.3, 14.2, 1, '#4ade80', op(0.6)) +
      rr(24, 15, 3, 5, 1, K.greyL, 'transform="rotate(25 25.5 17.5)"'),
  },
};

export const DECOR_ART_IDS: string[] = Object.keys(ART);

export function hasDecorArt(id: string): boolean {
  return id in ART;
}

/** Inner SVG markup for one item. In a scene there is no card shadow; the scene draws its own. */
export function decorArtMarkup(id: string, c: string, scene = false): string {
  const def = ART[id];
  if (!def) return '';
  return (!scene && def.floor ? shadow(16) : '') + def.draw(c, scene);
}

/** A standalone 48x48 SVG for shop cards and tooltips. */
export function decorArtSvg(id: string, c: string): string {
  return `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${decorArtMarkup(id, c)}</svg>`;
}
