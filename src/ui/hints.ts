import { QUEST_MAP, type QuestHint } from '../data/quests';
import type { GameState } from '../engine/types';
import { game } from './game.svelte';

/**
 * Quests whose next step is one click away keep their target pulsing while they are live, the way
 * the tutorial does: the player rig for "Gear up", the Staff tab for "Hire help". Long goals (win a
 * title, own 100 operations) only flash their target when the player presses "Show me".
 */
const PULSING: ReadonlySet<QuestHint> = new Set(['player', 'plan', 'found', 'upgrades', 'logo', 'market', 'staff', 'house', 'studio', 'sponsors']);

/** The live quest's hint if its target should pulse right now. */
export function liveQuestHint(s: GameState): QuestHint | null {
  const q = s.quests.active[0];
  if (!q || q.ready || s.tutorial.step !== 'done') return null;
  const def = QUEST_MAP.get(q.id);
  if (!def?.hint) return null;
  if (def.hint === 'store') return def.id === 'grinders_10' ? 'store' : null;
  return PULSING.has(def.hint) ? def.hint : null;
}

/** Whether a target should pulse: the live quest points at it, or the player just pressed "Show me". */
export function hinted(s: GameState, hint: QuestHint): boolean {
  return game.hintFlash === hint || liveQuestHint(s) === hint;
}
