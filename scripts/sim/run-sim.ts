/**
 * Plays the real engine as one simulated player (a persona, see personas.ts) for one seed, and
 * returns what happened: every purchase, a sample of the books every `sampleEvery` seconds,
 * milestones, sales and sponsor payouts.
 *
 * Pure apart from the game state it creates, so several runs can share a process and the matrix
 * driver (matrix.ts) can fan runs out over child processes. Runs are deterministic for a given
 * persona, seed and code version: the game's RNG lives in the save, and the player's own dice
 * (random.ts) are seeded separately.
 */
import { GAMES } from '../../src/data/games';
import { DYNASTY, LEGACY_NODES } from '../../src/data/legacy';
import { PRODUCTS } from '../../src/data/merch';
import { OPERATIONS } from '../../src/data/operations';
import { QUEST_MAP } from '../../src/data/quests';
import { CROWD_BUFF_ID, applyChain, clickLogo } from '../../src/engine/clicker';
import { MAX_DESIGNS, addDesign, analyzeDesign, deleteDesign, generateDesign, setJerseyDesign } from '../../src/engine/designs';
import { signDraftPick } from '../../src/engine/draft';
import { clickDrop } from '../../src/engine/drops';
import { computeMods, computeRates } from '../../src/engine/economy';
import { applyOfflineProgress, tick } from '../../src/engine/game';
import { signListing } from '../../src/engine/market';
import { TRENDING_THRESHOLD, optimalPrice, setLineDesign, setLinePrice, unlockProduct } from '../../src/engine/merch';
import { buyDynasty, buyNode, canSell, dynastyCost, dynastyRank, mandateOffers, nodeState, pendingLegacy, sellOrg } from '../../src/engine/prestige';
import { claimQuest } from '../../src/engine/quests';
import { Rng } from '../../src/engine/rng';
import { decodeSave, encodeSave } from '../../src/engine/save';
import { sectionOpen } from '../../src/engine/sections';
import { signOffer } from '../../src/engine/sponsors';
import { createNewGame } from '../../src/engine/state';
import { setSeasonPlan, unlockGame } from '../../src/engine/teams';
import { playInvitation } from '../../src/engine/tournament';
import { INCOME_SOURCES, type GameState, type IncomeSource, type Mods, type Rates } from '../../src/engine/types';
import { resolveChoice } from '../../src/engine/worldEvents';
import { buyHuman, buyOptimal, candidates, spendTrophies, totalCps, type Candidate, type CandidateOptions } from './buyers';
import { persona as personaById } from './personas';
import { SimRandom } from './random';
import type { Absence, Attention, Milestone, Persona, Purchase, PurchaseKind, Sample, SaleRecord, SimOptions, SimRecord, SponsorPayout } from './types';

/** Challenges change the rules of a run, so the simulator leaves them alone. */
const SKIP_NODES = new Set(['challenges', 'solo', 'potato', 'nostaff', 'nodrops', 'drama']);
/** A new player following the tutorial acts on its prompts within a few seconds. */
const TUTORIAL_DECIDE_EVERY = 5;

const zeroLedger = (): Record<IncomeSource, number> => Object.fromEntries(INCOME_SOURCES.map((k) => [k, 0])) as Record<IncomeSource, number>;

export function runSim(opts: SimOptions): SimRecord {
  const P: Persona = personaById(opts.persona);
  const variant = opts.variant ?? 'baseline';
  const sampleEvery = opts.sampleEvery ?? 600;
  const maxSales = (opts.runs ?? 1) - 1;
  const maxRunSeconds = opts.maxRunSeconds ?? 4 * 3600;
  const questMode = opts.quests ?? 'cash';
  const buyOpts: CandidateOptions = { decor: P.buysDecor, merch: variant !== 'no-merch', teams: variant !== 'no-teams' };
  const rand = new SimRandom(opts.seed * 7919 + 17);

  const purchases: Purchase[] = [];
  const samples: Sample[] = [];
  const sales: SaleRecord[] = [];
  const milestones: Milestone[] = [];
  const sponsorPayouts: SponsorPayout[] = [];
  const snapshots: SimRecord['snapshots'] = [];
  const seen = new Set<string>();

  const s: GameState = opts.from ? decodeSave(opts.from) : createNewGame(0, opts.seed);
  s.settings.onboarded = true;
  if (opts.from) s.buffs = [];
  if (P.automation) for (const key of Object.keys(s.automation) as (keyof typeof s.automation)[]) s.automation[key].on = true;

  let wall = 0;
  let played = 0;
  let run = 1;
  let runStart = 0;
  let attention: Attention = 'active';
  let closed = false;
  let closedAt = { at: 0, cps: 0 };
  const absences: Absence[] = [];

  // ---------------------------------------------------------------------------
  // Purchases
  // ---------------------------------------------------------------------------
  let spent: Sample['spent'] = {};
  const log = (c: Candidate, base: number) => {
    purchases.push({ run, at: wall - runStart, kind: c.kind, id: c.id, cost: c.cost, gain: c.gain, base });
    if (c.kind !== 'level' && c.kind !== 'trophy-upgrade') spent[c.kind] = (spent[c.kind] ?? 0) + c.cost;
  };
  const spendOther = (amount: number) => {
    if (amount > 0) spent.other = (spent.other ?? 0) + amount;
  };

  function ruleBased(): void {
    const mods = computeMods(s);
    const prospect = s.draft?.[0];
    if (prospect && prospect.price <= s.cash) {
      const cash = s.cash;
      signDraftPick(s, prospect.player.id, mods);
      spendOther(cash - s.cash);
    }
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
      if (!q.ready || questMode === 'off') continue;
      const rewards = QUEST_MAP.get(q.id)?.rewards ?? [];
      const want = questMode === 'perk' ? rewards.findIndex((r) => r.kind === 'perk') : -1;
      const choice = want >= 0 ? want : Math.max(0, rewards.findIndex((r) => r.kind === 'cash'));
      claimQuest(s, q.id, choice, { cps: rates.cpsNoBuffs, fansPerSec: rates.fansPerSec }, new Rng(s));
    }
    if (variant !== 'no-teams') {
      const next = GAMES.find((g) => !s.games[g.id]?.unlocked);
      if (next && s.cash >= next.unlockCost * 2) {
        const cash = s.cash;
        unlockGame(s, next.id);
        spendOther(cash - s.cash);
      }
      for (const team of sectionOpen(s, 'market') ? Object.values(s.teams) : []) {
        let guard = 0;
        while (team.lineup.includes(null) && guard++ < 6) {
          const listing = s.market.listings.filter((l) => l.player.gameId === team.gameId && l.currency !== 'legacy').sort((a, b) => a.price - b.price)[0];
          if (!listing || listing.price > s.cash * 0.5) break;
          const cash = s.cash;
          if (!signListing(s, listing.player.id, mods).ok) break;
          spendOther(cash - s.cash);
        }
      }
    }
    if (variant !== 'no-merch' && s.fansRun >= 5_000) {
      for (const p of PRODUCTS) {
        if (!s.merch.unlocked[p.id] && s.fansRun >= p.unlockFans && s.cash >= p.unlockCost * 3) {
          const cash = s.cash;
          unlockProduct(s, p.id);
          spendOther(cash - s.cash);
        }
      }
      let designId: string | undefined = Object.keys(s.designs)[0];
      if (!designId && Object.keys(s.merch.unlocked).length > 0) designId = addDesign(s, generateDesign(new Rng(s), 32, 'Audit design')) ?? undefined;
      // Players who chase the trend brief a new design when it changes and put it on every line.
      if (P.chasesTrend && Object.keys(s.merch.lines).length > 0) {
        const current = Object.values(s.merch.lines)[0]?.designId;
        const onTrend = current && s.designs[current] && analyzeDesign(s.designs[current], s.merch.trend).trend >= TRENDING_THRESHOLD;
        if (!onTrend) {
          if (Object.keys(s.designs).length >= MAX_DESIGNS) {
            const inUse = new Set(Object.values(s.merch.lines).map((l) => l.designId));
            const oldest = Object.values(s.designs)
              .filter((d) => !inUse.has(d.id))
              .sort((a, b) => a.createdAt - b.createdAt)[0];
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
    if (P.playsInvitationals && s.events.invitation) playInvitation(s, { rng: new Rng(s), mods, rates }, 'none');
    if (P.answersEvents) {
      for (const choice of [...s.events.pending]) {
        const cash = s.cash;
        resolveChoice(s, choice.id, choice.defaultOption, { rng: new Rng(s), mods, rates });
        spendOther(cash - s.cash);
      }
    }
  }

  function buy(): void {
    if (P.buyer === 'optimal') buyOptimal(s, P, buyOpts, log);
    else buyHuman(s, P, buyOpts, rand, log);
    if (P.spendsTrophies) spendTrophies(s, log);
  }

  // ---------------------------------------------------------------------------
  // Hype Drops and clicking
  // ---------------------------------------------------------------------------
  let dropsSeen = 0;
  let dropsCaught = 0;
  let chains = 0;
  /** Drop id -> wall second the player will click it, or -1 if they never noticed it. */
  const dropPlan = new Map<number, number>();

  function catchDrop(id: number): void {
    const mods = computeMods(s);
    const result = clickDrop(s, id, { rng: new Rng(s), mods, rates: computeRates(s, mods) });
    if (!result) return;
    dropsCaught++;
    if (result.outcome === 'bubble_chain' && P.chainPops > 0) {
      applyChain(s, P.chainPops, computeMods(s).hypeDurationMult);
      chains++;
    }
  }

  function catchAll(): void {
    if (s.drops.active.length === 0) return;
    const mods = computeMods(s);
    const ctx = { rng: new Rng(s), mods, rates: computeRates(s, mods) };
    for (const d of [...s.drops.active]) {
      const result = clickDrop(s, d.id, ctx);
      if (!result) continue;
      dropsCaught++;
      if (result.outcome === 'bubble_chain' && P.chainPops > 0) {
        applyChain(s, P.chainPops, computeMods(s).hypeDurationMult);
        chains++;
      }
    }
  }

  function watchDrops(): void {
    for (const d of s.drops.active) {
      if (dropPlan.has(d.id)) continue;
      dropsSeen++;
      if (P.drops === 'every-second' || P.drops === 'at-decisions' || P.drops === 'never') {
        dropPlan.set(d.id, -1);
        continue;
      }
      dropPlan.set(d.id, rand.chance(P.drops.notice) ? wall + Math.round(rand.range(P.drops.reaction[0], P.drops.reaction[1])) : -1);
    }
    if (typeof P.drops === 'object' && attention === 'active' && variant !== 'no-drops') {
      for (const d of [...s.drops.active]) {
        const at = dropPlan.get(d.id) ?? -1;
        if (at >= 0 && wall >= at) catchDrop(d.id);
      }
    }
    if (dropPlan.size > 200) for (const id of [...dropPlan.keys()].slice(0, 100)) dropPlan.delete(id);
  }

  let nextBurst = 0;
  let burstStart = -1;
  function clicksThisSecond(): number {
    if (s.tutorial.step === 'click') return 5;
    if (attention !== 'active' || variant === 'no-clicks') return 0;
    const c = P.clicks;
    const intoRun = wall - runStart;
    switch (c.kind) {
      case 'opening':
        return intoRun < c.seconds ? c.cps : 0;
      case 'periodic':
        return intoRun < c.opening || intoRun % c.every < c.burst ? c.cps : 0;
      case 'constant':
        return c.cps;
      case 'tutorial':
        return 0;
      case 'crowd': {
        if (c.opening && intoRun < c.opening.seconds) return c.opening.cps;
        if (wall < nextBurst || s.buffs.some((b) => b.id === CROWD_BUFF_ID && b.endsAt > s.time)) return 0;
        if (burstStart < 0) burstStart = wall;
        if (wall - burstStart >= c.maxBurst) {
          burstStart = -1;
          nextBurst = wall + 60;
          return 0;
        }
        return c.cps;
      }
    }
  }

  function click(n: number): void {
    // Clicks within one second share modifiers and rates, until one of them starts a crowd.
    let ctx: { mods: Mods; rates: Rates } | undefined;
    for (let i = 0; i < n; i++) {
      if (!ctx) {
        const mods = computeMods(s);
        ctx = { mods, rates: computeRates(s, mods) };
      }
      const result = clickLogo(s, ctx);
      if (!result.crowd) continue;
      ctx = undefined;
      if (P.clicks.kind === 'crowd') {
        burstStart = -1;
        nextBurst = wall + Math.round(rand.range(P.clicks.every[0], P.clicks.every[1]));
        break;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Legacy
  // ---------------------------------------------------------------------------
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
    if (sales.length >= maxSales) return;
    const pending = pendingLegacy(s);
    const runWall = wall - runStart;
    if (!canSell(s)) return;
    const forced = opts.sellNow === true && sales.length === 0 && pending >= 1;
    if (!(forced || pending >= Math.max(1, s.prestige.level) || (runWall >= maxRunSeconds && pending >= 1))) return;
    // Milestones are checked once a minute; record this run's before it ends, or a quick sale skips them.
    checkMilestones();
    const nodeValues = valueNodes();
    const mandate = opts.mandate === undefined ? (mandateOffers(s)[0]?.id ?? null) : opts.mandate;
    sellOrg(s, { charter: opts.charter ?? 'operator', mandate });
    const bought = spendLegacy();
    sales.push({ run, wall, runWall, gained: pending, levelAfter: s.prestige.level, bought, nodeValues });
    run++;
    runStart = wall;
    lastCash = s.cash;
    lastIncome = zeroLedger();
  }

  // ---------------------------------------------------------------------------
  // Milestones and sampling
  // ---------------------------------------------------------------------------
  function mark(key: string): void {
    const k = `${run}:${key}`;
    if (seen.has(k)) return;
    seen.add(k);
    milestones.push({ run, key, wall, runWall: wall - runStart, played });
    if (key === 'first legacy point' && run === 1 && opts.snapshotAfterFirstLegacy !== undefined) snapshotAt.push({ at: wall + opts.snapshotAfterFirstLegacy, label: `first legacy +${opts.snapshotAfterFirstLegacy}s` });
  }

  function checkMilestones(): void {
    for (const exp of [6, 9, 12, 15, 18]) if (s.earnedRun >= 10 ** exp) mark(`earned 1e${exp}`);
    for (const g of GAMES) if (s.games[g.id]?.unlocked && g.index > 0) mark(`unlock ${g.id}`);
    for (const op of OPERATIONS) if (s.ops[op.id].owned > 0) mark(`first ${op.id}`);
    if (s.tutorial.step === 'done') mark('tutorial done');
    if (s.sponsors.active.length > 0) mark('first sponsor');
    if (Object.keys(s.merch.unlocked).length > 0) mark('merch launched');
    if (canSell(s)) mark('first legacy point');
    for (const tier of [3, 6, 9, 12, 15, 18]) if (Math.max(0, ...Object.values(s.teams).map((t) => t.bestTier)) >= tier) mark(`tier ${tier}`);
  }

  let lastIncome = zeroLedger();
  let lastCash = s.cash;
  let lastCrowds = s.stats.crowdsTotal;
  let lastChains = 0;
  let lastDrops = { seen: 0, caught: 0 };
  let uplift = { crowd: 0, frenzy: 0, other: 0 };

  function sample(): void {
    const booked = zeroLedger();
    let ledgerDelta = 0;
    for (const k of INCOME_SOURCES) {
      const d = (s.incomeRun[k] ?? 0) - (lastIncome[k] ?? 0);
      booked[k] = Math.max(0, d);
      ledgerDelta += d;
    }
    lastIncome = { ...s.incomeRun };
    const spentTotal = Object.values(spent).reduce((a, b) => a + (b ?? 0), 0);
    const unledgered = s.cash - lastCash - ledgerDelta + spentTotal;
    lastCash = s.cash;
    const mods = computeMods(s);
    const r = computeRates(s, mods);
    samples.push({
      run,
      wall,
      runWall: wall - runStart,
      attention,
      earnedRun: s.earnedRun,
      earnedTotal: s.earnedTotal,
      totalCps: r.totalCps,
      steadyCps: steadyCps(),
      opsCps: r.cpsNoBuffs,
      matchCps: r.matchCps,
      merchCps: r.merchCps,
      booked,
      uplift,
      mults: { sponsor: 1 + mods.sponsorIncomePct, legacy: 1 + s.prestige.level * mods.legacyLevelPct, fame: r.fameMult, superfan: r.superfanMult, global: r.globalMult },
      spent,
      unledgered: Math.abs(unledgered) < 1e-6 * Math.max(1, s.cash) ? 0 : unledgered,
      crowds: s.stats.crowdsTotal - lastCrowds,
      chains: chains - lastChains,
      drops: { seen: dropsSeen - lastDrops.seen, caught: dropsCaught - lastDrops.caught },
      fans: s.fans,
      bestTier: Math.max(0, ...Object.values(s.teams).map((t) => t.bestTier)),
      quest: s.quests.active[0]?.id ?? null,
      questsClaimed: s.quests.claimed,
      legacyLevel: s.prestige.level,
      pending: pendingLegacy(s),
      merchLines: Object.keys(s.merch.unlocked).length,
      merchFinish: Object.values(s.merch.lines).reduce((a, l) => a + (l.quality ?? 0), 0),
      invitationals: [s.stats.tournamentsWon, s.stats.tournamentsPlayed],
      sponsors: s.sponsors.active.length,
      staff: Object.values(s.staff).reduce((a, b) => a + b, 0),
      players: Object.keys(s.players).length,
      ...storeReadings(r.totalCps),
    });
    opts.onSample?.(s, samples[samples.length - 1]);
    spent = {};
    uplift = { crowd: 0, frenzy: 0, other: 0 };
    lastCrowds = s.stats.crowdsTotal;
    lastChains = chains;
    lastDrops = { seen: dropsSeen, caught: dropsCaught };
  }

  /** Income per second without temporary buffs (crowds, frenzies, merch spikes): the steady pace. */
  function steadyCps(): number {
    const buffs = s.buffs;
    s.buffs = [];
    const v = computeRates(s).totalCps;
    s.buffs = buffs;
    return v;
  }

  /** What the best-payback purchase of each kind would cost in seconds of income (check D), and its payback (check E). */
  function storeReadings(income: number): Pick<Sample, 'afford' | 'payback'> {
    if (!(income > 0)) return { afford: {}, payback: {} };
    const base = totalCps(s);
    const afford: Sample['afford'] = {};
    const payback: Sample['payback'] = {};
    for (const c of candidates(s, base, { ...buyOpts, everything: true })) {
      if (!(c.gain > 0) || !Number.isFinite(c.cost) || c.cost / c.gain >= (payback[c.kind] ?? Infinity)) continue;
      payback[c.kind] = c.cost / c.gain;
      afford[c.kind] = c.cost / income;
    }
    return { afford, payback };
  }

  /** What temporary buffs added to this second's income, split by buff family in log proportion. */
  function addUplift(r: Rates): void {
    let merchMult = 1;
    const weights = { crowd: 0, frenzy: 0, other: 0 };
    for (const b of s.buffs) {
      if (b.endsAt <= s.time - 1) continue;
      let w = 0;
      for (const e of b.effects) {
        if (e.kind === 'income') w += Math.log(e.mult);
        if (e.kind === 'merch') {
          w += Math.log(e.mult) * (r.totalCps > 0 ? r.merchCps / r.totalCps : 0);
          merchMult *= e.mult;
        }
      }
      if (w === 0) continue;
      const family = b.id === CROWD_BUFF_ID ? 'crowd' : b.id === 'frenzy' ? 'frenzy' : 'other';
      weights[family] += w;
    }
    const sum = weights.crowd + weights.frenzy + weights.other;
    if (sum === 0) return;
    const inc = r.buffIncomeMult || 1;
    const unbuffed = r.cpsNoBuffs + r.matchCps / inc + r.merchCps / (inc * merchMult);
    const total = r.totalCps - unbuffed;
    if (!Number.isFinite(total)) return;
    uplift.crowd += (total * weights.crowd) / sum;
    uplift.frenzy += (total * weights.frenzy) / sum;
    uplift.other += (total * weights.other) / sum;
  }

  const snapshotAt: { at: number; label: string }[] = (opts.snapshotsAt ?? []).map((at) => ({ at, label: `${at}s` }));
  function takeSnapshots(): void {
    for (let i = snapshotAt.length - 1; i >= 0; i--) {
      if (run !== 1 || wall < snapshotAt[i].at) continue;
      snapshots.push({ label: snapshotAt[i].label, wall, runWall: wall - runStart, save: encodeSave(s) });
      snapshotAt.splice(i, 1);
    }
  }

  // ---------------------------------------------------------------------------
  // Play
  // ---------------------------------------------------------------------------
  const [decideMin, decideMax] = P.decideEvery;
  let nextDecision = 1;
  const started = Date.now();
  const total = opts.hours * 3600;
  while (wall < total) {
    const learning = P.tutorialFocus && s.tutorial.step !== 'done';
    attention = learning ? 'active' : P.attention(wall);
    if (attention === 'closed') {
      if (!closed) {
        closed = true;
        s.lastSaved = wall * 1000;
        const r = computeRates(s);
        const inc = r.buffIncomeMult || 1;
        closedAt = { at: wall, cps: r.cpsNoBuffs + (r.matchCps + r.merchCps) / inc };
      }
    } else {
      if (closed) {
        closed = false;
        const report = applyOfflineProgress(s, wall * 1000);
        if (report) absences.push({ run, at: closedAt.at, away: report.awaySeconds, counted: report.countedSeconds, rate: report.rate, earned: report.earned, cpsAtClose: closedAt.cps });
      }
      const n = clicksThisSecond();
      if (n > 0) click(n);
      if (P.drops === 'every-second' && attention === 'active' && variant !== 'no-drops') catchAll();
      const sponsorBefore = s.incomeRun.sponsor;
      const { rates } = tick(s, 1);
      played++;
      addUplift(rates);
      const paid = s.incomeRun.sponsor - sponsorBefore;
      if (paid > 0) {
        const cps = Math.max(1, computeRates(s).totalCps);
        // Contract income is a multiplier; the sponsor ledger only ever sees goal bonuses.
        if (paid > cps * 5) sponsorPayouts.push({ run, at: wall + 1 - runStart, amount: paid, seconds: paid / cps });
      }
    }
    wall++;
    if (!closed) {
      if (attention === 'active') watchDrops();
      if (attention === 'active' && wall >= nextDecision) {
        if (P.drops === 'at-decisions' && variant !== 'no-drops') catchAll();
        maybeSell();
        ruleBased();
        buy();
        if (learning) nextDecision = wall + TUTORIAL_DECIDE_EVERY;
        else nextDecision = decideMin === decideMax ? (Math.floor(wall / decideMin) + 1) * decideMin : wall + Math.round(rand.range(decideMin, decideMax));
      }
      if (wall % 60 === 0) checkMilestones();
    }
    if (wall % sampleEvery === 0) sample();
    if (snapshotAt.length > 0) takeSnapshots();
  }

  return {
    persona: P.id,
    variant,
    seed: opts.seed,
    hours: opts.hours,
    fromSave: opts.from !== undefined,
    ranSeconds: (Date.now() - started) / 1000,
    purchases,
    samples,
    sales,
    milestones,
    sponsorPayouts,
    absences,
    snapshots,
    final: {
      run,
      earnedTotal: s.earnedTotal,
      earnedRun: s.earnedRun,
      legacyLevel: s.prestige.level,
      pending: pendingLegacy(s),
      questsClaimed: s.quests.claimed,
      incomeRun: { ...s.incomeRun },
    },
  };
}

export type { PurchaseKind };
