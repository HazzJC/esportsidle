/**
 * What the simulated player can buy and how it chooses.
 *
 * Every candidate is measured the same way: apply it, recompute income, undo it. The gain is the
 * income per second it adds right now. Upgrades, staff and decor that add no income get a small
 * floor, so a player still buys them eventually.
 *
 *   optimal  ranks by exact payback (cost / gain) and buys the best, re-measuring every PER_PASS buys.
 *   human    ranks by payback seen through noise (a person reads the cards, not the maths), sometimes
 *            ignores a whole category for a decision, and will stop to save for its favourite if that
 *            is only a few minutes of income away rather than buying whatever is affordable.
 */
import { DECOR } from '../../src/data/decor';
import { GAMES } from '../../src/data/games';
import { GEAR_SLOTS } from '../../src/data/gear';
import { OPERATIONS } from '../../src/data/operations';
import { STAFF } from '../../src/data/staff';
import { computeMods, computeRates } from '../../src/engine/economy';
import { MAX_MERCH_QUALITY, merchQualityCost, upgradeMerchQuality } from '../../src/engine/merch';
import { buyOperation, isOperationRevealed, levelUpOperation, operationLevelCost, unitPrice } from '../../src/engine/operations';
import { buyGear, gearUpgradeCost, playerRating } from '../../src/engine/players';
import { buyDecor, hireStaff, isStaffUnlocked, roomLevel, staffPrice } from '../../src/engine/staff';
import { sectionOpen } from '../../src/engine/sections';
import { operationsOpen } from '../../src/engine/tutorial';
import type { GameState, Mods } from '../../src/engine/types';
import { buyUpgrade, storeUpgrades, upgradePrice } from '../../src/engine/upgrades';
import type { SimRandom } from './random';
import type { Persona, PurchaseKind } from './types';

export interface Candidate {
  kind: PurchaseKind;
  id: string;
  cost: number;
  gain: number;
  buy: () => boolean;
}

/** Buys up to this many of the best-ranked items per measurement. */
export const PER_PASS = 8;
/** A person will hold off to save for an item this many seconds of income away. */
export const SAVE_UP_SECONDS = 180;
/** Log-normal spread on how a person judges payback. */
export const JUDGEMENT_NOISE = 0.5;
/** Chance a person ignores a secondary category (gear, staff, merch, decor) for one decision. */
export const CATEGORY_SKIP = 0.15;

/** Set reuseMods false to measure the slow, obviously-correct way (for checking the fast way). */
export const measureSettings = { reuseMods: true };

export const totalCps = (s: GameState, mods?: Mods): number => computeRates(s, mods ?? computeMods(s)).totalCps;

export interface CandidateOptions {
  decor: boolean;
  merch: boolean;
  teams: boolean;
  /** Categories to leave out this time. */
  skip?: Set<PurchaseKind>;
}

export function candidates(s: GameState, base: number, opts: CandidateOptions): Candidate[] {
  const mods = computeMods(s);
  const out: Candidate[] = [];
  const measure = (apply: () => void, undo: () => void, sameMods: boolean): number => {
    apply();
    // Operations, gear and merch finish change rates but not modifiers, so the modifiers computed
    // above still hold and a second computeMods is wasted work.
    const v = totalCps(s, sameMods && measureSettings.reuseMods ? mods : undefined);
    undo();
    return v - base;
  };
  const soon = (cost: number) => cost <= Math.max(s.cash * 10, base * 600);
  const skip = opts.skip ?? new Set<PurchaseKind>();

  for (const op of OPERATIONS) {
    if (!operationsOpen(s) || !isOperationRevealed(s, op)) continue;
    const st = s.ops[op.id];
    const cost = unitPrice(op, st.owned, mods.opCostMult);
    if (!soon(cost)) continue;
    out.push({ kind: 'op', id: op.id, cost, gain: measure(() => st.owned++, () => st.owned--, true), buy: () => buyOperation(s, op.id, 1) > 0 });
  }
  for (const def of storeUpgrades(s)) {
    if (def.currency !== 'cash') continue;
    const cost = upgradePrice(def, mods);
    if (!soon(cost)) continue;
    const gain = measure(
      () => (s.upgrades[def.id] = 0),
      () => delete s.upgrades[def.id],
      false,
    );
    out.push({ kind: 'upgrade', id: def.id, cost, gain: Math.max(gain, base * 0.0005), buy: () => buyUpgrade(s, def.id) });
  }
  if (opts.teams && !skip.has('gear')) {
    for (const team of Object.values(s.teams)) {
      const game = GAMES.find((g) => g.id === team.gameId)!;
      const starters = team.lineup.map((id) => (id ? s.players[id] : undefined)).filter((p) => p !== undefined);
      if (starters.length === 0) continue;
      const weakest = starters.reduce((a, b) => (playerRating(a, game, team.tier, null) <= playerRating(b, game, team.tier, null) ? a : b));
      for (const slot of GEAR_SLOTS) {
        const cost = gearUpgradeCost(weakest, slot.id, mods);
        if (!Number.isFinite(cost) || !soon(cost)) continue;
        const gain = measure(
          () => weakest.gear[slot.id]++,
          () => weakest.gear[slot.id]--,
          true,
        );
        if (gain <= 0) continue;
        out.push({ kind: 'gear', id: slot.id, cost, gain, buy: () => buyGear(s, weakest.id, slot.id, mods) });
      }
    }
  }
  if (!skip.has('staff')) {
    for (const def of STAFF) {
      if (!isStaffUnlocked(s, def)) continue;
      const owned = s.staff[def.id] ?? 0;
      const cost = staffPrice(def, owned, 1, mods.staffCostMult);
      if (!soon(cost)) continue;
      const gain = measure(
        () => (s.staff[def.id] = owned + 1),
        () => (s.staff[def.id] = owned),
        false,
      );
      out.push({ kind: 'staff', id: def.id, cost, gain: Math.max(gain, base * 0.0002), buy: () => hireStaff(s, def.id, 1, mods.staffCostMult) > 0 });
    }
  }
  if (opts.merch && !skip.has('merch')) {
    for (const [productId, line] of Object.entries(s.merch.lines)) {
      if (!line.designId || (line.quality ?? 0) >= MAX_MERCH_QUALITY) continue;
      const cost = merchQualityCost(s, productId);
      if (!soon(cost)) continue;
      const gain = measure(
        () => (line.quality = (line.quality ?? 0) + 1),
        () => (line.quality = (line.quality ?? 0) - 1),
        true,
      );
      out.push({ kind: 'merch', id: productId, cost, gain, buy: () => upgradeMerchQuality(s, productId) });
    }
  }
  if (opts.decor && !skip.has('decor')) {
    const room = roomLevel(s);
    for (const def of DECOR) {
      if (!sectionOpen(s, 'house') || s.decor[def.id] || def.room > room || !soon(def.cost)) continue;
      const gain = measure(
        () => (s.decor[def.id] = true),
        () => delete s.decor[def.id],
        false,
      );
      out.push({ kind: 'decor', id: def.id, cost: def.cost, gain: Math.max(gain, base * 0.0002), buy: () => buyDecor(s, def.id) });
    }
  }
  return out;
}

export interface BuyLog {
  (c: Candidate, base: number): void;
}

/** The exact-payback buyer (the old scripts/audit.ts bot). */
export function buyOptimal(s: GameState, persona: Persona, opts: CandidateOptions, log: BuyLog): void {
  let bought = 0;
  while (bought < persona.maxBuys) {
    const base = totalCps(s);
    const list = candidates(s, base, opts).filter((c) => c.gain > 0);
    if (list.length === 0) break;
    list.sort((a, b) => a.cost / a.gain - b.cost / b.gain);
    let pass = 0;
    for (const c of list.slice(0, PER_PASS)) {
      if (c.cost > s.cash) break;
      if (!c.buy()) break;
      log(c, base);
      pass++;
      bought++;
    }
    if (pass === 0) break;
  }
}

/** A person's buyer: noisy judgement, the odd category ignored, and saving up for a favourite. */
export function buyHuman(s: GameState, persona: Persona, opts: CandidateOptions, rand: SimRandom, log: BuyLog): void {
  const skip = new Set<PurchaseKind>();
  for (const kind of ['gear', 'staff', 'merch', 'decor'] as const) if (rand.chance(CATEGORY_SKIP)) skip.add(kind);
  let bought = 0;
  while (bought < persona.maxBuys) {
    const base = totalCps(s);
    const list = candidates(s, base, { ...opts, skip })
      .filter((c) => c.gain > 0)
      .map((c) => ({ c, seen: (c.cost / c.gain) * Math.exp(JUDGEMENT_NOISE * rand.normal()) }))
      .sort((a, b) => a.seen - b.seen);
    let pass = 0;
    let saving = false;
    for (const { c } of list) {
      if (pass >= PER_PASS || bought >= persona.maxBuys) break;
      if (c.cost > s.cash) {
        // Worth waiting for if it is only a few minutes away; otherwise look at the next card.
        if (c.cost <= s.cash + base * SAVE_UP_SECONDS) {
          saving = true;
          break;
        }
        continue;
      }
      if (!c.buy()) continue;
      log(c, base);
      pass++;
      bought++;
    }
    if (pass === 0 || saving) break;
  }
}

/** Spends trophies on operation levels and trophy-priced upgrades, best income per trophy first. */
export function spendTrophies(s: GameState, log: BuyLog): void {
  for (let guard = 0; guard < 50; guard++) {
    const base = totalCps(s);
    let best: Candidate | null = null;
    for (const op of OPERATIONS) {
      const st = s.ops[op.id];
      if (st.owned === 0) continue;
      const cost = operationLevelCost(st.level);
      if (cost > s.trophies) continue;
      st.level++;
      const gain = totalCps(s) - base;
      st.level--;
      const c: Candidate = { kind: 'level', id: op.id, cost, gain, buy: () => levelUpOperation(s, op.id) };
      if (gain > 0 && (!best || cost / gain < best.cost / best.gain)) best = c;
    }
    const mods = computeMods(s);
    for (const def of storeUpgrades(s)) {
      if (def.currency === 'cash') continue;
      const cost = upgradePrice(def, mods);
      if (cost > s.trophies) continue;
      s.upgrades[def.id] = 0;
      const gain = Math.max(totalCps(s) - base, base * 0.0005);
      delete s.upgrades[def.id];
      const c: Candidate = { kind: 'trophy-upgrade', id: def.id, cost, gain, buy: () => buyUpgrade(s, def.id) };
      if (!best || cost / gain < best.cost / best.gain) best = c;
    }
    if (!best || !best.buy()) return;
    log(best, base);
  }
}
