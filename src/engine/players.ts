import { RARITY_COLORS } from '../data/palette';
import {
  ACCESSORIES,
  BODY_TYPES,
  BROW_STYLES,
  EYE_STYLES,
  FACIAL_STYLES,
  GLASSES_STYLES,
  HAIR_COLORS,
  HAIR_STYLES,
  HAT_STYLES,
  JERSEY_STYLES,
  MOUTH_STYLES,
  PANTS_COLORS,
  SHOE_COLORS,
  SKIN_TONES,
} from '../data/cosmetics';
import { CORE_STATS, GENRE_WEIGHTS, getGame, type GameDef } from '../data/games';
import { GEAR_COST_GROWTH, GEAR_MAX_TIER, GEAR_SLOTS, emptyGear, type GearSlot } from '../data/gear';
import { FAN_BASE, FAN_GROWTH } from '../data/leagues';
import { FIRST_NAMES, LAST_NAMES, NATIONS, TAG_SUFFIXES, TAG_WORDS } from '../data/names';
import { TRAITS, TRAIT_MAP, type TraitDef } from '../data/traits';
import { Rng } from './rng';
import type { Appearance, GameState, Mods, Player, PlayerStats, Rarity, StatKey } from './types';

export const ALL_STATS: StatKey[] = ['mechanics', 'gameSense', 'teamwork', 'composure', 'charisma', 'stamina'];

export const STAT_LABEL: Record<StatKey, string> = {
  mechanics: 'Mechanics',
  gameSense: 'Game Sense',
  teamwork: 'Teamwork',
  composure: 'Composure',
  charisma: 'Charisma',
  stamina: 'Stamina',
};

export interface RarityDef {
  id: Rarity;
  name: string;
  color: string;
  statMin: number;
  statMax: number;
  potMin: number;
  potMax: number;
  cut: number;
  fee: number;
  weight: number;
  traitMin: number;
  traitMax: number;
}

export const RARITIES: RarityDef[] = [
  { id: 'rookie', name: 'Rookie', color: RARITY_COLORS[0], statMin: 14, statMax: 32, potMin: 45, potMax: 62, cut: 0.05, fee: 40, weight: 42, traitMin: 1, traitMax: 1 },
  { id: 'talent', name: 'Talent', color: RARITY_COLORS[1], statMin: 22, statMax: 40, potMin: 55, potMax: 72, cut: 0.07, fee: 250, weight: 30, traitMin: 1, traitMax: 2 },
  { id: 'pro', name: 'Pro', color: RARITY_COLORS[2], statMin: 32, statMax: 50, potMin: 65, potMax: 82, cut: 0.1, fee: 1_800, weight: 16, traitMin: 1, traitMax: 2 },
  { id: 'star', name: 'Star', color: RARITY_COLORS[3], statMin: 42, statMax: 60, potMin: 75, potMax: 92, cut: 0.13, fee: 14_000, weight: 8, traitMin: 2, traitMax: 2 },
  { id: 'superstar', name: 'Superstar', color: RARITY_COLORS[4], statMin: 52, statMax: 70, potMin: 85, potMax: 100, cut: 0.16, fee: 120_000, weight: 3.5, traitMin: 2, traitMax: 3 },
  { id: 'legend', name: 'Legend', color: RARITY_COLORS[5], statMin: 62, statMax: 80, potMin: 95, potMax: 110, cut: 0.2, fee: 1_200_000, weight: 0.5, traitMin: 2, traitMax: 3 },
];

export const RARITY_MAP: Map<Rarity, RarityDef> = new Map(RARITIES.map((r) => [r.id, r]));

const TRAIT_CONFLICTS: [string, string][] = [
  ['big_stage', 'choker'],
  ['chill', 'tilt'],
  ['chill', 'hot_head'],
  ['team_player', 'solo_queue'],
  ['diva', 'cheap'],
  ['lazy_genius', 'grinder'],
  ['lazy_genius', 'tryhard'],
  ['energy_addict', 'iron_man'],
];

export const MAX_LEVEL = 100;
export const STAND_IN_RATING = 5;

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

export function rollRarity(rng: Rng, luck = 0): Rarity {
  const def = rng.weighted(RARITIES, (r, ) => (r.id === 'rookie' ? r.weight * Math.max(0.2, 1 - luck) : r.weight * (1 + luck * 2)));
  return def?.id ?? 'rookie';
}

export function randomTag(rng: Rng): string {
  let tag = rng.pick(TAG_WORDS);
  if (rng.chance(0.25)) tag = `${tag}${rng.pick(TAG_WORDS)}`.slice(0, 14);
  tag += rng.pick(TAG_SUFFIXES);
  if (rng.chance(0.18)) {
    tag = tag.replace(/[oeia]/g, (c) => (rng.chance(0.6) ? ({ o: '0', e: '3', i: '1', a: '4' } as Record<string, string>)[c] : c));
  }
  if (rng.chance(0.03)) tag = `xX${tag}Xx`;
  return tag;
}

export function randomLook(rng: Rng): Appearance {
  return {
    body: rng.int(0, BODY_TYPES.length - 1),
    skin: rng.int(0, SKIN_TONES.length - 1),
    hair: rng.int(0, HAIR_STYLES.length - 1),
    hairColor: rng.chance(0.75) ? rng.int(0, 6) : rng.int(0, HAIR_COLORS.length - 1),
    eyes: rng.int(0, EYE_STYLES.length - 1),
    brows: rng.int(0, BROW_STYLES.length - 2),
    mouth: rng.int(0, MOUTH_STYLES.length - 1),
    facial: rng.chance(0.65) ? 0 : rng.int(1, FACIAL_STYLES.length - 1),
    glasses: rng.chance(0.7) ? 0 : rng.int(1, GLASSES_STYLES.length - 1),
    hat: rng.chance(0.75) ? 0 : rng.int(1, HAT_STYLES.length - 1),
    jersey: rng.int(0, JERSEY_STYLES.length - 1),
    pants: rng.int(0, PANTS_COLORS.length - 1),
    shoeColor: rng.int(0, SHOE_COLORS.length - 1),
    accessory: rng.chance(0.7) ? 0 : rng.int(1, ACCESSORIES.length - 1),
  };
}

function rollTraits(rng: Rng, count: number): string[] {
  const chosen: string[] = [];
  let guard = 0;
  while (chosen.length < count && guard++ < 50) {
    const t = rng.weighted(TRAITS, (x) => x.weight);
    if (!t || chosen.includes(t.id)) continue;
    const conflict = TRAIT_CONFLICTS.some(([a, b]) => (a === t.id && chosen.includes(b)) || (b === t.id && chosen.includes(a)));
    if (conflict) continue;
    chosen.push(t.id);
  }
  return chosen;
}

export interface GenerateOptions {
  id: string;
  gameId: string;
  time: number;
  rarity?: Rarity;
  luck?: number;
}

export function generatePlayer(rng: Rng, opts: GenerateOptions): Player {
  const game = getGame(opts.gameId);
  const rarity = RARITY_MAP.get(opts.rarity ?? rollRarity(rng, opts.luck ?? 0))!;
  const weights = GENRE_WEIGHTS[game.genre];
  const stats = {} as PlayerStats;
  for (const stat of ['mechanics', 'gameSense', 'teamwork', 'composure', 'charisma', 'stamina'] as StatKey[]) {
    let value = rng.range(rarity.statMin, rarity.statMax);
    const w = (weights as Record<string, number>)[stat] ?? 0;
    if (w >= 0.3) value += rng.range(0, 6);
    stats[stat] = Math.round(value);
  }
  const traits = rollTraits(rng, rng.int(rarity.traitMin, rarity.traitMax));
  let potential = Math.round(rng.range(rarity.potMin, rarity.potMax));
  let cut = rarity.cut;
  for (const id of traits) {
    const t = TRAIT_MAP.get(id);
    if (t?.potentialAdd) potential += t.potentialAdd;
    if (t?.cutAdd) cut += t.cutAdd;
  }
  return {
    id: opts.id,
    first: rng.pick(FIRST_NAMES),
    last: rng.pick(LAST_NAMES),
    tag: randomTag(rng),
    nation: rng.pick(NATIONS).code,
    age: rng.int(16, 29),
    gameId: game.id,
    role: rng.int(0, game.roles.length - 1),
    rarity: rarity.id,
    stats,
    potential: Math.max(potential, Math.max(...Object.values(stats))),
    traits,
    level: 1,
    xp: 0,
    morale: 70,
    energy: 100,
    status: { kind: 'healthy', until: 0, reason: '' },
    gear: emptyGear(),
    look: randomLook(rng),
    cut: Math.max(0.02, Math.min(0.35, cut)),
    fee: 0,
    jersey: rng.int(1, 99),
    signedAt: opts.time,
    matches: 0,
    wins: 0,
    founder: false,
    seasons: 0,
    retiring: false,
    signedLevel: 1,
    milestones: [],
  };
}

export function createFounder(rng: Rng, orgName: string): Player {
  const look = randomLook(rng);
  return {
    id: 'founder',
    first: 'The',
    last: 'Founder',
    tag: orgName.split(/\s+/)[0]?.slice(0, 12) || 'Founder',
    nation: 'GB',
    age: 19,
    gameId: 'smash',
    role: 0,
    rarity: 'talent',
    stats: { mechanics: 28, gameSense: 26, teamwork: 24, composure: 27, charisma: 35, stamina: 40 },
    potential: 68,
    traits: ['grinder'],
    level: 1,
    xp: 0,
    morale: 75,
    energy: 100,
    status: { kind: 'healthy', until: 0, reason: '' },
    gear: emptyGear(),
    look,
    cut: 0,
    fee: 0,
    jersey: 1,
    signedAt: 0,
    matches: 0,
    wins: 0,
    founder: true,
    seasons: 0,
    retiring: false,
    signedLevel: 1,
    milestones: [],
  };
}

// ---------------------------------------------------------------------------
// Ratings
// ---------------------------------------------------------------------------

export function traitsOf(p: Player): TraitDef[] {
  const out: TraitDef[] = [];
  for (const id of p.traits) {
    const t = TRAIT_MAP.get(id);
    if (t) out.push(t);
  }
  return out;
}

export function baseStat(p: Player, stat: StatKey): number {
  let v = p.stats[stat];
  for (const t of traitsOf(p)) v += t.statAdd?.[stat] ?? 0;
  return Math.max(1, v);
}

export function gearTraitMult(p: Player, slot: GearSlot): number {
  let m = 1;
  for (const t of traitsOf(p)) m *= t.gearMult?.[slot] ?? 1;
  return m;
}

/** Multiplier applied to a stat by all equipped gear. */
export function gearStatMult(p: Player, stat: StatKey): number {
  let m = 1;
  for (const slot of GEAR_SLOTS) {
    const tier = p.gear[slot.id] ?? 0;
    if (tier > 0 && slot.stats.includes(stat)) m *= Math.pow(slot.growth, tier * gearTraitMult(p, slot.id));
  }
  return m;
}

export function effectiveStat(p: Player, stat: StatKey): number {
  return baseStat(p, stat) * gearStatMult(p, stat);
}

export function conditionMult(p: Player): number {
  return (0.85 + 0.3 * (p.morale / 100)) * (0.7 + 0.3 * (p.energy / 100));
}

export function isAvailable(p: Player, time: number): boolean {
  return p.status.kind === 'healthy' || p.status.until <= time;
}

/** Rating before morale/energy, used for comparisons and display. */
export function skillRating(p: Player, game: GameDef = getGame(p.gameId)): number {
  const weights = GENRE_WEIGHTS[game.genre];
  let log = 0;
  for (const stat of CORE_STATS) {
    const w = weights[stat];
    if (w > 0) log += w * Math.log(effectiveStat(p, stat));
  }
  let rating = Math.exp(log);
  for (const t of traitsOf(p)) if (t.ratingMult) rating *= t.ratingMult;
  return rating;
}

export function playerRating(p: Player, game: GameDef, tier: number, slot: number | null): number {
  let rating = skillRating(p, game) * conditionMult(p);
  for (const t of traitsOf(p)) if (t.bigStage && tier >= t.bigStage.minTier) rating *= t.bigStage.mult;
  if (slot !== null && game.teamSize > 1 && slot !== p.role) rating *= 0.85;
  return rating;
}

export function playerFansMult(p: Player): number {
  let m = 1;
  for (const t of traitsOf(p)) m *= t.fansMult ?? 1;
  return m;
}

export function playerXpMult(p: Player): number {
  let m = 1;
  for (const t of traitsOf(p)) m *= t.xpMult ?? 1;
  return m;
}

export function moraleBase(p: Player, mods?: Pick<Mods, 'moraleBaseAdd'>): number {
  let base = 65 + (mods?.moraleBaseAdd ?? 0);
  for (const t of traitsOf(p)) base += t.moraleBase ?? 0;
  return Math.max(10, Math.min(95, base));
}

export function moraleSwing(p: Player, mods?: Pick<Mods, 'moraleSwingMult'>): number {
  let m = mods?.moraleSwingMult ?? 1;
  for (const t of traitsOf(p)) m *= t.moraleSwingMult ?? 1;
  return m;
}

export function energyDrainMult(p: Player): number {
  let m = 1;
  for (const t of traitsOf(p)) m *= t.energyDrainMult ?? 1;
  return m;
}

export function applyMorale(p: Player, delta: number, mods?: Pick<Mods, 'moraleSwingMult'>): void {
  p.morale = Math.max(0, Math.min(100, p.morale + delta * moraleSwing(p, mods)));
}

export function drainEnergy(p: Player, mods?: Pick<Mods, 'energyDrainMult'>, factor = 1): void {
  const stamina = effectiveStat(p, 'stamina');
  const drain = 5 * Math.max(0.35, 1.3 - stamina / 200) * energyDrainMult(p) * (mods?.energyDrainMult ?? 1) * factor;
  p.energy = Math.max(0, p.energy - drain);
}

/** Passive fans per second from a player's charisma, scaled by their team's tier. */
export function passiveFans(p: Player, tier: number): number {
  const charisma = effectiveStat(p, 'charisma');
  // Mirrors the per-win fan curve, so passive fans can never outgrow the fans matches pay out.
  return ((charisma / 50) * FAN_BASE * Math.pow(FAN_GROWTH, tier) * playerFansMult(p)) / 30;
}

// ---------------------------------------------------------------------------
// Progression
// ---------------------------------------------------------------------------

export function xpToNext(level: number): number {
  return Math.round(40 * Math.pow(1.18, level - 1));
}

export function grantXp(p: Player, amount: number, rng: Rng): number {
  if (p.level >= MAX_LEVEL) return 0;
  p.xp += amount;
  let gained = 0;
  while (p.level < MAX_LEVEL && p.xp >= xpToNext(p.level)) {
    p.xp -= xpToNext(p.level);
    p.level++;
    gained++;
    levelUpStats(p, rng);
  }
  return gained;
}

export function levelUpStats(p: Player, rng: Rng): void {
  const weights = GENRE_WEIGHTS[getGame(p.gameId).genre] as Record<string, number>;
  for (let i = 0; i < 3; i++) {
    const growable = ALL_STATS.filter((st) => p.stats[st] < p.potential);
    if (growable.length === 0) return;
    const stat = rng.weighted(growable, (st) => (weights[st] ?? 0) + 0.15) ?? growable[0];
    p.stats[stat] = Math.min(p.potential, p.stats[stat] + 1);
  }
}

// ---------------------------------------------------------------------------
// Gear
// ---------------------------------------------------------------------------

export function gearUpgradeCost(p: Player, slot: GearSlot, mods: Pick<Mods, 'gearCostMult'>): number {
  const def = GEAR_SLOTS.find((g) => g.id === slot)!;
  const tier = p.gear[slot] ?? 0;
  if (tier >= GEAR_MAX_TIER) return Infinity;
  return Math.ceil(def.baseCost * Math.pow(GEAR_COST_GROWTH, tier) * getGame(p.gameId).costScale * mods.gearCostMult);
}

export function buyGear(s: GameState, playerId: string, slot: GearSlot, mods: Pick<Mods, 'gearCostMult'>): boolean {
  const p = s.players[playerId];
  // Potato League challenge: no gear upgrades.
  if (!p || s.prestige.challenge === 'potato') return false;
  const cost = gearUpgradeCost(p, slot, mods);
  if (!Number.isFinite(cost) || s.cash < cost) return false;
  s.cash -= cost;
  p.gear[slot]++;
  s.stats.gearBought++;
  return true;
}

export function playerDisplayName(p: Player): string {
  return p.founder ? `${p.tag} (Founder)` : `${p.first} “${p.tag}” ${p.last}`;
}

export function sellValue(p: Player): number {
  if (p.founder) return 0;
  return Math.floor(p.fee * 0.3 * (1 + (p.level - 1) / 20));
}

/** Seconds of a player's share of their team's income that each level gained with the org adds. */
export const DEVELOPMENT_VALUE_SECONDS = 40;

/** Young players carry a premium; veterans and announced retirees sell for less. */
export function ageValueFactor(p: Player): number {
  if (p.retiring) return 0.35;
  if (p.age <= 23) return 1.25;
  if (p.age <= 27) return 1;
  if (p.age <= 30) return 0.7;
  return 0.5;
}

/**
 * What a rival org pays. Raw talent is priced from the signing fee; every level gained on this org's
 * books adds a slice of the income the player brings in, so developing players and selling at their
 * peak pays. A player signed and sold straight away earns no development credit, so flipping players
 * for profit does not work.
 */
export function transferValue(p: Player, teamCps: number, teamSize: number): number {
  if (p.founder) return 0;
  const levels = Math.max(0, p.level - p.signedLevel);
  const share = Math.max(0, teamCps) / Math.max(1, teamSize);
  return Math.floor((sellValue(p) + share * DEVELOPMENT_VALUE_SECONDS * levels) * ageValueFactor(p));
}
