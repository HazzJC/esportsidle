/**
 * The guided first run: the first win's bonus, the quest line that opens each system in turn, the
 * three snack deals for the first sponsorship, the tools staff bring with their first hire, house
 * moves, the billed fixture on every team card and the props in each team's room.
 */
import { describe, expect, it } from 'vitest';
import { GAMES } from '../src/data/games';
import { QUESTS } from '../src/data/quests';
import { BRAND_MAP, CATEGORY_INFO, STARTER_DEALS, brandPerk } from '../src/data/sponsors';
import { STAFF } from '../src/data/staff';
import { FIRST_WIN_BONUS } from '../src/data/tutorial';
import { subscribe, type GameEvent } from '../src/engine/bus';
import { computeMods, computeRates } from '../src/engine/economy';
import { signDraftPick } from '../src/engine/draft';
import { DROP_QUEST_WAIT, fillQuests, questLineWait, strictQuestLine, updateQuests } from '../src/engine/quests';
import { SECTION_BREATHER, sectionOpen, updateSections } from '../src/engine/sections';
import { Rng } from '../src/engine/rng';
import { BASE_SPONSOR_SLOTS } from '../src/engine/economy';
import { refreshOffers, signOffer, sponsorBonuses } from '../src/engine/sponsors';
import { bulkAmount, bulkAmounts, checkHouseMove, hasQol, roomLevel } from '../src/engine/staff';
import { createNewGame } from '../src/engine/state';
import { createTeam, playMatch } from '../src/engine/teams';
import { updateTutorial } from '../src/engine/tutorial';
import { GAME_SCREEN_IDS, gameScreenSvg } from '../src/ui/gameArt';
import { ROOM_PROP_GAMES, ROOM_SIGN_GAMES, roomFloorBackground, roomPropSvg, roomSignSvg, roomWallBackground } from '../src/ui/roomArt';
import { foundedGame } from './fixtures';

describe('the first win', () => {
  it('pays its bonus once, as the tutorial moves past the match step', () => {
    const s = createNewGame(0, 1);
    s.cash = 100;
    signDraftPick(s, s.draft![0].player.id, computeMods(s));
    updateTutorial(s);
    expect(s.tutorial.step).toBe('match');
    const before = s.cash;
    s.stats.matchesWon = 1;
    updateTutorial(s);
    expect(s.tutorial.step).toBe('rest');
    expect(s.cash - before).toBe(FIRST_WIN_BONUS);
    expect(s.tutorial.firstWinPaid).toBe(true);
    // Never twice, even if the step came round again.
    s.tutorial.step = 'match';
    updateTutorial(s);
    expect(s.cash - before).toBe(FIRST_WIN_BONUS);
  });
});

describe('the first-run quest line', () => {
  const doneUpTo = (s: ReturnType<typeof foundedGame>, id: string) => {
    for (const q of QUESTS) {
      if (q.id === id) break;
      s.quests.done[q.id] = 0;
    }
  };

  it('is strict in the first run only', () => {
    const s = foundedGame(0, 1);
    expect(strictQuestLine(s)).toBe(true);
    s.prestige.runs = 1;
    s.stats.orgsSold = 1;
    expect(strictQuestLine(s)).toBe(false);
  });

  it('passes over a quest that waits on chance, and comes back for it', () => {
    const s = foundedGame(0, 1);
    doneUpTo(s, 'rival_1');
    s.rival = null;
    fillQuests(s);
    // The line moves past the rival quest and waits on the next one, which needs two signings.
    expect(questLineWait(s)?.quest.id).toBe('sell_player');
    s.rival = { name: 'Cloud Nein', wins: 0, losses: 0, streak: 0, since: 0, heat: 0 };
    fillQuests(s);
    expect(s.quests.active.map((q) => q.id)).toEqual(['rival_1']);
  });

  it('passes over anything not yet available after a sale', () => {
    const s = foundedGame(0, 1);
    s.prestige.runs = 1;
    s.stats.orgsSold = 1;
    doneUpTo(s, 'design_shirt');
    s.sections = {};
    s.fansRun = 0;
    fillQuests(s);
    expect(s.quests.active.map((q) => q.id)).toEqual(['promotion_1']);
  });

  it('says what it waits for when no quest can be offered', () => {
    const s = foundedGame(0, 1);
    doneUpTo(s, 'sponsor_1');
    s.sections = {};
    s.fansRun = 10;
    fillQuests(s);
    const wait = questLineWait(s);
    expect(wait?.quest.id).toBe('sponsor_1');
    expect(wait?.text).toMatch(/fans/);
    expect(wait?.target).toBe(1_000);
  });

  it('brings the next Hype Drop forward when the drop quest is offered', () => {
    const s = foundedGame(0, 1);
    doneUpTo(s, 'drop_1');
    s.drops.nextAt = s.time + 500;
    fillQuests(s);
    expect(s.quests.active.map((q) => q.id)).toEqual(['drop_1']);
    expect(s.drops.nextAt).toBeLessThanOrEqual(s.time + DROP_QUEST_WAIT);
  });

  it('waits for the last new tab to be seen, then a breather, before opening the next one', () => {
    const s = foundedGame(0, 1);
    doneUpTo(s, 'staff_1');
    s.stats.playersSigned = 5;
    for (const id of Object.keys(s.sections)) s.sectionsSeen[id] = true;
    delete s.sections.staff;
    // The Market opened with its quest a moment ago, and nobody has looked at it yet.
    s.time = 1_000;
    s.sections.market = 990;
    s.sectionsSeen.market = false;
    fillQuests(s);
    expect(s.quests.active).toEqual([]);
    expect(questLineWait(s)?.pace).toEqual({ reason: 'visit', section: 'market' });
    expect(questLineWait(s)?.text).toMatch(/Market/);
    // Seen, but it only opened 10 seconds ago: a breather first, with progress for the console's meter.
    s.sectionsSeen.market = true;
    fillQuests(s);
    expect(s.quests.active).toEqual([]);
    const wait = questLineWait(s);
    expect(wait?.pace?.reason).toBe('breather');
    expect(wait?.value).toBe(10);
    expect(wait?.target).toBe(SECTION_BREATHER);
    // Once the breather has passed, Staff's quest comes in and opens its tab.
    s.time = 990 + SECTION_BREATHER;
    updateQuests(s);
    updateSections(s);
    expect(s.quests.active.map((q) => q.id)).toEqual(['staff_1']);
    expect(sectionOpen(s, 'staff')).toBe(true);
  });

  it('never paces a quest whose tab is already open, as after skipping the tutorial', () => {
    const s = foundedGame(0, 1);
    doneUpTo(s, 'staff_1');
    s.stats.playersSigned = 5;
    s.time = 1_000;
    s.sections.market = 990;
    fillQuests(s);
    expect(s.quests.active.map((q) => q.id)).toEqual(['staff_1']);
  });

  it('puts the hype quest before the upgrades quest', () => {
    const ids = QUESTS.map((q) => q.id);
    expect(ids.indexOf('crowd_1')).toBeLessThan(ids.indexOf('upgrades_3'));
    expect(ids.indexOf('sponsor_1')).toBeLessThan(ids.indexOf('sponsor_goal'));
    expect(ids.indexOf('second_team')).toBeLessThan(ids.indexOf('decor_1'));
  });
});

describe('the first sponsorship', () => {
  it('starts with one slot', () => {
    expect(BASE_SPONSOR_SLOTS).toBe(1);
    expect(computeMods(foundedGame(0, 1)).sponsorSlots).toBe(1);
  });

  it('offers the three snack deals, each with its own perk, until the first is signed', () => {
    const s = foundedGame(0, 1);
    s.fansRun = 2_000;
    refreshOffers(s, new Rng(s));
    expect(s.sponsors.offers.map((o) => o.brandId)).toEqual(STARTER_DEALS.map((d) => d.brandId));
    expect(new Set(s.sponsors.offers.map((o) => o.goal.kind)).size).toBe(3);
    const perks = STARTER_DEALS.map((d) => brandPerk(BRAND_MAP.get(d.brandId)!).perk(1));
    expect(new Set(perks).size).toBe(3);
    for (const d of STARTER_DEALS) expect(BRAND_MAP.get(d.brandId)?.category).toBe('snacks');

    const doritoes = s.sponsors.offers.find((o) => o.brandId === 'doritoes')!;
    expect(signOffer(s, doritoes.id, computeMods(s)).ok).toBe(true);
    // The other two starters leave, and ordinary offers come in on the next refresh.
    expect(s.sponsors.offers.some((o) => o.starter)).toBe(false);
    refreshOffers(s, new Rng(s));
    expect(s.sponsors.offers.some((o) => o.starter)).toBe(false);
    // The brand's own perk applies: fans, not the snack category's morale.
    const bonus = sponsorBonuses(s);
    expect(bonus.stats.map((x) => x.stat)).toEqual(['fans']);
    expect(CATEGORY_INFO.snacks.stats?.[0].stat).toBe('morale');
  });
});

describe('staff tools', () => {
  it('give each of several roles a different tool', () => {
    const tools = STAFF.flatMap((d) => (d.qol ? [d.qol.id] : []));
    expect(new Set(tools).size).toBe(tools.length);
    expect(tools).toEqual(expect.arrayContaining(['advisor', 'buy10', 'buy100', 'buyMax', 'sell', 'buyAll']));
  });

  it('open bulk buying, Max and selling with the first hire of each role', () => {
    const s = foundedGame(0, 1);
    s.settings.buyAmount = -1;
    expect(bulkAmounts(s)).toEqual([1]);
    expect(bulkAmount(s)).toBe(1);
    expect(hasQol(s, 'sell')).toBe(false);
    s.staff.chef = 1;
    expect(bulkAmounts(s)).toEqual([1, 10]);
    s.staff.analyst = 1;
    expect(bulkAmount(s)).toBe(-1);
    s.staff.agent = 1;
    expect(hasQol(s, 'sell')).toBe(true);
    s.staff.coach = 1;
    expect(hasQol(s, 'advisor')).toBe(true);
  });
});

describe('moving house', () => {
  it('announces each move once, and never replays moves when an old save loads', () => {
    const s = foundedGame(0, 1);
    const events: GameEvent[] = [];
    const off = subscribe((e) => events.push(e));
    try {
      s.earnedRun = 2e5;
      checkHouseMove(s);
      expect(events.filter((e) => e.type === 'house')).toHaveLength(0);
      expect(s.roomSeen).toBe(roomLevel(s));
      s.earnedRun = 2e8;
      checkHouseMove(s);
      checkHouseMove(s);
      expect(events.filter((e) => e.type === 'house')).toEqual([{ type: 'house', level: 2 }]);
      // A sale starts again in the garage, silently.
      s.earnedRun = 0;
      checkHouseMove(s);
      expect(s.roomSeen).toBe(0);
    } finally {
      off();
    }
  });
});

describe('fixtures', () => {
  it('bills the next opponent before the match and plays that match against them', () => {
    const s = foundedGame(0, 1);
    const team = s.teams.smash;
    expect(createTeam('rocket').nextOpponent?.name).toBeTruthy();
    const billed = team.nextOpponent!;
    const ev = computeRates(s).teams.smash;
    const record = playMatch(s, team, ev, computeMods(s), new Rng(s));
    if (!billed.rival) expect(record.opponent).toBe(billed.name);
    expect(team.nextOpponent?.name).toBeTruthy();
  });
});

describe('team rooms', () => {
  it('dress every game with a sign, a screen and four props, and every house with a wall and a floor', () => {
    expect(new Set(ROOM_PROP_GAMES)).toEqual(new Set(GAMES.map((g) => g.id)));
    for (const g of GAMES) {
      for (const slot of ['wallL', 'wallR', 'floorL', 'floorR'] as const) {
        const svg = roomPropSvg(g.id, slot, g.color);
        expect(svg.length, `${g.id} ${slot}`).toBeGreaterThan(80);
        expect(svg).not.toMatch(/undefined|NaN|<script|\son[a-z]+=|javascript:/i);
      }
    }
    expect(new Set(ROOM_SIGN_GAMES)).toEqual(new Set(GAMES.map((g) => g.id)));
    expect(new Set(GAME_SCREEN_IDS)).toEqual(new Set(GAMES.map((g) => g.id)));
    for (const g of GAMES) {
      const sign = roomSignSvg(g.id, g.color, g.name);
      expect(sign, g.id).toMatch(/^<svg viewBox="0 0 \d+ \d+"/);
      expect(sign, g.id).toContain(g.id === 'hearthstoned' || g.id === 'lanes' ? g.name : g.name.toUpperCase());
      expect(gameScreenSvg(g.id, g.color).length, g.id).toBeGreaterThan(80);
      for (const art of [sign, gameScreenSvg(g.id, g.color)]) expect(art, g.id).not.toMatch(/undefined|NaN|<script|\son[a-z]+=|javascript:/i);
    }
    expect(roomSignSvg('lanes', '#8b5cff', 'Tom & <Jerry>')).toContain('Tom &amp; &lt;Jerry&gt;');
    for (let i = 0; i < 6; i++) {
      for (const art of [roomWallBackground(i, '#4fd1ff'), roomFloorBackground(i, '#4fd1ff')]) {
        expect(art).toMatch(/^url\("data:image\/svg\+xml,/);
        expect(decodeURIComponent(art)).not.toMatch(/undefined|NaN/);
      }
    }
  });
});
