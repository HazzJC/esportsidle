import LZString from 'lz-string';
import { describe, expect, it } from 'vitest';
import { winChance } from '../src/data/leagues';
import { DEFAULT_KIT, DEFAULT_TONE, LEGACY_KIT } from '../src/data/palette';
import { computeRates } from '../src/engine/economy';
import { generatePlayer } from '../src/engine/players';
import { LEGACY_DIVISOR, sellOrg } from '../src/engine/prestige';
import { Rng } from '../src/engine/rng';
import { decodeSave, encodeSave } from '../src/engine/save';
import { createBaseState, createNewGame } from '../src/engine/state';
import { createTeam, endSeason } from '../src/engine/teams';
import type { TeamEval } from '../src/engine/types';
import { foundedGame } from './fixtures';

/** Re-labels a current save as an older version so it runs through the migrations. */
function asVersion(text: string, version: number): string {
  return text.replace(/^ESI\d+/, `ESI${version}`);
}

describe('v2 -> v3 migration', () => {
  it('moves saves still wearing the original neon kit onto the new default', () => {
    const s = foundedGame(0, 1);
    s.org.primary = LEGACY_KIT.primary;
    s.org.secondary = LEGACY_KIT.secondary;
    const loaded = decodeSave(asVersion(encodeSave(s), 2));
    expect(loaded.org.primary).toBe(DEFAULT_KIT.primary);
    expect(loaded.org.secondary).toBe(DEFAULT_KIT.secondary);
  });

  it('leaves any other kit alone', () => {
    const s = foundedGame(0, 1);
    s.org.primary = LEGACY_KIT.primary;
    s.org.secondary = '#123456';
    const loaded = decodeSave(asVersion(encodeSave(s), 2));
    expect(loaded.org.primary).toBe(LEGACY_KIT.primary);
    expect(loaded.org.secondary).toBe('#123456');
  });

  it('gives old teams no kit of their own and asks old players to pick a tone', () => {
    const s = foundedGame(0, 1) as unknown as { teams: Record<string, Record<string, unknown>>; settings: Record<string, unknown> };
    delete s.teams.smash.kit;
    delete s.settings.onboarded;
    delete s.settings.uiAccent;
    const loaded = decodeSave(asVersion(encodeSave(s as never), 2));
    expect(loaded.teams.smash.kit).toBeNull();
    expect(loaded.settings.onboarded).toBe(false);
    expect(loaded.settings.uiAccent).toBe(DEFAULT_TONE);
  });
});

describe('v5 -> v6 save migration', () => {
  /** A save written before the reorder: the three pairs still hold their old places. */
  function v5Save() {
    const s = foundedGame(0, 7) as unknown as Record<string, unknown> & ReturnType<typeof foundedGame>;
    s.ops.cafe = { owned: 80, highest: 90, level: 3, produced: 1e9 };
    s.ops.bootcamp = { owned: 20, highest: 20, level: 0, produced: 5e8 };
    s.ops.arena = { owned: 7, highest: 7, level: 1, produced: 1e10 };
    s.ops.broadcast = { owned: 0, highest: 0, level: 0, produced: 0 };
    s.upgrades.op_cafe_0 = 5;
    s.upgrades.op_cafe_2 = 6;
    s.upgrades.collab_cafe = 7;
    s.unlockedUpgrades.op_arena_0 = 8;
    s.achievements.op_cafe_50 = 9;
    const raw = JSON.parse(JSON.stringify(s));
    raw.version = 5;
    return `ESI5.${LZString.compressToBase64(JSON.stringify(raw))}`;
  }

  it("moves each org's buildings, upgrades and achievements with their old position", () => {
    const s = decodeSave(v5Save());
    // The 80 cafés sat in the 4th slot, which is now the Bootcamp House.
    expect(s.ops.bootcamp).toEqual({ owned: 80, highest: 90, level: 3, produced: 1e9 });
    expect(s.ops.cafe).toEqual({ owned: 20, highest: 20, level: 0, produced: 5e8 });
    expect(s.ops.broadcast.owned).toBe(7);
    expect(s.ops.arena.owned).toBe(0);
    expect(s.upgrades.op_bootcamp_0).toBe(5);
    expect(s.upgrades.op_bootcamp_2).toBe(6);
    expect(s.upgrades.collab_bootcamp).toBe(7);
    expect(s.upgrades.op_cafe_0).toBeUndefined();
    expect(s.unlockedUpgrades.op_broadcast_0).toBe(8);
    expect(s.achievements.op_bootcamp_50).toBe(9);
    expect(s.achievements.op_cafe_50).toBeUndefined();
  });

  it('keeps income the same across the migration', () => {
    const before = foundedGame(0, 7);
    before.ops.cafe.owned = 80;
    before.ops.bootcamp.owned = 20;
    // What those buildings earned in their old slots is what the swapped ones earn now.
    const expected = foundedGame(0, 7);
    expected.ops.bootcamp.owned = 80;
    expected.ops.cafe.owned = 20;
    const raw = JSON.parse(JSON.stringify(before));
    raw.version = 5;
    const migrated = decodeSave(`ESI5.${LZString.compressToBase64(JSON.stringify(raw))}`);
    expect(computeRates(migrated).cpsNoBuffs).toBeCloseTo(computeRates(expected).cpsNoBuffs);
  });
});

describe('v1 saves', () => {
  it('upgrades a v1 save with no players by creating the founder', () => {
    const v1 = createBaseState(0, 1) as unknown as Record<string, unknown>;
    delete v1.players;
    delete v1.teams;
    delete v1.games;
    delete v1.market;
    v1.version = 1;
    const text = encodeSave(v1 as never).replace(/^ESI\d+/, 'ESI1');
    const s = decodeSave(text);
    expect(s.players.founder).toBeDefined();
    expect(s.teams.smash.lineup[0]).toBe('founder');
    expect(s.games.smash.unlocked).toBe(true);
  });
});

describe('founder migration and save healing', () => {
  it('migrates v4 draft player p1 to immortal founder', () => {
    const s = createNewGame(0, 1);
    const p1 = generatePlayer(new Rng({ rng: 1 }), { id: 'p1', gameId: 'smash', time: 0, rarity: 'rookie' });
    p1.tag = 'OriginalAce';
    s.players['p1'] = p1;
    s.teams.smash = {
      ...createTeam('smash'),
      lineup: ['p1'],
    };
    s.draft = null;
    s.tutorial.step = 'done';
    s.version = 4;

    const encoded = encodeSave(s).replace(/^ESI\d+/, 'ESI4');
    const decoded = decodeSave(encoded);

    // Verify founder is migrated
    expect(decoded.players.founder).toBeDefined();
    expect(decoded.players.founder.founder).toBe(true);
    expect(decoded.players.founder.cut).toBe(0);
    expect(decoded.players.founder.tag).toBe('OriginalAce');
    expect(decoded.teams.smash.lineup[0]).toBe('founder');
    expect(decoded.players.p1).toBeUndefined();
    expect(decoded.draft).toBeNull();

    // Verify founder survives aging
    decoded.players.founder.age = 31;
    const ev = { gameId: 'smash', active: true, winChance: 0.5, winPrize: 10, lossPrize: 1, fansWin: 5, cut: 0, filled: 1, available: 1, interval: 15, cps: 0, fansPerSec: 0, rating: 10, opponent: 10, stakes: 1 } as unknown as TeamEval;
    for (let season = 0; season < 10; season++) {
      endSeason(decoded, decoded.teams.smash, ev, new Rng({ rng: season }));
    }
    expect(decoded.players.founder).toBeDefined();
    expect(decoded.stats.playersRetired).toBe(0);

    // Verify founder survives prestige
    decoded.earnedTotal = LEGACY_DIVISOR;
    sellOrg(decoded);
    expect(decoded.players.founder).toBeDefined();
    expect(decoded.players.founder.tag).toBe('OriginalAce');
    expect(decoded.teams.smash.lineup[0]).toBe('founder');
    expect(decoded.draft).toBeNull();
  });

  it('restores lost founder for org that finished tutorial', () => {
    const s = createNewGame(0, 1);
    s.tutorial.step = 'done';
    s.draft = null;
    s.teams.smash = {
      ...createTeam('smash'),
      lineup: [null],
      seasonNumber: 5,
    };
    s.players = {}; // Founder was deleted/retired
    s.stats.playersSigned = 5;

    const decoded = decodeSave(encodeSave(s));
    expect(decoded.players.founder).toBeDefined();
    expect(decoded.players.founder.founder).toBe(true);
    expect(decoded.teams.smash.lineup[0]).toBe('founder');
    expect(decoded.draft).toBeNull();
  });

  it('re-attaches orphaned players in s.players to team lineup/bench', () => {
    const s = foundedGame(0, 1);
    const p = generatePlayer(new Rng({ rng: 5 }), { id: 'p2', gameId: 'smash', time: 0, rarity: 'rookie' });
    s.players['p2'] = p;
    // p2 is neither in lineup nor bench of smash
    expect(s.teams.smash.lineup.includes('p2')).toBe(false);
    expect(s.teams.smash.bench.includes('p2')).toBe(false);

    const decoded = decodeSave(encodeSave(s));
    expect(decoded.players.p2).toBeDefined();
    // Since lineup was occupied by founder, p2 should be added to bench
    expect(decoded.teams.smash.bench).toContain('p2');
  });

  it('ensures founder has founder: true and cut: 0 even if save had corrupted flags', () => {
    const s = foundedGame(0, 1);
    s.players.founder.founder = false as unknown as boolean;
    s.players.founder.cut = 0.15;

    const decoded = decodeSave(encodeSave(s));
    expect(decoded.players.founder.founder).toBe(true);
    expect(decoded.players.founder.cut).toBe(0);
  });
});

describe('saves from before the first-player draft', () => {
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
});
