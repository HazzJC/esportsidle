import { describe, expect, it } from 'vitest';
import { QUESTS, QUEST_MAP } from '../src/data/quests';
import { TUTORIAL_CLICKS } from '../src/data/tutorial';
import { clickLogo } from '../src/engine/clicker';
import { FIRST_DRAFT, draftOutlook, signDraftPick } from '../src/engine/draft';
import { computeMods, computeRates } from '../src/engine/economy';
import { advance } from '../src/engine/game';
import { signListing } from '../src/engine/market';
import { buyOperation } from '../src/engine/operations';
import { LEGACY_DIVISOR, sellOrg } from '../src/engine/prestige';
import { QUEST_SKIP_SECONDS, QUEST_SLOTS, claimQuest, fillQuests, questPerkLabels, questProgress, skipQuest, updateQuests } from '../src/engine/quests';
import { Rng } from '../src/engine/rng';
import { decodeSave, encodeSave } from '../src/engine/save';
import { createNewGame } from '../src/engine/state';
import { operationsOpen, skipTutorial, updateTutorial } from '../src/engine/tutorial';
import type { GameState } from '../src/engine/types';
import { foundedGame } from './fixtures';

const ctx = (s: GameState) => {
  const r = computeRates(s);
  return { cps: r.cpsNoBuffs, fansPerSec: r.fansPerSec };
};

describe('a new org', () => {
  it('starts with no team and no player, and three prospects to choose from', () => {
    const s = createNewGame(0, 1);
    expect(Object.keys(s.players)).toHaveLength(0);
    expect(Object.keys(s.teams)).toHaveLength(0);
    expect(s.draft).toHaveLength(3);
    expect(s.draft!.map((l) => l.price)).toEqual(FIRST_DRAFT.map((d) => d.price));
    expect(s.draft!.map((l) => l.player.rarity)).toEqual(FIRST_DRAFT.map((d) => d.rarity));
    expect(s.tutorial.step).toBe('click');
  });

  it('prices the picks at $10, $25 and $50: a blank beginner, a rookie and a talent', () => {
    const s = createNewGame(0, 1);
    const [blank, rookie, talent] = s.draft!;
    expect([blank.price, rookie.price, talent.price]).toEqual([10, 25, 50]);
    expect(Object.values(blank.player.stats).every((v) => v === 0)).toBe(true);
    expect(rookie.player.rarity).toBe('rookie');
    expect(talent.player.rarity).toBe('talent');
    // The tutorial's clicks alone pay for the cheapest pick; the best is well under a minute more.
    const click = computeRates(s).click;
    expect(blank.price).toBeLessThanOrEqual(TUTORIAL_CLICKS * click);
    expect(talent.price / click / 5).toBeLessThan(30);
  });

  it('shows the blank beginner losing and the talent as the strongest start', () => {
    const s = createNewGame(0, 1);
    const [blank, rookie, talent] = s.draft!.map((l) => draftOutlook(s, l.player, computeMods(s)));
    expect(blank.win).toBeLessThan(0.01);
    expect(blank.reach).toBe(-1);
    expect(talent.win).toBeGreaterThan(rookie.win);
  });

  it('founds the first team with the first signing and closes the draft', () => {
    const s = createNewGame(0, 1);
    const pick = s.draft![1];
    expect(signDraftPick(s, pick.player.id, computeMods(s))).toMatchObject({ ok: false });
    s.cash = pick.price;
    expect(signDraftPick(s, pick.player.id, computeMods(s)).ok).toBe(true);
    expect(s.cash).toBe(0);
    expect(s.teams.smash.lineup[0]).toBe(pick.player.id);
    expect(s.draft).toBeNull();
    expect(s.stats.playersSigned).toBe(1);
  });

  it('also founds the team when the first signing comes from the market', () => {
    const s = createNewGame(0, 1);
    const listing = s.market.listings.find((l) => l.player.gameId === 'smash')!;
    s.cash = listing.price;
    expect(signListing(s, listing.player.id, computeMods(s)).ok).toBe(true);
    expect(s.teams.smash).toBeDefined();
    expect(s.draft).toBeNull();
  });
});

describe('the tutorial', () => {
  it('walks from clicking to a signing, a match and then operations', () => {
    const s = createNewGame(0, 1);
    expect(operationsOpen(s)).toBe(false);
    s.cash = 1e6;
    expect(buyOperation(s, 'grinder', 1)).toBe(0);

    for (let i = 0; i < TUTORIAL_CLICKS; i++) clickLogo(s);
    updateTutorial(s);
    expect(s.tutorial.step).toBe('draft');

    signDraftPick(s, s.draft![0].player.id, computeMods(s));
    updateTutorial(s);
    expect(s.tutorial.step).toBe('match');

    advance(s, 30);
    expect(s.tutorial.step).toBe('grinder');
    expect(operationsOpen(s)).toBe(true);
    expect(buyOperation(s, 'grinder', 1)).toBe(1);
    buyOperation(s, 'streamer', 1);
    updateTutorial(s);
    expect(s.tutorial.step).toBe('done');
  });

  it('can be skipped, which opens everything', () => {
    const s = createNewGame(0, 1);
    skipTutorial(s);
    expect(operationsOpen(s)).toBe(true);
    expect(s.draft).not.toBeNull();
  });
});

describe('quests', () => {
  it('wait for the tutorial, then offer two at a time', () => {
    const s = createNewGame(0, 1);
    fillQuests(s);
    expect(s.quests.active).toHaveLength(0);
    skipTutorial(s);
    fillQuests(s);
    expect(s.quests.active).toHaveLength(QUEST_SLOTS);
  });

  it('only offer quests the org can act on', () => {
    const s = createNewGame(0, 1);
    skipTutorial(s);
    fillQuests(s);
    // No player yet, so gear and promotion quests wait.
    const ids = s.quests.active.map((q) => q.id);
    expect(ids).not.toContain('gear_1');
    for (const id of ids) expect(QUEST_MAP.get(id)!.available?.(s) ?? true).toBe(true);
  });

  it('count delta quests from when they were offered', () => {
    const s = foundedGame(0, 1);
    s.stats.gearBought = 7;
    s.quests.active = [];
    s.quests.done.grinders_10 = 0;
    fillQuests(s);
    const gear = s.quests.active.find((q) => q.id === 'gear_1')!;
    expect(gear.base).toBe(7);
    expect(questProgress(s, gear).complete).toBe(false);
    s.stats.gearBought = 8;
    expect(questProgress(s, gear).complete).toBe(true);
  });

  it('pays the reward and brings in the next quest', () => {
    const s = foundedGame(0, 1);
    fillQuests(s);
    const first = s.quests.active[0];
    expect(first.id).toBe('grinders_10');
    expect(claimQuest(s, first.id, 0, ctx(s), new Rng(s))).toBe(false);
    s.ops.grinder.owned = 10;
    updateQuests(s);
    expect(first.ready).toBe(true);
    // A one-reward quest has no second option to take.
    expect(claimQuest(s, first.id, 1, ctx(s), new Rng(s))).toBe(false);
    expect(claimQuest(s, first.id, 0, ctx(s), new Rng(s))).toBe(true);
    expect(s.quests.done.grinders_10).toBeDefined();
    expect(s.quests.active).toHaveLength(QUEST_SLOTS);
    expect(s.quests.active.map((q) => q.id)).not.toContain('grinders_10');
  });

  it('keeps perks for good, even after selling the org', () => {
    const s = foundedGame(0, 1);
    s.ops.grinder.owned = 10;
    const before = computeRates(s).opUnit.grinder;
    fillQuests(s);
    expect(claimQuest(s, 'grinders_10', 0, ctx(s), new Rng(s))).toBe(true);
    expect(computeRates(s).opUnit.grinder).toBeCloseTo(before * 2);
    expect(questPerkLabels(s)).toEqual(['Ranked Grinders earn twice as much']);
    s.earnedTotal = LEGACY_DIVISOR;
    sellOrg(s, { charter: 'operator' });
    expect(questPerkLabels(s)).toHaveLength(1);
  });

  it('pays cash worth minutes of income, with a floor for small orgs', () => {
    const s = foundedGame(0, 1);
    s.quests.done = Object.fromEntries(QUESTS.filter((q) => q.id !== 'staff_1').map((q) => [q.id, 0]));
    s.stats.playersSigned = 1;
    fillQuests(s);
    s.stats.staffHired++;
    const cash = s.cash;
    expect(claimQuest(s, 'staff_1', 0, { cps: 0, fansPerSec: 0 }, new Rng(s))).toBe(true);
    expect(s.cash - cash).toBe(1_500);
  });

  it('lets a quest be set aside without blocking the board', () => {
    const s = foundedGame(0, 1);
    fillQuests(s);
    const [first, second] = s.quests.active.map((q) => q.id);
    expect(skipQuest(s, first)).toBe(true);
    expect(s.quests.active.map((q) => q.id)).toEqual([second, expect.any(String)]);
    expect(s.quests.active.map((q) => q.id)).not.toContain(first);
    // It comes back once the fresh quests run out, after a pause.
    s.quests.done = Object.fromEntries(QUESTS.filter((q) => q.id !== first).map((q) => [q.id, 0]));
    s.quests.active = [];
    fillQuests(s);
    expect(s.quests.active).toHaveLength(0);
    s.time += QUEST_SKIP_SECONDS;
    fillQuests(s);
    expect(s.quests.active.map((q) => q.id)).toEqual([first]);
  });

  it('asks for a choice only once the player has met both options', () => {
    expect(new Set(QUESTS.map((q) => q.id)).size).toBe(QUESTS.length);
    // The quests that arrive straight after the tutorial pay one clear reward each.
    for (const q of QUESTS.slice(0, 7)) expect(q.rewards, q.id).toHaveLength(1);
    for (const q of QUESTS) {
      if (q.rewards.length === 2) expect(q.rewards[0]).not.toEqual(q.rewards[1]);
      // Trophies are only offered by quests that themselves earn a trophy or come later.
      if (q.rewards.some((r) => r.kind === 'trophies')) expect(QUESTS.indexOf(q), q.id).toBeGreaterThan(12);
    }
  });

  it('covers the milestones every org should hit', () => {
    for (const id of ['gear_1', 'sponsor_1', 'design_shirt', 'crowd_1', 'tourney_1', 'sell_player']) expect(QUEST_MAP.has(id), id).toBe(true);
  });
});

describe('saves and sales', () => {
  it('keeps the tutorial, draft and quests through a save', () => {
    const s = createNewGame(0, 1);
    const back = decodeSave(encodeSave(s));
    expect(back.tutorial.step).toBe('click');
    expect(back.draft).toHaveLength(3);
    expect(back.teams.smash).toBeUndefined();
  });

  it('lets orgs from before the draft keep their founder and skip the tutorial', () => {
    const s = foundedGame(0, 1);
    const old = { ...s, version: 3 } as unknown as Record<string, unknown>;
    delete old.tutorial;
    delete old.draft;
    delete old.quests;
    const back = decodeSave(encodeSave(old as never).replace(/^ESI\d+/, 'ESI3'));
    expect(back.tutorial.step).toBe('done');
    expect(back.draft).toBeNull();
    expect(back.players.founder).toBeDefined();
  });

  it('offers a fresh draft after a sale, unless the charter already brings a player', () => {
    const s = createNewGame(0, 1);
    s.cash = 1e6;
    expect(signDraftPick(s, s.draft![0].player.id, { benchSlots: 0 }).ok).toBe(true);
    s.earnedTotal = LEGACY_DIVISOR;
    sellOrg(s, { charter: 'operator' });
    expect(Object.keys(s.players)).toHaveLength(0);
    expect(s.draft).toHaveLength(3);
    expect(s.draft!.map((l) => l.player.rarity)).toEqual(['talent', 'pro', 'star']);

    const t = createNewGame(0, 2);
    t.cash = 1e6;
    expect(signDraftPick(t, t.draft![0].player.id, { benchSlots: 0 }).ok).toBe(true);
    t.earnedTotal = LEGACY_DIVISOR;
    sellOrg(t, { charter: 'scout' });
    expect(Object.keys(t.players).length).toBeGreaterThan(0);
    expect(t.draft).toBeNull();
  });

  it('founds the team for a franchise player kept through a sale', () => {
    const s = createNewGame(0, 3);
    s.cash = 1e6;
    expect(signDraftPick(s, s.draft![0].player.id, { benchSlots: 0 }).ok).toBe(true);
    const star = Object.values(s.players)[0];
    s.prestige.nodes.keep_player = 1;
    s.earnedTotal = LEGACY_DIVISOR;
    sellOrg(s, { charter: 'operator', keepPlayerId: star.id });
    expect(s.teams.smash.lineup[0]).toBe(star.id);
    expect(s.prestige.reserve).toHaveLength(0);
    expect(s.draft).toBeNull();
  });

  it('brings the founder back after a sale for orgs that have one', () => {
    const s = foundedGame(0, 1);
    const tag = s.players.founder.tag;
    s.earnedTotal = LEGACY_DIVISOR;
    sellOrg(s, { charter: 'operator' });
    expect(s.players.founder.tag).toBe(tag);
    expect(s.teams.smash.lineup[0]).toBe('founder');
    expect(s.draft).toBeNull();
  });
});
