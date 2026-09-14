import { OP_MAP } from '../data/operations';
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
  }
}
