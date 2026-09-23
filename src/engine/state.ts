import { DEFAULT_EMBLEM } from '../data/emblems';
import { DEFAULT_KIT, DEFAULT_TONE } from '../data/palette';
import { GAMES } from '../data/games';
import { OPERATIONS } from '../data/operations';
import { STAFF } from '../data/staff';
import { createDraft } from './draft';
import { refreshMarket } from './market';
import { createFounder } from './players';
import { createGameProgress } from './popularity';
import { Rng, randomSeed } from './rng';
import { addToTeam, createTeam, ensureTeam } from './teams';
import { INCOME_SOURCES, type IncomeSource } from './types';
import type { AutomationSettings, GameProgress, GameState, OperationState, Player, Settings, Stats } from './types';

export const SAVE_VERSION = 6;
export const GAME_VERSION = '0.7.0';

/** Every routine starts switched off; the player opts in once it unlocks. */
export function createAutomation(): AutomationSettings {
  return {
    operations: { on: false, maxCostPct: 0.1 },
    upgrades: { on: false, maxCostPct: 0.25 },
    roster: { on: false, maxCostPct: 0.5, buyBench: false },
    gear: { on: false, maxCostPct: 0.01 },
    sponsors: { on: false, minTier: 0, avoidCrypto: true },
    roles: { on: false },
  };
}

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
    hypeChain: true,
    autoClick: false,
    musicOn: false,
    musicVolume: 0.35,
    confirmPrestige: true,
    buyAmount: 1,
    notify: { matches: true, players: true, events: true, business: true, achievements: true },
    uiAccent: DEFAULT_TONE,
    onboarded: false,
  };
}

export function createStats(): Stats {
  return {
    playersRetired: 0,
    derbyWins: 0,
    soloFounderTitles: 0,
    perfectSeasons: 0,
    upsetWins: 0,
    bestWinStreak: 0,
    worstLoseStreak: 0,
    lateNightClicks: 0,
    bestChain: 0,
    chainPops: 0,
    bubbystrLosses: 0,
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
    orgsSold: 0,
    legacyNodes: 0,
    challengesCompleted: 0,
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
      primary: DEFAULT_KIT.primary,
      secondary: DEFAULT_KIT.secondary,
      emblem: { ...DEFAULT_EMBLEM },
    },
    cash: 0,
    earnedRun: 0,
    incomeRun: createIncomeLedger(),
    incomeTotal: createIncomeLedger(),
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
    market: { listings: [], nextRefresh: 0, rerolls: 0, pinned: [], scouting: { gameBias: null, rarityBias: null, traitFocus: null } },
    staff: createStaff(),
    decor: {},
    drops: { nextAt: 0, active: [] },
    events: { nextAt: 0, pending: [], modifiers: [], log: [], calmUntil: 0, fansHeld: 0, fansReturnAt: 0, lastTournament: null, invitation: null },
    designs: {},
    merch: { trend: 'neon', trendEndsAt: 0, unlocked: {}, lines: {} },
    sponsors: { offers: [], active: [], nextRefresh: 0, history: [], pace: [] },
    prestige: {
      level: 0,
      points: 0,
      spent: 0,
      runs: 0,
      nodes: {},
      hallOfFame: [],
      legends: [],
      reserve: [],
      challenge: null,
      challengesDone: {},
      runBaseline: { seasonTitles: 0, tournamentsWon: 0, matchesWon: 0 },
      charter: null,
      mandate: null,
      dynasty: {},
    },
    automation: createAutomation(),
    automationLog: [],
    rival: null,
    rivalHistory: [],
    seasonLog: [],
    trophyCase: [],
    draft: null,
    tutorial: { step: 'click' },
    quests: { active: [], done: {}, picks: {}, skipped: {}, claimed: 0 },
    sections: {},
    sectionsSeen: {},
    guides: {},
    nextId: 1,
    popularityClock: 0,
    stats: createStats(),
    settings: createSettings(),
  };
}

/** A fresh income breakdown with every source at zero. */
export function createIncomeLedger(): Record<IncomeSource, number> {
  return Object.fromEntries(INCOME_SOURCES.map((k) => [k, 0])) as Record<IncomeSource, number>;
}

/**
 * Starts a run with an empty roster and the first-player draft. Teams exist only for games that
 * are already unlocked beyond the first; the first signing founds the Smash Siblings team.
 */
export function setupNewRun(s: GameState): void {
  const rng = new Rng(s);
  for (const g of GAMES) {
    if (g.index > 0 && s.games[g.id]?.unlocked && !s.teams[g.id]) s.teams[g.id] = createTeam(g.id);
  }
  s.draft = createDraft(s, rng);
  refreshMarket(s, rng, { scoutLuck: 0, marketSize: 0 });
}

/**
 * Orgs from before the draft began with a founder who played Smash Siblings solo. Their saves keep
 * that founder, who returns in every new run with the same look and tag.
 */
export function addFounder(s: GameState, identity?: Partial<Player>): Player {
  const founder = createFounder(new Rng(s), s.org.name);
  if (identity) Object.assign(founder, identity);
  s.players[founder.id] = founder;
  ensureTeam(s, 'smash');
  addToTeam(s, founder, { benchSlots: 1 });
  s.draft = null;
  return founder;
}

export function createNewGame(now: number = Date.now(), seed: number = randomSeed()): GameState {
  const s = createBaseState(now, seed);
  setupNewRun(s);
  return s;
}
