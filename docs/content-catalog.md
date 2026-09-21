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
| Invitationals: rounds, field strength, preparation stakes, names by tier | `src/engine/tournament.ts` | `src/engine/drops.ts` sends the invite, `src/ui/components/TournamentModal.svelte` shows it |

## Competition glossary

Use these words, and only these, in player-facing text. Internal ids (`tournament`, `seasonTitles`, `derbyWins`) keep their old names so saves stay compatible.

| Term | Meaning |
| --- | --- |
| **Match** | One game in a team's league. Plays on its own every few seconds. |
| **Season** | 16 matches at one league tier. |
| **League tier** | The ladder a team climbs: Ranked Queue, Open Qualifiers, … World Championship and beyond. |
| **Promotion / relegation** | 12+ wins moves a team up a tier; 3 or fewer drops it. |
| **League title** | A season with 15+ wins. Pays a bonus and a trophy. The team is "league champions". Never "season title". |
| **Season MVP** | The top performer on a team over one season. |
| **Grudge match** | Any league match against your rival org. Wins bring double fans. Replaces "derby". |
| **Invitational** | A three-round bracket (quarter-final, semi-final, grand final) your flagship team is invited to by a Hype Drop. Winners are "Invitational champions"; losing finalists are "runners-up". Never "tournament". |
| **Invitational name** | Grows with the tier: Community, Open, Pro, Masters, Elite, Legends, Galactic, Multiverse Invitational. |
| **Trophies** | The currency won from league titles, Invitationals, sponsor goals and quests. |
| **Trophy Cabinet** | The shelf of every trophy the org has won. It survives selling the org. |
