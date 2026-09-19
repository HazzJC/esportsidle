import type { GameState } from '../engine/types';

export type TutorialStep = 'click' | 'draft' | 'match' | 'grinder' | 'streamer' | 'done';

/** Where a step points: the element the coach card highlights and "Show me" goes to. */
export type TutorialTarget = 'logo' | 'draft' | 'matches' | 'store';

export interface TutorialStepDef {
  id: Exclude<TutorialStep, 'done'>;
  title: string;
  body: string;
  icon: string;
  target: TutorialTarget;
  /** Progress towards finishing the step; the step is done when value reaches target. */
  progress: (s: GameState) => { value: number; target: number };
}

/** What the first player costs: 25 clicks at $1 each. */
export const FIRST_PLAYER_PRICE = 25;

const players = (s: GameState) => Object.keys(s.players).length;

/**
 * The first few minutes of a new org. It starts with nothing but a logo to click, signs a first
 * player (the active side: players, matches and seasons), then buys operations (the passive side,
 * which earns on its own). Operations stay hidden until the org has a player, so the two halves
 * arrive one at a time.
 */
export const TUTORIAL_STEPS: TutorialStepDef[] = [
  {
    id: 'click',
    title: `Click your way to $${FIRST_PLAYER_PRICE}`,
    body: `Every click on your logo earns $1 and builds hype. Your first player costs $${FIRST_PLAYER_PRICE}, so get clicking.`,
    icon: 'mouse-pointer-click',
    target: 'logo',
    progress: (s) => ({ value: players(s) > 0 ? FIRST_PLAYER_PRICE : Math.min(FIRST_PLAYER_PRICE, Math.floor(s.cash)), target: FIRST_PLAYER_PRICE }),
  },
  {
    id: 'draft',
    title: 'Sign your first player',
    body: 'Sign a rookie to found your first team. Name them and change their look if you like: your first player is your founding player and stays for good.',
    icon: 'user-plus',
    target: 'draft',
    progress: (s) => ({ value: Math.min(1, players(s)), target: 1 }),
  },
  {
    id: 'match',
    title: 'Your first match',
    body: 'This is your team. They play a match every 15 seconds on their own, sixteen to a season, and strong seasons earn promotion to richer leagues. Watch the bar fill: your first match is about to start. Players, gear and seasons are the active side of your org.',
    icon: 'swords',
    target: 'matches',
    progress: (s) => ({ value: Math.min(1, s.stats.matchesWon + s.stats.matchesLost), target: 1 }),
  },
  {
    id: 'grinder',
    title: 'Build passive income',
    body: 'Operations earn money every second, even while the game is closed. They are the passive side of your org. Buy a Ranked Grinder.',
    icon: 'gamepad-2',
    target: 'store',
    progress: (s) => ({ value: Math.min(1, s.ops.grinder?.owned ?? 0), target: 1 }),
  },
  {
    id: 'streamer',
    title: 'Grow the business',
    body: 'Each operation costs a little more than the last, and bigger ones earn far more. Save up for a Streamer.',
    icon: 'video',
    target: 'store',
    progress: (s) => ({ value: Math.min(1, s.ops.streamer?.owned ?? 0), target: 1 }),
  },
];

export const TUTORIAL_ORDER: TutorialStep[] = [...TUTORIAL_STEPS.map((d) => d.id), 'done'];
