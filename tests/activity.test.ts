import { describe, expect, it } from 'vitest';
import { ACTIVITY_RECENT_SECONDS, activityEntries } from '../src/engine/activity';
import type { EventLogEntry } from '../src/engine/types';

const entry = (time: number, endsAt?: number): EventLogEntry => ({ time, endsAt, title: 'Event', body: '', icon: 'cpu', tone: 'good' });

describe('org activity', () => {
  it('keeps timed events active until their actual expiry and preserves history', () => {
    const log = [entry(0, 240), entry(0)];
    expect(activityEntries(log, 200, 'active')).toEqual([log[0]]);
    expect(activityEntries(log, 241, 'active')).toEqual([]);
    expect(activityEntries(log, 241, 'all')).toEqual(log);
  });

  it('shows one-off events briefly', () => {
    const log = [entry(100)];
    expect(activityEntries(log, 100 + ACTIVITY_RECENT_SECONDS - 1, 'active')).toEqual(log);
    expect(activityEntries(log, 100 + ACTIVITY_RECENT_SECONDS, 'active')).toEqual([]);
  });
});
