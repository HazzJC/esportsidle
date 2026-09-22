import type { NotifyChannel } from '../engine/types';

export interface NotifyChannelDef {
  id: NotifyChannel;
  label: string;
  icon: string;
  desc: string;
}

/** The kinds of popup a player can mute. Their own actions (purchases, signings, saves) always show. */
export const NOTIFY_CHANNELS: NotifyChannelDef[] = [
  { id: 'matches', label: 'Match results', icon: 'swords', desc: 'League titles, promotions, relegations and grudge matches' },
  { id: 'players', label: 'Player news', icon: 'user', desc: 'Illness, recoveries, milestones and retirements' },
  { id: 'events', label: 'World events', icon: 'newspaper', desc: 'Patches, meta shifts, market news and crowd hype' },
  { id: 'business', label: 'Business', icon: 'handshake', desc: 'Sponsor contracts and goals, merch trends' },
  { id: 'achievements', label: 'Achievements', icon: 'trophy', desc: 'Achievement unlocks' },
];

export const NOTIFY_LABEL: Record<NotifyChannel, string> = Object.fromEntries(NOTIFY_CHANNELS.map((c) => [c.id, c.label])) as Record<
  NotifyChannel,
  string
>;
