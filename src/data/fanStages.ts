/**
 * How famous the org is, by fan count: from the people in the lobby to a team everyone already knows.
 * The names follow a gamer's rise through a streamer's and a creator's to a celebrity's. Each stage
 * starts at `from` fans; how much one more fan is worth at that point is `fanValue` in the economy.
 * Stages are content: change the names here, not in the interface.
 */
export interface FanStageDef {
  id: string;
  name: string;
  /** Fans at which the org enters this stage. */
  from: number;
  blurb: string;
}

export const FAN_STAGES: FanStageDef[] = [
  { id: 'lobby', name: 'Lobby Regulars', from: 0, blurb: 'Friends, Discord mods and the people who keep getting queued against you.' },
  { id: 'local', name: 'Local Scene', from: 1e3, blurb: 'Known at every LAN within an hour of the garage.' },
  { id: 'rising', name: 'Rising Streamer', from: 1e4, blurb: 'Clips get shared, chat knows your catchphrases.' },
  { id: 'community', name: 'Community Favourite', from: 1e5, blurb: 'Fan art, fan wikis and a subreddit that argues about your roster.' },
  { id: 'internet', name: 'Internet Famous', from: 1e6, blurb: 'Your logo is a meme. People who don’t play the game know the name.' },
  { id: 'mainstream', name: 'Mainstream Star', from: 1e7, blurb: 'Talk shows ask about you. Sponsors send gift baskets before they send contracts.' },
  { id: 'household', name: 'Household Name', from: 1e8, blurb: 'Grandparents have heard of you. Every new fan is a little harder to find.' },
  { id: 'global', name: 'Global Phenomenon', from: 4e8, blurb: 'A fan in every country. The people left to convert already half-know you.' },
  { id: 'icon', name: 'Cultural Icon', from: 1.6e9, blurb: 'Your jersey shows up in films. Fame is now about being talked about, not found.' },
  { id: 'legend', name: 'Living Legend', from: 1e10, blurb: 'Kids who will never watch a match know who you are.' },
  { id: 'history', name: 'Part of History', from: 1.1e11, blurb: 'Museums have a display. A new fan is a new baby.' },
  { id: 'everyone', name: 'The Team Everyone Knows', from: 1e12, blurb: 'There is almost nobody left who hasn’t heard of you. Each fan still counts, just a little.' },
];
