import { ACHIEVEMENT_MAP } from '../data/achievements';
import { OPERATIONS } from '../data/operations';
import { UPGRADE_MAP } from '../data/upgrades';
import { buffTotals } from './buffs';
import type { Effect, GameState, Mods, Rates } from './types';

export const BASE_FAME_EXP = 0.08;
export const CABINET_PER_ACHIEVEMENT = 0.04;
export const BASE_OFFLINE_RATE = 0.2;
export const BASE_OFFLINE_CAP_HOURS = 12;

export function emptyMods(): Mods {
  return {
    opMult: {},
    opPerOwned: [],
    grindDoublings: 0,
    grindAdd: 0,
    grindAddMult: 1,
    clickMult: 1,
    clickCpsPct: 0,
    globalMult: 1,
    fameExp: BASE_FAME_EXP,
    superfanFactors: [],
    fansMult: 1,
    hypeGainMult: 1,
    hypeDurationMult: 1,
    opCostMult: 1,
    upgradeCostMult: 1,
    offlineRate: BASE_OFFLINE_RATE,
    offlineCapHours: BASE_OFFLINE_CAP_HOURS,
  };
}

export function applyEffect(m: Mods, e: Effect): void {
  switch (e.kind) {
    case 'opMult':
      m.opMult[e.op] = (m.opMult[e.op] ?? 1) * e.mult;
      break;
    case 'opPerOwned':
      m.opPerOwned.push({ op: e.op, source: e.source, pct: e.pct });
      break;
    case 'grindDouble':
      m.grindDoublings += 1;
      break;
    case 'grindAdd':
      m.grindAdd += e.add;
      break;
    case 'grindAddMult':
      m.grindAddMult *= e.mult;
      break;
    case 'clickMult':
      m.clickMult *= e.mult;
      break;
    case 'clickCpsPct':
      m.clickCpsPct += e.pct;
      break;
    case 'globalPct':
      m.globalMult *= 1 + e.pct;
      break;
    case 'fameExp':
      m.fameExp += e.add;
      break;
    case 'superfan':
      m.superfanFactors.push(e.factor);
      break;
    case 'fansMult':
      m.fansMult *= e.mult;
      break;
    case 'hypeGain':
      m.hypeGainMult *= e.mult;
      break;
    case 'hypeDuration':
      m.hypeDurationMult *= e.mult;
      break;
    case 'opCostMult':
      m.opCostMult *= e.mult;
      break;
    case 'upgradeCostMult':
      m.upgradeCostMult *= e.mult;
      break;
    case 'offlineRate':
      m.offlineRate = Math.min(1, m.offlineRate + e.add);
      break;
    case 'offlineCap':
      m.offlineCapHours += e.hours;
      break;
  }
}

export function computeMods(s: GameState): Mods {
  const m = emptyMods();
  for (const id in s.upgrades) {
    const def = UPGRADE_MAP.get(id);
    if (def) for (const e of def.effects) applyEffect(m, e);
  }
  return m;
}

/** Number of unlocked achievements that count towards the trophy cabinet. */
export function cabinetCount(s: GameState): number {
  let n = 0;
  for (const id in s.achievements) {
    const def = ACHIEVEMENT_MAP.get(id);
    if (def && !def.shadow) n++;
  }
  return n;
}

export function fameMultiplier(fans: number, exponent: number): number {
  return Math.pow(1 + Math.max(0, fans) / 100, exponent);
}

export function computeRates(s: GameState, mods: Mods = computeMods(s)): Rates {
  const buffs = buffTotals(s);

  let nonGrinder = 0;
  for (const op of OPERATIONS) if (op.id !== 'grinder') nonGrinder += s.ops[op.id].owned;
  const grindBonus = mods.grindAdd * mods.grindAddMult * nonGrinder;
  const doubling = Math.pow(2, mods.grindDoublings);

  const opUnit: Record<string, number> = {};
  const opCps: Record<string, number> = {};
  let base = 0;
  let fans = 0;

  for (const op of OPERATIONS) {
    const st = s.ops[op.id];
    let mult = (mods.opMult[op.id] ?? 1) * (1 + st.level * 0.01) * (buffs.op[op.id] ?? 1);
    for (const p of mods.opPerOwned) {
      if (p.op === op.id) mult *= 1 + p.pct * (s.ops[p.source]?.owned ?? 0);
    }
    const unit = op.id === 'grinder' ? (op.baseCps * doubling + grindBonus) * mult : op.baseCps * mult;
    opUnit[op.id] = unit;
    opCps[op.id] = unit * st.owned;
    base += unit * st.owned;
    fans += op.fansPerSec * st.owned;
  }

  const fameMult = fameMultiplier(s.fans, mods.fameExp);
  const cabinet = cabinetCount(s) * CABINET_PER_ACHIEVEMENT;
  let superfanMult = 1;
  for (const f of mods.superfanFactors) superfanMult *= 1 + cabinet * f;

  const globalMult = mods.globalMult * fameMult * superfanMult;
  const cpsNoBuffs = base * globalMult;
  const cps = cpsNoBuffs * buffs.income;

  const displayMult = globalMult * buffs.income;
  for (const op of OPERATIONS) {
    opUnit[op.id] *= displayMult;
    opCps[op.id] *= displayMult;
  }

  const clickBase = (1 * doubling + grindBonus) * mods.clickMult;
  const click = (clickBase + cps * mods.clickCpsPct) * buffs.click;

  return {
    cps,
    cpsNoBuffs,
    baseCps: base,
    opCps,
    opUnit,
    click,
    fansPerSec: fans * mods.fansMult * buffs.fans,
    globalMult,
    fameMult,
    superfanMult,
    buffIncomeMult: buffs.income,
    buffClickMult: buffs.click,
    cabinet,
  };
}

export function earnCash(s: GameState, amount: number): void {
  if (!(amount > 0)) return;
  s.cash += amount;
  s.earnedRun += amount;
  s.earnedTotal += amount;
}

export function gainFans(s: GameState, amount: number): void {
  if (!(amount > 0)) return;
  s.fans += amount;
  s.fansRun += amount;
  s.fansTotal += amount;
}
