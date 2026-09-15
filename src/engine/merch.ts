import { PRODUCTS, PRODUCT_MAP, TRENDS, TREND_MAP, type TrendId } from '../data/merch';
import { emit } from './bus';
import { analyzeDesign } from './designs';
import type { Rng } from './rng';
import type { GameState, MerchLine, MerchLineRate, Mods, Rates } from './types';

/** Unit production cost as a fraction of the base price. */
export const UNIT_COST = 0.4;
export const ELASTICITY = 1.6;
/** Fans are less price-sensitive when a design matches the trend. */
export const TREND_ELASTICITY = 1.3;
export const PRICE_MIN = 0.5;
export const PRICE_MAX = 3;
export const NOVELTY_SECONDS = 1800;
export const NOVELTY_FLOOR = 0.25;
export const TREND_SECONDS = 900;
export const TRENDING_THRESHOLD = 0.6;
export const TREND_BONUS = 1.25;
export const MERCH_UNLOCK_FANS = 5_000;

export function clampPrice(price: number): number {
  return Math.max(PRICE_MIN, Math.min(PRICE_MAX, Number.isFinite(price) ? price : 1));
}

function rawProfit(price: number, elasticity: number): number {
  return Math.pow(price, -elasticity) * Math.max(0, price - UNIT_COST);
}

export function optimalPrice(trending: boolean): number {
  const e = trending ? TREND_ELASTICITY : ELASTICITY;
  return (UNIT_COST * e) / (e - 1);
}

const PEAK_PROFIT = rawProfit(optimalPrice(false), ELASTICITY);

/** Profit multiplier for a price (1.0 at the optimal untrended price). */
export function priceFactor(price: number, trending: boolean): number {
  return rawProfit(clampPrice(price), trending ? TREND_ELASTICITY : ELASTICITY) / PEAK_PROFIT;
}

export function noveltyOf(line: MerchLine, time: number, mods: Pick<Mods, 'noveltyMult'>): number {
  const tau = NOVELTY_SECONDS * mods.noveltyMult;
  return Math.max(NOVELTY_FLOOR, Math.exp(-Math.max(0, time - line.launchedAt) / tau));
}

export function isMerchUnlocked(s: GameState): boolean {
  return s.fansRun >= MERCH_UNLOCK_FANS || Object.keys(s.merch.unlocked).length > 0;
}

export interface MerchEval {
  cps: number;
  lines: Record<string, MerchLineRate>;
}

export function evaluateMerch(s: GameState, mods: Mods, cpsNoBuffs: number, incomeBuff: number): MerchEval {
  const lines: Record<string, MerchLineRate> = {};
  let cps = 0;
  for (const product of PRODUCTS) {
    const line = s.merch.lines[product.id];
    if (!s.merch.unlocked[product.id] || !line?.designId) continue;
    const design = s.designs[line.designId];
    if (!design) continue;
    const appeal = analyzeDesign(design, s.merch.trend);
    const trending = appeal.trend >= TRENDING_THRESHOLD;
    const novelty = noveltyOf(line, s.time, mods);
    const pf = priceFactor(line.price, trending);
    const quality = appeal.total * appeal.total * (trending ? TREND_BONUS : 1) * novelty * pf * mods.merchMult;
    const base = cpsNoBuffs * product.cpsShare + Math.pow(1 + s.fans / 1000, 0.6) * product.basePrice * 0.05;
    const lineCps = base * quality * incomeBuff;
    const profitPerUnit = product.basePrice * Math.max(0.01, clampPrice(line.price) - UNIT_COST);
    lines[product.id] = {
      productId: product.id,
      cps: lineCps,
      unitsPerSec: lineCps / profitPerUnit,
      appeal: appeal.total,
      trending,
      novelty,
      priceFactor: pf,
    };
    cps += lineCps;
  }
  return { cps, lines };
}

export function pickTrend(rng: Rng, current: TrendId): TrendId {
  const options = TRENDS.filter((t) => t.id !== current);
  return rng.pick(options).id;
}

export function rotateTrend(s: GameState, rng: Rng, announce: boolean): void {
  s.merch.trend = pickTrend(rng, s.merch.trend);
  s.merch.trendEndsAt = s.time + TREND_SECONDS;
  if (announce && isMerchUnlocked(s)) {
    const trend = TREND_MAP.get(s.merch.trend);
    emit({ type: 'toast', title: `Merch trend: ${trend?.name}`, body: trend?.desc, icon: trend?.icon ?? 'shirt', tone: 'info' });
  }
}

/** Books merch sales for the tick and rotates trends. */
export function updateMerch(s: GameState, dt: number, factor: number, rates: Rates, rng: Rng, offline: boolean): void {
  if (s.merch.trendEndsAt <= 0) s.merch.trendEndsAt = s.time + TREND_SECONDS;
  else if (s.time >= s.merch.trendEndsAt) rotateTrend(s, rng, !offline);
  for (const [id, rate] of Object.entries(rates.merchLines)) {
    const line = s.merch.lines[id];
    if (!line) continue;
    const units = rate.unitsPerSec * dt * factor;
    const revenue = rate.cps * dt * factor;
    line.sold += units;
    line.revenue += revenue;
    s.stats.merchSold += units;
    s.stats.merchRevenue += revenue;
  }
}

export function unlockProduct(s: GameState, productId: string): boolean {
  const product = PRODUCT_MAP.get(productId);
  if (!product || s.merch.unlocked[productId]) return false;
  if (s.fansRun < product.unlockFans || s.cash < product.unlockCost) return false;
  s.cash -= product.unlockCost;
  s.merch.unlocked[productId] = true;
  s.merch.lines[productId] = { designId: null, price: 1, launchedAt: s.time, sold: 0, revenue: 0 };
  return true;
}

export function setLineDesign(s: GameState, productId: string, designId: string | null): boolean {
  const line = s.merch.lines[productId];
  if (!line || !s.merch.unlocked[productId]) return false;
  if (designId !== null && !s.designs[designId]) return false;
  if (line.designId === designId) return true;
  line.designId = designId;
  line.launchedAt = s.time;
  return true;
}

export function setLinePrice(s: GameState, productId: string, price: number): boolean {
  const line = s.merch.lines[productId];
  if (!line) return false;
  line.price = Math.round(clampPrice(price) * 100) / 100;
  return true;
}
