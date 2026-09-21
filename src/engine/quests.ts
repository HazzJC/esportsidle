import { QUESTS, QUEST_MAP, type QuestDef, type QuestReward } from '../data/quests';
import { emit } from './bus';
import { addTrophy, bestTrophyTier, trophyHomeGame } from './stories';
import { fmt, fmtTime, money } from './format';
import { grantXp, xpToNext } from './players';
import type { Rng } from './rng';
import { tutorialActive } from './tutorial';
import type { ActiveQuest, Effect, GameState } from './types';
import { earnCash, gainFans, gainTrophies } from './wallet';

/** One quest at a time: the quest line is followed in order, like a story. */
export const QUEST_SLOTS = 1;

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

/**
 * Puts the next quest in the line on the board. Quests are followed in order and cannot be set
 * aside; a quest whose system has not opened yet (sponsors, merch, a rival) waits, and the line
 * carries on with the next one until it does. Quests wait for the tutorial.
 */
export function fillQuests(s: GameState): void {
  if (tutorialActive(s)) return;
  const q = s.quests;
  // Quests set aside under the old "Later" button simply rejoin the line in order.
  if (Object.keys(q.skipped).length > 0) q.skipped = {};
  for (const def of QUESTS) {
    if (q.active.length >= QUEST_SLOTS) return;
    const open = q.done[def.id] === undefined && !q.active.some((a) => a.id === def.id) && (!def.available || def.available(s));
    if (open) q.active.push({ id: def.id, base: def.metric(s), ready: false });
  }
}

/** The quest after the current one, for an "Up next" preview. */
export function nextQuest(s: GameState): (typeof QUESTS)[number] | undefined {
  const current = new Set(s.quests.active.map((a) => a.id));
  return QUESTS.find((d) => s.quests.done[d.id] === undefined && !current.has(d.id));
}

/** Fills slots and announces quests that have just been finished. */
export function updateQuests(s: GameState): void {
  fillQuests(s);
  for (const q of s.quests.active) {
    if (q.ready || !questProgress(s, q).complete) continue;
    q.ready = true;
    const def = QUEST_MAP.get(q.id);
    const body = def && def.rewards.length > 1 ? 'Choose your reward in HQ.' : 'Claim your reward in HQ.';
    emit({ type: 'toast', title: `Quest complete: ${def?.title ?? 'Quest'}`, body, icon: def?.icon ?? 'flag', tone: 'gold' });
  }
}

export interface RewardContext {
  /** Income per second without temporary buffs. */
  cps: number;
  fansPerSec: number;
}

const cashAmount = (r: Extract<QuestReward, { kind: 'cash' }>, ctx: RewardContext) => Math.max(r.min, ctx.cps * r.seconds);
const fanAmount = (r: Extract<QuestReward, { kind: 'fans' }>, ctx: RewardContext) => Math.max(r.min, ctx.fansPerSec * r.seconds);

/** The reward's headline, at today's rates: "$12.4 K", "Clicks earn twice as much". */
export function describeReward(r: QuestReward, ctx: RewardContext): string {
  switch (r.kind) {
    case 'cash':
      return money(cashAmount(r, ctx));
    case 'fans':
      return `${fmt(fanAmount(r, ctx))} fans`;
    case 'trophies':
      return `${r.amount} ${r.amount === 1 ? 'trophy' : 'trophies'}`;
    case 'levels':
      return `+${r.amount} level${r.amount === 1 ? '' : 's'} for every player`;
    case 'legacy':
      return `${r.amount} legacy points`;
    case 'perk':
      return r.label;
  }
}

/** One line on what the reward is for, so no choice is a guess. */
export function rewardDetail(r: QuestReward, ctx: RewardContext): string {
  switch (r.kind) {
    case 'cash': {
      const amount = cashAmount(r, ctx);
      return ctx.cps > 0 ? `About ${fmtTime(amount / ctx.cps)} of income, paid now` : 'Paid now';
    }
    case 'fans':
      return 'Fans raise your fame, which multiplies all income';
    case 'trophies':
      return 'Spend on operation levels and trophy upgrades';
    case 'levels':
      return 'Higher stats: better results and resale value';
    case 'legacy':
      return 'Spend in the Legacy tree';
    case 'perk':
      return 'Lasts for the rest of this run';
  }
}

function applyReward(s: GameState, r: QuestReward, ctx: RewardContext, rng: Rng): void {
  switch (r.kind) {
    case 'cash':
      earnCash(s, cashAmount(r, ctx), 'quest');
      break;
    case 'fans':
      gainFans(s, fanAmount(r, ctx));
      break;
    case 'trophies':
      gainTrophies(s, r.amount);
      addTrophy(s, { kind: 'quest', gameId: trophyHomeGame(s), tier: bestTrophyTier(s), season: null, mvp: null, label: 'Quest reward' }, r.amount);
      break;
    case 'levels':
      for (const p of Object.values(s.players)) {
        for (let i = 0; i < r.amount; i++) grantXp(p, Math.max(0, xpToNext(p.level) - p.xp), rng);
      }
      break;
    case 'legacy':
      s.prestige.points += r.amount;
      break;
    case 'perk':
      // Perks are read from the recorded pick in questPerkEffects, so nothing to do here.
      break;
  }
}

/** Pays one of a finished quest's rewards and brings in the next quest. */
export function claimQuest(s: GameState, id: string, choice: number, ctx: RewardContext, rng: Rng): boolean {
  const index = s.quests.active.findIndex((q) => q.id === id);
  const def: QuestDef | undefined = QUEST_MAP.get(id);
  if (index < 0 || !def || !questProgress(s, s.quests.active[index]).complete) return false;
  const reward = def.rewards[choice];
  if (!reward) return false;
  applyReward(s, reward, ctx, rng);
  s.quests.active.splice(index, 1);
  s.quests.done[id] = s.time;
  s.quests.picks[id] = choice;
  s.quests.claimed++;
  fillQuests(s);
  return true;
}

/** Effects from every perk the org has chosen this run. */
export function questPerkEffects(s: GameState): Effect[] {
  const out: Effect[] = [];
  for (const [id, choice] of Object.entries(s.quests.picks)) {
    const reward = QUEST_MAP.get(id)?.rewards[choice];
    if (reward?.kind === 'perk') out.push(...reward.effects);
  }
  return out;
}

/** Labels of the perks the org has earned, for display. */
export function questPerkLabels(s: GameState): string[] {
  return questPerkSources(s).map((p) => p.label);
}

/** Each perk and the quest that earned it, so the board can say where a perk came from. */
export function questPerkSources(s: GameState): { label: string; quest: string; icon: string; claimedAt: number }[] {
  const out: { label: string; quest: string; icon: string; claimedAt: number }[] = [];
  for (const [id, choice] of Object.entries(s.quests.picks)) {
    const def = QUEST_MAP.get(id);
    const reward = def?.rewards[choice];
    if (def && reward?.kind === 'perk') out.push({ label: reward.label, quest: def.title, icon: def.icon, claimedAt: s.quests.done[id] ?? 0 });
  }
  return out.sort((a, b) => a.claimedAt - b.claimedAt);
}

export function questsLeft(s: GameState): number {
  return QUESTS.filter((d) => s.quests.done[d.id] === undefined).length;
}
