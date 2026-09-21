import { emit } from './bus';
import { fmtTime } from './format';
import { applyMorale, isAvailable, traitsOf } from './players';
import { hasTheOnlyCook } from './easterEggs';
import type { Rng } from './rng';
import type { GameState, HealthKind, Mods, Player } from './types';

export const BASE_SICK_CHANCE = 0.004;
export const BASE_INJURY_CHANCE = 0.0025;
export const BASE_BURNOUT_CHANCE = 0.03;
export const BURNOUT_MORALE = 20;
/** Players resting on the bench shake off illness, injury and burnout this many times faster. */
export const BENCH_RECOVERY_MULT = 2;

const REASONS: Record<Exclude<HealthKind, 'healthy'>, string[]> = {
  sick: ['Flu', 'Food poisoning', 'A nasty cold', 'Stomach bug', 'Migraine', 'Suspicious petrol-station sushi'],
  injured: ['Wrist strain', 'Sore back', 'Sprained ankle (tripped over a cable)', 'Mouse elbow', 'Stiff neck'],
  burnout: ['Burnout', 'Needs a mental health break', 'Tilted beyond repair'],
};

const DURATION: Record<Exclude<HealthKind, 'healthy'>, [number, number]> = {
  sick: [120, 480],
  injured: [300, 900],
  burnout: [240, 600],
};

export const HEALTH_ICON: Record<HealthKind, string> = {
  healthy: 'heart-pulse',
  sick: 'thermometer',
  injured: 'bandage',
  burnout: 'brain-circuit',
};

function traitMult(p: Player, key: 'sickMult' | 'injuryMult'): number {
  let m = 1;
  for (const t of traitsOf(p)) m *= t[key] ?? 1;
  return m;
}

export interface HealthChances {
  sick: number;
  injured: number;
  burnout: number;
}

/** Per-match chances of each health problem for a starter. `risk` is the season plan's injury risk. */
export function healthChances(p: Player, mods: Pick<Mods, 'sickMult' | 'injuryMult' | 'burnoutMult'>, risk = 1): HealthChances {
  const fatigue = 1 + (100 - p.energy) / 100;
  return {
    sick: BASE_SICK_CHANCE * traitMult(p, 'sickMult') * mods.sickMult * fatigue,
    injured: (BASE_INJURY_CHANCE * traitMult(p, 'injuryMult') * mods.injuryMult * risk) / (1 + 0.1 * (p.gear.chair ?? 0)),
    burnout: p.morale < BURNOUT_MORALE ? BASE_BURNOUT_CHANCE * mods.burnoutMult : 0,
  };
}

/** Rolls for illness, injury or burnout after a match. Returns the new problem, if any. */
export function rollHealth(s: GameState, p: Player, mods: Mods, rng: Rng, hasBench: boolean, risk = 1): HealthKind | null {
  if (!isAvailable(p, s.time)) return null;
  const c = healthChances(p, mods, risk);
  if (hasTheOnlyCook(s) && (s.staff.chef ?? 0) >= 1) {
    c.sick = 0;
  }
  const roll = rng.next();
  let kind: Exclude<HealthKind, 'healthy'> | null = null;
  if (roll < c.sick) kind = 'sick';
  else if (roll < c.sick + c.injured) kind = 'injured';
  else if (roll < c.sick + c.injured + c.burnout) kind = 'burnout';
  if (!kind) return null;
  inflict(s, p, kind, rng.pick(REASONS[kind]), rng.range(...DURATION[kind]) * mods.recoveryMult, mods, hasBench);
  return kind;
}

export function inflict(
  s: GameState,
  p: Player,
  kind: Exclude<HealthKind, 'healthy'>,
  reason: string,
  duration: number,
  mods: Pick<Mods, 'moraleSwingMult'>,
  hasBench: boolean,
): void {
  p.status = { kind, until: s.time + duration, reason };
  applyMorale(p, -8, mods);
  if (kind === 'sick') s.stats.illnesses++;
  else if (kind === 'injured') s.stats.injuries++;
  else s.stats.burnouts++;
  emit({
    type: 'toast',
    title: `${p.tag}: ${reason}`,
    body: `Out for ${fmtTime(duration)}. ${hasBench ? 'A substitute will step in.' : 'A stand-in will play badly until they recover.'} Benched players recover twice as fast.`,
    icon: HEALTH_ICON[kind],
    tone: 'bad',
    channel: 'players',
  });
}

export function unavailableCount(s: GameState): number {
  let n = 0;
  for (const p of Object.values(s.players)) if (!isAvailable(p, s.time)) n++;
  return n;
}
