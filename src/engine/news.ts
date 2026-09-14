import { NEWS } from '../data/news';
import type { GameState } from './types';

export function renderNews(text: string, s: GameState): string {
  return text.replaceAll('{org}', s.org.name);
}

/** Picks a weighted random news line eligible for the current state. */
export function pickNews(s: GameState, random: () => number = Math.random, avoid?: string): string {
  const eligible = NEWS.filter((n) => (!n.when || n.when(s)) && n.text !== avoid);
  let total = 0;
  for (const n of eligible) total += n.weight ?? 1;
  let roll = random() * total;
  for (const n of eligible) {
    roll -= n.weight ?? 1;
    if (roll < 0) return renderNews(n.text, s);
  }
  return renderNews(eligible[eligible.length - 1]?.text ?? '', s);
}
