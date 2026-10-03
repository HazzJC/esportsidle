# The first-run quest tour: design for review (WS6)

The build sheet behind WS6 in `docs/implementation-plan.md`. The plan's table says *what* each stop teaches and pays; this says *how*: the metric each quest reads, the engine hook each new reward needs, and the order. **Phase A built the data model** (WS6.1: `mechanic` tags, reward kinds `tool` / `opAffinity` / `cosmetic` / `title`, `QUEST_TOOLS`, the first-units discount effect, `hasTool` / `useToken`, tests). **Nothing below is live yet:** the live line is still today's 22 quests, and the rewrite (WS6.2) waits for the WS3 numbers.

## 1. The recipe

Every stop pays three things at once (`rewards` is the choice, `bonus` is always paid):

1. **Area reward:** a perk, tool or token in the system the quest taught.
2. **Operation affinity:** `{ kind: 'opAffinity', op }` in `bonus`. Settled when claimed: ×2 on that operation if one is owned, otherwise its first 10 units cost 25% less (`AFFINITY_*` in `src/data/quests.ts`).
3. **Flavour,** where there is something to give: a `title` or `cosmetic` in `bonus`, kept across sales in `quests.collection`.

Cash only where a catch-up helps, and never more than a couple of minutes of income.

## 2. The stops

**Metric** is what `QuestDef.metric` reads. *New stat* means a counter to add to `Stats` (default 0, filled in by `mergeDefaults`). **Hook** is the engine change the area reward needs.

| # | id | Mechanic | Metric | Area reward | Hook | Affinity | Flavour |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `grinders_10` | operations | `ops.grinder.owned` ≥ 10 | Grinders ×2 (exists) | — | grinder | |
| 2 | `upgrades_3` | upgrades | `stats.upgradesBoughtTotal` +3 | Clicks ×2 (exists) | — | grinder | |
| 3 | `crowd_1` | clicking | `stats.crowdsTotal` +1 | Crowds last 50% longer (exists) | — | broadcast | |
| 4 | `drop_1` | drops | `stats.dropsClicked` +1 | Drops 20% more often (exists) | — | creator | |
| 5 | `gear_1` | gear | `stats.gearBought` +1 | A free gear tier on your best player | new reward kind or a one-off in `applyReward` | bootcamp | |
| 6 | `staff_1` | staff | `stats.staffHired` +1 | Next 10 hires −10% | `staffCostMult` with a count (new effect) | bootcamp | |
| 7 | `scout_1` (new) | scouting | `stats.playersSigned` +1 | **Scout's choice** token | Market: one rarer prospect on the next refresh, `useToken('scout_choice')` in `market.ts` | bootcamp | title "Talent Scout" |
| 8 | `lineup_1` (new) | lineup | *new stat* `lineupFixes` (an off-role player moved on-role) | Off-role penalty halved | `offRoleMult` field on `Mods`, read in `teams.ts` | arena | |
| 9 | `plan_1` | seasonPlan | exists | Change the plan once mid-season | `useToken`-style flag in `teams.ts` | arena | |
| 10 | `merch_trend` (new) | merchDesign | a line whose design is on trend (`analyzeDesign(...).trend ≥ TRENDING_THRESHOLD`) | **Trend tip** tool | `merch.ts`: expose the next trend when `hasTool('trend_tip')`; Studio shows it | streamer | a merch finish |
| 11 | `merch_price` (new) | merchPricing | *new stat* `sweetSpotPrices` (a price set inside the sweet spot) | Sweet-spot band wider | `sweetSpotWidth` on `Mods` | streamer | |
| 12 | `design_shirt` | jersey | exists | +10% fans (exists) | — | cafe | a jersey pattern |
| 13 | `decor_1` | decor | exists | Decor effects +10% | `decorMult` on `Mods` | cafe | a decor piece |
| 14 | `sponsor_1` | sponsors | exists | Extra sponsor slot (exists) | — | platform | |
| 15 | `sponsor_goal` | sponsorGoals | exists | **Sponsor meeting** token | `sponsors.ts`: next offer one tier up | platform | title "Closer" |
| 16 | `event_1` (new) | events | `stats.choicesMade` +1 | **PR shield** token | `drops.ts`: a scandal is blocked and the token spent | studio | |
| 17 | `second_team` | teams | exists | Prize money +10% (exists) | — | arena | |
| 18 | `promotion_1` | promotion | exists | Team ratings +3% (exists) | — | league | |
| 19 | `title_1` | leagueTitle | exists | Trophies (exists) | — | arena | a cabinet plaque |
| 20 | `tourney_1` | invitationals | exists | **Wildcard invite** token | `tournament.ts`: next invitation guaranteed | lan | |
| 21 | `rival_1` | rival | exists | **Rival file** tool | Teams tab shows the rival's strength | league | |
| 22 | `sell_player` | playerSales | exists | Signing fees −15% (exists) | — | bootcamp | |
| 23 | `trophies_1` (new) | trophies | `stats.opLevels` +1 | The first operation level is free | a token read by `levelUpOperation` | (any owned) | |
| 24 | `auto_1` (new) | automation | any `automation.*.on` after it is unlocked | Automation budget starts a notch higher | default `maxCostPct` raised | studio | |
| 25 | `ops_100` | empire | exists | +5% income (exists) | — | (none) | |
| 26 | `sell_org` | sale | exists (paid on sale) | Legacy and trophies (exists) | — | (none) | |

`level_10` (training) and `tier_5` (a second promotion quest) leave the tour; training is taught by `plan_1` and the player screen, and the semi-pro milestone moves to the Dynasty Line.

### 2.1 Order

The table order is the line order. A stop whose system has not opened yet waits (today's `available` rule), so the line never blocks. Stops 1–4 are single-reward, as now; from stop 5 a stop may offer a choice, and a choice is always between **different kinds** (a tool or a perk, never cash or fans), which `tests/quests.test.ts` checks.

## 3. What changes for the player

- **Cash nearly disappears from quests.** Today, quest cash is 48% of all income at 30 minutes. After the rewrite, quests pay tools, perks and head starts, so the 10-minute-window target (quests ≤ 10% after 30 minutes) passes by construction.
- **Each reward is in the place they just learned,** with a head start on the matching operation.
- **The Quests card** shows the mechanic icon, the reward kind, and a one-line "what this teaches" (WS6.3).

## 4. Run 2 and later: the Dynasty Line (WS6.4, later)

A separate, procedural line keyed to Paths, history and the new systems: "Win a league title on the Purist Path", "Beat *Apex Void* twice", "Fill an Heirloom slot", "Complete a challenge". Two tracks at once (Empire and Story). Rewards: Path Mastery, Heirloom tokens, titles, cosmetics, occasional bounded Legacy points. It needs WS2 and A2/A3 first.

## 5. Checks

- `tests/quests.test.ts` already fails the build if a mechanic loses its quest; `TOUR_GAPS` there shrinks to empty as stops 7, 8, 11, 16, 23 and 24 land.
- Simulator: personas claim tool and affinity rewards; target quests ≤ 10% of any 10-minute window after 30 minutes.

## 6. Questions for you

1. Operation affinity as a discount when the operation is not owned yet (recommended), or only ×2 once owned? (Plan, decision 3.)
2. Are tokens (scout's choice, sponsor meeting, PR shield, wildcard invite) the right kind of reward, or would you rather every area reward be permanent for the run?
