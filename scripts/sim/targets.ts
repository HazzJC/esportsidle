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
 * Selling and replaying should clearly beat staying put. From an hour after the first Legacy point,
 * three more hours after selling must end with at least this much more Legacy (level + pending) than
 * three more hours in the same run.
 */
export const SELL_OVER_STAY = 1.5;

/**
 * A run should level off: from the first Legacy point, three more hours may grow income by at most
 * this factor. While a run keeps compounding, staying always beats selling.
 */
export const MAX_GROWTH_AFTER_FIRST_LEGACY = 100;
export const GROWTH_WINDOW_SECONDS = 3 * 3600;

/** Matches may be a big earner in a long semi-active run, but not most of it. */
export const MAX_SEMI_MATCH_SHARE = 0.6;
