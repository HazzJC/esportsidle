import { OPERATIONS } from '../data/operations';
import { randomSeed } from './rng';
import type { GameState, OperationState, Settings, Stats } from './types';

export const SAVE_VERSION = 1;
export const GAME_VERSION = '0.2.0';

export function createSettings(): Settings {
  return {
    numberFormat: 'short',
    autosaveSeconds: 30,
    offlineProgress: true,
    reducedMotion: false,
    floatingText: true,
    particles: true,
    newsTicker: true,
    volume: 0.5,
    muted: false,
    confirmPrestige: true,
    buyAmount: 1,
  };
}

export function createStats(): Stats {
  return {
    clicksRun: 0,
    clicksTotal: 0,
    clickCashRun: 0,
    clickCashTotal: 0,
    opsBoughtTotal: 0,
    opsSoldTotal: 0,
    upgradesBoughtTotal: 0,
    crowdsTotal: 0,
    manualSaves: 0,
    imports: 0,
    exports: 0,
    bestCps: 0,
    playtimeTotal: 0,
    offlineSecondsTotal: 0,
    renames: 0,
  };
}

export function createOps(): Record<string, OperationState> {
  const ops: Record<string, OperationState> = {};
  for (const op of OPERATIONS) ops[op.id] = { owned: 0, highest: 0, level: 0, produced: 0 };
  return ops;
}

export function createNewGame(now: number = Date.now(), seed: number = randomSeed()): GameState {
  return {
    version: SAVE_VERSION,
    rng: seed,
    time: 0,
    runStartTime: 0,
    createdAt: now,
    lastSaved: now,
    lastClickTime: -100,
    org: {
      name: 'Garage Gamers',
      logo: null,
      primary: '#22e4ff',
      secondary: '#ff2bd6',
    },
    cash: 0,
    earnedRun: 0,
    earnedTotal: 0,
    fans: 0,
    fansRun: 0,
    fansTotal: 0,
    trophies: 0,
    hype: 0,
    ops: createOps(),
    upgrades: {},
    unlockedUpgrades: {},
    achievements: {},
    buffs: [],
    stats: createStats(),
    settings: createSettings(),
  };
}
