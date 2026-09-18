import { AUTOMATION_MAP, type AutomationId } from '../data/automation';
import { CHARTER_MAP } from '../data/charters';
import { getGame } from '../data/games';
import { GEAR_SLOTS, type GearSlot } from '../data/gear';
import { BRAND_MAP } from '../data/sponsors';
import { money } from './format';
import { signListing } from './market';
import { buyGear, gearUpgradeCost, skillRating } from './players';
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
 * when the pass starts, shared across every purchase in that pass. (Re-checking "under X% of cash"
 * after each purchase instead would let one pass spend most of the bank in small steps.)
 */
export function runAutomation(s: GameState, mods: Mods): void {
  if (automationActive(s, 'upgrades')) autoUpgrades(s, mods);
  if (automationActive(s, 'roster')) autoRoster(s, mods);
  if (automationActive(s, 'gear')) autoGear(s, mods);
  if (automationActive(s, 'sponsors')) autoSponsors(s, mods);
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
    .filter((o) => o.tier >= rules.minTier && offerRequirements(s, o).ok)
    .filter((o) => !(rules.avoidCrypto && BRAND_MAP.get(o.brandId)?.category === 'crypto'))
    .sort((a, b) => b.incomePct - a.incomePct);
  // Offers are exclusive per category, so try each in turn rather than giving up at the first refusal.
  for (const offer of candidates) {
    if (s.sponsors.active.length >= mods.sponsorSlots) break;
    if (signOffer(s, offer.id, mods).ok) log(s, `Agents signed ${BRAND_MAP.get(offer.brandId)?.name ?? 'a sponsor'}.`);
  }
}
