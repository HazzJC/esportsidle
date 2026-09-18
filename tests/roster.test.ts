import { describe, expect, it } from 'vitest';
import { computeMods } from '../src/engine/economy';
import { signListing } from '../src/engine/market';
import { generatePlayer } from '../src/engine/players';
import { previewAssign, previewSigning } from '../src/engine/roster';
import { Rng } from '../src/engine/rng';
import { createNewGame } from '../src/engine/state';
import { evaluateTeam, unlockGame } from '../src/engine/teams';
import type { GameState, Player } from '../src/engine/types';

const CTX = { cpsNoBuffs: 0, incomeBuff: 1, fansMult: 1 };

function rocketGame(): GameState {
  const s = createNewGame(0, 4);
  s.cash = 1e12;
  unlockGame(s, 'rocket');
  return s;
}

function player(id: string, gameId: string, role: number, rarity: 'rookie' | 'star' = 'star', seed = 1): Player {
  const p = generatePlayer(new Rng({ rng: seed }), { id, gameId, time: 0, rarity });
  p.role = role;
  return p;
}

/** Puts a player straight onto a team slot, bypassing the market. */
function place(s: GameState, p: Player, slot: number | 'bench'): void {
  s.players[p.id] = p;
  if (slot === 'bench') s.teams[p.gameId].bench.push(p.id);
  else s.teams[p.gameId].lineup[slot] = p.id;
}

describe('roster previews', () => {
  it('never change the real team', () => {
    const s = rocketGame();
    place(s, player('a', 'rocket', 0, 'rookie'), 0);
    s.teams.rocket.chemistry = 0.8;
    const before = JSON.stringify({ team: s.teams.rocket, ids: Object.keys(s.players) });
    const mods = computeMods(s);
    previewSigning(s, player('b', 'rocket', 1), mods);
    previewAssign(s, 'rocket', 'a', 2, mods);
    expect(JSON.stringify({ team: s.teams.rocket, ids: Object.keys(s.players) })).toBe(before);
  });

  it('match what actually happens when the player is signed', () => {
    const s = rocketGame();
    const mods = computeMods(s);
    const recruit = player('b', 'rocket', 1);
    const preview = previewSigning(s, recruit, mods);
    s.market.listings = [{ player: recruit, price: 1 }];
    expect(signListing(s, 'b', mods).ok).toBe(true);
    const actual = evaluateTeam(s, s.teams.rocket, mods, CTX);
    expect(preview.after.win).toBeCloseTo(actual.winChance, 10);
    expect(preview.after.rating).toBeCloseTo(actual.rating, 10);
  });

  it('show a signing into an empty slot, its role and the win chance it adds', () => {
    const s = rocketGame();
    const pv = previewSigning(s, player('b', 'rocket', 1), computeMods(s));
    expect(pv.placement).toBe('lineup');
    expect(pv.slot).toBe(1);
    expect(pv.onRole).toBe(true);
    expect(pv.after.win).toBeGreaterThan(pv.before.win);
  });

  it('say when a bench signing would be better than a current starter', () => {
    const s = rocketGame();
    place(s, player('r0', 'rocket', 0, 'rookie', 2), 0);
    place(s, player('r1', 'rocket', 1, 'rookie', 3), 1);
    place(s, player('r2', 'rocket', 2, 'rookie', 4), 2);
    const pv = previewSigning(s, player('star', 'rocket', 1, 'star', 5), computeMods(s));
    expect(pv.placement).toBe('bench');
    expect(pv.couldStart).not.toBeNull();
    expect(pv.couldStart!.after.win).toBeGreaterThan(pv.before.win);
  });

  it('report a full roster and a missing team', () => {
    const s = rocketGame();
    for (let i = 0; i < 3; i++) place(s, player(`r${i}`, 'rocket', i, 'rookie', 10 + i), i);
    place(s, player('bench', 'rocket', 0, 'rookie', 20), 'bench');
    expect(previewSigning(s, player('x', 'rocket', 0), computeMods(s)).placement).toBe('full');
    expect(previewSigning(s, player('y', 'counter', 0), computeMods(s)).placement).toBe('noTeam');
  });

  it('flag off-role assignments and whether the starter swaps or sits', () => {
    const s = rocketGame();
    place(s, player('a', 'rocket', 0, 'star', 6), 0);
    place(s, player('b', 'rocket', 1, 'star', 7), 1);
    place(s, player('sub', 'rocket', 1, 'star', 8), 'bench');
    const mods = computeMods(s);

    const offRole = previewAssign(s, 'rocket', 'a', 1, mods)!;
    expect(offRole.onRole).toBe(false);
    expect(offRole.displaced).toBe(s.players.b.tag);
    expect(offRole.displacedTo).toBe('swap');

    const fromBench = previewAssign(s, 'rocket', 'sub', 1, mods)!;
    expect(fromBench.onRole).toBe(true);
    expect(fromBench.displacedTo).toBe('bench');
    // Any change of lineup costs some chemistry.
    s.teams.rocket.chemistry = 1;
    expect(previewAssign(s, 'rocket', 'sub', 1, mods)!.after.chemistry).toBeLessThan(1);
  });
});
