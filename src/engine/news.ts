import { NEWS } from '../data/news';
import { GAMES } from '../data/games';
import type { GameState } from './types';

/**
 * Fills a news line's placeholders: {org}, {player} (a player on the roster, founder included),
 * {rival} (the current rival, or a generic one), {game} (a game the org competes in), {hotgame} and
 * {coldgame} (its most and least popular games), {newgame} (the one it entered last), {nextgame}
 * (the next game still to be discovered) and {event} (the latest world event).
 */
export function renderNews(text: string, s: GameState, random: () => number = Math.random): string {
  const pick = <T>(items: T[]): T | undefined => items[Math.floor(random() * items.length)];
  const played = GAMES.filter((g) => s.games[g.id]?.unlocked);
  const byPopularity = [...played].sort((a, b) => s.games[b.id].popularity - s.games[a.id].popularity);
  return text
    .replaceAll('{hotgame}', () => byPopularity[0]?.name ?? GAMES[0].name)
    .replaceAll('{coldgame}', () => byPopularity[byPopularity.length - 1]?.name ?? GAMES[0].name)
    .replaceAll('{newgame}', () => played[played.length - 1]?.name ?? GAMES[0].name)
    .replaceAll('{nextgame}', () => GAMES.find((g) => !s.games[g.id]?.unlocked)?.name ?? 'the next big thing')
    .replaceAll('{event}', () => (s.events.log[0]?.title ?? 'the latest scandal').replace(/[.!?]+$/, ''))
    .replaceAll('{org}', () => s.org.name)
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
