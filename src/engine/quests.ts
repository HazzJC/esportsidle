import { QUESTS, QUEST_MAP, type QuestDef, type QuestReward } from '../data/quests';
import { addBuff } from './buffs';
import { emit } from './bus';
import { fmt, fmtTime, money } from './format';
import { grantXp, xpToNext } from './players';
import type { Rng } from './rng';
import { tutorialActive } from './tutorial';
import type { ActiveQuest, GameState } from './types';
import { earnCash, gainFans, gainTrophies } from './wallet';

/** Quests on the board at once, so there is always a choice of what to chase next. */
export const QUEST_SLOTS = 2;

export interface QuestProgress {
  value: number;
  target: number;
  complete: boolean;
}

export function questProgress(s: GameState, q: ActiveQuest): QuestProgress {
  const def = QUEST_MAP.get(q.id);
  if (!def) return { value: 0, target: 1, complete: false };
  const raw = def.metric(s) - (def.mode === 'delta' ? q.base : 0);
  const value = Math.max(0, Math.min(def.target, raw));
  return { value, target: def.target, complete: raw >= def.target };
}

/** Puts the earliest available quests on any empty slots. Quests wait for the tutorial to finish. */
export function fillQuests(s: GameState): void {
  if (tutorialActive(s)) return;
  const q = s.quests;
  for (const def of QUESTS) {
    if (q.active.length >= QUEST_SLOTS) break;
    if (q.done[def.id] !== undefined || q.active.some((a) => a.id === def.id)) continue;
    if (def.available && !def.available(s)) continue;
    q.active.push({ id: def.id, base: def.metric(s), ready: false });
  }
}

/** Fills slots and announces quests that have just been finished. */
export function updateQuests(s: GameState): void {
  fillQuests(s);
  for (const q of s.quests.active) {
    if (q.ready || !questProgress(s, q).complete) continue;
    q.ready = true;
    const def = QUEST_MAP.get(q.id);
    emit({ type: 'toast', title: `Quest complete: ${def?.title ?? 'Quest'}`, body: 'Choose your reward in HQ.', icon: def?.icon ?? 'flag', tone: 'gold' });
  }
}

export interface RewardContext {
  /** Income per second without temporary buffs. */
  cps: number;
  fansPerSec: number;
}

/** Plain-language description of a reward at today's rates. */
export function describeReward(r: QuestReward, ctx: RewardContext): string {
  switch (r.kind) {
    case 'cash':
      return money(Math.max(r.min, ctx.cps * r.seconds));
    case 'fans':
      return `${fmt(Math.max(r.min, ctx.fansPerSec * r.seconds))} fans`;
    case 'trophies':
      return `${r.amount} ${r.amount === 1 ? 'trophy' : 'trophies'}`;
    case 'levels':
      return `Every player +${r.amount} level${r.amount === 1 ? '' : 's'}`;
    case 'legacy':
      return `${r.amount} legacy points`;
    case 'buff': {
      const what = r.effect.kind === 'click' ? 'Clicks' : r.effect.kind === 'fans' ? 'Fan gain' : 'Income';
      return `${what} ×${r.effect.mult} for ${fmtTime(r.seconds)}`;
    }
  }
}

function applyReward(s: GameState, r: QuestReward, ctx: RewardContext, rng: Rng): void {
  switch (r.kind) {
    case 'cash':
      earnCash(s, Math.max(r.min, ctx.cps * r.seconds));
      break;
    case 'fans':
      gainFans(s, Math.max(r.min, ctx.fansPerSec * r.seconds));
      break;
    case 'trophies':
      gainTrophies(s, r.amount);
      break;
    case 'levels':
      for (const p of Object.values(s.players)) {
        for (let i = 0; i < r.amount; i++) grantXp(p, Math.max(0, xpToNext(p.level) - p.xp), rng);
      }
      break;
    case 'legacy':
      s.prestige.points += r.amount;
      break;
    case 'buff':
      addBuff(s, { id: `quest-${r.effect.kind}`, name: r.name, icon: r.icon, tone: 'good', desc: describeReward(r, ctx), duration: r.seconds, effects: [r.effect] });
      break;
  }
}

/** Pays one of a finished quest's two rewards and brings in the next quest. */
export function claimQuest(s: GameState, id: string, choice: 0 | 1, ctx: RewardContext, rng: Rng): boolean {
  const index = s.quests.active.findIndex((q) => q.id === id);
  const def: QuestDef | undefined = QUEST_MAP.get(id);
  if (index < 0 || !def || !questProgress(s, s.quests.active[index]).complete) return false;
  applyReward(s, def.rewards[choice], ctx, rng);
  s.quests.active.splice(index, 1);
  s.quests.done[id] = s.time;
  s.quests.claimed++;
  fillQuests(s);
  return true;
}

export function questsLeft(s: GameState): number {
  return QUESTS.filter((d) => s.quests.done[d.id] === undefined).length;
}
