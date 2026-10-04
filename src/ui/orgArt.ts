import { K, circ, ell, f, group, line, op, path, rect, rr, spark, stroke } from './artKit';
import { roundedRect, withDepth } from './logoDepth';

/**
 * Knock-off crests for the rival esports orgs. Every rival has its own drawing: the ones named after
 * real orgs send up the real mark (a vinegar bottle in black and yellow for Natus Vinegar, a clam for
 * Faze Clam, a crowned die that always rolls six for Royal Neverquit), and the made-up ones draw
 * their joke (a snail with a loading spinner for a shell for Lag Legends). A name with no drawing gets
 * a monogram crest whose shape and colours come from the name, so it always wears the same badge. Output is built from constants and the org's initials only,
 * so it is safe to render with {@html}.
 */
type Crest = { bg: string; draw: () => string };

const ink = '#0f1117';
const white = '#f4f5f7';

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/** A five-pointed star as a path, outer radius r1 and inner r2. */
function starPath(cx: number, cy: number, r1: number, r2: number): string {
  const pts = range(10).map((i) => {
    const r = i % 2 ? r2 : r1;
    const a = (-90 + i * 36) * (Math.PI / 180);
    return `${f(cx + r * Math.cos(a))} ${f(cy + r * Math.sin(a))}`;
  });
  return `M${pts.join('L')}Z`;
}

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
  // Rogue: a pirate's hat riding a wave.
  'Rogue Waves': {
    bg: '#0a1426',
    draw: () =>
      path('M5 36Q8 20 22 18Q36 16 41 26Q35 22 29 25Q35 28 33 34Q38 36 43 33V41H5Z', '#2a8bff') +
      path('M29 25Q23 22 21 28Q26 26 29 25Z', '#bfe1ff') +
      path('M13 17L17 9Q24 12 31 9L35 17Q24 20 13 17Z', ink) +
      circ(24, 13, 1.8, white) +
      line('M22.5 15.5L25.5 15.5', white, 0.8),
  },
  // LOUD: a neon green megaphone.
  'Loud & Clear': {
    bg: '#08160a',
    draw: () =>
      path('M9 19H15L31 10V38L15 29H9Z', '#3dff6a') +
      rect(11, 29, 4, 7, '#2bb44a') +
      line('M35 18Q39 24 35 30', '#3dff6a', 2.2) +
      line('M38.5 13Q45 24 38.5 35', '#3dff6a', 2.2, op(0.55)),
  },
  // Complexity: the gold star inside a C, plus some maths.
  'Complexity Theory': {
    bg: '#0b1226',
    draw: () =>
      path('M35 14A14 14 0 1 0 35 34', 'none', `${stroke('#3a6bff', 5)} stroke-linecap="round"`) +
      path(starPath(24, 24, 7, 3), K.gold) +
      `<text x="38" y="28" text-anchor="middle" font-family="serif" font-style="italic" font-weight="700" font-size="11" fill="${K.gold}">π</text>`,
  },
  // A speech bubble, echoing.
  'Echo Chamber': {
    bg: '#071a1c',
    draw: () =>
      path('M10 12H29Q33 12 33 16V26Q33 30 29 30H18L12 36V30H10Q6 30 6 26V16Q6 12 10 12Z', '#2ad4c4') +
      circ(19.5, 21, 2.4, ink) +
      circ(19.5, 21, 5.5, 'none', stroke(ink, 1.3)) +
      line('M36.5 15Q40.5 21 36.5 27', '#2ad4c4', 2) +
      line('M40 11Q46 21 40 31', '#2ad4c4', 2, op(0.5)),
  },
  // Dignitas: a legionary's helmet in black and gold, the maximum version.
  'Dignitas Maximus': {
    bg: '#15120a',
    draw: () =>
      path('M18 13Q20 3 35 6Q31 9 29 13Z', K.red) +
      path('M13 34V24Q13 12 25 12Q36 12 36 24V30H28V34Z', K.gold) +
      path('M28 24H36V30H28Z', K.goldD) +
      rect(19, 22, 9, 2.6, ink) +
      line('M16 30H26', K.goldD, 1.4) +
      `<text x="24" y="43.5" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="7" fill="${white}">MAX</text>`,
  },
  // Invictus Gaming: the red iG inside a laurel wreath.
  'Invictus Gamers': {
    bg: '#1a0a0a',
    draw: () =>
      line('M15 38Q7 27 13 12M33 38Q41 27 35 12', K.gold, 1.4) +
      [0, 1, 2, 3, 4].map((i) => {
        const y = 15 + i * 5;
        return ell(11 + Math.abs(i - 2) * 0.8, y, 1.6, 3, K.gold, `transform="rotate(-35 ${11 + Math.abs(i - 2) * 0.8} ${y})"`) + ell(37 - Math.abs(i - 2) * 0.8, y, 1.6, 3, K.gold, `transform="rotate(35 ${37 - Math.abs(i - 2) * 0.8} ${y})"`);
      }).join('') +
      `<text x="24" y="30" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="17" fill="#e5403f">iG</text>`,
  },
  // Royal Never Give Up, as a random number generator: a crowned die that always rolls six.
  'Royal Neverquit': {
    bg: '#1a0b0b',
    draw: () =>
      rr(13, 20, 22, 20, 4, white) +
      [[18.5, 25], [18.5, 30], [18.5, 35], [29.5, 25], [29.5, 30], [29.5, 35]].map(([x, y]) => circ(x, y, 1.9, '#c8323f')).join('') +
      path('M13 18L16 9L21 14L24 7L27 14L32 9L35 18Z', K.gold) +
      circ(24, 7, 1.4, K.gold),
  },
  // Top Esports: a spinning top that isn't sure.
  'Top Esports Maybe': {
    bg: '#1a0a0e',
    draw: () =>
      path('M13 19H35L24 39Z', '#e5403f') +
      ell(24, 19, 11, 4, '#ff7b7b') +
      line('M17 25H31M20 31H28', white, 1.4, op(0.7)) +
      rect(23, 9, 2, 7, white) +
      line('M8 36Q14 41 24 41M40 36Q34 41 24 41', white, 1, op(0.4)) +
      `<text x="38" y="15" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="12" fill="${white}">?</text>`,
  },
  // Spacestation Gaming: a station whose module is a gamepad.
  'Spacestation Gamers': {
    bg: '#120b22',
    draw: () =>
      rect(4, 22, 9, 5, '#3a6bff') +
      rect(35, 22, 9, 5, '#3a6bff') +
      line('M13 24.5H35', '#9aa6b8', 1.4) +
      ell(24, 24.5, 16, 6, 'none', stroke('#8b5cff', 2.2)) +
      rr(15, 18, 18, 13, 6, '#c9b8ff') +
      line('M19.5 24.5H23.5M21.5 22.5V26.5', ink, 1.3) +
      circ(28, 23.5, 1.2, '#e5403f') +
      circ(30, 26, 1.2, '#3a6bff') +
      circ(10, 10, 1, K.gold) +
      circ(38, 38, 1.2, K.gold) +
      circ(36, 9, 0.8, white),
  },
  // Oxygen Esports: an O2 tank, blowing bubbles.
  'Oxygen Tanks': {
    bg: '#0a1426',
    draw: () =>
      rr(16, 13, 16, 29, 6, '#3fb6ff') +
      rect(17, 14, 3, 26, '#fff', op(0.25)) +
      rect(21, 8, 6, 6, '#9aa6b8') +
      rect(19, 6, 10, 3, '#6d7077') +
      rect(16, 22, 16, 10, white) +
      `<text x="24" y="30" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="8" fill="${ink}">O2</text>` +
      circ(37, 13, 2.4, 'none', stroke(white, 1)) +
      circ(40, 7, 1.5, 'none', stroke(white, 1)),
  },
  // A shield with a lane running up it.
  'Guardians of the Lane': {
    bg: '#0b1410',
    draw: () =>
      path('M24 6L38 11V23Q38 35 24 42Q10 35 10 23V11Z', '#2f8f5a') +
      path('M20 39L23 12H25L28 39Z', '#2a2b30') +
      line('M24 15V36', K.gold, 1.2, 'stroke-dasharray="2.5 2"') +
      path('M24 6L38 11V23Q38 35 24 42Q10 35 10 23V11Z', 'none', stroke(white, 1.6)),
  },
  // BOOM Esports: a cartoon bomb.
  'Boom Boom Esports': {
    bg: '#1a0a0a',
    draw: () =>
      circ(21, 29, 12, '#2a2b30') +
      circ(16.5, 24.5, 3.2, white, op(0.3)) +
      rr(25, 14, 7, 6, 1.5, '#6d7077', 'transform="rotate(40 28.5 17)"') +
      line('M31 14Q35 7 39 9', '#c9a46a', 1.8) +
      spark(39.5, 8.5, 5, K.gold) +
      circ(39.5, 8.5, 1.5, white),
  },
  // Curtains, a spotlight and one more song.
  'Encore Esports': {
    bg: '#1a0b14',
    draw: () =>
      rect(5, 7, 38, 5, '#7a1a2a') +
      path('M5 12H17Q14 26 18 41H5Z', '#c8323f') +
      path('M43 12H31Q34 26 30 41H43Z', '#c8323f') +
      line('M9 14Q8 27 10 40M38 14Q39 27 37 40', '#000', 1, op(0.3)) +
      path('M20 41L24 22L28 41Z', K.goldL, op(0.25)) +
      spark(24, 22, 6, K.gold),
  },
  // BIG: the letters, very small, under a magnifying glass.
  'BIG Small': {
    bg: '#101216',
    draw: () =>
      circ(21, 21, 11, '#1d2027') +
      `<text x="21" y="23.5" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="6.5" fill="${white}">BIG</text>` +
      circ(21, 21, 11, 'none', stroke(white, 3)) +
      path('M14 15Q17 12 21 12', 'none', `${stroke(white, 1.4)} ${op(0.5)}`) +
      line('M29.5 29.5L39 39', white, 4.5),
  },
  // Sprout: a Brussels sprout, sprouting.
  'Sprout Sprouts': {
    bg: '#0b170b',
    draw: () =>
      circ(24, 30, 11, '#7ccf5a') +
      line('M14 29Q24 21 34 29M16 35Q24 28 32 35', '#4caf6a', 1.6) +
      line('M24 19V10', '#4caf6a', 1.8) +
      ell(19.5, 10.5, 4.5, 2, '#9dff3b', 'transform="rotate(-25 19.5 10.5)"') +
      ell(28.5, 9.5, 4.5, 2, '#9dff3b', 'transform="rotate(25 28.5 9.5)"'),
  },
  // Apeks: the orange peak, with a predator's eyes and teeth.
  'Apeks Predators': {
    bg: '#1a1006',
    draw: () =>
      path('M5 41L20 13L26 23L30 17L43 41Z', '#ff7a1a') +
      path('M20 13L24 20.5L21 19.5L17.5 21Z', white) +
      ell(18.5, 31, 3.2, 1.7, K.gold) +
      ell(29.5, 31, 3.2, 1.7, K.gold) +
      rect(18, 29.4, 1, 3.2, ink) +
      rect(29, 29.4, 1, 3.2, ink) +
      path('M15 41L17 37L19 41L21 37L23 41L25 37L27 41L29 37L31 41L33 37L35 41Z', white),
  },
  // Endpoint: a plug pulled out of its socket.
  'Endpoint Down': {
    bg: '#1a0a0e',
    draw: () =>
      line('M3 25H8', '#6d7077', 2.6) +
      rr(8, 19, 13, 12, 2.5, '#c9ced8') +
      rect(21, 21.5, 5, 2.2, '#9aa6b8') +
      rect(21, 26.5, 5, 2.2, '#9aa6b8') +
      rr(31, 16, 12, 18, 3, '#2a2b30') +
      rect(34, 21.5, 6, 2.2, ink) +
      rect(34, 26.5, 6, 2.2, ink) +
      spark(28.5, 14, 3.5, K.gold) +
      path('M20 36H28L24 42Z', '#e5403f'),
  },
  // Alliance: a handshake on a blue shield.
  'Alliance of Allies': {
    bg: '#0a1226',
    draw: () =>
      path('M24 6L38 11V23Q38 35 24 42Q10 35 10 23V11Z', '#2a6bff') +
      path('M11 26L19 21L26 26L19 31Z', '#f1d5b0') +
      path('M37 26L29 21L22 26L29 31Z', '#c98f5f') +
      line('M22 26L26 26', ink, 0.8, op(0.4)) +
      spark(24, 14, 4, white),
  },
  // Nigma Galaxy: a question mark made of a galaxy.
  'Nigma Enigma': {
    bg: '#120a1e',
    draw: () =>
      path('M16 17Q16 9 24 9Q32 9 32 17Q32 23 25 25V30', 'none', `${stroke('#b06bff', 4.4)} stroke-linecap="round"`) +
      path('M16 17Q16 9 24 9Q32 9 32 17Q32 23 25 25V30', 'none', `${stroke('#e8d6ff', 1.2)} stroke-linecap="round" stroke-dasharray="1 3"`) +
      circ(25, 36, 2.8, '#b06bff') +
      circ(10, 30, 0.9, white) +
      circ(38, 33, 1.2, white) +
      circ(36, 8, 0.8, white),
  },
  // beastcoast: a beast of the coast, which is a crab with fangs.
  'Beastly Coast': {
    bg: '#061a1c',
    draw: () =>
      path('M4 40Q12 36 20 40Q28 44 36 40Q40 38 44 40V44H4Z', '#22b5c9') +
      line('M14 27L10 20M34 27L38 20', '#ff7a1a', 2) +
      path('M6 18A4.5 4.5 0 1 1 14 17L10 18Z', '#ff7a1a') +
      path('M42 18A4.5 4.5 0 1 0 34 17L38 18Z', '#ff7a1a') +
      ell(24, 29, 11, 7, '#ff7a1a') +
      line('M20 23V19M28 23V19', '#ff7a1a', 1.6) +
      circ(20, 18, 2.2, white) +
      circ(28, 18, 2.2, white) +
      circ(20.5, 18.5, 1, ink) +
      circ(27.5, 18.5, 1, ink) +
      path('M20 31L21.5 34.5L23 31Z M25 31L26.5 34.5L28 31Z', white),
  },
  // Talon: three claw marks in gold.
  'Talon Claws': {
    bg: '#15120a',
    draw: () => [13, 22, 31].map((x, i) => path(`M${x} ${8 + i * 2}Q${x - 3} ${24} ${x + 6} ${40 - i * 2}Q${x + 1} ${24} ${x + 4} ${8 + i * 2}Z`, i === 1 ? K.goldL : K.gold)).join(''),
  },
  // Blacklist International: a list, blocked.
  'Blacklist Blocklist': {
    bg: '#101114',
    draw: () =>
      rr(11, 8, 24, 32, 3, white) +
      rr(18, 6, 10, 5, 2, '#6d7077') +
      line('M15 17H31M15 23H31M15 29H25', '#9ea2a8', 1.6) +
      line('M14 17H32M14 23H32', ink, 1.4) +
      circ(33, 34, 7, '#101114') +
      circ(33, 34, 7, 'none', stroke('#e5403f', 2.4)) +
      line('M28 39L38 29', '#e5403f', 2.4),
  },
  // Xtreme Gaming: an X in shades, on fire.
  'Xtreme Gamers': {
    bg: '#1a0806',
    draw: () =>
      path('M24 3Q29 9 24 14Q19 9 24 3Z', K.gold) +
      path('M10 10H17L24 20L31 10H38L28 25L38 40H31L24 30L17 40H10L20 25Z', '#ff3b2f') +
      rr(14, 22, 8, 4.4, 1.5, ink) +
      rr(26, 22, 8, 4.4, 1.5, ink) +
      line('M22 23.5H26', ink, 1.2),
  },
  // A tower and its neighbour, both leaning.
  'The Tilted Towers': {
    bg: '#120e24',
    draw: () =>
      rect(5, 39, 38, 3, '#4caf6a') +
      group(rect(11, 15, 9, 25, '#c9b8ff') + [19, 25, 31].map((y) => rect(13, y, 2, 3, '#120e24') + rect(16.5, y, 2, 3, '#120e24')).join(''), 'transform="rotate(-11 15.5 40)"') +
      group(rect(27, 10, 10, 30, '#a08ae0') + [14, 20, 26, 32].map((y) => rect(29, y, 2.2, 3, '#120e24') + rect(33, y, 2.2, 3, '#120e24')).join(''), 'transform="rotate(8 32 40)"'),
  },
  // A snail whose shell is a loading spinner.
  'Lag Legends': {
    bg: '#0b1626',
    draw: () =>
      path('M5 38Q9 31 17 34H39V38Z', '#c9e86a') +
      line('M9 33L7 26M12.5 33L12.5 26', '#c9e86a', 1.4) +
      circ(7, 25.5, 1.6, '#c9e86a') +
      circ(12.5, 25.5, 1.6, '#c9e86a') +
      circ(27, 24, 11, '#1d2a40') +
      range(8).map((i) => {
        const a = (i / 8) * Math.PI * 2;
        return circ(27 + Math.cos(a) * 7, 24 + Math.sin(a) * 7, 1.9, white, op(f(0.2 + i * 0.1)));
      }).join(''),
  },
  // A crowned table tennis bat.
  'Ping Pong Kings': {
    bg: '#1a0a12',
    draw: () =>
      rr(27, 30, 5, 13, 2, '#c9a46a', 'transform="rotate(-40 29.5 33)"') +
      circ(21, 25, 11, '#e5403f') +
      circ(21, 25, 11, 'none', stroke('#8f1c1c', 1.2)) +
      path('M14 15L16 8L19.5 12L21 6L22.5 12L26 8L28 15Z', K.gold) +
      circ(37, 13, 3.4, white),
  },
  // A camel crossing the dunes, a crosshair with no scope.
  'Noscope Nomads': {
    bg: '#1a1408',
    draw: () =>
      path('M4 40Q14 31 24 36Q34 31 44 38V44H4Z', '#d9a441') +
      path('M11 31Q11 25 15 25Q17 19 20 23Q23 19 26 23Q28 23 29 19L32 18L33 21L30 23Q30 31 27 31V37H25V31H17V37H15V31Z', '#5c3f1f') +
      circ(36, 13, 6, 'none', stroke(white, 1.3)) +
      line('M36 5V10M36 16V21M28 13H33M39 13H44', white, 1.3),
  },
  // A ranger's hat, and the arrow that brings you back.
  'Respawn Rangers': {
    bg: '#0b170e',
    draw: () =>
      path('M16 24Q16 12 24 12Q32 12 32 24Z', '#a87a48') +
      rect(16, 20, 16, 3.4, '#4caf6a') +
      path('M6 25Q24 19 42 25Q34 28 24 28Q14 28 6 25Z', '#8a6236') +
      path('M16 36A8 5 0 1 0 24 32', 'none', `${stroke('#9dff3b', 2.2)} stroke-linecap="round"`) +
      path('M24 29L28 32L24 35Z', '#9dff3b'),
  },
  // A hero's portrait with a target on the forehead.
  'Headshot Heroes': {
    bg: '#1a0a0e',
    draw: () =>
      path('M9 42Q11 30 24 30Q37 30 39 42Z', '#3a6bff') +
      path('M17 30L24 38L31 30Z', '#e5403f') +
      circ(24, 19, 9.5, '#f1d5b0') +
      circ(24, 16, 4, 'none', stroke('#e5403f', 1.6)) +
      circ(24, 16, 1.4, '#e5403f') +
      line('M20 22.5Q24 25 28 22.5', ink, 1.2),
  },
  // A twenty-sided die that rolled a twenty.
  'Critical Crits': {
    bg: '#1a0a0a',
    draw: () =>
      spark(24, 24, 20, '#ffb03d') +
      path('M24 7L38 15V33L24 41L10 33V15Z', '#e5403f') +
      path('M24 7L33 28H15Z', '#ff6b6b') +
      line('M10 15L15 28M38 15L33 28M15 28L24 41L33 28', '#8f1c1c', 0.9) +
      `<text x="24" y="25" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="8.5" fill="${white}">20</text>`,
  },
  // Moist: a droplet, sweating.
  'Moist Esports': {
    bg: '#06161c',
    draw: () =>
      path('M24 6Q36 21 36 30A12 12 0 0 1 12 30Q12 21 24 6Z', '#22c4e8') +
      path('M17 27Q17 21 21 17', 'none', `${stroke(white, 1.6)} ${op(0.5)}`) +
      circ(19.5, 29, 1.6, ink) +
      circ(28.5, 29, 1.6, ink) +
      path('M20 34Q24 37 28 34', 'none', stroke(ink, 1.4)) +
      path('M38 14Q40 18 38 19Q36 18 38 14Z', '#bfefff') +
      path('M41 22Q42.5 25 41 26Q39.5 25 41 22Z', '#bfefff'),
  },
  // A salt shaker, mined.
  'Salt Mines Gaming': {
    bg: '#101216',
    draw: () =>
      rr(17, 17, 15, 23, 4, '#e8edf5') +
      path('M17 19Q17 9 24.5 9Q32 9 32 19Z', '#9ea2a8') +
      circ(22, 13, 0.9, ink) +
      circ(25, 12, 0.9, ink) +
      circ(28, 13.5, 0.9, ink) +
      line('M7 41L27 17', '#8a6236', 2.4) +
      path('M18 13Q27 13 33 23', 'none', `${stroke('#c9ced8', 3)} stroke-linecap="round"`) +
      circ(37, 33, 1, white) +
      circ(40, 37, 0.8, white) +
      circ(36, 39, 0.8, white),
  },
  // A white flag with GG on it.
  'GG No Re': {
    bg: '#101216',
    draw: () =>
      line('M13 7V42', '#9ea2a8', 2.2) +
      circ(13, 6.5, 1.8, K.gold) +
      path('M14 9H37L32 16L37 23H14Z', white) +
      `<text x="24.5" y="19.5" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="8" fill="${ink}">GG</text>`,
  },
  // Five points, five swords, one club.
  'Pentakill Club': {
    bg: '#140a1a',
    draw: () => {
      const pts = range(5).map((k) => {
        const a = (-90 + k * 72) * (Math.PI / 180);
        return [f(24 + 16 * Math.cos(a)), f(25 + 16 * Math.sin(a))];
      });
      return (
        path(`M${pts.map(([x, y]) => `${x} ${y}`).join('L')}Z`, 'none', stroke('#b06bff', 2.2)) +
        line('M16 33L32 17M32 33L16 17', '#c9ced8', 2.4) +
        line('M14 31L18 35M34 31L30 35', K.gold, 2) +
        pts.map(([x, y]) => circ(x, y, 2.4, '#e5403f')).join('')
      );
    },
  },
  // A controller, thrown.
  'The Throwers': {
    bg: '#1a1206',
    draw: () =>
      line('M3 33H11M5 38H13M2 28H9', white, 1.4, op(0.55)) +
      path('M8 40Q20 6 40 14', 'none', `${stroke(white, 1)} ${op(0.35)} stroke-dasharray="2 2"`) +
      group(
        rr(14, 18, 22, 12, 6, '#c9ced8') + line('M18.5 24H22.5M20.5 22V26', ink, 1.3) + circ(30, 22.5, 1.3, '#e5403f') + circ(32.5, 25, 1.3, '#3a6bff'),
        'transform="rotate(-22 25 24)"',
      ),
  },
  // A warning sign over a diff: green added, red removed.
  'Diff Detected': {
    bg: '#0d1117',
    draw: () =>
      path('M24 6L41 35H7Z', 'none', `${stroke(K.gold, 2.4)} stroke-linejoin="round"`) +
      rr(22.6, 15, 2.8, 11, 1.2, K.gold) +
      circ(24, 30, 1.7, K.gold) +
      rr(6, 38, 17, 4, 1, '#2ea043') +
      rr(25, 38, 17, 4, 1, '#da3633') +
      line('M14.5 38.6V41.4M13 40H16', white, 1) +
      line('M32 40H35', white, 1),
  },
  // A star, asleep.
  'AFK Allstars': {
    bg: '#0e0a1a',
    draw: () =>
      path(starPath(21, 26, 15, 7), K.gold) +
      path('M15 25Q17 27 19 25M23 25Q25 27 27 25', 'none', stroke(ink, 1.3)) +
      `<text x="37" y="15" font-family="sans-serif" font-weight="900" font-size="9" fill="${white}">z</text>` +
      `<text x="41" y="9" font-family="sans-serif" font-weight="900" font-size="6" fill="${white}" opacity="0.7">z</text>`,
  },
  // A football with horns and a temper.
  'Final Boss FC': {
    bg: '#14080a',
    draw: () =>
      path('M14 19Q7 11 11 5Q13 12 19 15Z', '#e5403f') +
      path('M34 19Q41 11 37 5Q35 12 29 15Z', '#e5403f') +
      circ(24, 27, 13, white) +
      path('M24 22L28.5 25.5L27 31H21L19.5 25.5Z', ink) +
      path('M11.5 25L16 23.5L17.5 28L14 31Z M36.5 25L32 23.5L30.5 28L34 31Z M20 39L22 35H26L28 39Z', ink) +
      line('M17 18L22 20M31 18L26 20', ink, 1.6),
  },
  // Fnatic and OpTic in one: an orange F in a green ring.
  Fnopic: {
    bg: '#0b140b',
    draw: () =>
      circ(24, 24, 16, 'none', stroke('#5bd65b', 3)) +
      path('M17 12H32V17H23V22H30V27H23V37H17Z', '#ff7a1a') +
      line('M10 36L38 12', '#5bd65b', 1.6, op(0.5)),
  },
  // A chilli pepper in a cape and a mask.
  'Hot Sauce Heroes': {
    bg: '#1a0806',
    draw: () =>
      path('M13 19Q7 28 9 38L17 30Z', '#3a6bff') +
      path('M11 16Q11 12 16 12Q30 12 36 22Q41 32 36 41Q35 33 30 28Q22 21 11 21Z', '#e5403f') +
      path('M14 13.5Q27 13 33 20', 'none', `${stroke(white, 1.6)} ${op(0.35)}`) +
      path('M12 15Q8 12 10 7', 'none', `${stroke('#4caf6a', 2.8)} stroke-linecap="round"`) +
      path('M10 12Q12 10 15 12.5', 'none', stroke('#4caf6a', 2.2)) +
      path('M15 15Q20 13 25 15.5L24.5 19Q20 17 15.5 18.5Z', ink) +
      circ(18, 16.3, 1, white) +
      circ(22.2, 16.6, 1, white),
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
  const plate = rr(1, 1, 46, 46, 11, crest.bg) + rr(1, 1, 46, 46, 11, 'none', `${stroke('#ffffff', 1)} ${op(0.12)}`);
  const body = withDepth({ plate, emblem: crest.draw(), outline: roundedRect(1, 1, 46, 46, 11) });
  return `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${body}</svg>`;
}

export const ORG_LOGO_NAMES = Object.keys(BESPOKE);
