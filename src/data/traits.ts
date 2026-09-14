import type { GearSlot } from './gear';
import type { StatKey } from '../engine/types';

export interface TraitDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  tone: 'good' | 'bad' | 'mixed';
  /** Relative chance of rolling this trait. */
  weight: number;
  statAdd?: Partial<Record<StatKey, number>>;
  ratingMult?: number;
  /** Rating multiplier applied only from this league tier upwards. */
  bigStage?: { minTier: number; mult: number };
  /** Multiplies the whole lineup's rating. */
  teamMult?: number;
  fansMult?: number;
  xpMult?: number;
  energyDrainMult?: number;
  moraleSwingMult?: number;
  moraleBase?: number;
  potentialAdd?: number;
  /** Exponent multiplier on a gear slot's effect. */
  gearMult?: Partial<Record<GearSlot, number>>;
  sickMult?: number;
  injuryMult?: number;
  luck?: number;
  cutAdd?: number;
}

export const TRAITS: TraitDef[] = [
  { id: 'clutch', name: 'Clutch God', desc: 'Rating +8%. Lives for 1v3s.', icon: 'flame', tone: 'good', weight: 4, ratingMult: 1.08 },
  { id: 'tilt', name: 'Tilt-Prone', desc: 'Morale swings twice as hard.', icon: 'face-slightly-frowning', tone: 'bad', weight: 6, moraleSwingMult: 2 },
  { id: 'iron_stomach', name: 'Iron Stomach', desc: 'Rarely gets sick.', icon: 'utensils', tone: 'good', weight: 5, sickMult: 0.3 },
  { id: 'glass_wrists', name: 'Glass Wrists', desc: '+6 Mechanics, but injuries are twice as likely.', icon: 'bandage', tone: 'mixed', weight: 5, statAdd: { mechanics: 6 }, injuryMult: 2 },
  { id: 'meme', name: 'Meme Lord', desc: 'Earns 50% more fans.', icon: 'face-slightly-smiling', tone: 'good', weight: 5, fansMult: 1.5 },
  { id: 'sneakerhead', name: 'Sneakerhead', desc: 'Shoe gear is twice as effective.', icon: 'footprints', tone: 'good', weight: 4, gearMult: { shoes: 2 } },
  { id: 'shotcaller', name: 'Shotcaller', desc: 'Whole lineup gets +5% rating.', icon: 'megaphone', tone: 'good', weight: 3, teamMult: 1.05 },
  { id: 'grinder', name: 'Grinder', desc: 'Gains XP 50% faster.', icon: 'dumbbell', tone: 'good', weight: 5, xpMult: 1.5 },
  { id: 'lazy_genius', name: 'Lazy Genius', desc: 'Rating +10%, but XP is 40% slower.', icon: 'brain', tone: 'mixed', weight: 3, ratingMult: 1.1, xpMult: 0.6 },
  { id: 'hardware_snob', name: 'Hardware Snob', desc: 'PC and monitor upgrades are 30% more effective.', icon: 'cpu', tone: 'good', weight: 4, gearMult: { pc: 1.3, monitor: 1.3 } },
  { id: 'superstitious', name: 'Superstitious', desc: 'Lucky charms are twice as effective.', icon: 'gem', tone: 'good', weight: 4, gearMult: { charm: 2 }, luck: 0.05 },
  { id: 'night_owl', name: 'Night Owl', desc: 'Rating +6%. Sleeps at 5am, plays at 5pm.', icon: 'moon', tone: 'good', weight: 4, ratingMult: 1.06 },
  { id: 'fan_favourite', name: 'Fan Favourite', desc: 'Fans +30% and naturally higher morale.', icon: 'heart', tone: 'good', weight: 4, fansMult: 1.3, moraleBase: 10 },
  { id: 'veteran', name: 'Veteran', desc: '+8 Composure, 20% slower XP.', icon: 'medal', tone: 'mixed', weight: 4, statAdd: { composure: 8 }, xpMult: 0.8 },
  { id: 'wonderkid', name: 'Wonderkid', desc: 'Potential +15.', icon: 'sparkles', tone: 'good', weight: 2, potentialAdd: 15 },
  { id: 'energy_addict', name: 'Energy Drink Addict', desc: 'Energy drains 30% slower.', icon: 'zap', tone: 'good', weight: 5, energyDrainMult: 0.7 },
  { id: 'hot_head', name: 'Hot-Headed', desc: 'Rating +5%, morale losses hurt 50% more.', icon: 'flame', tone: 'mixed', weight: 4, ratingMult: 1.05, moraleSwingMult: 1.5 },
  { id: 'chill', name: 'Chill', desc: 'Morale changes are halved.', icon: 'sun', tone: 'good', weight: 5, moraleSwingMult: 0.5 },
  { id: 'streamer_brain', name: 'Streamer Brain', desc: '+15 Charisma, rating -5%.', icon: 'video', tone: 'mixed', weight: 4, statAdd: { charisma: 15 }, ratingMult: 0.95 },
  { id: 'tryhard', name: 'Tryhard', desc: 'Rating +4%, energy drains 30% faster.', icon: 'activity', tone: 'mixed', weight: 5, ratingMult: 1.04, energyDrainMult: 1.3 },
  { id: 'team_player', name: 'Team Player', desc: '+10 Teamwork.', icon: 'users', tone: 'good', weight: 5, statAdd: { teamwork: 10 } },
  { id: 'solo_queue', name: 'Solo Queue Hero', desc: '+10 Mechanics, -10 Teamwork.', icon: 'user', tone: 'mixed', weight: 5, statAdd: { mechanics: 10, teamwork: -10 } },
  { id: 'homesick', name: 'Homesick', desc: 'Morale sits 12 points lower.', icon: 'house', tone: 'bad', weight: 4, moraleBase: -12 },
  { id: 'big_stage', name: 'Big Stage Player', desc: 'Rating +12% from the Continental Major upwards.', icon: 'crown', tone: 'good', weight: 3, bigStage: { minTier: 8, mult: 1.12 } },
  { id: 'choker', name: 'Choker', desc: 'Rating -12% from the Continental Major upwards.', icon: 'skull', tone: 'bad', weight: 3, bigStage: { minTier: 8, mult: 0.88 } },
  { id: 'lucky', name: 'Lucky', desc: 'Things just seem to go their way.', icon: 'dice-5', tone: 'good', weight: 3, luck: 0.1 },
  { id: 'keyboard_warrior', name: 'Keyboard Warrior', desc: '+6 Mechanics, -10 Charisma.', icon: 'keyboard', tone: 'mixed', weight: 4, statAdd: { mechanics: 6, charisma: -10 } },
  { id: 'early_bird', name: 'Early Bird', desc: 'Gains XP 20% faster.', icon: 'sun', tone: 'good', weight: 4, xpMult: 1.2 },
  { id: 'iron_man', name: 'Iron Man', desc: 'Energy drains 50% slower and rarely gets injured.', icon: 'shield', tone: 'good', weight: 2, energyDrainMult: 0.5, injuryMult: 0.5 },
  { id: 'rgb', name: 'RGB Enthusiast', desc: 'PC upgrades 20% more effective. Everything glows.', icon: 'sparkles', tone: 'good', weight: 4, gearMult: { pc: 1.2 } },
  { id: 'diva', name: 'Diva', desc: '+12 Charisma, but demands a 5% bigger cut.', icon: 'star', tone: 'mixed', weight: 3, statAdd: { charisma: 12 }, cutAdd: 0.05 },
  { id: 'cheap', name: 'Loyal', desc: 'Takes a 4% smaller cut of winnings.', icon: 'handshake', tone: 'good', weight: 3, cutAdd: -0.04 },
];

export const TRAIT_MAP: Map<string, TraitDef> = new Map(TRAITS.map((t) => [t.id, t]));
