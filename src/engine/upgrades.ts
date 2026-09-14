import { UPGRADES, UPGRADE_MAP, type UpgradeDef } from '../data/upgrades';
import { computeMods } from './economy';
import type { GameState, Mods } from './types';

export function upgradePrice(def: UpgradeDef, mods: Mods): number {
  return def.currency === 'cash' ? Math.ceil(def.cost * mods.upgradeCostMult) : def.cost;
}

export function isOwned(s: GameState, id: string): boolean {
  return s.upgrades[id] !== undefined;
}

/** Reveals upgrades whose unlock condition is met. Once revealed they stay in the store for the run. */
export function refreshUpgradeUnlocks(s: GameState): UpgradeDef[] {
  const fresh: UpgradeDef[] = [];
  for (const def of UPGRADES) {
    if (s.upgrades[def.id] !== undefined || s.unlockedUpgrades[def.id] !== undefined) continue;
    if (def.unlock(s)) {
      s.unlockedUpgrades[def.id] = s.time;
      fresh.push(def);
    }
  }
  return fresh;
}

/** Upgrades available to buy, cheapest first. */
export function storeUpgrades(s: GameState): UpgradeDef[] {
  const list: UpgradeDef[] = [];
  for (const def of UPGRADES) {
    if (s.unlockedUpgrades[def.id] !== undefined && s.upgrades[def.id] === undefined) list.push(def);
  }
  return list.sort((a, b) => (a.currency === b.currency ? a.cost - b.cost : a.currency === 'cash' ? -1 : 1));
}

export function canAffordUpgrade(s: GameState, def: UpgradeDef, mods: Mods): boolean {
  const price = upgradePrice(def, mods);
  return def.currency === 'cash' ? s.cash >= price : s.trophies >= price;
}

export function buyUpgrade(s: GameState, id: string): boolean {
  const def = UPGRADE_MAP.get(id);
  if (!def || s.upgrades[id] !== undefined || s.unlockedUpgrades[id] === undefined) return false;
  const mods = computeMods(s);
  if (!canAffordUpgrade(s, def, mods)) return false;
  const price = upgradePrice(def, mods);
  if (def.currency === 'cash') s.cash -= price;
  else s.trophies -= price;
  s.upgrades[id] = s.time;
  s.stats.upgradesBoughtTotal++;
  return true;
}

/** Buys every affordable upgrade, cheapest first. Returns how many were bought. */
export function buyAllUpgrades(s: GameState): number {
  let count = 0;
  for (const def of storeUpgrades(s)) {
    if (def.currency !== 'cash') continue;
    if (!buyUpgrade(s, def.id)) break;
    count++;
  }
  return count;
}
