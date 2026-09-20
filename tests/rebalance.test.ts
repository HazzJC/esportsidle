import { describe, expect, it } from 'vitest';
import { STAFF_MAP, STAFF_SOFT_CAP } from '../src/data/staff';
import { autoRoles } from '../src/engine/automation';
import {
  CHAIN_MAX,
  CHAIN_SECONDS_PER_BUBBLE,
  CROWD_DURATION,
  CROWD_MULT,
  HYPE_MAX,
  HYPE_PER_CLICK,
  applyChain,
  chainBubble,
  chainReward,
  clickLogo,
  crowdDuration,
  hypeEndurance,
} from '../src/engine/clicker';
import { cabinetIncomeMult, cabinetMarginalGain, computeMods } from '../src/engine/economy';
import { geometricPrice } from '../src/engine/pricing';
import { generatePlayer } from '../src/engine/players';
import { Rng } from '../src/engine/rng';
import { staffPower } from '../src/engine/staff';
import { addToTeam, ensureTeam } from '../src/engine/teams';
import { foundedGame } from './fixtures';

describe('hype', () => {
  it('fills in about fifty clicks', () => {
    const s = foundedGame(0, 2);
    const clicks = Math.ceil(HYPE_MAX / HYPE_PER_CLICK);
    expect(clicks).toBeLessThanOrEqual(50);
    let crowd = false;
    for (let i = 0; i < clicks; i++) crowd = clickLogo(s).crowd || crowd;
    expect(crowd).toBe(true);
  });

  it('keeps the crowd longer for an org with history behind it', () => {
    const fresh = foundedGame(0, 2);
    const veteran = foundedGame(0, 2);
    veteran.stats.clicksTotal = 100_000;
    veteran.fans = 5e6;
    expect(hypeEndurance(fresh)).toBeCloseTo(1, 2);
    expect(hypeEndurance(veteran)).toBeGreaterThan(1.8);
    expect(crowdDuration(veteran, 1)).toBeGreaterThan(crowdDuration(fresh, 1) * 1.8);
  });
});

describe('the click chain', () => {
  it('shrinks and quickens with every bubble, then holds a floor', () => {
    const first = chainBubble(1);
    const eighth = chainBubble(8);
    const last = chainBubble(CHAIN_MAX);
    expect(eighth.size).toBeLessThan(first.size);
    expect(eighth.life).toBeLessThan(first.life);
    expect(eighth.life).toBeGreaterThan(1);
    expect(last.size).toBeLessThan(eighth.size);
    expect(last.life).toBeGreaterThanOrEqual(0.6);
  });

  it('pays the chain length as the multiplier, never below a plain crowd', () => {
    const s = foundedGame(0, 2);
    expect(chainReward(s, 0, 1).mult).toBe(CROWD_MULT);
    expect(chainReward(s, 1, 1).mult).toBe(CROWD_MULT);
    expect(chainReward(s, 12, 1).mult).toBe(12);
    expect(chainReward(s, 40, 1).mult).toBe(CHAIN_MAX);
    expect(chainReward(s, 12, 1).duration).toBeGreaterThanOrEqual(12 * CHAIN_SECONDS_PER_BUBBLE);
    expect(chainReward(s, 1, 1).duration).toBeGreaterThanOrEqual(CROWD_DURATION);
  });

  it('replaces the running crowd with what the chain earned', () => {
    const s = foundedGame(0, 2);
    for (let i = 0; i < Math.ceil(HYPE_MAX / HYPE_PER_CLICK); i++) clickLogo(s);
    const plain = s.buffs.find((b) => b.id === 'crowd')!;
    expect(plain.effects[0]).toEqual({ kind: 'income', mult: CROWD_MULT });
    applyChain(s, 9, 1);
    const chained = s.buffs.find((b) => b.id === 'crowd')!;
    expect(chained.effects[0]).toEqual({ kind: 'income', mult: 9 });
    expect(s.stats.bestChain).toBe(9);
    expect(s.stats.chainPops).toBe(9);
  });
});

describe('coach and analyst scaling', () => {
  const coach = STAFF_MAP.get('coach')!;

  it('is unchanged up to the tenth hire and about half as strong by the fiftieth', () => {
    for (const n of [1, 5, STAFF_SOFT_CAP]) {
      expect(staffPower(n, 1, coach.softCapFrom), `at ${n}`).toBeCloseTo(Math.pow(n, 0.8), 6);
    }
    const at50 = staffPower(50, 1, coach.softCapFrom) / Math.pow(50, 0.8);
    expect(at50).toBeGreaterThan(0.45);
    expect(at50).toBeLessThan(0.6);
  });

  it('costs a little less to stack', () => {
    expect(coach.costGrowth).toBeLessThan(1.15);
    expect(geometricPrice(coach.baseCost, 30, 1, 1, coach.costGrowth)).toBeLessThan(geometricPrice(coach.baseCost, 30, 1, 1, 1.15));
  });

  it('leaves other staff alone', () => {
    const chef = STAFF_MAP.get('chef')!;
    expect(chef.softCapFrom).toBeUndefined();
    expect(staffPower(50, 1, chef.softCapFrom)).toBeCloseTo(Math.pow(50, 0.8), 6);
  });
});

describe('role coaching', () => {
  it('puts players on their own role when it is worth the disruption', () => {
    const s = foundedGame(0, 11);
    ensureTeam(s, 'rocket');
    const mods = computeMods(s);
    const squad = [0, 1, 2].map((role) => {
      const p = generatePlayer(new Rng({ rng: 60 + role }), { id: `r${role}`, gameId: 'rocket', time: 0 });
      p.role = role;
      s.players[p.id] = p;
      addToTeam(s, p, mods);
      return p;
    });
    const team = s.teams.rocket;
    // Put everyone in the wrong place: each plays at 85% until the coaches step in.
    team.lineup = [squad[2].id, squad[0].id, squad[1].id];
    autoRoles(s);
    expect(team.lineup).toEqual([squad[0].id, squad[1].id, squad[2].id]);
  });

  it('leaves a lineup that is already right alone', () => {
    const s = foundedGame(0, 11);
    ensureTeam(s, 'rocket');
    const mods = computeMods(s);
    for (const role of [0, 1, 2]) {
      const p = generatePlayer(new Rng({ rng: 70 + role }), { id: `q${role}`, gameId: 'rocket', time: 0 });
      p.role = role;
      s.players[p.id] = p;
      addToTeam(s, p, mods);
    }
    const team = s.teams.rocket;
    const before = [...team.lineup];
    autoRoles(s);
    expect(team.lineup).toEqual(before);
  });
});

describe('the trophy cabinet', () => {
  it('is worth nothing until Superfans turn it into income', () => {
    expect(cabinetIncomeMult(40, [])).toBe(1);
    expect(cabinetMarginalGain(40, [])).toBe(0);
  });

  it('says what one more achievement is worth', () => {
    const factors = [0.1, 0.125];
    const at40 = cabinetIncomeMult(40, factors);
    const at41 = cabinetIncomeMult(41, factors);
    expect(cabinetMarginalGain(40, factors)).toBeCloseTo(at41 / at40 - 1, 9);
    expect(cabinetMarginalGain(40, factors)).toBeGreaterThan(0);
  });
});
