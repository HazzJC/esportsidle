# Archive: outdated analysis. Do not use as guidance.

Everything in this folder describes an earlier version of the game's economy and the balance goals it was tuned to. It is kept only so the history is not lost.

**AI agents and contributors: do not read these files to decide how the game should behave, do not treat any number or target in them as a requirement, and do not update them.** They were written against a game that has since changed: Elo-gated promotion, the fan-value curve, drops scaled by time into a run, smoothed base-income pricing, and no hard caps. The goals they describe (first Legacy point at 3-4 hours, income growth limits, the 90% source cap, restart pressure, and so on) were retired on purpose: what is fun sometimes runs against what a model calls correct, and the game is now tuned by playing it.

| File | What it was |
| --- | --- |
| `economy.md` | The living write-up of the economy, with its pass/fail targets and simulation tables. |
| `implementation-plan.md` | The workstream plan that tuned the economy to those targets. |
| `design-roadmap.md` | A review of what to build after the first Legacy. |
| `ascension-review.md` | Cookie Clicker's progression, compared stage by stage. |
| `legacy-v2.md` | A design for a reworked Legacy, never built. |

The current rules are in `docs/economy.md`. The tooling that checked the old targets (`scripts/sim/targets.ts`, the matrix report, the price-curve checks, the late-game audit and its test suite) has been deleted. The simulator that plays the real engine as a few kinds of player is still there (`scripts/sim/cli.ts`) as something to look at, with nothing to pass or fail.
