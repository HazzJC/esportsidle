import { fmt, money } from '../engine/format';
import { AUTOMATIONS } from './automation';
import { OPERATIONS } from './operations';
import { SEASON_LENGTH, TITLE_WINS, tierName } from './leagues';
import { automationUnlocked } from '../engine/automation';
import { promotionElo, teamElo, tierElo } from '../engine/elo';
import { MERCH_UNLOCK_FANS, inSweetSpot } from '../engine/merch';
import { FINAL_OPERATION, canSell, legacyUnlocked, pendingLegacy } from '../engine/prestige';
import { sectionReady } from '../engine/sections';
import { goalProgress } from '../engine/sponsors';
import { isStaffUnlocked } from '../engine/staff';
import type { Effect, GameState } from '../engine/types';
import { STAFF } from './staff';

/**
 * Every mechanic a player can be taught. The first run's quest line is a tour: each quest makes the
 * player use one of these once (docs/quest-tour.md), and a test checks that every one is taught by
 * some quest. Training is taught by the season plan and the player screen rather than a quest.
 */
export const MECHANICS = [
  'operations',
  'upgrades',
  'clicking',
  'drops',
  'gear',
  'staff',
  'scouting',
  'lineup',
  'seasonPlan',
  'merchDesign',
  'merchPricing',
  'jersey',
  'decor',
  'sponsors',
  'sponsorGoals',
  'events',
  'teams',
  'promotion',
  'leagueTitle',
  'invitationals',
  'rival',
  'playerSales',
  'trophies',
  'automation',
  'empire',
  'sale',
] as const;
export type Mechanic = (typeof MECHANICS)[number];

/**
 * Tools and tokens a quest can hand out: named things that do one job in the system the quest
 * taught. A tool is kept for the run; a token is used up (the count goes down when it is spent).
 * The systems that read them look them up by id with `hasTool` and `useToken` (engine/quests.ts).
 */
export const QUEST_TOOLS = {
  /** See the next merch trend one rotation ahead. */
  trend_tip: { label: 'Trend tip', icon: 'shirt', consumable: false, desc: 'The Studio shows the next merch trend before it arrives.' },
  /** One rarer prospect on the Market shortlist. */
  scout_choice: { label: "Scout's choice", icon: 'search', consumable: true, desc: 'A star prospect waits on the transfer market when it opens.' },
  /** A guaranteed sponsor offer one tier up. */
  sponsor_meeting: { label: 'Sponsor meeting', icon: 'handshake', consumable: true, desc: 'The next batch of offers includes a brand from the highest tier you qualify for.' },
  /** Blocks one scandal. */
  pr_shield: { label: 'PR shield', icon: 'shield', consumable: true, desc: 'The next Drama Drop that would hurt you is buried before it runs.' },
  /** One guaranteed Invitational invite. */
  wildcard_invite: { label: 'Wildcard invite', icon: 'medal', consumable: true, desc: 'The next Hype Drop you catch is an Invitational invite.' },
  /** An edge in grudge matches. */
  rival_file: { label: 'Rival file', icon: 'swords', consumable: false, desc: 'Your teams know the rival: +10 points of win chance in grudge matches.' },
} as const;
export type QuestToolId = keyof typeof QUEST_TOOLS;

/** An operation affinity doubles the operation if the org owns one, or else discounts its first units. */
export const AFFINITY_MULT = 2;
export const AFFINITY_UNITS = 10;
export const AFFINITY_DISCOUNT = 0.75;

/**
 * What a finished quest pays. Early quests pay one clear reward, so nobody has to choose between
 * things they have not seen yet; later quests offer a choice between two that the player will have
 * met by then. Choices should be of different kinds (a tool, a perk, a cosmetic), never two
 * quantities of the same thing.
 */
export type QuestReward =
  /** Cash worth this many seconds of current income, and never less than `min`. */
  | { kind: 'cash'; seconds: number; min: number }
  /** Fans worth this many seconds of current fan growth, and never fewer than `min`. */
  | { kind: 'fans'; seconds: number; min: number }
  | { kind: 'trophies'; amount: number }
  /** Every player on the roster gains this many levels. */
  | { kind: 'levels'; amount: number }
  | { kind: 'legacy'; amount: number }
  /** A bonus that lasts for the rest of the run; selling the org resets the quest line and its perks. */
  | { kind: 'perk'; label: string; effects: Effect[] }
  /** A named tool (kept for the run) or token (used up), in the system the quest taught. */
  | { kind: 'tool'; id: QuestToolId; amount?: number }
  /** The operation most like the quest's mechanic: ×AFFINITY_MULT if owned, else its first units cheaper. */
  | { kind: 'opAffinity'; op: string }
  /** A cosmetic unlock (jersey pattern, emblem mark, palette, decor piece), kept across sales. */
  | { kind: 'cosmetic'; id: string; label: string }
  /** A title for the org, kept across sales. */
  | { kind: 'title'; id: string; label: string }
  /**
   * Says what claiming the quest wakes up in a guided first run (engine/firstRun.ts), so the reward
   * shows what comes next. Nothing is paid: the system wakes because the quest was claimed.
   */
  | { kind: 'unlock'; label: string; detail: string; icon: string };

export type QuestRewardKind = QuestReward['kind'];

/** Where a quest's "Show me" leads: a tab, the store, a player's kit, the logo. */
export type QuestHint =
  | 'store'
  | 'upgrades'
  | 'logo'
  | 'player'
  | 'plan'
  | 'found'
  | 'bench'
  | 'levels'
  | 'merch'
  | 'routines'
  | 'teams'
  | 'market'
  | 'staff'
  | 'house'
  | 'studio'
  | 'sponsors';

/** A stretch of the first run with a name and a line of story, shown on the quest console. */
export interface QuestChapter {
  title: string;
  icon: string;
  /** One line of story when the chapter begins. */
  intro: string;
}

/**
 * The first run as a story in six chapters. The first ones are short, a quest every minute or two;
 * the later ones are things to work towards, each with a meter.
 */
export const CHAPTERS: QuestChapter[] = [
  { title: 'Garage days', icon: 'gamepad-2', intro: 'A logo, a dream and one player. Get money coming in while you are not looking.' },
  { title: 'Making a name', icon: 'trophy', intro: 'The org pays its way. Now win something, and find out what trophies are for.' },
  { title: 'Building a squad', icon: 'users', intro: 'Tougher leagues need a deeper roster, people behind it and a second game.' },
  { title: 'The brand', icon: 'shirt', intro: 'Two teams and a following: time to look, sell and behave like a real org.' },
  { title: 'The circuit', icon: 'medal', intro: 'Bigger stages, a rival, a climb up the leagues and a business to run. These take longer; the meters show how close you are.' },
  { title: 'The big exit', icon: 'crown', intro: 'Grow the org until someone wants to buy it, and start again stronger.' },
];

/** How far along a quest that takes a while is, for its meter. */
export interface QuestMeter {
  value: number;
  target: number;
  text: string;
}

export interface QuestDef {
  id: string;
  /** The chapter it belongs to (`CHAPTERS` index). Quests run chapter by chapter, in line order. */
  chapter: number;
  title: string;
  desc: string;
  icon: string;
  /** The quest's emblem on the HQ console and its perk card: a drawing in `ui/questArt.ts`. */
  art: string;
  /** The mechanic the quest makes the player use. */
  mechanic: Mechanic;
  /**
   * The number the quest watches. Delta quests count from the moment the quest is offered (so an
   * all-time stat works); absolute quests read the value as it stands.
   */
  metric: (s: GameState) => number;
  target: number;
  mode: 'delta' | 'absolute';
  /**
   * In the first run, a delta quest that counts what has already happened this run: a milestone a
   * quick org can reach just before the line arrives (a title, a promotion) is credited rather than
   * asked for again. The line is ordered so that most orgs meet these after the quest arrives.
   */
  credit?: boolean;
  /**
   * Offered only when this is true, so a quest is always something the player can act on. In the first
   * run the line is followed strictly in order: a quest that is not available yet holds the line, and
   * the board says what it is waiting for (`waiting`, or the requirement of the section it opens).
   */
  available?: (s: GameState) => boolean;
  /** What the line is waiting for while this quest is not available yet, with progress when it has a number. */
  waiting?: (s: GameState) => { text: string; value?: number; target?: number };
  /** A quest that waits on chance (a rival turning up) never holds the line: it is skipped and comes back. */
  skipWhileLocked?: boolean;
  /** For a quest that takes a while: how close the org is, shown as a meter while it is live. */
  meter?: (s: GameState) => QuestMeter | null;
  /** A concrete next step, shown once the quest has been live for `STUCK_SECONDS` without finishing. */
  stuck?: (s: GameState) => string | null;
  /** What the board's "Show me" button points at, and what pulses while the quest is live. */
  hint?: QuestHint;
  rewards: [QuestReward] | [QuestReward, QuestReward];
  /** Paid on top of the chosen reward, every time: an operation affinity, a cosmetic, a title, or what it wakes. */
  bonus?: QuestReward[];
}

const cash = (minutes: number, min: number): QuestReward => ({ kind: 'cash', seconds: minutes * 60, min });
const fans = (minutes: number, min: number): QuestReward => ({ kind: 'fans', seconds: minutes * 60, min });
const trophies = (amount: number): QuestReward => ({ kind: 'trophies', amount });
const levels = (amount: number): QuestReward => ({ kind: 'levels', amount });
const perk = (label: string, ...effects: Effect[]): QuestReward => ({ kind: 'perk', label, effects });
const tool = (id: QuestToolId, amount?: number): QuestReward => ({ kind: 'tool', id, ...(amount ? { amount } : {}) });
const affinity = (op: string): QuestReward => ({ kind: 'opAffinity', op });
const unlock = (label: string, detail: string, icon: string): QuestReward => ({ kind: 'unlock', label, detail, icon });

const hasPlayer = (s: GameState) => Object.keys(s.players).length > 0;
const teamsWithPlayers = (s: GameState) => Object.values(s.teams).filter((t) => t.lineup.some((id) => id !== null)).length;
const sellable = (s: GameState) => Object.values(s.players).filter((p) => !p.founder).length;
const benchFilled = (s: GameState) => Object.values(s.teams).some((t) => t.bench.length > 0);
const opTypesOwned = (s: GameState) => OPERATIONS.filter((op) => s.ops[op.id]?.owned > 0).length;
const nextNewOperation = (s: GameState) => OPERATIONS.find((op) => !(s.ops[op.id]?.owned > 0));
const merchSelling = (s: GameState) => Object.values(s.merch.lines).filter((l) => l.designId).length;

/** The team closest to promotion: the most Elo above its tier's line, as a share of the gap to promotion. */
function promotionMeter(s: GameState): QuestMeter | null {
  let best: { share: number; elo: number; need: number; tier: number } | null = null;
  for (const team of Object.values(s.teams)) {
    if (!team.lineup.some((id) => id !== null)) continue;
    const elo = teamElo(team);
    const floor = tierElo(team.tier) - 150;
    const need = promotionElo(team.tier);
    const share = Math.max(0, Math.min(1, (elo - floor) / Math.max(1, need - floor)));
    if (!best || share > best.share) best = { share, elo, need, tier: team.tier };
  }
  if (!best) return null;
  return { value: Math.round(best.share * 100), target: 100, text: `Best team: Elo ${Math.round(best.elo)} of ${Math.round(best.need)} to leave the ${tierName(best.tier)}` };
}

/** The season most likely to bring a title: the most wins with enough matches left to reach `TITLE_WINS`. */
function titleMeter(s: GameState): QuestMeter | null {
  let best = -1;
  for (const team of Object.values(s.teams)) {
    const left = SEASON_LENGTH - team.seasonPlayed;
    const losses = team.seasonPlayed - team.seasonWins;
    if (losses > SEASON_LENGTH - TITLE_WINS || team.seasonWins + left < TITLE_WINS) continue;
    best = Math.max(best, team.seasonWins);
  }
  if (best < 0) return { value: 0, target: TITLE_WINS, text: `No team can reach ${TITLE_WINS} wins this season: the next one is a fresh start` };
  return { value: best, target: TITLE_WINS, text: `Best season so far: ${best} of ${TITLE_WINS} wins, with no more than ${SEASON_LENGTH - TITLE_WINS} losses` };
}

/**
 * The milestones every org should hit, in the order the first run meets them, chapter by chapter.
 * Several quests open the system they teach (engine/sections.ts `quest`), and in a guided first run
 * others wake a system that has been asleep until then (engine/firstRun.ts), so each one arrives with
 * an explanation and something to do. One quest is on the board at a time (`QUEST_SLOTS`); claiming it
 * brings in the next. Each reward leads into what comes next: a perk for the system just learned, or a
 * tool for the next one. Selling the org starts the line again, and the perks it paid go with the run.
 */
export const QUESTS: QuestDef[] = [
  // -- Chapter 1: Garage days. Short steps on the passive side, then the first drop and the first kit. --
  {
    id: 'grinders_10',
    chapter: 0,
    title: 'Grinder squad',
    desc: 'Own 10 Ranked Grinders. Each one earns a little every second, even while the game is closed.',
    icon: 'gamepad-2',
    art: 'op:grinder',
    mechanic: 'operations',
    metric: (s) => s.ops.grinder?.owned ?? 0,
    target: 10,
    mode: 'absolute',
    hint: 'store',
    rewards: [perk('Ranked Grinders earn twice as much', { kind: 'opMult', op: 'grinder', mult: 2 })],
  },
  {
    id: 'upgrades_3',
    chapter: 0,
    title: 'Read the patch notes',
    desc: 'Buy 3 upgrades from the top of the store. Upgrades are one-off purchases that multiply what you already own.',
    icon: 'sparkles',
    art: 'patch-notes',
    mechanic: 'upgrades',
    metric: (s) => s.stats.upgradesBoughtTotal,
    target: 3,
    mode: 'delta',
    hint: 'upgrades',
    rewards: [perk('Clicks earn twice as much', { kind: 'clickMult', mult: 2 })],
  },
  {
    id: 'crowd_1',
    chapter: 0,
    title: 'Hype streak',
    desc: 'Fill the hype meter until the crowd goes wild: income doubles while it lasts. While this quest is live the crowd warms up by itself to 80%, so a few clicks finish it.',
    icon: 'megaphone',
    art: 'upgrade:megaphone',
    mechanic: 'clicking',
    metric: (s) => s.stats.crowdsTotal,
    target: 1,
    mode: 'delta',
    hint: 'logo',
    rewards: [perk('The crowd goes wild for 50% longer', { kind: 'hypeDuration', mult: 1.5 })],
    bonus: [unlock('Hype Drops start falling', 'The buzz draws attention: glowing drops float across the screen', 'zap')],
  },
  {
    id: 'drop_1',
    chapter: 0,
    title: 'Catch the drop',
    desc: 'Click a Hype Drop, the glowing icon that floats across the screen now and then. One is on its way.',
    icon: 'zap',
    art: 'upgrade:zap',
    mechanic: 'drops',
    metric: (s) => s.stats.dropsClicked,
    target: 1,
    mode: 'delta',
    rewards: [perk('Hype Drops appear 20% more often', { kind: 'dropInterval', mult: 0.8 })],
  },
  {
    id: 'gear_1',
    chapter: 0,
    title: 'Gear up',
    desc: 'Buy a gear upgrade for a player: click your player in the Teams tab to open their kit, then upgrade any item.',
    icon: 'cpu',
    art: 'gear-up',
    mechanic: 'gear',
    metric: (s) => s.stats.gearBought,
    target: 1,
    mode: 'delta',
    available: hasPlayer,
    hint: 'player',
    rewards: [levels(2)],
  },

  // -- Chapter 2: Making a name. The first title, and the trophies it brings. --
  {
    id: 'title_1',
    chapter: 1,
    title: 'League champions',
    desc: 'Win a league title: 15 wins in a 16-match season. Better gear and a stronger player make it come sooner.',
    icon: 'trophy',
    art: 'upgrade:trophy',
    mechanic: 'leagueTitle',
    metric: (s) => s.stats.seasonTitles,
    target: 1,
    mode: 'delta',
    credit: true,
    available: hasPlayer,
    meter: titleMeter,
    stuck: (s) => {
      const team = Object.values(s.teams).find((t) => t.lineup.some((id) => id !== null));
      if (!team) return null;
      return team.tier > 0
        ? `A title is hard in the ${tierName(team.tier)}. Upgrade your player's gear, or use Drop tier on the Teams tab for an easier league.`
        : 'Upgrade your player’s gear on the Teams tab: every item makes a 15-win season more likely.';
    },
    hint: 'player',
    rewards: [trophies(2)],
    bonus: [unlock('Team controls', 'Drop tier, Challenge, Auto-promote and Auto-sub appear on each team', 'sliders-horizontal')],
  },
  {
    id: 'trophies_1',
    chapter: 1,
    title: 'Trophy room',
    desc: 'The Trophies tab is open: every trophy and achievement on one shelf. Trophies are also currency: spend one on an operation in HQ to level it up, +1% for good.',
    icon: 'star',
    art: 'upgrade:star',
    mechanic: 'trophies',
    metric: (s) => s.stats.opLevels,
    target: 1,
    mode: 'delta',
    available: (s) => sectionReady(s, 'achievements'),
    hint: 'levels',
    rewards: [perk('Players earn 10% more XP', { kind: 'xpMult', mult: 1.1 }), trophies(3)],
    bonus: [tool('scout_choice')],
  },
  // -- Chapter 3: Building a squad. A signing, putting them to work, staff, a plan and a second game. --
  {
    id: 'scout_1',
    chapter: 2,
    title: 'Scout the market',
    desc: 'The transfer market is open. Sign a player there: each card shows how they would change your win chance. New signings start on the bench.',
    icon: 'user-plus',
    art: 'scout',
    mechanic: 'scouting',
    metric: (s) => s.stats.playersSigned,
    target: 1,
    mode: 'delta',
    available: (s) => sectionReady(s, 'market'),
    hint: 'market',
    rewards: [perk('One more seat on every bench', { kind: 'benchSlots', add: 1 })],
  },
  {
    id: 'lineup_1',
    chapter: 2,
    title: 'Best on the field',
    desc: 'Your signing is waiting on the bench. Drag them onto a desk in the Teams tab to start them: the player they replace takes the bench and rests.',
    icon: 'users',
    art: 'upgrade:users',
    mechanic: 'lineup',
    metric: (s) => s.stats.lineupMoves,
    target: 1,
    mode: 'delta',
    available: benchFilled,
    waiting: () => ({ text: 'Sign a player for the bench first' }),
    hint: 'bench',
    rewards: [perk('Players tire 10% slower', { kind: 'energyDrain', mult: 0.9 }), levels(2)],
    bonus: [unlock('Knocks and colds', 'Players can now pick up injuries and illnesses: the bench heals them twice as fast', 'bandage')],
  },
  {
    id: 'staff_1',
    chapter: 2,
    title: 'Hire help',
    desc: 'Staff are open. Hire a Coach: staff help every team at once, and each kind brings a handy tool with their first hire. Your Coach posts a game plan of next steps on the Staff page.',
    icon: 'briefcase',
    art: 'staff',
    mechanic: 'staff',
    metric: (s) => s.stats.staffHired,
    target: 1,
    mode: 'delta',
    available: (s) => sectionReady(s, 'staff') && STAFF.some((d) => isStaffUnlocked(s, d)),
    hint: 'staff',
    rewards: [perk('Staff cost 10% less to hire', { kind: 'staffCostMult', mult: 0.9 })],
  },
  {
    id: 'plan_1',
    chapter: 2,
    title: 'Have a plan',
    desc: 'Set a team to the Development or Push for Promotion season plan in the Teams tab. Development trains players faster; Push wins more now.',
    icon: 'clipboard-list',
    art: 'clipboard',
    mechanic: 'seasonPlan',
    metric: (s) => (Object.values(s.teams).some((t) => t.plan !== 'balanced' || (t.nextPlan && t.nextPlan !== 'balanced')) ? 1 : 0),
    target: 1,
    mode: 'absolute',
    available: hasPlayer,
    hint: 'plan',
    rewards: [levels(2), perk('Players earn 15% more XP', { kind: 'xpMult', mult: 1.15 })],
  },
  {
    id: 'second_team',
    chapter: 2,
    title: 'Branch out',
    desc: 'Found a second team in the Teams tab and sign a player for it. Every game has its own league, prizes and fans.',
    icon: 'flag',
    art: 'pennant',
    mechanic: 'teams',
    metric: teamsWithPlayers,
    target: 2,
    mode: 'absolute',
    hint: 'found',
    rewards: [perk('Match prize money +10%', { kind: 'prizeMult', mult: 1.1 }), fans(8, 5_000)],
    bonus: [unlock('The scene notices you', 'World events begin: meta shifts, patches, viral moments and sales', 'globe')],
  },

  // -- Chapter 4: The brand. A home, a kit, sponsors, the first hard call, and merch to sell. --
  {
    id: 'decor_1',
    chapter: 3,
    title: 'Make it home',
    desc: 'Two teams need a home: the House is open. Buy a piece of decor. Decor helps every player, and a bigger house fits better pieces.',
    icon: 'house',
    art: 'house',
    mechanic: 'decor',
    metric: (s) => s.stats.decorBought,
    target: 1,
    mode: 'delta',
    available: (s) => sectionReady(s, 'house'),
    hint: 'house',
    rewards: [perk('Gear costs 15% less', { kind: 'gearCostMult', mult: 0.85 }), fans(20, 2_000)],
  },
  {
    id: 'design_shirt',
    chapter: 3,
    title: 'Design a shirt',
    desc: 'The Studio is open. Draw a design and set it as your team jersey: your players wear it, and fans notice.',
    icon: 'shirt',
    art: 'upgrade:shirt',
    mechanic: 'jersey',
    metric: (s) => (s.org.jersey ? 1 : 0),
    target: 1,
    mode: 'absolute',
    available: (s) => sectionReady(s, 'studio'),
    hint: 'studio',
    rewards: [perk('+10% fans from everything', { kind: 'fansMult', mult: 1.1 }), affinity('creator')],
  },
  {
    id: 'sponsor_1',
    chapter: 3,
    title: 'Take the money',
    desc: 'Sponsors are open. Three snack brands want your first deal, each with a different perk. Read what they do, then sign one.',
    icon: 'handshake',
    art: 'upgrade:handshake',
    mechanic: 'sponsors',
    metric: (s) => s.stats.sponsorsSigned,
    target: 1,
    mode: 'delta',
    available: (s) => sectionReady(s, 'sponsors'),
    hint: 'sponsors',
    rewards: [perk('One more sponsor slot', { kind: 'sponsorSlots', add: 1 }), fans(10, 5_000)],
  },
  {
    id: 'sponsor_goal',
    chapter: 3,
    title: 'Deliver for the sponsor',
    desc: 'Complete a sponsor goal before the contract runs out. The bonus is paid the moment the goal is met.',
    icon: 'target',
    art: 'target',
    mechanic: 'sponsorGoals',
    metric: (s) => s.stats.sponsorGoals,
    target: 1,
    mode: 'delta',
    available: (s) => s.sponsors.active.length > 0,
    waiting: () => ({ text: 'Sign a sponsor in the Sponsors tab' }),
    meter: (s) => {
      let best: QuestMeter | null = null;
      for (const c of s.sponsors.active) {
        if (c.completed) continue;
        const value = Math.min(c.goal.target, goalProgress(s, c));
        if (!best || value / c.goal.target > best.value / best.target) best = { value, target: c.goal.target, text: `Closest goal: ${fmt(value)} of ${fmt(c.goal.target)}` };
      }
      return best;
    },
    stuck: () => 'Each deal names its goal on the Sponsors tab. A deal that runs out unmet pays nothing, so sign one whose goal suits how you play.',
    hint: 'sponsors',
    rewards: [tool('sponsor_meeting'), perk('Sponsor income +15%', { kind: 'sponsorIncome', mult: 1.15 })],
  },
  {
    id: 'event_1',
    chapter: 3,
    title: 'A tough call',
    desc: 'A growing org gets noticed, and some news needs an answer. A decision card is on its way: read the options and pick one before its timer runs out.',
    icon: 'shuffle',
    art: 'upgrade:shield',
    mechanic: 'events',
    metric: (s) => s.stats.choicesMade,
    target: 1,
    mode: 'delta',
    rewards: [tool('pr_shield')],
    bonus: [unlock('Drama Drops', 'Red drops start to fall: a gamble that pays well or blows up. Your PR shield buries the first bad one', 'flame')],
  },
  {
    id: 'merch_1',
    chapter: 3,
    title: 'Merch drop',
    desc: 'Merch is open in the Studio. Launch a product and put one of your designs on it: a line with no design sells nothing.',
    icon: 'shirt',
    art: 'merch-bag',
    mechanic: 'merchDesign',
    metric: merchSelling,
    target: 1,
    mode: 'absolute',
    available: (s) => s.fansRun >= MERCH_UNLOCK_FANS || Object.keys(s.merch.unlocked).length > 0,
    waiting: (s) => ({ text: `Merch opens at ${fmt(MERCH_UNLOCK_FANS)} fans (${fmt(s.fansRun)} so far)`, value: Math.min(MERCH_UNLOCK_FANS, s.fansRun), target: MERCH_UNLOCK_FANS }),
    stuck: (s) => (Object.keys(s.merch.lines).length > 0 ? 'Your product is on sale with no design: pick one from the menu on its card in the Studio.' : null),
    hint: 'merch',
    rewards: [tool('trend_tip'), fans(15, 10_000)],
  },
  {
    id: 'merch_price',
    chapter: 3,
    title: 'Price it right',
    desc: 'Every line has a sweet spot, shown under its price slider: charge too little and you give money away, too much and nobody buys. Set a line to its sweet spot. Designs on trend can charge more.',
    icon: 'tag',
    art: 'cash',
    mechanic: 'merchPricing',
    metric: (s) => Object.values(s.merch.lines).filter((l) => inSweetSpot(s, l)).length,
    target: 1,
    mode: 'absolute',
    available: (s) => merchSelling(s) > 0,
    waiting: () => ({ text: 'Put a design on a merch line first' }),
    hint: 'merch',
    rewards: [perk('Merch sells 20% more', { kind: 'merchMult', mult: 1.2 }), affinity('platform')],
  },

  // -- Chapter 5: The circuit. Longer goals with meters: Invitationals, a rival, the business. --
  {
    id: 'tourney_1',
    chapter: 4,
    title: 'Invitational winners',
    desc: 'Win an Invitational: a three-round bracket your flagship team is invited to. Invites arrive as Hype Drops, and the first one is on its way.',
    icon: 'medal',
    art: 'medal',
    mechanic: 'invitationals',
    metric: (s) => s.stats.tournamentsWon,
    target: 1,
    mode: 'delta',
    available: hasPlayer,
    stuck: () => 'Each Hype Drop you catch can bring another invite. Preparing raises your odds in every round.',
    rewards: [tool('wildcard_invite'), perk('Tournament prizes ×1.5', { kind: 'tournamentReward', mult: 1.5 })],
  },
  {
    id: 'rival_1',
    chapter: 4,
    title: 'Grudge match',
    desc: 'A rival org has noticed you. Beat them in a grudge match: any league match against your rival, worth extra prize money and double fans.',
    icon: 'swords',
    art: 'upgrade:swords',
    mechanic: 'rival',
    metric: (s) => s.stats.derbyWins,
    target: 1,
    mode: 'delta',
    available: hasPlayer,
    stuck: () => 'Grudge matches come up in your league fixtures: the Teams tab marks them. Stronger players win more of them.',
    hint: 'teams',
    rewards: [tool('rival_file'), fans(30, 20_000)],
  },
  {
    id: 'promotion_1',
    chapter: 4,
    title: 'Moving up',
    desc: 'Win a promotion: a team moves up a league at the end of a season once its Elo, which rises with every win against its tier, reaches the next one. Any of your teams counts.',
    icon: 'trending-up',
    art: 'podium',
    mechanic: 'promotion',
    metric: (s) => s.stats.promotions,
    target: 1,
    mode: 'delta',
    available: hasPlayer,
    meter: promotionMeter,
    stuck: () => 'Elo rises with wins against your tier. Gear and better signings raise it fastest; the Push for Promotion plan helps for a season.',
    hint: 'teams',
    rewards: [perk('All team ratings +3%', { kind: 'teamRating', mult: 1.03 }), trophies(5)],
  },

  {
    id: 'sell_player',
    chapter: 4,
    title: 'Business is business',
    desc: 'Sell a player to a rival org: open a player and choose Sell. Players you developed sell for more, and veterans before they retire.',
    icon: 'dollar-sign',
    art: 'sold',
    mechanic: 'playerSales',
    metric: (s) => s.stats.playersSold,
    target: 1,
    mode: 'delta',
    credit: true,
    available: (s) => sellable(s) >= 2,
    waiting: (s) => ({ text: `Sign two players besides your founder (${Math.min(2, sellable(s))}/2)`, value: Math.min(2, sellable(s)), target: 2 }),
    hint: 'teams',
    rewards: [perk('Signing fees 15% cheaper', { kind: 'feeMult', mult: 0.85 }), trophies(3)],
  },
  {
    id: 'empire_1',
    chapter: 4,
    title: 'Landmark',
    desc: 'Open a new kind of operation: buy the first of the next building on the store list.',
    icon: 'building',
    art: 'skyline',
    mechanic: 'empire',
    metric: opTypesOwned,
    target: 1,
    mode: 'delta',
    available: (s) => nextNewOperation(s) !== undefined,
    meter: (s) => {
      const op = nextNewOperation(s);
      if (!op) return null;
      return { value: Math.min(s.cash, op.baseCost), target: op.baseCost, text: `The ${op.name}: ${money(s.cash)} of ${money(op.baseCost)}` };
    },
    hint: 'store',
    rewards: [perk('+5% income from everything', { kind: 'globalPct', pct: 0.05 }), trophies(5)],
  },
  {
    id: 'auto_1',
    chapter: 4,
    title: 'Front office',
    desc: 'Your staff can run errands for you. Switch on a Front Office routine in the Staff tab: it buys within the share of cash you allow.',
    icon: 'clock',
    art: 'upgrade:clock',
    mechanic: 'automation',
    metric: (s) => Object.values(s.automation).filter((a) => a.on).length,
    target: 1,
    mode: 'absolute',
    available: (s) => AUTOMATIONS.some((a) => automationUnlocked(s, a.id)),
    waiting: (s) => ({ text: `The first routine, the Upgrade desk, opens at ${money(1e9)} earned this run (${money(s.earnedRun)} so far)`, value: Math.min(1e9, s.earnedRun), target: 1e9 }),
    hint: 'routines',
    rewards: [perk('Upgrades cost 10% less', { kind: 'upgradeCostMult', mult: 0.9 }), trophies(5)],
  },

  // -- Chapter 6: The big exit. --
  {
    id: 'sell_org',
    chapter: 5,
    title: 'The big exit',
    desc: 'Sell the org for legacy in the Legacy tab. A sale starts a new run with legacy points to spend on upgrades that last for good.',
    icon: 'crown',
    art: 'crown',
    mechanic: 'sale',
    metric: (s) => s.stats.orgsSold,
    target: 1,
    mode: 'delta',
    available: (s) => sectionReady(s, 'legacy') || s.stats.orgsSold > 0 || canSell(s),
    meter: (s) => {
      if (!legacyUnlocked(s)) {
        const climbed = OPERATIONS.filter((op) => s.ops[op.id]?.highest > 0).length;
        return { value: climbed, target: OPERATIONS.length, text: `The first sale opens with your first ${FINAL_OPERATION.name}: ${climbed} of ${OPERATIONS.length} buildings so far` };
      }
      return { value: Math.min(1, pendingLegacy(s)), target: 1, text: pendingLegacy(s) >= 1 ? 'Ready to sell: the Legacy tab has the details' : 'Earning towards your first legacy point' };
    },
    rewards: [{ kind: 'legacy', amount: 3 }, trophies(10)],
  },
];

export const QUEST_MAP: Map<string, QuestDef> = new Map(QUESTS.map((q) => [q.id, q]));

/** Quests that have left the line (old saves may have claimed them). Their perks are carried on load. */
export const RETIRED_QUESTS = ['level_10', 'ops_100', 'tier_5'] as const;

/** How long a quest is live before its console shows a concrete next step (`QuestDef.stuck`). */
export const STUCK_SECONDS = 300;
