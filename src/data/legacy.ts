import type { Effect, GameState, Rarity } from '../engine/types';

export type LegacySpecial =
  | { kind: 'startCash'; amount: number }
  | { kind: 'startOps'; ops: Record<string, number> }
  | { kind: 'startGame'; game: string }
  | { kind: 'startStaff'; staff: Record<string, number> }
  | { kind: 'keepDecor' }
  | { kind: 'keepMerch' }
  | { kind: 'sponsorTiers' }
  | { kind: 'keepPlayer' }
  | { kind: 'legends' }
  | { kind: 'challenges' }
  | { kind: 'startPlayer'; game: string; rarity: Rarity }
  | { kind: 'startFans'; amount: number };

export interface LegacyNodeDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  cost: number;
  requires: string[];
  /** Grid position in the tree view. */
  x: number;
  y: number;
  effects?: Effect[];
  special?: LegacySpecial[];
}

export const LEGACY_NODES: LegacyNodeDef[] = [
  { id: 'legacy', name: 'Legacy of Champions', desc: 'Your reputation precedes you. +10% income.', icon: 'crown', cost: 1, requires: [], x: 5, y: 0, effects: [{ kind: 'globalPct', pct: 0.1 }] },

  // Starting boosts
  { id: 'start_cash_1', name: 'Seed Funding', desc: 'Start each run with $1,000.', icon: 'dollar-sign', cost: 2, requires: ['legacy'], x: 0, y: 1, special: [{ kind: 'startCash', amount: 1_000 }] },
  { id: 'start_cash_2', name: 'Series A', desc: 'Start each run with $1 million.', icon: 'dollar-sign', cost: 20, requires: ['start_cash_1'], x: 0, y: 2, special: [{ kind: 'startCash', amount: 1e6 }] },
  { id: 'start_cash_3', name: 'IPO Money', desc: 'Start each run with $1 billion.', icon: 'dollar-sign', cost: 400, requires: ['start_cash_2'], x: 0, y: 3, special: [{ kind: 'startCash', amount: 1e9 }] },
  {
    id: 'start_ops',
    name: 'Loyal Grinders',
    desc: 'Start each run with 25 Ranked Grinders and 10 Streamers.',
    icon: 'gamepad-2',
    cost: 8,
    requires: ['start_cash_1'],
    x: 0,
    y: 4,
    special: [{ kind: 'startOps', ops: { grinder: 25, streamer: 10 } }],
  },

  // Income
  { id: 'heritage', name: 'Heritage', desc: 'Each legacy level gives +1.5% income instead of +1%.', icon: 'star', cost: 3, requires: ['legacy'], x: 1, y: 1, effects: [{ kind: 'legacyLevelPct', add: 0.005 }] },
  { id: 'endowment', name: 'Endowment', desc: 'Each legacy level gives another +0.5% income.', icon: 'star', cost: 25, requires: ['heritage'], x: 1, y: 2, effects: [{ kind: 'legacyLevelPct', add: 0.005 }] },
  { id: 'income_1', name: 'Old Money', desc: '+15% income.', icon: 'trending-up', cost: 5, requires: ['legacy'], x: 2, y: 1, effects: [{ kind: 'globalPct', pct: 0.15 }] },
  { id: 'income_2', name: 'Blue-Chip Org', desc: '+25% income.', icon: 'trending-up', cost: 50, requires: ['income_1'], x: 2, y: 2, effects: [{ kind: 'globalPct', pct: 0.25 }] },
  { id: 'income_3', name: 'Dynasty Wealth', desc: '+50% income.', icon: 'trending-up', cost: 500, requires: ['income_2'], x: 2, y: 3, effects: [{ kind: 'globalPct', pct: 0.5 }] },
  { id: 'income_4', name: 'Esports Oligarchy', desc: 'Doubles income.', icon: 'trending-up', cost: 5_000, requires: ['income_3'], x: 2, y: 4, effects: [{ kind: 'globalPct', pct: 1 }] },

  // Clicking & fame
  {
    id: 'click_1',
    name: 'Veteran Fingers',
    desc: 'Clicks ×2 and +1% of income per click.',
    icon: 'mouse-pointer-click',
    cost: 3,
    requires: ['legacy'],
    x: 3,
    y: 1,
    effects: [
      { kind: 'clickMult', mult: 2 },
      { kind: 'clickCpsPct', pct: 0.01 },
    ],
  },
  {
    id: 'click_2',
    name: 'Muscle Memory',
    desc: '+2% of income per click and the hype meter fills 50% faster.',
    icon: 'mouse-pointer-click',
    cost: 30,
    requires: ['click_1'],
    x: 3,
    y: 2,
    effects: [
      { kind: 'clickCpsPct', pct: 0.02 },
      { kind: 'hypeGain', mult: 1.5 },
    ],
  },
  {
    id: 'fame',
    name: 'Legendary Fanbase',
    desc: 'Fans ×1.5 and fans boost income more.',
    icon: 'heart',
    cost: 10,
    requires: ['legacy'],
    x: 4,
    y: 1,
    effects: [
      { kind: 'fansMult', mult: 1.5 },
      { kind: 'fameExp', add: 0.02 },
    ],
  },
  { id: 'fame_2', name: 'Generational Fans', desc: 'Fans boost income even more.', icon: 'heart', cost: 100, requires: ['fame'], x: 4, y: 2, effects: [{ kind: 'fameExp', add: 0.03 }] },

  // Offline & house
  {
    id: 'offline_1',
    name: 'Autopilot',
    desc: '+15% offline efficiency and 12 more offline hours.',
    icon: 'clock',
    cost: 4,
    requires: ['legacy'],
    x: 3,
    y: 3,
    effects: [
      { kind: 'offlineRate', add: 0.15 },
      { kind: 'offlineCap', hours: 12 },
    ],
  },
  { id: 'offline_2', name: 'Remote Management', desc: '+25% offline efficiency.', icon: 'clock', cost: 40, requires: ['offline_1'], x: 3, y: 4, effects: [{ kind: 'offlineRate', add: 0.25 }] },
  {
    id: 'offline_3',
    name: 'Always Running',
    desc: '+40% offline efficiency and 48 more offline hours.',
    icon: 'clock',
    cost: 400,
    requires: ['offline_2'],
    x: 3,
    y: 5,
    effects: [
      { kind: 'offlineRate', add: 0.4 },
      { kind: 'offlineCap', hours: 48 },
    ],
  },
  { id: 'keep_decor', name: 'Family Home', desc: 'Gaming House decor is kept when you sell the org.', icon: 'house', cost: 25, requires: ['offline_1'], x: 4, y: 4, special: [{ kind: 'keepDecor' }] },

  // Challenges
  { id: 'challenges', name: 'Proving Grounds', desc: 'Unlocks challenge runs with permanent rewards.', icon: 'swords', cost: 20, requires: ['legacy'], x: 5, y: 1, special: [{ kind: 'challenges' }] },

  // Events
  {
    id: 'drops_1',
    name: 'Hype Veterans',
    desc: 'Hype Drops appear 15% more often and stay 50% longer.',
    icon: 'zap',
    cost: 5,
    requires: ['legacy'],
    x: 6,
    y: 1,
    effects: [
      { kind: 'dropInterval', mult: 0.85 },
      { kind: 'dropLife', mult: 1.5 },
    ],
  },
  { id: 'drops_2', name: 'Hype Legends', desc: 'Drop buffs last 30% longer.', icon: 'zap', cost: 60, requires: ['drops_1'], x: 6, y: 2, effects: [{ kind: 'buffDuration', mult: 1.3 }] },
  {
    id: 'tourney',
    name: 'Invitational Regulars',
    desc: 'Tournament prizes ×2 and invites 50% more common.',
    icon: 'trophy',
    cost: 30,
    requires: ['drops_1'],
    x: 6,
    y: 3,
    effects: [
      { kind: 'tournamentReward', mult: 2 },
      { kind: 'tournamentWeight', mult: 1.5 },
    ],
  },

  // Teams & players
  { id: 'teams_1', name: 'Alumni Network', desc: 'Prize money ×1.5.', icon: 'users', cost: 4, requires: ['legacy'], x: 7, y: 1, effects: [{ kind: 'prizeMult', mult: 1.5 }] },
  { id: 'start_rocket', name: 'Rocket Soccar Charter', desc: 'Start each run with a Rocket Soccar team.', icon: 'car', cost: 10, requires: ['teams_1'], x: 7, y: 2, special: [{ kind: 'startGame', game: 'rocket' }] },
  { id: 'start_counter', name: 'Counter-Stroke Charter', desc: 'Start each run with a Counter-Stroke team.', icon: 'crosshair', cost: 60, requires: ['start_rocket'], x: 7, y: 3, special: [{ kind: 'startGame', game: 'counter' }] },
  {
    id: 'staff_start',
    name: 'Loyal Staff',
    desc: 'Start each run with 5 Coaches and 5 Chefs.',
    icon: 'clipboard-list',
    cost: 25,
    requires: ['start_rocket'],
    x: 7,
    y: 4,
    special: [{ kind: 'startStaff', staff: { coach: 5, chef: 5 } }],
  },
  {
    id: 'scouting',
    name: 'Talent Pipeline',
    desc: 'Better scouting luck and 2 more market listings.',
    icon: 'binoculars',
    cost: 8,
    requires: ['teams_1'],
    x: 8,
    y: 2,
    effects: [
      { kind: 'scoutLuck', add: 0.2 },
      { kind: 'marketSize', add: 2 },
    ],
  },
  { id: 'keep_player', name: 'Franchise Player', desc: 'Keep one player (without gear) when you sell the org.', icon: 'user', cost: 40, requires: ['scouting'], x: 8, y: 3, special: [{ kind: 'keepPlayer' }] },
  {
    id: 'legends',
    name: 'Hall of Fame Coaches',
    desc: 'Retire a player when selling: they become a legend coach (+5% rating in their game, +2% fans) forever.',
    icon: 'medal',
    cost: 80,
    requires: ['keep_player'],
    x: 8,
    y: 4,
    special: [{ kind: 'legends' }],
  },
  {
    id: 'scout_bias',
    name: 'Targeted Scouting',
    desc: 'Allows scouts to bias scouting towards specific games and player tiers in the Front Office.',
    icon: 'binoculars',
    cost: 15,
    requires: ['scouting'],
    x: 8,
    y: 5,
  },
  {
    id: 'scout_trait',
    name: 'Trait Headhunting',
    desc: 'Scouts find a chosen trait twice as often on prospective players.',
    icon: 'sparkles',
    cost: 25,
    requires: ['scout_bias'],
    x: 8,
    y: 6,
  },
  { id: 'bench', name: 'Deep Bench', desc: '+1 bench slot on every team.', icon: 'users', cost: 12, requires: ['teams_1'], x: 9, y: 2, effects: [{ kind: 'benchSlots', add: 1 }] },
  { id: 'xp', name: 'Mentorship Programme', desc: 'Players gain 50% more XP.', icon: 'dumbbell', cost: 20, requires: ['bench'], x: 9, y: 3, effects: [{ kind: 'xpMult', mult: 1.5 }] },
  { id: 'rating', name: 'Winning Culture', desc: 'All team ratings ×1.25.', icon: 'flame', cost: 150, requires: ['xp'], x: 9, y: 4, effects: [{ kind: 'teamRating', mult: 1.25 }] },
  {
    id: 'coach_bench',
    name: 'Bench Depth Directive',
    desc: 'Allows coaches to recruit players directly to available bench slots.',
    icon: 'users',
    cost: 18,
    requires: ['bench'],
    x: 9,
    y: 5,
  },

  // Business
  { id: 'sponsor_slot', name: 'Brand Heritage', desc: '+1 sponsor slot.', icon: 'handshake', cost: 15, requires: ['legacy'], x: 10, y: 1, effects: [{ kind: 'sponsorSlots', add: 1 }] },
  { id: 'sponsor_income', name: 'Household Name', desc: 'Sponsor income ×1.5.', icon: 'handshake', cost: 120, requires: ['sponsor_slot'], x: 10, y: 2, effects: [{ kind: 'sponsorIncome', mult: 1.5 }] },
  { id: 'sponsor_tiers', name: 'Global Brand Portfolio', desc: 'Sponsors of tiers 6 to 10 start calling: far bigger perks, for far bigger orgs.', icon: 'globe', cost: 250, requires: ['sponsor_income'], x: 9, y: 1, special: [{ kind: 'sponsorTiers' }] },
  { id: 'keep_merch', name: 'Merch Archive', desc: 'Merch products stay unlocked when you sell the org.', icon: 'shirt', cost: 35, requires: ['sponsor_slot'], x: 10, y: 3, special: [{ kind: 'keepMerch' }] },
  { id: 'merch_mult', name: 'Cult Merch', desc: 'Merch sales ×2.', icon: 'shirt', cost: 150, requires: ['keep_merch'], x: 10, y: 4, effects: [{ kind: 'merchMult', mult: 2 }] },
  { id: 'operations_manager', name: 'Operations Manager', desc: 'Unlock an automatic building buyer with a cash budget you set.', icon: 'building', cost: 30, requires: ['legacy'], x: 11, y: 1 },
  {
    id: 'gear_gear_gear_1',
    name: 'Gear Gear Gear I',
    desc: 'Allows up to 10% of cash to be spent per gear round in Front Office.',
    icon: 'cpu',
    cost: 15,
    requires: ['legacy'],
    x: 11,
    y: 2,
  },
  {
    id: 'gear_gear_gear_2',
    name: 'Gear Gear Gear II',
    desc: 'Allows up to 25% of cash to be spent per gear round in Front Office.',
    icon: 'cpu',
    cost: 50,
    requires: ['gear_gear_gear_1'],
    x: 11,
    y: 3,
  },
  {
    id: 'gear_gear_gear_3',
    name: 'Gear Gear Gear III',
    desc: 'Allows up to 50% of cash to be spent per gear round in Front Office.',
    icon: 'cpu',
    cost: 200,
    requires: ['gear_gear_gear_2'],
    x: 11,
    y: 4,
  },
];

export const LEGACY_NODE_MAP: Map<string, LegacyNodeDef> = new Map(LEGACY_NODES.map((n) => [n.id, n]));

/**
 * Dynasty ranks: repeatable legacy purchases with no cap, so legacy points always have a use and
 * selling the org is always worth something, even once the tree is complete. Each rank is a small
 * boost to a base rate; the cost grows geometrically, so ranks track the log of points earned.
 */
export interface DynastyDef {
  id: string;
  name: string;
  icon: string;
  /** What one rank adds, for display. */
  perRank: string;
  effects: (rank: number) => Effect[];
}

export const DYNASTY_BASE_COST = 5;
export const DYNASTY_COST_GROWTH = 1.15;

export const DYNASTY: DynastyDef[] = [
  { id: 'renown', name: 'Renown', icon: 'crown', perRank: '+3% income', effects: (r) => [{ kind: 'globalPct', pct: 0.03 * r }] },
  { id: 'pedigree', name: 'Pedigree', icon: 'trophy', perRank: '+6% prize money', effects: (r) => [{ kind: 'prizeMult', mult: 1 + 0.06 * r }] },
  { id: 'following', name: 'Following', icon: 'heart', perRank: '+6% fans', effects: (r) => [{ kind: 'fansMult', mult: 1 + 0.06 * r }] },
  {
    id: 'academy',
    name: 'Academy',
    icon: 'dumbbell',
    perRank: '+1% team rating and +5% XP',
    effects: (r) => [
      { kind: 'teamRating', mult: 1 + 0.01 * r },
      { kind: 'xpMult', mult: 1 + 0.05 * r },
    ],
  },
];

export const DYNASTY_MAP: Map<string, DynastyDef> = new Map(DYNASTY.map((d) => [d.id, d]));

export interface ChallengeDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  goal: string;
  check: (s: GameState) => boolean;
  reward: string;
  rewardEffects: Effect[];
}

const bestTier = (s: GameState): number => Object.values(s.teams).reduce((m, t) => Math.max(m, t.bestTier), 0);

export const CHALLENGES: ChallengeDef[] = [
  {
    id: 'solo',
    name: 'Solo Queue',
    icon: 'user',
    desc: 'Every team can only ever have one player.',
    goal: 'Earn $1 billion in the run',
    check: (s) => s.earnedRun >= 1e9,
    reward: '+10% income forever',
    rewardEffects: [{ kind: 'globalPct', pct: 0.1 }],
  },
  {
    id: 'potato',
    name: 'Potato League',
    icon: 'cpu',
    desc: 'Gear cannot be upgraded. Everyone plays on hand-me-down laptops.',
    goal: 'Reach league tier 6 with any team',
    check: (s) => bestTier(s) >= 5,
    reward: 'Team ratings ×1.15 forever',
    rewardEffects: [{ kind: 'teamRating', mult: 1.15 }],
  },
  {
    id: 'nostaff',
    name: 'Skeleton Crew',
    icon: 'briefcase',
    desc: 'You cannot hire any staff.',
    goal: 'Earn $10 billion in the run',
    check: (s) => s.earnedRun >= 1e10,
    reward: 'Staff 20% cheaper forever',
    rewardEffects: [{ kind: 'staffCostMult', mult: 0.8 }],
  },
  {
    id: 'nodrops',
    name: 'No Hype',
    icon: 'zap',
    desc: 'Hype Drops never appear.',
    goal: 'Earn $10 billion in the run',
    check: (s) => s.earnedRun >= 1e10,
    reward: '+20% income forever',
    rewardEffects: [{ kind: 'globalPct', pct: 0.2 }],
  },
  {
    id: 'drama',
    name: 'Tabloid Darling',
    icon: 'flame',
    desc: 'Every single drop is a Drama Drop.',
    goal: 'Earn $1 billion in the run',
    check: (s) => s.earnedRun >= 1e9,
    reward: 'Drop buffs last 25% longer forever',
    rewardEffects: [{ kind: 'buffDuration', mult: 1.25 }],
  },
];

export const CHALLENGE_MAP: Map<string, ChallengeDef> = new Map(CHALLENGES.map((c) => [c.id, c]));
