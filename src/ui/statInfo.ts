import { GENRE_LABEL, GENRE_WEIGHTS, type GameDef } from '../data/games';
import { STAT_LABEL } from '../engine/players';
import type { StatKey } from '../engine/types';
import type { TipContent } from './tooltip.svelte';

/** What each player stat does, in plain words. */
export const STAT_INFO: Record<StatKey, { icon: string; desc: string }> = {
  mechanics: { icon: 'crosshair', desc: 'Aim, reactions and execution: the raw skill of playing the game.' },
  gameSense: { icon: 'brain', desc: 'Reading the game: positioning, timing and decisions.' },
  teamwork: { icon: 'users', desc: 'Communication and coordination. Worth nothing in solo games and a lot in team games.' },
  composure: { icon: 'heart-pulse', desc: 'Nerve under pressure: holding it together in close matches and big moments.' },
  charisma: { icon: 'megaphone', desc: 'Star power. Brings in fans every second, win or lose. It does not win matches.' },
  stamina: { icon: 'zap', desc: 'How slowly energy drains in matches. Tired players play worse and need rest.' },
};

/** How much a stat counts towards a player's rating in a game, from 0 to 1. */
export function statWeight(st: StatKey, g: GameDef): number {
  return (GENRE_WEIGHTS[g.genre] as Record<string, number>)[st] ?? 0;
}

export function statTip(st: StatKey, g?: GameDef, value?: number): TipContent {
  const info = STAT_INFO[st];
  const lines: NonNullable<TipContent['lines']> = [info.desc];
  if (g) {
    const w = statWeight(st, g);
    if (w > 0) lines.push({ text: `${Math.round(w * 100)}% of skill rating in ${g.name} (${GENRE_LABEL[g.genre]}).`, tone: 'good' });
    else if (st === 'charisma' || st === 'stamina') lines.push({ text: 'Not part of skill rating in any game.', tone: 'muted' });
    else lines.push({ text: `Not used in ${g.name}.`, tone: 'muted' });
  }
  return { title: STAT_LABEL[st], subtitle: value !== undefined ? `${Math.round(value)} / 100` : 'Player stat', icon: info.icon, lines };
}
