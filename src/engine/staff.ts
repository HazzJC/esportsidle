import { DECOR, DECOR_MAP, ROOMS } from '../data/decor';
import { STAFF, STAFF_EXPONENT, STAFF_MAP, type StaffDef, type StaffStat } from '../data/staff';
import { geometricMax, geometricPrice } from './pricing';
import type { GameState, Mods } from './types';

/** Applies a staff/decor stat bonus of the given strength to the modifier set. */
export function applyStat(m: Mods, stat: StaffStat, amount: number): void {
  if (!(amount > 0)) return;
  switch (stat) {
    case 'teamRating':
      m.teamRatingMult *= 1 + amount;
      break;
    case 'opponent':
      m.opponentMult /= 1 + amount;
      break;
    case 'xp':
      m.xpMult *= 1 + amount;
      break;
    case 'energyRecovery':
      m.energyRecoveryMult *= 1 + amount;
      break;
    case 'sickness':
      m.sickMult /= 1 + amount;
      break;
    case 'injury':
      m.injuryMult /= 1 + amount;
      break;
    case 'burnout':
      m.burnoutMult /= 1 + amount;
      break;
    case 'recovery':
      m.recoveryMult /= 1 + amount;
      break;
    case 'morale':
      m.moraleBaseAdd += amount;
      break;
    case 'moraleSwing':
      m.moraleSwingMult /= 1 + amount;
      break;
    case 'energyDrain':
      m.energyDrainMult /= 1 + amount;
      break;
    case 'scoutLuck':
      m.scoutLuck += amount;
      break;
    case 'fans':
      m.fansMult *= 1 + amount;
      break;
    case 'playerFans':
      m.playerFansMult *= 1 + amount;
      break;
    case 'matchSpeed':
      m.matchSpeed *= 1 + amount;
      break;
    case 'merch':
      m.merchMult *= 1 + amount;
      break;
    case 'sponsor':
      m.sponsorIncomeMult *= 1 + amount;
      break;
  }
}

/** Diminishing-returns strength multiplier for `hires` of a staff type. */
export function staffPower(hires: number, mult = 1): number {
  return hires > 0 ? Math.pow(hires, STAFF_EXPONENT) * mult : 0;
}

export function applyStaffAndDecor(m: Mods, s: GameState): void {
  for (const def of STAFF) {
    const power = staffPower(s.staff[def.id] ?? 0, m.staffMult[def.id] ?? 1);
    if (power <= 0) continue;
    for (const e of def.effects) applyStat(m, e.stat, e.amount * power);
  }
  for (const def of DECOR) {
    if (!s.decor[def.id]) continue;
    for (const e of def.effects) applyStat(m, e.stat, e.amount);
  }
}

export function isStaffUnlocked(s: GameState, def: StaffDef): boolean {
  return (s.staff[def.id] ?? 0) > 0 || def.unlock(s);
}

export function staffPrice(def: StaffDef, owned: number, amount: number, costMult = 1): number {
  return geometricPrice(def.baseCost, owned, amount, costMult);
}

export function maxStaffAffordable(def: StaffDef, owned: number, cash: number, costMult = 1): number {
  return geometricMax(def.baseCost, owned, cash, costMult);
}

/** Hires staff. `amount` of -1 hires as many as affordable. Returns the number hired. */
export function hireStaff(s: GameState, id: string, amount: number, costMult = 1): number {
  const def = STAFF_MAP.get(id);
  if (!def || !isStaffUnlocked(s, def)) return 0;
  const owned = s.staff[id] ?? 0;
  const n = amount < 0 ? maxStaffAffordable(def, owned, s.cash, costMult) : Math.floor(amount);
  if (n <= 0) return 0;
  const price = staffPrice(def, owned, n, costMult);
  if (price > s.cash) return 0;
  s.cash -= price;
  s.staff[id] = owned + n;
  s.stats.staffHired += n;
  return n;
}

export function totalStaff(s: GameState): number {
  let n = 0;
  for (const def of STAFF) n += s.staff[def.id] ?? 0;
  return n;
}

export function roomLevel(s: GameState): number {
  let level = 0;
  ROOMS.forEach((room, i) => {
    if (s.earnedRun >= room.threshold) level = i;
  });
  return level;
}

export function buyDecor(s: GameState, id: string): boolean {
  const def = DECOR_MAP.get(id);
  if (!def || s.decor[id] || roomLevel(s) < def.room || s.cash < def.cost) return false;
  s.cash -= def.cost;
  s.decor[id] = true;
  s.stats.decorBought++;
  return true;
}
