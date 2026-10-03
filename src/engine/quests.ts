import { OP_MAP } from '../data/operations';
import { AFFINITY_DISCOUNT, AFFINITY_MULT, AFFINITY_UNITS, QUESTS, QUEST_MAP, QUEST_TOOLS, type QuestDef, type QuestReward, type QuestToolId } from '../data/quests';
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
  /** The org, for rewards that depend on it (an operation affinity pays differently once one is owned). */
  state?: GameState;
}

/** How an operation affinity would pay right now: a multiplier once the org owns one, else a discount. */
export function affinityBranch(s: GameState | undefined, op: string): 'mult' | 'discount' {
  return (s?.ops[op]?.owned ?? 0) > 0 ? 'mult' : 'discount';
}

/** The effect an operation affinity paid as `branch`. */
export function affinityEffect(op: string, branch: 'mult' | 'discount'): Effect {
  return branch === 'mult' ? { kind: 'opMult', op, mult: AFFINITY_MULT } : { kind: 'opFirstUnits', op, units: AFFINITY_UNITS, mult: AFFINITY_DISCOUNT };
}

const opPlural = (op: string) => OP_MAP.get(op)?.plural ?? op;

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
    case 'tool': {
      const n = r.amount ?? 1;
      return n > 1 ? `${QUEST_TOOLS[r.id].label} ×${n}` : QUEST_TOOLS[r.id].label;
    }
    case 'opAffinity':
      return affinityBranch(ctx.state, r.op) === 'mult'
        ? `${opPlural(r.op)} earn ×${AFFINITY_MULT}`
        : `First ${AFFINITY_UNITS} ${opPlural(r.op)} ${Math.round((1 - AFFINITY_DISCOUNT) * 100)}% off`;
    case 'cosmetic':
      return r.label;
    case 'title':
      return `Title: “${r.label}”`;
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
    case 'tool':
      return QUEST_TOOLS[r.id].consumable ? 'Used up when you spend it' : 'Yours for the rest of this run';
    case 'opAffinity':
      return affinityBranch(ctx.state, r.op) === 'mult' ? 'The operation most like this, for the rest of this run' : 'Until you own a few: a head start on the operation most like this';
    case 'cosmetic':
      return 'A look for your org, kept after you sell';
    case 'title':
      return 'Shown on your org, kept after you sell';
  }
}

function applyReward(s: GameState, r: QuestReward, ctx: RewardContext, rng: Rng, questId: string): void {
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
    case 'tool': {
      const n = QUEST_TOOLS[r.id].consumable ? (s.quests.tools[r.id] ?? 0) + (r.amount ?? 1) : 1;
      s.quests.tools[r.id] = n;
      break;
    }
    case 'opAffinity':
      // Settled once, when claimed, so the reward cannot change under the player afterwards.
      s.quests.affinity[questId] = affinityBranch(s, r.op);
      break;
    case 'cosmetic':
    case 'title':
      s.quests.collection[`${r.kind}:${r.id}`] ??= s.time;
      break;
  }
}

/** Whether the org holds a quest tool or at least one of a quest token. */
export function hasTool(s: GameState, id: QuestToolId): boolean {
  return (s.quests.tools[id] ?? 0) > 0;
}

/** Spends one of a quest token. Returns false when there is none (tools that are kept are never spent). */
export function useToken(s: GameState, id: QuestToolId): boolean {
  if (!QUEST_TOOLS[id].consumable || !hasTool(s, id)) return false;
  s.quests.tools[id]--;
  if (s.quests.tools[id] <= 0) delete s.quests.tools[id];
  return true;
}

/** Pays one of a finished quest's rewards and brings in the next quest. */
export function claimQuest(s: GameState, id: string, choice: number, ctx: RewardContext, rng: Rng): boolean {
  const index = s.quests.active.findIndex((q) => q.id === id);
  const def: QuestDef | undefined = QUEST_MAP.get(id);
  if (index < 0 || !def || !questProgress(s, s.quests.active[index]).complete) return false;
  const reward = def.rewards[choice];
  if (!reward) return false;
  applyReward(s, reward, { ...ctx, state: s }, rng, id);
  for (const extra of def.bonus ?? []) applyReward(s, extra, { ...ctx, state: s }, rng, id);
  s.quests.active.splice(index, 1);
  s.quests.done[id] = s.time;
  s.quests.picks[id] = choice;
  s.quests.claimed++;
  fillQuests(s);
  return true;
}

/** Effects from every perk the org has chosen this run, and the operation affinities it was paid. */
export function questPerkEffects(s: GameState): Effect[] {
  const out: Effect[] = [];
  for (const [id, choice] of Object.entries(s.quests.picks)) {
    const def = QUEST_MAP.get(id);
    const reward = def?.rewards[choice];
    if (reward?.kind === 'perk') out.push(...reward.effects);
    for (const r of [reward, ...(def?.bonus ?? [])]) {
      const branch = s.quests.affinity[id];
      if (r?.kind === 'opAffinity' && branch) out.push(affinityEffect(r.op, branch));
    }
  }
  return out;
}

/** Labels of the perks the org has earned, for display. */
export function questPerkLabels(s: GameState): string[] {
  return questPerkSources(s).map((p) => p.label);
}

/** Each perk and the quest that earned it, so the board can say where a perk came from. */
export function questPerkSources(s: GameState): { id: string; label: string; quest: string; icon: string; claimedAt: number }[] {
  const out: { id: string; label: string; quest: string; icon: string; claimedAt: number }[] = [];
  for (const [id, choice] of Object.entries(s.quests.picks)) {
    const def = QUEST_MAP.get(id);
    const reward = def?.rewards[choice];
    if (def && reward?.kind === 'perk') out.push({ id, label: reward.label, quest: def.title, icon: def.icon, claimedAt: s.quests.done[id] ?? 0 });
  }
  return out.sort((a, b) => a.claimedAt - b.claimedAt);
}

export function questsLeft(s: GameState): number {
  return QUESTS.filter((d) => s.quests.done[d.id] === undefined).length;
}

/** The quest that selling the org completes. */
export const SELL_QUEST_ID = 'sell_org';

/** Whether selling now would complete "The big exit". */
export function saleCompletesQuest(s: GameState): boolean {
  return s.quests.active.some((q) => q.id === SELL_QUEST_ID);
}

/**
 * Pays "The big exit" as part of a sale. Selling clears the quest board before the sale counts, so
 * the quest could never be finished and claimed the usual way; the sale pays it instead.
 */
export function completeQuestOnSale(s: GameState, choice: number, rng: Rng): boolean {
  const def = QUEST_MAP.get(SELL_QUEST_ID);
  if (!def || !saleCompletesQuest(s)) return false;
  const reward = def.rewards[choice] ?? def.rewards[0];
  applyReward(s, reward, { cps: 0, fansPerSec: 0, state: s }, rng, SELL_QUEST_ID);
  for (const extra of def.bonus ?? []) applyReward(s, extra, { cps: 0, fansPerSec: 0, state: s }, rng, SELL_QUEST_ID);
  s.quests.done[SELL_QUEST_ID] = s.time;
  s.quests.picks[SELL_QUEST_ID] = def.rewards.indexOf(reward);
  s.quests.claimed++;
  return true;
}
