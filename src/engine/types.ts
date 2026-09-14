import type { NumberFormat } from './format';

export type Tone = 'good' | 'bad' | 'info' | 'gold';

export interface OperationState {
  owned: number;
  highest: number;
  level: number;
  produced: number;
}

export type BuffEffect =
  | { kind: 'income'; mult: number }
  | { kind: 'click'; mult: number }
  | { kind: 'fans'; mult: number }
  | { kind: 'op'; op: string; mult: number };

export interface Buff {
  id: string;
  name: string;
  icon: string;
  tone: Tone;
  desc: string;
  startedAt: number;
  endsAt: number;
  effects: BuffEffect[];
}

/** Permanent modifiers granted by upgrades, achievements and legacy nodes. */
export type Effect =
  | { kind: 'opMult'; op: string; mult: number }
  | { kind: 'opPerOwned'; op: string; source: string; pct: number }
  | { kind: 'grindDouble' }
  | { kind: 'grindAdd'; add: number }
  | { kind: 'grindAddMult'; mult: number }
  | { kind: 'clickMult'; mult: number }
  | { kind: 'clickCpsPct'; pct: number }
  | { kind: 'globalPct'; pct: number }
  | { kind: 'fameExp'; add: number }
  | { kind: 'superfan'; factor: number }
  | { kind: 'fansMult'; mult: number }
  | { kind: 'hypeGain'; mult: number }
  | { kind: 'hypeDuration'; mult: number }
  | { kind: 'opCostMult'; mult: number }
  | { kind: 'upgradeCostMult'; mult: number }
  | { kind: 'offlineRate'; add: number }
  | { kind: 'offlineCap'; hours: number };

export interface Mods {
  opMult: Record<string, number>;
  opPerOwned: { op: string; source: string; pct: number }[];
  grindDoublings: number;
  grindAdd: number;
  grindAddMult: number;
  clickMult: number;
  clickCpsPct: number;
  globalMult: number;
  fameExp: number;
  superfanFactors: number[];
  fansMult: number;
  hypeGainMult: number;
  hypeDurationMult: number;
  opCostMult: number;
  upgradeCostMult: number;
  offlineRate: number;
  offlineCapHours: number;
}

export interface Rates {
  /** Cash per second including temporary buffs. */
  cps: number;
  /** Cash per second without temporary buffs. */
  cpsNoBuffs: number;
  baseCps: number;
  opCps: Record<string, number>;
  opUnit: Record<string, number>;
  click: number;
  fansPerSec: number;
  globalMult: number;
  fameMult: number;
  superfanMult: number;
  buffIncomeMult: number;
  buffClickMult: number;
  cabinet: number;
}

export interface OrgState {
  name: string;
  logo: string | null;
  primary: string;
  secondary: string;
}

export interface Settings {
  numberFormat: NumberFormat;
  autosaveSeconds: number;
  offlineProgress: boolean;
  reducedMotion: boolean;
  floatingText: boolean;
  particles: boolean;
  newsTicker: boolean;
  volume: number;
  muted: boolean;
  confirmPrestige: boolean;
  buyAmount: number;
}

export interface Stats {
  clicksRun: number;
  clicksTotal: number;
  clickCashRun: number;
  clickCashTotal: number;
  opsBoughtTotal: number;
  opsSoldTotal: number;
  upgradesBoughtTotal: number;
  crowdsTotal: number;
  manualSaves: number;
  imports: number;
  exports: number;
  bestCps: number;
  playtimeTotal: number;
  offlineSecondsTotal: number;
  renames: number;
}

export interface GameState {
  version: number;
  rng: number;
  /** Simulated seconds since the save was created. */
  time: number;
  /** Simulated time at which the current run began. */
  runStartTime: number;
  /** Real timestamps (ms). */
  createdAt: number;
  lastSaved: number;
  lastClickTime: number;
  org: OrgState;
  cash: number;
  earnedRun: number;
  earnedTotal: number;
  fans: number;
  fansRun: number;
  fansTotal: number;
  trophies: number;
  hype: number;
  ops: Record<string, OperationState>;
  /** Purchased upgrade id -> simulated time purchased. */
  upgrades: Record<string, number>;
  /** Upgrades revealed in the store this run. */
  unlockedUpgrades: Record<string, number>;
  /** Achievement id -> real timestamp unlocked. */
  achievements: Record<string, number>;
  buffs: Buff[];
  stats: Stats;
  settings: Settings;
}
