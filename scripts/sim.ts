/**
 * Headless balance simulation: a greedy "sensible player" runs the real engine and we log when
 * milestones happen. Usage: npm run sim -- --hours=5 --mode=active --seed=1
 */
import { GAMES } from '../src/data/games';
import { GEAR_SLOTS } from '../src/data/gear';
import { tierName } from '../src/data/leagues';
import { PRODUCTS } from '../src/data/merch';
import { OPERATIONS } from '../src/data/operations';
import { STAFF } from '../src/data/staff';
import { clickLogo } from '../src/engine/clicker';
import { addDesign, generateDesign } from '../src/engine/designs';
import { clickDrop } from '../src/engine/drops';
import { computeMods, computeRates } from '../src/engine/economy';
import { fmt, fmtTime } from '../src/engine/format';
import { tick } from '../src/engine/game';
import { signListing } from '../src/engine/market';
import { optimalPrice, setLineDesign, setLinePrice, unlockProduct } from '../src/engine/merch';
import { buyOperation, isOperationRevealed, unitPrice } from '../src/engine/operations';
import { buyGear, gearUpgradeCost, playerRating } from '../src/engine/players';
import { legacyFor } from '../src/engine/prestige';
import { Rng } from '../src/engine/rng';
import { signOffer } from '../src/engine/sponsors';
import { hireStaff, isStaffUnlocked, staffPrice } from '../src/engine/staff';
import { createNewGame } from '../src/engine/state';
import { unlockGame } from '../src/engine/teams';
import type { GameState } from '../src/engine/types';
import { buyUpgrade, storeUpgrades, upgradePrice } from '../src/engine/upgrades';

// Minimal Node globals so the script type-checks without @types/node.
declare const process: { argv: string[] };

const args = Object.fromEntries(
  process.argv.slice(2).map((a: string) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? 'true'];
  }),
);
const HOURS = Number(args.hours ?? 5);
const MODE = args.mode ?? 'active';
const SEED = Number(args.seed ?? 1);
const DECIDE_EVERY = Number(args.decide ?? 20);
const REPORT_EVERY = Number(args.report ?? 1800);
const MAX_BUYS_PER_DECISION = 40;

interface Candidate {
  label: string;
  cost: number;
  gain: number;
  buy: () => boolean;
}

const income = (s: GameState): number => computeRates(s).totalCps;

function candidates(s: GameState, base: number): Candidate[] {
  const mods = computeMods(s);
  const out: Candidate[] = [];
  const measure = (apply: () => void, undo: () => void): number => {
    apply();
    const v = income(s);
    undo();
    return v - base;
  };
  const affordableSoon = (cost: number) => cost <= Math.max(s.cash * 10, base * 600);

  for (const op of OPERATIONS) {
    if (!isOperationRevealed(s, op)) continue;
    const st = s.ops[op.id];
    const cost = unitPrice(op, st.owned, mods.opCostMult);
    if (!affordableSoon(cost)) continue;
    const gain = measure(
      () => st.owned++,
      () => st.owned--,
    );
    out.push({ label: `op:${op.id}`, cost, gain, buy: () => buyOperation(s, op.id, 1) > 0 });
  }

  for (const def of storeUpgrades(s)) {
    if (def.currency !== 'cash') continue;
    const cost = upgradePrice(def, mods);
    if (!affordableSoon(cost)) continue;
    const gain = measure(
      () => (s.upgrades[def.id] = 0),
      () => delete s.upgrades[def.id],
    );
    // Non-income upgrades still get bought once they are cheap relative to income.
    out.push({ label: `up:${def.id}`, cost, gain: Math.max(gain, base * 0.0005), buy: () => buyUpgrade(s, def.id) });
  }

  for (const team of Object.values(s.teams)) {
    const game = GAMES.find((g) => g.id === team.gameId)!;
    const starters = team.lineup.map((id) => (id ? s.players[id] : undefined)).filter((p) => p !== undefined);
    if (starters.length === 0) continue;
    const weakest = starters.reduce((a, b) => (playerRating(a, game, team.tier, null) <= playerRating(b, game, team.tier, null) ? a : b));
    for (const slot of GEAR_SLOTS) {
      const cost = gearUpgradeCost(weakest, slot.id, mods);
      if (!Number.isFinite(cost) || !affordableSoon(cost)) continue;
      const gain = measure(
        () => weakest.gear[slot.id]++,
        () => weakest.gear[slot.id]--,
      );
      if (gain <= 0) continue;
      out.push({ label: `gear:${weakest.tag}:${slot.id}`, cost, gain, buy: () => buyGear(s, weakest.id, slot.id, mods) });
    }
  }

  for (const def of STAFF) {
    if (!isStaffUnlocked(s, def)) continue;
    const owned = s.staff[def.id] ?? 0;
    const cost = staffPrice(def, owned, 1, mods.staffCostMult);
    if (!affordableSoon(cost)) continue;
    const gain = measure(
      () => (s.staff[def.id] = owned + 1),
      () => (s.staff[def.id] = owned),
    );
    out.push({ label: `staff:${def.id}`, cost, gain: Math.max(gain, base * 0.0002), buy: () => hireStaff(s, def.id, 1, mods.staffCostMult) > 0 });
  }
  return out;
}

function ruleBasedActions(s: GameState): void {
  const mods = computeMods(s);
  const next = GAMES.find((g) => !s.games[g.id]?.unlocked);
  if (next && s.cash >= next.unlockCost * 2) unlockGame(s, next.id);

  for (const team of Object.values(s.teams)) {
    let guard = 0;
    while (team.lineup.includes(null) && guard++ < 6) {
      const listing = s.market.listings.filter((l) => l.player.gameId === team.gameId).sort((a, b) => a.price - b.price)[0];
      if (!listing || listing.price > s.cash * 0.5) break;
      if (!signListing(s, listing.player.id, mods).ok) break;
    }
  }

  if (s.fansRun >= 5_000) {
    for (const p of PRODUCTS) {
      if (!s.merch.unlocked[p.id] && s.fansRun >= p.unlockFans && s.cash >= p.unlockCost * 3) unlockProduct(s, p.id);
    }
    let designId: string | undefined = Object.keys(s.designs)[0];
    if (!designId && Object.keys(s.merch.unlocked).length > 0) designId = addDesign(s, generateDesign(new Rng(s), 32, 'Sim design')) ?? undefined;
    for (const [productId, line] of Object.entries(s.merch.lines)) {
      if (!line.designId && designId) setLineDesign(s, productId, designId);
      setLinePrice(s, productId, optimalPrice(false));
    }
  }

  for (const offer of [...s.sponsors.offers]) signOffer(s, offer.id, mods);
}

// ---------------------------------------------------------------------------
const s = createNewGame(0, SEED);
const milestones: [string, number][] = [];
const seen = new Set<string>();
const mark = (key: string, when = s.time) => {
  if (seen.has(key)) return;
  seen.add(key);
  milestones.push([key, when]);
};
const snapshots: Record<string, string>[] = [];
/** Multiplier breakdown per snapshot, so a runaway can be attributed instead of guessed at. */
const factors: Record<string, string>[] = [];
const bestTier = () => Object.values(s.teams).reduce((m, t) => Math.max(m, t.bestTier), 0);
const started = Date.now();

for (let t = 1; t <= HOURS * 3600; t++) {
  if (MODE === 'active') {
    if (t <= 600) for (let i = 0; i < 5; i++) clickLogo(s);
    if (s.drops.active.length > 0) {
      const mods = computeMods(s);
      const ctx = { rng: new Rng(s), mods, rates: computeRates(s, mods) };
      for (const d of [...s.drops.active]) clickDrop(s, d.id, ctx);
    }
  }
  tick(s, 1);

  if (t % DECIDE_EVERY === 0) {
    ruleBasedActions(s);
    for (let k = 0; k < MAX_BUYS_PER_DECISION; k++) {
      const base = income(s);
      const list = candidates(s, base).filter((c) => c.gain > 0);
      if (list.length === 0) break;
      list.sort((a, b) => a.cost / a.gain - b.cost / b.gain);
      const best = list[0];
      if (best.cost > s.cash || !best.buy()) break;
    }
  }

  for (const op of OPERATIONS) if (s.ops[op.id].owned > 0) mark(`first ${op.name}`);
  for (const g of GAMES) if (s.games[g.id]?.unlocked && g.index > 0) mark(`unlock ${g.name}`);
  for (const exp of [3, 6, 9, 12, 15]) if (s.earnedRun >= 10 ** exp) mark(`earned 1e${exp}`);
  if (Object.keys(s.upgrades).length > 0) mark('first upgrade');
  if (s.stats.playersSigned > 0) mark('first player signed');
  if (s.stats.staffHired > 0) mark('first staff hire');
  if (s.stats.sponsorsSigned > 0) mark('first sponsor');
  if (Object.keys(s.merch.unlocked).length > 0) mark('merch launched');
  if (s.stats.seasonTitles > 0) mark('first season title');
  if (s.stats.tournamentsWon > 0) mark('first tournament win');
  for (const tier of [3, 6, 9, 12]) if (bestTier() >= tier) mark(`reach ${tierName(tier)}`);
  if (legacyFor(s.earnedTotal) >= 1) mark('first legacy point');

  if (t % REPORT_EVERY === 0) {
    const r = computeRates(s);
    snapshots.push({
      time: fmtTime(t),
      cash: fmt(s.cash),
      earned: fmt(s.earnedRun),
      'ops $/s': fmt(r.cps),
      'match $/s': fmt(r.matchCps),
      'merch $/s': fmt(r.merchCps),
      fans: fmt(s.fans),
      tier: String(bestTier()),
      players: String(Object.keys(s.players).length),
      upgrades: String(Object.keys(s.upgrades).length),
      staff: String(Object.values(s.staff).reduce((a, b) => a + b, 0)),
      legacy: String(legacyFor(s.earnedTotal)),
    });
    const m = computeMods(s);
    factors.push({
      time: fmtTime(t),
      'ops base': fmt(r.baseCps),
      global: fmt(r.globalMult),
      'upgrades only': fmt(m.globalMult),
      fame: fmt(r.fameMult),
      superfan: fmt(r.superfanMult),
      prize: fmt(m.prizeMult),
      merch: fmt(m.merchMult),
      rating: fmt(m.teamRatingMult),
      'top opMult': fmt(Math.max(1, ...Object.values(m.opMult))),
      'ops owned': String(OPERATIONS.reduce((a, op) => a + s.ops[op.id].owned, 0)),
      'top staff': String(Math.max(0, ...Object.values(s.staff))),
    });
  }
}

console.log(`\nEsports Idle balance sim · mode=${MODE} seed=${SEED} hours=${HOURS} · ran in ${((Date.now() - started) / 1000).toFixed(1)}s\n`);
console.log('Milestones:');
for (const [key, when] of milestones) console.log(`  ${fmtTime(when).padStart(9)}  ${key}`);
console.log('\nSnapshots:');
console.table(snapshots);
console.log('\nMultiplier breakdown:');
console.table(factors);
