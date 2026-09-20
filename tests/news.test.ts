import { describe, expect, it } from 'vitest';
import { NEWS } from '../src/data/news';
import { pickNews, renderNews } from '../src/engine/news';
import { Rng } from '../src/engine/rng';
import { foundedGame } from './fixtures';
import { createNewGame } from '../src/engine/state';
import { pickOpponent } from '../src/engine/stories';
import type { GameState } from '../src/engine/types';

/** A state far enough along that most conditional lines are eligible. */
function lateGame(): GameState {
  const s = foundedGame(0, 6);
  s.earnedRun = 1e31;
  s.fans = 1e13;
  s.stats.matchesWon = 5000;
  s.stats.orgsSold = 4;
  s.stats.playersRetired = 2;
  for (const id of ['arcade', 'napPods', 'aquarium', 'cat', 'espresso', 'zeroG']) s.decor[id] = true;
  s.games.rocket.unlocked = true;
  s.games.counter.unlocked = true;
  s.events.log.unshift({ time: s.time, title: 'Hardware flash sale!', body: '', icon: 'cpu', tone: 'good' });
  pickOpponent(s, new Rng({ rng: 1 }));
  return s;
}

/** Every line the ticker could show right now. */
function eligible(s: GameState): string[] {
  return NEWS.filter((n) => !n.when || n.when(s)).map((n) => renderNews(n.text, s, () => 0));
}

describe('news ticker', () => {
  it('has a big pool of lines, all unique', () => {
    expect(NEWS.length).toBeGreaterThanOrEqual(200);
    expect(new Set(NEWS.map((n) => n.text)).size).toBe(NEWS.length);
  });

  it('fills every placeholder, early and late', () => {
    for (const s of [foundedGame(0, 6), lateGame()]) {
      for (const n of NEWS) {
        expect(() => n.when?.(s)).not.toThrow();
        const text = renderNews(n.text, s, () => 0.5);
        expect(text, n.text).not.toMatch(/[{}]|undefined|null/);
      }
    }
  });

  it('names the rival only when there is one', () => {
    const s = foundedGame(0, 6);
    expect(renderNews('{rival} again', s)).toBe('a rival org again');
    s.stats.matchesWon = 50;
    pickOpponent(s, new Rng({ rng: 1 }));
    expect(renderNews('{rival} again', s)).toBe(`${s.rival!.name} again`);
  });

  it('keeps early news to what a brand-new org has', () => {
    const s = createNewGame(0, 6);
    const early = eligible(s);
    expect(early.length).toBeGreaterThan(60);
    for (const text of early) {
      expect(text, text).not.toMatch(/\bcoach|\bbench|network engineer|physio|\bhouse\b|social media manager|\bCFO\b|winning team|rival team/i);
    }
  });

  it('brings in staff and places as the org gets them', () => {
    const s = foundedGame(0, 6);
    const has = (re: RegExp) => eligible(s).some((t) => re.test(t));
    expect(has(/network engineer/)).toBe(false);
    s.ops.lan.owned = 1;
    expect(has(/network engineer/)).toBe(true);
    expect(has(/ coach/)).toBe(false);
    s.staff.coach = 1;
    expect(has(/ coach/)).toBe(true);
  });

  it('retires small audience stories when the fanbase grows', () => {
    const s = foundedGame(0, 6);
    s.ops.streamer.owned = 1;
    s.fans = 1_500;
    expect(eligible(s).some((t) => t.includes('Six people and a cardboard cutout'))).toBe(true);
    expect(eligible(s).some((t) => t.includes('3 concurrent viewers'))).toBe(true);
    s.fans = 1_000_000;
    expect(eligible(s).some((t) => t.includes('Six people and a cardboard cutout'))).toBe(false);
    expect(eligible(s).some((t) => t.includes('3 concurrent viewers'))).toBe(false);
    expect(eligible(s).some((t) => t.includes('fan meet fills an arena'))).toBe(true);
  });

  it('reports world events, hot games and the next release', () => {
    const s = lateGame();
    s.games.counter.popularity = 3;
    s.games.rocket.popularity = 0.2;
    expect(renderNews('{event}', s)).toBe('Hardware flash sale');
    expect(renderNews('{hotgame}/{coldgame}/{newgame}/{nextgame}', s)).toBe('Counter-Stroke/Rocket Soccar/Counter-Stroke/League of Lanes');
    expect(eligible(s).some((t) => t.startsWith('BREAKING: Hardware flash sale.'))).toBe(true);
    s.time += 600;
    expect(eligible(s).some((t) => t.startsWith('BREAKING'))).toBe(false);
  });

  it('picks an eligible line and avoids repeating the last one', () => {
    const s = foundedGame(0, 6);
    const first = pickNews(s, () => 0);
    expect(first.length).toBeGreaterThan(10);
    expect(pickNews(s, () => 0, first)).not.toBe(first);
  });
});
