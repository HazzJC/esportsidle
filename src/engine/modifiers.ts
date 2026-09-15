import type { EventModifier, GameState, Mods } from './types';

/** Timed modifiers created by world events (gear sales, championship seasons, meta shifts...). */
export function activeModifiers(s: GameState): EventModifier[] {
  return s.events.modifiers.filter((m) => m.endsAt > s.time);
}

export function applyEventModifiers(m: Mods, s: GameState): void {
  for (const mod of s.events.modifiers) {
    if (mod.endsAt <= s.time) continue;
    switch (mod.kind) {
      case 'gearCost':
        m.gearCostMult *= mod.mult;
        break;
      case 'gamePrize':
        if (mod.target) m.gamePrizeMult[mod.target] = (m.gamePrizeMult[mod.target] ?? 1) * mod.mult;
        break;
      case 'genreRating':
        if (mod.target) m.genreRatingMult[mod.target] = (m.genreRatingMult[mod.target] ?? 1) * mod.mult;
        break;
      case 'fans':
        m.fansMult *= mod.mult;
        break;
      case 'xp':
        m.xpMult *= mod.mult;
        break;
    }
  }
}

export type ModifierSpec = Omit<EventModifier, 'endsAt' | 'startedAt'> & { duration: number };

/** Adds a modifier, or extends one with the same id. */
export function addModifier(s: GameState, spec: ModifierSpec): EventModifier {
  const { duration, ...rest } = spec;
  const existing = s.events.modifiers.find((m) => m.id === spec.id);
  if (existing) {
    existing.endsAt = Math.max(existing.endsAt, s.time + duration);
    existing.mult = spec.mult;
    return existing;
  }
  const mod: EventModifier = { ...rest, startedAt: s.time, endsAt: s.time + duration };
  s.events.modifiers.push(mod);
  return mod;
}

export function expireModifiers(s: GameState): void {
  if (s.events.modifiers.some((m) => m.endsAt <= s.time)) {
    s.events.modifiers = s.events.modifiers.filter((m) => m.endsAt > s.time);
  }
}
