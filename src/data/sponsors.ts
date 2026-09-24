import type { Effect } from '../engine/types';
import type { StatAmount } from './staff';

export type SponsorCategory =
  | 'energy'
  | 'peripherals'
  | 'snacks'
  | 'telecom'
  | 'crypto'
  | 'fastfood'
  | 'auto'
  | 'bank'
  | 'vpn'
  | 'apparel'
  | 'airline'
  | 'chairs';

export interface CategoryInfo {
  label: string;
  icon: string;
  /** What the perk does at a given strength (1 is a tier 1 deal with an average goal). */
  perk: (k: number) => string;
  stats?: StatAmount[];
  effects?: Effect[];
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
/** A perk that reduces something: a strength of k removes this share, up to a sensible limit. */
export const reduction = (base: number, k: number) => Math.min(0.7, base * k);

/**
 * Each category's perk at base strength. A contract scales it by its tier and by how hard its goal
 * is, so a top-tier deal with a demanding goal is worth signing for the perk alone. The engine
 * scales the numbers; `perk` describes the scaled result.
 */
export const CATEGORY_INFO: Record<SponsorCategory, CategoryInfo> = {
  energy: { label: 'Energy Drink', icon: 'zap', perk: (k) => `+${pct(0.2 * k)} energy recovery`, stats: [{ stat: 'energyRecovery', amount: 0.2 }] },
  peripherals: { label: 'Peripherals', icon: 'mouse', perk: (k) => `Gear ${pct(reduction(0.15, k))} cheaper`, effects: [{ kind: 'gearCostMult', mult: 0.85 }] },
  snacks: { label: 'Snacks', icon: 'pizza', perk: (k) => `+${Math.round(5 * k)} base morale`, stats: [{ stat: 'morale', amount: 5 }] },
  telecom: { label: 'Telecom', icon: 'wifi', perk: (k) => `+${pct(0.05 * k)} match speed`, stats: [{ stat: 'matchSpeed', amount: 0.05 }] },
  crypto: { label: 'Crypto', icon: 'gem', perk: () => 'Double income bonus, but it might crash' },
  fastfood: { label: 'Fast Food', icon: 'utensils', perk: (k) => `+${pct(0.15 * k)} fans`, stats: [{ stat: 'fans', amount: 0.15 }] },
  auto: { label: 'Automotive', icon: 'car', perk: (k) => `+${pct(0.25 * k)} player fans`, stats: [{ stat: 'playerFans', amount: 0.25 }] },
  bank: { label: 'Banking', icon: 'dollar-sign', perk: (k) => `+${pct(0.2 * k)} prize money`, effects: [{ kind: 'prizeMult', mult: 1.2 }] },
  vpn: { label: 'VPN', icon: 'shield', perk: (k) => `+${Math.round(6 * k)}h offline limit`, effects: [{ kind: 'offlineCap', hours: 6 }] },
  apparel: { label: 'Apparel', icon: 'shirt', perk: (k) => `+${pct(0.25 * k)} merch sales`, stats: [{ stat: 'merch', amount: 0.25 }] },
  airline: { label: 'Airline', icon: 'rocket', perk: (k) => `+${pct(0.5 * k)} tournament prizes`, effects: [{ kind: 'tournamentReward', mult: 1.5 }] },
  chairs: { label: 'Gaming Chairs', icon: 'armchair', perk: (k) => `${pct(1 - 1 / (1 + 0.33 * k))} fewer injuries`, stats: [{ stat: 'injury', amount: 0.33 }] },
};

export interface BrandDef {
  id: string;
  name: string;
  category: SponsorCategory;
  color: string;
  slogan: string;
}

export const BRANDS: BrandDef[] = [
  { id: 'monstar', name: 'Monstar Energy', category: 'energy', color: '#9dff3b', slogan: 'Unleash the taurine.' },
  { id: 'redbullet', name: 'Red Bullet', category: 'energy', color: '#ff4d6d', slogan: 'Gives you frames.' },
  { id: 'gfuelish', name: 'G-Fuelish', category: 'energy', color: '#22e4ff', slogan: 'Tastes like victory. And blue.' },
  { id: 'razr', name: 'Razr-Sharp', category: 'peripherals', color: '#3dff9a', slogan: 'For gamers, by lawyers.' },
  { id: 'logitechno', name: 'LogiTechno', category: 'peripherals', color: '#22a8ff', slogan: 'Click different.' },
  { id: 'hyperx', name: 'HyperExtreme', category: 'peripherals', color: '#ff2bd6', slogan: 'Now 40% more extreme.' },
  { id: 'steelseriesly', name: 'SteelSeriesly', category: 'peripherals', color: '#ff8a3d', slogan: 'Seriously steel.' },
  { id: 'crunchy', name: 'Crunchy Chips Co.', category: 'snacks', color: '#ffc83d', slogan: 'Crunch responsibly (not on mic).' },
  { id: 'doritoes', name: 'Doritoes', category: 'snacks', color: '#ff8a3d', slogan: 'Orange fingers, gold trophies.' },
  { id: 'nacho', name: 'Nacho Average Snacks', category: 'snacks', color: '#d9a441', slogan: 'Cheesier than your plays.' },
  { id: 'verizoom', name: 'Verizoom', category: 'telecom', color: '#ff4d6d', slogan: 'Can you hear me now? Good.' },
  { id: 'teleping', name: 'TelePing', category: 'telecom', color: '#22e4ff', slogan: 'Single-digit ping or your money back*.' },
  { id: 'fibre', name: 'Fibre Optimus', category: 'telecom', color: '#8b5cff', slogan: 'Transform your connection.' },
  { id: 'blockcoin', name: 'BlockCoin', category: 'crypto', color: '#ffc83d', slogan: 'Number go up (probably).' },
  { id: 'moontokens', name: 'MoonTokens', category: 'crypto', color: '#b05cff', slogan: 'To the moon. Terms apply.' },
  { id: 'hodl', name: 'HODL Exchange', category: 'crypto', color: '#3dff9a', slogan: 'Never sell. Never check.' },
  { id: 'burger', name: 'Burger Empress', category: 'fastfood', color: '#ff8a3d', slogan: 'Have it your way, but faster.' },
  { id: 'pizzahutt', name: 'Pizza Hutt', category: 'fastfood', color: '#ff4d6d', slogan: 'Delivered before the match ends.' },
  { id: 'tacobellow', name: 'Taco Bellow', category: 'fastfood', color: '#b05cff', slogan: 'Yell for tacos.' },
  { id: 'mercedes', name: 'Mercedes-Bends', category: 'auto', color: '#c9d3e6', slogan: 'Drift into the finals.' },
  { id: 'hondo', name: 'Hondo Motors', category: 'auto', color: '#ff4d6d', slogan: 'Reliable, like your support player.' },
  { id: 'tesler', name: 'Tesler', category: 'auto', color: '#e9ecff', slogan: 'Autopilot for your career.' },
  { id: 'bankofgrind', name: 'Bank of Grind', category: 'bank', color: '#22a8ff', slogan: 'Interest rates as high as your APM.' },
  { id: 'mastercardio', name: 'Mastercardio', category: 'bank', color: '#ff8a3d', slogan: 'Priceless clutches.' },
  { id: 'visaversa', name: 'Visa-Versa', category: 'bank', color: '#3a6bff', slogan: 'Pay now, win later.' },
  { id: 'snorvpn', name: 'SnorVPN', category: 'vpn', color: '#3dff9a', slogan: 'Hide your IP from the jungler.' },
  { id: 'expressnope', name: 'ExpressVPNope', category: 'vpn', color: '#ff4d6d', slogan: 'Watch other regions’ tournaments.' },
  { id: 'surfshork', name: 'SurfShork', category: 'vpn', color: '#22e4ff', slogan: 'Unlimited devices, unlimited smurfs.' },
  { id: 'nikey', name: 'Nikey', category: 'apparel', color: '#e9ecff', slogan: 'Just clutch it.' },
  { id: 'adidash', name: 'Adidash', category: 'apparel', color: '#22a8ff', slogan: 'Impossible is a skill issue.' },
  { id: 'pumakittens', name: 'Puma Kittens', category: 'apparel', color: '#ff2bd6', slogan: 'Forever faster naps.' },
  { id: 'emiratez', name: 'Emiratez', category: 'airline', color: '#ffc83d', slogan: 'Fly to every major in style.' },
  { id: 'ryanairheads', name: 'RyanAirheads', category: 'airline', color: '#22a8ff', slogan: 'Your keyboard costs extra.' },
  { id: 'quantumair', name: 'Quantum Airways', category: 'airline', color: '#8b5cff', slogan: 'Arrive before you depart.' },
  { id: 'secretlabz', name: 'SecretLabz', category: 'chairs', color: '#ff4d6d', slogan: 'The chair that believes in you.' },
  { id: 'dxracecar', name: 'DXRacecar', category: 'chairs', color: '#9dff3b', slogan: 'Zero to comfortable in 3 seconds.' },
];

export const BRAND_MAP: Map<string, BrandDef> = new Map(BRANDS.map((b) => [b.id, b]));

export interface SponsorTier {
  fans: number;
  teamTier: number;
  /** Income bonus while the deal runs. Kept modest: the perk is where a big deal earns its keep. */
  incomePct: number;
  /** Strength of the category perk, before the goal's difficulty. */
  perkScale: number;
  goalSeconds: number;
}

/**
 * Ten tiers. The first five are open to every org; tiers six to ten need the Global Brand Portfolio
 * legacy node. Each step asks for far more fans and a far better team than the last, and pays
 * mostly through a stronger perk rather than a bigger slice of income.
 */
export const SPONSOR_TIERS: SponsorTier[] = [
  { fans: 1_000, teamTier: 0, incomePct: 0.04, perkScale: 1, goalSeconds: 300 },
  { fans: 50_000, teamTier: 2, incomePct: 0.06, perkScale: 1.25, goalSeconds: 600 },
  { fans: 2e6, teamTier: 5, incomePct: 0.09, perkScale: 1.6, goalSeconds: 1200 },
  { fans: 2e8, teamTier: 8, incomePct: 0.12, perkScale: 2, goalSeconds: 2400 },
  { fans: 5e10, teamTier: 11, incomePct: 0.16, perkScale: 2.5, goalSeconds: 4800 },
  { fans: 1e13, teamTier: 14, incomePct: 0.2, perkScale: 3.1, goalSeconds: 6000 },
  { fans: 5e15, teamTier: 17, incomePct: 0.25, perkScale: 3.8, goalSeconds: 7200 },
  { fans: 2e18, teamTier: 20, incomePct: 0.3, perkScale: 4.6, goalSeconds: 8400 },
  { fans: 1e21, teamTier: 23, incomePct: 0.36, perkScale: 5.5, goalSeconds: 9600 },
  { fans: 5e23, teamTier: 26, incomePct: 0.42, perkScale: 6.5, goalSeconds: 10_800 },
];

/** Tiers open without the Global Brand Portfolio legacy node. */
export const BASE_SPONSOR_TIERS = 5;

export type SponsorGoalKind = 'wins' | 'fans' | 'titles' | 'tournaments' | 'drops';

export const GOAL_INFO: Record<SponsorGoalKind, { label: (n: string) => string; targets: number[] }> = {
  wins: { label: (n) => `Win ${n} matches`, targets: [10, 40, 150, 500, 1500, 4000, 10_000, 25_000, 60_000, 150_000] },
  fans: { label: (n) => `Gain ${n} fans`, targets: [2e3, 2e5, 2e7, 2e9, 2e11, 2e13, 2e15, 2e17, 2e19, 2e21] },
  titles: { label: (n) => `Win ${n} league titles`, targets: [1, 2, 4, 8, 15, 25, 40, 60, 90, 130] },
  tournaments: { label: (n) => `Win ${n} Invitationals`, targets: [1, 1, 2, 3, 5, 7, 10, 14, 19, 25] },
  drops: { label: (n) => `Click ${n} Hype Drops`, targets: [8, 18, 40, 85, 180, 260, 350, 450, 560, 700] },
};

/**
 * How demanding each kind of goal is. Contracts with harder goals come with stronger perks and a
 * bigger income bonus: fans and wins pile up on their own, Hype Drops need you at the keyboard.
 */
export const GOAL_EASE: Record<SponsorGoalKind, number> = { fans: 0.8, wins: 0.9, titles: 1.15, tournaments: 1.3, drops: 1.45 };

export const SPONSORS_UNLOCK_FANS = 1_000;
