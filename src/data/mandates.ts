import type { Effect } from '../engine/types';

/**
 * Run Mandates are picked on every sale from a few offered at random, and last for one run. Each is a
 * trade-off, so choosing one is a decision about how to play the next run rather than a free bonus.
 */
export interface MandateDef {
  id: string;
  name: string;
  icon: string;
  upside: string;
  downside: string;
  effects: Effect[];
}

export const MANDATES: MandateDef[] = [
  {
    id: 'academy',
    name: 'Esports Academy',
    icon: 'graduation-cap',
    upside: 'Players earn double XP.',
    downside: 'Signing fees are 50% higher.',
    effects: [
      { kind: 'xpMult', mult: 2 },
      { kind: 'feeMult', mult: 1.5 },
    ],
  },
  {
    id: 'corporate',
    name: 'Corporate Backing',
    icon: 'briefcase',
    upside: 'Sponsor income ×1.5 and one extra sponsor slot.',
    downside: 'Merch sells 30% less.',
    effects: [
      { kind: 'sponsorIncome', mult: 1.5 },
      { kind: 'sponsorSlots', add: 1 },
      { kind: 'merchMult', mult: 0.7 },
    ],
  },
  {
    id: 'media',
    name: 'Media Circus',
    icon: 'megaphone',
    upside: 'Fans ×1.75 from everything.',
    downside: 'Prize money is 20% lower.',
    effects: [
      { kind: 'fansMult', mult: 1.75 },
      { kind: 'prizeMult', mult: 0.8 },
    ],
  },
  {
    id: 'lean',
    name: 'Lean Startup',
    icon: 'dollar-sign',
    upside: 'Operations cost 20% less.',
    downside: 'Staff cost 30% more.',
    effects: [
      { kind: 'opCostMult', mult: 0.8 },
      { kind: 'staffCostMult', mult: 1.3 },
    ],
  },
  {
    id: 'winnow',
    name: 'Win-Now',
    icon: 'flame',
    upside: 'Team rating ×1.15.',
    downside: 'Players tire 30% faster.',
    effects: [
      { kind: 'teamRating', mult: 1.15 },
      { kind: 'energyDrain', mult: 1.3 },
    ],
  },
  {
    id: 'grassroots',
    name: 'Grassroots Hype',
    icon: 'party-popper',
    upside: 'Hype Drops arrive a third sooner and clicks are worth ×3.',
    downside: 'All income is 10% lower.',
    effects: [
      { kind: 'dropInterval', mult: 0.67 },
      { kind: 'clickMult', mult: 3 },
      { kind: 'globalPct', pct: -0.1 },
    ],
  },
  {
    id: 'moneyball',
    name: 'Moneyball',
    icon: 'chart-column',
    upside: 'Two extra market listings and 30% cheaper signings.',
    downside: 'Team rating ×0.95.',
    effects: [
      { kind: 'marketSize', add: 2 },
      { kind: 'feeMult', mult: 0.7 },
      { kind: 'teamRating', mult: 0.95 },
    ],
  },
  {
    id: 'merch',
    name: 'Merch Machine',
    icon: 'shirt',
    upside: 'Merch sells 75% more.',
    downside: 'Sponsor income ×0.75.',
    effects: [
      { kind: 'merchMult', mult: 1.75 },
      { kind: 'sponsorIncome', mult: 0.75 },
    ],
  },
  {
    id: 'circuit',
    name: 'Invitational Circuit',
    icon: 'trophy',
    upside: 'Invitational invites come twice as often and pay double.',
    downside: 'All income is 10% lower.',
    effects: [
      { kind: 'tournamentReward', mult: 2 },
      { kind: 'tournamentWeight', mult: 2 },
      { kind: 'globalPct', pct: -0.1 },
    ],
  },
];

export const MANDATE_MAP: Map<string, MandateDef> = new Map(MANDATES.map((m) => [m.id, m]));
/** Mandates offered on each sale. */
export const MANDATE_CHOICES = 3;
