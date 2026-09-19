import { addFounder, createNewGame } from '../src/engine/state';
import { skipTutorial } from '../src/engine/tutorial';
import type { GameState } from '../src/engine/types';

/**
 * An org that is already up and running: a founder playing Smash Siblings solo and the tutorial
 * finished. Most engine tests start here; tests of the new-player flow use createNewGame directly.
 */
export function foundedGame(now = 0, seed?: number): GameState {
  const s = createNewGame(now, seed);
  addFounder(s);
  skipTutorial(s);
  return s;
}
