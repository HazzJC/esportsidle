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
  perk: string;
  stats?: StatAmount[];
  effects?: Effect[];
}

export const CATEGORY_INFO: Record<SponsorCategory, CategoryInfo> = {
  energy: { label: 'Energy Drink', icon: 'zap', perk: '+20% energy recovery', stats: [{ stat: 'energyRecovery', amount: 0.2 }] },
  peripherals: { label: 'Peripherals', icon: 'mouse', perk: 'Gear 15% cheaper', effects: [{ kind: 'gearCostMult', mult: 0.85 }] },
  snacks: { label: 'Snacks', icon: 'pizza', perk: '+5 base morale', stats: [{ stat: 'morale', amount: 5 }] },
  telecom: { label: 'Telecom', icon: 'wifi', perk: '+5% match speed', stats: [{ stat: 'matchSpeed', amount: 0.05 }] },
  crypto: { label: 'Crypto', icon: 'gem', perk: 'Double income bonus, but it might crash' },
  fastfood: { label: 'Fast Food', icon: 'utensils', perk: '+15% fans', stats: [{ stat: 'fans', amount: 0.15 }] },
  auto: { label: 'Automotive', icon: 'car', perk: '+25% player fans', stats: [{ stat: 'playerFans', amount: 0.25 }] },
  bank: { label: 'Banking', icon: 'dollar-sign', perk: '+20% prize money', effects: [{ kind: 'prizeMult', mult: 1.2 }] },
  vpn: { label: 'VPN', icon: 'shield', perk: '+10% offline earnings', effects: [{ kind: 'offlineRate', add: 0.1 }] },
  apparel: { label: 'Apparel', icon: 'shirt', perk: '+25% merch sales', stats: [{ stat: 'merch', amount: 0.25 }] },
  airline: { label: 'Airline', icon: 'rocket', perk: '+50% tournament prizes', effects: [{ kind: 'tournamentReward', mult: 1.5 }] },
  chairs: { label: 'Gaming Chairs', icon: 'armchair', perk: '25% fewer injuries', stats: [{ stat: 'injury', amount: 0.33 }] },
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
  incomePct: number;
  goalSeconds: number;
}

export const SPONSOR_TIERS: SponsorTier[] = [
  { fans: 1_000, teamTier: 0, incomePct: 0.05, goalSeconds: 300 },
  { fans: 50_000, teamTier: 2, incomePct: 0.1, goalSeconds: 600 },
  { fans: 2e6, teamTier: 5, incomePct: 0.18, goalSeconds: 1200 },
  { fans: 1e8, teamTier: 8, incomePct: 0.3, goalSeconds: 2400 },
  { fans: 1e10, teamTier: 11, incomePct: 0.5, goalSeconds: 4800 },
];

export type SponsorGoalKind = 'wins' | 'fans' | 'titles' | 'tournaments' | 'drops';

export const GOAL_INFO: Record<SponsorGoalKind, { label: (n: string) => string; targets: number[] }> = {
  wins: { label: (n) => `Win ${n} matches`, targets: [10, 40, 150, 500, 1500] },
  fans: { label: (n) => `Gain ${n} fans`, targets: [2e3, 2e5, 2e7, 2e9, 2e11] },
  titles: { label: (n) => `Win ${n} season titles`, targets: [1, 2, 4, 8, 15] },
  tournaments: { label: (n) => `Win ${n} tournaments`, targets: [1, 1, 2, 3, 5] },
  drops: { label: (n) => `Click ${n} Hype Drops`, targets: [3, 5, 8, 12, 20] },
};

export const SPONSORS_UNLOCK_FANS = 2_000;
