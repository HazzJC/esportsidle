import { describe, expect, it } from 'vitest';
import { getGame } from '../src/data/games';
import { buildAgenda } from '../src/engine/agenda';
import { computeMods, computeRates } from '../src/engine/economy';
import { generatePlayer } from '../src/engine/players';
import { LEGACY_DIVISOR } from '../src/engine/prestige';
import { Rng } from '../src/engine/rng';
import { foundedGame } from './fixtures';
import { unlockGame } from '../src/engine/teams';
import type { GameState, Player } from '../src/engine/types';

function agenda(s: GameState) {
  const mods = computeMods(s);
  return buildAgenda(s, mods, computeRates(s, mods));
}

function player(id: string, gameId: string, role: number, seed = 1, rarity: 'rookie' | 'star' = 'rookie'): Player {
  const p = generatePlayer(new Rng({ rng: seed }), { id, gameId, time: 0, rarity });
  p.role = role;
  return p;
}

/** A Rocket Soccar team with every slot filled on-role. */
function fullRocket(): GameState {
  const s = foundedGame(0, 4);
  s.cash = 1e6;
  unlockGame(s, 'rocket');
  s.cash = 0;
  for (let i = 0; i < 3; i++) {
    const p = player(`r${i}`, 'rocket', i, 10 + i);
    s.players[p.id] = p;
    s.teams.rocket.lineup[i] = p.id;
  }
  s.market.listings = [];
  return s;
}

describe('HQ agenda', () => {
  it('offers to found the next team as soon as it is affordable', () => {
    const s = foundedGame(0, 4);
    s.cash = getGame('rocket').unlockCost;
    const growth = agenda(s).growth;
    expect(growth.title).toContain('Rocket Soccar');
    expect(growth.action?.target).toEqual({ kind: 'unlockGame', gameId: 'rocket' });
  });

  it('flags empty lineup slots and points at the right market', () => {
    const s = foundedGame(0, 4);
    s.cash = 1e6;
    unlockGame(s, 'rocket');
    const concern = agenda(s).concern!;
    expect(concern.title).toMatch(/Rocket Soccar has 3 empty slots/);
    expect(concern.action?.target).toEqual({ kind: 'tab', tab: 'market', gameId: 'rocket' });
  });

  it('flags a player out of position', () => {
    const s = fullRocket();
    s.players.r0.role = 2;
    expect(agenda(s).concern?.title).toMatch(/off-role/);
  });

  it('flags an announced retirement with what the player would sell for', () => {
    const s = fullRocket();
    s.players.r1.retiring = true;
    const concern = agenda(s).concern!;
    expect(concern.title).toMatch(/retires after this season/);
    expect(concern.action?.target).toEqual({ kind: 'player', id: 'r1' });
  });

  it('has no concern when every team is healthy and competitive', () => {
    const s = fullRocket();
    for (const t of Object.values(s.teams)) t.plan = 'balanced';
    // Make both teams comfortably competitive at their tier.
    for (const p of Object.values(s.players)) for (const k of Object.keys(p.stats) as (keyof typeof p.stats)[]) p.stats[k] = 90;
    expect(agenda(s).concern).toBeNull();
  });

  it('suggests selling once pending legacy at least doubles it', () => {
    const s = fullRocket();
    s.earnedTotal = LEGACY_DIVISOR;
    const opp = agenda(s).opportunity!;
    expect(opp.title).toMatch(/Sell the org/);
    expect(opp.action?.target).toEqual({ kind: 'tab', tab: 'legacy' });
  });

  it('points out an affordable player who would lift a team', () => {
    const s = foundedGame(0, 4);
    s.cash = 1e6;
    unlockGame(s, 'rocket');
    s.market.listings = [{ player: player('star', 'rocket', 0, 99, 'star'), price: 500 }];
    const opp = agenda(s).opportunity!;
    expect(opp.title).toMatch(/A suitable Striker is available|A suitable .* is available/);
    expect(opp.action?.target).toEqual({ kind: 'tab', tab: 'market', gameId: 'rocket' });
  });

  it('ignores market players the org cannot afford', () => {
    const s = foundedGame(0, 4);
    s.cash = 1e6;
    unlockGame(s, 'rocket');
    s.cash = 100;
    s.market.listings = [{ player: player('star', 'rocket', 0, 99, 'star'), price: 500 }];
    expect(agenda(s).opportunity?.title ?? '').not.toMatch(/suitable/);
  });
});
