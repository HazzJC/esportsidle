import { OP_MAP } from '../data/operations';
import { STAFF_MAP } from '../data/staff';
import { fmt } from './format';
import type { Effect } from './types';

function opName(id: string, plural = true): string {
  const op = OP_MAP.get(id);
  if (!op) return id;
  return plural ? op.plural : op.name;
}

function pct(value: number): string {
  const p = value * 100;
  return `${Number.isInteger(p) ? p : parseFloat(p.toFixed(2))}%`;
}

/** Human readable description of a permanent effect. */
export function describeEffect(e: Effect): string {
  switch (e.kind) {
    case 'opMult':
      return e.mult === 2 ? `${opName(e.op)} are twice as efficient.` : `${opName(e.op)} produce ×${fmt(e.mult, 2)}.`;
    case 'opPerOwned': {
      if (e.pct < 0.01) {
        const per = Math.round(0.01 / e.pct);
        if (Math.abs(per * e.pct - 0.01) < 1e-9 && per > 1) {
          return `${opName(e.op)} gain +1% production per ${per} ${opName(e.source)}.`;
        }
      }
      return `${opName(e.op)} gain +${pct(e.pct)} production per ${opName(e.source, false)}.`;
    }
    case 'grindDouble':
      return 'Ranked Grinders and clicking are twice as efficient.';
    case 'grindAdd':
      return `Ranked Grinders and clicks gain +${fmt(e.add, 1)} cash for each non-grinder operation owned.`;
    case 'grindAddMult':
      return `Multiplies the Thousand-Game Grind bonus by ${e.mult}.`;
    case 'clickMult':
      return `Clicking is ×${fmt(e.mult, 2)} as powerful.`;
    case 'clickCpsPct':
      return `Clicking gains +${pct(e.pct)} of your income per second.`;
    case 'globalPct':
      return `Income +${pct(e.pct)}.`;
    case 'fameExp':
      return `Fans boost income more (fame power +${e.add}).`;
    case 'superfan':
      return `Income boosted by ${pct(e.factor)} of your Trophy Cabinet.`;
    case 'fansMult':
      return `Fan gain ×${fmt(e.mult, 2)}.`;
    case 'hypeGain':
      return `Hype meter fills ${pct(e.mult - 1)} faster.`;
    case 'hypeDuration':
      return `Crowd Goes Wild lasts ${pct(e.mult - 1)} longer.`;
    case 'opCostMult':
      return `Operations are ${pct(1 - e.mult)} cheaper.`;
    case 'upgradeCostMult':
      return `Upgrades are ${pct(1 - e.mult)} cheaper.`;
    case 'offlineRate':
      return `Earn +${pct(e.add)} more while offline.`;
    case 'offlineCap':
      return `Offline earnings accumulate for ${e.hours} more hours.`;
    case 'prizeMult':
      return `Match prize money ×${fmt(e.mult, 2)}.`;
    case 'benchSlots':
      return `+${e.add} bench slot${e.add === 1 ? '' : 's'} on every team.`;
    case 'xpMult':
      return `Players gain ${pct(e.mult - 1)} more XP.`;
    case 'matchSpeed':
      return `Matches are played ${pct(e.mult - 1)} faster.`;
    case 'teamRating':
      return `All team ratings ×${fmt(e.mult, 2)}.`;
    case 'scoutLuck':
      return `Scouts find rare talent more often (+${pct(e.add)} luck).`;
    case 'marketSize':
      return `+${e.add} transfer market listing${e.add === 1 ? '' : 's'}.`;
    case 'playerFans':
      return `Players attract ${pct(e.mult - 1)} more fans.`;
    case 'gearCostMult':
      return `Gear is ${pct(1 - e.mult)} cheaper.`;
    case 'staffMult': {
      const plural = STAFF_MAP.get(e.staff)?.plural ?? e.staff;
      return e.mult === 2 ? `${plural} are twice as effective.` : `${plural} are ×${fmt(e.mult, 2)} as effective.`;
    }
    case 'staffCostMult':
      return `Hiring staff is ${pct(1 - e.mult)} cheaper.`;
    case 'dropInterval':
      return e.mult === 0.5 ? 'Hype Drops appear twice as often.' : `Hype Drops appear ${pct(1 / e.mult - 1)} more often.`;
    case 'dropLife':
      return e.mult === 2 ? 'Hype Drops stay on screen twice as long.' : `Hype Drops stay on screen ${pct(e.mult - 1)} longer.`;
    case 'buffDuration':
      return e.mult === 2 ? 'Drop and tournament buffs last twice as long.' : `Drop and tournament buffs last ${pct(e.mult - 1)} longer.`;
    case 'tournamentReward':
      return `Tournament prize money ×${fmt(e.mult, 2)}.`;
    case 'tournamentEase':
      return `Tournament opponents are ${pct(1 - e.mult)} weaker.`;
    case 'tournamentWeight':
      return e.mult === 2 ? 'Tournament Invites turn up twice as often.' : `Tournament Invites turn up ${pct(e.mult - 1)} more often.`;
    case 'dramaLevel':
      return `Drama +${e.add}: more Hype Drops become risky Drama Drops.`;
    case 'dramaShare':
      return `Drama Drops are ${pct(1 - e.mult)} less common.`;
    case 'sponsorSlots':
      return `+${e.add} sponsor slot${e.add === 1 ? '' : 's'}.`;
    case 'sponsorIncome':
      return `Sponsor income bonuses ×${fmt(e.mult, 2)}.`;
    case 'merchMult':
      return `Merch sales ×${fmt(e.mult, 2)}.`;
    case 'legacyLevelPct':
      return `Each legacy level gives +${pct(e.add)} more income.`;
    case 'noveltyMult':
      return e.mult === 2 ? 'Merch designs stay fresh twice as long.' : `Merch designs stay fresh ${pct(e.mult - 1)} longer.`;
  }
}
