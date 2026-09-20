import { emit } from './bus';
import type { Buff, BuffEffect, GameState, Tone } from './types';

export interface BuffSpec {
  id: string;
  name: string;
  icon: string;
  tone: Tone;
  desc: string;
  duration: number;
  effects: BuffEffect[];
}

export interface BuffTotals {
  income: number;
  click: number;
  fans: number;
  merch: number;
  op: Record<string, number>;
}

/** Adds a buff, or extends an existing buff with the same id. */
export function addBuff(s: GameState, spec: BuffSpec): Buff {
  const existing = s.buffs.find((b) => b.id === spec.id);
  if (existing) {
    existing.endsAt = Math.max(existing.endsAt, s.time + spec.duration);
    existing.effects = spec.effects;
    existing.desc = spec.desc;
    return existing;
  }
  const buff: Buff = {
    id: spec.id,
    name: spec.name,
    icon: spec.icon,
    tone: spec.tone,
    desc: spec.desc,
    startedAt: s.time,
    endsAt: s.time + spec.duration,
    effects: spec.effects,
  };
  s.buffs.push(buff);
  emit({ type: 'buffStart', buff });
  return buff;
}

export function hasBuff(s: GameState, id: string): boolean {
  return s.buffs.some((b) => b.id === id && b.endsAt > s.time);
}

export function removeBuff(s: GameState, id: string): void {
  s.buffs = s.buffs.filter((b) => b.id !== id);
}

export function expireBuffs(s: GameState): Buff[] {
  if (s.buffs.length === 0) return [];
  const expired = s.buffs.filter((b) => b.endsAt <= s.time);
  if (expired.length > 0) {
    s.buffs = s.buffs.filter((b) => b.endsAt > s.time);
    for (const buff of expired) emit({ type: 'buffEnd', buff });
  }
  return expired;
}

export function buffTotals(s: GameState): BuffTotals {
  const totals: BuffTotals = { income: 1, click: 1, fans: 1, merch: 1, op: {} };
  for (const buff of s.buffs) {
    if (buff.endsAt <= s.time) continue;
    for (const e of buff.effects) {
      switch (e.kind) {
        case 'income':
          totals.income *= e.mult;
          break;
        case 'click':
          totals.click *= e.mult;
          break;
        case 'fans':
          totals.fans *= e.mult;
          break;
        case 'merch':
          totals.merch *= e.mult;
          break;
        case 'op':
          totals.op[e.op] = (totals.op[e.op] ?? 1) * e.mult;
          break;
      }
    }
  }
  return totals;
}
