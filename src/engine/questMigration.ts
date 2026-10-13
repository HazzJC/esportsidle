import { QUESTS, QUEST_MAP } from '../data/quests';
import type { Effect, GameState } from './types';

export { QUEST_LINE_KNOWN } from './firstRun';


type OldPerk = { label: string; effects: Effect[] } | null;
const perk = (label: string, effect: Effect): OldPerk => ({ label, effects: [effect] });

/**
 * The perks the quest line paid before chapters, by quest and reward index. A pick whose reward means
 * something else in today's line (or whose quest has left it) is carried as it was paid.
 */
const OLD_PERKS: Record<string, OldPerk[]> = {
  grinders_10: [perk('Ranked Grinders earn twice as much', { kind: 'opMult', op: 'grinder', mult: 2 })],
  gear_1: [null],
  crowd_1: [perk('The crowd goes wild for 50% longer', { kind: 'hypeDuration', mult: 1.5 })],
  upgrades_3: [perk('Clicks earn twice as much', { kind: 'clickMult', mult: 2 })],
  scout_1: [perk('One more seat on every bench', { kind: 'benchSlots', add: 1 })],
  drop_1: [perk('Hype Drops appear 20% more often', { kind: 'dropInterval', mult: 0.8 })],
  staff_1: [null],
  plan_1: [null],
  second_team: [null, perk('Match prize money +10%', { kind: 'prizeMult', mult: 1.1 })],
  decor_1: [null, null],
  design_shirt: [null, perk('+10% fans from everything', { kind: 'fansMult', mult: 1.1 })],
  promotion_1: [null, perk('All team ratings +3%', { kind: 'teamRating', mult: 1.03 })],
  sponsor_1: [null, perk('One more sponsor slot', { kind: 'sponsorSlots', add: 1 })],
  sponsor_goal: [null, perk('Sponsor income +15%', { kind: 'sponsorIncome', mult: 1.15 })],
  merch_1: [null, perk('Merch sells 20% more', { kind: 'merchMult', mult: 1.2 })],
  level_10: [null, perk('Players earn 15% more XP', { kind: 'xpMult', mult: 1.15 })],
  title_1: [null, null],
  tourney_1: [null, perk('Tournament prizes ×1.5', { kind: 'tournamentReward', mult: 1.5 })],
  rival_1: [null, null],
  sell_player: [null, perk('Signing fees 15% cheaper', { kind: 'feeMult', mult: 0.85 })],
  ops_100: [null, perk('+5% income from everything', { kind: 'globalPct', pct: 0.05 })],
  tier_5: [null, null],
  sell_org: [null, null],
};

/** Titles and icons for quests that have left the line, so a carried perk still says where it came from. */
const RETIRED_INFO: Record<string, { title: string; icon: string }> = {
  level_10: { title: 'Homegrown', icon: 'dumbbell' },
  ops_100: { title: 'Business empire', icon: 'building' },
  tier_5: { title: 'Semi-pro', icon: 'trophy' },
};

/** The perk a reward pays in today's line, if it is a perk. */
function currentPerk(id: string, pick: number): string | null {
  const r = QUEST_MAP.get(id)?.rewards[pick];
  return r?.kind === 'perk' ? r.label : null;
}

/**
 * Brings an org from the quest line before chapters onto today's:
 * - A pick whose reward has changed meaning is carried as the perk it paid (or dropped if it paid none),
 *   so no run gains or loses a bonus by loading.
 * - Quests that are new or have moved earlier than the furthest one the org has claimed are marked
 *   done (without a reward), so the line carries on from where the org was rather than going back.
 * - A quest that has left the line comes off the board.
 */
export function migrateQuestLine(s: GameState): void {
  const q = s.quests;
  for (const [id, pick] of Object.entries(q.picks)) {
    const old = OLD_PERKS[id]?.[pick] ?? null;
    if (old && currentPerk(id, pick) === old.label) continue;
    if (!old && !currentPerk(id, pick)) continue;
    delete q.picks[id];
    if (!old) continue;
    const def = QUEST_MAP.get(id);
    const info = def ?? RETIRED_INFO[id];
    q.carried ??= {};
    q.carried[id] = { label: old.label, effects: old.effects, title: info?.title ?? id, icon: info?.icon ?? 'sparkles', claimedAt: q.done[id] ?? s.time };
  }
  q.active = q.active.filter((a) => QUEST_MAP.has(a.id));
  for (const a of q.active) a.since ??= s.time;
  let furthest = -1;
  QUESTS.forEach((d, i) => {
    if (q.done[d.id] !== undefined) furthest = i;
  });
  const live = new Set(q.active.map((a) => a.id));
  for (let i = 0; i < furthest; i++) {
    const id = QUESTS[i].id;
    if (q.done[id] === undefined && !live.has(id)) q.done[id] = s.time;
  }
}
