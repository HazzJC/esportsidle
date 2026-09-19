import { TUTORIAL_ORDER, TUTORIAL_STEPS, type TutorialStep, type TutorialStepDef } from '../data/tutorial';
import { emit } from './bus';
import type { GameState } from './types';

export function tutorialIndex(step: TutorialStep): number {
  return TUTORIAL_ORDER.indexOf(step);
}

export function tutorialActive(s: GameState): boolean {
  return s.tutorial.step !== 'done';
}

export function currentStep(s: GameState): TutorialStepDef | undefined {
  return TUTORIAL_STEPS.find((d) => d.id === s.tutorial.step);
}

/**
 * Operations appear once the org has signed a player and seen a match, so the passive side of
 * the game arrives after the active side. Skipping the tutorial opens everything.
 */
export function operationsOpen(s: GameState): boolean {
  return tutorialIndex(s.tutorial.step) >= tutorialIndex('grinder');
}

function stepDone(s: GameState, def: TutorialStepDef): boolean {
  const p = def.progress(s);
  return p.value >= p.target;
}

/** Moves through every step that is already satisfied. Returns true when the step changed. */
export function updateTutorial(s: GameState): boolean {
  const start = s.tutorial.step;
  let def = currentStep(s);
  while (def && stepDone(s, def)) {
    s.tutorial.step = TUTORIAL_ORDER[tutorialIndex(def.id) + 1];
    def = currentStep(s);
  }
  if (s.tutorial.step === start) return false;
  if (s.tutorial.step === 'done') {
    emit({ type: 'toast', title: 'Tutorial complete', body: 'Your quest board is in HQ. Pick a quest, finish it and choose your reward.', icon: 'flag', tone: 'gold' });
  }
  return true;
}

/**
 * Playtime on a brand-new org before random events begin: no Hype Drops, world news, illness or
 * rival, so the first minutes follow the tutorial and the quests without interruptions.
 */
export const CALM_START_SECONDS = 480;

export function calmStart(s: GameState): boolean {
  return tutorialActive(s) || (s.prestige.runs === 0 && s.stats.playtimeTotal < CALM_START_SECONDS);
}

export function skipTutorial(s: GameState): void {
  s.tutorial.step = 'done';
}
