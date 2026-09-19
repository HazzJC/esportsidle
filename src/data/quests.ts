import { isMerchUnlocked } from '../engine/merch';
import { pendingLegacy } from '../engine/prestige';
import { sponsorsUnlocked } from '../engine/sponsors';
import { isStaffUnlocked } from '../engine/staff';
import type { BuffEffect, GameState } from '../engine/types';
import { STAFF } from './staff';

/** What a finished quest can pay out. Every quest offers two, and the player picks one. */
export type QuestReward =
  /** Cash worth this many seconds of income, and never less than `min`. */
  | { kind: 'cash'; seconds: number; min: number }
  /** Fans worth this many seconds of fan growth, and never fewer than `min`. */
  | { kind: 'fans'; seconds: number; min: number }
  | { kind: 'trophies'; amount: number }
  /** Every player on the roster gains this many levels. */
  | { kind: 'levels'; amount: number }
  | { kind: 'legacy'; amount: number }
  | { kind: 'buff'; name: string; icon: string; effect: BuffEffect; seconds: number };

export interface QuestDef {
  id: string;
  title: string;
  desc: string;
  icon: string;
  /**
   * The number the quest watches. Delta quests count from the moment the quest is offered (so an
   * all-time stat works); absolute quests read the value as it stands.
   */
  metric: (s: GameState) => number;
  target: number;
  mode: 'delta' | 'absolute';
  /** Offered only when this is true, so a quest is always something the player can act on. */
  available?: (s: GameState) => boolean;
  rewards: [QuestReward, QuestReward];
}

const cash = (seconds: number, min: number): QuestReward => ({ kind: 'cash', seconds, min });
const fans = (seconds: number, min: number): QuestReward => ({ kind: 'fans', seconds, min });
const trophies = (amount: number): QuestReward => ({ kind: 'trophies', amount });
const levels = (amount: number): QuestReward => ({ kind: 'levels', amount });
const incomeBuff = (mult: number, minutes: number): QuestReward => ({
  kind: 'buff',
  name: 'Quest bonus',
  icon: 'flag',
  effect: { kind: 'income', mult },
  seconds: minutes * 60,
});
const clickBuff = (mult: number, minutes: number): QuestReward => ({
  kind: 'buff',
  name: 'Hot hands',
  icon: 'mouse-pointer-click',
  effect: { kind: 'click', mult },
  seconds: minutes * 60,
});
const fansBuff = (mult: number, minutes: number): QuestReward => ({
  kind: 'buff',
  name: 'Buzz',
  icon: 'heart',
  effect: { kind: 'fans', mult },
  seconds: minutes * 60,
});

const hasPlayer = (s: GameState) => Object.keys(s.players).length > 0;
const teamsWithPlayers = (s: GameState) => Object.values(s.teams).filter((t) => t.lineup.some((id) => id !== null)).length;
const sellable = (s: GameState) => Object.values(s.players).filter((p) => !p.founder).length;
const bestTier = (s: GameState) => Object.values(s.teams).reduce((m, t) => Math.max(m, t.bestTier), 0);
const maxLevel = (s: GameState) => Object.values(s.players).reduce((m, p) => Math.max(m, p.level), 0);
const totalOps = (s: GameState) => Object.values(s.ops).reduce((n, o) => n + o.owned, 0);

/**
 * The milestones every org should hit, in roughly the order they become possible. Two are on the
 * board at a time; finishing one brings in the next available quest. Progress is kept for the life
 * of the org, across sales.
 */
export const QUESTS: QuestDef[] = [
  {
    id: 'grinders_10',
    title: 'Grinder squad',
    desc: 'Own 10 Ranked Grinders.',
    icon: 'gamepad-2',
    metric: (s) => s.ops.grinder?.owned ?? 0,
    target: 10,
    mode: 'absolute',
    rewards: [cash(60, 150), clickBuff(3, 2)],
  },
  {
    id: 'gear_1',
    title: 'Gear up',
    desc: 'Buy new gear for a player. Open a player from the Teams or Roster tab.',
    icon: 'cpu',
    metric: (s) => s.stats.gearBought,
    target: 1,
    mode: 'delta',
    available: hasPlayer,
    rewards: [cash(90, 250), levels(1)],
  },
  {
    id: 'upgrades_3',
    title: 'Read the patch notes',
    desc: 'Buy 3 upgrades from the store.',
    icon: 'sparkles',
    metric: (s) => s.stats.upgradesBoughtTotal,
    target: 3,
    mode: 'delta',
    rewards: [cash(90, 300), incomeBuff(2, 2)],
  },
  {
    id: 'crowd_1',
    title: 'Hype streak',
    desc: 'Click fast enough to fill the hype meter until the crowd goes wild.',
    icon: 'megaphone',
    metric: (s) => s.stats.crowdsTotal,
    target: 1,
    mode: 'delta',
    rewards: [cash(120, 400), clickBuff(5, 1)],
  },
  {
    id: 'drop_1',
    title: 'Catch the drop',
    desc: 'Click a Hype Drop when one appears on screen.',
    icon: 'zap',
    metric: (s) => s.stats.dropsClicked,
    target: 1,
    mode: 'delta',
    rewards: [cash(150, 500), fans(300, 50)],
  },
  {
    id: 'staff_1',
    title: 'Hire help',
    desc: 'Hire your first staff member from the Staff tab.',
    icon: 'briefcase',
    metric: (s) => s.stats.staffHired,
    target: 1,
    mode: 'delta',
    available: (s) => STAFF.some((d) => isStaffUnlocked(s, d)),
    rewards: [cash(150, 600), levels(1)],
  },
  {
    id: 'design_shirt',
    title: 'Design a shirt',
    desc: 'Draw a design in the Studio and set it as your team jersey.',
    icon: 'shirt',
    metric: (s) => (s.org.jersey ? 1 : 0),
    target: 1,
    mode: 'absolute',
    rewards: [cash(180, 800), fans(600, 100)],
  },
  {
    id: 'second_team',
    title: 'Branch out',
    desc: 'Found a second team and sign a player for it.',
    icon: 'flag',
    metric: teamsWithPlayers,
    target: 2,
    mode: 'absolute',
    rewards: [cash(240, 2_000), fansBuff(2, 5)],
  },
  {
    id: 'promotion_1',
    title: 'Moving up',
    desc: 'Win promotion to a higher league.',
    icon: 'trending-up',
    metric: (s) => s.stats.promotions,
    target: 1,
    mode: 'delta',
    available: hasPlayer,
    rewards: [cash(300, 2_500), trophies(1)],
  },
  {
    id: 'sponsor_1',
    title: 'Take the money',
    desc: 'Sign a sponsorship deal from the Sponsors tab.',
    icon: 'handshake',
    metric: (s) => s.stats.sponsorsSigned,
    target: 1,
    mode: 'delta',
    available: sponsorsUnlocked,
    rewards: [cash(300, 5_000), fansBuff(2, 10)],
  },
  {
    id: 'plan_1',
    title: 'Have a plan',
    desc: 'Set a team to the Development or Push for Promotion season plan.',
    icon: 'clipboard-list',
    metric: (s) => (Object.values(s.teams).some((t) => t.plan !== 'balanced' || (t.nextPlan && t.nextPlan !== 'balanced')) ? 1 : 0),
    target: 1,
    mode: 'absolute',
    available: hasPlayer,
    rewards: [levels(1), cash(240, 3_000)],
  },
  {
    id: 'decor_1',
    title: 'Make it home',
    desc: 'Buy a piece of decor for the Gaming House.',
    icon: 'house',
    metric: (s) => s.stats.decorBought,
    target: 1,
    mode: 'delta',
    rewards: [cash(300, 3_000), fans(900, 300)],
  },
  {
    id: 'merch_1',
    title: 'Merch drop',
    desc: 'Launch a merch product in the Studio.',
    icon: 'shirt',
    metric: (s) => Object.keys(s.merch.lines).length,
    target: 1,
    mode: 'absolute',
    available: isMerchUnlocked,
    rewards: [cash(360, 10_000), incomeBuff(2, 5)],
  },
  {
    id: 'title_1',
    title: 'Champions',
    desc: 'Win a season title: 15 wins in a 16-match season.',
    icon: 'trophy',
    metric: (s) => s.stats.seasonTitles,
    target: 1,
    mode: 'delta',
    available: hasPlayer,
    rewards: [cash(480, 10_000), trophies(2)],
  },
  {
    id: 'level_10',
    title: 'Homegrown',
    desc: 'Train a player to level 10.',
    icon: 'dumbbell',
    metric: maxLevel,
    target: 10,
    mode: 'absolute',
    available: hasPlayer,
    rewards: [levels(1), cash(480, 15_000)],
  },
  {
    id: 'tourney_1',
    title: 'Invitational winners',
    desc: 'Win a tournament. Invites arrive as Hype Drops.',
    icon: 'medal',
    metric: (s) => s.stats.tournamentsWon,
    target: 1,
    mode: 'delta',
    available: hasPlayer,
    rewards: [trophies(3), cash(900, 25_000)],
  },
  {
    id: 'sell_player',
    title: 'Business is business',
    desc: 'Sell a player to a rival org. Players you developed sell for more.',
    icon: 'dollar-sign',
    metric: (s) => s.stats.playersSold,
    target: 1,
    mode: 'delta',
    available: (s) => sellable(s) >= 2,
    rewards: [cash(600, 20_000), fans(1_200, 1_000)],
  },
  {
    id: 'rival_1',
    title: 'Derby day',
    desc: 'Beat your rival in a derby.',
    icon: 'swords',
    metric: (s) => s.stats.derbyWins,
    target: 1,
    mode: 'delta',
    available: (s) => s.rival !== null,
    rewards: [fans(1_800, 2_000), cash(600, 25_000)],
  },
  {
    id: 'ops_100',
    title: 'Business empire',
    desc: 'Own 100 operations in total.',
    icon: 'building',
    metric: totalOps,
    target: 100,
    mode: 'absolute',
    rewards: [cash(900, 50_000), incomeBuff(2, 10)],
  },
  {
    id: 'sponsor_goal',
    title: 'Deliver for the sponsor',
    desc: 'Complete a sponsor goal.',
    icon: 'target',
    metric: (s) => s.stats.sponsorGoals,
    target: 1,
    mode: 'delta',
    available: (s) => s.sponsors.active.length > 0,
    rewards: [cash(900, 50_000), trophies(1)],
  },
  {
    id: 'tier_5',
    title: 'Semi-pro',
    desc: 'Reach the Semi-Pro Circuit with any team.',
    icon: 'trophy',
    metric: bestTier,
    target: 4,
    mode: 'absolute',
    available: hasPlayer,
    rewards: [trophies(2), cash(1_200, 100_000)],
  },
  {
    id: 'sell_org',
    title: 'The big exit',
    desc: 'Sell the org for legacy in the Legacy tab.',
    icon: 'crown',
    metric: (s) => s.stats.orgsSold,
    target: 1,
    mode: 'delta',
    available: (s) => s.stats.orgsSold > 0 || pendingLegacy(s) >= 1,
    rewards: [{ kind: 'legacy', amount: 3 }, trophies(5)],
  },
];

export const QUEST_MAP: Map<string, QuestDef> = new Map(QUESTS.map((q) => [q.id, q]));
