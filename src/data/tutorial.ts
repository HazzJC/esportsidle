import type { GameState } from '../engine/types';

export type TutorialStep = 'click' | 'draft' | 'match' | 'rest' | 'grinder' | 'streamer' | 'done';

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

/** How long the tutorial's scripted injury lasts, so nobody is stuck if they miss the step. */
export const TUTORIAL_INJURY_SECONDS = 60;

/** The player the tutorial follows: the founder, or the first player signed. */
export function tutorialPlayer(s: GameState) {
  return s.players.founder ?? Object.values(s.players)[0];
}

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
    title: 'Your first win',
    body: 'This is your team. They play a match every 15 seconds on their own, sixteen to a season, and strong seasons earn promotion to richer leagues. Watch the bar fill and wait for your first win. Players, gear and seasons are the active side of your org.',
    icon: 'swords',
    target: 'matches',
    progress: (s) => ({ value: Math.min(1, s.stats.matchesWon), target: 1 }),
  },
  {
    id: 'rest',
    title: 'Rest an injured player',
    body: 'Your player strained a wrist celebrating that win. Drag them off their computer and onto the bench: benched players recover twice as fast. It heals on its own within a minute if you leave it.',
    icon: 'bandage',
    target: 'matches',
    progress: (s) => {
      const p = tutorialPlayer(s);
      const healthy = !p || p.status.kind === 'healthy' || p.status.until <= s.time;
      return { value: healthy ? 1 : 0, target: 1 };
    },
  },
  {
    id: 'grinder',
    title: 'Build passive income',
    body: 'Operations earn money every second, even while the game is closed. They are the passive side of your org. Click your logo until you have $15, then buy a Ranked Grinder.',
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
