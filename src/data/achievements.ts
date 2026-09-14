import { fmt } from '../engine/format';
import type { GameState, Rates } from '../engine/types';
import { OPERATIONS, OP_ACH_THRESHOLDS } from './operations';

export type AchievementGroup = 'earnings' | 'income' | 'clicks' | 'operations' | 'upgrades' | 'fans' | 'hype' | 'misc';

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
