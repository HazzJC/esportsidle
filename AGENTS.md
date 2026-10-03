# Game content and balance locations

Keep each kind of game content in its existing canonical file. Update the entries there when adding, editing, or deleting content; avoid copying lists into UI components or creating a second registry. See `docs/content-catalog.md` for the full map.

- Ticker headlines and their eligibility rules: `src/data/news.ts`. Selection and placeholder rendering: `src/engine/news.ts`.
- Generated player names, tags, nationalities, and rival org names: `src/data/names.ts`.
- World event definitions, weights, durations, and activity messages: `src/engine/worldEvents.ts`.
- Operation, upgrade, gear, sponsor, merch, and legacy definitions: their matching files in `src/data/`.
- Hype meter, drops, merch sales, and sponsor progress calculations: their matching files in `src/engine/`.

When changing a timed event, update the activity log `endsAt` alongside the effect duration. Check that scale-specific ticker lines have both lower and upper eligibility bounds where appropriate.

# Patch notes maintenance

Whenever you complete work or prepare changes for a PR/review, you MUST update `PATCH_NOTES.md`:
1. Add an entry under `## Pending Changes` marked as `[Status: Pending]`. Detail both **The Issue / Motivation** (what was broken, missing, or requested) and **What Changed** (the exact code, balance, UI, or mechanical updates).
2. When modifying, tuning, or replacing existing mechanics, locate the earlier patch note entries describing that system, apply a markdown strikethrough `~~...~~` to the superseded behavior, and add/increment a bracketed note indicating how many times it has evolved: `*(Changed N times since: ...)*`.
3. When starting or finishing work on top of previously committed work, inspect `PATCH_NOTES.md` for any remaining `[Status: Pending]` entries that are now committed in git, and update their header to `[Status: Committed]` (including their commit hash and date).

# Balance and the economy

The game is tuned by playing it, not against numeric targets. Fun sometimes runs against what is "correct", and the old targets were retired on purpose.

- **Ignore `docs/archive/` and `output/sim/`.** They hold analysis and simulation output from earlier versions of the game (pace targets, restart pressure, income-share caps, price-curve checks, the late-game audit). Do not read them to decide how anything should behave, do not treat their numbers as requirements, and do not update them. See `docs/archive/README.md`.
- `docs/economy.md` describes the rules as they work now (no targets, no measured tables). Keep it current when a rule changes, and add a `PATCH_NOTES.md` entry.
- Do not add pass/fail balance targets, income-growth budgets or "levels off by hour N" tests. Unit tests check that mechanics work and stay consistent (a price follows its formula, a curve never reaches zero), not that the economy hits a pace.
- Principles to keep: nothing stops adding (slow on a curve that never reaches zero, and show the player); rewards are never worthless and never break a run; income-linked prices use base income (`engine/baseIncome.ts`), never anything a hype streak can move; anything that levels off is explained in the interface.
- `npm test` is the unit suite (seconds). `scripts/sim/cli.ts` (`npm run sim -- --persona=active --hours=4`) plays the real engine as a simulated player (`scripts/sim/personas.ts`) and writes a record, for looking at what a playstyle does. It has nothing to pass or fail.
