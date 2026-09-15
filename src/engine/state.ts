import { GAMES } from '../data/games';
import { OPERATIONS } from '../data/operations';
import { STAFF } from '../data/staff';
import { refreshMarket } from './market';
import { createFounder } from './players';
import { createGameProgress } from './popularity';
import { Rng, randomSeed } from './rng';
import { addToTeam, createTeam } from './teams';
import type { GameProgress, GameState, OperationState, Settings, Stats } from './types';

export const SAVE_VERSION = 2;
export const GAME_VERSION = '0.6.0';

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
    matchToasts: false,
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
    matchesWon: 0,
    matchesLost: 0,
    prizeMoneyTotal: 0,
    seasonTitles: 0,
    promotions: 0,
    playersSigned: 0,
    playersSold: 0,
    gearBought: 0,
    looksChanged: 0,
    trophiesTotal: 0,
    staffHired: 0,
    illnesses: 0,
    injuries: 0,
    burnouts: 0,
    decorBought: 0,
    mostUnavailable: 0,
    dropsClicked: 0,
    dramaClicked: 0,
    dropsMissed: 0,
    tournamentsPlayed: 0,
    tournamentsWon: 0,
    eventsSeen: 0,
    choicesMade: 0,
    opLevels: 0,
    hypeTrainBest: 0,
    designsCreated: 0,
    merchSold: 0,
    merchRevenue: 0,
    sponsorsSigned: 0,
    sponsorGoals: 0,
    cryptoCrashes: 0,
  };
}

export function createOps(): Record<string, OperationState> {
  const ops: Record<string, OperationState> = {};
  for (const op of OPERATIONS) ops[op.id] = { owned: 0, highest: 0, level: 0, produced: 0 };
  return ops;
}

export function createGames(): Record<string, GameProgress> {
  const games: Record<string, GameProgress> = {};
  for (const g of GAMES) games[g.id] = createGameProgress(g.index === 0, g.basePopularity);
  return games;
}

export function createStaff(): Record<string, number> {
  const staff: Record<string, number> = {};
  for (const def of STAFF) staff[def.id] = 0;
  return staff;
}

/** A state with every static field filled in but no players or teams. Used as save defaults. */
export function createBaseState(now: number = Date.now(), seed: number = randomSeed()): GameState {
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
      jersey: null,
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
    games: createGames(),
    teams: {},
    players: {},
    market: { listings: [], nextRefresh: 0, rerolls: 0 },
    staff: createStaff(),
    decor: {},
    drops: { nextAt: 0, active: [] },
    events: { nextAt: 0, pending: [], modifiers: [], log: [], calmUntil: 0, lastTournament: null },
    designs: {},
    merch: { trend: 'neon', trendEndsAt: 0, unlocked: {}, lines: {} },
    sponsors: { offers: [], active: [], nextRefresh: 0, history: [] },
    nextId: 1,
    popularityClock: 0,
    stats: createStats(),
    settings: createSettings(),
  };
}

/** Gives a run its founder, starting team and first market listings. */
export function setupNewRun(s: GameState): void {
  const rng = new Rng(s);
  const founder = createFounder(rng, s.org.name);
  s.players[founder.id] = founder;
  for (const g of GAMES) {
    if (s.games[g.id]?.unlocked && !s.teams[g.id]) s.teams[g.id] = createTeam(g.id);
  }
  if (!s.teams.smash) s.teams.smash = createTeam('smash');
  s.games.smash.unlocked = true;
  addToTeam(s, founder, { benchSlots: 1 });
  refreshMarket(s, rng, { scoutLuck: 0, marketSize: 0 });
}

export function createNewGame(now: number = Date.now(), seed: number = randomSeed()): GameState {
  const s = createBaseState(now, seed);
  setupNewRun(s);
  return s;
}
