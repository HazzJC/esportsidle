import { K, circ, ell, line, op, path, rect, rr, stroke } from './artKit';

/**
 * Knock-off crests for the rival esports orgs. The best-known names get a drawing that sends up the
 * real org's mark (a vinegar bottle in black and yellow, a clam for Faze Clam, a goose for Evil
 * Geese); everyone else gets a monogram crest whose shape and colours come from the name, so the
 * same org always wears the same badge. Output is built from constants and the org's initials only,
 * so it is safe to render with {@html}.
 */
type Crest = { bg: string; draw: () => string };

const ink = '#0f1117';
const white = '#f4f5f7';

const BESPOKE: Record<string, Crest> = {
  // Black and yellow, like the real thing, but a bottle.
  'Natus Vinegar': {
    bg: '#15130a',
    draw: () => rr(19, 16, 10, 24, 3, '#ffd23f') + rect(21.5, 9, 5, 8, '#ffd23f') + rect(20.5, 7, 7, 3, ink) + rect(19, 24, 10, 7, ink) + line('M21 27.5H27', '#ffd23f', 1.4),
  },
  // A droplet on sale.
  'Team Liquidated': {
    bg: '#0b1630',
    draw: () => path('M24 7Q34 22 34 29A10 10 0 0 1 14 29Q14 22 24 7Z', '#3b82f6') + path('M18 27A6 6 0 0 0 22 35', 'none', stroke(white, 1.6) + ' ' + op(0.7)) + rr(27, 30, 14, 9, 2, '#ff4d6d') + `<text x="34" y="37" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="7" fill="${white}">%</text>`,
  },
  // A cloud that says no.
  'Cloud Nein': {
    bg: '#0b1e2e',
    draw: () => path('M12 32A7 7 0 0 1 14 18A9 9 0 0 1 31 16A7 7 0 0 1 37 31Z', '#7cc4ff') + circ(24, 26, 7, 'none', stroke('#ff4d6d', 2.4)) + line('M19 31L29 21', '#ff4d6d', 2.4),
  },
  // An orange F with desk-fan blades.
  Fanatik: {
    bg: '#1c1106',
    draw: () => path('M13 10H33V16H20V22H30V28H20V39H13Z', '#ff7a1a') + circ(35, 32, 7, 'none', stroke('#ff7a1a', 1.4)) + path('M35 32L35 26Q39 28 35 32L41 32Q39 36 35 32L35 38Q31 36 35 32L29 32Q31 28 35 32Z', '#ffb36b'),
  },
  // A samurai helmet with one horn too many.
  'G3 Esports': {
    bg: '#1a0b0b',
    draw: () => path('M12 30Q12 16 24 16Q36 16 36 30Z', '#e5403f') + path('M10 30H38L34 36H14Z', '#b52b2b') + path('M24 16L14 6L20 16M24 16L34 6L28 16M24 16V5', 'none', stroke(K.gold, 2.2)),
  },
  // A burglar's mask.
  '99 Burglars': {
    bg: '#1a0a0a',
    draw: () => path('M7 20Q24 12 41 20L39 29Q24 25 9 29Z', '#d91f2d') + ell(17, 22.5, 4, 2.6, ink) + ell(31, 22.5, 4, 2.6, ink) + `<text x="24" y="40" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="9" fill="${white}">99</text>`,
  },
  // A goose with an evil eyebrow.
  'Evil Geese': {
    bg: '#0d1224',
    draw: () => path('M16 40Q12 26 20 18Q22 10 29 11Q34 12 34 17L40 19L34 21Q31 24 27 23Q24 30 26 40Z', white) + circ(29, 15.5, 1.5, ink) + line('M26.5 12.5L31 14', ink, 1.3) + path('M34 17L40 19L34 21Z', '#ffb03d'),
  },
  // A clam shell.
  'Faze Clam': {
    bg: '#1a0808',
    draw: () => path('M8 30Q8 12 24 12Q40 12 40 30Z', '#e5403f') + line('M24 30V13M24 30L15 15M24 30L33 15M24 30L10 22M24 30L38 22', '#8f1c1c', 1.4) + rr(18, 30, 12, 5, 1.5, '#b52b2b') + circ(24, 30, 2.5, white),
  },
  // A null sign with wings.
  Sentinull: {
    bg: '#1a0a0e',
    draw: () => circ(24, 24, 8, 'none', stroke('#ff4d6d', 3)) + line('M17 33L31 15', '#ff4d6d', 3) + path('M14 22L3 16L6 23L3 29L14 26Z', white, op(0.9)) + path('M34 22L45 16L42 23L45 29L34 26Z', white, op(0.9)),
  },
  // A green feather.
  'OpTickle Gaming': {
    bg: '#0b170b',
    draw: () => circ(24, 24, 16, 'none', stroke('#5bd65b', 2.2)) + path('M14 36Q16 18 34 12Q30 28 14 36Z', '#5bd65b') + line('M14 36L30 16', '#1d5a1d', 1.2),
  },
  // A thought bubble with a single thought.
  'Team Solo Minded': {
    bg: '#101216',
    draw: () => path('M11 24A9 8 0 0 1 20 14A9 8 0 0 1 35 16A8 8 0 0 1 35 30H16A7 7 0 0 1 11 24Z', white) + circ(14, 36, 2.5, white) + circ(9, 41, 1.5, white) + circ(24, 22, 2.4, ink),
  },
  // A gold G with a tick.
  'Gen.Gee': {
    bg: '#15120a',
    draw: () => path('M33 15A12 12 0 1 0 35 29H24', 'none', stroke(K.gold, 4.5) + ' stroke-linecap="round"') + line('M27 24L31 28L40 17', white, 2.4),
  },
  // A juice box with a bee on the straw.
  'Vitality Juice': {
    bg: '#15130a',
    draw: () => path('M15 14H33V40H15Z', '#ffd23f') + path('M15 14L19 9H29L33 14Z', '#ffe98a') + rect(15, 22, 18, 9, ink) + line('M28 9L31 3', white, 1.6) + ell(33, 5, 3, 2, '#ffd23f') + line('M32 4V6M34 4V6', ink, 0.9),
  },
  // A paper T-rex head.
  'Paper Rexes': {
    bg: '#16110e',
    draw: () => path('M9 30L18 12L38 16L40 26L28 26L30 32L20 34Z', white) + path('M18 12L26 22L38 16Z', '#d7dbe2') + circ(30, 19, 1.8, ink) + path('M28 26L30 32L33 26Z', '#ff4d6d'),
  },
  // A ninja mask under a nightcap.
  'Ninjas in Pyjamas': {
    bg: '#10111a',
    draw: () => circ(24, 27, 13, ink) + rr(12, 23, 24, 7, 3, '#f1d5b0') + ell(19, 26.5, 2, 1.2, ink) + ell(29, 26.5, 2, 1.2, ink) + path('M11 20Q24 4 39 12L37 20Z', '#5b8cff') + circ(40, 12, 3, white),
  },
  // A stalk of wheat, in blue.
  'Karmine Crop': {
    bg: '#0a1024',
    draw: () => line('M24 42V12', '#4a7dff', 2) + [14, 20, 26, 32].map((y) => ell(20.5, y, 3, 5, '#4a7dff', `transform="rotate(-30 20.5 ${y})"`) + ell(27.5, y, 3, 5, '#4a7dff', `transform="rotate(30 27.5 ${y})"`)).join('') + ell(24, 9, 2.5, 4.5, '#4a7dff'),
  },
  // A triangle made of stars.
  'Astral Hosts': {
    bg: '#0e0a1a',
    draw: () => path('M24 8L40 38H8Z', 'none', stroke('#e5403f', 2.6)) + path('M24 20L26 25H31L27 28L28.5 33L24 30L19.5 33L21 28L17 25H22Z', white),
  },
  // A spirit level.
  'Team Spirit Level': {
    bg: '#101216',
    draw: () => rr(6, 19, 36, 11, 3, '#c9c4b5') + rr(17, 21.5, 14, 6, 3, '#9dff3b', op(0.8)) + circ(24, 24.5, 2, white) + line('M20.5 21.5V27.5M27.5 21.5V27.5', ink, 1),
  },
  // A wolf with a dollar for an eye.
  'Wolves of Wall Street': {
    bg: '#0b1410',
    draw: () => path('M10 12L18 20H30L38 12L36 28L24 40L12 28Z', '#9aa3ad') + path('M24 40L19 31H29Z', ink) + `<text x="19" y="28" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="7" fill="#4caf6a">$</text><text x="29" y="28" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="7" fill="#4caf6a">$</text>`,
  },
  // A shield with a scroll of good deeds.
  'Heroic Deeds': {
    bg: '#0a1016',
    draw: () => path('M24 7L38 12V24Q38 35 24 41Q10 35 10 24V12Z', '#1d6fb8') + rr(15, 19, 18, 10, 2, '#f1e3c0') + line('M18 22.5H30M18 25.5H27', '#8a7650', 1),
  },
};

/** Colours for the generated crests. */
const PALETTE = ['#ff4d6d', '#3fb6ff', '#ffc83d', '#8b5cff', '#9dff3b', '#22e4ff', '#ff8a3d', '#ff2bd6', '#3dff9a', '#e5e7eb', '#f97316', '#60a5fa'];

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Up to two initials from the org's name, skipping filler words. */
export function orgInitials(name: string): string {
  const words = name.split(/[\s.&]+/).filter((w) => w && !/^(of|the|in|and|esports|gaming|team)$/i.test(w));
  const letters = (words.length >= 2 ? words[0][0] + words[1][0] : (words[0] ?? name).slice(0, 2)).toUpperCase();
  return letters.replace(/[^A-Z0-9]/g, '') || '?';
}

/** A shield, circle, hexagon or diamond, in two colours from the name, with its initials. */
function generated(name: string): Crest {
  const h = hash(name);
  const main = PALETTE[h % PALETTE.length];
  const trim = PALETTE[(h >>> 8) % PALETTE.length] === main ? white : PALETTE[(h >>> 8) % PALETTE.length];
  const shape = (h >>> 16) % 4;
  const outline =
    shape === 0
      ? 'M24 6L39 11V23Q39 35 24 42Q9 35 9 23V11Z'
      : shape === 1
        ? 'M24 6A18 18 0 1 1 23.99 6Z'
        : shape === 2
          ? 'M24 5L40 14V34L24 43L8 34V14Z'
          : 'M24 5L43 24L24 43L5 24Z';
  const stripe = (h >>> 20) % 2 === 0 ? rect(9, 28, 30, 4, trim, op(0.85)) : line('M12 12L36 36', trim, 3, op(0.5));
  const text = orgInitials(name);
  return {
    bg: '#0f1117',
    draw: () =>
      path(outline, main) +
      `<clipPath id="c${h}"><path d="${outline}"/></clipPath><g clip-path="url(#c${h})">${stripe}</g>` +
      path(outline, 'none', stroke(trim, 1.6)) +
      `<text x="24" y="${text.length > 1 ? 26.5 : 28}" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="${text.length > 1 ? 13 : 16}" fill="${ink}">${text}</text>`,
  };
}

/** A rival org's crest as a square SVG. */
export function orgLogoSvg(name: string): string {
  const crest = BESPOKE[name] ?? generated(name);
  return `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${rr(1, 1, 46, 46, 11, crest.bg)}${crest.draw()}</svg>`;
}

export const ORG_LOGO_NAMES = Object.keys(BESPOKE);
