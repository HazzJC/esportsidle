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
