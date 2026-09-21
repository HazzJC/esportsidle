import { GAMES, GENRE_LABEL, GENRE_WEIGHTS } from '../data/games';
import { PROMOTE_WINS, RELEGATE_WINS, SEASON_LENGTH, TITLE_WINS } from '../data/leagues';
import { SEASON_PLANS, SEASON_PLAN_ORDER } from '../data/seasonPlans';
import { ALL_STATS, STAT_LABEL } from '../engine/players';
import { BORED_FORM, ENGAGED_MAX, ENGAGED_MIN } from '../engine/mood';
import { CHALLENGE_WIN_CHANCE } from '../engine/teams';
import type { GameState, StatKey } from '../engine/types';
import { STAT_INFO } from './statInfo';

/** One point on a guide page: an optional bold term, then the explanation. */
export interface GuidePoint {
  term?: string;
  icon?: string;
  text: string;
}

export interface GuidePage {
  title: string;
  icon: string;
  intro?: string;
  points: GuidePoint[];
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
const times = (x: number) => `×${parseFloat(x.toFixed(2))}`;

/** How a team works: seasons, plans, moving between tiers and the two automation switches. */
export function teamsGuide(): GuidePage[] {
  const plans = SEASON_PLAN_ORDER.map((id) => SEASON_PLANS[id]);
  return [
    {
      title: 'Seasons and tiers',
      icon: 'trophy',
      intro: `Every team plays its matches on its own, ${SEASON_LENGTH} to a season, in a league tier. Higher tiers pay far more prize money and bring more fans, but the opponents are tougher.`,
      points: [
        { term: 'Promotion', icon: 'trending-up', text: `Win ${PROMOTE_WINS} or more matches in a season to move up a tier.` },
        { term: 'League title', icon: 'trophy', text: `${TITLE_WINS} or more wins is a league title: a trophy and a cash bonus. The team's top performer is named Season MVP.` },
        { term: 'Relegation', icon: 'trending-down', text: `${RELEGATE_WINS} or fewer wins drops the team a tier.` },
      ],
    },
    {
      title: 'Season plan',
      icon: 'activity',
      intro: 'The plan sets how hard the team competes, how much the players learn and how fast they tire. Hover a plan for its exact numbers.',
      points: [
        ...plans.map((d) => ({
          term: d.name,
          icon: d.icon,
          text: `${d.summary} Rating ${times(d.rating)}, XP ${times(d.xp)}.`,
        })),
        { term: 'Timing', icon: 'calendar-clock', text: 'A new plan starts straight away before the first match of a season, otherwise from the next season.' },
      ],
    },
    {
      title: 'Moving between tiers',
      icon: 'arrow-up',
      intro: 'You do not have to wait for the end of a season to change leagues.',
      points: [
        {
          term: 'Challenge',
          icon: 'arrow-up',
          text: `Jump up a tier right now. It unlocks once the team is winning ${pct(CHALLENGE_WIN_CHANCE)} of its matches, or any time to return to a tier it has already reached.`,
        },
        { term: 'Drop tier', icon: 'arrow-down', text: 'Step down a tier right now: easier opponents, smaller prizes.' },
        { term: 'Either way', icon: 'refresh-cw', text: 'The season starts again from zero in the new tier.' },
        {
          term: 'Why climb?',
          icon: 'flame',
          text: `Players are fired up when they win ${pct(ENGAGED_MIN)}–${pct(ENGAGED_MAX)} of their matches and get bored from ${pct(BORED_FORM)}. Crowds lose interest in foregone conclusions too, so prizes and fans shrink. The best money is usually the highest tier you can win about half your matches in.`,
        },
      ],
    },
    {
      title: 'Automation',
      icon: 'bot',
      intro: 'Two switches at the bottom of every team card.',
      points: [
        {
          term: 'Auto-promote',
          icon: 'trending-up',
          text: `On: a season with ${PROMOTE_WINS}+ wins moves the team up. Off: it stays in its tier until you challenge. Titles and relegation still happen.`,
        },
        {
          term: 'Auto-sub',
          icon: 'refresh-cw',
          text: `On: tired, sick or injured starters swap out for the best rested bench player. The plan sets how tired: ${plans.map((d) => `${d.name} at ${d.subAt} energy`).join(', ')}. It needs someone on the bench.`,
        },
      ],
    },
  ];
}

/** The top stats for a game, e.g. "Mechanics 45%, Composure 30%". */
function statMix(genre: keyof typeof GENRE_WEIGHTS): string {
  return Object.entries(GENRE_WEIGHTS[genre])
    .filter(([, w]) => w > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([st, w]) => `${STAT_LABEL[st as StatKey]} ${pct(w)}`)
    .join(', ');
}

/** How to read the market and a player. The last page covers the games the org plays. */
export function marketGuide(s: GameState): GuidePage[] {
  const games = GAMES.filter((g) => s.games[g.id]?.unlocked);
  return [
    {
      title: 'The transfer market',
      icon: 'store',
      intro: 'Sign players to fill empty slots, build a bench or replace a weak starter.',
      points: [
        { term: 'Listings', icon: 'refresh-cw', text: 'A fresh batch of players arrives every few minutes. Scout now pays to refresh early.' },
        { term: 'Signing fee', icon: 'dollar-sign', text: 'Paid once, up front. There are no wages.' },
        { term: 'Cut', icon: 'handshake', text: 'The share of their prize money a player keeps. It comes out of their winnings, never your bank.' },
        { term: 'Roster impact', icon: 'chart-column', text: "The strip under each card shows where they would play and how your team's win chance would change." },
      ],
    },
    {
      title: 'Reading a player',
      icon: 'user',
      points: [
        { term: 'Rarity', icon: 'gem', text: 'Rookie, Talent, Pro, Star, Superstar, Legend. Rarer players start stronger and can grow further.' },
        { term: 'Rating', icon: 'star', text: 'How good they are right now in their game: their stats, weighted for that game.' },
        { term: 'Potential', icon: 'trending-up', text: 'The ceiling for every stat. Players earn XP from matches and training, and each level raises a stat towards it.' },
        { term: 'Traits', icon: 'sparkles', text: 'Quirks that help or hurt. Hover a trait to see what it does.' },
      ],
    },
    {
      title: 'The six stats',
      icon: 'chart-column',
      intro: 'Hover any stat bar for a reminder.',
      points: ALL_STATS.map((st) => ({ term: STAT_LABEL[st], icon: STAT_INFO[st].icon, text: STAT_INFO[st].desc })),
    },
    {
      title: 'What each game wants',
      icon: 'gamepad-2',
      intro: 'Each game weights the four skill stats differently. A great card player can be a terrible shooter.',
      points: games.map((g) => ({ term: g.name, icon: g.icon, text: `${GENRE_LABEL[g.genre]}: ${statMix(g.genre)}.` })),
    },
  ];
}
