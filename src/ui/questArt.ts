import { QUESTS, QUEST_TOOLS, type QuestDef, type QuestReward } from '../data/quests';
import { K, circ, grid, line, op, path, rect, rr, stroke } from './artKit';
import { opSpriteSvg } from './opsArt';
import { rarityColor } from './theme';
import { upgradeIconSvg } from './upgradeArt';

/**
 * Emblems for the quest line: the picture a quest shows on the HQ console, on its reward keys, and on
 * the perk card it leaves behind. Same style as the store's upgrade art (a 48x48 grid lit from the top
 * left, ink outlines, a lit and a shaded face, a ground shadow, a glow in `c`).
 *
 * A quest names its picture in `QuestDef.art`: `op:<operation>`, `upgrade:<icon>`,
 * `staff`, or one of the drawings below. Built from constants and colours only, so the markup is safe
 * to render with {@html}.
 */
type Art = (c: string) => string;

const ink = K.ink;
const o = (w = 1) => `${stroke(ink, w)} stroke-linejoin="round"`;
const ground = (rx = 15) => `<ellipse cx="24" cy="44.6" rx="${rx}" ry="2.4" fill="#000" ${op(0.38)}/>`;
const lit = (d: string, a = 0.25) => path(d, '#ffffff', op(a));
const shade = (d: string, a = 0.25) => path(d, '#000000', op(a));
const aura = (cx: number, cy: number, r: number, c: string) => circ(cx, cy, r, c, op(0.16));
const twinkle = (x: number, y: number, s: number, fill = '#fff') =>
  path(`M${x} ${y - s}L${x + s * 0.3} ${y - s * 0.3}L${x + s} ${y}L${x + s * 0.3} ${y + s * 0.3}L${x} ${y + s}L${x - s * 0.3} ${y + s * 0.3}L${x - s} ${y}L${x - s * 0.3} ${y - s * 0.3}Z`, fill);
const shine = (d: string, w = 1.6, a = 0.7) => path(d, 'none', `${stroke('#fff', w)} stroke-linecap="round" ${op(a)}`);
const dollar = (x: number, y: number, s: number, col: string, w = 1.2) =>
  line(`M${x + s * 0.55} ${y - s * 0.5}Q${x} ${y - s * 0.9} ${x - s * 0.5} ${y - s * 0.45}Q${x - s * 0.8} ${y} ${x} ${y + s * 0.05}Q${x + s * 0.8} ${y + s * 0.15} ${x + s * 0.45} ${y + s * 0.55}Q${x} ${y + s * 0.9} ${x - s * 0.6} ${y + s * 0.5}M${x} ${y - s * 1.1}V${y + s * 1.1}`, col, w);

const ART: Record<string, Art> = {
  // A pro headset with an upgrade arrow: the first gear bought.
  'gear-up': (c) =>
    ground(15) +
    aura(24, 24, 18, c) +
    path('M9 27V22a15 15 0 0 1 30 0V27', 'none', o(5)) +
    path('M9 27V22a15 15 0 0 1 30 0V27', 'none', stroke(K.silver, 3)) +
    shine('M12.5 17A12 12 0 0 1 20 10.2', 1.2, 0.6) +
    rr(5, 24, 10, 15, 4, K.black2, o()) +
    rr(33, 24, 10, 15, 4, K.black2, o()) +
    rr(8, 26, 6, 11, 2.6, c, o(0.8)) +
    rr(34, 26, 6, 11, 2.6, c, o(0.8)) +
    lit('M6 26H8V37H6Z', 0.18) +
    line('M10 38Q11 43 19 42', K.black3, 1.8) +
    circ(20, 42, 1.8, c) +
    circ(36, 12, 7, K.green, o()) +
    path('M36 7.5L40 12H37.6V16H34.4V12H32Z', K.white),

  // The patch notes: a page with a version banner and bullet points, still sparkling.
  'patch-notes': (c) =>
    ground(14) +
    aura(24, 24, 18, c) +
    path('M11 6H33L39 12V42H11Z', K.white, o()) +
    path('M33 6V12H39', K.greyL, o()) +
    shade('M30 12H39V42H30Z', 0.08) +
    rr(15, 10, 14, 5, 1.2, c, o(0.8)) +
    circ(17, 21, 1.7, c) +
    line('M21 21H34', K.greyD, 1.6) +
    circ(17, 27, 1.7, c) +
    line('M21 27H32', K.greyD, 1.6) +
    circ(17, 33, 1.7, c) +
    line('M21 33H29', K.greyD, 1.6) +
    twinkle(40, 34, 4.6, K.goldL) +
    twinkle(7, 9, 2.8, K.goldL),

  // A tactics board on a clipboard: crosses, a circle and the planned run.
  clipboard: (c) =>
    ground(14) +
    rr(9, 7, 30, 36, 3, '#8b5a34', o()) +
    shade('M30 7H36Q39 7 39 10V40Q39 43 36 43H30Z', 0.25) +
    rr(13, 12, 22, 27, 1.4, K.white, o(0.8)) +
    rr(18, 4, 12, 7, 2, K.silverD, o()) +
    lit('M19 5H29V6.4H19Z', 0.5) +
    line('M17 18L21 22M21 18L17 22', K.red, 1.8) +
    line('M17 27L20 30M20 27L17 30', K.red, 1.6) +
    circ(30, 33, 3, 'none', stroke(c, 1.8)) +
    line('M21 22Q23 32 26 32.5', c, 1.5, 'stroke-dasharray="2 1.6"') +
    path('M25 30L28 33L24.6 35Z', c),

  // Two pennants: the org's own flying in front, the new team's behind it.
  pennant: (c) =>
    ground(12) +
    aura(26, 17, 17, c) +
    rect(31, 9, 2, 34, K.greyD, o(0.8)) +
    path('M33 10L44 15L33 20Z', K.greyL, o()) +
    shade('M33 15H44L33 20Z', 0.2) +
    rect(13, 5, 2.6, 38, K.silverD, o()) +
    circ(14.3, 4.6, 2.3, K.gold, o()) +
    path('M15.6 7L38 16L15.6 25Z', c, o()) +
    shade('M15.6 16H38L15.6 25Z', 0.22) +
    lit('M15.6 7L30 12.8L15.6 10.5Z', 0.35) +
    circ(22.5, 16, 2.6, K.white, o(0.6)),

  // A podium with an arrow rising off the top step.
  podium: (c) =>
    ground(20) +
    aura(24, 13, 13, c) +
    rr(5, 31, 13, 12, 1.2, K.silver, o()) +
    rr(30, 35, 13, 8, 1.2, K.copper, o()) +
    rr(17, 24, 14, 19, 1.2, K.gold, o()) +
    shade('M26 24H31V43H26Z', 0.18) +
    shade('M14 31H18V43H14Z', 0.18) +
    shade('M39 35H43V43H39Z', 0.18) +
    lit('M18 25H30V26.4H18Z', 0.45) +
    rr(21.5, 30, 5, 2.4, 0.6, K.goldD) +
    path('M24 2L33 11H28.5V19H19.5V11H15Z', c, o()) +
    lit('M24 4.6L19 9.5H21V18H22.4V9.5Z', 0.4),

  // The gaming house: a monitor glowing in the window, a chimney, a front door.
  house: (c) =>
    ground(17) +
    aura(24, 24, 18, c) +
    rect(30, 8, 5, 9, '#7d5535', o()) +
    rect(10, 20, 28, 22, K.beige, o()) +
    shade('M28 20H38V42H28Z', 0.16) +
    path('M5 22L24 6L43 22Z', '#a83a3a', o()) +
    shade('M24 6L43 22H24Z', 0.22) +
    lit('M8 21L24 8V10.6L10.6 21Z', 0.3) +
    rr(14, 25, 10, 8, 1, ink, o()) +
    rr(15.2, 26.2, 7.6, 5.6, 0.6, c) +
    circ(19, 29, 6, c, op(0.25)) +
    rr(28, 28, 7, 14, 1, '#7d5535', o()) +
    circ(33.2, 35.5, 0.9, K.gold),

  // A shopping bag with the org's star on it.
  'merch-bag': (c) =>
    ground(15) +
    aura(24, 26, 18, c) +
    path('M18 15V11a6 6 0 0 1 12 0V15', 'none', o(3.6)) +
    path('M18 15V11a6 6 0 0 1 12 0V15', 'none', stroke(K.greyL, 1.8)) +
    path('M9 15H39L41 43H7Z', c, o()) +
    shade('M30 15H39L41 43H31Z', 0.25) +
    lit('M10 16H22V18H10Z', 0.3) +
    circ(24, 29, 6.4, K.white, o(0.8)) +
    twinkle(24, 29, 4, c),

  // Binoculars over a prospect's card: scouting the transfer market.
  scout: (c) =>
    ground(16) +
    aura(24, 22, 18, c) +
    rr(8, 6, 22, 30, 2.4, K.white, o()) +
    rr(8, 6, 22, 6, 2.4, c, o()) +
    rect(8.5, 10, 21, 2, c) +
    circ(19, 19, 4.4, '#e8b893', o(0.8)) +
    path('M12 32Q12.5 25 19 25Q25.5 25 26 32Z', K.black3, o(0.8)) +
    rr(22, 26, 9, 14, 3.5, K.black2, o()) +
    rr(33, 26, 9, 14, 3.5, K.black2, o()) +
    rect(29, 29, 6, 5, K.black3, o(0.8)) +
    circ(26.5, 37, 4.2, K.ink, o()) +
    circ(37.5, 37, 4.2, K.ink, o()) +
    circ(26.5, 37, 2.8, c, op(0.85)) +
    circ(37.5, 37, 2.8, c, op(0.85)) +
    shine('M25 35.6A2 2 0 0 1 27 35', 1, 0.8) +
    shine('M36 35.6A2 2 0 0 1 38 35', 1, 0.8),

  // A winner's medal on a ribbon.
  medal: (c) =>
    ground(12) +
    aura(24, 30, 16, c) +
    path('M13 3H21L27 20H19Z', c, o()) +
    path('M35 3H27L21 20H29Z', c, o()) +
    shade('M35 3H27L21 20H29Z', 0.28) +
    circ(24, 30.4, 12, K.goldD, o()) +
    circ(24, 29.8, 10.6, K.gold) +
    circ(24, 29.8, 7.6, 'none', stroke(K.goldD, 1.2)) +
    path('M24 23.8L25.8 27.5L29.8 28L26.9 30.8L27.6 34.8L24 32.9L20.4 34.8L21.1 30.8L18.2 28L22.2 27.5Z', K.goldL, o(0.6)) +
    shine('M15.6 26A9.6 9.6 0 0 1 20 20.8'),

  // A player card sold on, with a price tag hanging off it.
  sold: (c) =>
    ground(17) +
    rr(5, 5, 24, 32, 2.4, K.white, o()) +
    shade('M23 5H26.6Q29 5 29 7.4V34.6Q29 37 26.6 37H23Z', 0.1) +
    rr(5, 5, 24, 6, 2.4, c, o()) +
    rect(5.5, 9, 23, 2, c) +
    circ(17, 18.5, 4.6, '#e8b893', o(0.8)) +
    path('M9.5 32Q10 24 17 24Q24 24 24.5 32Z', K.black3, o(0.8)) +
    line('M28 20Q35 17 36 24', K.greyD, 1.2) +
    path('M28 25H40L45 32.5L40 40H28Z', K.gold, o()) +
    shade('M28 33H45L40 40H28Z', 0.16) +
    circ(41, 32.5, 1.5, ink) +
    dollar(33.5, 32.5, 3.4, ink),

  // Three towers of the org's empire, windows lit.
  skyline: (c) =>
    ground(19) +
    aura(24, 22, 19, c) +
    rr(5, 20, 12, 23, 1, K.black2, o()) +
    rr(31, 14, 12, 29, 1, K.black2, o()) +
    rect(23, 1.5, 1.5, 6, K.greyL) +
    rr(16, 6.5, 16, 36.5, 1, K.black3, o()) +
    lit('M17 7.5H21V42H17Z', 0.08) +
    shade('M27 7.5H31V42H27Z', 0.25) +
    grid(19, 10, 3, 8, 2.6, 2.4, 1.6, c) +
    grid(8, 24, 2, 4, 2.4, 2.4, 2, c, op(0.7)) +
    grid(34, 18, 2, 6, 2.4, 2.4, 1.8, c, op(0.7)) +
    circ(23.75, 1.5, 1.2, K.red),

  // A bullseye with a dart in the middle.
  target: (c) =>
    ground(15) +
    circ(22, 26, 16, K.white, o()) +
    circ(22, 26, 12, K.red) +
    circ(22, 26, 8, K.white) +
    circ(22, 26, 4, K.red) +
    shade('M22 10A16 16 0 0 1 22 42Z', 0.12) +
    shine('M10.5 20A12.5 12.5 0 0 1 16 13.5', 1.6, 0.6) +
    line('M22 26L39 9', ink, 3.4) +
    line('M22 26L39 9', K.greyL, 1.6) +
    path('M36 6L43.5 3.5L41.5 11.5L39 9Z', c, o()) +
    path('M38 11.5L45 10L42 15Z', c, o(0.8)),

  // The crown for the big exit.
  crown: (c) =>
    ground(15) +
    aura(24, 24, 18, c) +
    path('M6 15L15 25L24 9L33 25L42 15L38.5 37H9.5Z', K.gold, o()) +
    shade('M24 9L33 25L42 15L38.5 37H24Z', 0.18) +
    lit('M8.5 19L13.5 33H11.5Z', 0.45) +
    rr(8.5, 34, 31, 7, 1.4, K.goldD, o()) +
    lit('M9 34.5H39V35.8H9Z', 0.3) +
    circ(6, 14, 2.6, K.goldL, o()) +
    circ(24, 8, 2.8, K.goldL, o()) +
    circ(42, 14, 2.6, K.goldL, o()) +
    circ(16, 29.5, 2.2, c, o(0.8)) +
    circ(24, 28.5, 2.8, K.red, o(0.8)) +
    circ(32, 29.5, 2.2, c, o(0.8)),

  // Rank chevrons with a plus: levels for the whole roster.
  'level-up': (c) =>
    ground(13) +
    aura(24, 24, 18, c) +
    path('M24 4L40 10V26C40 35 33 40 24 44C15 40 8 35 8 26V10Z', K.black2, o()) +
    shade('M24 4L40 10V26C40 35 33 40 24 44Z', 0.2) +
    path('M14 30L24 23L34 30V35L24 28L14 35Z', K.gold, o()) +
    path('M14 21L24 14L34 21V26L24 19L14 26Z', K.gold, o()) +
    lit('M14 21L24 14V16L14 23Z', 0.4) +
    circ(37, 9, 6.4, c, o()) +
    line('M37 5.8V12.2M33.8 9H40.2', K.white, 2),

  // A wad of notes and a coin: cash paid now.
  cash: (c) =>
    ground(17) +
    aura(24, 24, 18, c) +
    rr(5, 23, 31, 15, 2, '#357a4d', o()) +
    rr(9, 16, 31, 15, 2, '#4caf6a', o()) +
    rr(12, 19, 25, 9, 1.4, 'none', stroke('#2c6e45', 1)) +
    circ(24.5, 23.5, 3.8, '#2c6e45') +
    dollar(24.5, 23.5, 2.6, '#c7f0d2', 1) +
    lit('M10 17H26V18.4H10Z', 0.3) +
    circ(36, 36, 7.6, K.goldD, o()) +
    circ(36, 35.4, 6.4, K.gold) +
    circ(36, 35.4, 4.2, 'none', stroke(K.goldD, 1)) +
    shine('M31.4 33.4A5 5 0 0 1 34 30.6', 1.3),

  // A paint palette: a cosmetic for the org's look.
  palette: (c) =>
    ground(16) +
    path('M24 6C12 6 5 14 5 23C5 32 12 40 22 40C26 40 27 37 25.5 34.5C24 32 25.5 29.5 28.5 29.5H34C39 29.5 43 26 43 21C43 12 34 6 24 6Z', '#d9b98a', o()) +
    shade('M34 8C40 11 43 16 43 21C43 26 39 29.5 34 29.5H30C36 27 39 18 34 8Z', 0.18) +
    circ(15, 17, 3.2, K.red, o()) +
    circ(24, 12.5, 3.2, c, o()) +
    circ(33, 15.5, 3.2, '#4f9dff', o()) +
    circ(12.5, 27, 3.2, '#4caf6a', o()) +
    line('M31 44L41 31', '#7d5535', 3) +
    path('M40 32L44 26L45 31Z', c, o(0.8)),
};

const cache = new Map<string, string>();
const wrap = (inner: string) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${inner}</svg>`;

/** The drawing an art key names, in colour `c`, or null when the key names nothing. */
export function questArtSvg(art: string, c: string): string | null {
  const key = `${art}|${c}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const [kind, id] = art.split(':');
  const svg =
    kind === 'op' ? opSpriteSvg(id, c)
    : kind === 'upgrade' ? upgradeIconSvg(id, '', c)
    : kind === 'staff' ? upgradeIconSvg('clipboard-list', 'staff', c)
    : ART[art] ? wrap(ART[art](c))
    : null;
  if (svg) cache.set(key, svg);
  return svg;
}

/** Quests further along the line glow in rarer colours, like trophies higher up the shelf. */
export function questColor(id: string): string {
  const i = Math.max(0, QUESTS.findIndex((q) => q.id === id));
  return rarityColor(1 + Math.floor((i * 4) / QUESTS.length));
}

/** The quest's emblem. */
export function questEmblemSvg(def: QuestDef): string {
  return questArtSvg(def.art, questColor(def.id)) ?? '';
}

/** What a reward key shows: a perk shows its quest's emblem, so the key matches the perk card it leaves. */
const REWARD_ART: Record<Exclude<QuestReward['kind'], 'perk' | 'tool' | 'opAffinity'>, string> = {
  cash: 'cash',
  fans: 'upgrade:heart',
  trophies: 'upgrade:trophy',
  levels: 'level-up',
  legacy: 'crown',
  cosmetic: 'palette',
  title: 'medal',
};

export function rewardArtSvg(r: QuestReward, def: QuestDef): string {
  const c = questColor(def.id);
  if (r.kind === 'perk') return questEmblemSvg(def);
  if (r.kind === 'opAffinity') return opSpriteSvg(r.op, c);
  const art = r.kind === 'tool' ? (ART[QUEST_TOOLS[r.id].icon] ? QUEST_TOOLS[r.id].icon : `upgrade:${QUEST_TOOLS[r.id].icon}`) : REWARD_ART[r.kind];
  return questArtSvg(art, c) ?? '';
}
