import type { Effect, GameState } from '../engine/types';
import { OPERATIONS, getOp } from './operations';

export type UpgradeGroup =
  | 'grind'
  | 'op'
  | 'collab'
  | 'synergy'
  | 'click'
  | 'hype'
  | 'snack'
  | 'fame'
  | 'superfan'
  | 'team'
  | 'roster'
  | 'gear';

export interface UpgradeDef {
  id: string;
  name: string;
  group: UpgradeGroup;
  icon: string;
  /** Optional secondary badge icon. */
  badge?: string;
  /** 0-based tier for frame colour. */
  tier: number;
  cost: number;
  currency: 'cash' | 'trophies';
  effects: Effect[];
  flavor?: string;
  requirement: string;
  unlock: (s: GameState) => boolean;
}

const owned = (s: GameState, op: string): number => s.ops[op]?.owned ?? 0;

const defs: UpgradeDef[] = [];

function add(def: Omit<UpgradeDef, 'currency'> & { currency?: 'cash' | 'trophies' }): void {
  defs.push({ currency: 'cash', ...def });
}

// ---------------------------------------------------------------------------
// Ranked Grinder line (doubles grinders + clicks, then flat bonus per operation)
// ---------------------------------------------------------------------------
const GRIND_LINE: { name: string; need: number; cost: number; effect: Effect; flavor: string }[] = [
  { name: 'Reinforced WASD Keys', need: 1, cost: 100, effect: { kind: 'grindDouble' }, flavor: 'The W key is load-bearing.' },
  { name: 'Carpal Tunnel Prevention', need: 1, cost: 500, effect: { kind: 'grindDouble' }, flavor: 'Wrist stretches between queues. Mandatory.' },
  { name: 'Ambidextrous Queueing', need: 10, cost: 10_000, effect: { kind: 'grindDouble' }, flavor: 'Two accounts, two hands, one dream.' },
  { name: 'Thousand-Game Grind', need: 25, cost: 100_000, effect: { kind: 'grindAdd', add: 0.1 }, flavor: 'Hard stuck? Not for long.' },
  { name: 'Million-Game Grind', need: 50, cost: 1e7, effect: { kind: 'grindAddMult', mult: 5 }, flavor: 'Their match history scrolls for days.' },
  { name: 'Billion-Game Grind', need: 100, cost: 1e8, effect: { kind: 'grindAddMult', mult: 10 }, flavor: 'The ranked servers send them thank-you cards.' },
  { name: 'Trillion-Game Grind', need: 150, cost: 1e9, effect: { kind: 'grindAddMult', mult: 20 }, flavor: 'They have seen every map from every angle.' },
  { name: 'Quadrillion-Game Grind', need: 200, cost: 1e10, effect: { kind: 'grindAddMult', mult: 20 }, flavor: 'Queue times are now negative.' },
  { name: 'Quintillion-Game Grind', need: 250, cost: 1e13, effect: { kind: 'grindAddMult', mult: 20 }, flavor: 'The ladder has no top. They checked.' },
  { name: 'Sextillion-Game Grind', need: 300, cost: 1e16, effect: { kind: 'grindAddMult', mult: 20 }, flavor: 'Grass has been officially declared a myth.' },
  { name: 'Septillion-Game Grind', need: 350, cost: 1e19, effect: { kind: 'grindAddMult', mult: 20 }, flavor: 'Every LP in existence has passed through their hands.' },
  { name: 'Octillion-Game Grind', need: 400, cost: 1e22, effect: { kind: 'grindAddMult', mult: 20 }, flavor: 'The game has started grinding them back.' },
  { name: 'Nonillion-Game Grind', need: 450, cost: 1e25, effect: { kind: 'grindAddMult', mult: 20 }, flavor: 'One more game. Forever.' },
];

GRIND_LINE.forEach((u, i) => {
  add({
    id: `grind_${i}`,
    name: u.name,
    group: 'grind',
    icon: 'gamepad-2',
    tier: i,
    cost: u.cost,
    effects: [u.effect],
    flavor: u.flavor,
    requirement: `Own ${u.need} Ranked Grinder${u.need === 1 ? '' : 's'}`,
    unlock: (s) => owned(s, 'grinder') >= u.need,
  });
});

// ---------------------------------------------------------------------------
// Tiered doubling upgrades for every other operation
// ---------------------------------------------------------------------------
export const TIER_NEED = [1, 5, 25, 50, 100, 150, 200, 250, 300, 350, 400, 450];
export const TIER_COST_MULT = [10, 50, 500, 5e4, 5e6, 5e8, 5e11, 5e14, 5e17, 5e20, 5e24, 5e28];

for (const op of OPERATIONS) {
  if (op.id === 'grinder') continue;
  op.tierNames.forEach((name, i) => {
    add({
      id: `op_${op.id}_${i}`,
      name,
      group: 'op',
      icon: op.icon,
      tier: i,
      cost: op.baseCost * TIER_COST_MULT[i],
      effects: [{ kind: 'opMult', op: op.id, mult: 2 }],
      requirement: `Own ${TIER_NEED[i]} ${TIER_NEED[i] === 1 ? op.name : op.plural}`,
      unlock: (s) => owned(s, op.id) >= TIER_NEED[i],
    });
  });
}

// ---------------------------------------------------------------------------
// Streamer collabs (streamers x2, operation gains % per streamer)
// ---------------------------------------------------------------------------
const COLLAB_NAMES: Record<string, string> = {
  creator: 'Reaction Collabs',
  cafe: 'Café Cam Streams',
  bootcamp: 'Bootcamp Vlogs',
  lan: 'LAN Party Streams',
  arena: 'Arena Watch-Alongs',
  broadcast: 'Co-Casting Rights',
  platform: 'Front-Page Features',
  studio: 'Dev Streams',
  league: 'Official Co-Streams',
  orbital: 'Streams from Orbit',
  neural: 'Mind-Cam Streams',
  clone: 'Clone Streamers',
  simulation: 'Simulated Chat',
  multiverse: 'Streams from Every Universe',
};

for (const op of OPERATIONS) {
  if (op.index < 2) continue;
  const per = op.index - 1;
  add({
    id: `collab_${op.id}`,
    name: COLLAB_NAMES[op.id] ?? `${op.name} Collabs`,
    group: 'collab',
    icon: 'video',
    badge: op.icon,
    tier: Math.min(11, op.index - 2),
    cost: op.baseCost * 50,
    effects: [
      { kind: 'opMult', op: 'streamer', mult: 2 },
      { kind: 'opPerOwned', op: op.id, source: 'streamer', pct: 0.01 / per },
    ],
    requirement: `Own 15 ${op.plural} and 1 Streamer`,
    unlock: (s) => owned(s, op.id) >= 15 && owned(s, 'streamer') >= 1,
  });
}

// ---------------------------------------------------------------------------
// Cross-operation synergies
// ---------------------------------------------------------------------------
const SYNERGIES: [string, string, string, string][] = [
  ['creator', 'platform', 'Algorithm Favourites', 'Recommended For You'],
  ['cafe', 'lan', 'Café LAN Nights', 'Noodle-Powered Networks'],
  ['bootcamp', 'arena', 'Home-Crowd Advantage', 'Training Grounds'],
  ['creator', 'arena', 'Behind the Scenes', 'Arena Vlog Series'],
  ['lan', 'broadcast', 'Low-Latency Feeds', 'Zero-Delay Casts'],
  ['arena', 'broadcast', 'Prime-Time Finals', 'Stadium Simulcast'],
  ['platform', 'studio', 'In-Game Streaming', 'Platform Exclusives'],
  ['studio', 'league', 'First-Party League', 'Rules by Design'],
  ['league', 'orbital', 'Space Expansion Team', 'Low-Orbit Playoffs'],
  ['orbital', 'neural', 'Zero-G Reflexes', 'Cosmic Cognition'],
  ['neural', 'clone', 'Neural Clones', 'Shared Consciousness'],
  ['clone', 'simulation', 'Digital Twins', 'Uploaded Rosters'],
  ['simulation', 'multiverse', 'Simulated Universes', 'Many-Worlds Engine'],
];

for (const [aId, bId, name1, name2] of SYNERGIES) {
  const a = getOp(aId);
  const b = getOp(bId);
  const base = a.baseCost * 10 + b.baseCost;
  [
    { name: name1, need: 15, cost: base * 1000, tier: 0 },
    { name: name2, need: 75, cost: base * 1e6, tier: 1 },
  ].forEach((t, i) => {
    add({
      id: `syn_${aId}_${bId}_${i}`,
      name: t.name,
      group: 'synergy',
      icon: a.icon,
      badge: b.icon,
      tier: t.tier * 4 + 2,
      cost: t.cost,
      effects: [
        { kind: 'opPerOwned', op: aId, source: bId, pct: 0.05 },
        { kind: 'opPerOwned', op: bId, source: aId, pct: 0.001 },
      ],
      requirement: `Own ${t.need} ${a.plural} and ${t.need} ${b.plural}`,
      unlock: (s) => owned(s, aId) >= t.need && owned(s, bId) >= t.need,
    });
  });
}

// ---------------------------------------------------------------------------
// Clicking: gain % of income per click
// ---------------------------------------------------------------------------
const CLICK_LINE: [string, number, string][] = [
  ['Rubber Grip Mouse', 5e4, 'Sweaty palms? Not anymore.'],
  ['Honeycomb Shell Mouse', 5e6, 'Lighter mouse, heavier wallet.'],
  ['Carbon Fibre Mouse', 5e8, 'Weighs less than your excuses.'],
  ['Optical Switch Mouse', 5e10, 'Zero debounce. Zero mercy.'],
  ['Magnesium Frame Mouse', 5e12, 'Forged in the fires of a very hot factory.'],
  ['Titanium Scroll Wheel', 5e14, 'Scrolls through patch notes at supersonic speed.'],
  ['Hall-Effect Buttons', 5e16, 'Magnets. How do they work?'],
  ['Zero-Latency Firmware', 5e18, 'Clicks register slightly before you click.'],
  ['Graphene Clickers', 5e20, 'One atom thick, infinitely satisfying.'],
  ['Neural Click Interface', 5e22, 'Just think "click".'],
  ['Quantum Double-Click', 5e24, 'Clicked and not clicked at the same time.'],
  ['Clicks Beyond Causality', 5e26, 'The click echoes through every timeline.'],
];

CLICK_LINE.forEach(([name, cost, flavor], i) => {
  const need = cost / 50;
  add({
    id: `click_${i}`,
    name,
    group: 'click',
    icon: 'mouse-pointer-click',
    tier: i,
    cost,
    effects: [{ kind: 'clickCpsPct', pct: 0.01 }],
    flavor,
    requirement: `Earn ${need.toExponential(0).replace('e+', 'e')} cash from clicking`,
    unlock: (s) => s.stats.clickCashRun >= need,
  });
});

// ---------------------------------------------------------------------------
// Hype meter
// ---------------------------------------------------------------------------
const HYPE_LINE: { name: string; clicks: number; cost: number; effect: Effect; flavor: string }[] = [
  { name: 'Hype Man', clicks: 300, cost: 2_000, effect: { kind: 'hypeGain', mult: 1.5 }, flavor: 'Paid to yell "LET\'S GOOO" professionally.' },
  { name: 'Air Horns', clicks: 1_500, cost: 250_000, effect: { kind: 'hypeDuration', mult: 1.5 }, flavor: 'Banned at three venues and counting.' },
  { name: 'Thunder Sticks', clicks: 5_000, cost: 5e7, effect: { kind: 'hypeGain', mult: 1.5 }, flavor: 'Bonk bonk bonk bonk.' },
  { name: 'Crowd Chants', clicks: 15_000, cost: 5e9, effect: { kind: 'hypeDuration', mult: 1.5 }, flavor: 'Everyone knows the words. Nobody knows who wrote them.' },
  { name: 'Stadium Subwoofers', clicks: 40_000, cost: 5e12, effect: { kind: 'hypeGain', mult: 2 }, flavor: 'You feel the bass in your teeth.' },
  { name: 'Tifo Banners', clicks: 100_000, cost: 5e15, effect: { kind: 'hypeDuration', mult: 2 }, flavor: 'A banner the size of a city block.' },
];

HYPE_LINE.forEach((u, i) => {
  add({
    id: `hype_${i}`,
    name: u.name,
    group: 'hype',
    icon: 'megaphone',
    tier: i * 2,
    cost: u.cost,
    effects: [u.effect],
    flavor: u.flavor,
    requirement: `Click ${u.clicks} times this run`,
    unlock: (s) => s.stats.clicksRun >= u.clicks,
  });
});

// ---------------------------------------------------------------------------
// Team snacks: flat global income boosts
// ---------------------------------------------------------------------------
const SNACKS: [string, number, number, string][] = [
  ['Instant Noodles', 1e6, 0.01, 'The fuel of champions (and broke champions).'],
  ['Energy Drink Six-Pack', 5e6, 0.01, 'Now with 400% more taurine and 0% more sleep.'],
  ['Pizza Night', 1e7, 0.01, 'Pineapple is a valid strategy.'],
  ['Gamer Fuel Powder', 5e7, 0.02, 'Tastes like blue.'],
  ['Protein Bars', 1e8, 0.02, 'For the gains. The APM gains.'],
  ['Bubble Tea Runs', 5e8, 0.02, 'Extra boba. Extra clutch.'],
  ['Sushi Platters', 1e9, 0.02, 'Chopsticks improve fine motor control. Probably.'],
  ["Chef's Tasting Menu", 5e9, 0.02, 'Seven courses, all served next to the keyboard.'],
  ['Hydration Station', 1e10, 0.03, 'Water. Revolutionary.'],
  ['Smoothie Bar', 5e10, 0.03, 'Kale, banana and pure determination.'],
  ['Keto Esports Diet', 1e11, 0.03, 'Carbs are nerfed this patch.'],
  ['Wagyu Wednesdays', 5e11, 0.03, 'Marbled like a clutch highlight reel.'],
  ['Astronaut Ice Cream', 1e12, 0.04, 'Freeze-dried for zero-gravity scrims.'],
  ['Molecular Gastronomy', 5e12, 0.04, 'Foam. Everything is foam now.'],
  ['Lab-Grown Steak', 1e13, 0.04, 'Grown right next to the Clone Academy. Different vat. Probably.'],
  ['Nutrient Paste (Delicious)', 5e13, 0.04, 'Contains every vitamin and at least one flavour.'],
  ['Ambrosia Energy', 1e14, 0.05, 'Drink of the gods. Sugar free.'],
  ['Nebula Nachos', 1e15, 0.05, 'Cheese harvested from a dying star.'],
  ['Quantum Quesadillas', 1e16, 0.05, 'Both delicious and disgusting until observed.'],
  ['Dark Matter Donuts', 1e17, 0.05, 'Heavier than they look.'],
  ['Singularity Soup', 1e18, 0.05, 'Infinitely dense broth.'],
  ['Multiverse Munchies', 1e19, 0.05, 'Snacks from every reality, including the one where chips are healthy.'],
  ['Heat Death Hot Sauce', 1e21, 0.05, 'The last flavour in the universe.'],
  ['Big Bang Brunch', 1e23, 0.05, 'Where it all began.'],
];

SNACKS.forEach(([name, cost, pct, flavor], i) => {
  add({
    id: `snack_${i}`,
    name,
    group: 'snack',
    icon: i % 3 === 0 ? 'pizza' : i % 3 === 1 ? 'utensils' : 'coffee',
    tier: Math.min(11, Math.floor(i / 2)),
    cost,
    effects: [{ kind: 'globalPct', pct }],
    flavor,
    requirement: `Earn ${(cost / 5).toExponential(0).replace('e+', 'e')} cash this run`,
    unlock: (s) => s.earnedRun >= cost / 5,
  });
});

// ---------------------------------------------------------------------------
// Fame: fans boost income more strongly
// ---------------------------------------------------------------------------
const FAME_LINE: [string, number, number, number, string][] = [
  ['Discord Server', 50, 5_000, 0.01, 'Rule 1: be nice. Rule 2: no, seriously.'],
  ['Fan Subreddit', 500, 200_000, 0.01, 'Mostly memes. Occasionally tactical analysis. Mostly memes.'],
  ['Fan Art Wall', 5_000, 2e7, 0.015, 'Some of it is anatomically ambitious.'],
  ['Meet & Greets', 50_000, 2e9, 0.015, 'Signing merch until the Sharpie runs dry.'],
  ['Fan Conventions', 5e5, 2e11, 0.02, 'Cosplayers outnumber attendees 3 to 1.'],
  ['Stan Accounts', 5e6, 2e13, 0.02, 'They know your players’ birthdays better than their mums.'],
  ['Superfan Tattoos', 5e7, 2e15, 0.025, 'Permanent loyalty. Semi-permanent regret.'],
  ['Fan-Owned Shares', 5e8, 2e17, 0.025, 'Every fan is now technically your boss.'],
  ['Cult Following', 5e9, 2e19, 0.03, 'Robes are optional. Jerseys are not.'],
  ['Global Fandom', 5e10, 2e21, 0.03, 'Every country has a {org} fan club.'],
  ['Interplanetary Fandom', 5e11, 2e23, 0.03, 'Mars colony chants in low gravity.'],
  ['Fandom Singularity', 5e12, 2e25, 0.04, 'Fans have become a single, loving hive mind.'],
];

FAME_LINE.forEach(([name, fans, cost, add_, flavor], i) => {
  add({
    id: `fame_${i}`,
    name,
    group: 'fame',
    icon: 'heart',
    tier: i,
    cost,
    effects: [{ kind: 'fameExp', add: add_ }],
    flavor,
    requirement: `Reach ${fans.toLocaleString('en-US')} fans this run`,
    unlock: (s) => s.fansRun >= fans,
  });
});

// ---------------------------------------------------------------------------
// Superfans: income scales with the trophy cabinet (achievements)
// ---------------------------------------------------------------------------
const SUPERFANS: [string, number, number, number, string][] = [
  ['Superfan Volunteers', 13, 9e6, 0.1, 'They hand out flyers. Nobody asked them to.'],
  ['Superfan Street Team', 25, 9e9, 0.125, 'Wheat-pasting your logo on every surface.'],
  ['Superfan Moderators', 50, 9e13, 0.15, 'Unpaid. Unstoppable. Slightly power-mad.'],
  ['Superfan Artists', 75, 9e16, 0.175, 'Your logo, reimagined in 400 styles.'],
  ['Superfan Analysts', 100, 9e19, 0.2, 'Spreadsheets of every match you’ve ever played.'],
  ['Superfan Cosplayers', 125, 9e22, 0.2, 'Foam armour so detailed it has patch notes.'],
  ['Superfan Influencers', 150, 9e25, 0.2, 'Every post: #ad (not actually sponsored).'],
  ['Superfan Council', 175, 9e28, 0.2, 'A democratically elected body of screamers.'],
  ['Superfan Pantheon', 200, 9e31, 0.2, 'Ascended beyond mere fandom.'],
];

SUPERFANS.forEach(([name, need, cost, factor, flavor], i) => {
  add({
    id: `superfan_${i}`,
    name,
    group: 'superfan',
    icon: 'star',
    tier: i + 2,
    cost,
    effects: [{ kind: 'superfan', factor }],
    flavor,
    requirement: `Unlock ${need} achievements`,
    unlock: (s) => Object.keys(s.achievements).length >= need,
  });
});

// ---------------------------------------------------------------------------
// Teams, roster and gear
// ---------------------------------------------------------------------------
const matchesPlayed = (s: GameState): number => s.stats.matchesWon + s.stats.matchesLost;

const PRIZE_LINE: [string, number, number, string][] = [
  ['Prize Pool Analyst', 10, 5_000, 'Knows exactly which tournaments actually pay out.'],
  ['Bracket Lawyer', 60, 500_000, 'Finds a loophole in every rulebook.'],
  ['Appearance Fees', 250, 5e7, 'Paid just for turning up.'],
  ['Broadcast Revenue Share', 800, 5e9, 'A slice of every ad break.'],
  ['Crowdfunded Prize Pools', 2_500, 5e11, 'The fans chip in. A lot.'],
  ['Franchise Revenue', 7_000, 5e13, 'Guaranteed money, guaranteed drama.'],
  ['Orbital Tax Loophole', 20_000, 5e15, "Prize money isn't taxed in low orbit."],
  ['Multiversal Purse', 60_000, 5e18, 'Winnings from every timeline, deposited here.'],
];
PRIZE_LINE.forEach(([name, wins, cost, flavor], i) => {
  add({
    id: `prize_${i}`,
    name,
    group: 'team',
    icon: 'trophy',
    tier: i + 1,
    cost,
    effects: [{ kind: 'prizeMult', mult: 2 }],
    flavor,
    requirement: `Win ${wins.toLocaleString('en-US')} matches`,
    unlock: (s) => s.stats.matchesWon >= wins,
  });
});

const XP_LINE: [string, number, number, number, string][] = [
  ['VOD Review Sessions', 25, 20_000, 1.5, 'Pause. Rewind. "Why did you peek there?"'],
  ['Pro Coaching Clips', 300, 5e7, 1.5, 'Ten-minute lessons from people who hit Challenger once.'],
  ['Replay Analysis AI', 2_000, 5e11, 2, 'It watched every match ever played. It has notes.'],
  ['Hive-Mind Training', 10_000, 5e16, 2, 'What one player learns, all players know.'],
];
XP_LINE.forEach(([name, matches, cost, mult, flavor], i) => {
  add({
    id: `xp_${i}`,
    name,
    group: 'team',
    icon: 'dumbbell',
    tier: i * 2 + 1,
    cost,
    effects: [{ kind: 'xpMult', mult }],
    flavor,
    requirement: `Play ${matches.toLocaleString('en-US')} matches`,
    unlock: (s) => matchesPlayed(s) >= matches,
  });
});

const TEMPO_LINE: [string, number, number, number, string][] = [
  ['Tight Match Schedule', 100, 2e6, 1.15, 'Less downtime, more game time.'],
  ['Back-to-Back Series', 1_500, 2e10, 1.15, 'Finish one bracket, start the next.'],
  ['Parallel Matches', 8_000, 2e14, 1.2, 'Playing two matches at once is technically allowed.'],
];
TEMPO_LINE.forEach(([name, matches, cost, mult, flavor], i) => {
  add({
    id: `tempo_${i}`,
    name,
    group: 'team',
    icon: 'clock',
    tier: i * 3 + 2,
    cost,
    effects: [{ kind: 'matchSpeed', mult }],
    flavor,
    requirement: `Play ${matches.toLocaleString('en-US')} matches`,
    unlock: (s) => matchesPlayed(s) >= matches,
  });
});

const ROSTER_LINE: { name: string; signed: number; cost: number; effects: Effect[]; flavor: string }[] = [
  { name: 'Folding Chairs', signed: 2, cost: 2_000, effects: [{ kind: 'benchSlots', add: 1 }], flavor: 'The bench is literally a bench.' },
  { name: 'Scouting Notebook', signed: 3, cost: 15_000, effects: [{ kind: 'scoutLuck', add: 0.1 }], flavor: 'Names, ranks and suspicious win rates.' },
  { name: "Substitutes' Lounge", signed: 8, cost: 2e6, effects: [{ kind: 'benchSlots', add: 1 }], flavor: 'Beanbags, snacks and a view of the stage.' },
  {
    name: 'Talent Database',
    signed: 15,
    cost: 5e7,
    effects: [
      { kind: 'scoutLuck', add: 0.15 },
      { kind: 'marketSize', add: 2 },
    ],
    flavor: 'Every ranked ladder, scraped nightly.',
  },
  { name: 'Academy Pipeline', signed: 25, cost: 2e10, effects: [{ kind: 'benchSlots', add: 1 }], flavor: "Today's academy kid is tomorrow's MVP." },
  {
    name: 'Global Scouting Network',
    signed: 40,
    cost: 5e11,
    effects: [
      { kind: 'scoutLuck', add: 0.25 },
      { kind: 'marketSize', add: 2 },
    ],
    flavor: 'Scouts in every internet café on Earth.',
  },
];
ROSTER_LINE.forEach((u, i) => {
  add({
    id: `roster_${i}`,
    name: u.name,
    group: 'roster',
    icon: u.effects[0].kind === 'benchSlots' ? 'users' : 'search',
    tier: i + 1,
    cost: u.cost,
    effects: u.effects,
    flavor: u.flavor,
    requirement: `Sign ${u.signed} players`,
    unlock: (s) => s.stats.playersSigned >= u.signed,
  });
});

const FANCAM_LINE: [string, number, number, number, string][] = [
  ['Player Cams', 30, 200_000, 2, 'Fans love watching people panic in real time.'],
  ['Personal Brand Coaching', 500, 2e9, 2, 'Lesson one: never read the replies.'],
  ['Documentary Series', 3_000, 2e13, 3, 'Twelve episodes of dramatic slow motion.'],
];
FANCAM_LINE.forEach(([name, wins, cost, mult, flavor], i) => {
  add({
    id: `fancam_${i}`,
    name,
    group: 'roster',
    icon: 'video',
    tier: i * 3 + 3,
    cost,
    effects: [{ kind: 'playerFans', mult }],
    flavor,
    requirement: `Win ${wins.toLocaleString('en-US')} matches`,
    unlock: (s) => s.stats.matchesWon >= wins,
  });
});

const GEAR_LINE: [string, number, number, number, string][] = [
  ['Bulk Hardware Deals', 20, 50_000, 0.9, 'Buy ten mice, get one mouse pad free.'],
  ['Manufacturer Partnership', 120, 5e8, 0.85, 'Prototypes arrive before the press embargo lifts.'],
  ['In-House Hardware Lab', 500, 5e13, 0.8, 'Why buy the best gear when you can invent it?'],
];
GEAR_LINE.forEach(([name, bought, cost, mult, flavor], i) => {
  add({
    id: `gearcost_${i}`,
    name,
    group: 'gear',
    icon: 'cpu',
    tier: i * 3 + 2,
    cost,
    effects: [{ kind: 'gearCostMult', mult }],
    flavor,
    requirement: `Buy ${bought} gear upgrades`,
    unlock: (s) => s.stats.gearBought >= bought,
  });
});

export const UPGRADES: UpgradeDef[] = defs;
export const UPGRADE_MAP: Map<string, UpgradeDef> = new Map(defs.map((d) => [d.id, d]));
