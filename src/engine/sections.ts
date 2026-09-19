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
  /** Opens the section. Sections without one are always open. Once open, a section stays open. */
  unlock?: (s: GameState) => boolean;
  /** How to open it, shown on the locked tab. */
  requirement?: (s: GameState) => string;
  /** Popup when it opens. */
  announce?: string;
}

const teamCount = (s: GameState) => Object.keys(s.teams).length;
const playerCount = (s: GameState) => Object.keys(s.players).length;

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
    unlock: (s) => playerCount(s) > 0 && !tutorialActive(s) && s.cash >= MARKET_UNLOCK_CASH,
    requirement: (s) =>
      tutorialActive(s) ? 'Finish the tutorial' : `Have ${money(MARKET_UNLOCK_CASH)} in the bank (${money(Math.floor(s.cash))} now)`,
    announce: 'The transfer market is open. Sign players to fill your teams and bench. Open it for a quick guide to reading a player.',
  },
  {
    id: 'achievements',
    unlock: (s) => Object.keys(s.achievements).length > 0,
    requirement: () => 'Unlock an achievement',
    announce: 'Every achievement adds to your trophy cabinet, which boosts income.',
  },
  {
    id: 'roster',
    unlock: (s) => playerCount(s) >= 3,
    requirement: () => 'Sign 3 players',
    announce: 'Every player you have signed, across all your teams, in one place.',
  },
  {
    id: 'studio',
    unlock: (s) => s.fansRun >= STUDIO_UNLOCK_FANS,
    requirement: (s) => `Reach ${fmt(STUDIO_UNLOCK_FANS)} fans (${fmt(s.fansRun)} so far)`,
    announce: 'Draw your own logo and jersey, and pick your team colours. Merch comes later.',
  },
  {
    id: 'house',
    unlock: (s) => teamCount(s) >= 2,
    requirement: () => 'Found your second team',
    announce: 'Your players need somewhere to live. Decor keeps them happy and healthy.',
  },
  {
    id: 'sponsors',
    unlock: (s) => sponsorsUnlocked(s),
    requirement: (s) => `Reach ${fmt(SPONSORS_UNLOCK_FANS)} fans (${fmt(s.fansRun)} so far)`,
    announce: 'Brands want in. Sponsors pay a share of your income for as long as the deal runs.',
  },
  {
    id: 'staff',
    unlock: (s) => teamCount(s) >= 3,
    requirement: () => 'Found your third team',
    announce: 'Hire coaches, chefs, scouts and more. Staff help every team at once.',
  },
  {
    id: 'legacy',
    unlock: (s) => s.prestige.runs > 0 || s.earnedTotal >= LEGACY_TAB_EARNED,
    requirement: () => `Earn ${money(LEGACY_TAB_EARNED)} in total`,
    announce: 'Your org is worth something now. One day you can sell it for legacy points.',
  },
  { id: 'stats' },
  { id: 'options' },
];

export const SECTION_MAP: Map<string, SectionDef> = new Map(SECTIONS.map((d) => [d.id, d]));

export function sectionOpen(s: GameState, id: string): boolean {
  const def = SECTION_MAP.get(id);
  return !def?.unlock || s.sections[id] !== undefined;
}

/** Opens every section whose condition is now met, announcing each one. */
export function updateSections(s: GameState, announce = true): string[] {
  const opened: string[] = [];
  for (const def of SECTIONS) {
    if (!def.unlock || s.sections[def.id] !== undefined || !def.unlock(s)) continue;
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
