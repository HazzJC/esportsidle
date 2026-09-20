import type { EventLogEntry } from './types';

/** One-off activity remains visible briefly; timed effects use their real expiry. */
export const ACTIVITY_RECENT_SECONDS = 120;

export function activityEntries(log: EventLogEntry[], now: number, mode: 'active' | 'all'): EventLogEntry[] {
  if (mode === 'all') return log;
  return log.filter((entry) => (entry.endsAt ?? entry.time + ACTIVITY_RECENT_SECONDS) > now);
}
