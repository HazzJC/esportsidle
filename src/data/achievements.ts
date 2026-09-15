import { fmt } from '../engine/format';
import type { GameState, Rates } from '../engine/types';
import { DECOR, ROOMS } from './decor';
import { OPERATIONS, OP_ACH_THRESHOLDS } from './operations';
import { STAFF } from './staff';

export type AchievementGroup =
  | 'earnings'
  | 'income'
  | 'clicks'
  | 'operations'
  | 'upgrades'
  | 'fans'
  | 'hype'
  | 'teams'
  | 'players'
  | 'staff'
  | 'events'
  | 'misc';

export interface AchievementDef {
  id: string;
  name: string;
  desc: () => string;
  icon: string;
  group: AchievementGroup;
  /** Shadow achievements don't count towards the trophy cabinet. */
  shadow?: boolean;
  /** Secret achievements hide their description until unlocked. */
  secret?: boolean;
  check: (s: GameState, r: Rates) => boolean;
}

const list: AchievementDef[] = [];
const add = (def: AchievementDef): void => {
  list.push(def);
};

const totalOwned = (s: GameState): number => OPERATIONS.reduce((n, op) => n + s.ops[op.id].owned, 0);

// Earnings -------------------------------------------------------------------
const EARN: [number, string][] = [
  [0, 'Pocket Change'],
  [3, 'Garage Money'],
  [5, 'Ramen Budget'],
  [6, 'Millionaire Gamer'],
  [8, 'Prize Pool Material'],
  [9, 'Billionaire Boys Club'],
  [11, 'Venture Capital'],
  [12, 'Trillion Dollar Tryhard'],
  [14, 'Unicorn Org'],
  [15, 'Quadrillionaire'],
  [17, 'Economic Superpower'],
  [18, 'GDP of a Continent'],
  [20, 'Printing Money'],
  [21, 'Sextillion Stacks'],
  [24, 'Septillion Salary'],
  [27, 'Octillion Org'],
  [30, 'Nonillion Net Worth'],
  [33, 'Decillion Dynasty'],
];
for (const [exp, name] of EARN) {
  const n = Math.pow(10, exp);
  add({
    id: `earn_${exp}`,
    name,
    desc: () => `Earn ${fmt(n)} cash in one run.`,
    icon: 'dollar-sign',
    group: 'earnings',
    check: (s) => s.earnedRun >= n,
  });
}

// Income ---------------------------------------------------------------------
const INCOME: [number, string][] = [
  [0, 'Passive Income'],
  [1, 'Side Hustle'],
  [2, 'Quit the Day Job'],
  [3, 'Full-Time Pro'],
  [4, 'Salary Cap Buster'],
  [5, 'Money Printer'],
  [6, 'Cash Cannon'],
  [7, 'Revenue Stream'],
  [8, 'Revenue River'],
  [9, 'Revenue Ocean'],
  [10, 'Fiscal Tsunami'],
  [11, 'Economic Event Horizon'],
  [12, 'Trillion per Second'],
  [14, 'Hundred Trillion Hustle'],
  [16, 'Money Glitch'],
  [18, 'Infinite Money Glitch'],
];
for (const [exp, name] of INCOME) {
  const n = Math.pow(10, exp);
  add({
    id: `cps_${exp}`,
    name,
    desc: () => `Earn ${fmt(n)} cash per second (without buffs).`,
    icon: 'trending-up',
    group: 'income',
    check: (_s, r) => r.cpsNoBuffs >= n,
  });
}

// Clicking -------------------------------------------------------------------
const CLICKS: [number, string][] = [
  [1, 'GG'],
  [100, 'Warm-Up Clicks'],
  [1_000, 'APM Machine'],
  [10_000, 'Carpal Tunnel Speedrun'],
  [50_000, 'Click Legend'],
  [150_000, 'Button Destroyer'],
];
for (const [n, name] of CLICKS) {
  add({
    id: `clicks_${n}`,
    name,
    desc: () => `Click your logo ${fmt(n)} time${n === 1 ? '' : 's'} (all time).`,
    icon: 'mouse-pointer-click',
    group: 'clicks',
    check: (s) => s.stats.clicksTotal >= n,
  });
}
const CLICK_CASH: [number, string][] = [
  [3, 'Handmade Hustle'],
  [5, 'Clicker Main'],
  [7, 'Mechanical Gold'],
  [9, 'Clutch Clicker'],
  [11, 'Million-Dollar Finger'],
  [13, 'Legendary Index Finger'],
  [15, 'Click Deity'],
  [18, 'The Finger of God'],
];
for (const [exp, name] of CLICK_CASH) {
  const n = Math.pow(10, exp);
  add({
    id: `clickcash_${exp}`,
    name,
    desc: () => `Earn ${fmt(n)} cash from clicking (all time).`,
    icon: 'mouse-pointer-click',
    group: 'clicks',
    check: (s) => s.stats.clickCashTotal >= n,
  });
}

// Operations -----------------------------------------------------------------
for (const op of OPERATIONS) {
  OP_ACH_THRESHOLDS.forEach((n, i) => {
    add({
      id: `op_${op.id}_${n}`,
      name: op.achNames[i],
      desc: () => `Own ${n} ${n === 1 ? op.name : op.plural}.`,
      icon: op.icon,
      group: 'operations',
      check: (s) => s.ops[op.id].owned >= n,
    });
  });
}
const TOTAL_OPS: [number, string][] = [
  [10, 'Small Business'],
  [100, 'Growing Org'],
  [500, 'Org Empire'],
  [1000, 'Conglomerate'],
  [2000, 'Megacorp'],
  [4000, 'Esports Monopoly'],
];
for (const [n, name] of TOTAL_OPS) {
  add({
    id: `opstotal_${n}`,
    name,
    desc: () => `Own ${fmt(n)} operations in total.`,
    icon: 'building',
    group: 'operations',
    check: (s) => totalOwned(s) >= n,
  });
}
add({
  id: 'ops_all_1',
  name: 'Diversified Portfolio',
  desc: () => 'Own at least 1 of every operation.',
  icon: 'layers',
  group: 'operations',
  check: (s) => OPERATIONS.every((op) => s.ops[op.id].owned >= 1),
});
add({
  id: 'ops_all_100',
  name: 'Centurion Org',
  desc: () => 'Own at least 100 of every operation.',
  icon: 'layers',
  group: 'operations',
  check: (s) => OPERATIONS.every((op) => s.ops[op.id].owned >= 100),
});

// Upgrades -------------------------------------------------------------------
const UPGRADE_COUNTS: [number, string][] = [
  [10, 'Patch Notes Reader'],
  [25, 'Min-Maxer'],
  [50, 'Meta Chaser'],
  [100, 'Theorycrafter'],
  [200, 'Upgrade Addict'],
  [300, 'Fully Optimised'],
];
for (const [n, name] of UPGRADE_COUNTS) {
  add({
    id: `upgrades_${n}`,
    name,
    desc: () => `Own ${n} upgrades.`,
    icon: 'sparkles',
    group: 'upgrades',
    check: (s) => Object.keys(s.upgrades).length >= n,
  });
}

// Fans -----------------------------------------------------------------------
const FANS: [number, string][] = [
  [2, 'First Fans'],
  [3, 'Fan Club'],
  [4, 'Stadium Chants'],
  [5, 'Cult Following'],
  [6, 'Million Followers'],
  [8, 'Nation of Fans'],
  [10, 'Planetary Fandom'],
  [12, 'Galactic Following'],
  [14, 'Universal Adoration'],
];
for (const [exp, name] of FANS) {
  const n = Math.pow(10, exp);
  add({
    id: `fans_${exp}`,
    name,
    desc: () => `Have ${fmt(n)} fans.`,
    icon: 'heart',
    group: 'fans',
    check: (s) => s.fans >= n,
  });
}

// Hype -----------------------------------------------------------------------
const CROWDS: [number, string][] = [
  [1, 'Crowd Goes Wild'],
  [10, 'Hype Machine'],
  [50, 'Perpetual Hype'],
  [200, 'Eternal Roar'],
];
for (const [n, name] of CROWDS) {
  add({
    id: `crowd_${n}`,
    name,
    desc: () => `Fill the hype meter ${n} time${n === 1 ? '' : 's'}.`,
    icon: 'megaphone',
    group: 'hype',
    check: (s) => s.stats.crowdsTotal >= n,
  });
}

// Teams ----------------------------------------------------------------------
const bestTier = (s: GameState): number => Object.values(s.teams).reduce((m, t) => Math.max(m, t.bestTier), 0);
const unlockedGames = (s: GameState): number => Object.values(s.games).filter((g) => g.unlocked).length;
const players = (s: GameState) => Object.values(s.players);

const WINS: [number, string][] = [
  [1, 'First Blood'],
  [25, 'Scrim Regulars'],
  [100, 'Tournament Grinders'],
  [500, 'Veteran Squad'],
  [2_500, 'Winning Machine'],
  [10_000, 'Dynasty'],
  [50_000, 'Unbeatable'],
];
for (const [n, name] of WINS) {
  add({
    id: `wins_${n}`,
    name,
    desc: () => `Win ${fmt(n)} match${n === 1 ? '' : 'es'}.`,
    icon: 'swords',
    group: 'teams',
    check: (s) => s.stats.matchesWon >= n,
  });
}
const TIERS: [number, string][] = [
  [1, 'Qualified'],
  [3, 'Collegiate Contenders'],
  [5, 'Challengers'],
  [7, 'Going Pro'],
  [9, 'World Champions'],
  [11, 'Orbital Elite'],
  [13, 'Multiversal'],
  [16, 'Beyond the Multiverse'],
];
for (const [n, name] of TIERS) {
  add({
    id: `tier_${n}`,
    name,
    desc: () => `Reach league tier ${n + 1} with any team.`,
    icon: 'trending-up',
    group: 'teams',
    check: (s) => bestTier(s) >= n,
  });
}
const TITLES: [number, string][] = [
  [1, 'Season Champions'],
  [10, 'Serial Winners'],
  [50, 'Trophy Hoarders'],
  [200, 'Silverware Collectors'],
];
for (const [n, name] of TITLES) {
  add({
    id: `titles_${n}`,
    name,
    desc: () => `Win ${n} season title${n === 1 ? '' : 's'} (9+ wins in a season).`,
    icon: 'trophy',
    group: 'teams',
    check: (s) => s.stats.seasonTitles >= n,
  });
}
const GAME_COUNTS: [number, string][] = [
  [2, 'Branching Out'],
  [4, 'Multi-Title Org'],
  [8, 'Esports Conglomerate'],
  [12, 'Every Game Ever'],
];
for (const [n, name] of GAME_COUNTS) {
  add({
    id: `games_${n}`,
    name,
    desc: () => `Field teams in ${n} games.`,
    icon: 'gamepad-2',
    group: 'teams',
    check: (s) => unlockedGames(s) >= n,
  });
}

// Players --------------------------------------------------------------------
const SIGNED: [number, string][] = [
  [1, 'First Signing'],
  [10, 'Talent Magnet'],
  [40, 'Scouting Legend'],
  [150, 'Transfer Window Addict'],
];
for (const [n, name] of SIGNED) {
  add({
    id: `signed_${n}`,
    name,
    desc: () => `Sign ${n} player${n === 1 ? '' : 's'}.`,
    icon: 'user-plus',
    group: 'players',
    check: (s) => s.stats.playersSigned >= n,
  });
}
add({
  id: 'sign_legend',
  name: 'Legendary Signing',
  desc: () => 'Have a Legend-rarity player on your roster.',
  icon: 'crown',
  group: 'players',
  check: (s) => players(s).some((p) => p.rarity === 'legend'),
});
const LEVELS: [number, string][] = [
  [10, 'Levelling Up'],
  [25, 'Seasoned Pro'],
  [50, 'Elite Talent'],
  [100, 'Maximum Level'],
];
for (const [n, name] of LEVELS) {
  add({
    id: `level_${n}`,
    name,
    desc: () => `Get a player to level ${n}.`,
    icon: 'sparkles',
    group: 'players',
    check: (s) => players(s).some((p) => p.level >= n),
  });
}
const GEAR_COUNTS: [number, string][] = [
  [1, 'Upgrade Path'],
  [50, 'Hardware Enthusiast'],
  [250, 'Gear Head'],
  [1_000, 'Silicon Valley'],
];
for (const [n, name] of GEAR_COUNTS) {
  add({
    id: `gear_${n}`,
    name,
    desc: () => `Buy ${fmt(n)} gear upgrade${n === 1 ? '' : 's'}.`,
    icon: 'cpu',
    group: 'players',
    check: (s) => s.stats.gearBought >= n,
  });
}
add({
  id: 'fully_kitted',
  name: 'Fully Kitted',
  desc: () => 'Get every gear slot on one player to tier 5 or higher.',
  icon: 'shield',
  group: 'players',
  check: (s) => players(s).some((p) => Object.values(p.gear).every((t) => t >= 5)),
});
add({
  id: 'sneakerhead',
  name: 'Sneakerhead',
  desc: () => 'Get a pair of shoes to tier 10.',
  icon: 'footprints',
  group: 'players',
  check: (s) => players(s).some((p) => p.gear.shoes >= 10),
});
add({
  id: 'maxed_slot',
  name: 'Maxed Out',
  desc: () => 'Upgrade any gear slot to the maximum tier.',
  icon: 'gem',
  group: 'players',
  check: (s) => players(s).some((p) => Object.values(p.gear).some((t) => t >= 15)),
});
add({
  id: 'potato',
  name: 'Potato Warrior',
  desc: () => 'Reach tier 4 with a team whose starters all still use their starting PCs.',
  icon: 'cpu',
  group: 'players',
  secret: true,
  check: (s) =>
    Object.values(s.teams).some(
      (t) => t.tier >= 3 && t.lineup.every((id) => id !== null && (s.players[id]?.gear.pc ?? 1) === 0),
    ),
});
add({
  id: 'makeover',
  name: 'Makeover',
  desc: () => "Change a player's look.",
  icon: 'palette',
  group: 'players',
  shadow: true,
  check: (s) => s.stats.looksChanged >= 1,
});

// Staff & house --------------------------------------------------------------
const staffTotal = (s: GameState): number => STAFF.reduce((n, d) => n + (s.staff[d.id] ?? 0), 0);
const HIRES: [number, string][] = [
  [1, 'First Hire'],
  [25, 'Growing Staff'],
  [100, 'Full Department'],
  [500, 'Corporate Machine'],
  [1_500, 'Mega Employer'],
];
for (const [n, name] of HIRES) {
  add({
    id: `staff_${n}`,
    name,
    desc: () => `Employ ${fmt(n)} staff in total.`,
    icon: 'briefcase',
    group: 'staff',
    check: (s) => staffTotal(s) >= n,
  });
}
const STAFF_SPECIALS: [string, number, string, string][] = [
  ['coach', 50, 'Coaching Tree', 'clipboard-list'],
  ['chef', 25, 'Well Fed', 'chef-hat'],
  ['physio', 25, 'Injury Prevention', 'stethoscope'],
  ['psych', 25, 'Zen Masters', 'brain-circuit'],
  ['ai', 10, 'Skynet Scrims', 'bot'],
];
for (const [id, n, name, icon] of STAFF_SPECIALS) {
  const def = STAFF.find((d) => d.id === id)!;
  add({
    id: `staff_${id}_${n}`,
    name,
    desc: () => `Employ ${n} ${def.plural}.`,
    icon,
    group: 'staff',
    check: (s) => (s.staff[id] ?? 0) >= n,
  });
}
add({
  id: 'sick_day',
  name: 'Sick Day',
  desc: () => 'Have 3 players unavailable at the same time.',
  icon: 'thermometer',
  group: 'staff',
  secret: true,
  check: (s) => s.stats.mostUnavailable >= 3,
});
add({
  id: 'walk_it_off',
  name: 'Walk It Off',
  desc: () => 'Have a player recover from an injury.',
  icon: 'bandage',
  group: 'staff',
  check: (s) => s.stats.injuries >= 1 && !Object.values(s.players).some((p) => p.status.kind === 'injured' && p.status.until > s.time),
});
add({
  id: 'decor_1',
  name: 'Home Sweet Home',
  desc: () => 'Buy your first piece of decor.',
  icon: 'image',
  group: 'staff',
  check: (s) => s.stats.decorBought >= 1,
});
add({
  id: 'decor_all',
  name: 'Interior Designer',
  desc: () => 'Buy every piece of decor.',
  icon: 'sofa',
  group: 'staff',
  check: (s) => DECOR.every((d) => s.decor[d.id]),
});
const ROOM_ACHIEVEMENTS: [number, string][] = [
  [1, 'Moving Up'],
  [2, 'The Gaming House'],
  [4, 'Campus Life'],
  [5, 'Orbital Headquarters'],
];
for (const [level, name] of ROOM_ACHIEVEMENTS) {
  add({
    id: `room_${level}`,
    name,
    desc: () => `Move into the ${ROOMS[level].name}.`,
    icon: 'house',
    group: 'staff',
    check: (s) => s.earnedRun >= ROOMS[level].threshold,
  });
}

// Events ---------------------------------------------------------------------
const DROPS: [number, string][] = [
  [1, 'Hype Beast'],
  [7, 'Drop Hunter'],
  [27, 'Notification Addict'],
  [77, 'Always Refreshing'],
  [277, 'Seven Seven Seven'],
];
for (const [n, name] of DROPS) {
  add({
    id: `drops_${n}`,
    name,
    desc: () => `Click ${n} Hype Drop${n === 1 ? '' : 's'}.`,
    icon: 'zap',
    group: 'events',
    check: (s) => s.stats.dropsClicked >= n,
  });
}
add({
  id: 'drama_1',
  name: 'Stirring the Pot',
  desc: () => 'Click a Drama Drop.',
  icon: 'flame',
  group: 'events',
  check: (s) => s.stats.dramaClicked >= 1,
});
add({
  id: 'drama_27',
  name: 'Drama Channel',
  desc: () => 'Click 27 Drama Drops.',
  icon: 'flame',
  group: 'events',
  check: (s) => s.stats.dramaClicked >= 27,
});
add({
  id: 'tourney_played',
  name: 'Invited',
  desc: () => 'Play in a tournament.',
  icon: 'swords',
  group: 'events',
  check: (s) => s.stats.tournamentsPlayed >= 1,
});
const TOURNEY_WINS: [number, string][] = [
  [1, 'Tournament Champions'],
  [5, 'Bracket Busters'],
  [25, 'Invitational Kings'],
  [100, 'Tournament Dynasty'],
];
for (const [n, name] of TOURNEY_WINS) {
  add({
    id: `tourney_${n}`,
    name,
    desc: () => `Win ${n} tournament${n === 1 ? '' : 's'}.`,
    icon: 'trophy',
    group: 'events',
    check: (s) => s.stats.tournamentsWon >= n,
  });
}
add({
  id: 'train_5',
  name: 'All Aboard',
  desc: () => 'Reach carriage 5 of a Hype Train.',
  icon: 'rocket',
  group: 'events',
  check: (s) => s.stats.hypeTrainBest >= 5,
});
add({
  id: 'train_12',
  name: 'Hype Express',
  desc: () => 'Reach carriage 12 of a Hype Train.',
  icon: 'rocket',
  group: 'events',
  check: (s) => s.stats.hypeTrainBest >= 12,
});
add({
  id: 'oplevel_1',
  name: 'Business Upgrade',
  desc: () => 'Level up an operation with trophies.',
  icon: 'trophy',
  group: 'events',
  check: (s) => s.stats.opLevels >= 1,
});
add({
  id: 'oplevel_25',
  name: 'Trophy Investor',
  desc: () => 'Buy 25 operation levels.',
  icon: 'trophy',
  group: 'events',
  check: (s) => s.stats.opLevels >= 25,
});
add({
  id: 'events_10',
  name: 'Keeping Up',
  desc: () => 'Witness 10 world events.',
  icon: 'newspaper',
  group: 'events',
  check: (s) => s.stats.eventsSeen >= 10,
});
add({
  id: 'events_100',
  name: 'News Junkie',
  desc: () => 'Witness 100 world events.',
  icon: 'newspaper',
  group: 'events',
  check: (s) => s.stats.eventsSeen >= 100,
});
add({
  id: 'choices_10',
  name: 'Decision Maker',
  desc: () => 'Make 10 decisions on world events.',
  icon: 'briefcase',
  group: 'events',
  check: (s) => s.stats.choicesMade >= 10,
});
add({
  id: 'too_slow',
  name: 'Too Slow',
  desc: () => 'Let a Hype Drop disappear.',
  icon: 'clock',
  group: 'events',
  shadow: true,
  check: (s) => s.stats.dropsMissed >= 1,
});

// Misc & shadow ----------------------------------------------------------------
add({
  id: 'rename',
  name: 'Rebrand',
  desc: () => 'Rename your organisation.',
  icon: 'pencil',
  group: 'misc',
  check: (s) => s.stats.renames >= 1,
});
add({
  id: 'sell_grinder',
  name: 'Rage Quit',
  desc: () => 'Sell a Ranked Grinder.',
  icon: 'skull',
  group: 'misc',
  secret: true,
  check: (s) => s.stats.opsSoldTotal >= 1,
});
add({
  id: 'speedrun_1m',
  name: 'Speedrunner',
  desc: () => `Earn ${fmt(1e6)} cash within 10 minutes of starting a run.`,
  icon: 'clock',
  group: 'misc',
  secret: true,
  check: (s) => s.earnedRun >= 1e6 && s.time - s.runStartTime <= 600,
});
add({
  id: 'ctrl_s',
  name: 'Ctrl+S Enthusiast',
  desc: () => 'Manually save 25 times.',
  icon: 'save',
  group: 'misc',
  shadow: true,
  check: (s) => s.stats.manualSaves >= 25,
});
add({
  id: 'backup',
  name: 'Backup Plan',
  desc: () => 'Export your save.',
  icon: 'download',
  group: 'misc',
  shadow: true,
  check: (s) => s.stats.exports >= 1,
});
add({
  id: 'touch_grass',
  name: 'Touched Grass',
  desc: () => 'Return after being away for at least 8 hours.',
  icon: 'sun',
  group: 'misc',
  shadow: true,
  secret: true,
  check: (s) => s.stats.offlineSecondsTotal >= 8 * 3600,
});

export const ACHIEVEMENTS: AchievementDef[] = list;
export const ACHIEVEMENT_MAP: Map<string, AchievementDef> = new Map(list.map((a) => [a.id, a]));
