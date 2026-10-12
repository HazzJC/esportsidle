/**
 * The chaptered first run: systems that sleep until their quest (engine/firstRun.ts), quests that
 * credit what already happened, quest tools that each do one job, and the migration that brings an
 * org from the old quest line onto this one (engine/questMigration.ts).
 */
import { describe, expect, it } from 'vitest';
import { QUESTS, QUEST_MAP } from '../src/data/quests';
import { subscribe } from '../src/engine/bus';
import { clickDrop, dramaShare } from '../src/engine/drops';
import { computeMods, computeRates } from '../src/engine/economy';
import { awake, guidedRun } from '../src/engine/firstRun';
import { refreshMarket, signListing } from '../src/engine/market';
import { inSweetSpot, isMerchUnlocked, MERCH_UNLOCK_FANS, optimalPrice, rotateTrend, setLineDesign, setLinePrice, unlockProduct } from '../src/engine/merch';
import { addDesign, generateDesign } from '../src/engine/designs';
import { levelUpOperation } from '../src/engine/operations';
import { migrateQuestLine } from '../src/engine/questMigration';
import { claimQuest, fillQuests, questPerkEffects, questProgress, updateQuests } from '../src/engine/quests';
import { Rng } from '../src/engine/rng';
import { refreshOffers, signOffer } from '../src/engine/sponsors';
import { checkHouseMove } from '../src/engine/staff';
import { startPlayer, unlockGame } from '../src/engine/teams';
import { fireRandomEvent } from '../src/engine/worldEvents';
import { updateMarket } from '../src/engine/market';
import type { GameState } from '../src/engine/types';
import { foundedGame, guidedGame } from './fixtures';

const ctxFor = (s: GameState) => {
  const mods = computeMods(s);
  return { rng: new Rng(s), mods, rates: computeRates(s, mods) };
};

/** Claims every quest before `id` (without their rewards), so the line stands at `id`. */
function lineAt(s: GameState, id: string): void {
  s.quests.active = [];
  for (const q of QUESTS) {
    if (q.id === id) break;
    s.quests.done[q.id] = 0;
  }
  for (const sid of Object.keys(s.sections)) s.sectionsSeen[sid] = true;
}

/** Puts a hype drop on screen and clicks it. */
function catchHypeDrop(s: GameState) {
  s.drops.active.push({ id: s.nextId++, kind: 'hype', x: 0.5, y: 0.5, spawnedAt: s.time, expiresAt: s.time + 10, chain: 0 });
  return clickDrop(s, s.drops.active[s.drops.active.length - 1].id, ctxFor(s));
}

describe('a guided first run', () => {
  it('is the first run of an org that did not skip the tutorial', () => {
    expect(guidedRun(guidedGame(0, 1))).toBe(true);
    expect(guidedRun(foundedGame(0, 1))).toBe(false);
    const later = guidedGame(0, 1);
    later.prestige.runs = 1;
    expect(guidedRun(later)).toBe(false);
  });

  it('wakes each system with its quest, and has everything awake otherwise', () => {
    const s = guidedGame(0, 1);
    lineAt(s, 'grinders_10');
    for (const w of ['drops', 'invites', 'decisions', 'drama', 'ambient', 'rival', 'health', 'merch', 'foundTeams', 'teamControls', 'frontOffice'] as const) {
      expect(awake(s, w), w).toBe(false);
      expect(awake(foundedGame(0, 1), w), w).toBe(true);
    }
    s.quests.done.crowd_1 = 0;
    expect(awake(s, 'drops')).toBe(true);
    s.quests.active = [{ id: 'event_1', base: 0, ready: false }];
    expect(awake(s, 'decisions')).toBe(true);
    expect(awake(s, 'drama')).toBe(false);
    s.quests.done.event_1 = 0;
    expect(awake(s, 'drama')).toBe(true);
  });

  it('keeps Drama Drops and decisions away until their quest', () => {
    const s = guidedGame(0, 3);
    lineAt(s, 'event_1');
    expect(dramaShare(s, { ...computeMods(s), dramaLevel: 3 })).toBe(0);
    // Before the decision quest, nothing that needs an answer can fire.
    s.quests.done.second_team = 0;
    for (let i = 0; i < 30; i++) fireRandomEvent(s, ctxFor(s));
    expect(s.events.pending).toHaveLength(0);
  });

  it('fires a decision, not news, while the decision quest is live', () => {
    const s = guidedGame(0, 3);
    s.cash = 1e9;
    s.ops.streamer.owned = 30;
    unlockGame(s, 'rocket');
    refreshMarket(s, new Rng(s), { scoutLuck: 0, marketSize: 12 });
    for (const l of [...s.market.listings]) signListing(s, l.player.id, computeMods(s));
    lineAt(s, 'event_1');
    fillQuests(s);
    expect(s.quests.active.map((q) => q.id)).toEqual(['event_1']);
    expect(fireRandomEvent(s, ctxFor(s))).not.toBeNull();
    expect(s.events.pending).toHaveLength(1);
  });

  it('makes the drop quest pay a plain prize, and the Invitational quest bring the invite', () => {
    const s = guidedGame(0, 4);
    lineAt(s, 'drop_1');
    fillQuests(s);
    expect(catchHypeDrop(s)?.outcome).toBe('prize');
    const t = guidedGame(0, 4);
    lineAt(t, 'tourney_1');
    fillQuests(t);
    expect(t.quests.active.map((q) => q.id)).toEqual(['tourney_1']);
    expect(catchHypeDrop(t)?.outcome).toBe('tournament');
    expect(t.events.invitation).not.toBeNull();
  });

  it('moves house quietly until the House tab is open', () => {
    const s = guidedGame(0, 1);
    delete s.sections.house;
    s.roomSeen = 0;
    s.earnedRun = 1e9;
    const events: string[] = [];
    const off = subscribe((e) => events.push(e.type));
    checkHouseMove(s);
    off();
    expect(events).not.toContain('house');
    expect(s.roomSeen).toBeGreaterThan(0);
  });

  it('spends trophies only once the Trophies tab is open', () => {
    const s = guidedGame(0, 1);
    s.ops.grinder.owned = 1;
    s.trophies = 5;
    delete s.sections.achievements;
    expect(levelUpOperation(s, 'grinder')).toBe(false);
    s.sections.achievements = 0;
    expect(levelUpOperation(s, 'grinder')).toBe(true);
  });

  it('opens merch with its quest, at its fan count', () => {
    const s = guidedGame(0, 1);
    lineAt(s, 'grinders_10');
    s.fansRun = MERCH_UNLOCK_FANS;
    expect(isMerchUnlocked(s)).toBe(false);
    lineAt(s, 'merch_1');
    fillQuests(s);
    expect(isMerchUnlocked(s)).toBe(true);
  });
});

describe('quests that credit what already happened', () => {
  it('counts a title won before the line arrives, in the first run only', () => {
    const s = guidedGame(0, 1);
    s.stats.seasonTitles = 1;
    lineAt(s, 'title_1');
    updateQuests(s);
    const q = s.quests.active.find((a) => a.id === 'title_1')!;
    expect(q.credited).toBe(true);
    expect(q.ready).toBe(true);

    const later = foundedGame(0, 1);
    later.prestige.runs = 1;
    later.stats.orgsSold = 1;
    later.stats.seasonTitles = 1;
    lineAt(later, 'title_1');
    fillQuests(later);
    const again = later.quests.active.find((a) => a.id === 'title_1')!;
    expect(questProgress(later, again).complete).toBe(false);
  });

  it('asks again for a quick action done earlier, such as filling the crowd', () => {
    expect(QUEST_MAP.get('crowd_1')!.credit).toBeFalsy();
    expect(QUEST_MAP.get('gear_1')!.credit).toBeFalsy();
  });

  it('gives the merch quest only for a line with a design on it', () => {
    const s = guidedGame(0, 1);
    s.fansRun = MERCH_UNLOCK_FANS;
    s.cash = 1e9;
    lineAt(s, 'merch_1');
    fillQuests(s);
    unlockProduct(s, 'tee');
    updateQuests(s);
    expect(s.quests.active[0].ready).toBe(false);
    const design = addDesign(s, generateDesign(new Rng(s), 16, 'Test'))!;
    setLineDesign(s, 'tee', design);
    updateQuests(s);
    expect(s.quests.active[0].ready).toBe(true);
  });
});

describe('quest actions', () => {
  it('counts a bench player started by hand, not a substitution', () => {
    const s = foundedGame(0, 2);
    s.cash = 1e9;
    unlockGame(s, 'rocket');
    refreshMarket(s, new Rng(s), { scoutLuck: 0, marketSize: 12 });
    for (const l of [...s.market.listings].filter((x) => x.player.gameId === 'rocket')) signListing(s, l.player.id, computeMods(s));
    const team = s.teams.rocket;
    const sub = team.bench[0];
    expect(sub).toBeDefined();
    const starter = team.lineup.findIndex((id) => id !== null);
    expect(startPlayer(s, 'rocket', sub, starter)).toBe(true);
    expect(s.stats.lineupMoves).toBe(1);
    // Swapping two starters is not bringing someone off the bench.
    expect(startPlayer(s, 'rocket', team.lineup[0]!, 1)).toBe(true);
    expect(s.stats.lineupMoves).toBe(1);
  });

  it('finds a selling line at its sweet spot, and not at the default price', () => {
    const s = foundedGame(0, 1);
    s.fansRun = MERCH_UNLOCK_FANS;
    s.cash = 1e9;
    unlockProduct(s, 'tee');
    const design = addDesign(s, generateDesign(new Rng(s), 16, 'Plain'))!;
    setLineDesign(s, 'tee', design);
    const line = s.merch.lines.tee;
    const priceQuest = QUEST_MAP.get('merch_price')!;
    // A new line starts at x1, which is outside the sweet spot, so the quest asks for a real move.
    expect(line.price).toBe(1);
    expect(inSweetSpot(s, line)).toBe(false);
    expect(priceQuest.metric(s)).toBe(0);
    const target = [optimalPrice(false), optimalPrice(true)].find((p) => (setLinePrice(s, 'tee', p), inSweetSpot(s, line)));
    expect(target).toBeDefined();
    expect(priceQuest.metric(s)).toBe(1);
  });
});

describe('quest tools', () => {
  it("Scout's choice puts a pinned star on the market once it is open", () => {
    const s = foundedGame(0, 1);
    s.quests.tools.scout_choice = 1;
    updateMarket(s, new Rng(s), { scoutLuck: 0, marketSize: 0 });
    const star = s.market.listings[0];
    expect(star.player.rarity).toBe('star');
    expect(s.market.pinned).toContain(star.player.id);
    expect(s.quests.tools.scout_choice).toBeUndefined();
  });

  it('a Sponsor meeting brings a brand from the highest tier the org qualifies for', () => {
    const s = foundedGame(0, 1);
    s.stats.sponsorsSigned = 1;
    s.fansRun = 1e9;
    for (const t of Object.values(s.teams)) t.bestTier = 10;
    s.quests.tools.sponsor_meeting = 1;
    refreshOffers(s, new Rng(s));
    const meeting = s.sponsors.offers.find((o) => o.meeting);
    expect(meeting).toBeDefined();
    expect(meeting!.tier).toBe(Math.max(...s.sponsors.offers.map((o) => o.tier)));
    expect(signOffer(s, meeting!.id, computeMods(s)).ok).toBe(true);
  });

  it('a PR shield buries the next harmful Drama Drop', () => {
    const s = foundedGame(0, 1);
    s.quests.tools.pr_shield = 1;
    let shielded = false;
    for (let i = 0; i < 40 && !shielded; i++) {
      s.drops.active.push({ id: s.nextId++, kind: 'drama', x: 0.5, y: 0.5, spawnedAt: s.time, expiresAt: s.time + 10, chain: 0 });
      shielded = clickDrop(s, s.drops.active[s.drops.active.length - 1].id, ctxFor(s))?.outcome === 'shielded';
    }
    expect(shielded).toBe(true);
    expect(s.quests.tools.pr_shield).toBeUndefined();
  });

  it('a Wildcard invite turns the next Hype Drop into an invite', () => {
    const s = foundedGame(0, 1);
    s.quests.tools.wildcard_invite = 1;
    expect(catchHypeDrop(s)?.outcome).toBe('tournament');
    expect(s.quests.tools.wildcard_invite).toBeUndefined();
  });

  it('the Trend tip has the next trend ready a rotation early', () => {
    const s = foundedGame(0, 1);
    const rng = new Rng(s);
    rotateTrend(s, rng, false, { trendLengthMult: 1 });
    const next = s.merch.nextTrend;
    expect(next).toBeDefined();
    rotateTrend(s, rng, false, { trendLengthMult: 1 });
    expect(s.merch.trend).toBe(next);
  });
});

describe('an org from the old quest line', () => {
  it('keeps the perks it was paid and carries on from where it was', () => {
    const s = foundedGame(0, 1);
    s.prestige.runs = 1;
    // Old line: Branch out paid the prize perk at index 1, Business empire (gone now) paid +5% income.
    s.quests.done = { grinders_10: 1, gear_1: 2, crowd_1: 3, upgrades_3: 4, scout_1: 5, drop_1: 6, staff_1: 7, plan_1: 8, second_team: 9, ops_100: 10 };
    s.quests.picks = { grinders_10: 0, second_team: 1, staff_1: 0, ops_100: 1 };
    s.quests.active = [{ id: 'level_10', base: 0, ready: false }];
    migrateQuestLine(s);
    const effects = questPerkEffects(s);
    expect(effects).toContainEqual({ kind: 'opMult', op: 'grinder', mult: 2 });
    expect(effects).toContainEqual({ kind: 'prizeMult', mult: 1.1 });
    expect(effects).toContainEqual({ kind: 'globalPct', pct: 0.05 });
    // Hire help paid cash then; today it pays a perk, which the old claim must not grant.
    expect(effects).not.toContainEqual({ kind: 'staffCostMult', mult: 0.9 });
    expect(s.quests.active).toEqual([]);
    // Quests new to the line before Branch out count as done, so the line does not go back.
    for (const id of ['title_1', 'trophies_1', 'lineup_1']) expect(s.quests.done[id], id).toBeDefined();
    fillQuests(s);
    const next = QUESTS.findIndex((q) => q.id === s.quests.active[0]?.id);
    expect(next).toBeGreaterThan(QUESTS.findIndex((q) => q.id === 'second_team'));
  });

  it('runs once, on load, and never on a new org', () => {
    const s = guidedGame(0, 1);
    s.ops.grinder.owned = 10;
    fillQuests(s);
    expect(claimQuest(s, 'grinders_10', 0, { cps: 1, fansPerSec: 1 }, new Rng(s))).toBe(true);
    expect(s.guides.questline2).toBe(true);
  });
});

describe('a quest announced as done', () => {
  it('stays claimable even if its condition slips afterwards', () => {
    const s = foundedGame(0, 1);
    s.fansRun = MERCH_UNLOCK_FANS;
    s.cash = 1e9;
    unlockProduct(s, 'tee');
    setLineDesign(s, 'tee', addDesign(s, generateDesign(new Rng(s), 16, 'Plain'))!);
    s.quests.active = [{ id: 'merch_price', base: 0, ready: false }];
    for (const p of [optimalPrice(false), optimalPrice(true)]) {
      setLinePrice(s, 'tee', p);
      if (inSweetSpot(s, s.merch.lines.tee)) break;
    }
    updateQuests(s);
    expect(s.quests.active[0].ready).toBe(true);
    // The price drifts off the sweet spot (say, the trend changed) before the player claims.
    setLinePrice(s, 'tee', 3);
    expect(claimQuest(s, 'merch_price', 0, { cps: 1, fansPerSec: 1 }, new Rng(s))).toBe(true);
  });
});
