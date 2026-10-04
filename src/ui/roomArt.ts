/**
 * The room each team plays in on the Teams tab. The walls and floor follow the org's house (a
 * garage, a flat, a gaming house, a glass-walled HQ, a campus arena, an orbital station), and every
 * game dresses its room with props that parody it: a sniper rifle on the wall and a bomb under the
 * desk for Counter-Stroke, poros for League of Lanes, a loot llama for Fortnight. Each room also hangs
 * the game's sign: its logo and name lettered to suit it, from a stencilled plate to a tavern board.
 *
 * Built only from constants, numbers and validated hex colours, so the markup is safe for {@html}.
 */
import { K, circ, ell, f, group, line, op, path, rect, rr, spark, stroke, type Art } from './artKit';
import { mix } from './color';
import { gameLogoSvg } from './gameArt';

// ---------------------------------------------------------------------------------------------
// Walls: a 480x240 tile, repeated across the room
// ---------------------------------------------------------------------------------------------

const W = 480;
const H = 240;

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/** A seeded scatter, so a wall or floor draws the same every time without Math.random. */
const scatter = (i: number, salt: number) => ((Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453) % 1 + 1) % 1;

/** A flat-topped hexagon, for acoustic panels. */
const hex = (cx: number, cy: number, r: number) => {
  const pts = range(6).map((i) => {
    const a = (Math.PI / 3) * i;
    return `${f(cx + r * Math.cos(a))} ${f(cy + r * Math.sin(a))}`;
  });
  return `M${pts.join('L')}Z`;
};

/** A neon "G", drawn from its top-right corner. */
const neonG = (x: number, y: number) => `M${x + 20} ${y}H${x + 7}Q${x} ${y} ${x} ${y + 7}V${y + 25}Q${x} ${y + 32} ${x + 7} ${y + 32}H${x + 20}V${y + 17}H${x + 12}`;

function garage(p: string): string {
  let s = rect(0, 0, W, H, mix('#3a3a3e', p, 0.05));
  // Breeze blocks.
  for (let r = 0; r < 8; r++) {
    const off = r % 2 ? 30 : 0;
    for (let k = -1; k < 9; k++) s += rect(k * 60 + off + 1, r * 30 + 1, 58, 28, '#000', op(0.07));
  }
  // A strip of daylight under the eaves.
  s += rect(0, 0, W, 10, '#1d1f23') + rect(0, 10, W, 3, '#000', op(0.25));
  // A roller door, half up, with the driveway at night under it.
  s += rect(40, 20, 190, 200, '#2c2f35') + range(9).map((i) => rect(40, 20 + i * 14, 190, 11, '#4a4f58') + rect(40, 31 + i * 14, 190, 2, '#25282d')).join('');
  s += rect(40, 146, 190, 74, '#0d0f16') + rect(40, 146, 190, 4, '#000', op(0.5)) + range(5).map((i) => circ(60 + i * 38, 164 + (i % 2) * 6, 1, '#fff', op(0.6))).join('');
  s += rect(36, 16, 198, 6, '#1d1f23') + rect(36, 16, 6, 204, '#1d1f23') + rect(228, 16, 6, 204, '#1d1f23') + rr(126, 136, 18, 6, 2, '#8c9098');
  // Pegboard with tools, over a workbench.
  s += rect(290, 34, 140, 96, '#8a6c4a') + range(6).map((r) => range(13).map((k) => circ(298 + k * 10.5, 42 + r * 15, 1.1, '#5c4630')).join('')).join('');
  s += line('M312 54V98M306 54H318', '#bcc0c6', 3) + line('M340 52L362 94', '#bcc0c6', 3) + rr(372, 56, 30, 9, 2, K.red) + line('M378 65V90', K.greyD, 4) + circ(414, 74, 9, 'none', stroke('#bcc0c6', 3));
  s += rect(282, 140, 156, 8, '#6b5236') + rect(282, 147, 156, 3, '#000', op(0.3)) + rect(290, 150, 7, 60, '#4a3a28') + rect(423, 150, 7, 60, '#4a3a28');
  s += rr(298, 126, 22, 14, 2, '#5c6370') + rect(304, 120, 10, 6, '#8c9098') + rr(350, 124, 16, 16, 2, '#c94b3a') + rect(350, 128, 16, 3, '#f1f1f0', op(0.7)) + rr(384, 130, 34, 10, 2, '#2c5aa0') + rect(396, 127, 10, 3, '#8c9098');
  // A bare bulb.
  s += line('M260 10V44', '#18181b', 2) + circ(260, 52, 30, '#ffe9a3', op(0.1)) + circ(260, 52, 16, '#ffe9a3', op(0.16)) + circ(260, 52, 7, '#ffe9a3') + rect(256, 40, 8, 6, '#3a3a3e');
  return s;
}

function flat(p: string): string {
  const a = mix('#3b3540', p, 0.12);
  const b = mix('#332e38', p, 0.12);
  let s = rect(0, 0, W, H, a) + range(12).map((i) => rect(i * 40, 0, 20, H, b)).join('');
  // Window onto the street at night, with a radiator under it.
  s += rr(56, 30, 150, 120, 3, '#5b4a3f') + rect(64, 38, 134, 104, '#121633') + rect(64, 110, 134, 32, '#1b1d3d');
  s += [[70, 96, 22, 46], [96, 80, 18, 62], [118, 104, 30, 38], [152, 88, 22, 54], [178, 108, 20, 34]].map(([x, y, w, h]) => rect(x, y, w, h, '#0b0e22') + rect(x + 4, y + 8, 4, 5, '#ffd98a', op(0.7)) + rect(x + 10, y + 20, 4, 5, '#ffd98a', op(0.45))).join('');
  s += circ(176, 56, 9, '#f5efd6', op(0.8)) + circ(176, 56, 16, '#f5efd6', op(0.08)) + line('M131 38V142M64 90H198', '#5b4a3f', 5) + rect(50, 148, 162, 8, '#6d5a4c');
  s += rr(80, 160, 102, 34, 3, '#c9c4bd') + range(9).map((i) => rect(86 + i * 11, 162, 5, 30, '#000', op(0.12))).join('');
  // A framed print and a shelf of figurines.
  s += rect(272, 46, 64, 80, '#20202a') + rect(278, 52, 52, 68, mix('#3c4a6b', p, 0.35)) + path('M278 120L300 86L314 104L322 94L330 120Z', '#1a2234') + circ(318, 68, 6, '#f5efd6', op(0.7));
  s += rect(372, 100, 84, 6, '#6d5a4c') + rr(380, 82, 12, 18, 3, K.gold) + rr(400, 78, 12, 22, 3, '#7fc7ff') + rr(420, 84, 12, 16, 3, K.red) + rr(440, 80, 10, 20, 3, '#9dff3b');
  // A plant on the shelf's end and a pendant lamp.
  s += rr(446, 62, 12, 16, 2, '#b8693f') + path('M452 62Q440 44 446 38Q452 52 452 62Q456 44 466 42Q458 54 452 62Z', '#4caf6a');
  s += line('M240 0V30', '#18181b', 1.5) + path('M228 42L234 30H246L252 42Z', '#2a2a30') + ell(240, 43, 12, 2, '#ffe9a3', op(0.8)) + path('M228 43L206 120H274L252 43Z', '#ffe9a3', op(0.05));
  return s;
}

function gamingHouse(p: string): string {
  const glow = mix(p, '#ffffff', 0.2);
  let s = rect(0, 0, W, H, mix('#24222b', p, 0.08));
  // Wainscot panels under a dado rail.
  s += rect(0, 150, W, 90, mix('#1d1b23', p, 0.06)) + rect(0, 147, W, 4, '#3a3742') + range(8).map((i) => rr(i * 60 + 6, 160, 48, 70, 2, 'none', `${stroke('#000', 1.5)} ${op(0.3)}`)).join('');
  // A window on the suburbs at night, framed by curtains in the org's colour.
  s += rect(44, 28, 136, 110, '#161a3e') + rect(44, 92, 136, 46, '#1e2352');
  s += range(14).map((i) => circ(50 + scatter(i, 1) * 124, 32 + scatter(i, 2) * 50, i % 4 ? 0.8 : 1.3, '#fff', op(0.7))).join('') + circ(150, 52, 9, '#f5f0d8') + circ(150, 52, 18, '#f5f0d8', op(0.1));
  s += path('M44 118Q80 98 112 112Q146 96 180 112V138H44Z', '#0e1130');
  s += [[60, 112], [96, 114], [130, 108], [160, 112]].map(([x, y]) => path(`M${x} ${y}L${x + 9} ${y - 8}L${x + 18} ${y}V${y + 12}H${x}Z`, '#090b20') + rect(x + 6, y + 3, 5, 4, '#ffd98a', op(0.8))).join('');
  s += rect(44, 28, 136, 110, 'none', stroke('#3b3742', 7)) + line('M112 30V136M46 82H178', '#3b3742', 4) + rect(36, 138, 152, 6, '#46424e');
  const curtain = mix(p, '#1a1a22', 0.45);
  s += line('M28 22H196', '#8a8590', 3) + path('M30 22H62Q56 80 66 146H30Z', curtain) + path('M194 22H162Q168 80 158 146H194Z', curtain);
  s += line('M38 22Q36 80 40 146M50 22Q46 80 52 146M186 22Q188 80 184 146M174 22Q178 80 172 146', '#000', 1.2, op(0.25));
  // Hexagon acoustic panels, a few in the team colour.
  range(4).forEach((r) =>
    range(4).forEach((k) => {
      if ((r === 0 && k === 3) || (r === 3 && k === 0)) return;
      const cx = 252 + k * 26 + (r % 2) * 13;
      const cy = 36 + r * 23;
      const lit = (k + r * 2) % 3 === 0;
      s += path(hex(cx, cy, 13), lit ? mix(p, '#2b2932', 0.35) : '#2f2d37') + path(hex(cx, cy, 8), '#000', op(0.18)) + path(`M${cx - 13} ${cy}L${cx - 6.5} ${cy - 11.3}H${cx + 6.5}L${cx + 13} ${cy}Z`, '#fff', op(0.05));
    }),
  );
  // The neon "GG" every gaming house hangs up eventually.
  s += rr(372, 26, 92, 52, 6, '#121118') + rr(372, 26, 92, 52, 6, 'none', `${stroke('#2c2a33', 2)}`);
  s += line(neonG(386, 36) + neonG(418, 36), glow, 7, op(0.18)) + line(neonG(386, 36) + neonG(418, 36), glow, 2.6);
  // A shelf of consoles and a figure.
  s += rect(374, 116, 92, 5, '#4a4552') + rr(380, 100, 30, 16, 2, '#e8e8ec') + rect(384, 106, 22, 2, '#9ea2a8') + circ(404, 111, 1.5, '#4fd1ff');
  s += path('M418 116Q416 106 424 106H436Q444 106 442 116Z', '#2c2d33') + circ(426, 110, 1.4, '#e0474c') + circ(434, 110, 1.4, '#4caf6a');
  s += rr(448, 96, 10, 20, 3, K.gold) + circ(453, 92, 5, K.gold);
  // An LED strip along the ceiling.
  s += rect(0, 8, W, 3, p, op(0.55)) + rect(0, 11, W, 10, p, op(0.06));
  return s;
}

function teamHq(p: string): string {
  let s = `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#090d24"/><stop offset="0.55" stop-color="#1d1846"/><stop offset="1" stop-color="${mix('#5a2f58', p, 0.25)}"/></linearGradient></defs>`;
  s += rect(0, 0, W, H, 'url(#sky)');
  s += range(18).map((i) => circ(scatter(i, 3) * W, 18 + scatter(i, 4) * 50, 0.8, '#fff', op(0.5))).join('');
  // Far towers, paler with distance.
  s += range(10).map((i) => rect(i * 50 - 8, 84 + scatter(i, 5) * 50, 42, 200, '#2a2858', op(0.9))).join('');
  range(7).forEach((i) => {
    const x = i * 72 + ((i * 13) % 14) - 6;
    const top = 58 + ((i * 53) % 70);
    const w = 50 + ((i * 29) % 20);
    s += rect(x, top, w, H - top, '#0c1028');
    if (i % 3 === 1) s += rect(x + w / 2 - 1, top - 16, 2, 16, '#0c1028') + circ(x + w / 2, top - 17, 1.6, K.red);
    for (let r = 0; r < 9; r++)
      for (let k = 0; k < 4; k++) {
        const lit = (i * 7 + r * 5 + k * 3) % 9;
        if (lit < 3) s += rect(x + 6 + k * 11, top + 8 + r * 14, 5, 7, lit === 0 ? p : '#ffd98a', op(lit === 0 ? 0.6 : 0.6));
      }
  });
  // The glass: reflections, the org's band etched across it, and the frame.
  s += path('M30 0L90 0L20 240L-40 240Z M300 0L330 0L260 240L230 240Z', '#fff', op(0.04));
  s += rect(0, 102, W, 12, '#fff', op(0.05)) + rect(0, 107, W, 2, p, op(0.3));
  s += range(5).map((i) => rect(i * 120 - 3, 0, 6, H, '#1a1f33') + rect(i * 120 - 3, 0, 1.5, H, '#fff', op(0.12))).join('');
  s += rect(0, 146, W, 6, '#1a1f33') + rect(0, 146, W, 1.5, '#fff', op(0.12));
  // The ceiling and its downlights.
  s += rect(0, 0, W, 14, '#141829') + range(4).map((i) => circ(60 + i * 120, 14, 3, '#fff6dc') + path(`M${57 + i * 120} 14L${30 + i * 120} 120H${90 + i * 120}L${63 + i * 120} 14Z`, '#fff6dc', op(0.035))).join('');
  return s;
}

function campus(p: string): string {
  const team = mix(p, '#101018', 0.2);
  let s = rect(0, 0, W, H, '#0a0c13');
  // The lighting truss and its spots, beams cutting down through the haze.
  s += range(6).map((i) => {
    const x = 40 + i * 80;
    return path(`M${x - 4} 24L${x - 36} 180H${x + 36}L${x + 4} 24Z`, '#fffbe0', op(0.045));
  }).join('');
  // The stands: rows of fans rising into the dark, phones and glowsticks up.
  range(5).forEach((r) => {
    const y = 64 + r * 22;
    const dim = 0.45 + r * 0.13;
    s += rect(0, y + 8, W, 14, '#11131b', op(dim));
    range(41).forEach((i) => {
      const cx = i * 12 + (r % 2) * 6 + (scatter(i, r) - 0.5) * 3;
      const pick = Math.floor(scatter(i + r * 41, 9) * 6);
      const col = ['#1f2233', '#262a3d', '#1a1c29', '#2d2a3a', mix(p, '#1a1c28', 0.55), mix(p, '#1a1c28', 0.7)][pick];
      s += group(ell(cx, y + 12, 5.5, 4, col) + circ(cx, y + 4, 3.8, col), op(dim));
      const up = scatter(i * 3 + r, 11);
      if (up < 0.06) s += circ(cx + 3, y - 3, 1.3, '#fffbe0') + circ(cx + 3, y - 3, 4, '#fffbe0', op(0.2));
      else if (up < 0.1) s += circ(cx - 2, y - 4, 1.6, p) + circ(cx - 2, y - 4, 4.5, p, op(0.25));
    });
  });
  s += rect(0, 0, W, 16, '#1c1f27') + line(range(40).map((i) => `${i ? 'L' : 'M'}${i * 12} ${i % 2 ? 14 : 3}`).join(''), '#34384a', 1);
  s += range(6).map((i) => rr(34 + i * 80, 14, 12, 11, 2, '#2c2f38') + circ(40 + i * 80, 25, 3.5, '#fffbe0') + circ(40 + i * 80, 25, 9, '#fffbe0', op(0.15))).join('');
  // Banners hanging from the truss, each with a trophy.
  [52, 384].forEach((x) => {
    s += path(`M${x} 16H${x + 44}V98L${x + 22} 86L${x} 98Z`, team) + rect(x, 24, 44, 4, '#fff', op(0.3)) + rect(x, 76, 44, 2, '#fff', op(0.2));
    s += path(`M${x + 13} 38H${x + 31}V47Q${x + 31} 58 ${x + 22} 58Q${x + 13} 58 ${x + 13} 47Z`, K.gold) + line(`M${x + 13} 41Q${x + 7} 42 ${x + 9} 48Q${x + 11} 51 ${x + 14} 51M${x + 31} 41Q${x + 37} 42 ${x + 35} 48Q${x + 33} 51 ${x + 30} 51`, K.gold, 2);
    s += rect(x + 20, 58, 4, 7, K.goldD) + rr(x + 15, 65, 14, 4, 1, K.gold);
  });
  // The big screen, live: two crests, the score and a LIVE light.
  s += line('M188 16V30M292 16V30', '#3a3e4a', 2) + rr(156, 28, 168, 88, 6, '#04050a') + rect(162, 34, 156, 76, '#0d1124');
  s += path('M162 34H246L234 110H162Z', mix(p, '#0d1124', 0.45)) + path('M246 34H318V110H234Z', '#14203c');
  s += circ(198, 66, 15, p) + circ(198, 66, 15, 'none', stroke('#fff', 2)) + path('M192 60H204V68Q198 76 192 68Z', '#fff', op(0.8));
  s += circ(282, 66, 15, '#4fd1ff') + circ(282, 66, 15, 'none', stroke('#fff', 2)) + path('M276 60L288 72M288 60L276 72', 'none', stroke('#fff', 2.4));
  s += rr(226, 54, 28, 22, 3, '#04050a') + line('M231 59H237V65H231V71H237M243 59H249V71H243V59', '#fff', 1.8);
  s += rr(168, 40, 28, 10, 2, K.red) + circ(173, 45, 2, '#fff') + rect(178, 43.5, 14, 3, '#fff', op(0.85));
  s += rect(162, 96, 156, 14, '#04050a') + rect(166, 101, 60, 4, p, op(0.8)) + rect(254, 101, 60, 4, '#4fd1ff', op(0.8)) + rect(156, 28, 168, 88, 'none', `${stroke(p, 1.5)} ${op(0.4)} rx="6"`);
  // The advertising boards along the barrier.
  s += rect(0, 166, W, 20, '#06070b') + range(6).map((i) => rect(i * 80 + 4, 170, 72, 12, i % 2 ? p : '#4fd1ff', op(0.5)) + rect(i * 80 + 14, 174, 30, 4, '#fff', op(0.6))).join('');
  return s;
}

function orbital(p: string): string {
  let s = rect(0, 0, W, H, '#14161a');
  s += range(4).map((i) => rect(i * 120 + 2, 4, 116, 232, '#191b20') + circ(i * 120 + 10, 12, 2, '#2c2f36') + circ(i * 120 + 110, 12, 2, '#2c2f36')).join('');
  // Portholes onto space: the planet below, and a ringed giant.
  [[120, 96], [360, 96]].forEach(([cx, cy], i) => {
    s += circ(cx, cy, 70, '#2a2d33') + circ(cx, cy, 70, 'none', `${stroke('#fff', 1)} ${op(0.08)}`);
    let view = circ(cx, cy, 60, '#04050a');
    view += range(16).map((k) => circ(cx - 50 + ((k * 37) % 100), cy - 50 + ((k * 53) % 100), k % 4 ? 0.9 : 1.6, '#fff', op(0.8))).join('');
    if (i === 0)
      view +=
        circ(cx - 10, cy + 84, 64, mix('#2a4a8a', p, 0.3)) +
        path(`M${cx - 60} ${cy + 40}Q${cx - 30} ${cy + 30} ${cx - 14} ${cy + 38}Q${cx + 4} ${cy + 46} ${cx + 30} ${cy + 34}`, 'none', `${stroke('#4caf6a', 6)} ${op(0.5)}`) +
        circ(cx - 10, cy + 84, 64, 'none', `${stroke('#9fd0ff', 3)} ${op(0.4)}`) +
        circ(cx - 10, cy + 84, 72, '#9fd0ff', op(0.08));
    else view += circ(cx + 14, cy - 8, 18, '#d9a441') + path(`M${cx - 4} ${cy - 12}H${cx + 32}M${cx - 2} ${cy - 4}H${cx + 30}`, 'none', `${stroke('#b07a2a', 2)} ${op(0.6)}`) + ell(cx + 14, cy - 8, 32, 6, 'none', stroke('#e8d2a0', 2));
    s += `<clipPath id="porthole${i}"><circle cx="${cx}" cy="${cy}" r="60"/></clipPath>` + group(view, `clip-path="url(#porthole${i})"`);
    s += circ(cx, cy, 60, 'none', stroke('#3a3e46', 6)) + path(`M${cx - 40} ${cy - 40}A57 57 0 0 1 ${cx + 20} ${cy - 54}`, 'none', `${stroke('#fff', 3)} ${op(0.12)}`);
    s += range(8).map((k) => circ(cx + 66 * Math.cos((k * Math.PI) / 4), cy + 66 * Math.sin((k * Math.PI) / 4), 2, '#3f434b')).join('');
  });
  // Control panels between the portholes, blinking away.
  [[-22, 50], [218, 50], [458, 50]].forEach(([x, y]) => {
    s += rr(x, y, 44, 80, 4, '#1e2128') + rr(x + 6, y + 8, 32, 18, 2, '#08141a') + line(`M${x + 9} ${y + 20}L${x + 15} ${y + 14}L${x + 21} ${y + 19}L${x + 27} ${y + 12}L${x + 35} ${y + 16}`, '#4caf6a', 1.2);
    s += range(6).map((k) => circ(x + 10 + (k % 3) * 12, y + 38 + Math.floor(k / 3) * 12, 3, [p, '#4caf6a', K.red, '#4fd1ff', K.gold, p][k], op(0.85))).join('');
    s += rr(x + 8, y + 62, 28, 8, 2, '#2c3038');
  });
  s += rect(0, 0, W, 6, '#1d2026') + rect(0, 168, W, 3, p, op(0.45)) + rect(0, 171, W, 10, p, op(0.05));
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

// ---------------------------------------------------------------------------------------------
// Floors: a 256x64 tile per house, repeated under the desks
// ---------------------------------------------------------------------------------------------

const FW = 256;
const FH = 64;

function concrete(): string {
  let s = rect(0, 0, FW, FH, '#3a3a3e') + rect(0, 0, 2, FH, '#000', op(0.3)) + rect(128, 0, 2, FH, '#000', op(0.2)) + rect(0, 0, FW, 1.5, '#000', op(0.2));
  s += range(40).map((i) => circ(scatter(i, 21) * FW, scatter(i, 22) * FH, 0.6 + scatter(i, 23) * 0.9, i % 3 ? '#000' : '#fff', op(i % 3 ? 0.18 : 0.06))).join('');
  s += ell(186, 40, 16, 5, '#000', op(0.18)) + ell(192, 41, 7, 2.5, '#000', op(0.15)) + line('M40 12L56 22L60 34', '#000', 0.8, op(0.25));
  return s;
}

function boards(): string {
  const shades = ['#4d3729', '#45311f', '#523b2b', '#3f2d20', '#4a3426'];
  let s = rect(0, 0, FW, FH, '#30231a');
  range(4).forEach((r) => {
    const off = [0, 96, 48, 160][r];
    for (let k = -1; k < 3; k++) {
      const x = off + k * 128;
      s += rect(x + 1, r * 16 + 1, 126, 14, shades[(r * 3 + k + 5) % 5]) + line(`M${x + 10} ${r * 16 + 6}Q${x + 60} ${r * 16 + 4} ${x + 118} ${r * 16 + 7}`, '#000', 0.6, op(0.18));
    }
  });
  return s;
}

function carpet(p: string): string {
  let s = rect(0, 0, FW, FH, mix('#2a2230', p, 0.1));
  for (let k = -2; k < 10; k++) s += line(`M${k * 32} 0L${k * 32 + 64} 64M${k * 32 + 64} 0L${k * 32} 64`, mix(p, '#000', 0.4), 1, op(0.2));
  s += range(8).map((k) => circ(k * 32 + 16, 32, 1.6, p, op(0.25)) + circ(k * 32, 0, 1.6, p, op(0.25)) + circ(k * 32, 64, 1.6, p, op(0.25))).join('');
  return s;
}

function stone(): string {
  let s = '';
  range(4).forEach((k) => (s += rect(k * 64, 0, 64, 64, k % 2 ? '#262a33' : '#2b2f39') + rect(k * 64, 0, 1.5, 64, '#fff', op(0.07))));
  s += rect(0, 0, FW, 1.5, '#fff', op(0.07)) + path('M20 0H60L28 64H-12Z M150 0H170L138 64H118Z', '#fff', op(0.035));
  return s;
}

function stage(p: string): string {
  let s = rect(0, 0, FW, FH, '#151a24');
  range(4).forEach((k) =>
    range(2).forEach((r) => {
      s += rect(k * 64 + 1, r * 32 + 1, 62, 30, '#1a202c') + rect(k * 64 + 1, r * 32 + 1, 62, 1, '#fff', op(0.06));
      s += [4, 58].map((dx) => circ(k * 64 + dx, r * 32 + 5, 1, '#3a4152') + circ(k * 64 + dx, r * 32 + 27, 1, '#3a4152')).join('');
    }),
  );
  s += rect(0, 31, FW, 1.5, p, op(0.25));
  return s;
}

function deck(p: string): string {
  let s = rect(0, 0, FW, FH, '#23272e');
  range(16).forEach((k) =>
    range(4).forEach((r) => {
      const x = k * 16 + (r % 2) * 8;
      s += path(`M${x + 3} ${r * 16 + 11}L${x + 11} ${r * 16 + 5}`, 'none', `${stroke('#3a3f48', 2.4)} stroke-linecap="round"`);
    }),
  );
  s += rect(0, 0, FW, 2, '#000', op(0.3)) + rect(0, 0, 2, FH, '#000', op(0.3)) + rect(128, 0, 2, FH, '#000', op(0.3));
  s += range(4).map((k) => circ(k * 64 + 6, 6, 1.4, '#4a505a')).join('') + rect(0, 62, FW, 2, p, op(0.18));
  return s;
}

const FLOORS = [concrete, boards, carpet, stone, stage, deck];

/** Floor colours per house level (behind the tile, and the skirting board where the wall meets it). */
export const ROOM_FLOORS: { a: string; b: string; skirt: string }[] = [
  { a: '#3b3b3f', b: '#28282c', skirt: '#2a2a2e' },
  { a: '#4a3527', b: '#30231a', skirt: '#6d5a4c' },
  { a: '#2e2433', b: '#1c1720', skirt: '#3a3742' },
  { a: '#262a33', b: '#15181d', skirt: '#1a1f33' },
  { a: '#1d2430', b: '#11151d', skirt: '#06070b' },
  { a: '#22262d', b: '#121418', skirt: '#3a3e46' },
];

export function roomFloor(level: number): { a: string; b: string; skirt: string } {
  return ROOM_FLOORS[Math.max(0, Math.min(ROOM_FLOORS.length - 1, level))];
}

const floorCache = new Map<string, string>();

/** The floor for the org's house level as a CSS background image, a 256x64 tile. */
export function roomFloorBackground(level: number, primary: string): string {
  const lv = Math.max(0, Math.min(FLOORS.length - 1, level));
  const key = `${lv}|${primary}`;
  const hit = floorCache.get(key);
  if (hit) return hit;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${FW} ${FH}" width="${FW}" height="${FH}">${FLOORS[lv](primary)}</svg>`;
  const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  floorCache.set(key, url);
  return url;
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
    wallR: (c) =>
      frame(
        rect(7, 9, 34, 13, '#4a3388') +
          circ(14, 14, 0.8, '#fff') +
          circ(33, 12, 0.8, '#fff') +
          circ(27, 17, 0.6, '#fff') +
          circ(35, 18, 2.4, '#f5efd6') +
          path('M11 28H37L33 33H15Z', '#5d5d7c') +
          rect(11, 27, 26, 2, c) +
          path('M15 33L24 38L33 33Z', '#3e3e58') +
          circ(18, 21.5, 1.8, '#ff6b6b') +
          rect(17, 23, 2, 4, '#ff6b6b') +
          circ(30, 21.5, 1.8, '#5aa9ff') +
          rect(29, 23, 2, 4, '#5aa9ff'),
        '#2a1d4f',
      ),
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
    floorR: () =>
      floorShadow(15) +
      path('M10 20L16 14H40L34 20Z', '#d4a868') +
      path('M34 20L40 14V38L34 44Z', '#8f6a3b') +
      rect(10, 20, 24, 24, '#b2864f') +
      line('M12 26H32M12 32H32M12 38H32', '#8f6a3b', 0.8, op(0.6)) +
      line('M16 15.5H38M13 18.5H35', '#a87e48', 0.8) +
      [[10, 20], [30, 20], [10, 40], [30, 40]].map(([x, y]) => rect(x, y, 4, 4, '#6d7077')).join('') +
      rect(10, 20, 24, 24, 'none', stroke('#5c3f1f', 1.4)) +
      path('M18.5 28Q18.5 24.5 22 24.5Q25.5 24.5 25.5 28Q25.5 30.5 22 31.5V33.5', 'none', `${stroke('#5c3f1f', 4.4)} stroke-linecap="round"`) +
      path('M18.5 28Q18.5 24.5 22 24.5Q25.5 24.5 25.5 28Q25.5 30.5 22 31.5V33.5', 'none', `${stroke('#fff3c4', 2.2)} stroke-linecap="round"`) +
      circ(22, 37.5, 1.8, '#5c3f1f') +
      circ(22, 37.5, 1.2, '#fff3c4'),
  },
  // Rocket Soccar: a goal on the wall, a flipping-car poster, the giant ball and a boost pad.
  rocket: {
    wallL: (c) =>
      rect(5, 9, 38, 30, '#0d1a2a') +
      rect(11, 14, 26, 22, '#09121e') +
      line('M8 12L11 14M40 12L37 14M8 38L11 36M40 38L37 36', '#cfe7ff', 0.6, op(0.4)) +
      range(6).map((i) => line(`M${11 + i * 5.2} 14V36`, '#cfe7ff', 0.5, op(0.45))).join('') +
      range(5).map((i) => line(`M11 ${14 + i * 5.5}H37`, '#cfe7ff', 0.5, op(0.45))).join('') +
      range(4).map((i) => line(`M${8 + i * 0.75} ${14 + i * 6}H${11}`, '#cfe7ff', 0.5, op(0.3)) + line(`M${40 - i * 0.75} ${14 + i * 6}H37`, '#cfe7ff', 0.5, op(0.3))).join('') +
      rect(4, 8, 4, 32, c) +
      rect(40, 8, 4, 32, c) +
      rect(4, 8, 40, 4, c) +
      rect(4, 8, 40, 1.4, '#fff', op(0.45)) +
      rect(4, 8, 1.4, 32, '#fff', op(0.3)) +
      rect(2, 39, 44, 2.4, '#e8edf5', op(0.7)),
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
        rect(7, 9, 34, 5, '#e0474c', op(0.85)) +
          path('M11 38L15 20L19 38Z', '#ff8a3d') +
          line('M15 20L12.5 15M15 20V14M15 20L17.5 15', '#4caf6a', 1.6) +
          circ(14, 26, 0.9, K.ink) +
          circ(16.4, 26, 0.9, K.ink) +
          ell(24, 30, 4.6, 8.5, '#6cbf4a') +
          circ(24, 26.5, 2, '#a6e88a') +
          circ(24, 31, 2, '#a6e88a') +
          circ(24, 35.3, 1.8, '#a6e88a') +
          circ(22.8, 22.8, 0.8, K.ink) +
          circ(25.2, 22.8, 0.8, K.ink) +
          rect(32, 28, 3, 10, '#8fbf5a') +
          circ(30.5, 24.5, 3.4, '#3f9a5a') +
          circ(36.5, 24.5, 3.4, '#3f9a5a') +
          circ(33.5, 21, 3.9, '#4caf6a') +
          circ(32.4, 26.5, 0.8, K.ink) +
          circ(34.8, 26.5, 0.8, K.ink),
        '#34405c',
      ),
    wallR: (c) =>
      frame(
        rect(7, 9, 34, 30, '#4f6d3c') +
          path('M7 9H20Q16 16 22 20Q14 24 7 22Z', '#5d7d46') +
          path('M41 30Q32 28 30 39H41Z', '#3f5a30') +
          path('M7 31Q18 26 26 30Q34 34 41 27', 'none', stroke('#5aa9ff', 1.6)) +
          line('M14 9V39M7 18H41', '#d9c08a', 0.7, op(0.6)) +
          path('M7 9H41V39H7Z M33 22.5A9 9 0 1 0 15 22.5A9 9 0 1 0 33 22.5Z', '#e0474c', `${op(0.32)} fill-rule="evenodd"`) +
          circ(24, 22.5, 9, 'none', stroke(c, 1.6)) +
          circ(26, 21, 4.5, 'none', `${stroke('#fff', 1)} stroke-dasharray="1.6 1.2"`) +
          path('M26 21.5Q23 17.5 26 15.5Q29 17.5 26 21.5Z', '#fff') +
          circ(26, 17.5, 1, '#e0474c'),
        '#3d5a3a',
      ),
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
    wallL: (c) =>
      frame(
        path('M7 39V28Q24 18 41 28V39Z', '#7a2f3a', op(0.7)) +
          path('M16 39Q16 26 24 24Q32 26 32 39Z', '#1c1c22') +
          circ(24, 19, 5.5, '#1c1c22') +
          rect(19.5, 18, 9, 2.4, c) +
          circ(13, 29, 5, '#ff8a3d', op(0.3)) +
          circ(13, 29, 2.8, '#ffd27a') +
          circ(35, 29, 5, '#ff8a3d', op(0.3)) +
          circ(35, 29, 2.8, '#ffd27a') +
          path('M11 27Q13 21 15 27Z M33 27Q35 21 37 27Z', '#ff8a3d'),
        '#5a2430',
      ),
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
    wallL: (c) =>
      rr(10, 3, 28, 3, 1, '#0d1a2a') +
      rect(10.6, 3.6, 19, 1.8, c) +
      rect(5, 9, 38, 32, '#8a6236') +
      ['#c49460', '#b78a55', '#c99c66', '#b2844f'].map((col, i) => rect(7, 11 + i * 7.25, 34, 6.5, col)).join('') +
      line('M19 11V17.5M31 18.25V24.75M15 25.5V32M33 32.75V39', '#7d5a30', 1) +
      line('M8 14Q24 12.5 40 14.5M8 28.5Q24 27 40 29', '#000', 0.5, op(0.15)) +
      line('M7 39L41 11', '#7d5a30', 2.2) +
      [[9, 13], [39, 13], [9, 37], [39, 37], [24, 24]].map(([x, y]) => circ(x, y, 1.1, '#d0d2d6')).join('') +
      rect(5, 9, 38, 32, 'none', stroke('#5c3f1f', 1.6)),
    wallR: (c) =>
      rr(7, 4, 34, 3.4, 1.5, '#7d5a30') +
      circ(7, 5.7, 2.2, K.gold) +
      circ(41, 5.7, 2.2, K.gold) +
      path('M10 7H38V40L24 33L10 40Z', mix(c, '#000', 0.12)) +
      path('M34 7H38V40L34 38Z', '#000', op(0.18)) +
      rect(10, 7, 28, 3, '#fff', op(0.25)) +
      path('M10 36L24 29L38 36', 'none', `${stroke(K.gold, 1.2)}`) +
      path('M15 24L17 14L21.5 19L24 12L26.5 19L31 14L33 24Z', K.gold) +
      path('M24 12L26.5 19L31 14L33 24H24Z', K.goldD, op(0.5)) +
      rect(15, 24, 18, 3.5, K.goldD) +
      circ(24, 21, 1.6, K.red) +
      circ(19, 22, 1.2, '#3a8bff') +
      circ(29, 22, 1.2, '#3a8bff') +
      circ(17, 13.5, 1, K.goldL) +
      circ(24, 11.5, 1, K.goldL) +
      circ(31, 13.5, 1, K.goldL),
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
    floorR: () =>
      floorShadow(12) +
      path('M14 18Q12 31 14 44H34Q36 31 34 18Z', '#2c7fd6') +
      path('M28 18Q31 31 28 44H34Q36 31 34 18Z', '#1d5aa0', op(0.7)) +
      path('M16 18Q14.5 31 16 44', 'none', `${stroke('#fff', 2)} ${op(0.3)}`) +
      rect(13, 22, 22, 2.4, '#1d5aa0') +
      rect(13, 38, 22, 2.4, '#1d5aa0') +
      ell(24, 18, 10, 3, '#1d5aa0') +
      ell(24, 17.4, 7.5, 2, '#7fd3ff') +
      path('M20 15Q22 10 24 14Q26 9 28 15', 'none', `${stroke('#7fd3ff', 1.6)} ${op(0.8)}`) +
      rr(17, 26, 14, 10, 3, '#e8f6ff') +
      path('M20 31Q22 27.5 24 31Q26 34.5 28 31', 'none', stroke('#2c7fd6', 1.6)) +
      circ(21, 29, 0.8, '#ff6bd6'),
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
    floorR: () =>
      floorShadow(13) +
      rr(13, 18, 22, 26, 4, '#3a4a3a') +
      rect(30, 18, 5, 26, '#000', op(0.2)) +
      rect(14, 18, 2, 26, '#fff', op(0.12)) +
      group(rect(13, 21, 22, 4, K.gold) + range(6).map((i) => path(`M${12 + i * 5} 25L${15 + i * 5} 21H${17 + i * 5}L${14 + i * 5} 25Z`, K.ink)).join(''), '') +
      rr(17, 29, 14, 9, 2, '#0e1a0e') +
      rr(18.5, 30.5, 11, 6, 1.5, '#9dff3b', op(0.85)) +
      rect(19.5, 31.2, 3, 1.4, '#fff', op(0.6)) +
      circ(24, 33.5, 9, '#9dff3b', op(0.12)) +
      rr(18, 12, 12, 7, 2, '#2c3a2c') +
      rect(21, 9, 6, 3, '#4a5a4a') +
      ell(26, 6, 6, 3.5, '#9dff3b', op(0.3)) +
      ell(21, 2.5, 4, 2.5, '#9dff3b', op(0.2)),
  },
  // Overclock: a hero poster, a wall health pack, the payload and a hammer.
  overclock: {
    wallL: () => frame(circ(24, 22, 9, '#c9ced8') + rect(17, 20, 14, 4, '#ff8a3d') + rect(21, 30, 6, 6, '#8f9097') + circ(21, 22, 1.2, '#fff') + circ(27, 22, 1.2, '#fff'), '#2a3a52'),
    wallR: () => rr(10, 12, 28, 24, 3, '#f1f1f0') + rect(21, 16, 6, 16, '#e0474c') + rect(16, 21, 16, 6, '#e0474c') + rr(10, 12, 28, 24, 3, 'none', stroke('#9ea2a8', 1.2)),
    floorL: (c) =>
      floorShadow(19) +
      rr(4, 36, 40, 6, 3, '#24272e') +
      [10, 19, 29, 38].map((x) => circ(x, 40, 3.6, K.ink) + circ(x, 40, 1.4, '#6d7077')).join('') +
      rr(5, 24, 38, 13, 4, '#4a505e') +
      rect(5, 30, 38, 2.4, c) +
      rect(6, 25, 36, 1.4, '#fff', op(0.18)) +
      path('M11 24Q11 12 24 12Q37 12 37 24Z', '#5d6474') +
      path('M14 24Q14 15 24 15Q34 15 34 24Z', '#3d4250') +
      circ(24, 21, 9, c, op(0.2)) +
      circ(24, 21, 5, c) +
      circ(24, 21, 2.4, '#fff', op(0.85)) +
      circ(24, 21, 7, 'none', `${stroke(c, 1)} ${op(0.6)}`) +
      circ(7, 28, 1.6, '#ffe066') +
      circ(41, 28, 1.6, K.red),
    floorR: (c) =>
      floorShadow(14) +
      rect(22, 4, 4, 28, '#5c3f1f') +
      rect(22, 4, 1.4, 28, '#fff', op(0.18)) +
      [8, 12, 16].map((y) => rect(21.5, y, 5, 2, '#2c2d33')).join('') +
      circ(24, 4, 2.6, '#8f9097') +
      rr(9, 30, 30, 14, 3, '#7a7f88') +
      rect(9, 30, 30, 3, '#c9ced8') +
      rr(6, 31, 6, 12, 2, c) +
      rr(36, 31, 6, 12, 2, c) +
      rect(6, 33, 6, 1.2, '#fff', op(0.4)) +
      rect(36, 33, 6, 1.2, '#fff', op(0.4)) +
      circ(24, 37, 3.4, '#3d4250') +
      circ(24, 37, 1.8, c),
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
    wallR: (c) =>
      rr(8, 5, 32, 38, 3, '#2c2d33') +
      rr(10, 7, 28, 34, 2, '#1c1d22') +
      rr(19, 10, 7, 22, 2, c, op(0.25)) +
      rr(20, 11, 5, 20, 1.5, '#f1f1f0') +
      rect(20, 11, 1.4, 20, '#fff') +
      rect(21.5, 31, 2, 3, '#9ea2a8') +
      rect(30, 17, 3.4, 3.4, c) +
      rect(33.5, 13, 2.4, 2.4, c, op(0.4)) +
      rr(15, 35.5, 18, 3.5, 1, K.gold) +
      rect(18, 36.8, 12, 1, K.goldD),
    floorL: (c) => floorShadow(12) + rr(14, 10, 20, 34, 2, '#2c2d33') + rect(16, 13, 16, 12, '#0a0b10') + rect(18, 15, 1.6, 6, c) + rect(30, 17, 1.6, 6, c) + rect(24, 19, 1.6, 1.6, c) + circ(20, 32, 2, K.red) + circ(27, 32, 2, '#3a6bff'),
    floorR: (c) =>
      floorShadow(9) +
      rr(18, 34, 12, 10, 1.5, '#2c2d33') +
      rect(16, 32, 16, 3, '#3d3e45') +
      circ(24, 26, 9, c, op(0.15)) +
      rect(21, 23, 6, 6, c) +
      rect(12, 12, 5, 5, c, op(0.45)) +
      rect(31, 7, 4, 4, c, op(0.25)) +
      line('M21 23L17 17M27 23L32 11', c, 0.8, `${op(0.5)} stroke-dasharray="1.5 1.5"`),
  },
  // Galactic Siege VR: a hologram planet, a starship poster, a VR headset on its stand and a space helmet.
  galactic: {
    wallL: (c) => ell(24, 40, 10, 3, c, op(0.4)) + path('M16 39L20 18H28L32 39Z', c, op(0.12)) + circ(24, 18, 9, c, op(0.35)) + ell(24, 18, 14, 3, 'none', `${stroke(c, 1)} ${op(0.6)}`),
    wallR: () => frame(path('M10 26L26 20L38 24L26 28Z', '#c9ced8') + path('M20 21L16 15L24 20Z M20 27L16 33L24 28Z', '#8f9097') + path('M38 24L44 23L44 25Z', '#ff8a3d'), '#0d1020'),
    floorL: (c) =>
      floorShadow(11) +
      ell(24, 43, 9, 2.4, '#2c2d33') +
      rect(22.5, 26, 3, 17, '#3d3e45') +
      rect(22.5, 26, 1, 17, '#fff', op(0.15)) +
      path('M13 18Q12 9 24 9Q36 9 35 18', 'none', stroke('#1d1d21', 2.4)) +
      rr(11, 15, 26, 12, 5, '#2c2d33') +
      rr(11, 15, 26, 3, 1.5, '#fff', op(0.12)) +
      rr(13, 18, 10, 6, 3, c, op(0.75)) +
      rr(25, 18, 10, 6, 3, c, op(0.75)) +
      rect(14.5, 19, 3, 1.4, '#fff', op(0.6)) +
      rect(26.5, 19, 3, 1.4, '#fff', op(0.6)) +
      circ(24, 21, 12, c, op(0.1)) +
      rr(35, 30, 6, 12, 2.5, '#2c2d33') +
      circ(38, 32, 1.4, c),
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


// ---------------------------------------------------------------------------------------------
// Signs: the game's name and logo over each room, in a material that suits the game
// ---------------------------------------------------------------------------------------------

const SH = 44;
const DISPLAY = "font-family:'Orbitron','Rajdhani',sans-serif";
const UI = "font-family:'Rajdhani','Inter',sans-serif";
const SERIF = "font-family:Georgia,'Times New Roman',serif";
const MONO = "font-family:'Courier New',Consolas,monospace";

interface SignStyle {
  /** CSS font declaration, size, weight, and roughly how wide a letter is as a share of the size. */
  font: string;
  size: number;
  weight: number;
  k: number;
  italic?: boolean;
  /** Space before the logo and after the name, for the frame's own decoration. */
  padL: number;
  padR: number;
  /** Space from the logo to the name, when a frame puts something between them. */
  gap?: number;
  /** Moves the logo and name down, for frames that hang from something. */
  dy?: number;
  fill: (c: string) => string;
  /** A dark edge drawn under the letters, for lettering painted on a busy surface. */
  outline?: (c: string) => [string, number];
  /** A wide, faint copy of the lettering behind it: neon, LEDs, holograms. */
  glow?: (c: string) => string;
  back: (w: number, c: string, u: string) => string;
  front?: (w: number, c: string, u: string) => string;
}

const rivets = (w: number, y0: number, y1: number, inset = 5, fill = '#c9ced8') =>
  [inset, w - inset].map((x) => circ(x, y0, 1.3, fill) + circ(x, y1, 1.3, fill)).join('');

const SIGN_STYLES: Record<string, SignStyle> = {
  // Smash Siblings: a comic-book panel, slanted, with a burst of stars.
  smash: {
    font: UI, size: 23, weight: 900, k: 0.5, italic: true, padL: 12, padR: 16,
    fill: () => '#fff',
    outline: () => [K.ink, 4],
    back: (w, c) =>
      path(`M10 4H${w}L${w - 10} 40H0Z`, c) +
      path(`M10 4H${w}L${w - 4} 18H5Z`, '#fff', op(0.18)) +
      range(9).map((i) => circ(w - 30 + (i % 3) * 6, 10 + Math.floor(i / 3) * 6, 1.4, '#000', op(0.18))).join('') +
      path(`M10 4H${w}L${w - 10} 40H0Z`, 'none', `${stroke(K.ink, 2.5)} stroke-linejoin="round"`),
    front: (w) => spark(w - 7, 6, 5, K.gold) + spark(4, 38, 3.5, '#fff'),
  },
  // Rocket Soccar: a broadcast score bug, with boost chevrons.
  rocket: {
    font: DISPLAY, size: 15, weight: 800, k: 0.8, padL: 6, padR: 22, gap: 44,
    fill: () => '#fff',
    back: (w, c) =>
      rr(0, 4, w, 36, 6, '#0b1830') +
      path('M6 4H44L34 40H6Q0 40 0 34V10Q0 4 6 4Z', c) +
      path('M44 4H48L38 40H34Z', '#fff', op(0.8)) +
      rect(44, 4, w - 50, 2, c, op(0.7)) +
      [0, 1, 2].map((i) => line(`M${w - 18 + i * 5} 16L${w - 14 + i * 5} 22L${w - 18 + i * 5} 28`, '#ff8a3d', 2.2, op(0.5 + i * 0.25))).join(''),
  },
  // Counter-Stroke: a stencilled steel plate between hazard stripes.
  counter: {
    font: UI, size: 21, weight: 800, k: 0.56, padL: 16, padR: 16,
    fill: (c) => c,
    back: (w, _c, u) =>
      `<clipPath id="${u}-h"><rect x="0" y="4" width="11" height="36"/><rect x="${w - 11}" y="4" width="11" height="36"/></clipPath>` +
      rect(0, 4, w, 36, '#3a3c31') +
      rect(0, 4, w, 2, '#fff', op(0.12)) +
      group(rect(0, 4, w, 36, K.gold) + range(Math.ceil(w / 8) + 6).map((i) => path(`M${i * 8 - 40} 40L${i * 8 - 4} 4H${i * 8} L${i * 8 - 36} 40Z`, K.ink)).join(''), `clip-path="url(#${u}-h)"`) +
      rect(0, 4, w, 36, 'none', stroke('#1e2019', 2)) +
      rivets(w, 9, 35, 16, '#8a8c80'),
  },
  // League of Lanes: a dark plaque in a gold hextech frame.
  lanes: {
    font: SERIF, size: 17, weight: 700, k: 0.66, padL: 12, padR: 14,
    fill: () => '#f0d48a',
    back: (w) =>
      rr(0, 4, w, 36, 3, '#0f1a2e') +
      rr(2.5, 6.5, w - 5, 31, 2, 'none', stroke(K.gold, 1.4)) +
      rr(5, 9, w - 10, 26, 1, 'none', `${stroke(K.goldD, 0.8)} ${op(0.7)}`) +
      [[2.5, 6.5], [w - 2.5, 6.5], [2.5, 37.5], [w - 2.5, 37.5]].map(([x, y]) => path(`M${x} ${y - 4}L${x + 4} ${y}L${x} ${y + 4}L${x - 4} ${y}Z`, K.gold)).join('') +
      path(`M${w / 2 - 6} 4L${w / 2} 0L${w / 2 + 6} 4Z`, K.gold) +
      path(`M${w / 2 - 6} 40L${w / 2} 44L${w / 2 + 6} 40Z`, K.gold),
  },
  // Apex Legumes: a red swallowtail banner with stitched edges.
  apex: {
    font: UI, size: 22, weight: 900, k: 0.5, italic: true, padL: 14, padR: 16,
    fill: () => '#fff',
    outline: () => ['#7a1a18', 3],
    back: (w, c) =>
      path(`M0 4H${w}L${w - 9} 22L${w} 40H0L9 22Z`, '#c8322f') +
      path(`M0 4H${w}L${w - 3} 9H2Z`, '#e5403f') +
      rect(0, 36, w, 4, '#000', op(0.2)) +
      path(`M5 8H${w - 5}M5 36H${w - 5}`, 'none', `${stroke('#fff', 0.8)} ${op(0.45)} stroke-dasharray="3 2"`) +
      path(`M${w - 30} 14L${w - 26} 22L${w - 30} 30`, 'none', `${stroke(c, 2)} ${op(0.8)}`),
  },
  // Valorunt: a cut-corner plate with a neon edge.
  valorunt: {
    font: DISPLAY, size: 15, weight: 700, k: 0.82, padL: 12, padR: 18,
    fill: (c) => c,
    glow: (c) => c,
    back: (w, c) =>
      path(`M10 4H${w}V30L${w - 10} 40H0V14Z`, '#0e0d12') +
      path(`M10 4H${w}V30L${w - 10} 40H0V14Z`, 'none', `${stroke(c, 5)} ${op(0.15)}`) +
      path(`M10 4H${w}V30L${w - 10} 40H0V14Z`, 'none', stroke(c, 1.4)) +
      line(`M${w - 14} 10L${w - 8} 10M${w - 10} 14H${w - 6}`, c, 1.4, op(0.7)),
  },
  // Fortnight: planks nailed together in a hurry, the name painted on.
  fortnight: {
    font: UI, size: 23, weight: 900, k: 0.52, padL: 10, padR: 12,
    fill: (c) => c,
    outline: () => ['#1b2a5a', 4],
    back: (w) =>
      rect(0, 4, w, 36, '#b78a55') +
      rect(0, 16, w, 1.5, '#7d5a30') +
      rect(0, 28, w, 1.5, '#7d5a30') +
      line(`M${w * 0.3} 4V16M${w * 0.7} 16V28M${w * 0.45} 28V40`, '#7d5a30', 1.2) +
      line(`M8 10Q${w / 2} 8 ${w - 8} 11M6 34Q${w / 2} 36 ${w - 6} 33`, '#000', 0.6, op(0.15)) +
      rect(0, 4, w, 36, 'none', stroke('#5c3f1f', 2)) +
      rivets(w, 9, 35, 4, '#d0d2d6'),
  },
  // StarCrafty: a bevelled steel plate with rivets.
  starcrafty: {
    font: DISPLAY, size: 15, weight: 800, k: 0.82, padL: 12, padR: 14,
    fill: () => '#e8f6ff',
    glow: (c) => c,
    back: (w, _c, u) =>
      `<linearGradient id="${u}-m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a94a6"/><stop offset="0.5" stop-color="#5a6374"/><stop offset="1" stop-color="#3a4150"/></linearGradient>` +
      path(`M7 4H${w - 7}L${w} 11V33L${w - 7} 40H7L0 33V11Z`, `url(#${u}-m)`) +
      path(`M9 7H${w - 9}L${w - 3} 12V32L${w - 9} 37H9L3 32V12Z`, '#1b2230') +
      path(`M7 4H${w - 7}L${w} 11`, 'none', `${stroke('#fff', 1)} ${op(0.4)}`) +
      rivets(w, 8, 36, 6, '#c9ced8'),
  },
  // Overclock: a clean white panel with an orange flash.
  overclock: {
    font: DISPLAY, size: 15, weight: 800, k: 0.82, padL: 6, padR: 20, gap: 44,
    fill: () => '#2c303a',
    back: (w, c) =>
      rr(0, 4, w, 36, 8, '#f1f1f0') +
      path('M8 4H44L34 40H8Q0 40 0 32V12Q0 4 8 4Z', c) +
      rect(44, 34, w - 52, 2, c, op(0.6)) +
      [0, 1].map((i) => path(`M${w - 16 + i * 6} 15L${w - 11 + i * 6} 22L${w - 16 + i * 6} 29H${w - 19 + i * 6}L${w - 14 + i * 6} 22L${w - 19 + i * 6} 15Z`, c)).join('') +
      rr(0, 4, w, 36, 8, 'none', stroke('#c9ced8', 1.2)),
  },
  // Hearthstoned: a tavern board hanging on two chains.
  hearthstoned: {
    font: SERIF, size: 18, weight: 700, k: 0.6, italic: true, padL: 12, padR: 14, dy: 3,
    fill: () => K.gold,
    outline: () => ['#2a1a0a', 2.5],
    back: (w) =>
      [14, w - 14].map((x) => range(3).map((i) => ell(x, 1.5 + i * 3, 1.4, 2, 'none', stroke('#9ea2a8', 1))).join('')).join('') +
      rr(0, 9, w, 34, 5, '#6b4423') +
      line(`M6 18Q${w / 2} 15 ${w - 6} 19M6 30Q${w / 2} 33 ${w - 6} 29`, '#000', 0.8, op(0.2)) +
      rr(2.5, 11.5, w - 5, 29, 4, 'none', stroke(K.gold, 1.4)) +
      [[6, 15], [w - 6, 15], [6, 37], [w - 6, 37]].map(([x, y]) => circ(x, y, 1.6, K.gold)).join(''),
  },
  // Quantum Pong: an LED dot-matrix board.
  pong: {
    font: MONO, size: 17, weight: 700, k: 0.58, padL: 8, padR: 12,
    fill: (c) => c,
    glow: (c) => c,
    back: (w, _c, u) =>
      `<pattern id="${u}-d" width="3" height="3" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="0.6" fill="#fff" opacity="0.07"/></pattern>` +
      rr(0, 4, w, 36, 3, '#09090e') +
      rect(2, 6, w - 4, 32, `url(#${u}-d)`) +
      rr(0, 4, w, 36, 3, 'none', stroke('#2a2a33', 2.5)),
    front: (w, _c, u) => `<pattern id="${u}-s" width="4" height="2" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity="0.35"/></pattern>` + rect(2, 6, w - 4, 32, `url(#${u}-s)`),
  },
  // Galactic Siege VR: a hologram panel with scanlines and corner brackets.
  galactic: {
    font: DISPLAY, size: 14, weight: 700, k: 0.84, padL: 10, padR: 10,
    fill: (c) => c,
    glow: (c) => c,
    back: (w, c) =>
      rect(0, 4, w, 36, c, op(0.1)) +
      line(`M0 12V4H8M${w - 8} 4H${w}V12M${w} 32V40H${w - 8}M8 40H0V32`, c, 1.6),
    front: (w, c, u) => `<pattern id="${u}-s" width="4" height="3" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="${c}" opacity="0.18"/></pattern>` + rect(0, 4, w, 36, `url(#${u}-s)`),
  },
};

let signSerial = 0;
const escapeText = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * The sign over a game's room: its logo and its name, lettered and framed to suit the game (a
 * stencilled plate for Counter-Stroke, a tavern board for Hearthstoned). Built from constants, the
 * game's own name and colour, so the markup is safe for {@html}.
 */
export function roomSignSvg(gameId: string, color: string, name: string): string {
  const st = SIGN_STYLES[gameId] ?? SIGN_STYLES.valorunt;
  const u = `rs${(++signSerial).toString(36)}`;
  const label = escapeText(st.font === SERIF ? name : name.toUpperCase());
  const tw = Math.round(name.length * st.size * st.k);
  const dy = st.dy ?? 0;
  const logoX = st.padL;
  const textX = logoX + (st.gap ?? 34);
  const w = textX + tw + st.padR;
  const h = SH + dy;
  const baseline = f(22 + dy + st.size * 0.35);
  const style = `${st.font};font-style:${st.italic ? 'italic' : 'normal'}`;
  const text = (extra: string) =>
    `<text x="${textX}" y="${baseline}" font-size="${st.size}" font-weight="${st.weight}" textLength="${tw}" lengthAdjust="spacingAndGlyphs" style="${style}" ${extra}>${label}</text>`;
  const outline = st.outline?.(color);
  const logo = gameLogoSvg(gameId, color, name).replace('<svg ', `<svg x="${logoX}" y="${f(8 + dy)}" width="28" height="28" `);
  return (
    `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">` +
    group(st.back(w, color, u), dy ? `transform="translate(0 ${dy - 3})"` : '') +
    logo +
    (st.glow ? text(`fill="none" stroke="${st.glow(color)}" stroke-width="4" stroke-linejoin="round" opacity="0.3"`) : '') +
    text(`fill="${st.fill(color)}"${outline ? ` stroke="${outline[0]}" stroke-width="${outline[1]}" stroke-linejoin="round" paint-order="stroke"` : ''}`) +
    (st.front ? group(st.front(w, color, u), dy ? `transform="translate(0 ${dy - 3})"` : '') : '') +
    `</svg>`
  );
}

/** Every game with its own sign, so a test can check none is missing. */
export const ROOM_SIGN_GAMES = Object.keys(SIGN_STYLES);
