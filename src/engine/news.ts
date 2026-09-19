import { NEWS } from '../data/news';
import { GAMES } from '../data/games';
import type { GameState } from './types';

/**
 * Fills a news line's placeholders: {org}, {player} (a player on the roster, founder included),
 * {rival} (the current rival, or a generic one) and {game} (a game the org competes in).
 */
export function renderNews(text: string, s: GameState, random: () => number = Math.random): string {
  const pick = <T>(items: T[]): T | undefined => items[Math.floor(random() * items.length)];
  return text
    .replaceAll('{org}', s.org.name)
    .replaceAll('{player}', () => pick(Object.values(s.players))?.tag ?? 'the founder')
    .replaceAll('{rival}', s.rival?.name ?? 'a rival org')
    .replaceAll('{game}', () => pick(GAMES.filter((g) => s.games[g.id]?.unlocked))?.name ?? GAMES[0].name);
}

/** Picks a weighted random news line eligible for the current state. */
export function pickNews(s: GameState, random: () => number = Math.random, avoid?: string): string {
  const eligible = NEWS.filter((n) => (!n.when || n.when(s)) && renderNews(n.text, s, () => 0) !== avoid);
  let total = 0;
  for (const n of eligible) total += n.weight ?? 1;
  let roll = random() * total;
  for (const n of eligible) {
    roll -= n.weight ?? 1;
    if (roll < 0) return renderNews(n.text, s, random);
  }
  return renderNews(eligible[eligible.length - 1]?.text ?? '', s, random);
}
