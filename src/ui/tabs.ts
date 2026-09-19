import type { TabId } from './game.svelte';

/** The centre tabs, in order. Which ones show is decided by engine/sections. */
export const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'hq', label: 'HQ', icon: 'building' },
  { id: 'teams', label: 'Teams', icon: 'swords' },
  { id: 'market', label: 'Market', icon: 'user-plus' },
  { id: 'roster', label: 'Roster', icon: 'users' },
  { id: 'house', label: 'House', icon: 'house' },
  { id: 'staff', label: 'Staff', icon: 'briefcase' },
  { id: 'studio', label: 'Studio', icon: 'palette' },
  { id: 'sponsors', label: 'Sponsors', icon: 'handshake' },
  { id: 'legacy', label: 'Legacy', icon: 'crown' },
  { id: 'achievements', label: 'Trophies', icon: 'trophy' },
  { id: 'stats', label: 'Stats', icon: 'chart-column' },
  { id: 'options', label: 'Options', icon: 'settings' },
];

export const TAB_MAP: Map<string, (typeof TABS)[number]> = new Map(TABS.map((t) => [t.id, t]));
