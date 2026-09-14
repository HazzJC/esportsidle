import type { StatAmount } from './staff';

export interface RoomDef {
  name: string;
  /** Cash earned this run needed to move in. */
  threshold: number;
  desc: string;
}

export const ROOMS: RoomDef[] = [
  { name: 'Garage', threshold: 0, desc: 'Concrete floor, one bare bulb and a dream.' },
  { name: 'Apartment', threshold: 1e5, desc: 'Actual walls. A window. The neighbours complain.' },
  { name: 'Gaming House', threshold: 1e8, desc: 'A proper house with a room for every setup.' },
  { name: 'Team HQ', threshold: 1e11, desc: 'Glass walls, a skyline view and a receptionist.' },
  { name: 'Esports Campus', threshold: 1e14, desc: 'Training halls, a stadium and a helipad.' },
  { name: 'Orbital HQ', threshold: 1e18, desc: 'Zero gravity, infinite ping to Earth, perfect view.' },
];

export interface DecorDef {
  id: string;
  name: string;
  icon: string;
  cost: number;
  /** Room level required to fit it. */
  room: number;
  desc: string;
  effects: StatAmount[];
}

export const DECOR: DecorDef[] = [
  { id: 'posters', name: 'Esports Posters', icon: 'image', cost: 500, room: 0, desc: 'Signed posters of your heroes.', effects: [{ stat: 'morale', amount: 2 }] },
  {
    id: 'rgb',
    name: 'RGB Light Strips',
    icon: 'lightbulb',
    cost: 2_500,
    room: 0,
    desc: 'Everything is better in rainbow.',
    effects: [
      { stat: 'morale', amount: 2 },
      { stat: 'fans', amount: 0.02 },
    ],
  },
  { id: 'plants', name: 'Office Plants', icon: 'sprout', cost: 8_000, room: 0, desc: 'Fresh air, fewer sniffles.', effects: [{ stat: 'sickness', amount: 0.1 }] },
  { id: 'fridge', name: 'Mini Fridge', icon: 'refrigerator', cost: 25_000, room: 1, desc: 'Stocked with energy drinks and one sad yoghurt.', effects: [{ stat: 'energyRecovery', amount: 0.05 }] },
  { id: 'beanbags', name: 'Beanbag Pile', icon: 'sofa', cost: 120_000, room: 1, desc: 'The official napping zone.', effects: [{ stat: 'energyRecovery', amount: 0.08 }] },
  { id: 'whiteboard', name: 'Strategy Whiteboard', icon: 'presentation', cost: 500_000, room: 1, desc: 'Covered in arrows nobody understands.', effects: [{ stat: 'xp', amount: 0.05 }] },
  {
    id: 'cat',
    name: 'House Cat',
    icon: 'cat',
    cost: 2_000_000,
    room: 2,
    desc: 'Named "Lag". Sits on keyboards at critical moments.',
    effects: [
      { stat: 'morale', amount: 4 },
      { stat: 'moraleSwing', amount: 0.1 },
    ],
  },
  { id: 'espresso', name: 'Espresso Machine', icon: 'coffee', cost: 1e7, room: 2, desc: 'Italian, loud and essential.', effects: [{ stat: 'energyRecovery', amount: 0.1 }] },
  {
    id: 'arcade',
    name: 'Retro Arcade Cabinet',
    icon: 'gamepad-2',
    cost: 8e7,
    room: 2,
    desc: 'For "warming up".',
    effects: [
      { stat: 'morale', amount: 3 },
      { stat: 'fans', amount: 0.03 },
    ],
  },
  { id: 'neon', name: 'Neon Org Sign', icon: 'zap', cost: 5e8, room: 2, desc: 'Your name in glowing letters. Great for stream backgrounds.', effects: [{ stat: 'fans', amount: 0.05 }] },
  { id: 'shelf', name: 'Trophy Shelf', icon: 'trophy', cost: 5e9, room: 3, desc: 'Shows off every trophy you have won.', effects: [{ stat: 'morale', amount: 3 }] },
  {
    id: 'aquarium',
    name: 'Aquarium',
    icon: 'fish',
    cost: 5e10,
    room: 3,
    desc: 'Scientifically calming. The fish are called Ping and Pong.',
    effects: [
      { stat: 'moraleSwing', amount: 0.1 },
      { stat: 'sickness', amount: 0.1 },
    ],
  },
  {
    id: 'massage',
    name: 'Massage Chairs',
    icon: 'armchair',
    cost: 1e12,
    room: 3,
    desc: 'Twelve settings, all of them "yes".',
    effects: [
      { stat: 'energyRecovery', amount: 0.15 },
      { stat: 'injury', amount: 0.15 },
    ],
  },
  {
    id: 'napPods',
    name: 'Nap Pods',
    icon: 'bed',
    cost: 5e13,
    room: 4,
    desc: 'Twenty-minute power naps in a futuristic egg.',
    effects: [
      { stat: 'energyRecovery', amount: 0.2 },
      { stat: 'burnout', amount: 0.25 },
    ],
  },
  {
    id: 'holotable',
    name: 'Holographic Replay Table',
    icon: 'projector',
    cost: 5e15,
    room: 4,
    desc: 'Replays every match in 3D, from every angle.',
    effects: [
      { stat: 'xp', amount: 0.1 },
      { stat: 'opponent', amount: 0.05 },
    ],
  },
  {
    id: 'zeroG',
    name: 'Zero-G Lounge',
    icon: 'orbit',
    cost: 1e18,
    room: 5,
    desc: 'Float between matches. Surprisingly relaxing.',
    effects: [
      { stat: 'morale', amount: 5 },
      { stat: 'energyRecovery', amount: 0.2 },
    ],
  },
];

export const DECOR_MAP: Map<string, DecorDef> = new Map(DECOR.map((d) => [d.id, d]));
