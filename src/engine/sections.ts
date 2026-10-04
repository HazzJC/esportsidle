import { fmt, money } from './format';
import { emit } from './bus';
import { sponsorsUnlocked } from './sponsors';
import { tutorialActive } from './tutorial';
import type { GameState } from './types';
import { SPONSORS_UNLOCK_FANS } from '../data/sponsors';

/** Fans needed before the Studio opens: enough of a following to care about the kit. */
export const STUDIO_UNLOCK_FANS = 500;
/** Cash in hand that opens the transfer market: enough to afford a second player. */
export const MARKET_UNLOCK_CASH = 500;
/** All-time earnings that open the Legacy tab, well before the first point, so the goal is visible. */
export const LEGACY_TAB_EARNED = 1e12;

export interface SectionDef {
  id: string;
  /** The tab's name, for messages about it (the same label the tab strip shows). */
  name?: string;
  /**
   * What the org needs before the section can open. Sections without one are always open. Once open,
   * a section stays open, across sales too.
   */
  unlock?: (s: GameState) => boolean;
  /**
   * The quest that opens the section in the first run. The quest line is followed in order, and its
   * quest is offered once `unlock` is met; offering it opens the section, so each system arrives with
   * the quest that explains it. After the first sale the section opens on `unlock` alone.
   */
  quest?: string;
  /** How to open it, shown on the locked tab. */
  requirement?: (s: GameState) => string;
  /** How far the org is towards `unlock`, for a progress bar while the quest line waits. */
  progress?: (s: GameState) => { value: number; target: number };
  /** Popup when it opens. */
  announce?: string;
}

const teamCount = (s: GameState) => Object.keys(s.teams).length;
const playerCount = (s: GameState) => Object.keys(s.players).length;
/** Players signed opens the Staff tab: the founder and one signing from the market. */
export const STAFF_UNLOCK_SIGNINGS = 2;

/**
 * The centre tabs open one at a time as the org grows, so a new player meets each system when it
 * becomes useful instead of all at once.
 */
export const SECTIONS: SectionDef[] = [
  { id: 'hq' },
  // Teams is where a new org starts: the first player is signed there.
  { id: 'teams' },
  {
    id: 'market',
    name: 'Market',
    unlock: (s) => playerCount(s) > 0 && !tutorialActive(s) && s.cash >= MARKET_UNLOCK_CASH,
    quest: 'scout_1',
    requirement: (s) =>
      tutorialActive(s) ? 'Finish the tutorial' : `Have ${money(MARKET_UNLOCK_CASH)} in the bank (${money(Math.floor(s.cash))} now)`,
    progress: (s) => ({ value: Math.min(MARKET_UNLOCK_CASH, Math.floor(s.cash)), target: MARKET_UNLOCK_CASH }),
    announce: 'The transfer market is open. Sign players to fill your teams and bench. Open it for a quick guide to reading a player.',
  },
  {
    id: 'achievements',
    name: 'Trophies',
    unlock: (s) => Object.keys(s.achievements).length > 0,
    requirement: () => 'Unlock an achievement',
    announce: 'Every achievement adds to your trophy cabinet, which boosts income.',
  },
  {
    id: 'studio',
    name: 'Studio',
    unlock: (s) => s.fansRun >= STUDIO_UNLOCK_FANS,
    quest: 'design_shirt',
    requirement: (s) => `Reach ${fmt(STUDIO_UNLOCK_FANS)} fans (${fmt(s.fansRun)} so far)`,
    progress: (s) => ({ value: Math.min(STUDIO_UNLOCK_FANS, s.fansRun), target: STUDIO_UNLOCK_FANS }),
    announce: 'Draw your own logo and jersey, and pick your team colours. Merch comes later.',
  },
  {
    id: 'house',
    name: 'House',
    unlock: (s) => teamCount(s) >= 2,
    quest: 'decor_1',
    requirement: () => 'Found your second team',
    progress: (s) => ({ value: Math.min(2, teamCount(s)), target: 2 }),
    announce: 'Your players need somewhere to live. Decor keeps them happy and healthy.',
  },
  {
    id: 'sponsors',
    name: 'Sponsors',
    unlock: (s) => sponsorsUnlocked(s),
    quest: 'sponsor_1',
    requirement: (s) => `Reach ${fmt(SPONSORS_UNLOCK_FANS)} fans (${fmt(s.fansRun)} so far)`,
    progress: (s) => ({ value: Math.min(SPONSORS_UNLOCK_FANS, s.fansRun), target: SPONSORS_UNLOCK_FANS }),
    announce: 'Brands want in. Three snack brands are calling first: compare what each one does, then sign one.',
  },
  {
    id: 'staff',
    name: 'Staff',
    unlock: (s) => s.stats.playersSigned >= STAFF_UNLOCK_SIGNINGS,
    quest: 'staff_1',
    requirement: (s) => `Sign ${STAFF_UNLOCK_SIGNINGS} players (${Math.min(STAFF_UNLOCK_SIGNINGS, s.stats.playersSigned)} so far)`,
    progress: (s) => ({ value: Math.min(STAFF_UNLOCK_SIGNINGS, s.stats.playersSigned), target: STAFF_UNLOCK_SIGNINGS }),
    announce: 'Hire coaches, chefs, scouts and more. Staff help every team at once, and each kind of staff brings a handy tool with their first hire.',
  },
  {
    id: 'legacy',
    name: 'Legacy',
    unlock: (s) => s.prestige.runs > 0 || s.earnedTotal >= LEGACY_TAB_EARNED,
    requirement: () => `Earn ${money(LEGACY_TAB_EARNED)} in total`,
    announce: 'Your org is worth something now. One day you can sell it for legacy points.',
  },
  { id: 'stats' },
  { id: 'options' },
];

export const SECTION_MAP: Map<string, SectionDef> = new Map(SECTIONS.map((d) => [d.id, d]));

/**
 * Seconds that must pass after a quest opens a tab before the next tab-opening quest is offered. A
 * player who has been waiting on one quest can have the requirements for the next few met already;
 * without a breather the line would then open a new tab every minute or so.
 */
export const SECTION_BREATHER = 120;

/** The tab a quest opens in the first run, if it opens one. */
export function questSection(questId: string): SectionDef | undefined {
  return SECTIONS.find((d) => d.quest === questId);
}

/** Why the next tab-opening quest has to wait: a new tab nobody has looked at yet, or a short breather. */
export type SectionPace = { reason: 'visit'; section: string } | { reason: 'breather'; section: string; until: number; since: number };

/**
 * Whether a quest that opens a new tab should wait before it is offered. It waits until every tab a
 * quest has opened has been visited (the badge alone is easy to miss), and until a short breather has
 * passed since the last one opened, so each new system gets a moment of its own. Null when it can go.
 */
export function sectionPace(s: GameState): SectionPace | null {
  let last: { id: string; at: number } | null = null;
  for (const def of SECTIONS) {
    const at = s.sections[def.id];
    if (!def.quest || at === undefined) continue;
    if (!s.sectionsSeen[def.id]) return { reason: 'visit', section: def.id };
    if (!last || at > last.at) last = { id: def.id, at };
  }
  if (last && s.time < last.at + SECTION_BREATHER) return { reason: 'breather', section: last.id, since: last.at, until: last.at + SECTION_BREATHER };
  return null;
}

/** Whether the org meets a section's own requirement, quest or not. Sections without one always do. */
export function sectionReady(s: GameState, id: string): boolean {
  const def = SECTION_MAP.get(id);
  return !def?.unlock || def.unlock(s);
}

/** Whether the quest line has reached a quest: it is on the board or already claimed this run. */
function questReached(s: GameState, questId: string): boolean {
  return s.quests.done[questId] !== undefined || s.quests.active.some((q) => q.id === questId);
}

/**
 * Whether a closed section should open now. In the first run a section with a quest waits for the
 * quest line to reach it (the quest is offered only once the requirement is met, so reaching it is
 * enough even if, say, the cash has been spent since). After a sale the requirement alone opens it.
 */
function shouldOpen(s: GameState, def: SectionDef): boolean {
  if (!def.unlock) return true;
  if (def.quest && s.prestige.runs === 0 && s.stats.orgsSold === 0) return questReached(s, def.quest);
  return def.unlock(s);
}

export function sectionOpen(s: GameState, id: string): boolean {
  const def = SECTION_MAP.get(id);
  return !def?.unlock || s.sections[id] !== undefined;
}

/** Opens every section whose condition is now met, announcing each one. */
export function updateSections(s: GameState, announce = true): string[] {
  const opened: string[] = [];
  for (const def of SECTIONS) {
    if (!def.unlock || s.sections[def.id] !== undefined || !shouldOpen(s, def)) continue;
    s.sections[def.id] = s.time;
    opened.push(def.id);
    if (announce && def.announce) emit({ type: 'section', id: def.id, text: def.announce });
  }
  return opened;
}

/** Opens everything, for orgs that were already well established. */
export function openAllSections(s: GameState): void {
  for (const def of SECTIONS) if (def.unlock) s.sections[def.id] ??= s.time;
}
