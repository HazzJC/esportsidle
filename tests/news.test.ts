import { describe, expect, it } from 'vitest';
import { NEWS } from '../src/data/news';
import { pickNews, renderNews } from '../src/engine/news';
import { Rng } from '../src/engine/rng';
import { createNewGame } from '../src/engine/state';
import { pickOpponent } from '../src/engine/stories';
import type { GameState } from '../src/engine/types';

/** A state far enough along that most conditional lines are eligible. */
function lateGame(): GameState {
  const s = createNewGame(0, 6);
  s.earnedRun = 1e31;
  s.fans = 1e13;
  s.stats.matchesWon = 5000;
  s.stats.orgsSold = 4;
  s.stats.playersRetired = 2;
  for (const id of ['arcade', 'napPods', 'aquarium', 'cat', 'espresso', 'zeroG']) s.decor[id] = true;
  pickOpponent(s, new Rng({ rng: 1 }));
  return s;
}

describe('news ticker', () => {
  it('has a big pool of lines, all unique', () => {
    expect(NEWS.length).toBeGreaterThanOrEqual(200);
    expect(new Set(NEWS.map((n) => n.text)).size).toBe(NEWS.length);
  });

  it('fills every placeholder, early and late', () => {
    for (const s of [createNewGame(0, 6), lateGame()]) {
      for (const n of NEWS) {
        expect(() => n.when?.(s)).not.toThrow();
        const text = renderNews(n.text, s, () => 0.5);
        expect(text, n.text).not.toMatch(/[{}]|undefined|null/);
      }
    }
  });

  it('names the rival only when there is one', () => {
    const s = createNewGame(0, 6);
    expect(renderNews('{rival} again', s)).toBe('a rival org again');
    s.stats.matchesWon = 50;
    pickOpponent(s, new Rng({ rng: 1 }));
    expect(renderNews('{rival} again', s)).toBe(`${s.rival!.name} again`);
  });

  it('picks an eligible line and avoids repeating the last one', () => {
    const s = createNewGame(0, 6);
    const first = pickNews(s, () => 0);
    expect(first.length).toBeGreaterThan(10);
    expect(pickNews(s, () => 0, first)).not.toBe(first);
  });
});
