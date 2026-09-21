import { GAMES, getGame } from '../data/games';
import { RELEGATE_WINS, SEASON_LENGTH, tierName } from '../data/leagues';
import { SPONSORS_UNLOCK_FANS } from '../data/sponsors';
import { fmt, fmtTime, money } from './format';
import { MERCH_UNLOCK_FANS, isMerchUnlocked } from './merch';
import { teamMood } from './mood';
import { isAvailable, transferValue } from './players';
import { pendingLegacy } from './prestige';
import { previewSigning } from './roster';
import { offerRequirements, sponsorsUnlocked } from './sponsors';
import type { GameState, Mods, Rates } from './types';
import { canAffordUpgrade, storeUpgrades } from './upgrades';

export type AgendaTarget =
  | { kind: 'tab'; tab: 'teams' | 'market' | 'sponsors' | 'studio' | 'legacy'; gameId?: string }
  | { kind: 'store' }
  | { kind: 'player'; id: string }
  | { kind: 'unlockGame'; gameId: string };

export interface AgendaItem {
  icon: string;
  title: string;
  detail: string;
  /** 0-1 progress toward a goal, when there is one. */
  progress?: number;
  action?: { label: string; target: AgendaTarget };
}

/** One growth objective, one team concern and one opportunity. Concern and opportunity can be empty. */
export interface Agenda {
  growth: AgendaItem;
  concern: AgendaItem | null;
  opportunity: AgendaItem | null;
}

/** A goal is worth showing as "save for" when current income covers it within this long. */
const REACHABLE_SECONDS = 30 * 60;
/** A market player is worth flagging when they would add at least this much win chance. */
const SUITABLE_WIN_GAIN = 0.03;

const eta = (missing: number, perSec: number) => (perSec > 0 ? `about ${fmtTime(missing / perSec)} at current income` : 'no income yet');

export function buildAgenda(s: GameState, mods: Mods, rates: Rates): Agenda {
  return { growth: growthObjective(s, rates), concern: teamConcern(s, rates), opportunity: opportunity(s, mods, rates) };
}

// ---------------------------------------------------------------------------
// Growth: the most relevant thing to work toward right now
// ---------------------------------------------------------------------------
function growthObjective(s: GameState, rates: Rates): AgendaItem {
  const income = rates.totalCps;
  const next = GAMES.find((g) => !s.games[g.id]?.unlocked);
  const nextGameReachable = next && (s.cash >= next.unlockCost || (next.unlockCost - s.cash) / Math.max(1e-9, income) <= REACHABLE_SECONDS);

  if (next && nextGameReachable) {
    if (s.cash >= next.unlockCost) {
      return {
        icon: next.icon,
        title: `Found a ${next.name} team`,
        detail: `You can afford it now (${money(next.unlockCost)}). A new team means new prize money and fans.`,
        progress: 1,
        action: { label: 'Found team', target: { kind: 'unlockGame', gameId: next.id } },
      };
    }
    return {
      icon: next.icon,
      title: `Save for ${next.name}`,
      detail: `${money(s.cash)} of ${money(next.unlockCost)} · ${eta(next.unlockCost - s.cash, income)}.`,
      progress: s.cash / next.unlockCost,
    };
  }
  if (!sponsorsUnlocked(s)) {
    return {
      icon: 'handshake',
      title: `Reach ${fmt(SPONSORS_UNLOCK_FANS)} fans`,
      detail: `Brands start calling at ${fmt(SPONSORS_UNLOCK_FANS)} fans. Winning matches and streamers bring them in.`,
      progress: s.fansRun / SPONSORS_UNLOCK_FANS,
    };
  }
  if (!isMerchUnlocked(s)) {
    return {
      icon: 'shirt',
      title: `Reach ${fmt(MERCH_UNLOCK_FANS)} fans for merch`,
      detail: 'Merch turns your fans into a second income stream, with your own designs on it.',
      progress: s.fansRun / MERCH_UNLOCK_FANS,
    };
  }
  if (next) {
    return {
      icon: next.icon,
      title: `Save for ${next.name}`,
      detail: `${money(s.cash)} of ${money(next.unlockCost)} · ${eta(next.unlockCost - s.cash, income)}.`,
      progress: s.cash / next.unlockCost,
    };
  }
  return {
    icon: 'crown',
    title: 'Build a legacy',
    detail: 'Every game has a team. Push them up the ladder and earn toward selling the org.',
    action: { label: 'Legacy', target: { kind: 'tab', tab: 'legacy' } },
  };
}

// ---------------------------------------------------------------------------
// Concern: the most urgent problem across all teams
// ---------------------------------------------------------------------------
function teamConcern(s: GameState, rates: Rates): AgendaItem | null {
  const teams = GAMES.filter((g) => s.teams[g.id] && s.games[g.id]?.unlocked).map((g) => ({ g, team: s.teams[g.id] }));
  const checks: (() => AgendaItem | null)[] = [
    // Empty slots are played by rating-5 stand-ins.
    () => {
      const hit = teams.find(({ team }) => team.lineup.includes(null));
      if (!hit) return null;
      const open = hit.team.lineup.filter((id) => id === null).length;
      return {
        icon: 'user-plus',
        title: `${hit.g.name} has ${open === 1 ? 'an empty slot' : `${open} empty slots`}`,
        detail: 'Stand-ins fill in at a rating of 5, so every match there is close to a lost cause.',
        action: { label: 'Find a player', target: { kind: 'tab', tab: 'market', gameId: hit.g.id } },
      };
    },
    // A starter who cannot play and nobody on the bench to cover.
    () => {
      for (const { g, team } of teams) {
        for (const id of team.lineup) {
          const p = id ? s.players[id] : undefined;
          if (!p || isAvailable(p, s.time)) continue;
          const cover = team.bench.some((b) => s.players[b] && isAvailable(s.players[b], s.time));
          if (cover && team.autoSub) continue;
          return {
            icon: 'thermometer',
            title: `${p.tag} is out`,
            detail: `${p.status.reason || 'Unavailable'}. ${g.name} has nobody fit on the bench to cover.`,
            action: { label: 'View player', target: { kind: 'player', id: p.id } },
          };
        }
      }
      return null;
    },
    // A substitute playing out of position.
    () => {
      for (const { g, team } of teams) {
        if (g.teamSize === 1) continue;
        const slot = team.lineup.findIndex((id, i) => id !== null && s.players[id] !== undefined && s.players[id].role !== i);
        if (slot < 0) continue;
        const p = s.players[team.lineup[slot]!];
        if (!p) continue;
        return {
          icon: 'shuffle',
          title: `${p.tag} is playing ${g.roles[slot]} off-role`,
          detail: `They are a ${g.roles[p.role]}, and off-role players perform at 85%.`,
          action: { label: 'Fix lineup', target: { kind: 'player', id: p.id } },
        };
      }
      return null;
    },
    // Coasting through a league the team has outgrown.
    () => {
      for (const { g, team } of teams) {
        if (teamMood(team) !== 'bored') continue;
        const lost = 1 - (rates.teams[g.id]?.stakes ?? 1);
        return {
          icon: 'face-slightly-frowning',
          title: `${g.name} is bored in the ${tierName(team.tier)}`,
          detail: `With auto-promote off they win almost every match, so players lose morale and learn little${lost >= 0.05 ? `, and a foregone conclusion pays ${Math.round(lost * 100)}% less` : ''}. Challenge up a tier.`,
          action: { label: 'Teams', target: { kind: 'tab', tab: 'teams' } },
        };
      }
      return null;
    },
    // A player who has announced retirement.
    () => {
      const p = Object.values(s.players).find((x) => x.retiring);
      if (!p) return null;
      const value = transferValue(p, rates.teams[p.gameId]?.cps ?? 0, getGame(p.gameId).teamSize);
      return {
        icon: 'calendar-clock',
        title: `${p.tag} retires after this season`,
        detail: `Sell now for about ${money(value)}, or let them finish their career with you.`,
        action: { label: 'View player', target: { kind: 'player', id: p.id } },
      };
    },
    // On course for relegation.
    () => {
      for (const { g, team } of teams) {
        if (team.tier === 0 || team.seasonPlayed < 6) continue;
        const remaining = SEASON_LENGTH - team.seasonPlayed;
        const projected = team.seasonWins + remaining * (rates.teams[g.id]?.winChance ?? 0);
        if (projected > RELEGATE_WINS + 0.5) continue;
        return {
          icon: 'trending-down',
          title: `${g.name} is heading for relegation`,
          detail: `${team.seasonWins}-${team.seasonPlayed - team.seasonWins} this season in the ${tierName(team.tier)}. Push for Promotion or a stronger lineup could save it.`,
          action: { label: 'Teams', target: { kind: 'tab', tab: 'teams' } },
        };
      }
      return null;
    },
    // Simply outmatched at this tier.
    () => {
      for (const { g, team } of teams) {
        const win = rates.teams[g.id]?.winChance ?? 0;
        if (!rates.teams[g.id]?.active || win >= 0.35) continue;
        return {
          icon: 'swords',
          title: `${g.name} is outmatched`,
          detail: `Only ${Math.round(win * 100)}% to win in the ${tierName(team.tier)}. Better gear, staff or players would help, or drop a tier.`,
          action: { label: 'Teams', target: { kind: 'tab', tab: 'teams' } },
        };
      }
      return null;
    },
  ];
  for (const check of checks) {
    const item = check();
    if (item) return item;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Opportunity: something worth acting on right now
// ---------------------------------------------------------------------------
function opportunity(s: GameState, mods: Mods, rates: Rates): AgendaItem | null {
  const pending = pendingLegacy(s);
  if (pending >= Math.max(1, s.prestige.level)) {
    return {
      icon: 'crown',
      title: `Sell the org for +${fmt(pending)} legacy`,
      detail: s.prestige.runs === 0 ? 'Your first sale also brings a free Legacy node, bonus points and a Founding Charter.' : 'That at least doubles your legacy. Later runs start faster.',
      action: { label: 'Legacy', target: { kind: 'tab', tab: 'legacy' } },
    };
  }

  // The affordable market player who would lift a team the most.
  let best: { item: AgendaItem; gain: number } | null = null;
  for (const l of s.market.listings) {
    if (l.price > s.cash) continue;
    const pv = previewSigning(s, l.player, mods);
    const after = pv.placement === 'lineup' ? pv.after : pv.placement === 'bench' && pv.couldStart ? pv.couldStart.after : null;
    if (!after) continue;
    const gain = after.win - pv.before.win;
    if (gain < SUITABLE_WIN_GAIN || (best && gain <= best.gain)) continue;
    const g = getGame(l.player.gameId);
    const role = pv.placement === 'lineup' ? pv.role : pv.couldStart?.role;
    best = {
      gain,
      item: {
        icon: 'user-plus',
        title: `A suitable ${role ?? 'player'} is available`,
        detail: `${l.player.tag} would take ${g.name} from ${Math.round(pv.before.win * 100)}% to ${Math.round(after.win * 100)}% to win, for ${money(l.price)}.`,
        action: { label: 'See market', target: { kind: 'tab', tab: 'market', gameId: g.id } },
      },
    };
  }
  if (best) return best.item;

  if (sponsorsUnlocked(s) && s.sponsors.active.length < mods.sponsorSlots) {
    const offer = s.sponsors.offers.find((o) => offerRequirements(s, o).ok);
    if (offer) {
      return {
        icon: 'handshake',
        title: 'A sponsor slot is free',
        detail: `${s.sponsors.offers.length} offer${s.sponsors.offers.length === 1 ? ' is' : 's are'} waiting. Every sponsor adds income.`,
        action: { label: 'Sponsors', target: { kind: 'tab', tab: 'sponsors' } },
      };
    }
  }

  const affordable = storeUpgrades(s).filter((u) => u.currency === 'cash' && canAffordUpgrade(s, u, mods)).length;
  if (affordable >= 3) {
    return {
      icon: 'sparkles',
      title: `${affordable} upgrades are affordable`,
      detail: 'Upgrades are usually the best value in the store.',
      action: { label: 'Store', target: { kind: 'store' } },
    };
  }

  // Winning comfortably: a good moment to develop players.
  for (const g of GAMES) {
    const team = s.teams[g.id];
    const ev = rates.teams[g.id];
    if (!team || !ev?.active || ev.winChance < 0.85 || team.plan === 'development' || team.nextPlan === 'development') continue;
    return {
      icon: 'graduation-cap',
      title: `${g.name} is winning easily`,
      detail: `${Math.round(ev.winChance * 100)}% to win. A Development season would grow your players while the results hold up.`,
      action: { label: 'Teams', target: { kind: 'tab', tab: 'teams' } },
    };
  }
  return null;
}
