/**
 * The quest data model (docs/implementation-plan.md, WS6.1): every quest names the mechanic it
 * teaches, rewards come in kinds, and the newer kinds (tools, tokens, operation affinities,
 * cosmetics, titles) pay once and persist as they should.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { getOp } from '../src/data/operations';
import { AFFINITY_DISCOUNT, AFFINITY_MULT, AFFINITY_UNITS, MECHANICS, QUESTS, QUEST_MAP, type Mechanic, type QuestDef } from '../src/data/quests';
import { computeMods, computeRates } from '../src/engine/economy';
import { bulkPrice, buyOperation, maxAffordable, sellRefund, unitPrice } from '../src/engine/operations';
import { LEGACY_DIVISOR, sellOrg } from '../src/engine/prestige';
import { claimQuest, describeReward, fillQuests, hasTool, questPerkEffects, useToken } from '../src/engine/quests';
import { Rng } from '../src/engine/rng';
import { decodeSave, encodeSave } from '../src/engine/save';
import type { GameState } from '../src/engine/types';
import { finishLadder, foundedGame } from './fixtures';

/**
 * Mechanics the first-run quest line does not teach yet. The tour rewrite (WS6.2) adds a quest for
 * each; remove a mechanic from this list when its quest lands.
 */
const TOUR_GAPS: Mechanic[] = ['scouting', 'lineup', 'merchPricing', 'events', 'trophies', 'automation'];

const ctx = (s: GameState) => ({ cps: computeRates(s).cpsNoBuffs, fansPerSec: 1 });

describe('the quest line', () => {
  it('gives every quest a unique id, a known mechanic, a target and one or two rewards', () => {
    expect(new Set(QUESTS.map((q) => q.id)).size).toBe(QUESTS.length);
    for (const q of QUESTS) {
      expect(MECHANICS).toContain(q.mechanic);
      expect(q.target).toBeGreaterThan(0);
      expect(q.rewards.length).toBeGreaterThanOrEqual(1);
      expect(q.rewards.length).toBeLessThanOrEqual(2);
    }
  });

  it('teaches every mechanic, apart from the known gaps the tour rewrite will fill', () => {
    const taught = new Set(QUESTS.map((q) => q.mechanic));
    const untaught = MECHANICS.filter((m) => !taught.has(m));
    expect(untaught).toEqual(TOUR_GAPS);
  });

  it('never offers a choice between two rewards of the same kind', () => {
    for (const q of QUESTS) {
      if (q.rewards.length === 2) expect(q.rewards[0].kind, q.id).not.toBe(q.rewards[1].kind);
    }
  });

  it('pays a quest once', () => {
    const s = foundedGame(0, 1);
    fillQuests(s);
    s.ops.grinder.owned = 10;
    expect(claimQuest(s, 'grinders_10', 0, ctx(s), new Rng(s))).toBe(true);
    expect(claimQuest(s, 'grinders_10', 0, ctx(s), new Rng(s))).toBe(false);
    fillQuests(s);
    expect(s.quests.active.map((q) => q.id)).not.toContain('grinders_10');
    expect(questPerkEffects(s)).toHaveLength(1);
  });
});

describe('newer reward kinds', () => {
  const extra: QuestDef = {
    id: 'test_tour',
    title: 'Test tour stop',
    desc: 'For tests only.',
    icon: 'flag',
    art: 'pennant',
    mechanic: 'merchDesign',
    metric: () => 1,
    target: 1,
    mode: 'absolute',
    rewards: [{ kind: 'tool', id: 'pr_shield', amount: 2 }, { kind: 'tool', id: 'trend_tip' }],
    bonus: [
      { kind: 'opAffinity', op: 'streamer' },
      { kind: 'title', id: 'closer', label: 'Closer' },
      { kind: 'cosmetic', id: 'pattern_test', label: 'Test pattern' },
    ],
  };
  const install = (s: GameState) => {
    QUESTS.unshift(extra);
    QUEST_MAP.set(extra.id, extra);
    s.quests.active = [{ id: extra.id, base: 0, ready: true }];
  };
  afterEach(() => {
    const i = QUESTS.indexOf(extra);
    if (i >= 0) QUESTS.splice(i, 1);
    QUEST_MAP.delete(extra.id);
  });

  it('pays an operation affinity as a discount on the first units when none are owned', () => {
    const s = foundedGame(0, 1);
    install(s);
    const op = getOp('streamer');
    expect(describeReward({ kind: 'opAffinity', op: 'streamer' }, { ...ctx(s), state: s })).toContain(`First ${AFFINITY_UNITS}`);
    expect(claimQuest(s, extra.id, 0, ctx(s), new Rng(s))).toBe(true);
    expect(s.quests.affinity[extra.id]).toBe('discount');
    const d = computeMods(s).opFirstUnits.streamer;
    expect(d).toEqual({ units: AFFINITY_UNITS, mult: AFFINITY_DISCOUNT });

    // The first ten are cheaper, the eleventh is full price, and a bulk buy across the line splits.
    expect(unitPrice(op, 0, 1, d)).toBe(Math.ceil(op.baseCost * AFFINITY_DISCOUNT));
    expect(unitPrice(op, AFFINITY_UNITS, 1, d)).toBe(unitPrice(op, AFFINITY_UNITS));
    expect(bulkPrice(op, 5, 10, 1, d)).toBe(bulkPrice(op, 5, 5, 1, d) + bulkPrice(op, 10, 5));
    for (const cash of [0, 70, 500, 5_000, 1e6]) {
      const n = maxAffordable(op, 0, cash, 1, d);
      if (n > 0) expect(bulkPrice(op, 0, n, 1, d)).toBeLessThanOrEqual(cash);
      expect(bulkPrice(op, 0, n + 1, 1, d)).toBeGreaterThan(cash);
    }
    // Selling refunds a quarter of what the units cost, discount included.
    expect(sellRefund(op, 3, 3, 1, d)).toBe(Math.floor(bulkPrice(op, 0, 3, 1, d) * 0.25));

    s.cash = bulkPrice(op, 0, 3, 1, d);
    expect(buyOperation(s, 'streamer', 3)).toBe(3);
    expect(s.cash).toBe(0);
  });

  it('pays an operation affinity as a multiplier when one is owned', () => {
    const s = foundedGame(0, 1);
    install(s);
    s.ops.streamer.owned = 4;
    const before = computeRates(s).opUnit.streamer;
    expect(claimQuest(s, extra.id, 0, ctx(s), new Rng(s))).toBe(true);
    expect(s.quests.affinity[extra.id]).toBe('mult');
    expect(computeRates(s).opUnit.streamer).toBeCloseTo(before * AFFINITY_MULT);
    // Settled at the claim: selling the streamers does not turn it into a discount.
    s.ops.streamer.owned = 0;
    expect(computeMods(s).opFirstUnits.streamer).toBeUndefined();
  });

  it('hands out tokens that are spent and tools that are kept', () => {
    const s = foundedGame(0, 1);
    install(s);
    expect(claimQuest(s, extra.id, 0, ctx(s), new Rng(s))).toBe(true);
    expect(s.quests.tools.pr_shield).toBe(2);
    expect(useToken(s, 'pr_shield')).toBe(true);
    expect(useToken(s, 'pr_shield')).toBe(true);
    expect(useToken(s, 'pr_shield')).toBe(false);
    expect(hasTool(s, 'pr_shield')).toBe(false);

    const t = foundedGame(0, 2);
    install(t);
    expect(claimQuest(t, extra.id, 1, ctx(t), new Rng(t))).toBe(true);
    expect(hasTool(t, 'trend_tip')).toBe(true);
    expect(useToken(t, 'trend_tip')).toBe(false);
    expect(hasTool(t, 'trend_tip')).toBe(true);
  });

  it('keeps titles and cosmetics across a sale, and resets the run-only rewards', () => {
    const s = foundedGame(0, 1);
    install(s);
    expect(claimQuest(s, extra.id, 1, ctx(s), new Rng(s))).toBe(true);
    expect(Object.keys(s.quests.collection).sort()).toEqual(['cosmetic:pattern_test', 'title:closer']);
    s.earnedTotal = LEGACY_DIVISOR;
    finishLadder(s);
    sellOrg(s, { charter: 'operator' });
    expect(Object.keys(s.quests.collection).sort()).toEqual(['cosmetic:pattern_test', 'title:closer']);
    expect(s.quests.tools).toEqual({});
    expect(s.quests.affinity).toEqual({});
  });

  it('round-trips the new quest state through a save, and fills it in on older saves', () => {
    const s = foundedGame(0, 1);
    install(s);
    expect(claimQuest(s, extra.id, 0, ctx(s), new Rng(s))).toBe(true);
    const back = decodeSave(encodeSave(s));
    expect(back.quests.tools).toEqual(s.quests.tools);
    expect(back.quests.affinity).toEqual(s.quests.affinity);
    expect(back.quests.collection).toEqual(s.quests.collection);

    const old = structuredClone(s) as unknown as { quests: Record<string, unknown> };
    delete old.quests.tools;
    delete old.quests.affinity;
    delete old.quests.collection;
    const migrated = decodeSave(encodeSave(old as unknown as GameState));
    expect(migrated.quests.tools).toEqual({});
    expect(migrated.quests.affinity).toEqual({});
    expect(migrated.quests.collection).toEqual({});
  });
});
