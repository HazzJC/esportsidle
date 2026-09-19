import type { GameState } from '../engine/types';

/** Stats that staff and decor can improve. */
export type StaffStat =
  | 'teamRating'
  | 'opponent'
  | 'xp'
  | 'energyRecovery'
  | 'sickness'
  | 'injury'
  | 'burnout'
  | 'recovery'
  | 'morale'
  | 'moraleSwing'
  | 'energyDrain'
  | 'scoutLuck'
  | 'fans'
  | 'playerFans'
  | 'matchSpeed'
  | 'merch'
  | 'sponsor';

export interface StatAmount {
  stat: StaffStat;
  amount: number;
}

export interface StaffDef {
  id: string;
  index: number;
  name: string;
  plural: string;
  icon: string;
  baseCost: number;
  desc: string;
  flavor: string;
  /** Strength per hire before diminishing returns: strength = amount × hires^0.8. */
  effects: StatAmount[];
  /**
   * Hires past this point are worth less, on a shallower curve. Used where stacking one kind of
   * staff was the whole strategy: the first ten are unchanged, the fiftieth is worth about half.
   */
  softCapFrom?: number;
  /** Price growth per hire, when it differs from the usual 15% a hire. */
  costGrowth?: number;
  requirement: string;
  unlock: (s: GameState) => boolean;
  upgradeNames: [string, string, string];
}

export const STAFF_EXPONENT = 0.8;
/** The exponent past a soft cap: growth slows from hires^0.8 to hires^0.42. */
export const STAFF_SOFT_EXPONENT = 0.42;
/** Where coaching and analysis start to saturate. */
export const STAFF_SOFT_CAP = 10;

const matches = (s: GameState): number => s.stats.matchesWon + s.stats.matchesLost;
const games = (s: GameState): number => Object.values(s.games).filter((g) => g.unlocked).length;
const bestTier = (s: GameState): number => Object.values(s.teams).reduce((m, t) => Math.max(m, t.bestTier), 0);

type RawStaff = Omit<StaffDef, 'index'>;

const RAW: RawStaff[] = [
  {
    id: 'coach',
    name: 'Coach',
    plural: 'Coaches',
    icon: 'clipboard-list',
    baseCost: 500,
    desc: 'Drills, VOD reviews and motivational whiteboard speeches. Raises team ratings and XP.',
    flavor: '"Stop peeking mid. Please. I am begging you."',
    effects: [
      { stat: 'teamRating', amount: 0.03 },
      { stat: 'xp', amount: 0.01 },
    ],
    softCapFrom: STAFF_SOFT_CAP,
    costGrowth: 1.12,
    requirement: 'Sign a player or play 20 matches',
    unlock: (s) => s.stats.playersSigned >= 1 || matches(s) >= 20,
    upgradeNames: ['Coaching Certification', 'Tactical Masterclass', 'Hall of Fame Coaching Staff'],
  },
  {
    id: 'chef',
    name: 'Chef',
    plural: 'Chefs',
    icon: 'chef-hat',
    baseCost: 1_500,
    desc: 'Real food instead of instant noodles. Faster energy recovery, fewer illnesses, better morale.',
    flavor: 'Vegetables have been spotted in the gaming house for the first time.',
    effects: [
      { stat: 'energyRecovery', amount: 0.04 },
      { stat: 'sickness', amount: 0.08 },
      { stat: 'morale', amount: 0.4 },
    ],
    requirement: 'Play 40 matches',
    unlock: (s) => matches(s) >= 40,
    upgradeNames: ['Nutrition Degrees', 'Michelin-Starred Kitchen', 'Molecular Meal Plans'],
  },
  {
    id: 'scout',
    name: 'Scout',
    plural: 'Scouts',
    icon: 'binoculars',
    baseCost: 4_000,
    desc: 'Lurks in ranked lobbies looking for hidden gems. Rarer players appear on the market.',
    flavor: 'Has a spreadsheet of every smurf account on the ladder.',
    effects: [{ stat: 'scoutLuck', amount: 0.015 }],
    requirement: 'Sign 2 players',
    unlock: (s) => s.stats.playersSigned >= 2,
    upgradeNames: ['Scouting Combine', 'Global Talent Radar', 'Precognitive Scouting'],
  },
  {
    id: 'physio',
    name: 'Physio',
    plural: 'Physios',
    icon: 'stethoscope',
    baseCost: 12_000,
    desc: 'Wrist stretches and posture checks. Fewer injuries, quicker recoveries, slower energy drain.',
    flavor: '"Your mouse grip is a crime against tendons."',
    effects: [
      { stat: 'injury', amount: 0.08 },
      { stat: 'recovery', amount: 0.04 },
      { stat: 'energyDrain', amount: 0.015 },
    ],
    requirement: 'Play 150 matches',
    unlock: (s) => matches(s) >= 150,
    upgradeNames: ['Sports Science Lab', 'Cryotherapy Suite', 'Nanobot Recovery'],
  },
  {
    id: 'analyst',
    name: 'Analyst',
    plural: 'Analysts',
    icon: 'chart-network',
    baseCost: 60_000,
    desc: 'Studies every opponent. Makes rival teams effectively weaker, especially at high tiers.',
    flavor: 'Watches enemy VODs at 4× speed while eating cereal.',
    effects: [{ stat: 'opponent', amount: 0.02 }],
    softCapFrom: STAFF_SOFT_CAP,
    costGrowth: 1.12,
    requirement: 'Reach league tier 4 with any team',
    unlock: (s) => bestTier(s) >= 3,
    upgradeNames: ['Opponent Dossiers', 'Big Data Room', 'Predictive Meta Models'],
  },
  {
    id: 'social',
    name: 'Social Media Manager',
    plural: 'Social Media Managers',
    icon: 'share-2',
    baseCost: 250_000,
    desc: 'Clips, memes and carefully timed tweets. More fans from everything.',
    flavor: 'Posted "gg ez" once. Still recovering.',
    effects: [
      { stat: 'fans', amount: 0.03 },
      { stat: 'playerFans', amount: 0.04 },
    ],
    requirement: 'Reach 5,000 fans',
    unlock: (s) => s.fansRun >= 5_000,
    upgradeNames: ['Content Calendar', 'Viral Strategy Team', 'Algorithm Whisperers'],
  },
  {
    id: 'psych',
    name: 'Sports Psychologist',
    plural: 'Sports Psychologists',
    icon: 'brain-circuit',
    baseCost: 1_000_000,
    desc: 'Keeps heads cool after throws. Prevents burnout and steadies morale.',
    flavor: '"And how did that 0-14 scoreline make you feel?"',
    effects: [
      { stat: 'burnout', amount: 0.1 },
      { stat: 'moraleSwing', amount: 0.03 },
      { stat: 'morale', amount: 0.3 },
    ],
    requirement: 'Play 600 matches',
    unlock: (s) => matches(s) >= 600,
    upgradeNames: ['Mindfulness Sessions', 'Performance Psychology', 'Unbreakable Mentality Programme'],
  },
  {
    id: 'manager',
    name: 'Team Manager',
    plural: 'Team Managers',
    icon: 'calendar-clock',
    baseCost: 20_000_000,
    desc: 'Books scrims, flights and hotel rooms. Matches happen faster.',
    flavor: 'Has 14 calendars and a colour-coding system nobody else understands.',
    effects: [{ stat: 'matchSpeed', amount: 0.01 }],
    requirement: 'Field teams in 3 games',
    unlock: (s) => games(s) >= 3,
    upgradeNames: ['Scheduling Software', 'Travel Logistics Team', 'Time Management Wizards'],
  },
  {
    id: 'ai',
    name: 'AI Trainer',
    plural: 'AI Trainers',
    icon: 'bot',
    baseCost: 5_000_000_000,
    desc: 'Self-play models that never sleep. Huge XP gains and a small rating boost.',
    flavor: 'It has played ten million games against itself and is still annoyed about one of them.',
    effects: [
      { stat: 'xp', amount: 0.05 },
      { stat: 'teamRating', amount: 0.01 },
    ],
    requirement: 'Field teams in 4 games and play 3,000 matches',
    unlock: (s) => games(s) >= 4 && matches(s) >= 3_000,
    upgradeNames: ['Neural Coaching Models', 'Self-Play Engines', 'Superhuman Training Data'],
  },
  {
    id: 'designer',
    name: 'Merch Designer',
    plural: 'Merch Designers',
    icon: 'palette',
    baseCost: 50_000,
    desc: 'Turns your doodles into bestsellers. Boosts merch sales.',
    flavor: 'Owns 40 black hoodies and has opinions about kerning.',
    effects: [{ stat: 'merch', amount: 0.05 }],
    requirement: 'Unlock a merch product',
    unlock: (s) => Object.keys(s.merch.unlocked).length > 0,
    upgradeNames: ['Screen-Printing Workshop', 'Design Collective', 'Fashion Week Runway'],
  },
  {
    id: 'agent',
    name: 'Talent Agent',
    plural: 'Talent Agents',
    icon: 'handshake',
    baseCost: 150_000,
    desc: 'Negotiates better sponsor deals. Boosts sponsor income.',
    flavor: '"My client will wear the hat, but only for 20% more."',
    effects: [{ stat: 'sponsor', amount: 0.015 }],
    requirement: 'Sign a sponsor',
    unlock: (s) => s.stats.sponsorsSigned >= 1,
    upgradeNames: ['Contract Templates', 'Hardball Negotiators', 'Legendary Super-Agent'],
  },
];

export const STAFF: StaffDef[] = RAW.map((d, index) => ({ ...d, index }));
export const STAFF_MAP: Map<string, StaffDef> = new Map(STAFF.map((d) => [d.id, d]));

export const STAT_DESCRIPTIONS: Record<StaffStat, (amount: number) => string> = {
  teamRating: (a) => `+${pct(a)} team rating`,
  opponent: (a) => `Opponents ${pct(1 - 1 / (1 + a))} weaker`,
  xp: (a) => `+${pct(a)} XP`,
  energyRecovery: (a) => `+${pct(a)} energy recovery`,
  sickness: (a) => `${pct(1 - 1 / (1 + a))} less illness`,
  injury: (a) => `${pct(1 - 1 / (1 + a))} fewer injuries`,
  burnout: (a) => `${pct(1 - 1 / (1 + a))} less burnout`,
  recovery: (a) => `${pct(1 - 1 / (1 + a))} faster recovery`,
  morale: (a) => `+${a.toFixed(1)} base morale`,
  moraleSwing: (a) => `${pct(1 - 1 / (1 + a))} steadier morale`,
  energyDrain: (a) => `${pct(1 - 1 / (1 + a))} less energy drain`,
  scoutLuck: (a) => `+${pct(a)} scouting luck`,
  fans: (a) => `+${pct(a)} fans`,
  playerFans: (a) => `+${pct(a)} player fans`,
  matchSpeed: (a) => `+${pct(a)} match speed`,
  merch: (a) => `+${pct(a)} merch sales`,
  sponsor: (a) => `+${pct(a)} sponsor income`,
};

function pct(v: number): string {
  const p = v * 100;
  return `${p >= 10 ? Math.round(p) : parseFloat(p.toFixed(1))}%`;
}
