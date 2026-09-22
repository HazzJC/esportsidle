import { circ, ell, line, op, path, rect, rr, stroke } from './artKit';
import { roundedRect, withDepth } from './logoDepth';

/**
 * Parody logos for the sponsor brands, on a 48x48 badge. Each one riffs on the shape of the logo
 * it sends up — a swoosh, three stripes, claw marks, overlapping circles — in the brand's colour,
 * without copying anyone's actual mark. Colours come from the brand data, so the output is safe to
 * render with {@html}.
 */
type Logo = (c: string) => string;

const ink = '#0f1117';
const white = '#f4f5f7';

/** The badge every logo sits on. */
const badge = (c: string) => rr(2, 2, 44, 44, 11, ink) + rr(2, 2, 44, 44, 11, 'none', stroke(c, 1.4) + ' ' + op(0.55));

const LOGOS: Record<string, Logo> = {
  // Three claw marks, a little like an M.
  monstar: (c) => line('M13 12Q15 24 12 36M22 10Q24 24 21 38M31 12Q33 24 30 36', c, 4.2),
  // Two charging bullets and a sun.
  redbullet: (c) => circ(24, 22, 8, '#ffc83d') + path('M6 32L20 26L20 31L6 34Z', c) + path('M42 32L28 26L28 31L42 34Z', c),
  // A G with a lightning bolt through it.
  gfuelish: (c) => path('M33 16A11 11 0 1 0 34 28H25', 'none', stroke(c, 4.5) + ' stroke-linecap="round"') + path('M26 10L20 25H26L22 38L32 21H26L30 10Z', white),
  // Three curling tails in a triangle.
  razr: (c) => line('M24 10Q17 18 22 24M36 32Q27 34 24 26M12 32Q16 23 24 26', c, 3.6),
  // A rounded G mark.
  logitechno: (c) => path('M30 15A10 10 0 1 0 31 29H24', 'none', stroke(c, 5) + ' stroke-linecap="round"'),
  // An X with wings.
  hyperx: (c) => line('M17 16L31 32M31 16L17 32', c, 4.2) + path('M16 24L6 19L9 24L6 29Z', c, op(0.8)) + path('M32 24L42 19L39 24L42 29Z', c, op(0.8)),
  // A cog.
  steelseriesly: (c) =>
    circ(24, 24, 10, 'none', stroke(c, 4)) +
    Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI) / 4;
      return rect(24 + Math.cos(a) * 14 - 2.5, 24 + Math.sin(a) * 14 - 2.5, 5, 5, c);
    }).join('') +
    circ(24, 24, 4, c),
  // A single ridged crisp.
  crunchy: (c) => path('M12 30Q14 14 26 12Q38 14 36 28Q26 38 12 30Z', c) + line('M17 26Q24 22 31 24M16 21Q23 17 30 19', ink, 1.4, op(0.4)),
  // A triangle chip.
  doritoes: (c) => path('M24 9L39 36H9Z', c) + circ(19, 28, 1.5, ink, op(0.35)) + circ(27, 22, 1.5, ink, op(0.35)) + circ(29, 31, 1.5, ink, op(0.35)),
  // A nacho with a cheese drip.
  nacho: (c) => path('M11 13L37 17L22 38Z', c) + path('M13 14Q24 18 36 17Q34 22 30 21Q29 26 26 24Q22 21 18 22Q15 19 13 14Z', '#ffe066'),
  // A tick over a wordmark bar.
  verizoom: (c) => line('M14 24L21 31L35 15', c, 5) + rect(12, 36, 24, 3, white, op(0.8)),
  // A T sending signal arcs.
  teleping: (c) => rect(22, 18, 4, 18, white) + rect(16, 16, 16, 4, white) + line('M30 10Q36 14 34 20M34 6Q42 13 38 23', c, 2.4),
  // Three strands of fibre wrapping a ring.
  fibre: (c) => circ(24, 24, 11, 'none', stroke(c, 2.4)) + line('M8 30Q24 10 40 18M8 24Q24 38 40 30', white, 1.6, op(0.8)),
  // A coin with a struck-through B.
  blockcoin: (c) => circ(24, 24, 15, c) + circ(24, 24, 12, 'none', stroke(ink, 1.2) + ' ' + op(0.4)) + path('M19 15H27Q32 15 32 20Q32 23 29 24Q33 25 33 29Q33 33 27 33H19ZM23 18.5V22.5H27Q28.5 22.5 28.5 20.5Q28.5 18.5 27 18.5ZM23 26V29.5H27.5Q29.5 29.5 29.5 27.75Q29.5 26 27.5 26Z', ink) + line('M22 12V15M26 12V15M22 33V36M26 33V36', ink, 1.6),
  // A crescent moon coin.
  moontokens: (c) => circ(24, 24, 15, c, op(0.3)) + path('M28 10A14 14 0 1 0 38 30A11 11 0 1 1 28 10Z', c),
  // A diamond, for diamond hands.
  hodl: (c) => path('M14 18L20 11H28L34 18L24 37Z', c) + line('M14 18H34M20 11L24 18L28 11M24 18V37', ink, 1.2, op(0.4)),
  // Two bun halves around a name band.
  burger: (c) => path('M10 22Q10 10 24 10Q38 10 38 22Z', '#e8a33d') + rect(8, 22, 32, 6, c) + path('M10 28H38Q38 38 24 38Q10 38 10 28Z', '#e8a33d'),
  // A red roof.
  pizzahutt: (c) => path('M6 28L24 12L42 28L36 28L24 18L12 28Z', c) + rect(14, 31, 20, 4, white, op(0.85)),
  // A bell.
  tacobellow: (c) => path('M24 10Q34 12 34 26V32H14V26Q14 12 24 10Z', c) + rect(11, 32, 26, 3, c) + circ(24, 37, 2.2, white),
  // A three-pointed star, slightly bent.
  mercedes: (c) => circ(24, 24, 15, 'none', stroke(c, 2.2)) + path('M24 10L26 24L37 31L24 26L12 32L22 24Z', c),
  // An H in a rounded square.
  hondo: (c) => rr(11, 11, 26, 26, 5, 'none', stroke(c, 2.4)) + path('M17 15H21V22H27V15H31V33H27V26H21V33H17Z', c),
  // A T with a shield-like cap.
  tesler: (c) => path('M10 14Q24 8 38 14L36 17Q30 15 26 16V38H22V16Q18 15 12 17Z', c),
  // Three pillars under a pediment.
  bankofgrind: (c) => path('M8 18L24 9L40 18Z', c) + rect(12, 20, 4, 13, c) + rect(22, 20, 4, 13, c) + rect(32, 20, 4, 13, c) + rect(9, 34, 30, 4, c),
  // Two overlapping circles.
  mastercardio: (c) => circ(19, 24, 11, '#ff4d6d') + circ(29, 24, 11, c, op(0.9)) + path('M24 14.4A11 11 0 0 1 24 33.6A11 11 0 0 1 24 14.4Z', '#ffb03d'),
  // An italic double-V wordmark.
  visaversa: (c) => path('M9 16H14L18 30L26 16H31L20 34H16ZM24 16H29L33 30L41 16H45L34 34H30Z', c, 'transform="translate(-4 0)"') + rect(8, 37, 32, 2, '#ffc83d'),
  // A shield with a sleeping Z.
  snorvpn: (c) => path('M24 8L37 13V23Q37 34 24 40Q11 34 11 23V13Z', c) + path('M18 18H29L20 29H30', 'none', stroke(ink, 2.6) + ' stroke-linejoin="round"'),
  // A letter E with a forward arrow.
  expressnope: (c) => path('M12 14H26V18H17V22H24V26H17V30H26V34H12Z', c) + path('M28 18L36 24L28 30Z', white),
  // A shark fin over a wave.
  surfshork: (c) => path('M16 30Q24 26 26 10Q32 20 34 30Z', c) + line('M6 34Q12 30 18 34T30 34T42 34', white, 2),
  // A swoosh.
  nikey: (c) => path('M7 30Q10 38 20 33L42 20Q24 27 16 29Q10 31 7 30Z', c),
  // Three stripes in a rising triangle.
  adidash: (c) => path('M10 36L16 26L20 28L15 36Z', c) + path('M19 36L27 21L31 23L24 36Z', c) + path('M28 36L38 16L42 18L33 36Z', c),
  // A leaping cat.
  pumakittens: (c) => path('M8 30Q14 22 22 22Q27 16 33 16L36 12L37 17Q41 19 40 23L35 24Q30 28 26 27Q20 31 14 33L10 38Z', c),
  // A swept wing over a sun.
  emiratez: (c) => circ(30, 18, 6, c, op(0.35)) + path('M6 32Q20 26 42 12Q34 24 24 30Q14 35 6 32Z', c),
  // A harp.
  ryanairheads: (c) => path('M14 10Q30 10 34 32L30 36L14 36Z', 'none', stroke(c, 2.6)) + line('M18 16V36M22 14V36M26 18V36M30 26V36', c, 1.2),
  // An atom with orbiting planes.
  quantumair: (c) => ell(24, 24, 16, 6, 'none', stroke(c, 1.8)) + ell(24, 24, 16, 6, 'none', stroke(c, 1.8) + ' transform="rotate(60 24 24)"') + ell(24, 24, 16, 6, 'none', stroke(c, 1.8) + ' transform="rotate(-60 24 24)"') + circ(24, 24, 3, white),
  // A shield with a coiled S.
  secretlabz: (c) => path('M24 8L38 14V24Q38 34 24 40Q10 34 10 24V14Z', 'none', stroke(c, 2.4)) + path('M29 17Q24 13 19 17Q17 21 24 24Q31 27 29 31Q24 35 18 31', 'none', stroke(c, 3) + ' stroke-linecap="round"'),
  // DX with racing stripes.
  dxracecar: (c) => rect(8, 20, 32, 2.5, c, op(0.6)) + rect(8, 26, 32, 2.5, c, op(0.6)) + path('M12 16H18Q24 16 24 24Q24 32 18 32H12ZM16 20V28H18Q20 28 20 24Q20 20 18 20ZM26 16H30L33 21L36 16H40L35 24L40 32H36L33 27L30 32H26L31 24Z', white),
};

/** A brand's parody logo, or its initials on the badge if it has no drawing yet. */
export function brandLogoSvg(brandId: string, color: string, name = ''): string {
  const draw = LOGOS[brandId];
  const inner = draw
    ? draw(color)
    : `<text x="24" y="30" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="16" fill="${color}">${name.slice(0, 2).toUpperCase().replace(/[^A-Z0-9]/g, '')}</text>`;
  const body = withDepth({ plate: badge(color), emblem: inner, outline: roundedRect(2, 2, 44, 44, 11) });
  return `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${body}</svg>`;
}

export const BRAND_LOGO_IDS = Object.keys(LOGOS);
