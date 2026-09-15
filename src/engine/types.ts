import type { GearSlot } from '../data/gear';
import type { TrendId } from '../data/merch';
import type { SponsorGoalKind } from '../data/sponsors';
import type { NumberFormat } from './format';

export type Tone = 'good' | 'bad' | 'info' | 'gold';

export type StatKey = 'mechanics' | 'gameSense' | 'teamwork' | 'composure' | 'charisma' | 'stamina';
export type PlayerStats = Record<StatKey, number>;
export type Rarity = 'rookie' | 'talent' | 'pro' | 'star' | 'superstar' | 'legend';
export type HealthKind = 'healthy' | 'sick' | 'injured' | 'burnout';

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
  | { kind: 'offlineCap'; hours: number }
  | { kind: 'prizeMult'; mult: number }
  | { kind: 'benchSlots'; add: number }
  | { kind: 'xpMult'; mult: number }
  | { kind: 'matchSpeed'; mult: number }
  | { kind: 'teamRating'; mult: number }
  | { kind: 'scoutLuck'; add: number }
  | { kind: 'marketSize'; add: number }
  | { kind: 'playerFans'; mult: number }
  | { kind: 'gearCostMult'; mult: number }
  | { kind: 'staffMult'; staff: string; mult: number }
  | { kind: 'staffCostMult'; mult: number }
  | { kind: 'dropInterval'; mult: number }
  | { kind: 'dropLife'; mult: number }
  | { kind: 'buffDuration'; mult: number }
  | { kind: 'tournamentReward'; mult: number }
  | { kind: 'tournamentEase'; mult: number }
  | { kind: 'tournamentWeight'; mult: number }
  | { kind: 'dramaLevel'; add: number }
  | { kind: 'dramaShare'; mult: number }
  | { kind: 'sponsorSlots'; add: number }
  | { kind: 'sponsorIncome'; mult: number }
  | { kind: 'merchMult'; mult: number }
  | { kind: 'noveltyMult'; mult: number }
  | { kind: 'legacyLevelPct'; add: number };

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
  prizeMult: number;
  benchSlots: number;
  xpMult: number;
  matchSpeed: number;
  teamRatingMult: number;
  scoutLuck: number;
  marketSize: number;
  playerFansMult: number;
  gearCostMult: number;
  opponentMult: number;
  energyRecoveryMult: number;
  energyDrainMult: number;
  sickMult: number;
  injuryMult: number;
  burnoutMult: number;
  /** Multiplies illness/injury durations. */
  recoveryMult: number;
  moraleBaseAdd: number;
  moraleSwingMult: number;
  staffMult: Record<string, number>;
  staffCostMult: number;
  /** Multiplies the time between Hype Drops (lower = more often). */
  dropIntervalMult: number;
  dropLifeMult: number;
  buffDurationMult: number;
  tournamentRewardMult: number;
  tournamentOpponentMult: number;
  tournamentWeightMult: number;
  dramaLevel: number;
  dramaShareMult: number;
  gamePrizeMult: Record<string, number>;
  genreRatingMult: Record<string, number>;
  sponsorSlots: number;
  sponsorIncomeMult: number;
  /** Total income bonus from active sponsors (after sponsorIncomeMult). */
  sponsorIncomePct: number;
  merchMult: number;
  noveltyMult: number;
  /** Income bonus per legacy level. */
  legacyLevelPct: number;
  /** Team rating multipliers per game (retired legends). */
  gameRatingMult: Record<string, number>;
}

export interface TeamEval {
  gameId: string;
  rating: number;
  opponent: number;
  winChance: number;
  winPrize: number;
  lossPrize: number;
  fansWin: number;
  cut: number;
  filled: number;
  available: number;
  active: boolean;
  /** Seconds between matches. */
  interval: number;
  cps: number;
  fansPerSec: number;
}

export interface MerchLineRate {
  productId: string;
  cps: number;
  unitsPerSec: number;
  appeal: number;
  trending: boolean;
  novelty: number;
  priceFactor: number;
}

export interface Rates {
  /** Operations cash per second including temporary buffs. */
  cps: number;
  /** Operations cash per second without temporary buffs. */
  cpsNoBuffs: number;
  baseCps: number;
  opCps: Record<string, number>;
  opUnit: Record<string, number>;
  click: number;
  /** Continuous fans per second (operations + player charisma). */
  fansPerSec: number;
  opsFansPerSec: number;
  playerFansPerSec: number;
  globalMult: number;
  fameMult: number;
  superfanMult: number;
  buffIncomeMult: number;
  buffClickMult: number;
  cabinet: number;
  teams: Record<string, TeamEval>;
  /** Expected cash per second from matches. */
  matchCps: number;
  matchFansPerSec: number;
  merchCps: number;
  merchLines: Record<string, MerchLineRate>;
  /** Operations + expected match income + merch. */
  totalCps: number;
}

export interface OrgState {
  name: string;
  /** Design id used as the org logo. */
  logo: string | null;
  /** Design id printed on jerseys. */
  jersey: string | null;
  primary: string;
  secondary: string;
}

export interface Appearance {
  body: number;
  skin: number;
  hair: number;
  hairColor: number;
  eyes: number;
  brows: number;
  mouth: number;
  facial: number;
  glasses: number;
  hat: number;
  jersey: number;
  pants: number;
  shoeColor: number;
  accessory: number;
}

export interface PlayerStatus {
  kind: HealthKind;
  until: number;
  reason: string;
}

export interface Player {
  id: string;
  first: string;
  last: string;
  tag: string;
  nation: string;
  age: number;
  gameId: string;
  role: number;
  rarity: Rarity;
  stats: PlayerStats;
  potential: number;
  traits: string[];
  level: number;
  xp: number;
  morale: number;
  energy: number;
  status: PlayerStatus;
  gear: Record<GearSlot, number>;
  look: Appearance;
  cut: number;
  fee: number;
  jersey: number;
  signedAt: number;
  matches: number;
  wins: number;
  founder: boolean;
}

export interface MatchRecord {
  win: boolean;
  score: string;
  opponent: string;
  prize: number;
  fans: number;
  tier: number;
  time: number;
}

export interface TeamState {
  gameId: string;
  lineup: (string | null)[];
  bench: string[];
  tier: number;
  bestTier: number;
  seasonNumber: number;
  seasonPlayed: number;
  seasonWins: number;
  progress: number;
  autoPromote: boolean;
  autoSub: boolean;
  chemistry: number;
  history: MatchRecord[];
  wins: number;
  losses: number;
  streak: number;
  titles: number;
  earnings: number;
}

export interface GameProgress {
  unlocked: boolean;
  popularity: number;
  target: number;
  history: number[];
}

export interface MarketListing {
  player: Player;
  price: number;
}

export interface MarketState {
  listings: MarketListing[];
  nextRefresh: number;
  rerolls: number;
}

export type DropKind = 'hype' | 'drama';

export interface ActiveDrop {
  id: number;
  kind: DropKind;
  /** Screen position as fractions of the viewport. */
  x: number;
  y: number;
  spawnedAt: number;
  expiresAt: number;
  /** Hype Train carriage number (0 for normal drops). */
  chain: number;
}

export interface DropsState {
  nextAt: number;
  active: ActiveDrop[];
}

export type ModifierKind = 'gearCost' | 'gamePrize' | 'genreRating' | 'fans' | 'xp' | 'sponsor';

export interface EventModifier {
  id: string;
  kind: ModifierKind;
  target?: string;
  mult: number;
  name: string;
  desc: string;
  icon: string;
  tone: Tone;
  startedAt: number;
  endsAt: number;
}

export interface ChoiceOption {
  label: string;
  desc: string;
  tone: Tone;
}

export interface PendingChoice {
  id: number;
  eventId: string;
  title: string;
  body: string;
  icon: string;
  options: ChoiceOption[];
  defaultOption: number;
  data: Record<string, string | number>;
  expiresAt: number;
}

export interface EventLogEntry {
  time: number;
  title: string;
  body: string;
  icon: string;
  tone: Tone;
}

export interface TournamentRound {
  name: string;
  opponent: string;
  win: boolean;
  score: string;
  prize: number;
  chance: number;
}

export interface TournamentResult {
  id: number;
  gameId: string;
  tier: number;
  rounds: TournamentRound[];
  champion: boolean;
  trophies: number;
  fans: number;
  totalPrize: number;
  seen: boolean;
}

export interface EventsState {
  nextAt: number;
  pending: PendingChoice[];
  modifiers: EventModifier[];
  log: EventLogEntry[];
  /** Drama Drops are suppressed until this simulated time. */
  calmUntil: number;
  lastTournament: TournamentResult | null;
}

export interface Design {
  id: string;
  name: string;
  size: number;
  /** Up to 35 hex colours; pixel value n refers to palette[n - 1]. */
  palette: string[];
  /** One character per pixel from PIXEL_ALPHABET ('0' = transparent). */
  pixels: string;
  handmade: boolean;
  createdAt: number;
  version: number;
}

export interface MerchLine {
  designId: string | null;
  /** Price as a multiple of the product's base price. */
  price: number;
  launchedAt: number;
  sold: number;
  revenue: number;
}

export interface MerchState {
  trend: TrendId;
  trendEndsAt: number;
  unlocked: Record<string, boolean>;
  lines: Record<string, MerchLine>;
}

export interface SponsorOffer {
  id: number;
  brandId: string;
  tier: number;
  duration: number;
  incomePct: number;
  goal: { kind: SponsorGoalKind; target: number; rewardSeconds: number };
}

export interface SponsorContract extends SponsorOffer {
  signedAt: number;
  endsAt: number;
  baseline: number;
  completed: boolean;
}

export interface SponsorHistoryEntry {
  brandId: string;
  completed: boolean;
  reason: 'expired' | 'cancelled' | 'crashed';
  endedAt: number;
}

export interface SponsorsState {
  offers: SponsorOffer[];
  active: SponsorContract[];
  nextRefresh: number;
  history: SponsorHistoryEntry[];
}

export interface Legend {
  tag: string;
  first: string;
  last: string;
  gameId: string;
  look: Appearance;
  rating: number;
  run: number;
}

export interface HallOfFameEntry {
  run: number;
  orgName: string;
  logo: string | null;
  earned: number;
  legacyGained: number;
  bestTier: number;
  bestGame: string | null;
  titles: number;
  tournamentsWon: number;
  matchesWon: number;
  mvp: { tag: string; first: string; last: string; gameId: string; rarity: Rarity; look: Appearance; wins: number; founder: boolean } | null;
  retired: string | null;
  kept: string | null;
  duration: number;
  endedAt: number;
  challenge: string | null;
}

export interface PrestigeState {
  /** Total legacy earned across all sales (each level is +1% income). */
  level: number;
  /** Unspent legacy points. */
  points: number;
  spent: number;
  runs: number;
  /** Legacy node id -> real timestamp bought. */
  nodes: Record<string, number>;
  hallOfFame: HallOfFameEntry[];
  legends: Legend[];
  /** Kept players waiting for their game to be unlocked. */
  reserve: Player[];
  challenge: string | null;
  challengesDone: Record<string, number>;
  runBaseline: { seasonTitles: number; tournamentsWon: number; matchesWon: number };
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
  matchToasts: boolean;
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
  matchesWon: number;
  matchesLost: number;
  prizeMoneyTotal: number;
  seasonTitles: number;
  promotions: number;
  playersSigned: number;
  playersSold: number;
  gearBought: number;
  looksChanged: number;
  trophiesTotal: number;
  staffHired: number;
  illnesses: number;
  injuries: number;
  burnouts: number;
  decorBought: number;
  mostUnavailable: number;
  dropsClicked: number;
  dramaClicked: number;
  dropsMissed: number;
  tournamentsPlayed: number;
  tournamentsWon: number;
  eventsSeen: number;
  choicesMade: number;
  opLevels: number;
  hypeTrainBest: number;
  designsCreated: number;
  merchSold: number;
  merchRevenue: number;
  sponsorsSigned: number;
  sponsorGoals: number;
  cryptoCrashes: number;
  orgsSold: number;
  legacyNodes: number;
  challengesCompleted: number;
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
  /** Simulated time of the last logo click. */
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
  games: Record<string, GameProgress>;
  teams: Record<string, TeamState>;
  players: Record<string, Player>;
  market: MarketState;
  staff: Record<string, number>;
  decor: Record<string, boolean>;
  drops: DropsState;
  events: EventsState;
  designs: Record<string, Design>;
  merch: MerchState;
  sponsors: SponsorsState;
  prestige: PrestigeState;
  nextId: number;
  popularityClock: number;
  stats: Stats;
  settings: Settings;
}
