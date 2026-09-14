import type { GameState } from '../engine/types';

export interface NewsItem {
  text: string;
  when?: (s: GameState) => boolean;
  weight?: number;
}

const has = (op: string, n = 1) => (s: GameState) => (s.ops[op]?.owned ?? 0) >= n;

export const NEWS: NewsItem[] = [
  // Always
  { text: 'Local teen insists ranked is "basically a job". Parents unconvinced.' },
  { text: 'Scientists confirm energy drinks are 90% colour and 10% confidence.' },
  { text: 'Pro player blames loss on "mouse feeling weird today". Mouse declines to comment.' },
  { text: 'Study finds 100% of losses are the jungler’s fault.' },
  { text: 'Chat collectively agrees it definitely would have hit that shot.' },
  { text: 'Gaming chair sales soar after player claims it gave him +200 ELO.' },
  { text: 'Patch notes now longer than most novels, say readers who did not read them.' },
  { text: 'Area man’s keyboard confirmed to be 40% crumbs by weight.' },
  { text: 'Caster screams so loudly during clutch play that seismographs register a 4.2.' },
  { text: 'Report: "one more game" has never once meant one more game.' },
  { text: 'Coach reminds team that "touching grass" is not a hero ability.' },
  { text: 'Esports org unveils rebrand. Logo is now a slightly different shade of black.' },
  { text: 'Bench player spends entire season perfecting his hype clap.' },
  { text: 'Viral clip of a missed shot outperforms the Grand Final in views.' },
  { text: 'New study: RGB lighting adds 12 FPS, say people who sell RGB lighting.' },
  { text: 'Retired pro opens café. Menu consists entirely of instant noodles.' },
  { text: 'Tournament delayed 45 minutes by "technical difficulties" (someone tripped on a cable).' },
  { text: 'Fans debate whether that terrible play was "actually big brain".' },
  { text: 'Streamer’s cat walks across keyboard, accidentally wins match.' },
  { text: 'Top player reveals training secret: "Sleep? Never heard of her."' },
  { text: 'Survey: 83% of gamers believe they would be pro if not for their teammates.' },
  { text: 'Headset maker unveils 11.1 surround sound. Humans still have two ears.' },
  { text: 'Mechanical keyboard so loud that neighbours file a noise complaint.' },
  { text: 'Analyst explains team lost "because they had fewer points than the other team".' },
  { text: 'Player "in the zone" for 14 hours. The zone is now charging rent.' },
  { text: 'Hot take: the meta is broken. Colder take: it has always been broken.' },
  { text: 'Rookie asks whether the more expensive chair has "more APM".' },
  { text: 'Veteran reminds everyone that in his day ping was 300 and they liked it.' },
  { text: 'New rule bans eating crisps during matches: "the crunch is a distraction".' },
  { text: 'LAN party ends after 72 hours when the last energy drink is consumed.' },
  { text: 'Pro player’s mum reveals he still can’t make toast. Can hit 1-deag headshots.' },
  { text: 'Esports betting scandal: man bets his lunch on a match, loses lunch.' },
  { text: 'Team announces "mental reset" after loss. Reset involves pizza.' },
  { text: 'Wireless mouse dies mid-final. Nation mourns.' },
  { text: 'Streamer apologises for apology stream about previous apology stream.' },
  { text: 'Scientists discover the "one-tap" gene. It is mostly caffeine.' },
  { text: 'Tier list released. Everyone furious. Tier list working as intended.' },
  { text: 'Gamer yells "that didn’t register!" for the 40,000th time. Researchers intrigued.' },

  // Early game
  { text: '{org} spotted grinding ranked in a garage. Neighbours report "a lot of yelling".', when: (s) => s.earnedRun < 1e5, weight: 3 },
  { text: 'Mum asks {org} founder when they’re getting a real job.', when: (s) => s.earnedRun < 1e5, weight: 3 },
  { text: '{org} logo drawn on a sticky note. "It’s a brand," insists founder.', when: (s) => s.earnedRun < 1e4, weight: 3 },
  { text: '{org} founder claims to be "basically semi-pro". Rank remains unverified.', when: (s) => s.earnedRun < 1e6, weight: 2 },

  // Operations
  { text: '{org} streamer hits 3 concurrent viewers. Two are bots, one is their mum.', when: has('streamer'), weight: 2 },
  { text: 'Chat spams {org} emotes in completely unrelated streams.', when: has('streamer', 50) },
  { text: '{org} creator uploads "10 Pro Tips". Tip 7 is "be better".', when: has('creator'), weight: 2 },
  { text: 'Shocked face from a {org} thumbnail is now a recognised meme format.', when: has('creator', 25) },
  { text: '{org} gaming café passes health inspection. Inspector "impressed by volume of noodles".', when: has('cafe'), weight: 2 },
  { text: '{org} cafés trigger nationwide instant noodle shortage.', when: has('cafe', 25) },
  { text: '{org} bootcamp reports record sleep deprivation and record win rate.', when: has('bootcamp'), weight: 2 },
  { text: 'LAN center patron survives 48 hours on pizza crusts and pure adrenaline.', when: has('lan'), weight: 2 },
  { text: 'Foam finger shortage at {org} arenas declared "a national crisis".', when: has('arena'), weight: 2 },
  { text: '{org} replay slowed down so much it qualified as a documentary.', when: has('broadcast'), weight: 2 },
  { text: '{org} launches streaming platform. First feature: a bigger donate button.', when: has('platform'), weight: 2 },
  { text: '{org} game studio releases balance patch. Everyone says it favours {org}.', when: has('studio'), weight: 2 },
  { text: '{org} Global League signs broadcast deal with every TV on Earth.', when: has('league'), weight: 2 },
  { text: 'First orbital final delayed after player’s crisps float into the server rack.', when: has('orbital'), weight: 2 },
  { text: 'Neural link beta testers report "thinking in patch notes".', when: has('neural'), weight: 2 },
  { text: 'Clone Academy graduate beats original in 1v1. Original demands rematch.', when: has('clone'), weight: 2 },
  { text: 'Simulation Server concludes the optimal strategy is "win more".', when: has('simulation'), weight: 2 },
  { text: 'Alternate-universe {org} wins Multiverse Championship. Our {org} demands a recount.', when: has('multiverse'), weight: 2 },

  // Progress
  { text: 'Financial analysts baffled as esports org outperforms stock market.', when: (s) => s.earnedRun >= 1e7 },
  { text: '{org} valuation passes a billion. "Mostly vibes," says accountant.', when: (s) => s.earnedRun >= 1e9 },
  { text: '{org} now legally classified as a small country.', when: (s) => s.earnedRun >= 1e15 },
  { text: 'Economists propose replacing the gold standard with the {org} standard.', when: (s) => s.earnedRun >= 1e20 },
  { text: '{org} fan club holds first meetup. Six people and a cardboard cutout attend.', when: (s) => s.fans >= 1000, weight: 2 },
  { text: 'Babies increasingly named after {org} players.', when: (s) => s.fans >= 1e6 },
  { text: 'Crowd noise at {org} events now measured on the Richter scale.', when: (s) => s.stats.crowdsTotal >= 1 },
  { text: 'Doctors warn of "clicking finger" epidemic among {org} fans.', when: (s) => s.stats.clicksTotal >= 5000 },
];
