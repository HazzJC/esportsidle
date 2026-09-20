import type { GameState } from '../engine/types';

export type AutomationId = 'operations' | 'upgrades' | 'roster' | 'gear' | 'sponsors' | 'roles';

export interface AutomationDef {
  id: AutomationId;
  name: string;
  icon: string;
  /** Who carries the routine out, for flavour. */
  owner: string;
  desc: string;
  requirement: string;
  /** Unlocks as the org grows. A Founding Charter can unlock one from the start of every run. */
  unlock: (s: GameState) => boolean;
}

export const AUTOMATIONS: AutomationDef[] = [
  {
    id: 'operations', name: 'Operations manager', icon: 'building', owner: 'Operations manager',
    desc: 'Buys the most expensive affordable building first, then works down the list within your cash budget.',
    requirement: 'Buy the Operations Manager legacy unlock',
    unlock: (s) => s.prestige.nodes.operations_manager !== undefined,
  },
  {
    id: 'upgrades',
    name: 'Upgrade desk',
    icon: 'sparkles',
    owner: 'Operations team',
    desc: 'Buys store upgrades as soon as they cost less than your chosen share of cash.',
    requirement: 'Earn $1 billion in a single run',
    unlock: (s) => s.earnedRun >= 1e9,
  },
  {
    id: 'roster',
    name: 'Lineup filler',
    icon: 'user-plus',
    owner: 'Scouts',
    desc: 'Signs the best affordable player into any empty lineup slot.',
    requirement: 'Employ 10 Scouts',
    unlock: (s) => (s.staff.scout ?? 0) >= 10,
  },
  {
    id: 'gear',
    name: 'Gear budget',
    icon: 'cpu',
    owner: 'Coaches',
    desc: 'Spends your chosen share of cash on the cheapest gear upgrades for your starters.',
    requirement: 'Employ 25 Coaches',
    unlock: (s) => (s.staff.coach ?? 0) >= 25,
  },
  {
    id: 'roles',
    name: 'Role coaching',
    icon: 'clipboard-list',
    owner: 'Coaches',
    desc: 'Moves players onto the role they actually play, and brings a better substitute on, whenever the swap makes the team stronger.',
    requirement: 'Employ 5 Coaches',
    unlock: (s) => (s.staff.coach ?? 0) >= 5,
  },
  {
    id: 'sponsors',
    name: 'Sponsor rules',
    icon: 'handshake',
    owner: 'Talent Agents',
    desc: 'Signs the best offer that matches your rules whenever a sponsor slot is free.',
    requirement: 'Employ 5 Talent Agents',
    unlock: (s) => (s.staff.agent ?? 0) >= 5,
  },
];

export const AUTOMATION_MAP: Map<AutomationId, AutomationDef> = new Map(AUTOMATIONS.map((a) => [a.id, a]));
