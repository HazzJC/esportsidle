export type Genre = 'fighting' | 'carsoccer' | 'tacfps' | 'moba' | 'battleroyale' | 'heroshooter' | 'rts' | 'cardgame' | 'pong' | 'vr';

export type CoreStat = 'mechanics' | 'gameSense' | 'teamwork' | 'composure';

export const CORE_STATS: CoreStat[] = ['mechanics', 'gameSense', 'teamwork', 'composure'];

/** How much each core stat contributes to a player's rating in each genre (weights sum to 1). */
export const GENRE_WEIGHTS: Record<Genre, Record<CoreStat, number>> = {
  fighting: { mechanics: 0.45, gameSense: 0.25, teamwork: 0, composure: 0.3 },
  carsoccer: { mechanics: 0.4, gameSense: 0.25, teamwork: 0.2, composure: 0.15 },
  tacfps: { mechanics: 0.35, gameSense: 0.25, teamwork: 0.2, composure: 0.2 },
  moba: { mechanics: 0.25, gameSense: 0.35, teamwork: 0.25, composure: 0.15 },
  battleroyale: { mechanics: 0.35, gameSense: 0.3, teamwork: 0.15, composure: 0.2 },
  heroshooter: { mechanics: 0.3, gameSense: 0.25, teamwork: 0.3, composure: 0.15 },
  rts: { mechanics: 0.35, gameSense: 0.45, teamwork: 0, composure: 0.2 },
  cardgame: { mechanics: 0.05, gameSense: 0.6, teamwork: 0, composure: 0.35 },
  pong: { mechanics: 0.5, gameSense: 0.2, teamwork: 0.1, composure: 0.2 },
  vr: { mechanics: 0.3, gameSense: 0.25, teamwork: 0.25, composure: 0.2 },
};

export const GENRE_LABEL: Record<Genre, string> = {
  fighting: 'Fighting',
  carsoccer: 'Car Soccer',
  tacfps: 'Tactical FPS',
  moba: 'MOBA',
  battleroyale: 'Battle Royale',
  heroshooter: 'Hero Shooter',
  rts: 'Real-Time Strategy',
  cardgame: 'Card Battler',
  pong: 'Quantum Arcade',
  vr: 'VR Warfare',
};

export interface GameDef {
  id: string;
  index: number;
  name: string;
  genre: Genre;
  teamSize: number;
  roles: string[];
  icon: string;
  color: string;
  unlockCost: number;
  /** Scales gear prices and signing fees for this game's players. */
  costScale: number;
  /** Flat prize per win at tier 0. */
  basePrize: number;
  matchSeconds: number;
  basePopularity: number;
  volatility: number;
  desc: string;
}

type RawGame = Omit<GameDef, 'index'>;

const RAW: RawGame[] = [
  {
    id: 'smash',
    name: 'Smash Siblings',
    genre: 'fighting',
    teamSize: 1,
    roles: ['Main'],
    icon: 'swords',
    color: '#ff4d6d',
    unlockCost: 0,
    costScale: 1,
    basePrize: 1,
    matchSeconds: 15,
    basePopularity: 1,
    volatility: 0.08,
    desc: 'A chaotic platform fighter where siblings settle their differences. Every org starts here.',
  },
  {
    id: 'rocket',
    name: 'Rocket Soccar',
    genre: 'carsoccer',
    teamSize: 3,
    roles: ['Striker', 'Midfield', 'Keeper'],
    icon: 'car',
    color: '#3fb6ff',
    unlockCost: 2_500,
    costScale: 2.5,
    basePrize: 8,
    matchSeconds: 18,
    basePopularity: 1,
    volatility: 0.1,
    desc: 'Rocket-powered cars. A giant ball. Physics optional.',
  },
  {
    id: 'counter',
    name: 'Counter-Stroke',
    genre: 'tacfps',
    teamSize: 5,
    roles: ['Entry', 'AWPer', 'Lurker', 'Support', 'IGL'],
    icon: 'crosshair',
    color: '#ffc83d',
    unlockCost: 150_000,
    costScale: 150,
    basePrize: 60,
    matchSeconds: 30,
    basePopularity: 1.1,
    volatility: 0.06,
    desc: 'Plant the bomb, defuse the bomb, argue about the economy round.',
  },
  {
    id: 'lanes',
    name: 'League of Lanes',
    genre: 'moba',
    teamSize: 5,
    roles: ['Top', 'Jungle', 'Mid', 'Carry', 'Support'],
    icon: 'castle',
    color: '#8b5cff',
    unlockCost: 8_000_000,
    costScale: 8_000,
    basePrize: 500,
    matchSeconds: 40,
    basePopularity: 1.15,
    volatility: 0.05,
    desc: 'Five lanes, 160 champions and one jungler to blame for everything.',
  },
  {
    id: 'apex',
    name: 'Apex Legumes',
    genre: 'battleroyale',
    teamSize: 3,
    roles: ['Fragger', 'Scout', 'Anchor'],
    icon: 'target',
    color: '#9dff3b',
    unlockCost: 4e8,
    costScale: 4e5,
    basePrize: 5_000,
    matchSeconds: 35,
    basePopularity: 1,
    volatility: 0.12,
    desc: 'Sixty squads of heroic vegetables drop onto an island. One squad leaves.',
  },
  {
    id: 'valorunt',
    name: 'Valorunt',
    genre: 'tacfps',
    teamSize: 5,
    roles: ['Duelist', 'Initiator', 'Controller', 'Sentinel', 'Flex'],
    icon: 'zap',
    color: '#ff5f7a',
    unlockCost: 2e10,
    costScale: 2e7,
    basePrize: 50_000,
    matchSeconds: 30,
    basePopularity: 1.1,
    volatility: 0.07,
    desc: 'Tactical shooting, but everyone can also teleport and throw fireballs.',
  },
  {
    id: 'fortnight',
    name: 'Fortnight',
    genre: 'battleroyale',
    teamSize: 4,
    roles: ['Builder', 'Fragger', 'Support', 'IGL'],
    icon: 'hammer',
    color: '#22e4ff',
    unlockCost: 1e12,
    costScale: 1e9,
    basePrize: 500_000,
    matchSeconds: 35,
    basePopularity: 1.2,
    volatility: 0.15,
    desc: 'Build a four-storey fort in 0.8 seconds or die trying. Lasts exactly two weeks per season.',
  },
  {
    id: 'starcrafty',
    name: 'StarCrafty',
    genre: 'rts',
    teamSize: 1,
    roles: ['Commander'],
    icon: 'rocket',
    color: '#7dd3fc',
    unlockCost: 6e13,
    costScale: 6e10,
    basePrize: 5e6,
    matchSeconds: 25,
    basePopularity: 0.95,
    volatility: 0.05,
    desc: '400 actions per minute, three alien races and zero mercy.',
  },
  {
    id: 'overclock',
    name: 'Overclock',
    genre: 'heroshooter',
    teamSize: 6,
    roles: ['Main Tank', 'Off Tank', 'Hitscan', 'Flex DPS', 'Main Support', 'Flex Support'],
    icon: 'shield',
    color: '#ff8a3d',
    unlockCost: 4e15,
    costScale: 4e12,
    basePrize: 5e7,
    matchSeconds: 30,
    basePopularity: 1,
    volatility: 0.1,
    desc: 'Six heroes, one payload and a lot of shouting about healing.',
  },
  {
    id: 'hearthstoned',
    name: 'Hearthstoned',
    genre: 'cardgame',
    teamSize: 1,
    roles: ['Deckbuilder'],
    icon: 'spade',
    color: '#d9a441',
    unlockCost: 3e17,
    costScale: 3e14,
    basePrize: 5e8,
    matchSeconds: 20,
    basePopularity: 0.9,
    volatility: 0.09,
    desc: 'A relaxing card game where RNG decides your entire career.',
  },
  {
    id: 'pong',
    name: 'Quantum Pong',
    genre: 'pong',
    teamSize: 2,
    roles: ['Left Paddle', 'Right Paddle'],
    icon: 'circle-dot',
    color: '#ff2bd6',
    unlockCost: 2e19,
    costScale: 2e16,
    basePrize: 5e9,
    matchSeconds: 12,
    basePopularity: 1.05,
    volatility: 0.13,
    desc: 'The ball exists in every position at once. The paddles do not.',
  },
  {
    id: 'galactic',
    name: 'Galactic Siege VR',
    genre: 'vr',
    teamSize: 5,
    roles: ['Vanguard', 'Pilot', 'Engineer', 'Sniper', 'Commander'],
    icon: 'orbit',
    color: '#3dff9a',
    unlockCost: 1.5e21,
    costScale: 1.5e18,
    basePrize: 5e10,
    matchSeconds: 45,
    basePopularity: 1.1,
    volatility: 0.08,
    desc: 'Full-body VR warfare across a simulated galaxy. Bring a towel.',
  },
];

export const GAMES: GameDef[] = RAW.map((g, index) => ({ ...g, index }));
export const GAME_MAP: Map<string, GameDef> = new Map(GAMES.map((g) => [g.id, g]));

export function getGame(id: string): GameDef {
  const g = GAME_MAP.get(id);
  if (!g) throw new Error(`Unknown game ${id}`);
  return g;
}
