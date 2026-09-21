import { TUTORIAL_INJURY_SECONDS, TUTORIAL_ORDER, TUTORIAL_STEPS, tutorialPlayer, type TutorialStep, type TutorialStepDef } from '../data/tutorial';
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

/** Sets up what a step needs as it starts. The rest step hurts the first player, briefly. */
function enterStep(s: GameState, step: TutorialStep): void {
  if (step !== 'rest') return;
  const p = tutorialPlayer(s);
  if (!p) return;
  p.status = { kind: 'injured', until: s.time + TUTORIAL_INJURY_SECONDS, reason: 'Sore wrist from all that celebrating' };
  emit({
    type: 'toast',
    title: `${p.tag}: sore wrist`,
    body: 'Out for a minute. Drag them to the bench to rest.',
    icon: 'bandage',
    tone: 'bad',
    channel: 'players',
  });
}

/** Moves through every step that is already satisfied. Returns true when the step changed. */
export function updateTutorial(s: GameState): boolean {
  const start = s.tutorial.step;
  let def = currentStep(s);
  while (def && stepDone(s, def)) {
    s.tutorial.step = TUTORIAL_ORDER[tutorialIndex(def.id) + 1];
    enterStep(s, s.tutorial.step);
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

/**
 * During the rest step the bench heals the injured player on the spot and sends them straight back
 * to their computer, so the lesson lands without leaving the team short. Returns true if it did.
 */
export function restDuringTutorial(s: GameState, gameId: string, playerId: string, slot: number): boolean {
  if (s.tutorial.step !== 'rest') return false;
  const p = s.players[playerId];
  const team = s.teams[gameId];
  if (!p || !team || p.id !== tutorialPlayer(s)?.id || p.status.kind === 'healthy') return false;
  p.status = { kind: 'healthy', until: 0, reason: '' };
  p.energy = 100;
  const benchIndex = team.bench.indexOf(p.id);
  if (benchIndex >= 0 && slot >= 0 && slot < team.lineup.length && team.lineup[slot] === null) {
    team.bench.splice(benchIndex, 1);
    team.lineup[slot] = p.id;
  }
  emit({
    type: 'toast',
    title: `${p.tag} is fit again`,
    body: 'Instant, just this once. Normally the bench makes recovery twice as fast. Physios and later upgrades cut the risk of getting hurt, and some playstyles, like Push for Promotion, are riskier than others.',
    icon: 'heart-pulse',
    tone: 'gold',
    channel: 'players',
  });
  updateTutorial(s);
  return true;
}

export function skipTutorial(s: GameState): void {
  s.tutorial.step = 'done';
}
