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

  // Teams & players
  { text: '{org} founder wins a local Smash Siblings bracket. Prize: a crisp $3 and a participation sticker.', when: (s) => s.stats.matchesWon >= 1 && s.earnedRun < 1e5, weight: 2 },
  { text: 'Rival org claims {org} "just got lucky". {org} gets lucky again.', when: (s) => s.stats.matchesWon >= 50 },
  { text: '{org} rookie asks coach what "macro" means. Coach sighs for eleven minutes.', when: (s) => s.stats.playersSigned >= 1 },
  { text: 'Transfer rumour: {org} spotted scouting a 14-year-old with suspiciously good aim.', when: (s) => s.stats.playersSigned >= 3 },
  { text: 'Season champions {org} celebrate by immediately queueing more ranked.', when: (s) => s.stats.seasonTitles >= 1, weight: 2 },
  { text: '{org} player admits his lucky socks have not been washed since the promotion run.', when: (s) => s.stats.promotions >= 3 },
  { text: 'Commentators struggle to pronounce {org} player tags; one is just "xXx".', when: (s) => s.stats.playersSigned >= 5 },
  { text: '{org} team chemistry described as "found family, but with more shouting".', when: (s) => Object.keys(s.players).length >= 6 },
  { text: 'Pro player upgrades to Anti-Gravity Boots. Denies they affect aim. Refuses to take them off.', when: (s) => Object.values(s.players).some((p) => p.gear.shoes >= 11) },
  { text: 'Hardware reviewers baffled by {org} PC that appears to be running on a small star.', when: (s) => Object.values(s.players).some((p) => p.gear.pc >= 14) },
  { text: 'Opposing team requests to inspect {org} chairs for "performance-enhancing lumbar support".', when: (s) => Object.values(s.players).some((p) => p.gear.chair >= 6) },
  { text: '{org} reaches the Continental Major. Mums everywhere finally admit it might be a real job.', when: (s) => Object.values(s.teams).some((t) => t.bestTier >= 8), weight: 2 },
  { text: 'Galactic Series officials confirm {org} is the first team to play in low orbit without spilling a drink.', when: (s) => Object.values(s.teams).some((t) => t.bestTier >= 12) },

  // Staff & house
  { text: '{org} coach bans the phrase "it’s just a game" from the gaming house.', when: (s) => (s.staff.coach ?? 0) >= 1 },
  { text: '{org} chef introduces vegetables. Players stage a 20-minute protest, then eat them.', when: (s) => (s.staff.chef ?? 0) >= 1, weight: 2 },
  { text: '{org} physio confiscates a player’s claw grip. "For your own good."', when: (s) => (s.staff.physio ?? 0) >= 1 },
  { text: '{org} sports psychologist schedules a group session titled "Why We Don’t Type in All Chat".', when: (s) => (s.staff.psych ?? 0) >= 1 },
  { text: '{org} AI Trainer defeats every player 400-0, then offers "constructive feedback".', when: (s) => (s.staff.ai ?? 0) >= 1 },
  { text: 'The {org} house cat has now been on stream more than the bench player.', when: (s) => !!s.decor.cat, weight: 2 },
  { text: '{org} neon sign visible from space, astronauts report.', when: (s) => !!s.decor.neon },
  { text: '{org} gaming house flu outbreak traced back to one shared mouse.', when: (s) => s.stats.illnesses >= 3 },

  // Events
  { text: 'Hype Drop spotted over {org} HQ. Fans report "the air smells like frame rate".', when: (s) => s.stats.dropsClicked >= 1 },
  { text: 'Tournament organisers add extra security after {org} wins another invitational.', when: (s) => s.stats.tournamentsWon >= 3 },
  { text: '{org} Hype Train reaches carriage 9. Rail authorities concerned.', when: (s) => s.stats.hypeTrainBest >= 9 },
  { text: '{org} publishes a 400-word apology written entirely in emojis.', when: (s) => s.stats.dramaClicked >= 1, weight: 2 },
  { text: 'Balance patch notes include the line "we are aware of {org}".', when: (s) => s.stats.eventsSeen >= 20 },

  // Merch & sponsors
  { text: '{org} T-shirt spotted on a celebrity. Celebrity claims they "just grabbed whatever was on the floor".', when: (s) => Object.keys(s.merch.unlocked).length > 0, weight: 2 },
  { text: 'Fashion critics call the {org} hoodie "brave, pixelated and oddly moving".', when: (s) => !!s.merch.unlocked.hoodie },
  { text: '{org} plushie sells out in 4 seconds. Bots blamed. Bots also want plushies.', when: (s) => !!s.merch.unlocked.plushie },
  { text: '{org} logo design leaks early. Fans spend six hours analysing each pixel.', when: (s) => s.org.logo !== null },
  { text: '{org} player reads sponsor script live: "This match brought to you by... sorry, what does VPN stand for?"', when: (s) => s.stats.sponsorsSigned >= 1, weight: 2 },
  { text: 'Energy drink sponsor asks {org} to stop saying "it tastes like battery acid" on stream.', when: (s) => s.stats.sponsorsSigned >= 2 },
  { text: '{org} crypto sponsor rebrands for the fourth time this week.', when: (s) => s.stats.sponsorsSigned >= 3 },
  { text: 'Sponsor logos now cover 94% of the {org} jersey. Players request a small window.', when: (s) => s.sponsors.active.length >= 3 },

  // Legacy
  { text: 'Business schools launch a course on "The {org} Exit".', when: (s) => s.stats.orgsSold >= 1, weight: 2 },
  { text: 'Veterans of the old org visit the new garage. "We had it rough," they say, gesturing at a mini fridge.', when: (s) => s.stats.orgsSold >= 1 },
  { text: 'Hall of Fame inducts another {org} legend. The speech runs three hours and includes a PowerPoint.', when: (s) => s.prestige.legends.length >= 1 },
  { text: 'Historians confirm {org} has more legacy than most medieval kingdoms.', when: (s) => s.prestige.level >= 100 },
];
