/**
 * The balance targets, as data. The report checks every one against a simulation matrix and prints
 * pass or fail with the numbers behind it. They describe where the game should be, so a failing
 * target is a finding to act on, not a broken build.
 *
 * Change a target here, never in the report.
 */

/** A first playthrough (no Legacy) should earn its first Legacy point, which comes with the first Multiverse Championship, in three to four hours of active play. */
export const FIRST_LEGACY_ACTIVE: [number, number] = [3 * 3600, 4 * 3600];

/** The active player fills the hype meter for a Crowd Goes Wild about every ten minutes. */
export const CROWDS_PER_ACTIVE_HOUR: [number, number] = [4.5, 8];

/** No one source may earn more than this share of a run. */
export const MAX_SOURCE_SHARE = 0.9;
/** Ten-minute windows are held to the same cap once the run is this old (operations are all there is at first). */
export const WINDOW_GRACE_SECONDS = 1800;

/** Working on merch and on the teams should each be a real part of an active player's income. */
export const ACTIVE_SHARE_BANDS: Record<'merch' | 'match', [number, number]> = {
  merch: [0.1, 0.4],
  match: [0.1, 0.5],
};

/** Playing actively should get to the first Legacy point clearly sooner than leaving it idle. */
export const ACTIVE_VS_IDLE_SPEEDUP = 1.5;

/**
 * A second run should feel measurably faster back to where the first one was, and reach higher.
 * The org is sold an hour after its first Legacy point (when run 1 has played `T` and earns `I` a
 * second). Run 2 must earn `I` within RESTART_CATCH_UP × T, and by T it must earn RESTART_CEILING × I.
 * (Replaced "three hours after selling beat three hours of staying by 1.5×", which only enormous
 * Legacy multipliers could pass once a run levels off. Most of the gain is meant to come from what
 * Legacy unlocks, not from raw income: docs/legacy-v2.md.)
 */
export const RESTART_CATCH_UP = 0.75;
export const RESTART_CEILING = 2;

/**
 * A run should level off: from the first Legacy point, three more hours may grow income by at most
 * this factor. While a run keeps compounding, staying always beats selling.
 */
export const MAX_GROWTH_AFTER_FIRST_LEGACY = 100;
export const GROWTH_WINDOW_SECONDS = 3 * 3600;

/** Matches may be a big earner in a long semi-active run, but not most of it. */
export const MAX_SEMI_MATCH_SHARE = 0.6;

/**
 * Offline is a floor, not a strategy: for the same wall-clock time, presence beats absence.
 * A hermit (opens the game every 24 h for five minutes) takes at least this many times as long as
 * the active player to its first Legacy point, and no less time than the casual player.
 */
export const HERMIT_VS_ACTIVE = 2;
/** Days at which lifetime earnings must be ordered by presence (personas.ts OFFLINE_ORDER). */
export const PROGRESS_ORDER_DAYS = [3, 7];
/** An hour away pays at most this share of what the same org earns in an hour with the tab open. */
export const MAX_OFFLINE_OVER_OPEN = 0.5;

/**
 * Cookie-Clicker-like pacing (WS3 check A): once the operations ladder is climbed (the first Legacy
 * point comes with the last operation), an active run's income doubles ever more slowly.
 * [hours after the first Legacy point, fewest minutes to double from there]. Measured from the first
 * point rather than at fixed hours, because hour 3 is mid-climb for a 3-4 h first sale.
 */
export const DOUBLING_MINUTES: [number, number][] = [
  [1, 20],
  [3, 60],
];

/**
 * Purchases stay a real decision (WS3 check D): the seconds of income the next purchase of each kind
 * costs (the one with the best payback) may not fall below this share of its value at
 * `AFFORD_FROM_HOUR` by the end of the active run (flat or rising, with room for noise).
 */
export const AFFORD_FROM_HOUR = 2;
export const MIN_AFFORD_TREND = 0.5;
/** Gear is left out of D: a tier is a small step for one player, cheap by design; check E covers it. */
export const AFFORD_KINDS = ['op', 'upgrade', 'staff', 'merch'] as const;

/**
 * Nothing becomes free (WS3 check E): the best payback on offer of each kind, in the last hour of an
 * active run, is no shorter than this share of what it was at AFFORD_FROM_HOUR.
 */
export const MIN_PAYBACK_TREND = 0.5;
export const PAYBACK_KINDS = ['op', 'upgrade', 'staff', 'gear', 'merch'] as const;
