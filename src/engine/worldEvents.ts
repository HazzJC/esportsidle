import { GAMES, GENRE_LABEL, type GameDef } from '../data/games';
import { FAN_BASE, FAN_GROWTH } from '../data/leagues';
import { RIVAL_ORGS } from '../data/names';
import { addBuff } from './buffs';
import { emit } from './bus';
import { fmt, fmtTime, money } from './format';
import { inflict } from './health';
import { TREND_MAP } from '../data/merch';
import { refreshMarket } from './market';
import { isMerchUnlocked, rotateTrend } from './merch';
import { addModifier, expireModifiers } from './modifiers';
import { applyMorale, isAvailable, sellValue } from './players';
import { shockPopularity } from './popularity';
import type { Rng } from './rng';
import { removeFromTeams } from './teams';
import type { EventLogEntry, GameState, Mods, PendingChoice, Player, Rates, Tone } from './types';
import { earnCash, gainFans } from './wallet';

export const EVENT_INTERVAL: [number, number] = [90, 240];
export const FIRST_EVENT: [number, number] = [60, 120];
export const CHOICE_LIFETIME = 120;
export const MAX_PENDING_CHOICES = 3;
export const LOG_LENGTH = 30;

export interface EventContext {
  rng: Rng;
  mods: Mods;
  rates: Rates;
}

export interface WorldEventDef {
  id: string;
  category: 'game' | 'player' | 'market' | 'meta' | 'org';
  weight: (s: GameState, ctx: EventContext) => number;
  fire: (s: GameState, ctx: EventContext) => void;
  resolve?: (s: GameState, choice: PendingChoice, option: number, ctx: EventContext) => void;
}

export function logEvent(s: GameState, entry: Omit<EventLogEntry, 'time'>, toast = true): void {
  s.events.log.unshift({ time: s.time, ...entry });
  if (s.events.log.length > LOG_LENGTH) s.events.log.length = LOG_LENGTH;
  s.stats.eventsSeen++;
  if (toast) emit({ type: 'toast', title: entry.title, body: entry.body, icon: entry.icon, tone: entry.tone });
}

export function offerChoice(s: GameState, choice: Omit<PendingChoice, 'id' | 'expiresAt'>): PendingChoice {
  const pending: PendingChoice = { ...choice, id: s.nextId++, expiresAt: s.time + CHOICE_LIFETIME };
  s.events.pending.push(pending);
  s.stats.eventsSeen++;
  emit({ type: 'choice' });
  return pending;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const unlockedGames = (s: GameState): GameDef[] => GAMES.filter((g) => s.games[g.id]?.unlocked);
const allPlayers = (s: GameState): Player[] => Object.values(s.players);
const tradable = (s: GameState): Player[] => allPlayers(s).filter((p) => !p.founder);
const canOfferChoice = (s: GameState): boolean => s.events.pending.length < MAX_PENDING_CHOICES;
const teamTier = (s: GameState, p: Player): number => s.teams[p.gameId]?.tier ?? 0;

function popularityEvent(id: string, weight: number, mult: number, title: (game: string) => string, body: string, tone: Tone): WorldEventDef {
  return {
    id,
    category: 'game',
    weight: (s) => (unlockedGames(s).length > 0 ? weight : 0),
    fire: (s, ctx) => {
      const g = ctx.rng.pick(unlockedGames(s));
      shockPopularity(s, g.id, mult);
      logEvent(s, { title: title(g.name), body: `${body} Popularity ×${mult}.`, icon: g.icon, tone });
    },
  };
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
export const WORLD_EVENTS: WorldEventDef[] = [
  popularityEvent('patch_buff', 6, 1.25, (g) => `${g} patch lands perfectly`, 'Players love the changes.', 'good'),
  popularityEvent('patch_nerf', 5, 0.8, (g) => `${g} balance patch backfires`, 'Everyone hates the new meta.', 'bad'),
  popularityEvent('streamer', 3, 1.5, (g) => `Mega-streamer switches to ${g}`, 'Millions of viewers follow.', 'good'),
  popularityEvent('anticheat', 2, 0.7, (g) => `${g} anti-cheat meltdown`, 'Cheaters everywhere. Players flee.', 'bad'),
  popularityEvent('sequel', 2, 1.2, (g) => `${g} sequel teased`, 'The hype is unreal.', 'good'),
  {
    id: 'world_champs',
    category: 'game',
    weight: (s) => (Object.values(s.teams).some((t) => t.tier >= 2) ? 3 : 0),
    fire: (s, ctx) => {
      const eligible = unlockedGames(s).filter((g) => s.teams[g.id]);
      const g = ctx.rng.pick(eligible);
      addModifier(s, {
        id: `champs_${g.id}`,
        kind: 'gamePrize',
        target: g.id,
        mult: 1.5,
        duration: 300,
        name: `${g.name} Worlds season`,
        desc: `${g.name} prize money ×1.5`,
        icon: 'trophy',
        tone: 'good',
      });
      logEvent(s, { title: `${g.name} World Championship season`, body: `Prize money for ${g.name} matches ×1.5 for ${fmtTime(300)}.`, icon: 'trophy', tone: 'good' });
    },
  },
  {
    id: 'meta_shift',
    category: 'meta',
    weight: (s) => (unlockedGames(s).length > 0 ? 3 : 0),
    fire: (s, ctx) => {
      const g = ctx.rng.pick(unlockedGames(s));
      const label = GENRE_LABEL[g.genre];
      addModifier(s, {
        id: `meta_${g.genre}`,
        kind: 'genreRating',
        target: g.genre,
        mult: 1.15,
        duration: 600,
        name: `${label} meta shift`,
        desc: `${label} team ratings +15%`,
        icon: 'sparkles',
        tone: 'good',
      });
      logEvent(s, { title: `The meta favours ${label} teams`, body: `${label} team ratings +15% for ${fmtTime(600)}.`, icon: 'sparkles', tone: 'good' });
    },
  },
  {
    id: 'goes_viral',
    category: 'player',
    weight: (s) => (allPlayers(s).length > 0 ? 5 : 0),
    fire: (s, ctx) => {
      const p = ctx.rng.pick(allPlayers(s));
      const fans = FAN_BASE * Math.pow(FAN_GROWTH, teamTier(s, p)) * 40 * ctx.mods.fansMult;
      gainFans(s, fans);
      applyMorale(p, 10, ctx.mods);
      logEvent(s, { title: `${p.tag}'s clip goes viral`, body: `+${fmt(fans)} fans and a big morale boost.`, icon: 'video', tone: 'good' });
    },
  },
  {
    id: 'hot_streak',
    category: 'player',
    weight: (s) => (allPlayers(s).length > 0 ? 4 : 0),
    fire: (s, ctx) => {
      const p = ctx.rng.pick(allPlayers(s));
      p.morale = 100;
      p.energy = 100;
      logEvent(s, { title: `${p.tag} is on fire`, body: 'Morale and energy maxed out.', icon: 'flame', tone: 'good' });
    },
  },
  {
    id: 'birthday',
    category: 'player',
    weight: (s) => (allPlayers(s).length > 0 ? 3 : 0),
    fire: (s, ctx) => {
      const p = ctx.rng.pick(allPlayers(s));
      applyMorale(p, 20, ctx.mods);
      const cake = (s.staff.chef ?? 0) > 0 ? 'The chef baked a cake.' : 'Someone bought a supermarket cake.';
      logEvent(s, { title: `It's ${p.tag}'s birthday!`, body: `${cake} Morale +20.`, icon: 'party-popper', tone: 'good' });
    },
  },
  {
    id: 'mouse_battery',
    category: 'player',
    weight: (s) => (allPlayers(s).some((p) => p.gear.mouse >= 4) ? 2 : 0),
    fire: (s, ctx) => {
      const p = ctx.rng.pick(allPlayers(s).filter((x) => x.gear.mouse >= 4));
      p.energy = Math.max(0, p.energy - 20);
      applyMorale(p, -5, ctx.mods);
      logEvent(s, { title: `${p.tag} forgot to charge their mouse`, body: 'Mid-match. On stream. Energy -20.', icon: 'mouse', tone: 'bad' });
    },
  },
  {
    id: 'takeaway',
    category: 'player',
    weight: (s) => (Object.values(s.teams).some((t) => t.lineup.filter(Boolean).length >= 2) ? ((s.staff.chef ?? 0) > 0 ? 0.6 : 1.5) : 0),
    fire: (s, ctx) => {
      const team = Object.values(s.teams).sort((a, b) => b.lineup.filter(Boolean).length - a.lineup.filter(Boolean).length)[0];
      let sick = 0;
      for (const id of team.lineup) {
        const p = id ? s.players[id] : undefined;
        if (!p || !isAvailable(p, s.time)) continue;
        if (ctx.rng.chance(0.3 * ctx.mods.sickMult)) {
          inflict(s, p, 'sick', 'Dodgy takeaway', ctx.rng.range(60, 180) * ctx.mods.recoveryMult, ctx.mods, team.bench.length > 0);
          sick++;
        }
      }
      logEvent(
        s,
        { title: 'Dodgy takeaway night', body: sick > 0 ? `${sick} player${sick === 1 ? '' : 's'} got food poisoning.` : 'Everyone survived. Barely.', icon: 'utensils', tone: sick > 0 ? 'bad' : 'info' },
        sick === 0,
      );
    },
  },
  {
    id: 'poaching',
    category: 'player',
    weight: (s) => (canOfferChoice(s) && tradable(s).length > 0 && allPlayers(s).length >= 3 ? 2 : 0),
    fire: (s, ctx) => {
      const p = ctx.rng.weighted(tradable(s), (x) => x.level + 5) ?? tradable(s)[0];
      const rival = ctx.rng.pick(RIVAL_ORGS);
      const value = Math.ceil(Math.max(sellValue(p) * 3, p.fee * 1.2, 100));
      const counter = Math.ceil(Math.max(100, p.fee * 0.25));
      offerChoice(s, {
        eventId: 'poaching',
        title: `${rival} wants ${p.tag}`,
        body: `They're offering ${money(value)} to sign ${p.tag} away from you.`,
        icon: 'handshake',
        defaultOption: 2,
        data: { playerId: p.id, value, counter, rival },
        options: [
          { label: `Sell for ${money(value)}`, desc: `${p.tag} leaves for ${rival}.`, tone: 'info' },
          { label: `Counter-offer · ${money(counter)}`, desc: 'Pay to keep them happy: morale +20.', tone: 'good' },
          { label: 'Refuse', desc: 'They stay, but they are not pleased: morale -15.', tone: 'bad' },
        ],
      });
    },
    resolve: (s, choice, option, ctx) => {
      const p = s.players[String(choice.data.playerId)];
      if (!p) return;
      const value = Number(choice.data.value);
      const counter = Number(choice.data.counter);
      if (option === 0) {
        removeFromTeams(s, p.id);
        delete s.players[p.id];
        s.cash += value;
        s.stats.playersSold++;
        logEvent(s, { title: `${p.tag} transferred`, body: `${choice.data.rival} paid ${money(value)}.`, icon: 'handshake', tone: 'info' });
      } else if (option === 1 && s.cash >= counter) {
        s.cash -= counter;
        applyMorale(p, 20, ctx.mods);
        logEvent(s, { title: `${p.tag} stays`, body: 'Your counter-offer worked. Morale +20.', icon: 'heart', tone: 'good' });
      } else {
        applyMorale(p, -15, ctx.mods);
        logEvent(s, { title: `${p.tag} is unhappy`, body: 'You refused the transfer. Morale -15.', icon: 'face-slightly-frowning', tone: 'bad' });
      }
    },
  },
  {
    id: 'contract',
    category: 'player',
    weight: (s) => (canOfferChoice(s) && tradable(s).length > 0 ? 2 : 0),
    fire: (s, ctx) => {
      const p = ctx.rng.pick(tradable(s));
      offerChoice(s, {
        eventId: 'contract',
        title: `${p.tag} wants a bigger cut`,
        body: `Their agent says ${p.tag} deserves a bigger share of the prize money.`,
        icon: 'briefcase',
        defaultOption: 1,
        data: { playerId: p.id },
        options: [
          { label: 'Agree (+4% cut)', desc: 'They take more of their winnings. Morale +20.', tone: 'good' },
          { label: 'Refuse', desc: 'Keep the cut the same. Morale -25.', tone: 'bad' },
        ],
      });
    },
    resolve: (s, choice, option, ctx) => {
      const p = s.players[String(choice.data.playerId)];
      if (!p) return;
      if (option === 0) {
        p.cut = Math.min(0.4, p.cut + 0.04);
        applyMorale(p, 20, ctx.mods);
        logEvent(s, { title: `${p.tag} signs a new deal`, body: `Their cut is now ${Math.round(p.cut * 100)}%.`, icon: 'briefcase', tone: 'info' }, false);
      } else {
        applyMorale(p, -25, ctx.mods);
        logEvent(s, { title: `${p.tag} sulks`, body: 'Contract talks went badly. Morale -25.', icon: 'face-slightly-frowning', tone: 'bad' }, false);
      }
    },
  },
  {
    id: 'gear_sale',
    category: 'market',
    weight: () => 4,
    fire: (s) => {
      addModifier(s, { id: 'gear_sale', kind: 'gearCost', mult: 0.7, duration: 180, name: 'Hardware flash sale', desc: 'Gear 30% cheaper', icon: 'cpu', tone: 'good' });
      logEvent(s, { title: 'Hardware flash sale!', body: `All gear is 30% off for ${fmtTime(180)}.`, icon: 'cpu', tone: 'good' });
    },
  },
  {
    id: 'gpu_shortage',
    category: 'market',
    weight: () => 2,
    fire: (s) => {
      addModifier(s, { id: 'gpu_shortage', kind: 'gearCost', mult: 1.4, duration: 240, name: 'GPU shortage', desc: 'Gear 40% more expensive', icon: 'cpu', tone: 'bad' });
      logEvent(s, { title: 'Global GPU shortage', body: `Gear costs 40% more for ${fmtTime(240)}.`, icon: 'cpu', tone: 'bad' });
    },
  },
  {
    id: 'talent_boom',
    category: 'market',
    weight: (s) => (unlockedGames(s).length > 0 ? 2 : 0),
    fire: (s, ctx) => {
      refreshMarket(s, ctx.rng, { scoutLuck: ctx.mods.scoutLuck + 0.5, marketSize: ctx.mods.marketSize });
      logEvent(s, { title: 'A generation of prodigies', body: 'The transfer market is suddenly full of rare talent.', icon: 'sparkles', tone: 'good' });
    },
  },
  {
    id: 'fan_meetup',
    category: 'org',
    weight: () => 3,
    fire: (s) => {
      const fans = Math.max(100, s.fans * 0.1);
      gainFans(s, fans);
      logEvent(s, { title: 'Fan meetup sells out', body: `+${fmt(fans)} fans.`, icon: 'heart', tone: 'good' });
    },
  },
  {
    id: 'hype_week',
    category: 'org',
    weight: () => 2,
    fire: (s) => {
      addModifier(s, { id: 'hype_week', kind: 'fans', mult: 1.5, duration: 300, name: 'Hype Week', desc: 'Fan gain ×1.5', icon: 'megaphone', tone: 'good' });
      logEvent(s, { title: 'Hype Week', body: `Fan gain ×1.5 for ${fmtTime(300)}.`, icon: 'megaphone', tone: 'good' });
    },
  },
  {
    id: 'bootcamp_week',
    category: 'meta',
    weight: (s) => (allPlayers(s).length > 0 ? 2 : 0),
    fire: (s) => {
      addModifier(s, { id: 'bootcamp_week', kind: 'xp', mult: 2, duration: 300, name: 'Bootcamp Week', desc: 'XP ×2', icon: 'dumbbell', tone: 'good' });
      logEvent(s, { title: 'Bootcamp Week', body: `Players gain double XP for ${fmtTime(300)}.`, icon: 'dumbbell', tone: 'good' });
    },
  },
  {
    id: 'isp_outage',
    category: 'org',
    weight: () => 1.5,
    fire: (s) => {
      addBuff(s, { id: 'isp', name: 'ISP Outage', icon: 'wifi', tone: 'bad', desc: 'Income ×0.8', duration: 60, effects: [{ kind: 'income', mult: 0.8 }] });
      for (const team of Object.values(s.teams)) team.progress = 0;
      logEvent(s, { title: 'The internet is down', body: 'Matches restart and income ×0.8 for a minute.', icon: 'wifi', tone: 'bad' });
    },
  },
  {
    id: 'investor',
    category: 'org',
    weight: (s, ctx) => (canOfferChoice(s) && ctx.rates.cpsNoBuffs >= 100 ? 1.5 : 0),
    fire: (s, ctx) => {
      const amount = Math.ceil(ctx.rates.cpsNoBuffs * 600);
      offerChoice(s, {
        eventId: 'investor',
        title: `An investor wants a piece of ${s.org.name}`,
        body: `They'll put in ${money(amount)} right now, but they'll want a say in how things are run.`,
        icon: 'briefcase',
        defaultOption: 1,
        data: { amount },
        options: [
          { label: `Take ${money(amount)}`, desc: 'Cash now, but income ×0.9 for 10 minutes.', tone: 'info' },
          { label: 'Stay independent', desc: 'Fans respect it: +5% fans.', tone: 'good' },
        ],
      });
    },
    resolve: (s, choice, option) => {
      if (option === 0) {
        const amount = Number(choice.data.amount);
        earnCash(s, amount);
        addBuff(s, { id: 'investor', name: 'Investor Oversight', icon: 'briefcase', tone: 'bad', desc: 'Income ×0.9', duration: 600, effects: [{ kind: 'income', mult: 0.9 }] });
        logEvent(s, { title: 'Investment secured', body: `+${money(amount)}. The board is watching.`, icon: 'briefcase', tone: 'info' }, false);
      } else {
        const fans = s.fans * 0.05 + 20;
        gainFans(s, fans);
        logEvent(s, { title: 'Proudly independent', body: `+${fmt(fans)} fans.`, icon: 'heart', tone: 'good' }, false);
      }
    },
  },
  {
    id: 'charity',
    category: 'org',
    weight: (s, ctx) => (canOfferChoice(s) && ctx.rates.cpsNoBuffs >= 10 ? 2 : 0),
    fire: (s, ctx) => {
      const cost = Math.ceil(Math.max(100, ctx.rates.cpsNoBuffs * 120));
      offerChoice(s, {
        eventId: 'charity',
        title: 'Charity stream opportunity',
        body: `A children's hospital asks if ${s.org.name} will host a 24-hour charity stream.`,
        icon: 'heart',
        defaultOption: 1,
        data: { cost },
        options: [
          { label: `Host it · ${money(cost)}`, desc: 'Fans +20% and every player gets +10 morale.', tone: 'good' },
          { label: 'Maybe next time', desc: 'Nothing happens.', tone: 'info' },
        ],
      });
    },
    resolve: (s, choice, option, ctx) => {
      const cost = Number(choice.data.cost);
      if (option !== 0 || s.cash < cost) return;
      s.cash -= cost;
      const fans = s.fans * 0.2 + 50;
      gainFans(s, fans);
      for (const p of allPlayers(s)) applyMorale(p, 10, ctx.mods);
      logEvent(s, { title: 'Charity stream smashes its goal', body: `+${fmt(fans)} fans and a very proud roster.`, icon: 'heart', tone: 'good' }, false);
    },
  },
];

WORLD_EVENTS.push(
  {
    id: 'trend_shift',
    category: 'market',
    weight: (s) => (isMerchUnlocked(s) ? 2 : 0),
    fire: (s, ctx) => {
      rotateTrend(s, ctx.rng, false);
      const trend = TREND_MAP.get(s.merch.trend);
      logEvent(s, { title: `Fashion shock: ${trend?.name} is in`, body: trend?.desc ?? '', icon: trend?.icon ?? 'shirt', tone: 'info' });
    },
  },
  {
    id: 'sponsor_boom',
    category: 'market',
    weight: (s) => (s.sponsors.active.length > 0 ? 2 : 0),
    fire: (s) => {
      addModifier(s, { id: 'sponsor_boom', kind: 'sponsor', mult: 1.5, duration: 300, name: 'Advertising boom', desc: 'Sponsor income ×1.5', icon: 'handshake', tone: 'good' });
      logEvent(s, { title: 'Advertising boom', body: `Brands are throwing money around. Sponsor income ×1.5 for ${fmtTime(300)}.`, icon: 'handshake', tone: 'good' });
    },
  },
);

export const WORLD_EVENT_MAP: Map<string, WorldEventDef> = new Map(WORLD_EVENTS.map((e) => [e.id, e]));

// ---------------------------------------------------------------------------
// Scheduling
// ---------------------------------------------------------------------------

/** Fires a specific event if it is currently eligible. */
export function fireEvent(s: GameState, id: string, ctx: EventContext): boolean {
  const def = WORLD_EVENT_MAP.get(id);
  if (!def || def.weight(s, ctx) <= 0) return false;
  def.fire(s, ctx);
  return true;
}

export function fireRandomEvent(s: GameState, ctx: EventContext): string | null {
  const def = ctx.rng.weighted(WORLD_EVENTS, (d) => d.weight(s, ctx));
  if (!def) return null;
  def.fire(s, ctx);
  return def.id;
}

export function resolveChoice(s: GameState, choiceId: number, option: number, ctx: EventContext, automatic = false): boolean {
  const index = s.events.pending.findIndex((c) => c.id === choiceId);
  if (index < 0) return false;
  const [choice] = s.events.pending.splice(index, 1);
  const opt = Math.max(0, Math.min(choice.options.length - 1, Math.floor(option)));
  WORLD_EVENT_MAP.get(choice.eventId)?.resolve?.(s, choice, opt, ctx);
  if (!automatic) s.stats.choicesMade++;
  return true;
}

export function updateWorldEvents(s: GameState, ctx: EventContext): void {
  expireModifiers(s);
  for (const choice of [...s.events.pending]) {
    if (choice.expiresAt <= s.time) resolveChoice(s, choice.id, choice.defaultOption, ctx, true);
  }
  if (s.events.nextAt <= 0) {
    s.events.nextAt = s.time + ctx.rng.range(FIRST_EVENT[0], FIRST_EVENT[1]);
    return;
  }
  if (s.time >= s.events.nextAt) {
    fireRandomEvent(s, ctx);
    s.events.nextAt = s.time + ctx.rng.range(EVENT_INTERVAL[0], EVENT_INTERVAL[1]);
  }
}
