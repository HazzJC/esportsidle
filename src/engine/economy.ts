import { ACHIEVEMENT_MAP } from '../data/achievements';
import { GAMES } from '../data/games';
import { OPERATIONS } from '../data/operations';
import { UPGRADE_MAP } from '../data/upgrades';
import { buffTotals } from './buffs';
import { evaluateMerch } from './merch';
import { applyEventModifiers } from './modifiers';
import { passiveFans } from './players';
import { sponsorBonuses } from './sponsors';
import { applyStat, applyStaffAndDecor } from './staff';
import { evaluateTeam, teamPlayerIds } from './teams';
import type { Effect, GameState, Mods, Rates, TeamEval } from './types';

export const BASE_FAME_EXP = 0.08;
export const CABINET_PER_ACHIEVEMENT = 0.04;
export const BASE_OFFLINE_RATE = 0.2;
export const BASE_OFFLINE_CAP_HOURS = 12;
export const BASE_BENCH_SLOTS = 1;
export const BASE_SPONSOR_SLOTS = 2;

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
    prizeMult: 1,
    benchSlots: BASE_BENCH_SLOTS,
    xpMult: 1,
    matchSpeed: 1,
    teamRatingMult: 1,
    scoutLuck: 0,
    marketSize: 0,
    playerFansMult: 1,
    gearCostMult: 1,
    opponentMult: 1,
    energyRecoveryMult: 1,
    energyDrainMult: 1,
    sickMult: 1,
    injuryMult: 1,
    burnoutMult: 1,
    recoveryMult: 1,
    moraleBaseAdd: 0,
    moraleSwingMult: 1,
    staffMult: {},
    staffCostMult: 1,
    dropIntervalMult: 1,
    dropLifeMult: 1,
    buffDurationMult: 1,
    tournamentRewardMult: 1,
    tournamentOpponentMult: 1,
    tournamentWeightMult: 1,
    dramaLevel: 0,
    dramaShareMult: 1,
    gamePrizeMult: {},
    genreRatingMult: {},
    sponsorSlots: BASE_SPONSOR_SLOTS,
    sponsorIncomeMult: 1,
    sponsorIncomePct: 0,
    merchMult: 1,
    noveltyMult: 1,
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
    case 'prizeMult':
      m.prizeMult *= e.mult;
      break;
    case 'benchSlots':
      m.benchSlots += e.add;
      break;
    case 'xpMult':
      m.xpMult *= e.mult;
      break;
    case 'matchSpeed':
      m.matchSpeed *= e.mult;
      break;
    case 'teamRating':
      m.teamRatingMult *= e.mult;
      break;
    case 'scoutLuck':
      m.scoutLuck += e.add;
      break;
    case 'marketSize':
      m.marketSize += e.add;
      break;
    case 'playerFans':
      m.playerFansMult *= e.mult;
      break;
    case 'gearCostMult':
      m.gearCostMult *= e.mult;
      break;
    case 'staffMult':
      m.staffMult[e.staff] = (m.staffMult[e.staff] ?? 1) * e.mult;
      break;
    case 'staffCostMult':
      m.staffCostMult *= e.mult;
      break;
    case 'dropInterval':
      m.dropIntervalMult *= e.mult;
      break;
    case 'dropLife':
      m.dropLifeMult *= e.mult;
      break;
    case 'buffDuration':
      m.buffDurationMult *= e.mult;
      break;
    case 'tournamentReward':
      m.tournamentRewardMult *= e.mult;
      break;
    case 'tournamentEase':
      m.tournamentOpponentMult *= e.mult;
      break;
    case 'tournamentWeight':
      m.tournamentWeightMult *= e.mult;
      break;
    case 'dramaLevel':
      m.dramaLevel += e.add;
      break;
    case 'dramaShare':
      m.dramaShareMult *= e.mult;
      break;
    case 'sponsorSlots':
      m.sponsorSlots += e.add;
      break;
    case 'sponsorIncome':
      m.sponsorIncomeMult *= e.mult;
      break;
    case 'merchMult':
      m.merchMult *= e.mult;
      break;
    case 'noveltyMult':
      m.noveltyMult *= e.mult;
      break;
  }
}

/** Upgrades first (they can boost staff), then staff and decor, event modifiers and finally sponsors. */
export function computeMods(s: GameState): Mods {
  const m = emptyMods();
  for (const id in s.upgrades) {
    const def = UPGRADE_MAP.get(id);
    if (def) for (const e of def.effects) applyEffect(m, e);
  }
  applyStaffAndDecor(m, s);
  applyEventModifiers(m, s);
  const sponsors = sponsorBonuses(s);
  for (const st of sponsors.stats) applyStat(m, st.stat, st.amount);
  for (const e of sponsors.effects) applyEffect(m, e);
  m.sponsorIncomePct = sponsors.incomePct * m.sponsorIncomeMult;
  m.globalMult *= 1 + m.sponsorIncomePct;
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
  let opsFans = 0;

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
    opsFans += op.fansPerSec * st.owned;
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

  const fansMult = mods.fansMult * buffs.fans;
  const teams: Record<string, TeamEval> = {};
  let matchCps = 0;
  let matchFans = 0;
  let playerFans = 0;
  for (const game of GAMES) {
    const team = s.teams[game.id];
    if (!team || !s.games[game.id]?.unlocked) continue;
    const ev = evaluateTeam(s, team, mods, { cpsNoBuffs, incomeBuff: buffs.income, fansMult });
    teams[game.id] = ev;
    matchCps += ev.cps;
    matchFans += ev.fansPerSec;
    for (const id of teamPlayerIds(team)) {
      const p = s.players[id];
      if (p) playerFans += passiveFans(p, team.tier);
    }
  }
  const opsFansPerSec = opsFans * fansMult;
  const playerFansPerSec = playerFans * mods.playerFansMult * fansMult;
  const merch = evaluateMerch(s, mods, cpsNoBuffs, buffs.income);

  return {
    cps,
    cpsNoBuffs,
    baseCps: base,
    opCps,
    opUnit,
    click,
    fansPerSec: opsFansPerSec + playerFansPerSec,
    opsFansPerSec,
    playerFansPerSec,
    globalMult,
    fameMult,
    superfanMult,
    buffIncomeMult: buffs.income,
    buffClickMult: buffs.click,
    cabinet,
    teams,
    matchCps,
    matchFansPerSec: matchFans,
    merchCps: merch.cps,
    merchLines: merch.lines,
    totalCps: cps + matchCps + merch.cps,
  };
}
