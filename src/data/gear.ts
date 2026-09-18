import { RARITY_COLORS } from './palette';
import type { StatKey } from '../engine/types';

export type GearSlot = 'pc' | 'monitor' | 'mouse' | 'keyboard' | 'headset' | 'chair' | 'desk' | 'shoes' | 'jersey' | 'charm';

export const GEAR_MAX_TIER = 15;
export const GEAR_COST_GROWTH = 11;

export interface GearSlotDef {
  id: GearSlot;
  name: string;
  icon: string;
  /** Stats multiplied by `growth ^ tier`. */
  stats: StatKey[];
  growth: number;
  baseCost: number;
  desc: string;
  tiers: string[];
}

export const GEAR_SLOTS: GearSlotDef[] = [
  {
    id: 'pc',
    name: 'PC',
    icon: 'cpu',
    stats: ['mechanics', 'gameSense', 'teamwork', 'composure'],
    growth: 1.12,
    baseCost: 60,
    desc: 'Boosts every core stat. Frames win games.',
    tiers: [
      'Hand-me-down Laptop',
      'Office Tower',
      'Budget Gaming PC',
      'RGB Mid-Tower',
      'Pre-Built Beast',
      'Custom Loop Build',
      'Twin-GPU Monster',
      'Open-Air Test Bench',
      'Server Rack Rig',
      'Liquid Nitrogen Rig',
      'Quantum Rig',
      'Neural Mainframe',
      'Fusion-Powered Tower',
      'Black Hole Cooler Build',
      'Dyson Sphere Box',
      'The Omniframe',
    ],
  },
  {
    id: 'monitor',
    name: 'Monitor',
    icon: 'monitor',
    stats: ['mechanics'],
    growth: 1.25,
    baseCost: 40,
    desc: 'More hertz, more headshots. Boosts Mechanics.',
    tiers: [
      "Grandma's CRT",
      '60Hz Office Screen',
      '75Hz Budget Panel',
      '144Hz Gaming Monitor',
      '165Hz IPS',
      '240Hz Esports Panel',
      '280Hz OLED',
      '360Hz Pro Panel',
      '480Hz OLED',
      '540Hz Tournament Panel',
      '1000Hz Prototype',
      'Holographic Display',
      'Retinal Projector',
      'Direct Optic-Nerve Feed',
      'Precognitive Display',
      'Screen of Infinite Hertz',
    ],
  },
  {
    id: 'mouse',
    name: 'Mouse',
    icon: 'mouse',
    stats: ['mechanics'],
    growth: 1.25,
    baseCost: 25,
    desc: 'Lighter, faster, flickier. Boosts Mechanics.',
    tiers: [
      'Ball Mouse',
      'Office Mouse',
      'Rubber-Grip Mouse',
      'Honeycomb Mouse',
      'Ultralight Wireless',
      'Magnesium Shell',
      'Carbon Fibre Glide',
      'Titanium Precision',
      '8K Polling Mouse',
      'Frictionless Hover Mouse',
      'Maglev Mouse',
      'Neural-Linked Mouse',
      'Quantum Tracking Mouse',
      'Graviton Mouse',
      'Thought Cursor',
      'The Mouse of Destiny',
    ],
  },
  {
    id: 'keyboard',
    name: 'Keyboard',
    icon: 'keyboard',
    stats: ['mechanics', 'composure'],
    growth: 1.15,
    baseCost: 30,
    desc: 'Clicky switches for clutch moments. Boosts Mechanics and Composure.',
    tiers: [
      'Sticky Membrane Board',
      'Office Keyboard',
      'Budget Mechanical',
      'Hot-Swap TKL',
      'Custom 65%',
      'Optical Switch Board',
      'Rapid-Trigger Board',
      'Hall-Effect Magnetic',
      'Titanium Plate Custom',
      'Zero-Actuation Board',
      'Neural Keypad',
      'Holographic Keys',
      'Thought-Stroke Board',
      'Tachyon Switches',
      'Keyboard of Babel',
      'The Last Keyboard',
    ],
  },
  {
    id: 'headset',
    name: 'Headset',
    icon: 'headphones',
    stats: ['teamwork', 'gameSense'],
    growth: 1.18,
    baseCost: 35,
    desc: 'Hear every footstep and every callout. Boosts Teamwork and Game Sense.',
    tiers: [
      'Tangled Earbuds',
      'Phone Headphones',
      'Budget Headset',
      'Surround Sound Headset',
      'Wireless Pro Headset',
      'Studio Monitors',
      'Planar Magnetic Cans',
      'Noise-Cancelling Titan',
      'Bone-Conduction Rig',
      'Spatial Audio Halo',
      'Echolocation Array',
      'Neural Audio Link',
      'Precognitive Sound',
      'Harmonic Resonator',
      'Sound of the Cosmos',
      'The Silence Breaker',
    ],
  },
  {
    id: 'chair',
    name: 'Chair',
    icon: 'armchair',
    stats: ['composure', 'stamina'],
    growth: 1.18,
    baseCost: 45,
    desc: 'Posture is a stat. Boosts Composure and Stamina.',
    tiers: [
      'Wobbly Stool',
      'Kitchen Chair',
      'Office Chair',
      'Racing-Style Chair',
      'Mesh Ergo Chair',
      'Premium Ergo Throne',
      'Heated Massage Chair',
      'Zero-G Recliner',
      'Anti-Gravity Seat',
      'Posture-AI Throne',
      'Levitating Cushion',
      'Cryo-Rest Pod',
      'Hover Throne',
      'Chair of Perfect Posture',
      'Celestial Throne',
      'The Iron Seat',
    ],
  },
  {
    id: 'desk',
    name: 'Desk',
    icon: 'layers',
    stats: ['gameSense'],
    growth: 1.2,
    baseCost: 20,
    desc: 'Room for notes, snacks and a second monitor for VODs. Boosts Game Sense.',
    tiers: [
      'Cardboard Box',
      'Folding Table',
      'Flat-Pack Desk',
      'Gaming Desk',
      'Standing Desk',
      'Motorised L-Desk',
      'Carbon Command Centre',
      'Holo-Table',
      'Smart Battle Station',
      'Anti-Vibration Slab',
      'Mission Control Console',
      'Zero-G Workstation',
      'Orbital Command Deck',
      'Singularity Desk',
      'Desk at the Edge of Time',
      'The Grand Station',
    ],
  },
  {
    id: 'shoes',
    name: 'Shoes',
    icon: 'footprints',
    stats: ['composure', 'charisma'],
    growth: 1.16,
    baseCost: 15,
    desc: 'Nobody sees them on stream. Everyone knows. Boosts Composure and Charisma.',
    tiers: [
      'Socks',
      'Flip-Flops',
      'Sport-Mode Crocs',
      'Canvas Sneakers',
      'Running Shoes',
      'High-Tops',
      'Limited Drop Kicks',
      'Self-Lacing Sneakers',
      'Air-Cushion Units',
      'Grip-Tech Trainers',
      'Hoverboots',
      'Anti-Gravity Boots',
      'Rocket Sneakers',
      'Quantum Loafers',
      'Golden Kicks of Clutch',
      'Sneakers of the Gods',
    ],
  },
  {
    id: 'jersey',
    name: 'Jersey',
    icon: 'shirt',
    stats: ['charisma', 'teamwork'],
    growth: 1.15,
    baseCost: 20,
    desc: 'Look like a team, play like a team. Boosts Charisma and Teamwork.',
    tiers: [
      'Plain T-Shirt',
      'Printed Tee',
      'Team Polo',
      'Replica Jersey',
      'Pro Jersey',
      'Signed Pro Jersey',
      'Moisture-Wicking Kit',
      'Carbon-Weave Jersey',
      'LED-Trim Jersey',
      'Holographic Jersey',
      'Adaptive Smart Fabric',
      'Nano-Weave Kit',
      'Starlight Jersey',
      'Aurora Kit',
      'Legendary Jersey',
      'Jersey of a Thousand Champions',
    ],
  },
  {
    id: 'charm',
    name: 'Lucky Charm',
    icon: 'gem',
    stats: ['composure'],
    growth: 1.14,
    baseCost: 10,
    desc: 'Scientifically unproven. Competitively essential. Boosts Composure.',
    tiers: [
      'Lucky Penny',
      'Rubber Duck',
      'Four-Leaf Clover',
      'Plush Mascot',
      'Unwashed Lucky Socks',
      'Crystal Pendant',
      'Golden Duck',
      "Rabbit's Foot Keychain",
      'Fortune Cat',
      'Mystic Amulet',
      'Dice of Fate',
      'Horseshoe of Kings',
      'Cursed Idol',
      'Star Fragment',
      'Probability Totem',
      'The Eye of Clutch',
    ],
  },
];

export const GEAR_MAP: Map<GearSlot, GearSlotDef> = new Map(GEAR_SLOTS.map((g) => [g.id, g]));

export function emptyGear(): Record<GearSlot, number> {
  return { pc: 0, monitor: 0, mouse: 0, keyboard: 0, headset: 0, chair: 0, desk: 0, shoes: 0, jersey: 0, charm: 0 };
}

export interface GearRarityDef {
  id: string;
  name: string;
  color: string;
}

/**
 * Gear reuses the same six rarity bands as players. Without this a Tier 14 mouse and a Tier 3 one
 * differ only by a slightly stronger cyan, so upgrades stop feeling like they land.
 */
export const GEAR_RARITIES: GearRarityDef[] = [
  { id: 'common', name: 'Common', color: RARITY_COLORS[0] },
  { id: 'uncommon', name: 'Uncommon', color: RARITY_COLORS[1] },
  { id: 'rare', name: 'Rare', color: RARITY_COLORS[2] },
  { id: 'epic', name: 'Epic', color: RARITY_COLORS[3] },
  { id: 'legendary', name: 'Legendary', color: RARITY_COLORS[4] },
  { id: 'mythic', name: 'Mythic', color: RARITY_COLORS[5] },
];

/** Maps a 0-15 gear tier onto a rarity band. */
export function gearRarity(tier: number): GearRarityDef {
  const t = Math.max(0, Math.min(GEAR_MAX_TIER, Math.round(tier)));
  const band = t <= 1 ? 0 : t <= 4 ? 1 : t <= 7 ? 2 : t <= 10 ? 3 : t <= 13 ? 4 : 5;
  return GEAR_RARITIES[band];
}
