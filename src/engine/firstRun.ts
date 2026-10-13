import type { GameState } from './types';

/**
 * Set on every org that knows the chaptered quest line. Saves from before it get `migrateQuestLine`
 * (engine/questMigration.ts) on load: perks keep working as they were paid, and the line picks up
 * where the org had got to.
 */
export const QUEST_LINE_KNOWN = 'questline2';

/**
 * The guided first run. On an org's first run, when the player has not skipped the tutorial, the
 * world stays quiet until the quest line reaches each system: Hype Drops, decisions, the rival,
 * Invitationals and the rest wake one at a time, as the quest that explains them arrives. Later
 * runs, and orgs that skipped the tutorial, have everything awake from the start (apart from the
 * short calm start in `tutorial.ts`).
 */
export function guidedRun(s: GameState): boolean {
  return s.prestige.runs === 0 && s.stats.orgsSold === 0 && !s.tutorial.skipped;
}

/** Things that sleep through a guided first run until their quest. */
export type Waking =
  /** Hype Drops fall: once the crowd has gone wild for "Hype streak". */
  | 'drops'
  /** Hype Drops can carry an Invitational invite: from "Invitational winners". */
  | 'invites'
  /** Decision cards (poaching, investors, contracts): from "A tough call". */
  | 'decisions'
  /** Drama Drops: once "A tough call" has been claimed, which pays the PR shield. */
  | 'drama'
  /** World events that need no answer (meta shifts, viral clips, patches): once a second team plays. */
  | 'ambient'
  /** A rival org notices the team: from "Grudge match". */
  | 'rival'
  /** Random illness and injury: once "Best on the field" has taught the bench. */
  | 'health'
  /** The merch store in the Studio: from "Merch drop". */
  | 'merch'
  /** Cards to found a team in another game: from "Branch out". */
  | 'foundTeams'
  /** Trophy spending, on operation levels and trophy upgrades: once the Trophies tab is open. */
  | 'trophySpending'
  /**
   * Promotion out of the first league: once the org has its first title. Until then a team that is
   * ready to go up stays and dominates, so "League champions" never turns into a title chase in a
   * harder league. A title-winning season can still promote.
   */
  | 'promotion'
  /** Drop tier, Challenge, Auto-promote and Auto-sub on each team: once "League champions" is claimed. */
  | 'teamControls'
  /** The Staff tab's Front Office routines: from "Front office". */
  | 'frontOffice'
  /** Move-house cards: once the House tab is open. Moves before then happen quietly. */
  | 'houseMoves'
  /** Achievement popups: once the Trophies tab is open, which shows what they were. */
  | 'achievementPopups';

/** The quest line has reached a quest: it is live or claimed this run. */
export function questReached(s: GameState, id: string): boolean {
  return s.quests.done[id] !== undefined || s.quests.active.some((q) => q.id === id);
}

/** A quest has been claimed this run. */
export function questClaimed(s: GameState, id: string): boolean {
  return s.quests.done[id] !== undefined;
}

const WAKES: Record<Waking, (s: GameState) => boolean> = {
  drops: (s) => questClaimed(s, 'crowd_1'),
  invites: (s) => questReached(s, 'tourney_1'),
  decisions: (s) => questReached(s, 'event_1'),
  drama: (s) => questClaimed(s, 'event_1'),
  ambient: (s) => questClaimed(s, 'second_team'),
  rival: (s) => questReached(s, 'rival_1'),
  health: (s) => questClaimed(s, 'lineup_1'),
  merch: (s) => questReached(s, 'merch_1'),
  foundTeams: (s) => questReached(s, 'second_team'),
  trophySpending: (s) => s.sections.achievements !== undefined,
  promotion: (s) => s.stats.seasonTitles > 0,
  teamControls: (s) => questClaimed(s, 'title_1'),
  frontOffice: (s) => questReached(s, 'auto_1'),
  houseMoves: (s) => s.sections.house !== undefined,
  achievementPopups: (s) => s.sections.achievements !== undefined,
};

/** Whether a system is awake: always outside a guided first run, and from its quest inside one. */
export function awake(s: GameState, what: Waking): boolean {
  return !guidedRun(s) || WAKES[what](s);
}
