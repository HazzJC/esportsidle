import { describe, expect, it } from 'vitest';
import { createNewGame } from '../src/engine/state';
import { decodeSave, encodeSave } from '../src/engine/save';
import { generatePlayer } from '../src/engine/players';
import { Rng } from '../src/engine/rng';
import { sellOrg, LEGACY_DIVISOR } from '../src/engine/prestige';
import { createTeam, endSeason } from '../src/engine/teams';
import { foundedGame } from './fixtures';
import type { TeamEval } from '../src/engine/types';

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
