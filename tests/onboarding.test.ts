import { describe, expect, it } from 'vitest';
import { QUESTS, QUEST_MAP } from '../src/data/quests';
import { FIRST_PLAYER_PRICE } from '../src/data/tutorial';
import { clickLogo } from '../src/engine/clicker';
import { customiseDraft, signDraftPick } from '../src/engine/draft';
import { computeMods, computeRates } from '../src/engine/economy';
import { advance } from '../src/engine/game';
import { signListing } from '../src/engine/market';
import { buyOperation } from '../src/engine/operations';
import { completeOnboarding } from '../src/engine/org';
import { LEGACY_DIVISOR, sellOrg } from '../src/engine/prestige';
import { QUEST_SLOTS, claimQuest, fillQuests, nextQuest, questPerkLabels, questPerkSources, questProgress, updateQuests } from '../src/engine/quests';
import { Rng } from '../src/engine/rng';
import { decodeSave, encodeSave } from '../src/engine/save';
import { sectionOpen, updateSections } from '../src/engine/sections';
import { hireStaff } from '../src/engine/staff';
import { createNewGame } from '../src/engine/state';
import { CALM_START_SECONDS, calmStart, operationsOpen, skipTutorial, updateTutorial } from '../src/engine/tutorial';
import type { GameState } from '../src/engine/types';
import { foundedGame } from './fixtures';

const ctx = (s: GameState) => {
  const r = computeRates(s);
  return { cps: r.cpsNoBuffs, fansPerSec: r.fansPerSec };
};

/** Clicks the logo until the first player is affordable, as the tutorial asks. */
function clickToFirstPlayer(s: GameState): number {
  let clicks = 0;
  while (s.cash < FIRST_PLAYER_PRICE && clicks < 1000) {
    clickLogo(s);
    clicks++;
  }
  return clicks;
}

describe('founding the org', () => {
  it('sets the name, colour and logo on the first screen', () => {
    const s = createNewGame(0, 1);
    completeOnboarding(s, '  Night   Owls ', '#34d399', { shape: 'hex', mark: 'flame' });
    expect(s.org.name).toBe('Night Owls');
    expect(s.settings.uiAccent).toBe('#34d399');
    expect(s.org.primary).toBe('#34d399');
    expect(s.org.emblem).toEqual({ shape: 'hex', mark: 'flame' });
    expect(s.settings.onboarded).toBe(true);
  });

  it('ignores a logo it does not know', () => {
    const s = createNewGame(0, 1);
    completeOnboarding(s, 'Org', '#34d399', { shape: 'blob', mark: 'nope' } as never);
    expect(s.org.emblem).toEqual({ shape: 'shield', mark: 'initials' });
  });
});

describe('the first player', () => {
  it('starts with no team, no player and one rookie prospect for $25', () => {
    const s = createNewGame(0, 1);
    expect(Object.keys(s.players)).toHaveLength(0);
    expect(Object.keys(s.teams)).toHaveLength(0);
    expect(s.draft).toHaveLength(1);
    expect(s.draft![0].price).toBe(FIRST_PLAYER_PRICE);
    expect(s.draft![0].player.rarity).toBe('rookie');
    expect(s.tutorial.step).toBe('click');
  });

  it('is 25 clicks away at the start', () => {
    const s = createNewGame(0, 1);
    expect(clickToFirstPlayer(s)).toBe(25);
  });

  it('can be renamed and restyled before signing', () => {
    const s = createNewGame(0, 1);
    const p = s.draft![0].player;
    expect(customiseDraft(s, { tag: '  Ace  ', first: 'Sam', last: 'Rivera', look: { hair: 3, skin: 2 } })).toBe(true);
    expect([p.tag, p.first, p.last, p.look.hair, p.look.skin]).toEqual(['Ace', 'Sam', 'Rivera', 3, 2]);
    // Blank names are ignored rather than wiping the player's name.
    customiseDraft(s, { tag: '   ' });
    expect(p.tag).toBe('Ace');
  });

  it('becomes the founding player, founds the team and closes the draft', () => {
    const s = createNewGame(0, 1);
    customiseDraft(s, { tag: 'Ace' });
    const id = s.draft![0].player.id;
    expect(signDraftPick(s, id, computeMods(s))).toMatchObject({ ok: false });
    s.cash = FIRST_PLAYER_PRICE;
    expect(signDraftPick(s, id, computeMods(s)).ok).toBe(true);
    expect(s.cash).toBe(0);
    expect(s.teams.smash.lineup[0]).toBe('founder');
    expect(s.players.founder).toMatchObject({ tag: 'Ace', founder: true, cut: 0 });
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
    s.cash = 0;

    clickToFirstPlayer(s);
    updateTutorial(s);
    expect(s.tutorial.step).toBe('draft');

    signDraftPick(s, s.draft![0].player.id, computeMods(s));
    updateTutorial(s);
    expect(s.tutorial.step).toBe('match');

    advance(s, 30);
    expect(s.tutorial.step).toBe('grinder');
    expect(operationsOpen(s)).toBe(true);
    s.cash = 1e6;
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

describe('a calm start', () => {
  it('holds random events back for the first minutes of a new org', () => {
    const s = createNewGame(0, 1);
    skipTutorial(s);
    expect(calmStart(s)).toBe(true);
    s.cash = 1e6;
    signDraftPick(s, s.draft![0].player.id, computeMods(s));
    advance(s, CALM_START_SECONDS - 10);
    expect(s.drops.active).toHaveLength(0);
    expect(s.stats.eventsSeen).toBe(0);
    expect(s.stats.illnesses + s.stats.injuries + s.stats.burnouts).toBe(0);
    expect(s.rival).toBeNull();
    expect(calmStart(s)).toBe(true);
    advance(s, 20);
    expect(calmStart(s)).toBe(false);
  });

  it('never applies to established orgs or later runs', () => {
    expect(calmStart(foundedGame(0, 1))).toBe(false);
    const s = createNewGame(0, 1);
    skipTutorial(s);
    s.prestige.runs = 1;
    expect(calmStart(s)).toBe(false);
  });
});

describe('tabs that open as the org grows', () => {
  it('starts with only the basics open', () => {
    const s = createNewGame(0, 1);
    updateSections(s);
    for (const id of ['hq', 'teams', 'stats', 'options']) expect(sectionOpen(s, id), id).toBe(true);
    for (const id of ['market', 'house', 'staff', 'sponsors', 'studio', 'roster', 'legacy']) expect(sectionOpen(s, id), id).toBe(false);
  });

  it('opens House with the second team, Staff with the third and Sponsors at 1,000 fans', () => {
    const s = createNewGame(0, 1);
    skipTutorial(s);
    s.cash = 1e9;
    signDraftPick(s, s.draft![0].player.id, computeMods(s));
    updateSections(s);
    expect(sectionOpen(s, 'teams')).toBe(true);
    expect(sectionOpen(s, 'market')).toBe(true);
    expect(sectionOpen(s, 'house')).toBe(false);

    s.teams.rocket = { ...s.teams.smash, gameId: 'rocket' };
    updateSections(s);
    expect(sectionOpen(s, 'house')).toBe(true);
    expect(sectionOpen(s, 'staff')).toBe(false);
    s.stats.playersSigned = 5;
    expect(hireStaff(s, 'coach', 1)).toBe(0);

    s.teams.counter = { ...s.teams.smash, gameId: 'counter' };
    updateSections(s);
    expect(sectionOpen(s, 'staff')).toBe(true);
    expect(hireStaff(s, 'coach', 1)).toBe(1);

    expect(sectionOpen(s, 'sponsors')).toBe(false);
    s.fansRun = 1_000;
    updateSections(s);
    expect(sectionOpen(s, 'sponsors')).toBe(true);
  });

  it('stays open once opened, even after selling the org', () => {
    const s = foundedGame(0, 1);
    expect(sectionOpen(s, 'staff')).toBe(true);
    s.earnedTotal = LEGACY_DIVISOR;
    sellOrg(s, { charter: 'operator' });
    updateSections(s);
    expect(sectionOpen(s, 'staff')).toBe(true);
  });

  it('opens everything for orgs that were already playing before tabs locked', () => {
    const s = foundedGame(0, 1);
    s.sections = {};
    const old = { ...s, version: 4 } as unknown as Record<string, unknown>;
    delete old.sections;
    delete old.sectionsSeen;
    const back = decodeSave(encodeSave(old as never).replace(/^ESI\d+/, 'ESI4'));
    for (const id of ['house', 'staff', 'sponsors', 'studio', 'legacy']) expect(sectionOpen(back, id), id).toBe(true);
  });
});

describe('quests', () => {
  it('wait for the tutorial, then offer one at a time', () => {
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

  it('keeps perks for the run, and starts the quest line again after a sale', () => {
    const s = foundedGame(0, 1);
    s.ops.grinder.owned = 10;
    const before = computeRates(s).opUnit.grinder;
    fillQuests(s);
    expect(claimQuest(s, 'grinders_10', 0, ctx(s), new Rng(s))).toBe(true);
    expect(computeRates(s).opUnit.grinder).toBeCloseTo(before * 2);
    expect(questPerkLabels(s)).toEqual(['Ranked Grinders earn twice as much']);
    expect(questPerkSources(s)[0].quest).toBe(QUEST_MAP.get('grinders_10')!.title);
    const claimed = s.quests.claimed;
    s.earnedTotal = LEGACY_DIVISOR;
    sellOrg(s, { charter: 'operator' });
    expect(questPerkLabels(s)).toHaveLength(0);
    expect(s.quests.done).toEqual({});
    expect(s.quests.claimed).toBe(claimed);
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

  it('follows the line in order, one quest at a time', () => {
    const s = foundedGame(0, 1);
    fillQuests(s);
    expect(QUEST_SLOTS).toBe(1);
    expect(s.quests.active.map((q) => q.id)).toEqual([QUESTS[0].id]);
    expect(nextQuest(s)?.id).toBe(QUESTS[1].id);
    // Quests set aside by the old "Later" button simply rejoin the line.
    s.quests.skipped = { [QUESTS[3].id]: 0 };
    fillQuests(s);
    expect(s.quests.skipped).toEqual({});
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
    customiseDraft(s, { tag: 'Ace' });
    const back = decodeSave(encodeSave(s));
    expect(back.tutorial.step).toBe('click');
    expect(back.draft).toHaveLength(1);
    expect(back.draft![0].player.tag).toBe('Ace');
    expect(back.teams.smash).toBeUndefined();
  });

  it('turns an old three-prospect draft into the single first player', () => {
    const s = createNewGame(0, 1);
    s.draft = [...s.draft!, ...createNewGame(0, 2).draft!, ...createNewGame(0, 3).draft!];
    const back = decodeSave(encodeSave(s));
    expect(back.draft).toHaveLength(1);
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

  it('brings the founding player back after a sale, name and look intact', () => {
    const s = createNewGame(0, 1);
    s.cash = 1e6;
    customiseDraft(s, { tag: 'Ace', look: { hair: 4 } });
    expect(signDraftPick(s, s.draft![0].player.id, { benchSlots: 0 }).ok).toBe(true);
    s.earnedTotal = LEGACY_DIVISOR;
    sellOrg(s, { charter: 'operator' });
    expect(s.players.founder).toMatchObject({ tag: 'Ace' });
    expect(s.players.founder.look.hair).toBe(4);
    expect(s.teams.smash.lineup[0]).toBe('founder');
    expect(s.draft).toBeNull();
  });

  it('offers a better prospect after a sale for an org without a founder', () => {
    const s = createNewGame(0, 1);
    const listing = s.market.listings.find((l) => l.player.gameId === 'smash')!;
    s.cash = 1e6;
    expect(signListing(s, listing.player.id, computeMods(s)).ok).toBe(true);
    s.earnedTotal = LEGACY_DIVISOR;
    sellOrg(s, { charter: 'operator' });
    expect(Object.keys(s.players)).toHaveLength(0);
    expect(s.draft).toHaveLength(1);
    expect(s.draft![0].player.rarity).toBe('talent');
  });

  it('founds the team for a franchise player kept through a sale', () => {
    const s = createNewGame(0, 3);
    s.cash = 1e6;
    const listing = s.market.listings.find((l) => l.player.gameId === 'smash')!;
    expect(signListing(s, listing.player.id, computeMods(s)).ok).toBe(true);
    const star = s.players[listing.player.id];
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
