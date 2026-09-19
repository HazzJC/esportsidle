import { AUTOMATION_MAP, type AutomationId } from '../data/automation';
import { CHARTER_MAP } from '../data/charters';
import { getGame } from '../data/games';
import { GEAR_SLOTS, type GearSlot } from '../data/gear';
import { BRAND_MAP } from '../data/sponsors';
import { money } from './format';
import { signListing } from './market';
import { buyGear, gearUpgradeCost, isAvailable, playerRating, skillRating } from './players';
import { assignSlot } from './teams';
import { offerRequirements, signOffer } from './sponsors';
import type { GameState, Mods, Player } from './types';
import { buyUpgrade, storeUpgrades, upgradePrice } from './upgrades';

/** Seconds between front-office passes. */
export const AUTOMATION_INTERVAL = 5;
/** Recent automated actions kept for the Front Office panel. */
export const AUTOMATION_LOG_SIZE = 8;
/** Caps on how much one pass may buy, so a single pass never spends in an uncontrolled burst. */
const MAX_UPGRADES_PER_PASS = 10;
const MAX_GEAR_PER_PASS = 25;

/** Unlocked by the org's growth, or from the start of every run by the matching Founding Charter. */
export function automationUnlocked(s: GameState, id: AutomationId): boolean {
  const charter = s.prestige.charter ? CHARTER_MAP.get(s.prestige.charter) : undefined;
  if (charter?.automation === id) return true;
  return AUTOMATION_MAP.get(id)?.unlock(s) ?? false;
}

export function automationActive(s: GameState, id: AutomationId): boolean {
  return s.automation[id].on && automationUnlocked(s, id);
}

function log(s: GameState, text: string): void {
  s.automationLog.unshift({ time: s.time, text });
  if (s.automationLog.length > AUTOMATION_LOG_SIZE) s.automationLog.length = AUTOMATION_LOG_SIZE;
}

/**
 * Carries out the player's standing orders. Buying rules get a budget per pass of X% of the cash held
 * when the pass starts, shared across every purchase in that pass.
 */
export interface AutomationOptions {
  pauseMarket?: boolean;
  pauseGear?: boolean;
  pauseTeams?: boolean;
}

export function runAutomation(s: GameState, mods: Mods, options?: AutomationOptions): void {
  if (automationActive(s, 'upgrades')) autoUpgrades(s, mods);
  if (!options?.pauseMarket && automationActive(s, 'roster')) autoRoster(s, mods);
  if (!options?.pauseGear && automationActive(s, 'gear')) autoGear(s, mods);
  if (!options?.pauseTeams && automationActive(s, 'roles')) autoRoles(s);
  if (automationActive(s, 'sponsors')) autoSponsors(s, mods);
}

/** The rating gain a swap must be worth before coaches disturb a settled lineup. */
export const ROLE_SWAP_MARGIN = 0.02;
/** Rearranging costs chemistry, which is worth up to 20% rating, so a swap must clear that too. */
const CHEMISTRY_COST = 0.15 * 0.2;

/**
 * Puts players on the role they actually play. Coaches look at every starter and substitute, work
 * out the lineup with the highest total rating, and only make the change when the gain is worth the
 * chemistry it costs — so a marginally better fit does not churn the team every few seconds.
 */
export function autoRoles(s: GameState): void {
  for (const team of Object.values(s.teams)) {
    const game = getGame(team.gameId);
    if (game.teamSize < 2) continue;
    const squad = [...team.lineup.filter((id): id is string => id !== null), ...team.bench]
      .map((id) => s.players[id])
      .filter((p) => p !== undefined && isAvailable(p, s.time));
    if (squad.length < 2) continue;

    const rate = (p: Player | undefined, slot: number) => (p ? playerRating(p, game, team.tier, slot) : 0);
    const current = team.lineup.map((id) => (id ? s.players[id] : undefined));
    const currentTotal = current.reduce((n, p, slot) => n + rate(p, slot), 0);

    // Start from the best player for each slot, then keep swapping pairs while it helps.
    const best: (Player | undefined)[] = [...current];
    const taken = new Set(best.filter((p) => p !== undefined).map((p) => p.id));
    for (let slot = 0; slot < best.length; slot++) {
      for (const p of squad) {
        if (taken.has(p.id)) continue;
        if (rate(p, slot) > rate(best[slot], slot)) {
          const held = best[slot];
          if (held) taken.delete(held.id);
          best[slot] = p;
          taken.add(p.id);
        }
      }
    }
    let improved = true;
    while (improved) {
      improved = false;
      for (let a = 0; a < best.length; a++) {
        for (let b = a + 1; b < best.length; b++) {
          const now = rate(best[a], a) + rate(best[b], b);
          const swapped = rate(best[b], a) + rate(best[a], b);
          if (swapped > now) {
            [best[a], best[b]] = [best[b], best[a]];
            improved = true;
          }
        }
      }
    }

    const bestTotal = best.reduce((n, p, slot) => n + rate(p, slot), 0);
    const changed = best.some((p, slot) => p?.id !== current[slot]?.id);
    if (!changed || currentTotal <= 0) continue;
    // Net value: the gain has to beat the chemistry a reshuffle costs.
    if (bestTotal < currentTotal * (1 + ROLE_SWAP_MARGIN + CHEMISTRY_COST)) continue;

    for (let slot = 0; slot < best.length; slot++) {
      const p = best[slot];
      if (p && p.id !== team.lineup[slot]) assignSlot(s, team.gameId, p.id, slot);
    }
    log(s, `Coaches reshuffled the ${game.name} lineup: +${Math.round((bestTotal / currentTotal - 1) * 100)}% team rating.`);
  }
}

function autoUpgrades(s: GameState, mods: Mods): void {
  let budget = s.cash * s.automation.upgrades.maxCostPct;
  const list = storeUpgrades(s)
    .filter((d) => d.currency === 'cash')
    .map((d) => ({ d, price: upgradePrice(d, mods) }))
    .sort((a, b) => a.price - b.price);
  let bought = 0;
  for (const { d, price } of list) {
    if (bought >= MAX_UPGRADES_PER_PASS || price > budget) break;
    if (buyUpgrade(s, d.id)) {
      budget -= price;
      bought++;
    }
  }
  if (bought) log(s, `Upgrade desk bought ${bought} upgrade${bought === 1 ? '' : 's'}.`);
}

function autoRoster(s: GameState, mods: Mods): void {
  for (const team of Object.values(s.teams)) {
    if (!team.lineup.includes(null)) continue;
    const budget = s.cash * s.automation.roster.maxCostPct;
    const pick = s.market.listings
      .filter((l) => l.player.gameId === team.gameId && l.price <= budget)
      .sort((a, b) => skillRating(b.player) - skillRating(a.player))[0];
    if (pick && signListing(s, pick.player.id, mods).ok) {
      log(s, `Scouts signed ${pick.player.tag} to ${getGame(team.gameId).name} for ${money(pick.price)}.`);
    }
  }
}

function autoGear(s: GameState, mods: Mods): void {
  let budget = s.cash * s.automation.gear.maxCostPct;
  let bought = 0;
  for (let i = 0; i < MAX_GEAR_PER_PASS; i++) {
    let best: { p: Player; slot: GearSlot; cost: number } | null = null;
    for (const team of Object.values(s.teams)) {
      for (const id of team.lineup) {
        const p = id ? s.players[id] : undefined;
        if (!p) continue;
        for (const g of GEAR_SLOTS) {
          const cost = gearUpgradeCost(p, g.id, mods);
          if (Number.isFinite(cost) && (!best || cost < best.cost)) best = { p, slot: g.id, cost };
        }
      }
    }
    if (!best || best.cost > budget || !buyGear(s, best.p.id, best.slot, mods)) break;
    budget -= best.cost;
    bought++;
  }
  if (bought) log(s, `Coaches bought ${bought} gear upgrade${bought === 1 ? '' : 's'}.`);
}

function autoSponsors(s: GameState, mods: Mods): void {
  const rules = s.automation.sponsors;
  const candidates = s.sponsors.offers
    .filter((o) => (rules.minTier === 0 || o.tier === rules.minTier - 1) && offerRequirements(s, o).ok)
    .filter((o) => !(rules.avoidCrypto && BRAND_MAP.get(o.brandId)?.category === 'crypto'))
    .sort((a, b) => b.incomePct - a.incomePct);
  // Offers are exclusive per category, so try each in turn rather than giving up at the first refusal.
  for (const offer of candidates) {
    if (s.sponsors.active.length >= mods.sponsorSlots) break;
    if (signOffer(s, offer.id, mods).ok) log(s, `Agents signed ${BRAND_MAP.get(offer.brandId)?.name ?? 'a sponsor'}.`);
  }
}
