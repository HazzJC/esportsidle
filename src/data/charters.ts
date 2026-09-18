import type { Effect } from '../engine/types';
import type { AutomationId } from './automation';
import type { LegacySpecial } from './legacy';

/**
 * Founding Charters are chosen once, on the first sale, and apply to every run after. Each bundles a
 * starting advantage with an automation that would otherwise unlock much later, so the first prestige
 * changes how the next run plays rather than only adding a small income bonus.
 */
export interface CharterDef {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  /** Plain description of the starting advantage. */
  start: string;
  automation: AutomationId;
  special: LegacySpecial[];
  effects?: Effect[];
}

export const CHARTERS: CharterDef[] = [
  {
    id: 'operator',
    name: 'The Operator',
    icon: 'briefcase',
    tagline: 'Runs the business like a machine.',
    start: 'Start every run with 25 Ranked Grinders, 10 Streamers and $5,000.',
    automation: 'upgrades',
    special: [
      { kind: 'startOps', ops: { grinder: 25, streamer: 10 } },
      { kind: 'startCash', amount: 5_000 },
    ],
  },
  {
    id: 'scout',
    name: 'The Scout',
    icon: 'binoculars',
    tagline: 'Always has a player lined up.',
    start: 'Start every run with a Rocket Soccar team and a Talent already signed to it.',
    automation: 'roster',
    special: [
      { kind: 'startGame', game: 'rocket' },
      { kind: 'startPlayer', game: 'rocket', rarity: 'talent' },
    ],
  },
  {
    id: 'promoter',
    name: 'The Promoter',
    icon: 'megaphone',
    tagline: 'Brands call before the paint is dry.',
    start: 'Start every run with 2,500 fans, so sponsors call straight away, plus one extra sponsor slot.',
    automation: 'sponsors',
    special: [{ kind: 'startFans', amount: 2_500 }],
    effects: [{ kind: 'sponsorSlots', add: 1 }],
  },
  {
    id: 'coach',
    name: 'The Coach',
    icon: 'clipboard-list',
    tagline: 'Builds players, not just teams.',
    start: 'Start every run with 3 Coaches and 2 Chefs already on staff.',
    automation: 'gear',
    special: [{ kind: 'startStaff', staff: { coach: 3, chef: 2 } }],
  },
];

export const CHARTER_MAP: Map<string, CharterDef> = new Map(CHARTERS.map((c) => [c.id, c]));
