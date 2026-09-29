import { describe, expect, it } from 'vitest';
import { QUESTS } from '../src/data/quests';
import {
  applyChain,
  CHAIN_MAX,
  CHAIN_SECONDS_PER_BUBBLE,
  chainBubble,
  chainReward,
  clickLogo,
  CROWD_DURATION,
  CROWD_MULT,
  crowdDuration,
  decayHype,
  HYPE_ASSIST_LEVEL,
  HYPE_MAX,
  HYPE_PER_CLICK,
  HYPE_QUEST_ID,
  hypeAssistActive,
  hypeEndurance,
} from '../src/engine/clicker';
import { foundedGame } from './fixtures';

describe('hype', () => {
  it('fills in about eighty clicks', () => {
    const s = foundedGame(0, 2);
    const clicks = Math.ceil(HYPE_MAX / HYPE_PER_CLICK);
    expect(clicks).toBeGreaterThanOrEqual(70);
    expect(clicks).toBeLessThanOrEqual(90);
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

describe('hype decay', () => {
  it('lets intermittent hype accumulate but drains it after a long pause', () => {
    const s = foundedGame(0, 3);
    for (let i = 0; i < 20; i++) clickLogo(s);
    const filled = s.hype;
    s.time += 12;
    decayHype(s, 12);
    expect(s.hype).toBeGreaterThan(filled / 2);
    clickLogo(s);
    expect(s.hype).toBeGreaterThan(filled / 2);
    s.time += 180;
    decayHype(s, 180);
    expect(s.hype).toBe(0);
  });
});

describe('hype streak assist', () => {
  it('warms the crowd up to 80% while the quest is live, and not otherwise', () => {
    const s = foundedGame(0, 31);
    expect(QUESTS.some((q) => q.id === HYPE_QUEST_ID)).toBe(true);
    s.quests.active = [{ id: HYPE_QUEST_ID, ready: false, base: 0 } as never];
    expect(hypeAssistActive(s)).toBe(true);
    s.hype = 0;
    s.lastClickTime = -1000;
    for (let i = 0; i < 200; i++) {
      s.time += 1;
      decayHype(s, 1);
    }
    expect(s.hype).toBeCloseTo(HYPE_MAX * HYPE_ASSIST_LEVEL);
    s.quests.active = [];
    for (let i = 0; i < 200; i++) {
      s.time += 1;
      decayHype(s, 1);
    }
    expect(s.hype).toBe(0);
  });
});
