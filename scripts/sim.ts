/**
 * Headless balance simulation. A player model plays the real engine and the sim logs when milestones
 * happen, so pacing is measured rather than guessed. Both models share the same buying logic; they only
 * differ in when and how often the player acts.
 *
 *   active  At the keyboard the whole time: decides every 20s, clicks for the first ten minutes and
 *           catches every Hype Drop. An upper bound on pace, not a typical player.
 *   semi    Game open beside something else: decides every 2 minutes, clicks in short bursts, and
 *           catches the drops that are still on screen when they look back.
 *   passive Game left running: decides every 10 minutes, clicks only to afford the first player, and
 *           never catches a drop. Routines are on, so the org runs itself.
 *   casual  Checks in four times a day, about 85 minutes in total. Decides every few minutes, clicks
 *           only briefly when a session starts, catches a drop only if one is on screen when they look,
 *           and closes the game between sessions, earning at the offline rate.
 *
 * Both start the way a real player does: no team, clicking to $25 for the first player, operations
 * locked until the first signing, a calm start with no random events, and tabs that open as the org
 * grows. Quests with a choice are claimed for cash (--quest=perk takes the permanent perk instead).
 *
 *   npm run sim -- --mode=active --hours=5
 *   npm run sim -- --mode=semi --hours=5
 *   npm run sim -- --mode=casual --days=5 --prestige
 *
 * --income prints where the money came from, interval by interval, using the engine's own income
 * ledger, plus what sponsors paid out and how the org progressed. That is the economy report.
 */
import { GAMES } from '../src/data/games';
import { GEAR_SLOTS } from '../src/data/gear';
import { tierName } from '../src/data/leagues';
import { PRODUCTS } from '../src/data/merch';
import { OPERATIONS } from '../src/data/operations';
import { STAFF } from '../src/data/staff';
import { clickLogo } from '../src/engine/clicker';
import { addDesign, generateDesign } from '../src/engine/designs';
import { signDraftPick } from '../src/engine/draft';
import { clickDrop } from '../src/engine/drops';
import { computeMods, computeRates } from '../src/engine/economy';
import { fmt, fmtTime } from '../src/engine/format';
import { advance, tick } from '../src/engine/game';
import { signListing } from '../src/engine/market';
import { optimalPrice, setLineDesign, setLinePrice, unlockProduct } from '../src/engine/merch';
import { buyOperation, isOperationRevealed, unitPrice } from '../src/engine/operations';
import { buyGear, gearUpgradeCost, playerRating } from '../src/engine/players';
import { buyNode, legacyFor, mandateOffers, pendingLegacy, sellOrg } from '../src/engine/prestige';
import { claimQuest, skipQuest } from '../src/engine/quests';
import { QUEST_MAP } from '../src/data/quests';
import { Rng } from '../src/engine/rng';
import { signOffer } from '../src/engine/sponsors';
import { hireStaff, isStaffUnlocked, staffPrice } from '../src/engine/staff';
import { createNewGame } from '../src/engine/state';
import { sectionOpen } from '../src/engine/sections';
import { unlockGame } from '../src/engine/teams';
import { operationsOpen } from '../src/engine/tutorial';
import { INCOME_SOURCES, type GameState, type IncomeSource } from '../src/engine/types';
import { BRAND_MAP, SPONSOR_TIERS } from '../src/data/sponsors';
import { writeFileSync } from 'node:fs';
import { buyUpgrade, storeUpgrades, upgradePrice } from '../src/engine/upgrades';

// Minimal Node globals so the script type-checks without @types/node.
declare const process: { argv: string[] };

const args = Object.fromEntries(
  process.argv.slice(2).map((a: string) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? 'true'];
  }),
);
type Mode = 'active' | 'semi' | 'passive' | 'casual';
const MODE: Mode = (['active', 'semi', 'passive', 'casual'] as const).includes(args.mode as Mode) ? (args.mode as Mode) : 'active';
/** Every mode but casual plays with the game open for the whole span. */
const OPEN_ALL_DAY = MODE !== 'casual';
const SEED = Number(args.seed ?? 1);
const PRESTIGE = args.prestige === 'true';
const MAX_RUNS = Number(args.runs ?? 2);
/** Founding Charter taken on the first sale, and whether to take the first mandate offered. */
const CHARTER = String(args.charter ?? 'operator');
const MANDATE = String(args.mandate ?? 'first');
// A player who leaves the game running switches the routines on; someone at the keyboard does not.
const AUTOMATION = args.automation !== undefined ? args.automation === 'true' : MODE === 'casual' || MODE === 'passive';
/** Which kind of quest reward to take when a quest offers a choice: cash or perk. */
const QUEST_PICK = String(args.quest ?? 'cash');
const SIM_SKIPS = ['design_shirt', 'plan_1'];
/** --quests=off never claims quest rewards: a baseline for measuring what quests are worth. */
const QUESTS_ON = args.quests !== 'off';
const HOURS = Number(args.hours ?? 5);
const DAYS = Number(args.days ?? 4);
/** Seconds between decisions: constant attention at the keyboard, or glancing in every few minutes. */
const DECIDE_DEFAULT: Record<Mode, number> = { active: 20, semi: 120, passive: 600, casual: 180 };
const DECIDE_EVERY = Number(args.decide ?? DECIDE_DEFAULT[MODE]);
const MAX_BUYS_PER_DECISION = MODE === 'active' ? 40 : 120;
const ACTIVE_CLICK_SECONDS = 600;
const CASUAL_CLICK_SECONDS = 30;
/** A semi-engaged player clicks for this long at the start, then in bursts. */
const SEMI_CLICK_SECONDS = 300;
const SEMI_BURST_EVERY = 300;
const SEMI_BURST_SECONDS = 15;
const CLICKS_PER_SECOND = 5;
const REPORT_EVERY = Number(args.report ?? 1800);
/** --income: the economy report, sampled this often (default every 10 minutes). */
const INCOME_REPORT = args.income === 'true' || args.income !== undefined;
const INCOME_EVERY = Number(args.interval ?? 600);

/** Casual sessions each day: [hours after the first session of the day, minutes played]. */
const DAY_SESSIONS: [number, number][] = [
  [0, 20],
  [4.5, 15],
  [10, 30],
  [13.5, 20],
];
/** The first session of each day starts at 08:00, which is used to print clock times. */
const DAY_START_HOUR = 8;

// ---------------------------------------------------------------------------
// Buying decisions (shared by both models)
// ---------------------------------------------------------------------------
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
    if (!operationsOpen(s) || !isOperationRevealed(s, op)) continue;
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
  const prospect = s.draft?.[0];
  if (prospect && prospect.price <= s.cash) signDraftPick(s, prospect.player.id, mods);
  const rates = computeRates(s, mods);
  for (const q of [...s.quests.active]) {
    // The sim never draws a jersey or changes season plan, so it sets those quests aside.
    if (!q.ready && SIM_SKIPS.includes(q.id)) skipQuest(s, q.id);
    if (!q.ready || !QUESTS_ON) continue;
    // Takes cash when offered (easy to value); otherwise the quest's only or first reward.
    const rewards = QUEST_MAP.get(q.id)?.rewards ?? [];
    const pick = Math.max(0, rewards.findIndex((r) => r.kind === QUEST_PICK));
    claimQuest(s, q.id, pick, { cps: rates.cpsNoBuffs, fansPerSec: rates.fansPerSec }, new Rng(s));
  }

  const next = GAMES.find((g) => !s.games[g.id]?.unlocked);
  if (next && s.cash >= next.unlockCost * 2) unlockGame(s, next.id);

  for (const team of sectionOpen(s, 'market') ? Object.values(s.teams) : []) {
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

function buyBest(s: GameState): void {
  for (let k = 0; k < MAX_BUYS_PER_DECISION; k++) {
    const base = income(s);
    const list = candidates(s, base).filter((c) => c.gain > 0);
    if (list.length === 0) break;
    list.sort((a, b) => a.cost / a.gain - b.cost / b.gain);
    const best = list[0];
    if (best.cost > s.cash || !best.buy()) break;
  }
}

function catchDrops(s: GameState): void {
  if (s.drops.active.length === 0) return;
  const mods = computeMods(s);
  const ctx = { rng: new Rng(s), mods, rates: computeRates(s, mods) };
  for (const d of [...s.drops.active]) clickDrop(s, d.id, ctx);
}

// ---------------------------------------------------------------------------
// Prestige
// ---------------------------------------------------------------------------
/** Legacy nodes in the order a sensible player would buy them. */
const LEGACY_PRIORITY = ['legacy', 'start_cash_1', 'income_1', 'teams_1', 'heritage', 'offline_1', 'drops_1', 'click_1', 'start_ops', 'start_rocket', 'bench', 'scouting', 'fame'];

function spendLegacy(s: GameState): string[] {
  const bought: string[] = [];
  let progress = true;
  while (progress) {
    progress = false;
    for (const id of LEGACY_PRIORITY) {
      if (buyNode(s, id)) {
        bought.push(id);
        progress = true;
      }
    }
  }
  return bought;
}

/** Sell once pending legacy at least matches what the org already has: a common "double it" rule. */
function shouldSell(s: GameState, run: number): boolean {
  return PRESTIGE && run < MAX_RUNS && pendingLegacy(s) >= Math.max(1, s.prestige.level);
}

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------
const s = createNewGame(0, SEED);
s.settings.onboarded = true;
// A casual player switches routines on once they unlock. The active model already buys everything
// greedily, and layering automation on top would distort what it measures, so it stays off there.
if (AUTOMATION) for (const key of Object.keys(s.automation) as (keyof typeof s.automation)[]) s.automation[key].on = true;

interface Milestone {
  run: number;
  key: string;
  wall: number;
  runWall: number;
  active: number;
}
const milestones: Milestone[] = [];
const seen = new Set<string>();
const snapshots: Record<string, string>[] = [];
const prestigeLog: string[] = [];

/** One economy sample: the run's income ledger and the shape of the org at that moment. */
interface IncomeSample {
  at: number;
  ledger: Record<IncomeSource, number>;
  earned: number;
  cps: number;
  fans: number;
  tier: number;
  sponsors: number;
  sponsorPct: number;
  gear: number;
  staff: number;
  players: number;
  ops: number;
  merchLines: number;
}
const incomeLog: IncomeSample[] = [];

/** A sponsor goal that paid out: what it paid, and what the org did to earn it. */
interface SponsorPayout {
  at: number;
  brand: string;
  tier: number;
  reward: number;
  heldSeconds: number;
  cpsAt: number;
  earnedDuring: number;
}
const sponsorPayouts: SponsorPayout[] = [];
const sponsorSigned = new Map<number, { at: number; earned: number }>();
const sponsorDone = new Set<number>();
let sponsorPaid = 0;

let wall = 0;
let activeSeconds = 0;
let run = 1;
let runStart = 0;

const bestTier = () => Object.values(s.teams).reduce((m, t) => Math.max(m, t.bestTier), 0);

function mark(key: string): void {
  const id = `${run}:${key}`;
  if (seen.has(id)) return;
  seen.add(id);
  milestones.push({ run, key, wall, runWall: wall - runStart, active: activeSeconds });
}

function checkMilestones(): void {
  for (const op of OPERATIONS) if (s.ops[op.id].owned > 0) mark(`first ${op.name}`);
  for (const g of GAMES) if (s.games[g.id]?.unlocked && g.index > 0) mark(`unlock ${g.name}`);
  for (const exp of [3, 6, 9, 12, 15]) if (s.earnedRun >= 10 ** exp) mark(`earned 1e${exp}`);
  if (Object.keys(s.upgrades).length > 0) mark('first upgrade');
  if (s.stats.playersSigned > 0) mark('first player signed');
  if (s.stats.staffHired > 0) mark('first staff hire');
  if (s.sponsors.active.length > 0) mark('first sponsor');
  if (Object.keys(s.merch.unlocked).length > 0) mark('merch launched');
  for (const tier of [3, 6, 9, 12]) if (bestTier() >= tier) mark(`reach ${tierName(tier)}`);
  if (pendingLegacy(s) >= 1) mark('first legacy point');
  if (s.tutorial.step === 'done') mark('tutorial done');
  for (const id of Object.keys(s.sections)) mark(`tab: ${id}`);
  if (s.quests.claimed >= 5) mark('5 quests claimed');
}

/** Notices sponsor signings and goal payouts as they happen. */
function trackSponsors(): void {
  for (const c of s.sponsors.active) {
    if (!sponsorSigned.has(c.id)) sponsorSigned.set(c.id, { at: s.time, earned: s.earnedRun });
    if (!c.completed || sponsorDone.has(c.id)) continue;
    sponsorDone.add(c.id);
    const signed = sponsorSigned.get(c.id) ?? { at: s.time, earned: s.earnedRun };
    const reward = s.incomeRun.sponsor - sponsorPaid;
    sponsorPaid = s.incomeRun.sponsor;
    sponsorPayouts.push({
      at: wall,
      brand: BRAND_MAP.get(c.brandId)?.name ?? c.brandId,
      tier: c.tier,
      reward,
      heldSeconds: s.time - signed.at,
      cpsAt: computeRates(s).cpsNoBuffs,
      earnedDuring: s.earnedRun - signed.earned,
    });
  }
}

function sampleIncome(): void {
  // The final sample often lands on an interval boundary that was just recorded.
  if (incomeLog.length > 0 && incomeLog[incomeLog.length - 1].at === wall) return;
  const r = computeRates(s);
  incomeLog.push({
    at: wall,
    ledger: { ...s.incomeRun },
    earned: s.earnedRun,
    cps: r.totalCps,
    fans: s.fans,
    tier: bestTier(),
    sponsors: s.sponsors.active.length,
    sponsorPct: s.sponsors.active.reduce((n, c) => n + SPONSOR_TIERS[c.tier].incomePct, 0),
    gear: s.stats.gearBought,
    staff: Object.values(s.staff).reduce((a, b) => a + b, 0),
    players: Object.keys(s.players).length,
    ops: OPERATIONS.reduce((n, op) => n + s.ops[op.id].owned, 0),
    merchLines: Object.keys(s.merch.unlocked).length,
  });
}

function snapshot(label: string): void {
  const r = computeRates(s);
  snapshots.push({
    at: label,
    run: String(run),
    cash: fmt(s.cash),
    earned: fmt(s.earnedRun),
    'ops $/s': fmt(r.cps),
    'match $/s': fmt(r.matchCps),
    'merch $/s': fmt(r.merchCps),
    fans: fmt(s.fans),
    tier: String(bestTier()),
    players: String(Object.keys(s.players).length),
    staff: String(Object.values(s.staff).reduce((a, b) => a + b, 0)),
    legacy: `${s.prestige.level}+${pendingLegacy(s)}`,
  });
}

function decide(): void {
  // A player who leaves the game running never gets to a drop before it fades.
  if (MODE !== 'passive') catchDrops(s);
  if (shouldSell(s, run)) {
    const gained = pendingLegacy(s);
    const offer = MANDATE === 'none' ? null : (mandateOffers(s).find((m) => m.id === MANDATE) ?? mandateOffers(s)[0]);
    sellOrg(s, { charter: CHARTER, mandate: offer?.id ?? null });
    const bought = spendLegacy(s);
    prestigeLog.push(`Run ${run} sold at ${clock(wall)} (${fmtTime(wall - runStart)} into the run) for ${gained} legacy; charter ${s.prestige.charter}, mandate ${s.prestige.mandate ?? 'none'}; bought ${bought.join(', ') || 'nothing'}.`);
    run++;
    runStart = wall;
  }
  ruleBasedActions(s);
  buyBest(s);
}

/** Whether the player is clicking this second, which is most of what separates the models. */
function clickingNow(t: number, clickSeconds: number): boolean {
  const intoRun = wall - runStart;
  switch (MODE) {
    case 'active':
      return intoRun < clickSeconds;
    case 'semi':
      // A burst at the start of the run, then a few seconds of clicking every time they look back.
      return intoRun < SEMI_CLICK_SECONDS || intoRun % SEMI_BURST_EVERY < SEMI_BURST_SECONDS;
    case 'passive':
      // Only what the tutorial needs to afford the first player, then the game is left alone.
      return s.tutorial.step === 'click';
    default:
      return t <= clickSeconds;
  }
}

/** Plays with the game open for `seconds`, clicking only during the first `clickSeconds`. */
function play(seconds: number, clickSeconds: number): void {
  for (let t = 1; t <= seconds; t++) {
    if (clickingNow(t, clickSeconds)) for (let i = 0; i < CLICKS_PER_SECOND; i++) clickLogo(s);
    // At the keyboard every drop is caught; everyone else only sees the ones still up when they look.
    if (MODE === 'active') catchDrops(s);
    tick(s, 1);
    wall++;
    activeSeconds++;
    if (t === 1 || t % DECIDE_EVERY === 0) decide();
    checkMilestones();
    trackSponsors();
    if (OPEN_ALL_DAY && wall % REPORT_EVERY === 0) snapshot(fmtTime(wall));
    if (INCOME_REPORT && wall % INCOME_EVERY === 0) sampleIncome();
  }
}

/** The game is closed: mirrors applyOfflineProgress, including its cap and reduced rate. */
function closeFor(seconds: number): void {
  const mods = computeMods(s);
  const counted = s.settings.offlineProgress ? Math.min(seconds, mods.offlineCapHours * 3600) : 0;
  s.hype = 0;
  if (counted > 0) advance(s, counted, true);
  wall += seconds;
  checkMilestones();
}

function clock(t: number): string {
  if (OPEN_ALL_DAY) return fmtTime(t);
  const abs = DAY_START_HOUR * 3600 + t;
  const day = Math.floor(abs / 86400) + 1;
  const secs = abs % 86400;
  const hh = String(Math.floor(secs / 3600)).padStart(2, '0');
  const mm = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
  return `day ${day} ${hh}:${mm}`;
}

const started = Date.now();
if (OPEN_ALL_DAY) {
  play(HOURS * 3600, ACTIVE_CLICK_SECONDS);
} else {
  for (let day = 0; day < DAYS; day++) {
    for (const [offsetHours, minutes] of DAY_SESSIONS) {
      const start = day * 86400 + offsetHours * 3600;
      if (start > wall) closeFor(start - wall);
      play(minutes * 60, CASUAL_CLICK_SECONDS);
    }
    snapshot(`end of day ${day + 1}`);
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const SPAN_LABEL: Record<Mode, string> = {
  active: `${HOURS}h at the keyboard`,
  semi: `${HOURS}h with the game open beside something else`,
  passive: `${HOURS}h left running`,
  casual: `${DAYS} days, ${fmtTime(activeSeconds)} with the game open`,
};
const span = SPAN_LABEL[MODE];
console.log(`\nEsports Idle balance sim · ${MODE} · seed ${SEED} · ${span}${PRESTIGE ? ' · prestiging' : ''} · ran in ${((Date.now() - started) / 1000).toFixed(1)}s\n`);
for (let r = 1; r <= run; r++) {
  const list = milestones.filter((m) => m.run === r);
  if (list.length === 0) continue;
  console.log(`Run ${r}:`);
  for (const m of list) {
    const opened = !OPEN_ALL_DAY ? `  (${fmtTime(m.active)} played)` : '';
    console.log(`  ${clock(m.wall).padStart(12)}  +${fmtTime(m.runWall).padEnd(8)} ${m.key}${opened}`);
  }
}
if (prestigeLog.length) console.log('\n' + prestigeLog.join('\n'));

// How much faster each later run hits the same milestones: the measure of a transformative prestige.
if (run > 1) {
  console.log('\nRun-over-run speed (time from the start of the run):');
  const first = new Map(milestones.filter((m) => m.run === 1).map((m) => [m.key, m.runWall]));
  for (const m of milestones.filter((x) => x.run === 2)) {
    const before = first.get(m.key);
    if (before === undefined || before <= 0) continue;
    console.log(`  ${m.key.padEnd(28)} ${fmtTime(before).padStart(9)} -> ${fmtTime(m.runWall).padEnd(9)} ${(before / Math.max(1, m.runWall)).toFixed(1)}x faster`);
  }
}
console.log('\nSnapshots:');
console.table(snapshots);
console.log(`Legacy now ${s.prestige.level} (+${pendingLegacy(s)} pending, ${legacyFor(s.earnedTotal)} lifetime).`);
console.log(`Quests claimed: ${s.quests.claimed}; picks ${JSON.stringify(s.quests.picks)}.`);

// ---------------------------------------------------------------------------
// Economy report: where the money came from, interval by interval
// ---------------------------------------------------------------------------
/** Sources worth a column of their own; everything else is folded into "other". */
const MAIN_SOURCES: IncomeSource[] = ['ops', 'click', 'match', 'merch', 'sponsor', 'drop'];
const OTHER_SOURCES = INCOME_SOURCES.filter((k) => !MAIN_SOURCES.includes(k));

const pct = (part: number, whole: number): string => (whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : '-');

function row(cells: string[]): string {
  return `| ${cells.join(' | ')} |`;
}

function table(header: string[], rows: string[][]): string {
  return [row(header), row(header.map(() => '---')), ...rows.map(row)].join('\n');
}

function incomeReport(): string {
  const out: string[] = [];
  const header = ['interval', 'earned', ...MAIN_SOURCES, 'other', '$/s', 'fans', 'tier', 'sponsors', 'gear', 'ops', 'merch lines'];
  const rows: string[][] = [];
  let prev: Record<IncomeSource, number> | null = null;
  let prevAt = 0;
  for (const sample of incomeLog) {
    const delta = Object.fromEntries(INCOME_SOURCES.map((k) => [k, sample.ledger[k] - (prev?.[k] ?? 0)])) as Record<IncomeSource, number>;
    const total = INCOME_SOURCES.reduce((n, k) => n + delta[k], 0);
    rows.push([
      `${fmtTime(prevAt)}-${fmtTime(sample.at)}`,
      fmt(total),
      ...MAIN_SOURCES.map((k) => pct(delta[k], total)),
      pct(OTHER_SOURCES.reduce((n, k) => n + delta[k], 0), total),
      fmt(sample.cps),
      fmt(sample.fans),
      String(sample.tier),
      `${sample.sponsors} (+${Math.round(sample.sponsorPct * 100)}%)`,
      String(sample.gear),
      String(sample.ops),
      String(sample.merchLines),
    ]);
    prev = sample.ledger;
    prevAt = sample.at;
  }
  out.push('Income by source, per interval (share of the cash earned inside that interval):');
  out.push(table(header, rows));

  const lifetime = s.incomeRun;
  const total = INCOME_SOURCES.reduce((n, k) => n + lifetime[k], 0);
  out.push('');
  out.push('Run totals by source:');
  out.push(
    table(
      ['source', 'earned', 'share'],
      INCOME_SOURCES.filter((k) => lifetime[k] > 0)
        .sort((a, b) => lifetime[b] - lifetime[a])
        .map((k) => [k, fmt(lifetime[k]), pct(lifetime[k], total)]),
    ),
  );
  return out.join('\n');
}

function sponsorReport(): string {
  const out: string[] = [];
  out.push(`Sponsor goals completed: ${sponsorPayouts.length}; paid ${fmt(s.incomeRun.sponsor)} (${pct(s.incomeRun.sponsor, s.earnedRun)} of the run).`);
  if (sponsorPayouts.length > 0) {
    out.push(
      table(
        ['at', 'brand', 'tier', 'held', 'payout', 'org $/s then', 'payout as seconds of income', 'earned while held', 'payout vs that'],
        sponsorPayouts.map((p) => [
          fmtTime(p.at),
          p.brand,
          String(p.tier + 1),
          fmtTime(p.heldSeconds),
          fmt(p.reward),
          fmt(p.cpsAt),
          p.cpsAt > 0 ? fmtTime(Math.round(p.reward / p.cpsAt)) : '-',
          fmt(p.earnedDuring),
          pct(p.reward, p.earnedDuring),
        ]),
      ),
    );
  }
  const boost = s.sponsors.active.reduce((n, c) => n + SPONSOR_TIERS[c.tier].incomePct, 0);
  out.push(`Active contracts at the end: ${s.sponsors.active.length}, together worth +${Math.round(boost * 100)}% income.`);
  return out.join('\n');
}

/** Does the run actually reach the things the progression model promises, and when? */
function progressionReport(): string {
  const when = (key: string): string => {
    const m = milestones.find((x) => x.key === key);
    return m ? clock(m.wall) : 'never';
  };
  const checks: [string, boolean, string][] = [
    ['tutorial finished', s.tutorial.step === 'done', when('tutorial done')],
    ['market tab open', sectionOpen(s, 'market'), when('tab: market')],
    ['second game unlocked', GAMES.filter((g) => s.games[g.id]?.unlocked).length >= 2, when(`unlock ${GAMES[1].name}`)],
    ['gear bought', s.stats.gearBought > 0, `${s.stats.gearBought} upgrades`],
    ['staff hired', s.stats.staffHired > 0, when('first staff hire')],
    ['sponsor signed', s.stats.sponsorsSigned > 0, when('first sponsor')],
    ['sponsor goal paid', sponsorPayouts.length > 0, `${sponsorPayouts.length} payouts`],
    ['merch launched', Object.keys(s.merch.unlocked).length > 0, when('merch launched')],
    ['promoted a team', s.stats.promotions > 0, `${s.stats.promotions} promotions`],
    ['quests claimed', s.quests.claimed > 0, `${s.quests.claimed} claimed`],
  ];
  return table(
    ['progression check', 'ok', 'when'],
    checks.map(([label, ok, detail]) => [label, ok ? 'yes' : 'NO', detail]),
  );
}

if (INCOME_REPORT) {
  sampleIncome();
  console.log('\n' + incomeReport());
  console.log('\n' + sponsorReport());
  console.log('\nProgression:');
  console.log(progressionReport());
}

if (args.json) {
  writeFileSync(String(args.json), JSON.stringify({ mode: MODE, seed: SEED, hours: HOURS, milestones, incomeLog, sponsorPayouts, totals: s.incomeRun, earned: s.earnedRun, fans: s.fans, tier: bestTier(), stats: s.stats }, null, 1));
  console.log(`\nWrote ${args.json}`);
}
