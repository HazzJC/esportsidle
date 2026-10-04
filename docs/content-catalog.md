# Content and balance catalog

Edit each list at its source so game text and values remain easy to audit.

| Content | Canonical file | Related behavior |
| --- | --- | --- |
| Ticker headlines and appearance conditions | `src/data/news.ts` | `src/engine/news.ts` selects and fills placeholders |
| Player first names, surnames, handles, nationalities, rival names | `src/data/names.ts` | `src/engine/players.ts` generates players |
| World events, choice text, weights, durations | `src/engine/worldEvents.ts` | `src/engine/activity.ts` filters the activity log |
| Operations, upgrades, and gear | `src/data/operations.ts`, `src/data/upgrades.ts`, `src/data/gear.ts` | `src/engine/operations.ts`, `src/engine/upgrades.ts` |
| Sponsors and goal values, brand perks, the three starter snack deals | `src/data/sponsors.ts` (`STARTER_DEALS`, `BrandDef.perk`) | `src/engine/sponsors.ts` |
| Staff roles and the tool each first hire brings (bulk buying, selling, Buy all, the Coach's game plan) | `src/data/staff.ts` (`qol`) | `src/engine/staff.ts` (`hasQol`, `bulkAmounts`) |
| Houses (rooms) and decor | `src/data/decor.ts` | decor drawings in `src/ui/decorArt.ts`, house scene placements in `src/ui/tabs/House.svelte`, move-in card `MoveIn.svelte` |
| What each game shows on a player's monitors (Teams rooms and the House) | `src/ui/gameArt.ts` (`gameScreenSvg`, beside the game logos) | `src/ui/components/Station.svelte` |
| Team rooms on the Teams tab: walls and floors per house, each game's sign and four parody props | `src/ui/roomArt.ts` | `src/ui/tabs/Teams.svelte`; the walls also paint the HQ banner (with a strip of floor, `HQOverview.svelte`) and the move-in card |
| Tutorial steps and the first-win bonus | `src/data/tutorial.ts` | `src/engine/tutorial.ts`; highlights in `Coach.svelte` and `.tut-target` (`src/styles/global.css`) |
| Merch products, designs, and trends | `src/data/merch.ts` | `src/engine/merch.ts` |
| Quests, the mechanics they teach, the tab each one opens in the first run, what the line waits for, "Show me" hints, quest tools and tokens, operation-affinity values | `src/data/quests.ts` (tabs: `SectionDef.quest` in `src/engine/sections.ts`; hint pulses: `src/ui/hints.ts`) | `src/engine/quests.ts` pays rewards; `hasTool` / `useToken` for the systems that read tools; tour design in `docs/quest-tour.md`; each quest's `art` names its emblem, drawn in `src/ui/questArt.ts` |
| Legacy unlocks and automation | `src/data/legacy.ts`, `src/data/automation.ts` | `src/engine/automation.ts` |
| Hype meter, drops, and buffs (what a drop pays is scaled in `src/engine/rewards.ts`) | `src/engine/clicker.ts`, `src/engine/drops.ts`, `src/engine/buffs.ts` | `src/ui/layout/ClickerPanel.svelte` presents them |
| Invitationals: rounds, field strength, preparation stakes, names by tier | `src/engine/tournament.ts` | `src/engine/drops.ts` sends the invite, `src/ui/components/TournamentModal.svelte` shows it |

Use the `when` condition on a ticker line to match the org's current scale. Timed world events should set the activity log's `endsAt` to the actual effect expiry, so the Active view clears when the effect does.

## Economy rules

| What | Where |
| --- | --- |
| How the economy works now (no targets) | `docs/economy.md` |
| Fan stages: names, thresholds and blurbs for the road from the lobby to the team everyone knows | `src/data/fanStages.ts`; the value of a fan and the fame curve are in `src/engine/economy.ts` |
| Drop and lump-sum reward scale (minutes of income by time into a run), the early-game guard | `src/engine/rewards.ts` |
| Base income (the smoothed, buff-free income every income-linked price reads) | `src/engine/baseIncome.ts` |
| Team Elo, promotion and relegation | `src/engine/elo.ts`, constants in `src/data/leagues.ts`; engagement curve in `src/engine/mood.ts` |
| Market reroll price and its reset window | `src/engine/market.ts` |

## Simulation

| What | Where |
| --- | --- |
| Simulated players (active, semi, casual, idle, optimal, hermit) | `scripts/sim/personas.ts` |
| Run one persona and write its record (nothing to pass or fail) | `npm run sim -- --persona=active --hours=4`, `scripts/sim/cli.ts` |

The old balance targets, matrix report and late-game audit were retired; their analysis is archived in `docs/archive/` and is not guidance.

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
