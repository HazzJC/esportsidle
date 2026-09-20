import type { SeasonPlan } from '../data/seasonPlans';
import type { GearSlot } from '../data/gear';
import type { TrendId } from '../data/merch';
import type { SponsorGoalKind } from '../data/sponsors';
import type { TutorialStep } from '../data/tutorial';
import type { Emblem } from '../data/emblems';
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
  | { kind: 'merch'; mult: number }
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
  | { kind: 'legacyLevelPct'; add: number }
  | { kind: 'feeMult'; mult: number }
  | { kind: 'energyDrain'; mult: number };

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
  /** Multiplier on transfer-market signing fees. */
  feeMult: number;
  /** Team rating multipliers per game (retired legends). */
  gameRatingMult: Record<string, number>;
}

export interface TeamEval {
  gameId: string;
  rating: number;
  opponent: number;
  winChance: number;
  /** Prize and fan multiplier: lopsided matches draw smaller crowds. */
  stakes: number;
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
  /** Achievements counting towards the cabinet, for showing what one more is worth. */
  cabinetCount: number;
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
  /** Badge shape and mark: the logo until the player draws one. */
  emblem: Emblem;
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
  /** Seasons completed with the org; players age a year every few seasons. */
  seasons: number;
  /** Announced retirement: leaves at the end of their team's next season. */
  retiring: boolean;
  /** Level when signed, so resale value can reward development done by this org. */
  signedLevel: number;
  milestones: CareerMilestone[];
}

export interface MatchRecord {
  win: boolean;
  /** Played against the org's rival. */
  rival?: boolean;
  score: string;
  opponent: string;
  prize: number;
  fans: number;
  tier: number;
  time: number;
}

export interface CareerMilestone {
  id: string;
  label: string;
  time: number;
  run: number;
}

export interface RivalState {
  name: string;
  heat?: number;
  formerPlayer?: string;
  wins: number;
  losses: number;
  /** Positive: our winning streak against them; negative: theirs. */
  streak: number;
  since: number;
}

export interface RivalRecord {
  name: string;
  wins: number;
  losses: number;
  until: number;
}

export interface SeasonRecap {
  run: number;
  gameId: string;
  season: number;
  tier: number;
  wins: number;
  played: number;
  title: boolean;
  promoted: boolean;
  relegated: boolean;
  mvp: string | null;
  earnings: number;
  time: number;
}

/** A trophy on the shelf. Kept across sales, so the cabinet tells the org's whole story. */
export type TrophyKind = 'title' | 'tournament' | 'runnerUp' | 'sponsor' | 'quest';

export interface TrophyEntry {
  id: number;
  kind: TrophyKind;
  gameId: string;
  tier: number;
  season: number | null;
  mvp: string | null;
  /** Where a trophy that is not a league title came from: a brand, a quest, a bracket. */
  label?: string;
  run: number;
  time: number;
}

/** Colours a team plays in. Kept separate from the interface tone. */
export interface TeamKit {
  primary: string;
  secondary: string;
}

export interface TeamState {
  gameId: string;
  /** Colours for this team only; null follows the org's team colours. */
  kit: TeamKit | null;
  plan: SeasonPlan;
  /** A plan chosen mid-season waits for the next season. */
  nextPlan: SeasonPlan | null;
  seasonEarnings: number;
  /** Wins per starter this season, for picking the MVP. */
  seasonStats: Record<string, number>;
  lastSeason: SeasonRecap | null;
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
  /** Recent results as a moving average from 0 (all losses) to 1 (all wins). Drives team mood. */
  form: number;
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
  currency?: 'cash' | 'legacy';
  isEasterEgg?: boolean;
}

export interface MarketState {
  listings: MarketListing[];
  nextRefresh: number;
  rerolls: number;
  /** Player ids held through market refreshes: at most one per game and role. */
  pinned: string[];
  scouting?: {
    gameBias: string | null;
    rarityBias: Rarity | null;
    traitFocus: string | null;
  };
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
  /** Cash this option costs (negative means the org is paid). Drives the money line on the card. */
  cash?: number;
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
  /** When a timed activity ends. One-off news stays recent for a short time. */
  endsAt?: number;
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
  /** Fans who walked out over a scandal and are waiting to be won back. */
  fansHeld: number;
  /** When those fans drift back. */
  fansReturnAt: number;
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
  quality?: number;
}

export interface MerchState {
  trend: TrendId;
  trendEndsAt: number;
  unlocked: Record<string, boolean>;
  lines: Record<string, MerchLine>;
  mania?: { trend: TrendId; productId: string; endsAt: number } | null;
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
  /** Run earnings when the deal was signed, so the goal bonus can follow what the org actually made. */
  earnedAt?: number;
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
  mandate?: string | null;
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

/** Standing orders the front office carries out once each routine is unlocked. */
export interface AutomationSettings {
  operations: { on: boolean; maxCostPct: number };
  upgrades: { on: boolean; maxCostPct: number };
  roster: { on: boolean; maxCostPct: number; buyBench?: boolean };
  gear: { on: boolean; maxCostPct: number };
  sponsors: { on: boolean; minTier: number; avoidCrypto: boolean };
  roles: { on: boolean };
}

export interface AutomationLogEntry {
  time: number;
  text: string;
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
  /** Founding Charter, chosen once on the first sale and kept for every later run. */
  charter: string | null;
  /** Run Mandate for the current run, chosen when the org was last sold. */
  mandate: string | null;
  /** Dynasty track id -> ranks owned. Repeatable, so legacy points never run out of uses. */
  dynasty: Record<string, number>;
  /** Whether the game has already offered the first sale, so it only ever interrupts once. */
  offeredSale?: boolean;
}

export interface ActiveQuest {
  id: string;
  /** The quest's metric when it was offered; delta quests count from here. */
  base: number;
  /** Finished and announced, waiting for the player to pick a reward. */
  ready: boolean;
}

export interface QuestState {
  active: ActiveQuest[];
  /** Quest id -> simulated time it was claimed. Kept across sales. */
  done: Record<string, number>;
  /** Quest id -> index of the reward taken, so permanent perks keep applying. */
  picks: Record<string, number>;
  /** Quest id -> simulated time it was set aside. It returns once the rest of the queue is used up. */
  skipped: Record<string, number>;
  claimed: number;
}

export interface TutorialState {
  step: TutorialStep;
}

/** Popup categories the player can mute. Anything the player did themselves is always shown. */
export type NotifyChannel = 'matches' | 'players' | 'events' | 'business' | 'achievements';

/** Where a dollar came from, so income can be broken down by system. */
export type IncomeSource = 'ops' | 'click' | 'match' | 'merch' | 'sponsor' | 'quest' | 'drop' | 'event' | 'tournament';

export const INCOME_SOURCES: IncomeSource[] = ['ops', 'click', 'match', 'merch', 'sponsor', 'quest', 'drop', 'event', 'tournament'];

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
  /** The click chain mini-game that runs when the crowd goes wild. */
  hypeChain: boolean;
  /** Background music, synthesised in the browser. */
  musicOn: boolean;
  musicVolume: number;
  confirmPrestige: boolean;
  buyAmount: number;
  /** Which kinds of popup to show. Late game, match and player news can arrive every few seconds. */
  notify: Record<NotifyChannel, boolean>;
  /** Interface highlight colour, chosen at the start and changeable in Options. */
  uiAccent: string;
  /** Whether the first-run screen (org name and interface tone) has been completed. */
  onboarded: boolean;
}

export interface Stats {
  playersRetired: number;
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
  derbyWins: number;
  /** Season titles won while the founding player was the only player in the org. */
  soloFounderTitles: number;
  /** Seasons won without dropping a match. */
  perfectSeasons: number;
  /** Wins from matches the team was given little chance of winning. */
  upsetWins: number;
  bestWinStreak: number;
  worstLoseStreak: number;
  /** Logo clicks in the small hours, local time. */
  lateNightClicks: number;
  /** The longest chain of hype bubbles popped in one crowd. */
  bestChain: number;
  /** Hype bubbles popped in total. */
  chainPops: number;
  bubbystrLosses: number;
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
  /** Cash earned this run, split by where it came from. */
  incomeRun: Record<IncomeSource, number>;
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
  /** Kept across sales: the rules are the player's, even though unlocks are re-earned. */
  automation: AutomationSettings;
  automationLog: AutomationLogEntry[];
  /** Persistent stories, kept across sales. */
  rival: RivalState | null;
  rivalHistory: RivalRecord[];
  seasonLog: SeasonRecap[];
  trophyCase: TrophyEntry[];
  /** The three first-player prospects offered when a run starts with an empty roster. */
  draft: MarketListing[] | null;
  tutorial: TutorialState;
  quests: QuestState;
  /** Section (centre tab) id -> simulated time it opened. Sections open as the org grows. */
  sections: Record<string, number>;
  /** Sections the player has visited since they opened, so new ones can be flagged. */
  sectionsSeen: Record<string, boolean>;
  /** Explainer cards the player has read and closed. */
  guides: Record<string, boolean>;
  nextId: number;
  popularityClock: number;
  stats: Stats;
  settings: Settings;
}
