# Content and balance catalog

Edit each list at its source so game text and values remain easy to audit.

| Content | Canonical file | Related behavior |
| --- | --- | --- |
| Ticker headlines and appearance conditions | `src/data/news.ts` | `src/engine/news.ts` selects and fills placeholders |
| Player first names, surnames, handles, nationalities, rival names | `src/data/names.ts` | `src/engine/players.ts` generates players |
| World events, choice text, weights, durations | `src/engine/worldEvents.ts` | `src/engine/activity.ts` filters the activity log |
| Operations, upgrades, and gear | `src/data/operations.ts`, `src/data/upgrades.ts`, `src/data/gear.ts` | `src/engine/operations.ts`, `src/engine/upgrades.ts` |
| Sponsors and goal values | `src/data/sponsors.ts` | `src/engine/sponsors.ts` |
| Merch products, designs, and trends | `src/data/merch.ts` | `src/engine/merch.ts` |
| Legacy unlocks and automation | `src/data/legacy.ts`, `src/data/automation.ts` | `src/engine/automation.ts` |
| Hype meter, drops, and buffs | `src/engine/clicker.ts`, `src/engine/drops.ts`, `src/engine/buffs.ts` | `src/ui/layout/ClickerPanel.svelte` presents them |

Use the `when` condition on a ticker line to match the org's current scale. Timed world events should set the activity log's `endsAt` to the actual effect expiry, so the Active view clears when the effect does.
