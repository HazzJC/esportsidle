/**
 * Progression audit. Plays the real engine with one player model for one seed, selling the org for
 * Legacy between runs, and writes a JSON record that scripts/audit-report.ts turns into a report of
 * the outliers: income sources that swamp the rest, purchases that pay back absurdly fast, Legacy
 * nodes that are worth far more (or less) than their price, quests that stall, and runs that speed up
 * too much or too little after a sale.
 *
 * The player models match scripts/sim.ts:
 *   active   decides every 20s, clicks for the first ten minutes of a run, catches every Hype Drop and
 *            answers Invitationals at once.
 *   semi     decides every 2 minutes, clicks in short bursts, catches the drops still on screen when it
 *            looks back, and lets Invitationals play themselves.
 *   passive  decides every 10 minutes, clicks only for the first player, never catches a drop, and
 *            turns the routines on.
 *
 * Unlike the sim, the audit also buys merch finish upgrades, spends Legacy across the whole tree and on
 * Dynasty ranks, and records what every purchase was worth.
 *
 *   npx tsx scripts/audit.ts --mode=active --seed=1 --hours=10 --runs=4 --json=out/active-1.json
 */
import { GAMES } from '../src/data/games';
import { GEAR_SLOTS } from '../src/data/gear';
import { DYNASTY, LEGACY_NODES } from '../src/data/legacy';
import { PRODUCTS } from '../src/data/merch';
import { OPERATIONS } from '../src/data/operations';
import { QUEST_MAP } from '../src/data/quests';
import { STAFF } from '../src/data/staff';
import { clickLogo } from '../src/engine/clicker';
import { MAX_DESIGNS, addDesign, analyzeDesign, deleteDesign, generateDesign, setJerseyDesign } from '../src/engine/designs';
import { signDraftPick } from '../src/engine/draft';
import { clickDrop } from '../src/engine/drops';
import { computeMods, computeRates } from '../src/engine/economy';
import { tick } from '../src/engine/game';
import { signListing } from '../src/engine/market';
import { MAX_MERCH_QUALITY, TRENDING_THRESHOLD, merchQualityCost, optimalPrice, setLineDesign, setLinePrice, unlockProduct, upgradeMerchQuality } from '../src/engine/merch';
import { buyOperation, isOperationRevealed, unitPrice } from '../src/engine/operations';
import { buyGear, gearUpgradeCost, playerRating } from '../src/engine/players';
import { buyDynasty, buyNode, dynastyCost, dynastyRank, mandateOffers, nodeState, pendingLegacy, sellOrg } from '../src/engine/prestige';
import { claimQuest } from '../src/engine/quests';
import { Rng } from '../src/engine/rng';
import { sectionOpen } from '../src/engine/sections';
import { signOffer } from '../src/engine/sponsors';
import { hireStaff, isStaffUnlocked, staffPrice } from '../src/engine/staff';
import { createNewGame } from '../src/engine/state';
import { setSeasonPlan, unlockGame } from '../src/engine/teams';
import { playInvitation } from '../src/engine/tournament';
import { operationsOpen } from '../src/engine/tutorial';
import { INCOME_SOURCES, type GameState, type IncomeSource } from '../src/engine/types';
import { buyUpgrade, storeUpgrades, upgradePrice } from '../src/engine/upgrades';
import { encodeSave } from '../src/engine/save';
import { mkdirSync, writeFileSync } from 'node:fs';

declare const process: { argv: string[] };

const args = Object.fromEntries(
  process.argv.slice(2).map((a: string) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? 'true'];
  }),
);
type Mode = 'active' | 'semi' | 'passive';
const MODE: Mode = (['active', 'semi', 'passive'] as const).includes(args.mode as Mode) ? (args.mode as Mode) : 'active';
const SEED = Number(args.seed ?? 1);
const HOURS = Number(args.hours ?? 10);
const MAX_SALES = Number(args.runs ?? 4) - 1;
const OUT = String(args.json ?? `output/progression-audit/${MODE}-${SEED}.json`);
const SAMPLE_EVERY = Number(args.interval ?? 600);
/** A run is sold once Legacy would double, or after this long with at least one point to take. */
const MAX_RUN_SECONDS = Number(args.maxrun ?? 4 * 3600);
/** --save=path also writes the final game as a save string, for loading into the game to look at. */
const SAVE_OUT = args.save ? String(args.save) : null;

const DECIDE_EVERY: Record<Mode, number> = { active: Number(args.decide ?? 20), semi: Number(args.decide ?? 120), passive: Number(args.decide ?? 600) };
const MAX_BUYS: Record<Mode, number> = { active: 40, semi: 120, passive: 200 };
const CLICKS_PER_SECOND = 5;
/** Challenges change the rules of a run, so the audit leaves them alone. */
const SKIP_NODES = new Set(['challenges', 'solo', 'potato', 'nostaff', 'nodrops', 'drama']);

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------
type Kind = 'op' | 'upgrade' | 'gear' | 'staff' | 'merch';
interface Purchase {
  run: number;
  at: number;
  kind: Kind;
  id: string;
  cost: number;
  /** Income per second the purchase added, measured on the spot. */
  gain: number;
  /** Total income per second before it. */
  base: number;
}
interface Sample {
  run: number;
  wall: number;
  runWall: number;
  earnedRun: number;
  totalCps: number;
  opsCps: number;
  matchCps: number;
  merchCps: number;
  /** Cash booked to each source since the last sample. */
  booked: Record<IncomeSource, number>;
  fans: number;
  bestTier: number;
  quest: string | null;
  questsClaimed: number;
  legacyLevel: number;
  pending: number;
  merchFinish: number;
  merchLines: number;
  invitationals: [number, number];
  sponsors: number;
  staff: number;
  players: number;
}
interface SaleRecord {
  run: number;
  wall: number;
  runWall: number;
  gained: number;
  levelAfter: number;
  bought: string[];
  dynasty: Record<string, number>;
  /** Income multiplier each unbought node would give on the spot, per Legacy point it costs. */
  nodeValues: { id: string; cost: number; ratio: number }[];
}

const purchases: Purchase[] = [];
const samples: Sample[] = [];
const sales: SaleRecord[] = [];
const milestones: { run: number; key: string; wall: number; runWall: number }[] = [];
const seen = new Set<string>();
/** Sponsor goal bonuses, in seconds of the income at the time they landed. */
const sponsorPayouts: { run: number; at: number; amount: number; seconds: number }[] = [];

// ---------------------------------------------------------------------------
// Player model
// ---------------------------------------------------------------------------
const s = createNewGame(0, SEED);
s.settings.onboarded = true;
if (MODE === 'passive') for (const key of Object.keys(s.automation) as (keyof typeof s.automation)[]) s.automation[key].on = true;

let wall = 0;
let run = 1;
let runStart = 0;

const totalCps = (st: GameState) => computeRates(st).totalCps;

interface Candidate {
  kind: Kind;
  id: string;
  cost: number;
  gain: number;
  buy: () => boolean;
}

function candidates(base: number): Candidate[] {
  const mods = computeMods(s);
  const out: Candidate[] = [];
  const measure = (apply: () => void, undo: () => void): number => {
    apply();
    const v = totalCps(s);
    undo();
    return v - base;
  };
  const soon = (cost: number) => cost <= Math.max(s.cash * 10, base * 600);

  for (const op of OPERATIONS) {
    if (!operationsOpen(s) || !isOperationRevealed(s, op)) continue;
    const st = s.ops[op.id];
    const cost = unitPrice(op, st.owned, mods.opCostMult);
    if (!soon(cost)) continue;
    out.push({ kind: 'op', id: op.id, cost, gain: measure(() => st.owned++, () => st.owned--), buy: () => buyOperation(s, op.id, 1) > 0 });
  }
  for (const def of storeUpgrades(s)) {
    if (def.currency !== 'cash') continue;
    const cost = upgradePrice(def, mods);
    if (!soon(cost)) continue;
    const gain = measure(
      () => (s.upgrades[def.id] = 0),
      () => delete s.upgrades[def.id],
    );
    out.push({ kind: 'upgrade', id: def.id, cost, gain: Math.max(gain, base * 0.0005), buy: () => buyUpgrade(s, def.id) });
  }
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
      );
      if (gain <= 0) continue;
      out.push({ kind: 'gear', id: slot.id, cost, gain, buy: () => buyGear(s, weakest.id, slot.id, mods) });
    }
  }
  for (const def of STAFF) {
    if (!isStaffUnlocked(s, def)) continue;
    const owned = s.staff[def.id] ?? 0;
    const cost = staffPrice(def, owned, 1, mods.staffCostMult);
    if (!soon(cost)) continue;
    const gain = measure(
      () => (s.staff[def.id] = owned + 1),
      () => (s.staff[def.id] = owned),
    );
    out.push({ kind: 'staff', id: def.id, cost, gain: Math.max(gain, base * 0.0002), buy: () => hireStaff(s, def.id, 1, mods.staffCostMult) > 0 });
  }
  for (const [productId, line] of Object.entries(s.merch.lines)) {
    if (!line.designId || (line.quality ?? 0) >= MAX_MERCH_QUALITY) continue;
    const cost = merchQualityCost(s, productId);
    if (!soon(cost)) continue;
    const gain = measure(
      () => (line.quality = (line.quality ?? 0) + 1),
      () => (line.quality = (line.quality ?? 0) - 1),
    );
    out.push({ kind: 'merch', id: productId, cost, gain, buy: () => upgradeMerchQuality(s, productId) });
  }
  return out;
}

function buyBest(): void {
  // Measuring every candidate costs a full income evaluation each, so one measurement buys up to
  // PER_PASS of the best-ranked distinct items before measuring again.
  const PER_PASS = 8;
  let bought = 0;
  while (bought < MAX_BUYS[MODE]) {
    const base = totalCps(s);
    const list = candidates(base).filter((c) => c.gain > 0);
    if (list.length === 0) break;
    list.sort((a, b) => a.cost / a.gain - b.cost / b.gain);
    let pass = 0;
    for (const c of list.slice(0, PER_PASS)) {
      if (c.cost > s.cash) break;
      if (!c.buy()) break;
      purchases.push({ run, at: wall - runStart, kind: c.kind, id: c.id, cost: c.cost, gain: c.gain, base });
      pass++;
      bought++;
    }
    if (pass === 0) break;
  }
}

function ruleBased(): void {
  const mods = computeMods(s);
  const prospect = s.draft?.[0];
  if (prospect && prospect.price <= s.cash) signDraftPick(s, prospect.player.id, mods);
  const rates = computeRates(s, mods);
  for (const q of [...s.quests.active]) {
    if (!q.ready && q.id === 'plan_1') {
      const team = Object.values(s.teams)[0];
      if (team) setSeasonPlan(s, team.gameId, team.plan === 'balanced' ? 'development' : 'balanced');
    }
    if (!q.ready && q.id === 'design_shirt') {
      const designId = Object.keys(s.designs)[0] ?? addDesign(s, generateDesign(new Rng(s), 32, 'Audit jersey'));
      if (designId) setJerseyDesign(s, designId);
    }
    if (!q.ready) continue;
    const rewards = QUEST_MAP.get(q.id)?.rewards ?? [];
    claimQuest(s, q.id, Math.max(0, rewards.findIndex((r) => r.kind === 'cash')), { cps: rates.cpsNoBuffs, fansPerSec: rates.fansPerSec }, new Rng(s));
  }
  const next = GAMES.find((g) => !s.games[g.id]?.unlocked);
  if (next && s.cash >= next.unlockCost * 2) unlockGame(s, next.id);
  for (const team of sectionOpen(s, 'market') ? Object.values(s.teams) : []) {
    let guard = 0;
    while (team.lineup.includes(null) && guard++ < 6) {
      const listing = s.market.listings.filter((l) => l.player.gameId === team.gameId && l.currency !== 'legacy').sort((a, b) => a.price - b.price)[0];
      if (!listing || listing.price > s.cash * 0.5) break;
      if (!signListing(s, listing.player.id, mods).ok) break;
    }
  }
  if (s.fansRun >= 5_000) {
    for (const p of PRODUCTS) if (!s.merch.unlocked[p.id] && s.fansRun >= p.unlockFans && s.cash >= p.unlockCost * 3) unlockProduct(s, p.id);
    let designId: string | undefined = Object.keys(s.designs)[0];
    if (!designId && Object.keys(s.merch.unlocked).length > 0) designId = addDesign(s, generateDesign(new Rng(s), 32, 'Audit design')) ?? undefined;
    // Active players chase the trend: when it changes they brief a new design for it and put it on every line.
    if (MODE === 'active' && Object.keys(s.merch.lines).length > 0) {
      const current = Object.values(s.merch.lines)[0]?.designId;
      const onTrend = current && s.designs[current] && analyzeDesign(s.designs[current], s.merch.trend).trend >= TRENDING_THRESHOLD;
      if (!onTrend) {
        if (Object.keys(s.designs).length >= MAX_DESIGNS) {
          const inUse = new Set(Object.values(s.merch.lines).map((l) => l.designId));
          const oldest = Object.values(s.designs).filter((d) => !inUse.has(d.id)).sort((a, b) => a.createdAt - b.createdAt)[0];
          if (oldest) deleteDesign(s, oldest.id);
        }
        const fresh = addDesign(s, generateDesign(new Rng(s), 32, 'Trend drop', s.merch.trend));
        if (fresh) for (const productId of Object.keys(s.merch.lines)) setLineDesign(s, productId, fresh);
      }
    }
    for (const [productId, line] of Object.entries(s.merch.lines)) {
      if (!line.designId && designId) setLineDesign(s, productId, designId);
      setLinePrice(s, productId, optimalPrice(line.designId ? analyzeDesign(s.designs[line.designId], s.merch.trend).trend >= TRENDING_THRESHOLD : false));
    }
  }
  for (const offer of [...s.sponsors.offers]) signOffer(s, offer.id, mods);
  if (MODE === 'active' && s.events.invitation) playInvitation(s, { rng: new Rng(s), mods, rates }, 'none');
}

function catchDrops(): void {
  if (s.drops.active.length === 0) return;
  const mods = computeMods(s);
  const ctx = { rng: new Rng(s), mods, rates: computeRates(s, mods) };
  for (const d of [...s.drops.active]) clickDrop(s, d.id, ctx);
}

// ---------------------------------------------------------------------------
// Legacy
// ---------------------------------------------------------------------------
/** What each node that changes income would do right now, before the sale. */
function valueNodes(): SaleRecord['nodeValues'] {
  const base = totalCps(s);
  const out: SaleRecord['nodeValues'] = [];
  for (const def of LEGACY_NODES) {
    if (SKIP_NODES.has(def.id) || s.prestige.nodes[def.id] !== undefined || !def.effects?.length) continue;
    s.prestige.nodes[def.id] = 0;
    const ratio = base > 0 ? totalCps(s) / base : 1;
    delete s.prestige.nodes[def.id];
    out.push({ id: def.id, cost: def.cost, ratio });
  }
  for (const d of DYNASTY) {
    const rank = dynastyRank(s, d.id);
    s.prestige.dynasty[d.id] = rank + 1;
    const ratio = base > 0 ? totalCps(s) / base : 1;
    s.prestige.dynasty[d.id] = rank;
    out.push({ id: `dynasty:${d.id}`, cost: dynastyCost(rank), ratio });
  }
  return out;
}

/** Cheapest available node first, then Dynasty ranks with whatever is left. */
function spendLegacy(): string[] {
  const bought: string[] = [];
  for (;;) {
    const options = LEGACY_NODES.filter((d) => !SKIP_NODES.has(d.id) && nodeState(s, d.id) === 'available' && d.cost <= s.prestige.points).sort((a, b) => a.cost - b.cost);
    if (options.length === 0 || !buyNode(s, options[0].id)) break;
    bought.push(options[0].id);
  }
  for (let guard = 0; guard < 500; guard++) {
    const cheapest = DYNASTY.map((d) => ({ id: d.id, cost: dynastyCost(dynastyRank(s, d.id)) })).sort((a, b) => a.cost - b.cost)[0];
    if (!cheapest || cheapest.cost > s.prestige.points || buyDynasty(s, cheapest.id) === 0) break;
  }
  return bought;
}

function maybeSell(): void {
  if (sales.length >= MAX_SALES) return;
  const pending = pendingLegacy(s);
  const runWall = wall - runStart;
  if (!(pending >= Math.max(1, s.prestige.level) || (runWall >= MAX_RUN_SECONDS && pending >= 1))) return;
  const nodeValues = valueNodes();
  const offer = mandateOffers(s)[0];
  sellOrg(s, { charter: 'operator', mandate: offer?.id ?? null });
  const bought = spendLegacy();
  sales.push({ run, wall, runWall, gained: pending, levelAfter: s.prestige.level, bought, dynasty: { ...s.prestige.dynasty }, nodeValues });
  run++;
  runStart = wall;
}

// ---------------------------------------------------------------------------
// Sampling
// ---------------------------------------------------------------------------
let lastBooked: Record<IncomeSource, number> = Object.fromEntries(INCOME_SOURCES.map((k) => [k, 0])) as Record<IncomeSource, number>;
let lastRun = 1;

function mark(key: string): void {
  const k = `${run}:${key}`;
  if (seen.has(k)) return;
  seen.add(k);
  milestones.push({ run, key, wall, runWall: wall - runStart });
}

function checkMilestones(): void {
  for (const exp of [6, 9, 12, 15, 18]) if (s.earnedRun >= 10 ** exp) mark(`earned 1e${exp}`);
  for (const g of GAMES) if (s.games[g.id]?.unlocked && g.index > 0) mark(`unlock ${g.id}`);
  for (const op of OPERATIONS) if (s.ops[op.id].owned > 0) mark(`first ${op.id}`);
  if (s.tutorial.step === 'done') mark('tutorial done');
  if (s.sponsors.active.length > 0) mark('first sponsor');
  if (Object.keys(s.merch.unlocked).length > 0) mark('merch launched');
  if (pendingLegacy(s) >= 1) mark('first legacy point');
  for (const tier of [3, 6, 9, 12, 15, 18]) if (Math.max(0, ...Object.values(s.teams).map((t) => t.bestTier)) >= tier) mark(`tier ${tier}`);
}

function sample(): void {
  if (run !== lastRun) {
    // A sale resets the run ledger.
    lastBooked = Object.fromEntries(INCOME_SOURCES.map((k) => [k, 0])) as Record<IncomeSource, number>;
    lastRun = run;
  }
  const booked = Object.fromEntries(INCOME_SOURCES.map((k) => [k, Math.max(0, (s.incomeRun[k] ?? 0) - (lastBooked[k] ?? 0))])) as Record<IncomeSource, number>;
  lastBooked = { ...s.incomeRun };
  const r = computeRates(s);
  samples.push({
    run,
    wall,
    runWall: wall - runStart,
    earnedRun: s.earnedRun,
    totalCps: r.totalCps,
    opsCps: r.cpsNoBuffs,
    matchCps: r.matchCps,
    merchCps: r.merchCps,
    booked,
    fans: s.fans,
    bestTier: Math.max(0, ...Object.values(s.teams).map((t) => t.bestTier)),
    quest: s.quests.active[0]?.id ?? null,
    questsClaimed: s.quests.claimed,
    legacyLevel: s.prestige.level,
    pending: pendingLegacy(s),
    merchFinish: Object.values(s.merch.lines).reduce((a, l) => a + (l.quality ?? 0), 0),
    merchLines: Object.keys(s.merch.unlocked).length,
    invitationals: [s.stats.tournamentsWon, s.stats.tournamentsPlayed],
    sponsors: s.sponsors.active.length,
    staff: Object.values(s.staff).reduce((a, b) => a + b, 0),
    players: Object.keys(s.players).length,
  });
}

// ---------------------------------------------------------------------------
// Play
// ---------------------------------------------------------------------------
function clicking(): boolean {
  const intoRun = wall - runStart;
  if (MODE === 'active') return intoRun < 600;
  if (MODE === 'semi') return intoRun < 300 || intoRun % 300 < 15;
  return s.tutorial.step === 'click';
}

const started = Date.now();
const total = HOURS * 3600;
while (wall < total) {
  if (clicking()) for (let i = 0; i < CLICKS_PER_SECOND; i++) clickLogo(s);
  if (MODE === 'active') catchDrops();
  const before = s.incomeRun.sponsor;
  tick(s, 1);
  wall++;
  const paid = s.incomeRun.sponsor - before;
  if (paid > 0) {
    const cps = Math.max(1, computeRates(s).totalCps);
    // Contract income trickles in every tick; a goal bonus arrives as one large lump.
    if (paid > cps * 5) sponsorPayouts.push({ run, at: wall - runStart, amount: paid, seconds: paid / cps });
  }
  if (wall % DECIDE_EVERY[MODE] === 0 || wall === 1) {
    if (MODE === 'semi') catchDrops();
    maybeSell();
    ruleBased();
    buyBest();
  }
  if (wall % 60 === 0) checkMilestones();
  if (wall % SAMPLE_EVERY === 0) sample();
}

mkdirSync(OUT.replace(/[\\/][^\\/]+$/, ''), { recursive: true });
writeFileSync(
  OUT,
  JSON.stringify({
    mode: MODE,
    seed: SEED,
    hours: HOURS,
    ranSeconds: (Date.now() - started) / 1000,
    purchases,
    samples,
    sales,
    milestones,
    sponsorPayouts,
    final: { run, earnedTotal: s.earnedTotal, legacyLevel: s.prestige.level, questsClaimed: s.quests.claimed, stats: s.stats },
  }),
);
if (SAVE_OUT) writeFileSync(SAVE_OUT, encodeSave(s));
console.log(`${MODE} seed ${SEED}: ${HOURS}h, ${sales.length} sales, ${purchases.length} purchases, ${samples.length} samples in ${((Date.now() - started) / 1000).toFixed(0)}s -> ${OUT}`);
