/**
 * The simulated players. Each one is a playstyle a real person might have, described as data so the
 * run loop stays the same for all of them.
 *
 *   active   The balance target: plays with the game in front of them, acts every 20-30 s, clicks
 *            the meter full for a Crowd Goes Wild about every ten minutes, catches most Hype Drops a
 *            few seconds after they appear, and buys like a person (see buyers.ts).
 *   semi     Plays like `active` for ten minutes, then leaves the tab open and ignored for fifty,
 *            every hour. Routines on, since nobody is at the keyboard.
 *   casual   Four sessions a day (20/15/30/20 min), with the game closed in between, so offline
 *            progress carries most of the day.
 *   idle     Leaves the game open and checks in every 10-15 minutes. Never clicks after the first
 *            player, catches only the drops that happen to be on screen when it looks.
 *   optimal  The ceiling: acts every 20 s, clicks five times a second without stopping, catches every
 *            drop the moment it appears, pops a full chain and buys by exact payback.
 *   audit-compat  The old scripts/audit.ts `active` bot, kept so the simulator can be checked against it.
 */
import type { Attention, Persona } from './types';

const always = (): Attention => 'active';

/** Session starts (hours into the day) and lengths (minutes) for the casual player. */
export const CASUAL_SESSIONS: [number, number][] = [
  [0, 20],
  [4.5, 15],
  [10, 30],
  [13.5, 20],
];

function casualAttention(wall: number): Attention {
  const intoDay = (wall % 86_400) / 3600;
  for (const [start, minutes] of CASUAL_SESSIONS) if (intoDay >= start && intoDay < start + minutes / 60) return 'active';
  return 'closed';
}

const active: Persona = {
  id: 'active',
  label: 'Active: acts every 20-30 s, a crowd every ~10 min',
  attention: always,
  decideEvery: [20, 30],
  clicks: { kind: 'crowd', every: [540, 660], cps: 6, maxBurst: 40, opening: { seconds: 300, cps: 4 } },
  drops: { notice: 0.85, reaction: [1, 6] },
  chainPops: 12,
  buyer: 'human',
  maxBuys: 15,
  answersEvents: true,
  playsInvitationals: true,
  chasesTrend: true,
  automation: false,
  spendsTrophies: true,
  buysDecor: true,
  tutorialFocus: true,
};

export const PERSONAS: Record<string, Persona> = {
  active,
  semi: {
    ...active,
    id: 'semi',
    label: 'Semi: 10 min active, 50 min open and idle, every hour',
    attention: (wall) => (wall % 3600 < 600 ? 'active' : 'idle'),
    maxBuys: 30,
    automation: true,
  },
  casual: {
    ...active,
    id: 'casual',
    label: 'Casual: four 15-30 min sessions a day, closed between',
    attention: casualAttention,
    decideEvery: [30, 60],
    clicks: { kind: 'crowd', every: [300, 600], cps: 6, maxBurst: 40, opening: { seconds: 300, cps: 4 } },
    drops: { notice: 0.7, reaction: [2, 8] },
    chainPops: 8,
    maxBuys: 40,
    chasesTrend: false,
    automation: true,
  },
  idle: {
    id: 'idle',
    label: 'Idle: open all day, checks in every 10-15 min',
    attention: always,
    decideEvery: [600, 900],
    clicks: { kind: 'tutorial' },
    drops: 'at-decisions',
    chainPops: 4,
    buyer: 'human',
    maxBuys: 60,
    answersEvents: false,
    playsInvitationals: false,
    chasesTrend: false,
    automation: true,
    spendsTrophies: true,
    buysDecor: false,
  tutorialFocus: true,
  },
  optimal: {
    id: 'optimal',
    label: 'Optimal: every 20 s, clicks nonstop, every drop, exact payback',
    attention: always,
    decideEvery: [20, 20],
    clicks: { kind: 'constant', cps: 5 },
    drops: 'every-second',
    chainPops: 20,
    buyer: 'optimal',
    maxBuys: 40,
    answersEvents: true,
    playsInvitationals: true,
    chasesTrend: true,
    automation: false,
    spendsTrophies: true,
    buysDecor: true,
  tutorialFocus: true,
  },
  'audit-compat': {
    id: 'audit-compat',
    label: 'The old scripts/audit.ts active bot',
    attention: always,
    decideEvery: [20, 20],
    clicks: { kind: 'opening', seconds: 600, cps: 5 },
    drops: 'every-second',
    chainPops: 0,
    buyer: 'optimal',
    maxBuys: 40,
    answersEvents: false,
    playsInvitationals: true,
    chasesTrend: true,
    automation: false,
    spendsTrophies: false,
    buysDecor: false,
  tutorialFocus: false,
  },
};

export const BALANCE_PERSONAS = ['active', 'semi', 'casual', 'idle', 'optimal'];

export function persona(id: string): Persona {
  const p = PERSONAS[id];
  if (!p) throw new Error(`Unknown persona "${id}". Known: ${Object.keys(PERSONAS).join(', ')}`);
  return p;
}
