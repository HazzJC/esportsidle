import { emptyGear } from '../data/gear';
import { GAMES, getGame } from '../data/games';
import { CHALLENGE_MAP, LEGACY_NODES, LEGACY_NODE_MAP, type ChallengeDef, type LegacySpecial } from '../data/legacy';
import { tierName } from '../data/leagues';
import { OPERATIONS } from '../data/operations';
import { UPGRADE_MAP } from '../data/upgrades';
import { emit } from './bus';
import { fmt } from './format';
import { refreshMarket } from './market';
import { skillRating } from './players';
import { Rng } from './rng';
import { createGames, createOps, createStaff, setupNewRun } from './state';
import { addToTeam, createTeam } from './teams';
import type { Effect, GameState, HallOfFameEntry, Player } from './types';

/** All-time earnings needed for the first legacy point; later points follow a cube curve. */
export const LEGACY_DIVISOR = 1e12;
export const BASE_LEGACY_LEVEL_PCT = 0.01;
export const LEGEND_RATING_BONUS = 0.05;
export const LEGEND_FANS_BONUS = 0.02;
export const MAX_HALL_OF_FAME = 50;

export function legacyFor(earned: number): number {
  return Math.floor(Math.cbrt(Math.max(0, earned) / LEGACY_DIVISOR));
}

export function pendingLegacy(s: GameState): number {
  return Math.max(0, legacyFor(s.earnedTotal) - s.prestige.level);
}

/** All-time earnings needed for one more legacy point than would be gained now. */
export function nextLegacyThreshold(s: GameState): number {
  const next = Math.max(s.prestige.level, legacyFor(s.earnedTotal)) + 1;
  return Math.pow(next, 3) * LEGACY_DIVISOR;
}

export function canSell(s: GameState): boolean {
  return pendingLegacy(s) >= 1;
}

// ---------------------------------------------------------------------------
// Legacy tree
// ---------------------------------------------------------------------------
export function hasNode(s: GameState, id: string): boolean {
  return s.prestige.nodes[id] !== undefined;
}

export function hasSpecial(s: GameState, kind: LegacySpecial['kind']): boolean {
  for (const id in s.prestige.nodes) {
    if (LEGACY_NODE_MAP.get(id)?.special?.some((sp) => sp.kind === kind)) return true;
  }
  return false;
}

export type NodeState = 'owned' | 'available' | 'locked';

export function nodeState(s: GameState, id: string): NodeState {
  if (hasNode(s, id)) return 'owned';
  const def = LEGACY_NODE_MAP.get(id);
  if (!def) return 'locked';
  return def.requires.every((r) => hasNode(s, r)) ? 'available' : 'locked';
}

export function buyNode(s: GameState, id: string): boolean {
  const def = LEGACY_NODE_MAP.get(id);
  if (!def || nodeState(s, id) !== 'available' || s.prestige.points < def.cost) return false;
  s.prestige.points -= def.cost;
  s.prestige.spent += def.cost;
  s.prestige.nodes[id] = Date.now();
  s.stats.legacyNodes++;
  return true;
}

export interface LegacyBonuses {
  effects: Effect[];
  gameRating: Record<string, number>;
  fansMult: number;
}

/** Permanent effects from legacy nodes, completed challenges and retired legends. */
export function legacyBonuses(s: GameState): LegacyBonuses {
  const out: LegacyBonuses = { effects: [], gameRating: {}, fansMult: 1 };
  for (const id in s.prestige.nodes) {
    const def = LEGACY_NODE_MAP.get(id);
    if (def?.effects) out.effects.push(...def.effects);
  }
  for (const id in s.prestige.challengesDone) {
    const def = CHALLENGE_MAP.get(id);
    if (def) out.effects.push(...def.rewardEffects);
  }
  for (const legend of s.prestige.legends) {
    out.gameRating[legend.gameId] = (out.gameRating[legend.gameId] ?? 1) * (1 + LEGEND_RATING_BONUS);
    out.fansMult *= 1 + LEGEND_FANS_BONUS;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Challenges
// ---------------------------------------------------------------------------
export function activeChallenge(s: GameState): ChallengeDef | undefined {
  return s.prestige.challenge ? CHALLENGE_MAP.get(s.prestige.challenge) : undefined;
}

export function checkChallenge(s: GameState): boolean {
  const challenge = activeChallenge(s);
  if (!challenge || !challenge.check(s)) return false;
  s.prestige.challengesDone[challenge.id] = Date.now();
  s.prestige.challenge = null;
  s.stats.challengesCompleted++;
  emit({
    type: 'toast',
    title: `Challenge complete: ${challenge.name}!`,
    body: `${challenge.reward}. Restrictions lifted for the rest of the run.`,
    icon: challenge.icon,
    tone: 'gold',
  });
  return true;
}

// ---------------------------------------------------------------------------
// Selling the org
// ---------------------------------------------------------------------------
export interface SellOptions {
  keepPlayerId?: string | null;
  retirePlayerId?: string | null;
  challenge?: string | null;
}

function startBonuses(s: GameState): void {
  const games = new Set<string>();
  for (const id in s.prestige.nodes) {
    for (const sp of LEGACY_NODE_MAP.get(id)?.special ?? []) {
      switch (sp.kind) {
        case 'startCash':
          s.cash = Math.max(s.cash, sp.amount);
          break;
        case 'startOps':
          for (const [op, count] of Object.entries(sp.ops)) {
            if (!s.ops[op]) continue;
            s.ops[op].owned += count;
            s.ops[op].highest = Math.max(s.ops[op].highest, s.ops[op].owned);
          }
          break;
        case 'startGame':
          games.add(sp.game);
          break;
        case 'startStaff':
          for (const [staff, count] of Object.entries(sp.staff)) s.staff[staff] = (s.staff[staff] ?? 0) + count;
          break;
        default:
          break;
      }
    }
  }
  for (const gameId of games) {
    const target = getGame(gameId).index;
    for (const g of GAMES) {
      if (g.index > target) break;
      s.games[g.id].unlocked = true;
      if (!s.teams[g.id]) s.teams[g.id] = createTeam(g.id);
    }
  }
}

function resetPlayerForNewRun(p: Player): Player {
  return {
    ...p,
    gear: emptyGear(),
    energy: 100,
    morale: 75,
    status: { kind: 'healthy', until: 0, reason: '' },
    matches: 0,
    wins: 0,
  };
}

export function sellOrg(s: GameState, options: SellOptions = {}): HallOfFameEntry | null {
  const gained = pendingLegacy(s);
  if (gained < 1) return null;

  const players = Object.values(s.players);
  const mvp = [...players].sort((a, b) => b.wins - a.wins)[0];
  let bestTier = 0;
  let bestGame: string | null = null;
  for (const team of Object.values(s.teams)) {
    if (bestGame === null || team.bestTier > bestTier) {
      bestTier = team.bestTier;
      bestGame = team.gameId;
    }
  }
  const baseline = s.prestige.runBaseline;
  const entry: HallOfFameEntry = {
    run: s.prestige.runs + 1,
    orgName: s.org.name,
    logo: s.org.logo,
    earned: s.earnedRun,
    legacyGained: gained,
    bestTier,
    bestGame,
    titles: s.stats.seasonTitles - baseline.seasonTitles,
    tournamentsWon: s.stats.tournamentsWon - baseline.tournamentsWon,
    matchesWon: s.stats.matchesWon - baseline.matchesWon,
    mvp: mvp
      ? { tag: mvp.tag, first: mvp.first, last: mvp.last, gameId: mvp.gameId, rarity: mvp.rarity, look: { ...mvp.look }, wins: mvp.wins, founder: mvp.founder }
      : null,
    retired: null,
    kept: null,
    duration: s.time - s.runStartTime,
    endedAt: Date.now(),
    challenge: s.prestige.challenge,
  };

  // Carry-overs -------------------------------------------------------------
  const keepId = hasSpecial(s, 'keepPlayer') ? options.keepPlayerId : null;
  const kept = keepId && s.players[keepId] && !s.players[keepId].founder ? resetPlayerForNewRun(s.players[keepId]) : null;
  if (kept) entry.kept = kept.tag;

  const retireId = hasSpecial(s, 'legends') ? options.retirePlayerId : null;
  const retiree = retireId && retireId !== keepId ? s.players[retireId] : undefined;
  if (retiree && !retiree.founder) {
    s.prestige.legends.push({
      tag: retiree.tag,
      first: retiree.first,
      last: retiree.last,
      gameId: retiree.gameId,
      look: { ...retiree.look },
      rating: skillRating(retiree),
      run: entry.run,
    });
    entry.retired = retiree.tag;
  }

  const oldFounder = s.players.founder;
  const founderIdentity = oldFounder
    ? { look: { ...oldFounder.look }, tag: oldFounder.tag, first: oldFounder.first, last: oldFounder.last, jersey: oldFounder.jersey, nation: oldFounder.nation }
    : null;
  const opLevels: Record<string, number> = {};
  for (const op of OPERATIONS) opLevels[op.id] = s.ops[op.id].level;
  const keptUpgrades = Object.fromEntries(Object.entries(s.upgrades).filter(([id]) => UPGRADE_MAP.get(id)?.currency === 'trophies'));
  const keepDecor = hasSpecial(s, 'keepDecor');
  const keepMerch = hasSpecial(s, 'keepMerch');

  // Reset the run -------------------------------------------------------------
  s.runStartTime = s.time;
  s.cash = 0;
  s.earnedRun = 0;
  s.fans = 0;
  s.fansRun = 0;
  s.hype = 0;
  s.lastClickTime = s.time - 100;
  s.ops = createOps();
  for (const op of OPERATIONS) s.ops[op.id].level = opLevels[op.id];
  s.upgrades = keptUpgrades;
  s.unlockedUpgrades = { ...keptUpgrades };
  s.buffs = [];
  s.games = createGames();
  s.teams = {};
  s.players = {};
  s.market = { listings: [], nextRefresh: 0, rerolls: 0 };
  s.staff = createStaff();
  if (!keepDecor) s.decor = {};
  s.drops = { nextAt: 0, active: [] };
  s.events = { nextAt: 0, pending: [], modifiers: [], log: [], calmUntil: 0, lastTournament: null };
  const lines: GameState['merch']['lines'] = {};
  if (keepMerch) {
    for (const [id, line] of Object.entries(s.merch.lines)) lines[id] = { ...line, launchedAt: s.time, sold: 0, revenue: 0 };
  }
  s.merch = { trend: s.merch.trend, trendEndsAt: 0, unlocked: keepMerch ? { ...s.merch.unlocked } : {}, lines };
  s.sponsors = { offers: [], active: [], nextRefresh: 0, history: [] };
  s.popularityClock = 0;
  s.stats.clicksRun = 0;
  s.stats.clickCashRun = 0;
  s.stats.orgsSold++;

  // Legacy --------------------------------------------------------------------
  s.prestige.level += gained;
  s.prestige.points += gained;
  s.prestige.runs++;
  s.prestige.hallOfFame.unshift(entry);
  if (s.prestige.hallOfFame.length > MAX_HALL_OF_FAME) s.prestige.hallOfFame.length = MAX_HALL_OF_FAME;
  const challenge = options.challenge && hasSpecial(s, 'challenges') ? CHALLENGE_MAP.get(options.challenge) : undefined;
  s.prestige.challenge = challenge && s.prestige.challengesDone[challenge.id] === undefined ? challenge.id : null;
  s.prestige.runBaseline = { seasonTitles: s.stats.seasonTitles, tournamentsWon: s.stats.tournamentsWon, matchesWon: s.stats.matchesWon };

  // New run -------------------------------------------------------------------
  setupNewRun(s);
  if (founderIdentity) Object.assign(s.players.founder, founderIdentity);
  startBonuses(s);
  if (kept) {
    if (s.games[kept.gameId]?.unlocked && s.teams[kept.gameId]) {
      s.players[kept.id] = kept;
      addToTeam(s, kept, { benchSlots: 1 });
    } else {
      s.prestige.reserve.push(kept);
    }
  }
  refreshMarket(s, new Rng(s), { scoutLuck: 0, marketSize: 0 });

  const best = bestGame ? `${getGame(bestGame).name}, ${tierName(bestTier)}` : 'no teams';
  emit({
    type: 'toast',
    title: `${entry.orgName} sold!`,
    body: `+${fmt(gained)} legacy. Best result: ${best}. A new chapter begins.`,
    icon: 'crown',
    tone: 'gold',
  });
  return entry;
}

export function legacyNodeCount(): number {
  return LEGACY_NODES.length;
}
