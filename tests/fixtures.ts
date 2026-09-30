import { FINAL_OPERATION } from '../src/engine/prestige';
import { openAllSections } from '../src/engine/sections';
import { addFounder, createNewGame } from '../src/engine/state';
import { CALM_START_SECONDS, skipTutorial } from '../src/engine/tutorial';
import type { GameState } from '../src/engine/types';

/**
 * An org that is already up and running: a founder playing Smash Siblings solo, the tutorial and the
 * calm start behind it, and every tab open. Most engine tests start here; tests of the new-player
 * flow use createNewGame directly.
 */
export function foundedGame(now = 0, seed?: number): GameState {
  const s = createNewGame(now, seed);
  addFounder(s);
  skipTutorial(s);
  openAllSections(s);
  s.stats.playtimeTotal = CALM_START_SECONDS;
  return s;
}

/** Marks the operations ladder climbed once (a first Multiverse Championship), which opens the first sale. */
export function finishLadder(s: GameState): void {
  const st = s.ops[FINAL_OPERATION.id];
  st.highest = Math.max(1, st.highest);
}
