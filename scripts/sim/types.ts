import type { GameState, IncomeSource } from '../../src/engine/types';

export type Attention = 'active' | 'idle' | 'closed';
export type BuyerKind = 'optimal' | 'human';
export type Variant = 'baseline' | 'no-drops' | 'no-merch' | 'no-teams' | 'no-clicks';
export type PurchaseKind = 'op' | 'upgrade' | 'gear' | 'staff' | 'merch' | 'decor' | 'level' | 'trophy-upgrade';

/** How a simulated player clicks the logo. Everyone clicks through the tutorial's click step. */
export type ClickPlan =
  /** Clicks at `cps` for the first `seconds` of every run (the old audit bots). */
  | { kind: 'opening'; seconds: number; cps: number }
  /** Old semi bot: opening, then a short burst on a fixed period. */
  | { kind: 'periodic'; opening: number; every: number; burst: number; cps: number }
  /** Fills the hype meter in one burst every `every` seconds (jittered) while paying attention, after
   *  an opening stretch of steady clicking while the org has nothing else to do. */
  | { kind: 'crowd'; every: [number, number]; cps: number; maxBurst: number; opening?: { seconds: number; cps: number } }
  /** Clicks whenever paying attention. */
  | { kind: 'constant'; cps: number }
  | { kind: 'tutorial' };

export interface Persona {
  id: string;
  label: string;
  /** What the player is doing at `wall` seconds into the simulation. */
  attention: (wall: number) => Attention;
  /** Seconds between decisions while attentive, drawn uniformly from the range. */
  decideEvery: [number, number];
  clicks: ClickPlan;
  /** Chance of noticing a Hype Drop that appears while attentive, and seconds it takes to click it. */
  drops: { notice: number; reaction: [number, number] } | 'every-second' | 'at-decisions' | 'never';
  /** Bubbles popped when a Hype Chain comes up. */
  chainPops: number;
  buyer: BuyerKind;
  /** Most purchases per decision. */
  maxBuys: number;
  answersEvents: boolean;
  playsInvitationals: boolean;
  chasesTrend: boolean;
  automation: boolean;
  /** Spends trophies on operation levels and trophy upgrades. */
  spendsTrophies: boolean;
  buysDecor: boolean;
  /** Follows the tutorial closely (decides every few seconds until it is done), as a new player does. */
  tutorialFocus: boolean;
}

export interface SimOptions {
  persona: string;
  seed: number;
  hours: number;
  /** Runs to play: 1 means never sell (a first playthrough). */
  runs?: number;
  variant?: Variant;
  sampleEvery?: number;
  /** Save text to start from, instead of a new game. */
  from?: string;
  /** Sells the loaded org at the first decision. */
  sellNow?: boolean;
  /** A run is sold once Legacy would double, or after this long with at least one point. */
  maxRunSeconds?: number;
  /** Capture encoded saves this many run-1 seconds in. */
  snapshotsAt?: number[];
  /** Capture a save this many seconds after the first Legacy point. */
  snapshotAfterFirstLegacy?: number;
  charter?: string;
  mandate?: string | null;
  /** 'off' never claims quests; 'perk' prefers perk rewards over cash. */
  quests?: 'cash' | 'perk' | 'off';
  /** Called after each sample with the live game, for in-process analysis (price-curve.ts). Must leave the state as it found it. */
  onSample?: (s: GameState, sample: Sample) => void;
}

export interface Purchase {
  run: number;
  at: number;
  kind: PurchaseKind;
  id: string;
  cost: number;
  /** Income per second the purchase added, measured on the spot (0 when it adds none). */
  gain: number;
  /** Income per second before it. */
  base: number;
}

export interface Sample {
  run: number;
  wall: number;
  runWall: number;
  attention: Attention;
  earnedRun: number;
  /** All-time earnings, which is what Legacy is made of: comparable across personas that sell. */
  earnedTotal: number;
  totalCps: number;
  /** Income per second with temporary buffs cleared: the economy's steady pace, for the pace targets. */
  steadyCps?: number;
  opsCps: number;
  matchCps: number;
  merchCps: number;
  /** Cash booked to each ledger source since the last sample. */
  booked: Record<IncomeSource, number>;
  /** Estimated share of the booked income that temporary buffs added, by buff family. */
  uplift: { crowd: number; frenzy: number; other: number };
  /** Multipliers on all income at the sample: what sponsors, Legacy, fame and the cabinet are worth. */
  mults: { sponsor: number; legacy: number; fame: number; superfan: number; global: number };
  /** Cash spent by the simulated player since the last sample, by purchase kind. */
  spent: Partial<Record<PurchaseKind | 'other', number>>;
  /** Cash that moved outside the ledger and the player's own purchases (automation, sales, refunds, charter cash). */
  unledgered: number;
  /** Seconds of income the best-payback purchase of each kind would cost (WS3 check D). */
  afford?: Partial<Record<PurchaseKind, number>>;
  /** The best payback (seconds) of each kind on offer: check E, nothing becomes free. */
  payback?: Partial<Record<PurchaseKind, number>>;
  crowds: number;
  chains: number;
  drops: { seen: number; caught: number };
  fans: number;
  bestTier: number;
  quest: string | null;
  questsClaimed: number;
  legacyLevel: number;
  pending: number;
  merchLines: number;
  merchFinish: number;
  invitationals: [number, number];
  sponsors: number;
  staff: number;
  players: number;
}

export interface Milestone {
  run: number;
  key: string;
  wall: number;
  runWall: number;
  /** Seconds the game had been open (not closed) when it was hit. */
  played: number;
}

export interface SaleRecord {
  run: number;
  wall: number;
  runWall: number;
  gained: number;
  levelAfter: number;
  bought: string[];
  nodeValues: { id: string; cost: number; ratio: number }[];
}

export interface SponsorPayout {
  run: number;
  at: number;
  amount: number;
  /** Payout in seconds of the income at the time. */
  seconds: number;
}

/** One stretch with the game closed, and what offline progress paid for it. */
export interface Absence {
  run: number;
  /** Wall second the game was closed. */
  at: number;
  away: number;
  /** Seconds offline progress counted, and at what rate. */
  counted: number;
  rate: number;
  earned: number;
  /** Income per second (no temporary buffs) as the game closed: what an open tab would have earned. */
  cpsAtClose: number;
}

export interface SimRecord {
  persona: string;
  variant: Variant;
  seed: number;
  hours: number;
  /** Started from a save rather than a new game (the restart check). */
  fromSave: boolean;
  git?: string;
  ranSeconds: number;
  purchases: Purchase[];
  samples: Sample[];
  sales: SaleRecord[];
  milestones: Milestone[];
  sponsorPayouts: SponsorPayout[];
  /** Missing from records written before the hermit personas. */
  absences?: Absence[];
  snapshots: { label: string; wall: number; runWall: number; save: string }[];
  final: { run: number; earnedTotal: number; earnedRun: number; legacyLevel: number; pending: number; questsClaimed: number; incomeRun: Record<IncomeSource, number> };
}
