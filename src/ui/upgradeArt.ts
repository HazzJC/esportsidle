import { K, circ, ell, line, op, path, rect, rr, stroke } from './artKit';

/**
 * Pictures for store upgrades that aren't about one operation (those reuse the operation's own
 * building). Same style as the HQ sprites: a 48x48 grid lit from the top left, ink outlines, a lit
 * face, a shaded face, a soft ground shadow, and a glow in `c`, the upgrade's tier colour.
 *
 * Keyed by the icon name the upgrade already carries, so every upgrade with that icon gets the
 * picture without a second list of upgrade ids. Built from constants and the tier colour only, so
 * the markup is safe to render with {@html}.
 */
type Art = (c: string) => string;

const ink = K.ink;
const o = (w = 1) => `${stroke(ink, w)} stroke-linejoin="round"`;
const ground = (rx = 15) => ell(24, 44.6, rx, 2.4, '#000', op(0.38));
const lit = (d: string, a = 0.25) => path(d, '#ffffff', op(a));
const shade = (d: string, a = 0.25) => path(d, '#000000', op(a));
const aura = (cx: number, cy: number, r: number, c: string) => circ(cx, cy, r, c, op(0.16));
const twinkle = (x: number, y: number, s: number, fill = '#fff') =>
  path(`M${x} ${y - s}L${x + s * 0.3} ${y - s * 0.3}L${x + s} ${y}L${x + s * 0.3} ${y + s * 0.3}L${x} ${y + s}L${x - s * 0.3} ${y + s * 0.3}L${x - s} ${y}L${x - s * 0.3} ${y - s * 0.3}Z`, fill);

const ART: Record<string, Art> = {
  // A gaming mouse mid-click, RGB strip lit, a spark off the button.
  'mouse-pointer-click': (c) =>
    ground(12) +
    aura(24, 26, 17, c) +
    path('M24 9C15 9 13 16 13 24V33C13 40 18 43 24 43C30 43 35 40 35 33V24C35 16 33 9 24 9Z', K.greyL, o()) +
    shade('M27 10C33 12 35 17 35 24V33C35 40 30 43 26 43Z', 0.3) +
    lit('M15 22C15 15 18 11 22 10V22Z', 0.5) +
    line('M24 9V22M13.5 22H34.5', ink, 1) +
    rr(22.4, 13, 3.2, 6, 1.4, c, o(0.8)) +
    path('M14 30Q24 35 34 30', 'none', `${stroke(c, 1.6)}`) +
    twinkle(9, 10, 3.6, K.goldL) +
    line('M12 14L15.5 16.5M8 18.5H12', K.goldL, 1.4),

  // Three fans in the stands, the middle one waving a foam finger.
  users: (c) =>
    ground(19) +
    rr(5, 34, 38, 9, 2, K.black3, o()) +
    lit('M6 35H42V36.4H6Z', 0.15) +
    circ(12, 25, 4.6, '#c98f6b', o()) +
    path('M5.5 36Q6 30 12 30Q18 30 18.5 36Z', '#3f7fd0', o()) +
    circ(36, 25, 4.6, '#8a5a3f', o()) +
    path('M29.5 36Q30 30 36 30Q42 30 42.5 36Z', '#d05a3f', o()) +
    circ(24, 23, 5, '#e8b893', o()) +
    path('M16.5 36Q17 28.5 24 28.5Q31 28.5 31.5 36Z', c, o()) +
    shade('M26 28.8Q31 29.5 31.5 36H26Z', 0.25) +
    path('M29 21V8.5a2.4 2.4 0 0 1 4.8 0V15l2.6.4c1.6.3 2.4 1.6 2 3.2L37 24H29Z', c, o()) +
    lit('M30 9V20H31.4V9Z', 0.4) +
    line('M22 23.5h.01M26 23.5h.01', ink, 1.6),

  // A megaphone with sound waves, trimmed in the tier colour.
  megaphone: (c) =>
    ground(14) +
    aura(28, 22, 16, c) +
    path('M9 19H15L33 9V37L15 27H9Z', K.white, o()) +
    shade('M15 23V27L33 37V23Z', 0.2) +
    rr(6, 18.5, 6, 9, 1.6, c, o()) +
    path('M15 27L18 38H23L21 29.5Z', K.black2, o()) +
    path('M33 9V37', 'none', o(2.4)) +
    rect(31, 9, 3, 28, c, o()) +
    line('M37 17Q40 23 37 29', c, 2) +
    line('M40.5 13.5Q46 23 40.5 32.5', c, 1.6, op(0.7)),

  // A slice of pizza with melted cheese and pepperoni.
  pizza: (c) =>
    ground(14) +
    aura(24, 24, 17, c) +
    path('M8 12Q24 4 40 12L24 42Z', '#f2c14e', o()) +
    path('M8 12Q24 4 40 12L38 15.5Q24 8.5 10 15.5Z', '#c9853b', o()) +
    shade('M24 9V42L38 15.5Q31 11.5 24 11Z', 0.14) +
    circ(19, 19, 3, '#c8453b', o(0.8)) +
    circ(28, 22, 3, '#c8453b', o(0.8)) +
    circ(23, 30, 2.6, '#c8453b', o(0.8)) +
    path('M30 26Q31 31 29.5 33', 'none', `${stroke('#f2c14e', 2.4)} stroke-linecap="round"`),

  // A plate with a burger, cutlery either side.
  utensils: (c) =>
    ground(18) +
    aura(24, 26, 17, c) +
    ell(24, 36, 17, 5.5, K.white, o()) +
    ell(24, 35.4, 12, 3.4, K.greyL) +
    path('M14 30Q14 20 24 20Q34 20 34 30Z', '#e0a052', o()) +
    lit('M17 26Q18 22 23 21.5', 0.4) +
    rect(13.5, 29.5, 21, 2.6, '#6b3a22', o(0.8)) +
    rect(14, 32, 20, 1.6, '#6fbf4a') +
    rr(13.5, 33.4, 21, 2.6, 1.2, '#e0a052', o(0.8)) +
    line('M5 14V26M7.5 14V20M5 20H7.5M6.2 20V38', K.silver, 1.4) +
    path('M41 14C44 16 44 22 41 24V38', 'none', `${stroke(K.silver, 1.6)} stroke-linecap="round"`),

  // An energy-drink can, beaded with condensation.
  coffee: (c) =>
    ground(9) +
    aura(24, 24, 16, c) +
    rr(15, 8, 18, 36, 4, c, o()) +
    shade('M27 8H29Q33 8 33 12V40Q33 44 29 44H27Z', 0.3) +
    lit('M17 11H20V41H17Z', 0.3) +
    rect(15, 8, 18, 4, K.silver, o(0.8)) +
    rect(15, 40, 18, 4, K.silver, o(0.8)) +
    path('M20 20L26 20L21.5 27H27L19.5 36L22 28.5H18Z', K.white, o(0.6)) +
    circ(29, 17, 0.9, '#fff', op(0.7)) +
    circ(30, 30, 0.8, '#fff', op(0.6)),

  // A glossy heart with sparkles: fame.
  heart: (c) =>
    ground(13) +
    aura(24, 24, 18, c) +
    path('M24 41C12 33 6 27 6 19A9 9 0 0 1 24 14A9 9 0 0 1 42 19C42 27 36 33 24 41Z', '#ff4d6d', o()) +
    shade('M24 41C36 33 42 27 42 19A9 9 0 0 0 33 10C38 14 39 21 34 28C31 32 27 36 24 41Z', 0.22) +
    lit('M11 15A5 5 0 0 1 18 12.5', 0.6) +
    path('M11 15A5 5 0 0 1 18 12.5', 'none', `${stroke('#fff', 2)} stroke-linecap="round" ${op(0.7)}`) +
    twinkle(40, 8, 3.4, c) +
    twinkle(8, 34, 2.4, c),

  // A gold superfan star on a rosette ribbon.
  star: (c) =>
    ground(12) +
    aura(24, 20, 18, c) +
    path('M17 28L13 43L19 40L22 45L25 31Z', c, o()) +
    path('M31 28L35 43L29 40L26 45L23 31Z', c, o()) +
    shade('M31 28L35 43L29 40L26 45L23 31Z', 0.25) +
    path('M24 3L29.3 13.6L41 15.3L32.5 23.6L34.5 35.3L24 29.8L13.5 35.3L15.5 23.6L7 15.3L18.7 13.6Z', K.gold, o()) +
    shade('M24 3L29.3 13.6L41 15.3L32.5 23.6L34.5 35.3L24 29.8Z', 0.18) +
    lit('M24 8L20.5 15.3L13 16.5', 0.5) +
    circ(24, 20, 4.2, K.goldL, op(0.6)),

  // A league cup on a plinth.
  trophy: (c) =>
    ground(12) +
    aura(24, 18, 17, c) +
    path('M13 9H7a6 6 0 0 0 7 10M35 9h6a6 6 0 0 1-7 10', 'none', `${stroke(K.goldD, 2.6)} stroke-linecap="round"`) +
    path('M12 5H36V17A12 12 0 0 1 12 17Z', K.gold, o()) +
    shade('M26 5H36V17A12 12 0 0 1 26 28.5Z', 0.2) +
    lit('M16 8V17Q16.5 23 20 26', 0.45) +
    ell(24, 5.2, 12, 1.8, K.goldL, o(0.6)) +
    rect(21.5, 29, 5, 5, K.goldD, o()) +
    rr(13, 34, 22, 9, 1.6, '#3b2a1f', o()) +
    rect(13.5, 34.5, 21, 1.6, '#5c4331') +
    rr(18, 37.4, 12, 2.6, 0.6, c),

  // A dumbbell lifted off the rack.
  dumbbell: (c) =>
    ground(18) +
    aura(24, 25, 17, c) +
    rect(12, 22.5, 24, 5, K.silver, o()) +
    lit('M12 23H36V24.4H12Z', 0.4) +
    rr(5, 14, 8, 22, 2, K.black2, o()) +
    rr(35, 14, 8, 22, 2, K.black2, o()) +
    rr(9, 17, 5, 16, 1.4, c, o()) +
    rr(34, 17, 5, 16, 1.4, c, o()) +
    lit('M6 15H8V35H6Z', 0.15) +
    shade('M40 14H43V36H40Z', 0.25),

  // A stopwatch for match pace.
  clock: (c) =>
    ground(13) +
    rr(21, 3, 6, 5, 1.2, K.silverD, o()) +
    path('M34 9L37 6L40 9L37 12Z', K.silverD, o()) +
    circ(24, 26, 16, K.silver, o()) +
    circ(24, 26, 12.5, K.white, o(0.8)) +
    shade('M24 10A16 16 0 0 1 24 42A12 12 0 0 0 24 13.5Z', 0.12) +
    path('M24 26L24 14.5A11.5 11.5 0 0 1 35 22.5Z', c, op(0.55)) +
    line('M24 26V16.5M24 26L30 29', ink, 1.8) +
    circ(24, 26, 1.8, ink) +
    lit('M13 21A12 12 0 0 1 19 15', 0.6),

  // A magnifying glass over a player card: scouting.
  search: (c) =>
    ground(16) +
    rr(6, 8, 22, 30, 2.4, K.white, o()) +
    circ(17, 17, 4.4, '#e8b893', o(0.8)) +
    path('M9.5 30Q10 23 17 23Q24 23 24.5 30Z', c, o(0.8)) +
    line('M10 33H24M10 36H20', K.greyD, 1.4) +
    circ(29, 25, 9.5, c, op(0.2)) +
    circ(29, 25, 9.5, 'none', o(3.6)) +
    circ(29, 25, 9.5, 'none', `${stroke(K.silver, 2)}`) +
    lit('M23.5 21A7 7 0 0 1 28 17.5', 0.7) +
    line('M36 32L43 40', ink, 5.4) +
    line('M36 32L43 40', '#6b4423', 3.4),

  // A processor with gold pins and a glowing core.
  cpu: (c) =>
    ground(16) +
    [11, 17, 23, 29, 35].map((p) => rect(p, 5, 2, 5, K.goldD) + rect(p, 38, 2, 5, K.goldD) + rect(5, p, 5, 2, K.goldD) + rect(38, p, 5, 2, K.goldD)).join('') +
    rr(9, 9, 30, 30, 3, K.pcb, o()) +
    shade('M28 9H36Q39 9 39 12V36Q39 39 36 39H28Z', 0.25) +
    rr(15, 15, 18, 18, 2, K.black2, o()) +
    rr(18, 18, 12, 12, 1.4, c) +
    circ(24, 24, 9, c, op(0.25)) +
    lit('M16 16H24V17.4H16Z', 0.3),

  // A leather briefcase for the HR line.
  briefcase: (c) =>
    ground(18) +
    path('M18 13V9.5a2 2 0 0 1 2-2H28a2 2 0 0 1 2 2V13', 'none', o(3.4)) +
    path('M18 13V9.5a2 2 0 0 1 2-2H28a2 2 0 0 1 2 2V13', 'none', `${stroke('#5c3a22', 1.8)}`) +
    rr(5, 13, 38, 28, 3.4, '#8b5a34', o()) +
    shade('M31 13H40Q43 13 43 16.4V37.6Q43 41 40 41H31Z', 0.25) +
    lit('M8 15H20V17H8Z', 0.25) +
    rect(5, 23, 38, 3, '#6b4423') +
    rr(20.5, 21, 7, 7, 1.2, c, o()) +
    circ(24, 24.5, 1.1, ink),

  // A Hype Drop badge, as it floats over the game.
  zap: (c) =>
    ground(12) +
    aura(24, 24, 19, c) +
    path('M24 4L42 14.5V33.5L24 44L6 33.5V14.5Z', '#000', op(0.45)) +
    path('M24 5L41 15V33L24 43L7 33V15Z', K.gold, o()) +
    lit('M24 5L41 15L24 24L7 15Z', 0.3) +
    shade('M24 24L41 15V33L24 43Z', 0.18) +
    path('M27 10L16 26H23L20 38L32 21H25Z', K.white, o()),

  // A bracket with crossed swords over the final.
  swords: (c) =>
    ground(16) +
    line('M4 9H11V17H4M4 31H11V39H4M11 13H16V35H11M16 24H20', ink, 3.4) +
    line('M4 9H11V17H4M4 31H11V39H4M11 13H16V35H11M16 24H20', K.greyL, 1.6) +
    path('M20 33L36 9L39 11L23 35Z', K.silver, o()) +
    path('M36 9L39 7L41 9.5L39 11Z', c, o(0.8)) +
    path('M20 33L18 31L16 33L18 37L22 35Z', K.goldD, o()) +
    path('M42 33L26 9L23 11L39 35Z', K.silver, o()) +
    path('M26 9L23 7L21 9.5L23 11Z', c, o(0.8)) +
    path('M42 33L44 31L46 33L44 37L40 35Z', K.goldD, o()) +
    lit('M22 31L36 10', 0.5) +
    circ(31, 22, 6, c, op(0.2)),

  // Drama: a flame with a hot core.
  flame: (c) =>
    ground(11) +
    aura(24, 26, 17, '#ff7a3d') +
    path('M24 4C27 13 38 17 38 30A14 14 0 0 1 10 30C10 22 15 18 17 14C18 20 20 22 23 23C20 15 22 9 24 4Z', '#ff6b3d', o()) +
    path('M24 20C26 26 32 28 32 34A8 8 0 0 1 16 34C16 30 19 27 21 25C21.5 28 23 29 24.5 29C23 26 23 23 24 20Z', '#ffd166') +
    shade('M30 16C35 21 38 25 38 30A14 14 0 0 1 28 43.5C33 38 34 29 30 16Z', 0.18) +
    circ(24, 36, 3, '#fff6c7', op(0.8)) +
    twinkle(40, 10, 2.4, c),

  // A PR shield with a tick.
  shield: (c) =>
    ground(12) +
    aura(24, 22, 17, c) +
    path('M24 4L40 10V22C40 32 33 39 24 43C15 39 8 32 8 22V10Z', K.silver, o()) +
    path('M24 8L36 12.5V22C36 30 31 35.5 24 38.8C17 35.5 12 30 12 22V12.5Z', c, o(0.8)) +
    shade('M24 4L40 10V22C40 32 33 39 24 43Z', 0.2) +
    lit('M12 13L20 9.6', 0.5) +
    path('M17 23L22 28L31 17', 'none', `${stroke('#fff', 3.2)} stroke-linecap="round" stroke-linejoin="round"`),

  // A signed sponsor contract under a fountain pen.
  handshake: (c) =>
    ground(16) +
    path('M9 5H31L38 12V43H9Z', K.white, o()) +
    path('M31 5V12H38', K.greyL, o()) +
    shade('M30 12H38V43H30Z', 0.08) +
    rr(13, 10, 12, 4, 1, c) +
    line('M13 19H33M13 23.5H33M13 28H28', K.greyL, 1.6) +
    line('M14 37Q17 33 19 36T24 36', '#1d2347', 1.6) +
    circ(31, 36, 4.4, K.red, o()) +
    circ(31, 36, 2.2, '#ff8a8e', op(0.7)) +
    path('M36 32L45 11L47.5 12L39 33Z', '#1d2347', o()) +
    path('M45 11L46 7.5L48.5 9L47.5 12Z', K.gold, o(0.8)),

  // A fancam: a handheld camera recording, red light on.
  video: (c) =>
    ground(16) +
    aura(22, 24, 17, c) +
    rr(5, 14, 28, 22, 3, K.black2, o()) +
    shade('M24 14H30Q33 14 33 17V33Q33 36 30 36H24Z', 0.3) +
    lit('M7 16H20V18H7Z', 0.2) +
    path('M33 20L43 14V36L33 30Z', K.black3, o()) +
    circ(17, 25, 7, K.black3, o()) +
    circ(17, 25, 4.6, c, o(0.8)) +
    circ(15.4, 23.4, 1.4, '#fff', op(0.7)) +
    circ(9.5, 18.5, 1.8, K.red) +
    circ(9.5, 18.5, 3.2, K.red, op(0.3)) +
    rr(10, 36, 4, 7, 1, K.black3, o()),

  // A team jersey in the tier colour.
  shirt: (c) =>
    ground(16) +
    path('M16 6L8 10L4 20L10 23L12 19V42H36V19L38 23L44 20L40 10L32 6Q28 11 24 11Q20 11 16 6Z', c, o()) +
    shade('M28 9Q31 7 32 6L40 10L44 20L38 23L36 19V42H28Z', 0.25) +
    lit('M13 12L10 20.5', 0.4) +
    path('M18.5 6.8Q21 10 24 10Q27 10 29.5 6.8', 'none', `${stroke(K.white, 1.6)}`) +
    rect(12, 26, 24, 3, K.white, op(0.8)) +
    circ(24, 18.5, 3.4, K.white, o(0.6)),
};

/** A staff member's lanyard ID card, striped in the tier colour; the role icon sits in the corner badge. */
const staffBadge: Art = (c) =>
  ground(14) +
  line('M17 3L22 13M31 3L26 13', c, 2.4) +
  rr(20, 11, 8, 5, 1.4, K.silverD, o()) +
  rr(9, 15, 30, 28, 3, K.white, o()) +
  shade('M30 15H36Q39 15 39 18V40Q39 43 36 43H30Z', 0.12) +
  rr(9, 15, 30, 7, 3, c, o()) +
  rect(9.5, 19, 29, 3, c) +
  circ(18, 30, 4.6, '#e8b893', o()) +
  path('M11.5 40Q12 35 18 35Q24 35 24.5 40Z', K.black3, o(0.8)) +
  line('M27 28H35M27 32H33M27 36H35', K.greyL, 1.4);

/** Upgrade groups that should always use the ID-card picture, whatever their icon. */
const STAFF_ICONS = new Set(['clipboard-list', 'chef-hat', 'binoculars', 'stethoscope', 'chart-network', 'share-2', 'brain-circuit', 'calendar-clock', 'bot', 'palette']);

const cache = new Map<string, string | null>();

/**
 * The drawing for an upgrade's icon, or null when there isn't one (the store then falls back to the
 * plain icon). Staff role icons get the ID card.
 */
export function upgradeIconSvg(icon: string, group: string, c: string): string | null {
  const key = `${icon}|${group}|${c}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const draw = group === 'staff' && STAFF_ICONS.has(icon) ? staffBadge : group === 'staff' && icon === 'handshake' ? staffBadge : ART[icon];
  const svg = draw ? `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${draw(c)}</svg>` : null;
  cache.set(key, svg);
  return svg;
}

export const UPGRADE_ART_ICONS = Object.keys(ART);
