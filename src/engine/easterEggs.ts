import type { GameState, Player, StatKey } from './types';

export type EasterEggId = 'theonlycook' | 'varantha' | 'bubbystr' | 'nijacat22' | 'mrkonradical' | 'faker';

/** Names seen before and what they matched. Ratings ask for every player many times a second. */
const matchCache = new Map<string, EasterEggId | null>();

export function matchEasterEgg(name?: string | null): EasterEggId | null {
  if (!name) return null;
  const hit = matchCache.get(name);
  if (hit !== undefined) return hit;
  const result = matchNormalised(name.trim().toLowerCase().replace(/[\s_-]+/g, ''));
  if (matchCache.size > 5000) matchCache.clear();
  matchCache.set(name, result);
  return result;
}

function matchNormalised(norm: string): EasterEggId | null {
  if (norm === 'theonlycook') return 'theonlycook';
  if (norm === 'varantha') return 'varantha';
  if (norm === 'bubbystr') return 'bubbystr';
  if (norm === 'nijacat22') return 'nijacat22';
  if (norm === 'mrkonradical') return 'mrkonradical';
  if (norm === 'faker') return 'faker';
  return null;
}

export function playerEasterEgg(p?: Player | null): EasterEggId | null {
  if (!p) return null;
  return matchEasterEgg(p.tag) || matchEasterEgg(`${p.first} ${p.last}`) || matchEasterEgg(p.first) || null;
}

export function hasTheOnlyCook(s: GameState): boolean {
  return Object.values(s.players).some((p) => playerEasterEgg(p) === 'theonlycook');
}
