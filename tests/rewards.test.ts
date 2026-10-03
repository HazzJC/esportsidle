import LZString from 'lz-string';
import { describe, expect, it } from 'vitest';
import { OPERATIONS } from '../src/data/operations';
import { QUESTS } from '../src/data/quests';
import { PRICE_INCOME_SECONDS, baseIncome, updatePriceIncome } from '../src/engine/baseIncome';
import { addBuff } from '../src/engine/buffs';
import { CROWD_BUFF_ID, HYPE_MAX, HYPE_PER_CLICK, chainReward, clickLogo } from '../src/engine/clicker';
import { DONATION_CASH_SHARE, PRIZE_CASH_SHARE, applyDropOutcome, calmDrama, hypeTrainPayout, prCleanupCost } from '../src/engine/drops';
import { computeMods, computeRates } from '../src/engine/economy';
import { advance } from '../src/engine/game';
import { REROLL_BASE_SECONDS, REROLL_MIN_COST, REROLL_RESET_SECONDS, rerollCost, rerollMarket, rerollResetsIn, rerollsInWindow } from '../src/engine/market';
import { FINISH_ART_LEVELS, finishName, finishSalesMult } from '../src/data/merch';
import { merchQualityCost, upgradeMerchQuality, unlockProduct } from '../src/engine/merch';
import { claimQuest, describeReward } from '../src/engine/quests';
import { DROP_CAP_ANCHORS, DROP_ROLL_MIN, dropCapMinutes, dropMinutes, dropPayout, dropRoll, earlyGame, earlyRewardLimit, limitReward } from '../src/engine/rewards';
import { Rng } from '../src/engine/rng';
import { decodeSave, encodeSave } from '../src/engine/save';
import { SAVE_VERSION } from '../src/engine/state';
import type { GameState } from '../src/engine/types';
import { UPGRADES } from '../src/data/upgrades';
import { foundedGame } from './fixtures';

const HOUR = 3600;

function ctxFor(s: GameState) {
  const mods = computeMods(s);
  return { rng: new Rng(s), mods, rates: computeRates(s, mods) };
}

describe('how much a drop can pay, by time into the run', () => {
  it('follows the bands: 1-6 minutes in the first hour, 6-15, 15-30, 30-45, then ever more slowly', () => {
    expect(dropCapMinutes(0)).toBe(1);
    expect(dropCapMinutes(0.5)).toBeCloseTo(3.5, 9);
    expect(dropCapMinutes(1)).toBe(6);
    expect(dropCapMinutes(1.5)).toBeCloseTo(10.5, 9);
    expect(dropCapMinutes(2)).toBe(15);
    expect(dropCapMinutes(2.5)).toBeCloseTo(22.5, 9);
    expect(dropCapMinutes(3)).toBe(30);
    expect(dropCapMinutes(4)).toBe(45);
    expect(dropCapMinutes(4)).toBe(DROP_CAP_ANCHORS[DROP_CAP_ANCHORS.length - 1][1]);
    // Past the last band it keeps growing, but more slowly each hour.
    const steps = [4, 5, 6, 8, 12].map((h) => dropCapMinutes(h + 1) - dropCapMinutes(h));
    for (const step of steps) expect(step).toBeGreaterThan(0);
    for (let i = 1; i < steps.length; i++) expect(steps[i]).toBeLessThan(steps[i - 1]);
  });

  it('rolls a bell curve leaning towards good: never worthless, mostly 60-80% of the cap, sometimes the top', () => {
    const rng = new Rng({ rng: 123 });
    const rolls = Array.from({ length: 4000 }, () => dropRoll(rng));
    expect(Math.min(...rolls)).toBeGreaterThanOrEqual(DROP_ROLL_MIN);
    expect(Math.max(...rolls)).toBe(1);
    const mean = rolls.reduce((a, b) => a + b, 0) / rolls.length;
    expect(mean).toBeGreaterThan(0.62);
    expect(mean).toBeLessThan(0.78);
    // Leans good rather than bad: more drops above the middle of the range than below it.
    const above = rolls.filter((r) => r > 0.625).length;
    expect(above).toBeGreaterThan(rolls.length * 0.6);
    const topShare = rolls.filter((r) => r >= 0.95).length / rolls.length;
    expect(topShare).toBeGreaterThan(0.05);
    expect(topShare).toBeLessThan(0.35);
  });

  it('keeps an early drop to a few minutes of income, so it never skips tiers of buildings', () => {
    const s = foundedGame(0, 3);
    s.ops.grinder.owned = 200;
    s.ops.streamer.owned = 60;
    s.cash = 0;
    const cps = computeRates(s).cpsNoBuffs;
    const rng = new Rng({ rng: 1 });
    for (let i = 0; i < 300; i++) {
      const minutes = dropMinutes(s, rng);
      expect(minutes).toBeLessThanOrEqual(dropCapMinutes(0) + 1e-9);
      expect(dropPayout(s, minutes, cps, 0.02) / cps).toBeLessThanOrEqual(60 + 13 / cps + 1e-6);
    }
  });

  it('pays the greater of minutes of income and a small share of the bank: spenders still get paid, savers get a slice', () => {
    const s = foundedGame(0, 3);
    const cps = 1000;
    s.time = 2 * HOUR;
    s.runStartTime = 0;
    s.cash = 0;
    const spent = dropPayout(s, 10, cps, PRIZE_CASH_SHARE);
    expect(spent).toBe(10 * 60 * cps);
    s.cash = 1e9;
    const saver = dropPayout(s, 10, cps, PRIZE_CASH_SHARE);
    expect(saver).toBeGreaterThan(spent);
    expect(saver).toBeCloseTo(Math.min(1e9 * PRIZE_CASH_SHARE, 2 * dropCapMinutes(2) * 60 * cps), 6);
    // A vault does not break the run: the bank part stops at twice the cap.
    s.cash = 1e30;
    expect(dropPayout(s, 10, cps, PRIZE_CASH_SHARE)).toBe(2 * 15 * 60 * cps);
    // Nothing is ever worthless, even with no income at all.
    s.cash = 0;
    expect(dropPayout(s, 0, 0, PRIZE_CASH_SHARE)).toBe(13);
  });

  it('pays Prize Pools the same way when the drop is caught, scaled to the point in the run', () => {
    const early = foundedGame(0, 4);
    early.ops.grinder.owned = 300;
    early.cash = 0;
    const late = foundedGame(0, 4);
    late.ops.grinder.owned = 300;
    late.cash = 0;
    late.time = 5 * HOUR;
    late.runStartTime = 0;
    const gain = (s: GameState) => {
      const before = s.earnedRun;
      const rates = computeRates(s);
      const rng = new Rng({ rng: 99 });
      for (let i = 0; i < 40; i++) applyDropOutcome(s, 'prize', { rng, mods: computeMods(s), rates });
      return { each: (s.earnedRun - before) / 40, cps: rates.cpsNoBuffs };
    };
    const a = gain(early);
    const b = gain(late);
    expect(a.each / a.cps / 60).toBeLessThan(dropCapMinutes(0) + 0.5);
    expect(a.each / a.cps / 60).toBeGreaterThan(DROP_ROLL_MIN * dropCapMinutes(0) * 0.9);
    expect(b.each / b.cps / 60).toBeGreaterThan(dropCapMinutes(5) * 0.4);
    expect(b.each / b.cps / 60).toBeLessThanOrEqual(dropCapMinutes(5) + 0.5);
  });

  it('caps a Hype Train by the same scale', () => {
    const s = foundedGame(0, 6);
    s.ops.grinder.owned = 300;
    s.time = 0.5 * HOUR;
    const ctx = ctxFor(s);
    const cps = ctx.rates.cpsNoBuffs;
    const first = hypeTrainPayout(s, ctx, 1);
    expect(first).toBeGreaterThanOrEqual(6 * cps - 1);
    const late = hypeTrainPayout(s, ctx, 30);
    expect(late).toBeLessThanOrEqual(1.5 * dropCapMinutes(0.5) * 60 * cps + 1);
  });

  it('adds Fan Donations to the drop pool once Cult Following is owned, paying more with each later fame upgrade', () => {
    const s = foundedGame(0, 8);
    s.ops.grinder.owned = 300;
    s.time = 3 * HOUR;
    s.cash = 0;
    const pay = () => {
      const before = s.earnedRun;
      const ctx = ctxFor(s);
      const rng = new Rng({ rng: 5 });
      for (let i = 0; i < 30; i++) applyDropOutcome(s, 'donations', { ...ctx, rng });
      return (s.earnedRun - before) / 30;
    };
    const one = pay();
    expect(one).toBeGreaterThan(0);
    s.upgrades.fame_9 = 0;
    s.upgrades.fame_10 = 0;
    expect(pay()).toBeGreaterThan(one);
    expect(DONATION_CASH_SHARE).toBeGreaterThan(PRIZE_CASH_SHARE);
  });
});

describe('the early-game guard', () => {
  it('holds while a tab is locked, and lets a reward fund one new building but not several', () => {
    const s = foundedGame(0, 3);
    s.sections = {};
    expect(earlyGame(s)).toBe(true);
    const first = OPERATIONS.find((op) => s.ops[op.id].highest === 0)!;
    const limit = earlyRewardLimit(s);
    expect(limit).toBeGreaterThanOrEqual(first.baseCost);
    expect(limit).toBeLessThan(first.baseCost * 1.2);
    expect(limitReward(s, {}, 1e30)).toBe(limit);
    expect(limitReward(s, {}, 5)).toBe(5);
  });

  it('lifts once every tab is open', () => {
    const s = foundedGame(0, 3);
    expect(earlyGame(s)).toBe(false);
    expect(earlyRewardLimit(s)).toBe(Infinity);
  });

  it('limits quest cash by the same rule and tells the player the true amount', () => {
    const s = foundedGame(0, 3);
    s.sections = {};
    s.ops.grinder.highest = 1;
    const q = QUESTS.find((d) => d.rewards.some((r) => r.kind === 'cash'))!;
    const rewardIndex = q.rewards.findIndex((r) => r.kind === 'cash');
    const huge = { cps: 1e30, fansPerSec: 1, state: s };
    expect(describeReward(q.rewards[rewardIndex], huge)).not.toContain('e+30');
    s.quests.active = [{ id: q.id, base: 0, ready: true }];
    const before = s.earnedRun;
    claimQuest(s, q.id, rewardIndex, huge, new Rng(s));
    expect(s.earnedRun - before).toBeLessThanOrEqual(earlyRewardLimit(s) + 1);
  });
});

describe('base income', () => {
  it('starts at the live income, then follows it slowly in both directions', () => {
    const s = foundedGame(0, 3);
    expect(s.priceIncome).toBe(0);
    expect(baseIncome(s, { cpsNoBuffs: 50 })).toBe(50);
    updatePriceIncome(s, 100, 1);
    expect(s.priceIncome).toBe(100);
    updatePriceIncome(s, 1000, 60);
    expect(s.priceIncome).toBeGreaterThan(100);
    expect(s.priceIncome).toBeLessThan(400);
    updatePriceIncome(s, 1000, PRICE_INCOME_SECONDS * 10);
    expect(s.priceIncome).toBeGreaterThan(990);
    updatePriceIncome(s, 0, 30);
    expect(s.priceIncome).toBeGreaterThan(900);
  });

  it('is not moved by hype: a crowd, a frenzy or a scandal changes income, not prices', () => {
    const s = foundedGame(0, 3);
    s.ops.grinder.owned = 200;
    const calm = computeRates(s);
    addBuff(s, { id: 'x', name: 'x', icon: 'x', tone: 'good', desc: '', duration: 60, effects: [{ kind: 'income', mult: 49 }] });
    const hyped = computeRates(s);
    expect(hyped.cps).toBeGreaterThan(calm.cps * 40);
    expect(hyped.cpsNoBuffs).toBeCloseTo(calm.cpsNoBuffs, 9);
    updatePriceIncome(s, hyped.cpsNoBuffs, 0.1);
    expect(baseIncome(s, hyped)).toBeCloseTo(calm.cpsNoBuffs, 9);
  });

  it('follows the game while it runs, and prices the PR clean-up in it', () => {
    const s = foundedGame(0, 3);
    s.ops.grinder.owned = 400;
    advance(s, 20);
    expect(s.priceIncome).toBeGreaterThan(0);
    const rates = computeRates(s);
    expect(prCleanupCost(baseIncome(s, rates))).toBe(Math.ceil(Math.max(1000, s.priceIncome * 600)));
    s.cash = 0;
    expect(calmDrama(s, baseIncome(s, rates))).toBe(false);
    s.cash = 1e15;
    expect(calmDrama(s, baseIncome(s, rates))).toBe(true);
  });
});

describe('market rerolls', () => {
  it('costs 10 seconds of base income to start, doubling with every reroll in a row', () => {
    expect(rerollCost(1000, 0)).toBe(1000 * REROLL_BASE_SECONDS);
    expect(rerollCost(1000, 1)).toBe(2 * 1000 * REROLL_BASE_SECONDS);
    expect(rerollCost(1000, 5)).toBe(32 * 1000 * REROLL_BASE_SECONDS);
    expect(rerollCost(0, 0)).toBe(REROLL_MIN_COST);
    expect(rerollCost(0, 3)).toBe(8 * REROLL_MIN_COST);
  });

  it('goes back to the starting price after five quiet minutes, and each reroll restarts the wait', () => {
    const s = foundedGame(0, 3);
    s.cash = 1e12;
    const rng = new Rng(s);
    const mods = { scoutLuck: 0, marketSize: 0 };
    expect(rerollsInWindow(s)).toBe(0);
    expect(rerollMarket(s, rng, mods, 1000)).toBe(true);
    expect(s.cash).toBe(1e12 - 10_000);
    s.time += 120;
    expect(rerollsInWindow(s)).toBe(1);
    expect(rerollMarket(s, rng, mods, 1000)).toBe(true);
    expect(s.cash).toBe(1e12 - 10_000 - 20_000);
    // 200 seconds after the second one is not five minutes since the first, but is not yet since the second.
    s.time += REROLL_RESET_SECONDS - 100;
    expect(rerollsInWindow(s)).toBe(2);
    expect(rerollResetsIn(s)).toBeCloseTo(100, 6);
    s.time += 101;
    expect(rerollsInWindow(s)).toBe(0);
    expect(rerollResetsIn(s)).toBe(0);
    const before = s.cash;
    expect(rerollMarket(s, rng, mods, 1000)).toBe(true);
    expect(before - s.cash).toBe(10_000);
  });

  it('refuses when the bank cannot cover it, and charges nothing', () => {
    const s = foundedGame(0, 3);
    s.cash = 5;
    expect(rerollMarket(s, new Rng(s), { scoutLuck: 0, marketSize: 0 }, 1000)).toBe(false);
    expect(s.cash).toBe(5);
    expect(rerollsInWindow(s)).toBe(0);
  });

  it('treats a save from before the window as a fresh start', () => {
    const s = foundedGame(0, 3);
    s.market.rerolls = 40;
    s.market.lastRerollAt = undefined;
    expect(rerollsInWindow(s)).toBe(0);
  });
});

describe('the crowd', () => {
  it('lets a chain go on adding time after its volume tops out', () => {
    const s = foundedGame(0, 3);
    const twenty = chainReward(s, 20, 1);
    const forty = chainReward(s, 40, 1);
    expect(forty.mult).toBe(twenty.mult);
    expect(forty.duration).toBeGreaterThan(twenty.duration * 1.9);
  });

  it('keeps filling the meter during a crowd, so the next one is ready the moment this one ends', () => {
    const s = foundedGame(0, 3);
    for (let i = 0; i < Math.ceil(HYPE_MAX / HYPE_PER_CLICK); i++) clickLogo(s);
    expect(s.buffs.some((b) => b.id === CROWD_BUFF_ID)).toBe(true);
    expect(s.hype).toBe(0);
    for (let i = 0; i < 30; i++) clickLogo(s);
    expect(s.hype).toBeGreaterThan(0);
    expect(s.hype).toBeLessThanOrEqual(HYPE_MAX);
    for (let i = 0; i < 200; i++) clickLogo(s);
    expect(s.hype).toBe(HYPE_MAX);
    expect(s.stats.crowdsTotal).toBe(1);
    // The crowd ends; the very next click starts another.
    s.buffs = s.buffs.filter((b) => b.id !== CROWD_BUFF_ID);
    clickLogo(s);
    expect(s.stats.crowdsTotal).toBe(2);
  });
});

describe('catching a good buff twice', () => {
  const spec = (duration: number, extend?: 'half') => ({ id: 'frenzy', name: 'f', icon: 'zap', tone: 'good' as const, desc: '', duration, effects: [{ kind: 'income' as const, mult: 7 }], extend });

  it('adds half the new duration on top of what is left, so a repeat catch is never wasted', () => {
    const s = foundedGame(0, 3);
    s.time = 100;
    const b = addBuff(s, spec(77, 'half'));
    expect(b.endsAt).toBe(177);
    s.time = 110; // 67 s left
    addBuff(s, spec(77, 'half'));
    expect(b.endsAt).toBe(177 + 38.5);
    expect(s.buffs).toHaveLength(1);
  });

  it('keeps the old rule for anything that does not ask for it', () => {
    const s = foundedGame(0, 3);
    s.time = 100;
    const b = addBuff(s, spec(77));
    s.time = 110;
    addBuff(s, spec(77));
    expect(b.endsAt).toBe(187);
  });

  it('is what the Hype Drop buffs ask for', () => {
    const s = foundedGame(0, 3);
    s.ops.grinder.owned = 100;
    s.time = 200;
    const ctx = ctxFor(s);
    applyDropOutcome(s, 'frenzy', ctx);
    const first = s.buffs.find((x) => x.id === 'frenzy')!.endsAt;
    applyDropOutcome(s, 'frenzy', ctx);
    expect(s.buffs.find((x) => x.id === 'frenzy')!.endsAt).toBeGreaterThan(first);
  });
});

describe('click upgrades', () => {
  it('start with flat cash per click, then a small share of income', () => {
    const clicks = UPGRADES.filter((u) => u.group === 'click');
    expect(clicks).toHaveLength(12);
    expect(clicks.slice(0, 4).every((u) => u.effects[0].kind === 'clickAdd')).toBe(true);
    expect(clicks.slice(4).every((u) => u.effects[0].kind === 'clickCpsPct')).toBe(true);
    const pct = clicks.slice(4).reduce((n, u) => n + (u.effects[0].kind === 'clickCpsPct' ? u.effects[0].pct : 0), 0);
    expect(pct).toBeLessThan(0.05);
  });

  it('make the first one count when income is small, and add to the click itself', () => {
    const s = foundedGame(0, 3);
    s.ops.grinder.owned = 20;
    const before = computeRates(s).click;
    s.upgrades.click_0 = 0;
    const after = computeRates(s).click;
    const flat = UPGRADES.find((u) => u.id === 'click_0')!.effects[0];
    expect(flat.kind).toBe('clickAdd');
    expect(after - before).toBeCloseTo(flat.kind === 'clickAdd' ? flat.add : 0, 9);
    // 50 per click is more than the whole of a 20-grinder org's income per second at that point.
    expect(after).toBeGreaterThan(computeRates(s).cpsNoBuffs * 5);
  });
});

describe('merch finish', () => {
  it('goes on past the named finishes, each Masterwork level smaller than a named one', () => {
    expect(finishName(0)).toBe('Bulk stock');
    expect(finishName(FINISH_ART_LEVELS)).toBe('Hall of Fame edition');
    expect(finishName(FINISH_ART_LEVELS + 3)).toBe('Masterwork +3');
    const named = finishSalesMult(FINISH_ART_LEVELS) - finishSalesMult(FINISH_ART_LEVELS - 1);
    const master = finishSalesMult(FINISH_ART_LEVELS + 1) - finishSalesMult(FINISH_ART_LEVELS);
    expect(master).toBeGreaterThan(0);
    expect(master).toBeLessThan(named);
  });

  it('keeps selling the next level, at double the price, with no last one', () => {
    const s = foundedGame(0, 3);
    s.fansRun = 1e9;
    s.cash = 1e30;
    expect(unlockProduct(s, 'tee')).toBe(true);
    s.merch.lines.tee.quality = FINISH_ART_LEVELS;
    const cost = merchQualityCost(s, 'tee');
    expect(Number.isFinite(cost)).toBe(true);
    expect(upgradeMerchQuality(s, 'tee')).toBe(true);
    expect(s.merch.lines.tee.quality).toBe(FINISH_ART_LEVELS + 1);
    expect(merchQualityCost(s, 'tee')).toBe(cost * 2);
  });
});

describe('saves from before Elo and the reroll window', () => {
  it('gives every team an Elo at its tier, and keeps the reroll count', () => {
    const s = foundedGame(0, 3);
    s.teams.smash.tier = 3;
    const raw = JSON.parse(JSON.stringify(s));
    delete raw.teams.smash.elo;
    delete raw.priceIncome;
    raw.version = 8;
    raw.market.rerolls = 7;
    const loaded = decodeSave(`ESI8.${LZString.compressToBase64(JSON.stringify(raw))}`);
    expect(loaded.version).toBe(SAVE_VERSION);
    expect(loaded.teams.smash.elo).toBeGreaterThan(1000 + 301 * 2.9);
    expect(loaded.teams.smash.elo).toBeLessThan(1000 + 301 * 3.1);
    expect(loaded.priceIncome).toBe(0);
    expect(rerollsInWindow(loaded)).toBe(0);
    expect(decodeSave(encodeSave(loaded)).teams.smash.elo).toBe(loaded.teams.smash.elo);
  });
});
