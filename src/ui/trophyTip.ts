import { getGame } from '../data/games';
import { tierName } from '../data/leagues';
import type { GameState, TrophyEntry, TrophyKind } from '../engine/types';
import type { TipContent } from './tooltip.svelte';

/** What each kind of trophy is called on the shelf. */
export const TROPHY_KIND_LABEL: Record<TrophyKind, string> = {
  title: 'League title',
  tournament: 'Invitational champions',
  runnerUp: 'Invitational runners-up',
  sponsor: 'Sponsor goal',
  quest: 'Quest reward',
};

export function trophyTitle(t: TrophyEntry): string {
  switch (t.kind) {
    case 'title':
      return `${tierName(t.tier)} champions`;
    case 'tournament':
      return `${tierName(t.tier)} Invitational`;
    case 'runnerUp':
      return `${tierName(t.tier)} Invitational runner-up`;
    default:
      return t.label ?? TROPHY_KIND_LABEL[t.kind];
  }
}

/** The same card whether a trophy is hovered in the cabinet or on the shelf in the house. */
export function trophyTip(s: GameState, t: TrophyEntry): TipContent {
  const currentRun = s.prestige.runs + 1;
  const game = getGame(t.gameId);
  const where = t.kind === 'sponsor' || t.kind === 'quest' ? TROPHY_KIND_LABEL[t.kind] : t.season !== null ? `Season ${t.season}` : 'Invitational';
  return {
    title: trophyTitle(t),
    subtitle: `${game.name} · ${where}`,
    icon: t.kind === 'title' ? 'trophy' : t.kind === 'sponsor' ? 'handshake' : t.kind === 'quest' ? 'flag' : 'medal',
    iconColor: 'var(--gold)',
    lines: [
      ...(t.label && t.kind !== 'sponsor' && t.kind !== 'quest' ? [t.label] : []),
      ...(t.mvp ? [`MVP: ${t.mvp}`] : []),
      { text: t.run === currentRun ? 'Won this run' : `Won in run ${t.run}`, tone: 'muted' as const },
    ],
  };
}
