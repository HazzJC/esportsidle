import { DECOR, DECOR_MAP, ROOMS } from '../data/decor';
import { STAFF, STAFF_EXPONENT, STAFF_MAP, STAFF_SOFT_EXPONENT, effectAmount, type QolId, type StaffDef, type StaffStat } from '../data/staff';
import { geometricMax, geometricPrice } from './pricing';
import { sectionOpen } from './sections';
import { hasTheOnlyCook } from './easterEggs';
import type { GameState, Mods } from './types';
import { emit } from './bus';

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
    case 'freshness':
      m.noveltyMult *= 1 + amount;
      break;
    case 'trendLength':
      m.trendLengthMult *= 1 + amount;
      break;
    case 'sponsor':
      m.sponsorIncomeMult *= 1 + amount;
      break;
  }
}

/**
 * Diminishing-returns strength multiplier for `hires` of a staff type.
 *
 * Most staff follow hires^0.8. Coaches and analysts carry a soft cap: up to the tenth hire nothing
 * changes, and past it each hire is worth much less, so a wall of coaches stops being the answer to
 * every problem. The fiftieth coach is worth about half what it used to be.
 */
export function staffPower(hires: number, mult = 1, softCapFrom?: number, softExponent = STAFF_SOFT_EXPONENT): number {
  if (hires <= 0) return 0;
  if (softCapFrom === undefined || hires <= softCapFrom) return Math.pow(hires, STAFF_EXPONENT) * mult;
  const atCap = Math.pow(softCapFrom, STAFF_EXPONENT);
  return atCap * Math.pow(hires / softCapFrom, softExponent) * mult;
}

export function applyStaffAndDecor(m: Mods, s: GameState): void {
  for (const def of STAFF) {
    const power = staffPower(s.staff[def.id] ?? 0, m.staffMult[def.id] ?? 1, def.softCapFrom, def.softExponent);
    if (power <= 0) continue;
    for (const e of def.effects) applyStat(m, e.stat, effectAmount(e, power));
  }
  for (const def of DECOR) {
    if (!s.decor[def.id]) continue;
    for (const e of def.effects) applyStat(m, e.stat, e.amount);
  }
}

/** Whether the org has the tool a staff role brings: someone in that role has been hired this run. */
export function hasQol(s: GameState, id: QolId): boolean {
  return STAFF.some((d) => d.qol?.id === id && (s.staff[d.id] ?? 0) > 0);
}

/** The staff role whose first hire brings a tool. */
export function qolSource(id: QolId): StaffDef | undefined {
  return STAFF.find((d) => d.qol?.id === id);
}

/** Bulk amounts the store and the Staff tab offer: 1 always, 10, 100 and Max once the staff who bring them are hired. */
export function bulkAmounts(s: GameState): number[] {
  const out = [1];
  if (hasQol(s, 'buy10')) out.push(10);
  if (hasQol(s, 'buy100')) out.push(100);
  if (hasQol(s, 'buyMax')) out.push(-1);
  return out;
}

/** The bulk amount to use: the saved choice if the org has it, otherwise one at a time. */
export function bulkAmount(s: GameState, wanted: number = s.settings.buyAmount): number {
  return bulkAmounts(s).includes(wanted) ? wanted : 1;
}

export function isStaffUnlocked(s: GameState, def: StaffDef): boolean {
  return (s.staff[def.id] ?? 0) > 0 || def.unlock(s);
}

export function staffPrice(def: StaffDef, owned: number, amount: number, costMult = 1): number {
  return geometricPrice(def.baseCost, owned, amount, costMult, def.costGrowth);
}

export function maxStaffAffordable(def: StaffDef, owned: number, cash: number, costMult = 1): number {
  return geometricMax(def.baseCost, owned, cash, costMult, def.costGrowth);
}

export function hireStaff(s: GameState, id: string, amount: number, costMult = 1): number {
  const def = STAFF_MAP.get(id);
  // Skeleton Crew challenge: no hiring.
  if (!def || !sectionOpen(s, 'staff') || !isStaffUnlocked(s, def) || s.prestige.challenge === 'nostaff') return 0;
  const owned = s.staff[id] ?? 0;
  if (id === 'chef' && hasTheOnlyCook(s) && owned >= 1) return 0;
  let n = amount < 0 ? maxStaffAffordable(def, owned, s.cash, costMult) : Math.floor(amount);
  if (id === 'chef' && hasTheOnlyCook(s)) n = Math.min(n, 1 - owned);
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

/**
 * Announces a move into a bigger house, once per house per run. Orgs from before this rule start from
 * the house they are in, so loading an old save never replays every move.
 */
export function checkHouseMove(s: GameState): void {
  const level = roomLevel(s);
  if (s.roomSeen === undefined || level < s.roomSeen) {
    s.roomSeen = level;
    return;
  }
  if (level <= s.roomSeen) return;
  s.roomSeen = level;
  emit({ type: 'house', level });
}

export function buyDecor(s: GameState, id: string): boolean {
  const def = DECOR_MAP.get(id);
  if (!def || !sectionOpen(s, 'house') || s.decor[id] || roomLevel(s) < def.room || s.cash < def.cost) return false;
  s.cash -= def.cost;
  s.decor[id] = true;
  s.stats.decorBought++;
  return true;
}
