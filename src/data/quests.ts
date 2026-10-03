import { isMerchUnlocked } from '../engine/merch';
import { canSell } from '../engine/prestige';
import { sponsorsUnlocked } from '../engine/sponsors';
import { sectionOpen } from '../engine/sections';
import { isStaffUnlocked } from '../engine/staff';
import type { Effect, GameState } from '../engine/types';
import { STAFF } from './staff';

/**
 * Every mechanic a player can be taught. The first run's quest line is a tour: each quest makes the
 * player use one of these once (docs/implementation-plan.md, WS6), and a test checks that every one
 * is taught by some quest.
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
  'training',
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
  trend_tip: { label: 'Trend tip', icon: 'shirt', consumable: false },
  /** One rarer prospect on the Market shortlist. */
  scout_choice: { label: "Scout's choice", icon: 'search', consumable: true },
  /** A guaranteed sponsor offer one tier up. */
  sponsor_meeting: { label: 'Sponsor meeting', icon: 'handshake', consumable: true },
  /** Blocks one scandal. */
  pr_shield: { label: 'PR shield', icon: 'shield', consumable: true },
  /** One guaranteed Invitational invite. */
  wildcard_invite: { label: 'Wildcard invite', icon: 'medal', consumable: true },
  /** See the rival's roster strength. */
  rival_file: { label: 'Rival file', icon: 'swords', consumable: false },
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
  | { kind: 'title'; id: string; label: string };

export type QuestRewardKind = QuestReward['kind'];

export interface QuestDef {
  id: string;
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
  /** Offered only when this is true, so a quest is always something the player can act on. */
  available?: (s: GameState) => boolean;
  rewards: [QuestReward] | [QuestReward, QuestReward];
  /** Paid on top of the chosen reward, every time: an operation affinity, a cosmetic, a title. */
  bonus?: QuestReward[];
}

const cash = (minutes: number, min: number): QuestReward => ({ kind: 'cash', seconds: minutes * 60, min });
const fans = (minutes: number, min: number): QuestReward => ({ kind: 'fans', seconds: minutes * 60, min });
const trophies = (amount: number): QuestReward => ({ kind: 'trophies', amount });
const levels = (amount: number): QuestReward => ({ kind: 'levels', amount });
const perk = (label: string, ...effects: Effect[]): QuestReward => ({ kind: 'perk', label, effects });

const hasPlayer = (s: GameState) => Object.keys(s.players).length > 0;
const teamsWithPlayers = (s: GameState) => Object.values(s.teams).filter((t) => t.lineup.some((id) => id !== null)).length;
const sellable = (s: GameState) => Object.values(s.players).filter((p) => !p.founder).length;
const bestTier = (s: GameState) => Object.values(s.teams).reduce((m, t) => Math.max(m, t.bestTier), 0);
const maxLevel = (s: GameState) => Object.values(s.players).reduce((m, p) => Math.max(m, p.level), 0);
const totalOps = (s: GameState) => Object.values(s.ops).reduce((n, o) => n + o.owned, 0);

/**
 * The milestones every org should hit, in roughly the order they become possible. One quest is on
 * the board at a time (`QUEST_SLOTS`); claiming it brings in the next available one. Selling the org
 * starts the line again, and the perks it paid go with the run.
 *
 * Reward sizing: cash is minutes of income at the moment of claiming, with a floor so early claims
 * still buy something real (a few more operations, a gear tier, a hire). Perks are permanent but
 * modest, and each one follows from the quest that earns it, so the player knows what it does.
 */
export const QUESTS: QuestDef[] = [
  // -- Getting going: one clear reward each ----------------------------------------------------
  {
    id: 'grinders_10',
    title: 'Grinder squad',
    desc: 'Own 10 Ranked Grinders.',
    icon: 'gamepad-2',
    art: 'op:grinder',
    mechanic: 'operations',
    metric: (s) => s.ops.grinder?.owned ?? 0,
    target: 10,
    mode: 'absolute',
    rewards: [perk('Ranked Grinders earn twice as much', { kind: 'opMult', op: 'grinder', mult: 2 })],
  },
  {
    id: 'gear_1',
    title: 'Gear up',
    desc: 'Buy a gear upgrade for a player. Click a player in the Teams tab to see their gear.',
    icon: 'cpu',
    art: 'gear-up',
    mechanic: 'gear',
    metric: (s) => s.stats.gearBought,
    target: 1,
    mode: 'delta',
    available: hasPlayer,
    rewards: [levels(2)],
  },
  {
    id: 'upgrades_3',
    title: 'Read the patch notes',
    desc: 'Buy 3 upgrades from the top of the store.',
    icon: 'sparkles',
    art: 'patch-notes',
    mechanic: 'upgrades',
    metric: (s) => s.stats.upgradesBoughtTotal,
    target: 3,
    mode: 'delta',
    rewards: [perk('Clicks earn twice as much', { kind: 'clickMult', mult: 2 })],
  },
  {
    id: 'crowd_1',
    title: 'Hype streak',
    desc: 'Fill the hype meter until the crowd goes wild. While this quest is live the crowd warms up by itself to 80%, so a few clicks finish it.',
    icon: 'megaphone',
    art: 'upgrade:megaphone',
    mechanic: 'clicking',
    metric: (s) => s.stats.crowdsTotal,
    target: 1,
    mode: 'delta',
    rewards: [perk('The crowd goes wild for 50% longer', { kind: 'hypeDuration', mult: 1.5 })],
  },
  {
    id: 'drop_1',
    title: 'Catch the drop',
    desc: 'Click a Hype Drop, the glowing icon that sometimes floats across the screen.',
    icon: 'zap',
    art: 'upgrade:zap',
    mechanic: 'drops',
    metric: (s) => s.stats.dropsClicked,
    target: 1,
    mode: 'delta',
    rewards: [perk('Hype Drops appear 20% more often', { kind: 'dropInterval', mult: 0.8 })],
  },
  {
    id: 'staff_1',
    title: 'Hire help',
    desc: 'Hire your first staff member from the Staff tab.',
    icon: 'briefcase',
    art: 'staff',
    mechanic: 'staff',
    metric: (s) => s.stats.staffHired,
    target: 1,
    mode: 'delta',
    available: (s) => sectionOpen(s, 'staff') && STAFF.some((d) => isStaffUnlocked(s, d)),
    rewards: [cash(8, 1_500)],
  },
  {
    id: 'plan_1',
    title: 'Have a plan',
    desc: 'Set a team to the Development or Push for Promotion season plan in the Teams tab.',
    icon: 'clipboard-list',
    art: 'clipboard',
    mechanic: 'seasonPlan',
    metric: (s) => (Object.values(s.teams).some((t) => t.plan !== 'balanced' || (t.nextPlan && t.nextPlan !== 'balanced')) ? 1 : 0),
    target: 1,
    mode: 'absolute',
    available: hasPlayer,
    rewards: [levels(2)],
  },

  // -- Growing: a choice between two things the player has met ------------------------------------
  {
    id: 'design_shirt',
    title: 'Design a shirt',
    desc: 'Draw a design in the Studio and set it as your team jersey.',
    icon: 'shirt',
    art: 'upgrade:shirt',
    mechanic: 'jersey',
    metric: (s) => (s.org.jersey ? 1 : 0),
    target: 1,
    mode: 'absolute',
    available: (s) => sectionOpen(s, 'studio'),
    rewards: [cash(8, 3_000), perk('+10% fans from everything', { kind: 'fansMult', mult: 1.1 })],
  },
  {
    id: 'second_team',
    title: 'Branch out',
    desc: 'Found a second team and sign a player for it.',
    icon: 'flag',
    art: 'pennant',
    mechanic: 'teams',
    metric: teamsWithPlayers,
    target: 2,
    mode: 'absolute',
    rewards: [cash(8, 10_000), perk('Match prize money +10%', { kind: 'prizeMult', mult: 1.1 })],
  },
  {
    id: 'promotion_1',
    title: 'Moving up',
    desc: 'Win promotion to a higher league: 12 wins in a 16-match season.',
    icon: 'trending-up',
    art: 'podium',
    mechanic: 'promotion',
    metric: (s) => s.stats.promotions,
    target: 1,
    mode: 'delta',
    available: hasPlayer,
    rewards: [cash(8, 10_000), perk('All team ratings +3%', { kind: 'teamRating', mult: 1.03 })],
  },
  {
    id: 'sponsor_1',
    title: 'Take the money',
    desc: 'Sign a sponsorship deal from the Sponsors tab.',
    icon: 'handshake',
    art: 'upgrade:handshake',
    mechanic: 'sponsors',
    metric: (s) => s.stats.sponsorsSigned,
    target: 1,
    mode: 'delta',
    available: sponsorsUnlocked,
    rewards: [cash(10, 25_000), perk('One more sponsor slot', { kind: 'sponsorSlots', add: 1 })],
  },
  {
    id: 'decor_1',
    title: 'Make it home',
    desc: 'Buy a piece of decor for the Gaming House.',
    icon: 'house',
    art: 'house',
    mechanic: 'decor',
    metric: (s) => s.stats.decorBought,
    target: 1,
    mode: 'delta',
    available: (s) => sectionOpen(s, 'house'),
    rewards: [cash(10, 25_000), fans(20, 2_000)],
  },
  {
    id: 'merch_1',
    title: 'Merch drop',
    desc: 'Launch a merch product in the Studio.',
    icon: 'shirt',
    art: 'merch-bag',
    mechanic: 'merchDesign',
    metric: (s) => Object.keys(s.merch.lines).length,
    target: 1,
    mode: 'absolute',
    available: isMerchUnlocked,
    rewards: [cash(10, 50_000), perk('Merch sells 20% more', { kind: 'merchMult', mult: 1.2 })],
  },
  {
    id: 'title_1',
    title: 'League champions',
    desc: 'Win a league title: 15 wins in a 16-match season.',
    icon: 'trophy',
    art: 'upgrade:trophy',
    mechanic: 'leagueTitle',
    metric: (s) => s.stats.seasonTitles,
    target: 1,
    mode: 'delta',
    available: hasPlayer,
    rewards: [trophies(3), cash(15, 100_000)],
  },
  {
    id: 'level_10',
    title: 'Homegrown',
    desc: 'Train a player to level 10.',
    icon: 'dumbbell',
    art: 'upgrade:dumbbell',
    mechanic: 'training',
    metric: maxLevel,
    target: 10,
    mode: 'absolute',
    available: hasPlayer,
    rewards: [levels(3), perk('Players earn 15% more XP', { kind: 'xpMult', mult: 1.15 })],
  },
  {
    id: 'tourney_1',
    title: 'Invitational winners',
    desc: 'Win an Invitational. Invites arrive as Hype Drops.',
    icon: 'medal',
    art: 'medal',
    mechanic: 'invitationals',
    metric: (s) => s.stats.tournamentsWon,
    target: 1,
    mode: 'delta',
    available: hasPlayer,
    rewards: [trophies(3), perk('Tournament prizes ×1.5', { kind: 'tournamentReward', mult: 1.5 })],
  },
  {
    id: 'sell_player',
    title: 'Business is business',
    desc: 'Sell a player to a rival org. Players you developed sell for more.',
    icon: 'dollar-sign',
    art: 'sold',
    mechanic: 'playerSales',
    metric: (s) => s.stats.playersSold,
    target: 1,
    mode: 'delta',
    available: (s) => sellable(s) >= 2,
    rewards: [cash(15, 100_000), perk('Signing fees 15% cheaper', { kind: 'feeMult', mult: 0.85 })],
  },
  {
    id: 'rival_1',
    title: 'Grudge match',
    desc: 'Beat your rival in a grudge match (any league match against your rival, worth double fans).',
    icon: 'swords',
    art: 'upgrade:swords',
    mechanic: 'rival',
    metric: (s) => s.stats.derbyWins,
    target: 1,
    mode: 'delta',
    available: (s) => s.rival !== null,
    rewards: [fans(30, 20_000), cash(15, 250_000)],
  },
  {
    id: 'ops_100',
    title: 'Business empire',
    desc: 'Own 100 operations in total.',
    icon: 'building',
    art: 'skyline',
    mechanic: 'empire',
    metric: totalOps,
    target: 100,
    mode: 'absolute',
    rewards: [cash(20, 500_000), perk('+5% income from everything', { kind: 'globalPct', pct: 0.05 })],
  },
  {
    id: 'sponsor_goal',
    title: 'Deliver for the sponsor',
    desc: 'Complete a sponsor goal.',
    icon: 'target',
    art: 'target',
    mechanic: 'sponsorGoals',
    metric: (s) => s.stats.sponsorGoals,
    target: 1,
    mode: 'delta',
    available: (s) => s.sponsors.active.length > 0,
    rewards: [trophies(2), perk('Sponsor income +15%', { kind: 'sponsorIncome', mult: 1.15 })],
  },
  {
    id: 'tier_5',
    title: 'Semi-pro',
    desc: 'Reach the Semi-Pro Circuit with any team.',
    icon: 'trophy',
    art: 'upgrade:star',
    mechanic: 'promotion',
    metric: bestTier,
    target: 4,
    mode: 'absolute',
    available: hasPlayer,
    rewards: [trophies(5), cash(30, 5_000_000)],
  },
  {
    id: 'sell_org',
    title: 'The big exit',
    desc: 'Sell the org for legacy in the Legacy tab.',
    icon: 'crown',
    art: 'crown',
    mechanic: 'sale',
    metric: (s) => s.stats.orgsSold,
    target: 1,
    mode: 'delta',
    available: (s) => s.stats.orgsSold > 0 || canSell(s),
    rewards: [{ kind: 'legacy', amount: 3 }, trophies(10)],
  },
];

export const QUEST_MAP: Map<string, QuestDef> = new Map(QUESTS.map((q) => [q.id, q]));
