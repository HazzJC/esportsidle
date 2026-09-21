import { GAME_MAP } from '../data/games';
import { OPERATIONS } from '../data/operations';
import { addBuff } from './buffs';
import { emit } from './bus';
import { fmt, fmtTime, money } from './format';
import type { Rng } from './rng';
import { INVITATION_SECONDS, invitationOdds, invitationalName, offerInvitation, pickTournamentTeam } from './tournament';
import type { ActiveDrop, DropKind, GameState, Mods, Rates, Tone } from './types';
import { earnCash, gainFans } from './wallet';

export const DROP_LIFETIME = 13;
export const CHAIN_LIFETIME = 6;
export const DROP_INTERVAL: [number, number] = [180, 600];
export const FIRST_DROP: [number, number] = [45, 120];
/** Share of drops that are Drama Drops at each drama level. */
export const DRAMA_SHARE = [0, 0.33, 0.66, 1];

export interface DropContext {
  rng: Rng;
  mods: Mods;
  rates: Rates;
}

export interface DropResult {
  outcome: string;
  title: string;
  body: string;
  icon: string;
  tone: Tone;
}

interface Outcome {
  id: string;
  kind: DropKind;
  weight: (s: GameState, ctx: DropContext) => number;
  apply: (s: GameState, ctx: DropContext) => DropResult;
}

function buffSeconds(ctx: DropContext, seconds: number): number {
  return seconds * ctx.mods.buffDurationMult * ctx.rng.range(0.5, 1.5);
}

export function dramaShare(s: GameState, mods: Mods): number {
  // Tabloid Darling challenge: every drop is drama.
  if (s.prestige.challenge === 'drama') return 1;
  if (s.time < s.events.calmUntil) return 0;
  const level = Math.max(0, Math.min(DRAMA_SHARE.length - 1, Math.floor(mods.dramaLevel)));
  return DRAMA_SHARE[level] * mods.dramaShareMult;
}

function hypeTrainBase(ctx: DropContext): number {
  return Math.max(7, ctx.rates.cpsNoBuffs * 6);
}

export function hypeTrainPayout(s: GameState, ctx: DropContext, step: number): number {
  const cap = Math.min(s.cash * 0.5, ctx.rates.cpsNoBuffs * 21_600) + 7;
  return Math.min(hypeTrainBase(ctx) * Math.pow(7, step - 1), cap);
}

function continueHypeTrain(s: GameState, ctx: DropContext, step: number): DropResult {
  const payout = hypeTrainPayout(s, ctx, step);
  earnCash(s, payout, 'drop');
  s.stats.hypeTrainBest = Math.max(s.stats.hypeTrainBest, step);
  const capped = payout < hypeTrainBase(ctx) * Math.pow(7, step - 1);
  const goesOn = !capped && ctx.rng.chance(Math.max(0.2, 0.95 - step * 0.05));
  if (goesOn) spawnDrop(s, ctx, step + 1);
  return {
    outcome: 'train',
    title: `Hype Train · carriage ${step}`,
    body: goesOn ? `+${money(payout)}. Catch the next carriage!` : `+${money(payout)}. The train has left the station.`,
    icon: 'rocket',
    tone: 'gold',
  };
}

const OUTCOMES: Outcome[] = [
  {
    id: 'frenzy',
    kind: 'hype',
    weight: () => 45,
    apply: (s, ctx) => {
      const d = buffSeconds(ctx, 77);
      addBuff(s, { id: 'frenzy', name: 'LAN Frenzy', icon: 'zap', tone: 'good', desc: 'Income ×7', duration: d, effects: [{ kind: 'income', mult: 7 }] });
      return { outcome: 'frenzy', title: 'LAN Frenzy!', body: `Income ×7 for ${fmtTime(d)}.`, icon: 'zap', tone: 'gold' };
    },
  },
  {
    id: 'prize',
    kind: 'hype',
    weight: () => 40,
    apply: (s, ctx) => {
      const amount = Math.min(s.cash * 0.15, ctx.rates.cpsNoBuffs * 900) + 13;
      earnCash(s, amount, 'drop');
      return { outcome: 'prize', title: 'Prize Pool!', body: `+${money(amount)} from a surprise showmatch.`, icon: 'dollar-sign', tone: 'gold' };
    },
  },
  {
    id: 'clutch',
    kind: 'hype',
    weight: (s) => (s.earnedRun >= 1e6 ? 7 : 0),
    apply: (s, ctx) => {
      const d = buffSeconds(ctx, 13);
      addBuff(s, { id: 'clutch', name: 'Clutch Mode', icon: 'mouse-pointer-click', tone: 'good', desc: 'Clicks ×777', duration: d, effects: [{ kind: 'click', mult: 777 }] });
      return { outcome: 'clutch', title: 'Clutch Mode!', body: `Clicks are worth ×777 for ${fmtTime(d)}. Click!`, icon: 'mouse-pointer-click', tone: 'gold' };
    },
  },
  {
    id: 'legendary_clutch',
    kind: 'hype',
    weight: (s) => (s.earnedRun >= 1e9 ? 1 : 0),
    apply: (s, ctx) => {
      const d = buffSeconds(ctx, 8);
      addBuff(s, { id: 'legendary_clutch', name: 'Legendary Clutch', icon: 'mouse-pointer-click', tone: 'good', desc: 'Clicks ×7777', duration: d, effects: [{ kind: 'click', mult: 7777 }] });
      return { outcome: 'legendary_clutch', title: 'Legendary Clutch!', body: `Clicks are worth ×7777 for ${fmtTime(d)}.`, icon: 'mouse-pointer-click', tone: 'gold' };
    },
  },
  {
    id: 'bubble_chain',
    kind: 'hype',
    weight: (s) => s.settings.hypeChain !== false ? 2 : 0,
    apply: () => {
      emit({ type: 'hypeChain' });
      return { outcome: 'bubble_chain', title: 'Hype bubbles!', body: 'Pop the bubbles before they fade to build a huge crowd.', icon: 'megaphone', tone: 'gold' };
    },
  },
  {
    id: 'merch_surge',
    kind: 'hype',
    weight: (s) => Object.values(s.merch.lines).some((line) => line.designId) ? 12 : 0,
    apply: (s, ctx) => {
      const d = buffSeconds(ctx, 90);
      addBuff(s, { id: 'merch_surge', name: 'Merch Spotlight', icon: 'shirt', tone: 'good', desc: 'Merch sales ×5', duration: d, effects: [{ kind: 'merch', mult: 5 }] });
      return { outcome: 'merch_surge', title: 'Merch Spotlight!', body: `Merch sales ×5 for ${fmtTime(d)}.`, icon: 'shirt', tone: 'gold' };
    },
  },
  {
    id: 'fan_meet',
    kind: 'hype',
    weight: () => 11,
    apply: (s, ctx) => {
      const fans = Math.max(100, s.fans * 0.08, ctx.rates.fansPerSec * 900);
      gainFans(s, fans);
      return { outcome: 'fan_meet', title: 'Fan Meet!', body: `A surprise appearance brings in ${fmt(fans)} fans.`, icon: 'heart', tone: 'gold' };
    },
  },
  {
    id: 'viral',
    kind: 'hype',
    weight: () => 12,
    apply: (s, ctx) => {
      const fans = Math.max(s.fans * 0.1, ctx.rates.fansPerSec * 600) + 50;
      gainFans(s, fans);
      const d = buffSeconds(ctx, 60);
      addBuff(s, { id: 'viral', name: 'Viral Clip', icon: 'video', tone: 'good', desc: 'Fan gain ×5', duration: d, effects: [{ kind: 'fans', mult: 5 }] });
      return { outcome: 'viral', title: 'Viral Clip!', body: `+${fmt(fans)} fans and fan gain ×5 for ${fmtTime(d)}.`, icon: 'video', tone: 'gold' };
    },
  },
  {
    id: 'rush',
    kind: 'hype',
    weight: (s) => (OPERATIONS.some((op) => s.ops[op.id].owned >= 10) ? 10 : 0),
    apply: (s, ctx) => {
      const eligible = OPERATIONS.filter((op) => s.ops[op.id].owned >= 10);
      if (eligible.length === 0) return applyDropOutcome(s, 'prize', ctx);
      const op = ctx.rng.weighted(eligible, (o) => s.ops[o.id].owned) ?? eligible[0];
      const mult = 1 + s.ops[op.id].owned / 10;
      const d = buffSeconds(ctx, 30);
      addBuff(s, {
        id: 'rush',
        name: `${op.name} Rush`,
        icon: op.icon,
        tone: 'good',
        desc: `${op.plural} ×${fmt(mult, 1)}`,
        duration: d,
        effects: [{ kind: 'op', op: op.id, mult }],
      });
      return { outcome: 'rush', title: `${op.name} Rush!`, body: `${op.plural} produce ×${fmt(mult, 1)} for ${fmtTime(d)}.`, icon: op.icon, tone: 'gold' };
    },
  },
  {
    id: 'train',
    kind: 'hype',
    weight: (s) => (s.earnedRun >= 1e5 ? 4 : 0),
    apply: (s, ctx) => continueHypeTrain(s, ctx, 1),
  },
  {
    id: 'tournament',
    kind: 'hype',
    // About one hype drop in six once a team is playing: roughly one Invitational every 40 minutes.
    weight: (s, ctx) => (!s.events.invitation && pickTournamentTeam(s, ctx.rates) ? 24 * ctx.mods.tournamentWeightMult : 0),
    apply: (s, ctx) => {
      const inv = offerInvitation(s, ctx);
      const odds = inv ? invitationOdds(s, ctx.rates, ctx.mods, 0, inv.gameId) : null;
      if (!inv || !odds) return applyDropOutcome(s, 'prize', ctx);
      const name = GAME_MAP.get(inv.gameId)?.name ?? 'Your team';
      return {
        outcome: 'tournament',
        title: `${invitationalName(odds.tier)} invite!`,
        body: `${name} have ${Math.round(odds.champion * 100)}% to win it. It starts in ${fmtTime(INVITATION_SECONDS)}; spend on preparation to raise the odds.`,
        icon: 'trophy',
        tone: 'gold',
      };
    },
  },
  // Drama drops ---------------------------------------------------------------
  {
    id: 'scandal',
    kind: 'drama',
    weight: () => 30,
    apply: (s, ctx) => {
      const d = buffSeconds(ctx, 66);
      addBuff(s, { id: 'scandal', name: 'Scandal', icon: 'skull', tone: 'bad', desc: 'Income ×0.5', duration: d, effects: [{ kind: 'income', mult: 0.5 }] });
      const lost = s.fans * 0.02;
      s.fans -= lost;
      return { outcome: 'scandal', title: 'Scandal!', body: `Old tweets resurface. Income ×0.5 for ${fmtTime(d)} and ${fmt(lost)} fans unfollow.`, icon: 'skull', tone: 'bad' };
    },
  },
  {
    id: 'outage',
    kind: 'drama',
    weight: () => 15,
    apply: (s, ctx) => {
      const d = buffSeconds(ctx, 30);
      addBuff(s, { id: 'outage', name: 'Server Outage', icon: 'server', tone: 'bad', desc: 'Income ×0.25', duration: d, effects: [{ kind: 'income', mult: 0.25 }] });
      return { outcome: 'outage', title: 'Server Outage!', body: `A DDoS rage-quit takes your servers down. Income ×0.25 for ${fmtTime(d)}.`, icon: 'server', tone: 'bad' };
    },
  },
  {
    id: 'ragebait',
    kind: 'drama',
    weight: () => 20,
    apply: (s, ctx) => {
      const d = buffSeconds(ctx, 60);
      addBuff(s, { id: 'ragebait', name: 'Controversy Frenzy', icon: 'flame', tone: 'good', desc: 'Income ×15', duration: d, effects: [{ kind: 'income', mult: 15 }] });
      const fans = s.fans * 0.25 + 100;
      gainFans(s, fans);
      return { outcome: 'ragebait', title: 'Controversy Frenzy!', body: `Everyone is talking about you. Income ×15 for ${fmtTime(d)} and +${fmt(fans)} fans.`, icon: 'flame', tone: 'gold' };
    },
  },
  {
    id: 'leak',
    kind: 'drama',
    weight: () => 25,
    apply: (s, ctx) => {
      const amount = Math.min(s.cash * 0.25, ctx.rates.cpsNoBuffs * 1800) + 13;
      earnCash(s, amount, 'drop');
      return { outcome: 'leak', title: 'Leaked DMs Payday', body: `The drama documentary rights sold for ${money(amount)}.`, icon: 'dollar-sign', tone: 'gold' };
    },
  },
  {
    id: 'backlash',
    kind: 'drama',
    weight: () => 10,
    apply: (s, ctx) => {
      const loss = Math.min(s.cash * 0.05, ctx.rates.cpsNoBuffs * 300);
      s.cash -= loss;
      return { outcome: 'backlash', title: 'Backlash!', body: `Refunds, apologies and a lawyer. You lose ${money(loss)}.`, icon: 'skull', tone: 'bad' };
    },
  },
];

export const DROP_OUTCOME_IDS: string[] = OUTCOMES.map((o) => o.id);

export function applyDropOutcome(s: GameState, id: string, ctx: DropContext): DropResult {
  const outcome = OUTCOMES.find((o) => o.id === id);
  if (!outcome) throw new Error(`Unknown drop outcome ${id}`);
  return outcome.apply(s, ctx);
}

/** How far apart drops try to spawn, as a share of the play area. */
const DROP_SPACING = 0.22;

/** A spot that is not already taken by another drop, so one can never hide behind another. */
function freeSpot(s: GameState, ctx: DropContext): { x: number; y: number } {
  let best = { x: ctx.rng.range(0.06, 0.94), y: ctx.rng.range(0.08, 0.92) };
  let bestGap = -1;
  for (let attempt = 0; attempt < 6; attempt++) {
    const spot = { x: ctx.rng.range(0.06, 0.94), y: ctx.rng.range(0.08, 0.92) };
    const gap = s.drops.active.reduce((min, d) => Math.min(min, Math.hypot(d.x - spot.x, d.y - spot.y)), Number.POSITIVE_INFINITY);
    if (gap >= DROP_SPACING) return spot;
    if (gap > bestGap) {
      bestGap = gap;
      best = spot;
    }
  }
  return best;
}

export function spawnDrop(s: GameState, ctx: DropContext, chain = 0): ActiveDrop {
  const kind: DropKind = chain === 0 && ctx.rng.chance(dramaShare(s, ctx.mods)) ? 'drama' : 'hype';
  const life = (chain > 0 ? CHAIN_LIFETIME : DROP_LIFETIME) * ctx.mods.dropLifeMult;
  const spot = freeSpot(s, ctx);
  const drop: ActiveDrop = {
    id: s.nextId++,
    kind,
    x: spot.x,
    y: spot.y,
    spawnedAt: s.time,
    expiresAt: s.time + life,
    chain,
  };
  s.drops.active.push(drop);
  emit({ type: 'drop', kind });
  return drop;
}

export function scheduleNextDrop(s: GameState, ctx: DropContext): void {
  s.drops.nextAt = s.time + ctx.rng.range(DROP_INTERVAL[0], DROP_INTERVAL[1]) * ctx.mods.dropIntervalMult;
}

export function updateDrops(s: GameState, ctx: DropContext): void {
  if (s.drops.active.length > 0) {
    const live = s.drops.active.filter((d) => d.expiresAt > s.time);
    const missed = s.drops.active.length - live.length;
    if (missed > 0) {
      s.drops.active = live;
      s.stats.dropsMissed += missed;
    }
  }
  if (s.drops.nextAt <= 0) {
    s.drops.nextAt = s.time + ctx.rng.range(FIRST_DROP[0], FIRST_DROP[1]);
    return;
  }
  // No Hype challenge: drops never spawn.
  if (s.time >= s.drops.nextAt && s.drops.active.length === 0 && s.prestige.challenge !== 'nodrops') {
    spawnDrop(s, ctx);
    scheduleNextDrop(s, ctx);
  }
}

export const PR_CLEANUP_SECONDS = 1800;

export function prCleanupCost(cpsNoBuffs: number): number {
  return Math.ceil(Math.max(1000, cpsNoBuffs * 600));
}

/** How long the fallout lasts when an org rides out a scandal instead of paying to bury it. */
export const SCANDAL_SECONDS = 300;
/** The share of the fanbase that walks out during a scandal. They all come back afterwards. */
export const SCANDAL_FAN_SHARE = 0.25;
export const SCANDAL_INCOME_MULT = 0.8;
export const SCANDAL_FAN_MULT = 0.5;

/** How many fans would walk if the org rode out the drama right now. */
export function scandalFanLoss(s: GameState): number {
  return Math.floor(s.fans * SCANDAL_FAN_SHARE);
}

/**
 * Takes the hit instead of paying: a chunk of the fanbase walks out, income and fan gain suffer for
 * a few minutes, and the story dies down. The fans come back when it blows over, so riding it out
 * costs momentum rather than cash — the option an org without a war chest actually has.
 */
export function rideOutDrama(s: GameState): boolean {
  if (s.time < s.events.calmUntil) return false;
  const lost = scandalFanLoss(s);
  s.fans -= lost;
  s.events.fansHeld += lost;
  s.events.fansReturnAt = s.time + SCANDAL_SECONDS;
  addBuff(s, {
    id: 'scandal',
    name: 'Scandal',
    icon: 'flame',
    tone: 'bad',
    desc: `Income ×${SCANDAL_INCOME_MULT} · new fans ×${SCANDAL_FAN_MULT}`,
    duration: SCANDAL_SECONDS,
    effects: [
      { kind: 'income', mult: SCANDAL_INCOME_MULT },
      { kind: 'fans', mult: SCANDAL_FAN_MULT },
    ],
  });
  s.events.calmUntil = s.time + PR_CLEANUP_SECONDS;
  s.drops.active = s.drops.active.filter((d) => d.kind !== 'drama');
  return true;
}

/** Brings back the fans who walked out, once the scandal has blown over. Returns how many. */
export function returnScandalFans(s: GameState): number {
  if (s.events.fansHeld <= 0 || s.time < s.events.fansReturnAt) return 0;
  const back = s.events.fansHeld;
  s.events.fansHeld = 0;
  s.fans += back;
  return back;
}

/** Pays a PR team to suppress Drama Drops for a while and clears any on screen. */
export function calmDrama(s: GameState, cpsNoBuffs: number): boolean {
  const cost = prCleanupCost(cpsNoBuffs);
  if (s.cash < cost) return false;
  s.cash -= cost;
  s.events.calmUntil = s.time + PR_CLEANUP_SECONDS;
  s.drops.active = s.drops.active.filter((d) => d.kind !== 'drama');
  return true;
}

export function clickDrop(s: GameState, dropId: number, ctx: DropContext): DropResult | null {
  const index = s.drops.active.findIndex((d) => d.id === dropId);
  if (index < 0) return null;
  const [drop] = s.drops.active.splice(index, 1);
  if (drop.kind === 'drama') s.stats.dramaClicked++;
  else s.stats.dropsClicked++;
  let result: DropResult;
  if (drop.chain > 0) {
    result = continueHypeTrain(s, ctx, drop.chain);
  } else {
    const pool = OUTCOMES.filter((o) => o.kind === drop.kind);
    const outcome = ctx.rng.weighted(pool, (o) => o.weight(s, ctx)) ?? pool[0];
    result = outcome.apply(s, ctx);
  }
  emit({ type: 'toast', title: result.title, body: result.body, icon: result.icon, tone: result.tone });
  return result;
}
