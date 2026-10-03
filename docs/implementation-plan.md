# Implementation plan: next phase

Follows `docs/design-roadmap.md` (the why), `docs/ascension-review.md` (Cookie Clicker's progression, stage by stage) and `docs/economy.md` (the numbers). This document is the how and the order.

| # | Workstream | Size | Depends on |
| --- | --- | --- | --- |
| WS1 | HQ UI/UX clarity and consistency | M | nothing (start now) |
| WS2 | **Legacy v2**: stages, swappable Paths, Heirlooms | L | WS3 (the run must level off) |
| WS3 | Validate and fix Cookie-Clicker-like price and Legacy scaling | M | nothing for the tooling |
| WS4 | Offline is never the best way to play (**strict**) | M | WS3; must ship with or before A1 |
| WS5 | Build A1, A2, A3, A4 and A6 | L | WS3, WS4; A2/A3/A4 use WS2's hooks |
| WS6 | Quests: a first-run tour of every mechanic, and a separate run-2 line | M–L | new reward kinds from WS5 for the second half |

## Decisions recorded (your answers)

| # | Decision |
| --- | --- |
| 1 | **Offline is strict.** Rate ceiling 0.4; full rate for a short window, half rate to a hard 24 h cap. Details in WS4. |
| 2 | **Run 2+ gets its own quest line.** Run 1 is a tour that *forces* you to touch each mechanic, with rewards in that area and on the operation most like it. Details in WS6. |
| 3 | **Quests stay on their own.** "Next steps" and alerts become **collapsible** (not merged into a strip). Details in WS1. |
| 4 | **Legacy has exclusive Paths you can change between runs, and it must be very obvious.** Built as a swappable loadout on top of a permanent tree, following Cookie Clicker. Details in WS2 and `docs/ascension-review.md`. |
| 5 | **Cookie Clicker's ascension tree is the model**, so it was reviewed in full first; its lessons drive WS2. |
| 6 | **The recommended answers to the open decisions are accepted** (2 Oct 2026): "B6" is A6; the first sale is pushed with a "wait for more" preview; operation affinities discount the first units when none are owned; Path switching is free at every sale; start bonuses fold into Stage I and Heirlooms with refunds; the Legacy v2 and tour documents are approved. |
| 7 | **Pace is measured from the first Legacy point**: doubling ≥ 20 min 1 h after it and ≥ 60 min 3 h after (not at hours 3 and 6, which is mid-climb for a 3–4 h first sale gated on the last operation). |
| 8 | **Run 2 should eclipse run 1 through more engaging mechanics, not raw income**: it should feel measurably faster back to where run 1 was and reach a much higher ceiling. The 3 h sell-versus-stay check is replaced by catch-up (≤ 75% of run 1's time) and ceiling (≥ 2×) targets; Legacy v2's mechanics carry most of it. |

"B6" is **A6, the Analyst Desk** (decision 6).

## Where the economy stands right now

The floor commit `01e6749` landed (gear priced by league, a fame knee at 1e8 fans, shared team and merch income, Mania ×2.5, Merch Spotlight ×3, Talent Agents/Team Managers/Pedigree levelling off), then `5f61dd2` gated the first sale on the first Multiverse Championship. The baseline after Phase A's tooling (`output/sim/phaseA`, 1 Oct 2026) says it is **not finished**:

| Target | Now | Before the gate |
| --- | --- | --- |
| Active first Legacy point at 3–4 h | PASS, 3h55 | 1h31 |
| A run levels off (≤ ×100 in the 3 h after the first point) | **FAIL**, ×8.6e4 | ×2.5e8 |
| Sell beats stay by 1.5× | **FAIL**, sell ÷ stay 0.09 | ~0.08 |
| A. Income doubling time ≥ 20 min at hour 3, ≥ 60 min at hour 6 (new) | **FAIL**, 6 and 12 min | |
| D. Next purchase doesn't get cheaper in seconds of income (new) | **FAIL**, ×0.00–0.16 | |
| Matches under 60% of a long semi run | PASS, 42% | 40% |
| No 10-minute window over 90% one source | FAIL, 7.5% | 10.5% |
| Hermit, offline ratio and day-3 ordering (new) | PASS (no Legacy offline nodes yet) | |

So the price and pacing work in WS3 is the live blocker. Nothing in WS2, WS5 or WS6 should be *calibrated* until it passes (they can be designed and built behind defaults).

---

## 0. Ground rules for every workstream

1. **Sim first.** A feature without a persona behaviour and a target in `scripts/sim/` is not finished.
2. **Bounded payoffs.** New systems pay in Trophies, tokens or qualitative unlocks, not uncapped `×N`.
3. **One canonical home per list.** Content lives in its existing data file (`docs/content-catalog.md`).
4. **Every change ends with:** `npm test`, `npm run sim:quick` (and `npm run sim` for balance), a `PATCH_NOTES.md` entry with strikethroughs on superseded behaviour, and `docs/economy.md` updated if numbers moved.
5. **Branch per workstream**, rebased on main. Don't run the simulator while someone is changing balance constants.
6. **Save safety.** New persistent state gets a default in `state.ts`, a migration in `save.ts`, and a round-trip test.
7. **Refund, don't strand.** When a change weakens something a player paid Legacy points for (offline nodes, old tree nodes), refund the points at migration.

---

## WS1. HQ UI/UX clarity and consistency

### What I found (HQ, late-game save at 1440 px, plus the code)

| # | Finding | Why it matters |
| --- | --- | --- |
| 1 | **Raw number in the header**: "Run 13 · Legacy 5528343477458" beside a formatted "+1.13e11 legacy" chip. | One quantity, two formats. |
| 2 | **Mixed units in one tile row**: Operations, Teams and Merch show `$/s`; Sponsors shows `+191%`. | The row reads as a comparison but isn't one. |
| 3 | **Three overlapping "what next" surfaces**: Quests, "Next steps" (Next goal / Teams / Opportunity) and the Org activity log. | The player has to decide which to trust. |
| 4 | **Eight stacked sections in a narrow middle column**: Overview, Quests, Next steps, Org activity, Operations, Rival, Season recaps, Trophy shelf. | No hierarchy; a ready quest and a 300-trophy shelf weigh the same. |
| 5 | **Operations appear twice**: HQ scenes and the right-hand Store list. | Two views of one thing, 16 near-identical rows each. |
| 6 | **Dead text repeated 16 times**: "Every ×2 upgrade unlocked" and 15 of 16 show 0% share. | Hides the one row that matters. |
| 7 | **Stale copy**: Quests header says perks last "for the rest of this run"; the comment over `QUESTS` says progress is kept across sales; the sale screen now says quests are lost. | Copy and code disagree. |
| 8 | **Icon-only tab bar at narrow widths.** | Discoverability for newcomers. |
| 9 | **Reward cards mix voices** ("About 10m of income, paid now" beside an explanatory sentence). | Two cards in one choice should be parallel. |
| 10 | **No home for the coming story features** (lineage, nemesis). | Plan the layout before adding more cards. |

Keep: the drawn upgrade icons, the operation scenes, the quest-line strip, the "You keep / You lose" sale screen.

### Plan (updated for decision 3)

**1.1 Consistency sweep (S, UI-only, safe now).** One formatter for level counts (fix the raw number); one unit per tile row (income tiles vs multiplier tiles, grouped and labelled); hide "Every ×2 upgrade unlocked" once complete and mute 0% share bars; fix the stale copy and the `QUESTS` comment; audit tab labels and tooltips at 360 / 768 / 1440 px; write the review checklist (appendix).

**1.2 Collapsible "Next steps" and alerts (S–M).** Quests keep their own card at the top, unchanged in role.
- "Next steps" and the **Org activity / alerts** become collapsible cards with state remembered per card (`localStorage` with try/catch, like the operations view toggle).
- When collapsed, each shows a one-line summary badge ("Next steps · 3", "Alerts · 1") so nothing is hidden silently.
- **Urgent items auto-expand** and stay open until dismissed: an injured starter, a scandal with a choice, a sale ready.
- De-duplicate: "Next goal" no longer repeats the active quest.

**1.3 Hierarchy and a Story home (M).** Group Rival, Season recaps and Trophy shelf (and later Lineage and Nemesis) under a collapsible **Story** section, collapsed by default after run 1. In the late game the HQ operations view defaults to the compact list sorted by share; buying happens in the Store only.

**1.4 Verify (S).** Review fresh, mid-run and the late-game fixture (inject the save before load; a normal reload overwrites it) at three widths. Component tests for the urgent auto-expand logic.

**Acceptance:** no raw 13-digit numbers; one unit per tile row; each collapsible card keeps its state and surfaces urgent items; the late-game HQ fits on two screens.

---

## WS3. Price and Legacy scaling: validate, then fix

### Validation result

- **Operation prices are an exact copy of Cookie Clicker's**: all 16 base costs and base outputs in `src/data/operations.ts` match the wiki line for line (15 / 0.1 through 310Q / 150B), with ×1.15 growth and a 25% refund (`pricing.ts`). Tier thresholds are 1, 5, 25, 50, 100, 150 … 450 (12 doubling tiers; Cookie Clicker has 15).
- **So the price curve isn't the problem.** Income outruns it because **matches, merch, fame, sponsors and the Legacy level term are multipliers that don't pay the price curve.** Cookie Clicker's multiplier growth is chained to its ×1.15 wall; yours isn't. The baseline above shows the result.
- **Legacy level:** `floor(cbrt(earned / 1e12))`, +1% income per level, identical to Cookie Clicker's formula. The outcome differs because earnings reach 1e50, so the level term is ×1e11 in the reference save.

### Plan

**3.1 Parity tests (S).** `tests/pricing.test.ts` freezes the 16-row table, ×1.15, bulk price, max-affordable and the 25% refund.

**3.2 Measurement script (M).** New `scripts/sim/price-curve.ts` on the active persona's saves, every 30 minutes:

| Check | Measure | Cookie-Clicker-like shape |
| --- | --- | --- |
| A. Income doubling time | minutes to double | lengthens; target ≥ 20 min at hour 3 and ≥ 60 min at hour 6 (today ≈ 6 min) |
| B. Payback shape | payback of the next unit of the most-owned operation between tier unlocks | sawtooth: ×1.15 per purchase, drops at each ×2 tier; trend up |
| C. Cost coupling | split income growth into units, upgrades, fame, sponsors, matches, merch, Legacy | price-coupled factors carry most of the growth |
| D. Seconds-to-afford | seconds of income for the cheapest useful purchase of each kind | flat or rising after hour 2 |
| E. Sink coverage | does each cash sink's price rise at least as fast as its return | nothing becomes free |
| F. Legacy term | level × 1% as a share of the total multiplier at 3, 6, 12 h and in the reference save | a minority, not ×1e11 |

Wire A and D into `targets.ts` and `report.md`.

**3.3 Decide and tune (M).** Candidate levers (from `economy.md`): couple the big multipliers to something priced (for example matches' income share grows with the units the player owns), raise upper-tier price growth, push tier unlocks later, flatten fame further, and reshape the Legacy level term (log or sqrt, or a capped per-level %). Pick the smallest set that passes A, D and the restart check; record before/after in `docs/economy.md`.

**Acceptance:** A and D pass; restart check (sell ÷ stay ≥ 1.5×) passes; Legacy level term < 50% of the total multiplier at 12 h.

---

## WS4. Offline is never the best way to play (strict)

### Why this needs care

- Offline is 100% efficient for up to 72 h at max nodes (the late-game save's "Welcome back" says so). Three nodes add 0.15 + 0.25 + 0.40 to a 0.2 base, capped at 1.0, and the cap is 12 h + 12 h + 48 h.
- Today active play wins only because income compounds so fast. **Once WS3 levels the run off, offline becomes relatively stronger.** That is the trap this workstream exists to close.
- A1 adds more value to being away, so it lives under the same rule.

### The rule

> For the same wall-clock time, presence beats absence: active ≥ semi ≥ tab-open idle > closed game. Offline is a floor, not a strategy.

### Strict settings (decision 1)

| Lever | Today | Strict |
| --- | --- | --- |
| Offline rate | 0.2 base, up to 1.0 | **0.2 base, 0.4 maximum** (two nodes of +0.1) |
| Full-rate window | 12 h base, up to 72 h | **6 h base, up to 12 h** (two nodes of +3 h) |
| Beyond the window | full rate | **Half rate**, to a **hard cap of 24 h** |
| Hours past 24 | full rate to the cap | earn nothing |
| What offline earns | ops, teams, merch at the rate | ops, teams, merch at the rate; **never** crowds, drops, chains, sponsor goals, Invitationals, quests, trophy upgrades |
| Reinvesting | none | none (an Operations Manager, if on, buys at the offline rate) |

Effective offline hours = `min(away, W) + 0.5 × (min(away, 24) − W)` for `away > W`, where `W` is the full-rate window.

### Plan

**4.1 A test persona (S).** `hermit` in `personas.ts`: opens every 12, 24 or 72 hours for five minutes, spends everything, closes. Targets in `targets.ts`:
- hermit's first Legacy wall-clock time ≥ **2× the active player's** and ≥ the casual player's;
- progress at days 3 and 7 ordered active > semi > idle > casual > hermit;
- offline income per hour ≤ 0.5× tab-open idle.

**4.2 Implement (S–M).** Change the `offlineRate` and `offlineCap` effects and their node values; add the half-rate taper in `applyOfflineProgress` (`game.ts`); make the rate explicit in `WelcomeBack.svelte` ("at 40%, for the first 6 hours") with a neutral line about what a present player would have earned. Existing saves: **refund the points** of offline nodes whose effect shrank (per rule 7), so nobody is silently nerfed.

**4.3 Guard A1 (with A1).** Simulated offline matches pay through `earnCash` with the same factor, earn reduced XP, cannot skip energy, injury or morale, and cap the simulated matches per absence.

**4.4 Reward returning (S, optional).** A short "Back in the building" buff after a return (crowd meter at 50%, refreshed forecast tape), scaled by time away up to a small cap. It rewards coming back and playing, not the absence.

**Acceptance:** hermit < casual < idle < semi < active at days 3 and 7; offline per hour < half of tab-open idle; no Welcome-back ever says 100%.

---

## WS2. Legacy v2: stages, Paths and Heirlooms

The design reasoning is in `docs/ascension-review.md`. In short: **Cookie Clicker's tree is permanent and additive and unlocks mechanics and slots; the choices live in swappable loadouts (dragon auras, pantheon, permaslots).** We copy that shape, and make your exclusive paths the loadout.

### What changes

1. **A staged, permanent tree** (Foundation, Paths, Bootcamp and Return, People, Big Stage, Unshackling, then Dynasty). Each stage introduces a named cluster of *mechanics*; costs follow a ladder (about ×3 early, then ×2.5; each stage 4–6× the last). Most new nodes add a verb, not a percentage.
2. **Four exclusive Paths** (Purist, Content Empire, Dealmaker, Scholar). Unlock each once with points; **choose the active Path at each sale, free, change whenever you sell**; never mid-run. A second slot comes at Stage V.
3. **Path Mastery.** Each run on a Path adds mastery that permanently opens that Path's deeper nodes, so switching is interesting, not lossy.
4. **Heirlooms** (our permanent upgrade slots, five of them): pick store upgrades to own from minute one every run. The slot count is the progression; no power creep.
5. **A first sale that is a spree, not a nudge.** The sale screen shows what the points buy now against what a larger sale would buy.
6. **Very obvious** (your requirement): Path cards on the sale screen with three plain-language rules and a "what changes next run" preview; a coloured Path chip in the top bar and a banner on the HQ overview for the whole run; coloured lanes in the tree with the active one lit and the rest dimmed; tooltips that say when a node depends on the Path; an explicit confirmation when switching; the Path on each Hall of Fame entry.

### Plan

**2.1 Design pass (S).** Write the stage table, the Path rule tables, the Heirloom list and the migration rules in `docs/`, and review them with you before code. Calibrate only as ratios until WS3 passes.

**2.2 Refactor the screen (S).** `Legacy.svelte` is 918 lines; split the tree, Dynasty, Challenges and the sale panel into components before adding more.

**2.3 Engine (M).** `LegacyNodeDef` gains `stage`, `path`, `unlocks` and a `rule` special; `prestige` gains `paths: { unlocked, active, mastery }`, `heirlooms: string[]` and slot counts. Rules are small `Mods` fields in the modules that own each system (sponsors, drops, merch, teams); no `if (path === …)` in the UI. Heirlooms apply at `setupNewRun`.

**2.4 UI (M–L).** Path cards, chips and banners as above; the staged tree with a "recommended next" chip and a "what this unlocks" line on every node (Cookie Clicker's missing piece); Heirloom picker.

**2.5 Migration and balance (M).** Refund the points of nodes whose effect is replaced; grandfather owned start bonuses into Stage I. Add a persona per Path and Heirloom behaviour; targets: first Legacy within ±15% across Paths, no Path over 25% ahead at hour 6, a full Heirloom set shortens the first hour by at most 25%, main tree done around sale 15–25.

**Acceptance:** two players at the same Legacy level have visibly different setups; the active Path is obvious from any screen; every node's effect can be read from its tooltip; the first sale buys 6–8 things.

---

## WS5. Build A1, A2, A3, A4 and A6

Order: **A1 → A6 → A3 → A2 → A4.** A1 and A6 are independent and fix concrete gaps; A3 is 60% built and feeds both A2 and A4; A2 is the largest; A4 pulls together the nemesis, preparation stakes and Path capstones. Each lands as a Stage in WS2 (Stage III: A1, A6; IV: A3, A2; V: A4) so the tree is what unlocks them.

### A1. Offline Bootcamp (M)
- **Engine.** In `updateTeams` (`teams.ts`), replace the offline branch (which pays `cps × dt × factor`) with a coarse match loop calling `playMatch` with a "quiet" flag (no toasts, collect a summary). Reuse `MAX_MATCHES_PER_TICK`. Pay through `earnCash` at the WS4 factor.
- **Report.** Extend `OfflineReport` (`game.ts`) with matches, wins, promotions, level-ups, milestones and injuries; show a short dispatch in `WelcomeBack.svelte`, keeping the skyline art.
- **Guards.** WS4 rules apply: same factor, reduced XP, no skipped energy, injury or morale; capped matches per absence. A seeded test asserts offline and online totals agree at rate 1.
- **Sim.** `casual` and `hermit` read the dispatch; target: per hour of wall-clock, offline matches pay ≤ 0.5× the tab-open idle rate.

### A6. Analyst Desk (S–M)
- **Engine.** In `drops.ts`, draw the next N outcomes ahead from the seeded `rng` and persist a `forecast` queue (so a reload can't re-roll). Gate length by Analyst count (`staff.ts`).
- **UI.** A small tape in `ClickerPanel.svelte`: kind and rough window ("LAN Frenzy in ~3 min"), never the exact second.
- **Later.** Hold one drop for a limited time; one re-roll per hour.
- **Sim.** `active` uses the tape; target a bounded gain (≤ +10% drop income). Never reveal Invitation outcomes, only that one is coming.

### A3. Nemesis (M)
- **Data.** Carry `s.rival` through `sellOrg` (today `state.ts` resets it). Add `prestige.nemesis: { name, wins, losses, stolen, generation }` with a migration.
- **Behaviour.** Strength follows the org's best tier, not income. A loss in an Invitational final can poach a player (reuse the `poaching` event in `worldEvents.ts`) with capped fan loss and a cool-down; a win pays a "Bounty" trophy (new `TrophyKind`).
- **Content.** Ticker lines in `src/data/news.ts` with lower and upper scale bounds; activity-log entries with `endsAt` where timed.
- **Quests.** The nemesis drives a quest chain (WS6).
- **Sim.** Head-to-head win rate for `active` between 35% and 65%.

### A2. Lineage (L)
- **Data.** Extend `Legend` (`types.ts`) with `school`, `apprentices`, `generation`, derived from top stats and traits (no hand-written list to go stale). `apprenticeOf` on `Player`. Migration for existing legends.
- **Behaviour.** A signed rookie can be assigned to a legend of the same game: one inherited trait (weighted by the school), a mentor-shaped XP curve, a named signature perk. Power is transferred and capped per generation, not compounded.
- **Effects.** Use the existing `Effect` union (no new multiplier kinds).
- **UI.** Lineage view under HQ's Story section and in the Legacy tab; school badge on `PlayerCard.svelte`; an apprentice action on signing. Prototype the UI with three generations before building the rest.
- **Sim.** A persona that retires and assigns; lineage adds a bounded share and never outpaces the Scholar Path nodes that unlock it.

### A4. The Finals Moment (M)
- **Engine.** In `tournament.ts`, a `calls` step before each round (`push`, `eco save`, `hype ping`), each shifting `invitationOdds` with a visible probability. A per-invitation **Crunch Time** toggle applies `energyDrain` and `injuryMult` modifiers via `addModifier` for the event.
- **Payout.** Trophies plus the existing bounded prize. Stacked buffs raise the odds and the crowd's fans; they do not multiply the payout.
- **Hooks.** The nemesis can be the finalist (A3); the Purist Path unlocks extra calls.
- **Sim.** `active` uses calls; Invitational champion rate 40–60%.

### Shared work for all five
Persona behaviour and targets; content in canonical files (and a line in `docs/content-catalog.md`); save migrations with round-trip tests; a `PATCH_NOTES.md` entry per feature.

---

## WS6. Quests: a first-run tour, and a separate run-2 line

### What I found

- 22 quests in one fixed line, one at a time (`QUEST_SLOTS = 1`). Twelve pay cash (two of those also pay fans); fourteen give a flat-percentage perk. Quests are lost on sale, so today run 2 would replay the same 22.
- Cash is the wrong currency at both ends: quest cash is **48% of all income at 30 minutes** (`economy.md`) and irrelevant late ("$8.59e43, about 10 minutes of income" against $9e41 per second in the late save).
- "Pick one of: 10 minutes of income or 6.4e16 fans" is two quantities of the same thing, not a choice.
- The line already touches many mechanics (design a shirt, sign a sponsor, win promotion…), but its rewards don't connect to what you just learned.

### Design (decision 2)

**Run 1 is a guided tour.** Every quest forces you to use one mechanic once and pays back **in that area**, plus a **bonus on the operation most like it**.

The reward recipe for each quest:
1. **Area reward.** A named permanent perk or tool in the mechanic the quest taught (a merch slot for a merch quest, a recruiting perk for a scouting quest).
2. **Operation affinity.** A bonus on the operation most like that mechanic. If the operation is owned: it produces ×2. If not yet: **the first 10 units cost 25% less** (a new per-operation cost effect, since today's `opMult` only applies to owned ones). This is what makes the reward useful at any moment.
3. **Flavour.** When there is something to give: a jersey pattern, emblem mark, palette or decor piece, or a title.
4. **Petty cash, optional and tiny** (a couple of minutes of income at most), only where a catch-up helps.

Operation affinities used below: Ranked Grinders (clicking, upgrades), Streamers (merch, design), Content Creators (viral, drops, fans), Bootcamp Houses (players, XP, staff), Gaming Cafés (fans, decor, community), LAN Centers (Invitationals), Broadcast Studios (crowds, hype), Esports Arenas (matches, titles), Game Studios (world events, metas), Streaming Platforms (sponsors, merch at scale), Global Leagues (tiers, rival).

### Run-1 tour (draft for review)

| # | Mechanic | Quest (forces the action) | Area reward | Operation affinity | Flavour |
| --- | --- | --- | --- | --- | --- |
| 1 | Operations | Own 10 Ranked Grinders | Grinders ×2 *(exists)* | Ranked Grinders | |
| 2 | Upgrades | Buy 3 upgrades | Clicks ×2 *(exists)* | Ranked Grinders | |
| 3 | Clicking and hype | Fill the meter for a crowd | Crowds last 50% longer *(exists)* | Broadcast Studios | |
| 4 | Drops | Catch a Hype Drop | Drops 20% more often *(exists)* | Content Creators | |
| 5 | Gear | Buy a gear upgrade | A free gear tier on your best player | Bootcamp Houses | |
| 6 | Staff | Hire your first staff member | Staff cost −10% for the next 10 hires | Bootcamp Houses | |
| 7 | Scouting | Sign a player from the Market | **Scout's choice**: a shortlist of one rarer prospect | Bootcamp Houses | Title "Talent Scout" |
| 8 | Lineup | Fix an off-role player | Off-role penalty halved | Esports Arenas | |
| 9 | Season plan | Set a season plan | The plan can be changed once mid-season | Esports Arenas | |
| 10 | **Merch: match a design to a shirt** | Put a design on a product so it fits the current trend | **Trend tip**: see the next trend one rotation ahead | Streamers | A merch finish |
| 11 | Merch pricing | Price a product in its sweet spot | Sweet-spot band widens | Streamers | |
| 12 | Jersey | Draw a design and set it as the jersey | +10% fans *(exists)* | Gaming Cafés | A jersey pattern |
| 13 | Decor | Buy a piece of decor | Decor effects +10% | Gaming Cafés | A decor piece |
| 14 | Sponsors | Sign a sponsor | Extra sponsor slot *(exists)* | Streaming Platforms | |
| 15 | **Sponsor goal** | Meet a sponsor goal | **Sponsor meeting**: a guaranteed offer one tier up | Streaming Platforms | Title "Closer" |
| 16 | Risk choice | Answer a world event or a drama choice | A one-time **PR shield** against a scandal | Game Studios | |
| 17 | Second team | Found a second team and sign a player | Prize money +10% *(exists)* | Esports Arenas | |
| 18 | Promotion | Win promotion | Team ratings +3% *(exists)* | Global Leagues | |
| 19 | League title | Win a league title | Trophies + a title | Esports Arenas | Trophy cabinet plaque |
| 20 | Invitational | Win an Invitational | **Wildcard invite**: one guaranteed invitation | LAN Centers | |
| 21 | Rival | Beat your rival in a grudge match | **Rival file**: see their roster strength | Global Leagues | |
| 22 | Player sale | Sell a developed player | Signing fees −15% *(exists)* | Bootcamp Houses | |
| 23 | Trophies | Spend trophies on an operation level | The first level costs nothing | (any) | |
| 24 | Automation | Turn on an automation | The automation budget starts a notch higher | Game Studios | |
| 25 | Empire | Own 100 operations | +5% income *(exists)* | (whole) | |
| 26 | **The big exit** | Sell the org | Legacy and trophies *(exists, fixed in `f328057`)* | | |

Notes:
- Rows marked *(exists)* keep today's reward and gain the operation affinity and flavour; new rewards (scout's choice, trend tip, wildcard invite, sponsor meeting, rival file, PR shield) are **tools or tokens**, not numbers.
- Tag every `QuestDef` with a `mechanic` so a test can assert **every mechanic in the game is taught by at least one quest** (the same kind of test that would have caught "The big exit").
- Choices, where offered, are **different kinds** (a tool, a perk, a cosmetic), never two quantities.
- The tour ends when the org is ready for its first sale; the first-sale preview (WS2) is the last step.

### Run 2+: the Dynasty Line

A separate line, keyed to Paths, history and the new systems instead of replaying the tour:
- **Path quests** ("Win a league title on the Purist Path", "Finish a run on each Path").
- **People quests** (A2/A3): "Retire a player and found a school", "Win a final with an apprentice", "Beat your nemesis with a poached star back on the roster".
- **Heirloom and stage quests**: "Fill an Heirloom slot", "Beat a Stage I sale target in half the time".
- **Challenge quests**: complete a challenge run.
- Rewards: Path Mastery, Heirloom tokens, titles, cosmetics, Hall of Fame entries, occasional bounded Legacy points. Cash only as a minor catch-up.
- Two tracks at once from run 2 (one *Empire*, one *Story*), so there is a choice; tour quests stay single-file.

### Plan

**6.1 Data model and tests (S).** Add `mechanic` and reward `kind` tags, new reward types (`tool`, `token`, `opAffinity`, `cosmetic`, `title`), and the per-operation cost effect. A test that every quest is completable, that every mechanic has a quest and that no reward can be claimed twice.

**6.2 Rewrite the tour (M).** Replace cash rewards as in the table; keep existing perks; add the new tools. Fix the copy and the `QUESTS` comment (WS1).

**6.3 Quest UI (S).** Show the mechanic icon and the reward *kind* on each card; "Up next" preview already exists; add a "what this teaches" line.

**6.4 Dynasty Line (M–L, with WS5).** Procedural quests from current state ("Promote *Counter-Stroke* this season", "Beat *Apex Void* twice"), using hooks from A2, A3, A4 and A6.

**6.5 Sim (S).** Persona preferences for reward kinds; target: quests ≤ 10% of any 10-minute window after 30 minutes (48% today).

**Acceptance:** every mechanic is taught by a quest with an area reward and an operation affinity; at least half of rewards are non-cash; no two options in a choice are the same kind; run 2 shows a different line.

---

## Sequencing

| Phase | Work | Gate |
| --- | --- | --- |
| **A. Now** | WS1.1 sweep; WS1.2 collapsibles; WS3.1 parity tests; WS3.2 measurement script; WS4.1 hermit persona; WS6.1 data model; WS2.1 and WS6 design docs | You have reviewed the Legacy v2 and tour tables |
| **B. Numbers** | WS3.3 tuning; WS4.2 strict offline | WS3 and WS4 acceptance pass in the sim |
| **C. Return** | A1 Offline Bootcamp; A6 Analyst Desk; WS6.2 tour rewrite | Casual and hermit targets hold; every mechanic has a quest |
| **D. Legacy v2** | WS2.2–2.5 (Stages I–III, Paths, Heirlooms) | Path parity within ±15%; first-sale spree buys 6–8 things |
| **E. People** | A3 Nemesis; A2 Lineage; WS1.3 Story section; WS6.4 Dynasty Line | Two sales later the Story section shows a named school and nemesis |
| **F. Burst moment** | A4 Finals Moment; Stage V | Invitational win rate 40–60% |

Phases A and B change little the player sees, and they protect everything after them.

**Phase A status (1 Oct 2026): built, awaiting your review.**

| Item | State |
| --- | --- |
| WS1.1 sweep | Done: formatted Legacy level, Sponsors tile in $/s, no repeated "Every ×2" line, near-idle lanes muted, every tab named for screen readers and on hover, stale quest comments fixed |
| WS1.2 collapsibles | Done: "Next steps" and "Org activity" collapse, remember their state, show a count, and open for a new urgent item; "Next goal" and "Opportunity" skip what the active quest says |
| WS3.1 parity tests | Done: `tests/pricing.test.ts` (and a max-affordable rounding fix) |
| WS3.2 measurement | Done: `scripts/sim/price-curve.ts`; A and D are report targets |
| WS4.1 hermit | Done: `hermit`, `hermit-12`, `hermit-72`; offline targets in the report; `--preset=offline` |
| WS6.1 data model | Done: mechanic tags, new reward kinds, first-units discount, tests |
| WS2.1 and WS6 design | Written and approved: `docs/legacy-v2.md`, `docs/quest-tour.md` |

**Phase B status (3 Oct 2026): built.** Details and numbers in `docs/economy.md` and `PATCH_NOTES.md`.

| Item | State |
| --- | --- |
| WS4.2 strict offline | Done: rate ≤ 40%, a 6–12 h full-rate window, half rate to 24 h; offline nodes refunded (save v8); Welcome Back states the rule |
| WS3.3 tuning | Done: fame tops out at 3e9 fans, small late superfan and fame upgrades, steeper top-four operations and dearer tier upgrades, a gear price floor |
| WS3 acceptance | A, D and E pass; the new restart targets pass (catch-up 60%, ceiling ×28); the Legacy level term stays a minority (check F) |
| WS4 acceptance | Passes: hermit < casual < idle < semi < active at days 3 and 7, an hour away pays 5–11% of an open hour, the offline rate never tops 40% (`output/sim/offline7`) |
| Not met | "Levels off ≤ ×100 in 3 h": ×126, mostly the step of buying the last operation; the old 10-minute window check for idle and semi (unchanged, 7.4%) |

---

## Decisions still open

None at the moment: the six questions that were here are answered by decisions 6–8 above.

---

## Appendix: UI review checklist (WS1)

- Units: `$` for cash, `$/s` for income, `×` or `+%` for multipliers; one unit per row of tiles.
- Numbers: every count through the shared formatter; no raw digits over six characters.
- Tone: only colours from `src/data/palette.ts` and `ToneSwatches`.
- Copy: competition glossary terms only (`docs/content-catalog.md`); no text that contradicts the sale screen.
- Empty states: explain what will appear and what unlocks it.
- Hierarchy: one primary action per card; collapsed cards show a count; urgent items auto-expand.
- Accessibility: icon-only controls have `aria-label` and a tooltip; keyboard reachable; contrast checked on gold and muted text.
- Responsive: 360, 768 and 1440 px.
- States: fresh, mid-run, late-game fixture.
