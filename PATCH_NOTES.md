# Esports Idle — Patch Notes

> ### 🤖 Instructions for AI Agents & Contributors
> Every AI agent working on this repository MUST maintain and update this file:
> 1. **When submitting work for a PR / branch / review**:
>    - Add a new entry under the top **Pending Changes** section marked with `[Status: Pending]`.
>    - Clearly explain **The Issue / Motivation** (what problem or feature request is being addressed).
>    - Clearly explain **What Changed** (the exact code, balance, UI, tests, or mechanical changes made).
> 2. **When modifying, tuning, or replacing existing mechanics**:
>    - Search earlier patch note entries that introduced or altered that system.
>    - Apply a markdown strikethrough `~~...~~` over the superseded behavior, number, or rule.
>    - Add or increment a bracketed note indicating how many times it has evolved: `*(Changed N times since: ...)*`.
> 3. **When beginning or finishing work on top of merged/committed work**:
>    - Check if there are any existing `[Status: Pending]` entries that have now been committed to the branch/main history.
>    - Update their status to `[Status: Committed]` with their commit hash and date.
>    - Add your new work as `[Status: Pending]`.

---

## Pending Changes

### Fix: eight Fame upgrades did nothing, and other swallowed bonuses
*Status: Pending*

* **The Issue / Motivation**: A report said the fame exponent cap (`MAX_FAME_EXP = 0.12`) swallowed most of the Fame upgrade line. Checked against the engine, it was true:
  * Base 0.08 plus Discord Server, Fan Subreddit and Fan Art Wall reached 0.115. Meet & Greets delivered +0.005 of its advertised +0.015.
  * Fan Conventions through Fandom Singularity (2e11 to 2e25 cash) added exactly nothing, while their cards promised "fame power +0.02…0.04".
  * Worse than reported: the legacy nodes Legendary Fanbase (+0.02) and Generational Fans (+0.03) reach the cap by themselves, so an org that owns them got nothing from any of the twelve cash upgrades.
  * The existing test only checked that the cap held, not that the line still paid.
  * The same check found two related cases:
    * The VPN sponsor perk (+10% offline earnings per strength) added nothing once the three legacy offline nodes took offline efficiency to its 100% cap.
    * Chef and Sports Psychologist cards showed "+65 base morale" and more, when base morale stops at 95 (65 plus 30).
* **What Changed**:
  * **Fame**:
    * Only the first four Fame upgrades raise the exponent, and `MAX_FAME_EXP` is 0.13, exactly the base plus those four, so the cap guards against a stray source without swallowing a purchase.
    * Fan Conventions through Fandom Singularity now multiply the fame bonus (×1.2, 1.2, 1.25, 1.25, 1.3, 1.3, 1.4, 1.5; a new `fameBonus` effect). A multiplier doesn't compound with the fanbase the way an exponent does, so the late line can't run away. Together they are ×8 at the top of the line.
    * The legacy nodes are now fame bonus ×1.25 (Legendary Fanbase, alongside fans ×1.5) and ×1.5 (Generational Fans).
    * Card text, the legacy descriptions, the Fans tooltip and the code comment now say what actually happens.
  * **VPN sponsors** add offline hours (+6h per strength, uncapped) instead of offline efficiency. Sponsor perk scaling handles hour-based effects.
  * **Morale**: Chef morale levels off at +15 and Psychologist at +12, through the staff effect ceiling. With decor's +19 that covers the 95 cap even for Homesick players, and the cards show what lands. Their other effects are unchanged.
  * **Tests** (`tests/fame.test.ts`):
    * Buying each Fame upgrade and legacy fame node in order must raise the fame bonus.
    * Every fame-exponent source together must fit under the cap, and every offline efficiency source within 100%.
    * A general guard: every store upgrade, bought in cost order, must change the game's modifiers. That fails for any future cap that silently eats a purchase, and it would have failed for this one.

### HQ redesign, drawn upgrade icons and brighter operation scenes
*Status: Committed* | `5ff945a` (Sep 23 2026)

* **The Issue / Motivation**:
  * The HQ was hard to read at a glance. There was no summary of where income came from, the goal cards left gaps, and the operation lanes showed little beyond a count, with a cryptic level button.
  * The page grew very long with every operation.
  * Most store upgrades were plain outline icons next to the drawn operation buildings.
  * A few operation scenes were dull or low-contrast: Content Creators, Streaming Platforms, and the dark Ranked Grinder room.
* **What Changed**:
  * **HQ overview** (`HQOverview.svelte`):
    * A banner painted with the org's best operation scene, with a slow light sweep. It shows the logo, room, run and legacy, a large income figure, and boost and sponsor chips.
    * An income-mix bar splits income into Operations, Matches and Merch.
    * Four tiles jump to where each stream is managed: Operations (buildings, best building), Teams (team count, average win chance), Merch (lines on the current trend, flagged when some aren't) and Sponsors (boost, slots signed).
  * **Next steps**: the goal, team and opportunity cards are one panel of rows, each with a coloured marker, the detail and an action button. On phones the button drops under the text.
  * **Operations**:
    * A header with the building count and operations income.
    * A **Scenes / List** toggle; List hides the scenes so every operation fits on one screen, and the choice is remembered in this browser.
    * Each lane shows the building's own sprite, the count, income, a bar for its share of operations income, and when its next ×2 upgrade unlocks. The level-up button explains itself in a tooltip.
    * Rival, recaps and trophies move below the operations.
  * **Upgrade art** (`upgradeArt.ts`): 23 new drawings in the operation-sprite style replace the plain icons on every store upgrade and in Stats. They cover the mouse, crowd, megaphone, snacks, heart, superfan star, trophy, dumbbell, stopwatch, scouting, CPU, briefcase, hype drop, bracket, flame, shield, sponsor contract, jersey and fancam. Staff upgrades share an ID-card drawing, with the role icon in the corner. Every upgrade now has a picture.
  * **Scenes**:
    * Content Creators: a colourful set with a two-tone wall, acoustic panels, a play-button sign, softboxes and a shelf of figurines.
    * Streaming Platforms: a brighter data hall with a wall of live screens, cable trays and paler back racks, so the racks you own stand out.
    * Ranked Grinders: a lighter room.
    * Every HQ worker gets a thin rim of its lane colour, lifting dark sprites off dark scenes.

### Fix: black screen after offline progress (duplicate match key)
*Status: Committed* | `ce5a011` (Sep 23 2026)

* **The Issue / Motivation**: A returning player's save crashed on load with Svelte's `each_key_duplicate`, which the new recovery screen reported. The recent-results list under the logo keyed each match by `game-time`. Offline catch-up runs in coarse steps, so it can finish two matches for one team in the same tick; they got the same key and the first render threw. The bug dates from M2, and a long enough absence triggers it.
* **What Changed**: Recent results are keyed by game, position and time (`ClickerPanel.svelte`). HQ season recaps also add their position to the key, as a guard against the same kind of collision (`Stories.svelte`). Reproduced with a save whose team had two matches at the same time: it crashed before the fix and loads after it.

### A recovery screen instead of a black page
*Status: Committed* | `ac756be` (Sep 23 2026)

* **The Issue / Motivation**: An existing player saw only a black screen on the GitHub Pages site, while a fresh browser (Edge) loaded fine. Pages lets browsers cache the page for 10 minutes. A page cached from before a deploy points at script files that no longer exist, and a save the new version can't draw would crash the same way. Either failure left an empty dark page, with no hint and no way to rescue the save.
* **What Changed**:
  * `index.html` carries a small inline safety net that doesn't depend on the game's own code. If the game hasn't drawn anything and a script failed to load, threw, or never ran, it shows a "couldn't start" card instead.
  * The card suggests a hard refresh and has a button that reloads past the cache. It also offers **Copy my save** and **Download my save**, and a technical-details panel with the error.
  * `src/main.ts` clears any half-drawn page if the first render throws, so the card can appear.

### Operations reordered by real-world cost
*Status: Committed* | `007841c` (Sep 23 2026)

* **The Issue / Motivation**: A few operations were out of order for a progression ladder. The Gaming Café came before the cheaper Bootcamp House, the Esports Arena before the Broadcast Studio, and the Streaming Platform before the Game Studio. Ranked by rough real-world cost, the order runs: a house (~$1M), a café fit-out, a LAN venue, a broadcast stage (~$2–15M), an arena (~$10–100M), a competitive AAA game (~$100–500M), a platform (~$1B), then a global league.
* **What Changed**:
  * The new order: Ranked Grinder, Streamer, Content Creator, **Bootcamp House, Gaming Café**, LAN Center, **Broadcast Studio, Esports Arena, Game Studio, Streaming Platform**, Global League, then the sci-fi tier unchanged.
  * Prices, output and fans stay with each position, so the balance curve is unchanged. Each building's name, art, tier upgrades, collabs, achievements and ticker lines move with it.
  * Save version 6: a migration swaps each org's owned counts, levels, bought and revealed tier and collab upgrades, and ownership achievements between the three pairs. Every org earns exactly what it did before; its cafés are now bootcamps in the same slot.
  * `tests/op-order.test.ts` covers the order, the rising costs, the migration and unchanged income.

### Type-check fix for the merch rebalance tests
*Status: Committed* | `79d9860` (Sep 23 2026)

* **The Issue / Motivation**: CI's `npm run check` failed on `tests/merch-rebalance.test.ts`, which seeded its random generator with `{ rngState: 99 }`. The generator's holder field is called `rng`.
* **What Changed**: The test now seeds with `{ rng: 99 }`, the same as every other test.

### Merch that rewards trend-chasing, a hype helper, an auto-clicker, faster late game and scrolling fixes
*Status: Committed* | `0de7c85` (Sep 23 2026), awaiting playtest

* **The Issue / Motivation**:
  * Players reported that merch went "insane" late in the game, that scrolling misbehaved on some pages, and other rough edges. A progression audit (`docs/progression-audit-2026-09-22.md`, `scripts/audit.ts`) found:
    * Merch made 80–100% of all income, and hundreds of thousands of times operations for active players. The main cause was Merch Designers multiplying merch sales with no cap: merch paid for more designers, which made more merch.
    * Mania (×7 for 5–10 minutes) swung income wildly.
    * The "Hype streak" quest needs ~80 fast clicks, so players who can't click much were stuck on it for the rest of every run.
    * On phones the top bar was 422px wide, so on any phone narrower than that the page slid sideways and pushed the bottom nav off screen.
    * Late in a run the page redrew at 85–180ms a frame, making scrolling stutter.
  * The requested design: set-and-forget merch should earn less than operations; tracking trends and launching fresh designs should earn more.

* **What Changed**:
  * **Merch rebalance**:
    * Merch Designers now keep designs fresh for longer and make each trend last longer, with only a small sales boost. Every designer bonus levels off at a ceiling (at most twice as fresh, trends 75% longer, +30% sales), through a new `max` on staff effects (`effectAmount` in `src/data/staff.ts`).
    * The merch sales multiplier upgrades are now ×1.25, ×1.5, ×1.25 and ×1.25 (Limited Edition Drops ×1.5 freshness), and Cult Merch is ×1.5.
    * Finishes add 0.15 a level (×2.5 at Q10). Trend matching is ×2 and a line earns 0.5× its share of operations income (`MERCH_INCOME_SCALE`).
    * Mania is ×4 and lasts 60–120 seconds.
    * A design a line sold in the last two hours comes back no fresher than it left, so swapping designs back and forth doesn't reset freshness.
    * Audit result: active players following trends earn about 2–3× operations from merch, semi-active 0.3–0.5×, passive under 0.1×.
  * **Chasing trends**:
    * A "Design for <trend>" button in the Studio generates a design briefed to match the current trend. Every trend's brief matches in testing.
    * Designs show an "On trend" chip, and an "All merch" button puts a design on every line.
  * **Hype streak help**: while that quest is live, the hype meter warms up by itself to 80% (a gold tick marks it), so a few clicks finish it.
  * **Auto-clicker**: an Accessibility option in Options clicks the logo twice a second while the game is open.
  * **Performance** (late-game frame time: 84 → 10ms on HQ, 95 → 15ms on Teams, 178 → 12ms in the Studio):
    * The HQ agenda caches its best-signing search.
    * Operation art strings are cached.
    * Only every third HQ worker bobs.
    * HQ strips and Studio product cards skip rendering off screen.
    * Easter-egg name matching is memoised.
    * The interface redraws 10 times a second instead of 15.
  * **Scrolling**:
    * The phone top bar fits 360px screens, so the page no longer slides sideways.
    * Pull-to-refresh can no longer reload the game.
    * Scroll panels contain their own scrolling.
    * The phone Store scrolls as one list instead of two nested boxes.
    * Picking up a player on a touch screen drags the card instead of scrolling the page.
    * The active tab stays in view in the tab strip.
  * **Visual passes**:
    * The world-event decision card is a solid card at the bottom centre with an illustrated banner: the player's portrait, the rival's crest, or a drawn prop.
    * Hype Drops are bevelled hex badges with light rays.
    * Welcome Back shows the org's skyline at night.
    * The HQ quest card shows the quest line as a road of medallions.
    * Trophies have lit and shaded metals on plinths, with a neon crystal for tier 12+, on wooden shelves.
    * Achievements are struck coins.
    * The Legacy tree has bevelled medallions, node names, cost pills and a night-sky backdrop, and opens centred on the root on phones.
    * The Team HQ and Campus windows show a layered night city.
    * Season recaps have game logos and result badges.
    * Smaller fixes: clearer on/off toggles, and Stats values that no longer wrap mid-figure. The Welcome Back stray space is fixed.
  * **Tests**: `tests/merch-rebalance.test.ts` covers the designer ceilings, trend length, trend-briefed designs, on-trend vs stale income, set-and-forget merch staying under operations, the swap-back freshness rule, Mania length and the hype helper.
  * **Pacing note**: passive players now reach their first sale at about 5h20 (was 3h30–4h40), because merch no longer carries them. Semi-active players take about 2h10 and active players about 1h30.

### Visual pass: fixes, tablet layout and consistent art
*Status: Committed* | `4f7b344`, `243122c`, `dc0dd9e`, `14b8824`, notes `07acb22`, `5e9fe6e` (Sep 22 2026)

* **The Issue / Motivation**:
  * A review of every tab at desktop, tablet and phone widths, plus a brand-new org, found bugs, layout problems and art that looked out of place next to the gear and merch.
  * Bugs: a solo team's desk stretched to fill the column (hiding the bench during the tutorial); popups were clipped in the clicker column and covered the tabs on phones; tabs opened at the previous tab's scroll position; Svelte stripped spaces ("Skiptutorial"); Stats still said "Tournaments" and the popup settings "derbies"; a 99-cent first prize showed as $0; tutorial text about when operations open was wrong; Stats and the header disagreed on income per second.
  * Layout: phones showed cash only on the Org view; 768–1023px screens got the phone layout; the House crowded two rows of stations over each other; the Teams page was very long; HQ cards squeezed into thin columns on laptops; HQ operation strips looked thin.
  * Art: generic, repeated icons on store upgrades and achievements; plain staff rows; a wall-of-text Stats page; Orbitron's slashed zero reading as a broken glyph.

* **What Changed**:
  * **Fixes** (`4f7b344`): desks keep their normal size in narrow rooms; the clicker column shows the newest popup in full with a "+N more" count; phone and tablet popups rise from above the bottom bar (three at most); every tab opens at the top; spaces restored; wording fixed; sub-dollar amounts show cents; tutorial and Stats text corrected.
  * **Layout** (`243122c`): a two-column tablet layout that keeps the clicker in view; cash and income in the phone top bar; a staggered two-row House with names clear of everyone; a sticky team switcher and foldable team cards; HQ card grids that wrap by available width; bigger HQ workers.
  * **HQ buildings, scenes and logos** (`14b8824`): every operation building redrawn on the 48x48 grid with outlines, lit and shaded faces, glows and ground shadows; each HQ strip a layered 400x72 scene with sky gradients, depth and lighting; game, rival and sponsor logos given an embossed emblem, lighting, gloss and a bevelled rim; staff portraits clipped to their frames.
  * **Art and consistency** (`dc0dd9e`): pixel workers and tier numerals on store upgrades and the Operations list; ladder numerals and a highlighted next rung on achievements; staff portraits and hire counts, with the hire toggle above the list; a rebuilt Stats page with headline figures, an income-by-source bar and grouped cards; the UI face for counts and scores.

---

## Historical Release & Commit Notes

### Phase 6: Economy Overhaul, Balance & Feedback Loop Tuning

#### `2c355cb`, `fc807ca`, `bfb4d86`, `5160ae5`, `424938d`, `8727c16`, `c61a3fb`, `670f3b5`, `1309de3`, `39effb3` — Invitationals, the Teams room, benching that heals, living merch and a debug panel
*Date: Mon Sep 22 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * Merch items and upgrades looked plain next to the gear upgrades, and changed only their frame as the finish improved.
  * The player-name pool had grown but gamer tags had not.
  * The Roster tab duplicated the Teams tab, and moving players around was fiddly and made the page jump.
  * Injuries were purely time-based, so the bench did nothing for a hurt player, and the tutorial never showed it.
  * Sponsor temporary and permanent rewards were still unclear, and sponsor income stopped at a hidden 200% no matter how many sponsors were signed.
  * Tournament invites were rare, usually lost, and shared a confusing name with the league system. Seasons, titles, MVPs and "derbies" had no consistent vocabulary.
  * AI Trainers were just better coaches, and Team Managers scaled the same way at 1 or 100 hires.
  * There was no way to see where income actually came from while testing.
  * The HQ operations were plain coloured bars, and the HQ header repeated the income, fame, trophy and cabinet numbers shown elsewhere.
  * Quests could be put off with "Later", and quest perks carried over into every future run.

* **What Changed**:
  * **Merch that physically changes** (`2c355cb`, `c61a3fb`): bespoke art per product in the gear style, with three builds each (Q0 basic, Q2 better made, Q4 premium; for example blank tee → ringer tee → raglan crest tee). Holographic foil arrives at Q6, a limited-run hang tag at Q7, a gold signature at Q8, a collector's box at Q9 and a Hall of Fame display case at Q10. The Studio preview tilts towards the pointer, pops on upgrade and shows a strip of every look the product will reach. `tests/merch-art.test.ts` covers every product and finish.
  * **Gamer tags** (`2c355cb`): 288 tag words, prefixes, and 490 parody handles of real pros.
  * **Quests and HQ** (`fc807ca`): the quest line is linear with no "Later"; perks last for the current run only, and hovering a perk shows the quest that gave it. HQ operations are drawn as Cookie Clicker-style rows of little workers ~~(up to 40, 26px, flat 24px sprites on flat strips)~~ *(Changed 2 times since: taller strips, bigger workers, up to 32, in 243122c; redrawn buildings and layered scenes in 14b8824)*, and the four stat cards are gone.
  * **Staff** (`bfb4d86`): AI Trainers now train (XP, with some extra energy drain) instead of adding rating. Team Managers front-load: the first few matter most.
  * **Sponsors** (`5160ae5`): ten tiers (six to ten behind the Global Brand Portfolio legacy node), perks that scale with tier and goal difficulty, no hidden income cap, no goals that the org would finish in under five minutes at its recent pace, two-zone cards ("While signed" / "Goal bonus · paid once") and parody logos for all 36 brands.
  * **Invitationals** (`424938d`): the Hype Drop sends an invitation showing the chance to win each round. Spending 10%, 25% or 50% of cash on preparation raises it, and an unanswered invite plays itself after two minutes. A team level with its league wins the bracket a little over half the time, and invites are about 70% more common. One glossary covers the competition words (docs/content-catalog.md): match, season, league title, Season MVP, Invitational, grudge match (was derby).
  * **Teams room** (`8727c16`): the Roster tab is folded into Teams. Each team is a room with a parody game logo, one role-labelled desk per player drawn like the House, and a wooden bench of player cards ~~(desks stretched to the full column on narrow screens)~~ *(Changed 1 time since: desks capped at their normal size, a sticky team switcher and foldable team cards, in 4f7b344 and 243122c)*. Players move by pointer drag (long press on touch), with the change in win chance shown and no layout movement. Clicking a player opens their gear and stats. Rival orgs get knock-off crests.
  * **Rest and injury** (`8727c16`): benched players recover twice as fast. Season plans carry an injury risk (Development ×0.7, Balanced ×1, Push ×1.6). A new tutorial step after the first win gives the founder a one-minute injury that benching heals on the spot, with a note on rest, physios and risky playstyles.
  * **Debug panel** (`670f3b5`): tap the version number in Options seven times. It shows the live income split, cash by source this run and all time (a new `incomeTotal` ledger), multipliers, top operations, team odds and counters, and can copy them as JSON.
  * **Interface review** (`1309de3`): the market pin no longer covers the rating, easter-egg listings read as Legend signings, scout focus explains itself and lives in one place, and the look editor has labelled Undo / Save controls.

---

#### `de295ff` (merged in `a1d98af`) — Targeted Scouting, Coach Bench Automation, Gear Tiers & UX Refinements
*Date: Sun Sep 20 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * **Scout Specialization Missing**: Scouts could only roll prospects randomly across all games and rarities, with no ability to direct recruitment efforts or hunt for desirable player traits.
  * **Toast Readability & Season Celebrations**: End-of-season popups combine match victories, promotions, and MVP awards into a large message, but toast notifications disappeared after a fixed time regardless of how much text they contained.
  * **Audio Ambiguity for Bad Drama Outcomes**: When click drops resolved with negative outcomes, they played generic sounds, lacking clear auditory feedback that something went wrong.
  * **Bench Roster Automation Gap**: Coach automation was limited to signing players into open active lineup slots, ignoring bench depth even when an org had surplus cash.
  * **Gear Budget Ceiling Restrictions**: Coaches could only be allocated up to 5% of cash reserves for equipment purchases, severely restricting late-game gear development.
  * **Look Editor Unsaved Changes**: In the player appearance editor, clicking the close button immediately committed visual changes with no explicit save button or confirmation prompt to discard mistakes.
  * **Market Potential Visibility**: Transfer market prospects displayed current stat bars but hid their potential ceilings until after purchase or opening the details modal.
  * **Sponsor Temporary vs Permanent Ambiguity**: Players found it difficult to distinguish between temporary contract income/perks and permanent rewards (trophies and completed goal cash payouts).
  * **Buried Poaching Transfer Offers**: Rival player poaching offers could appear behind other popups or get queued behind low-priority world events.
  * **Easter Egg Player Scarcity**: Legendary easter egg pros were unavailable for acquisition through standard gameplay.
  * **Name Variety**: Player names and gamer tags lacked scene-specific flavor and variety across all 12 esports disciplines.

* **What Changed**:
  * **Targeted Scouting Legacy Nodes**: Added `scout_bias` (15 LP) and `scout_trait` (25 LP) legacy buyables. Unlocking them enables Scout Focus controls in the Transfer Market tab ~~and Front Office~~ *(Changed 1 time since: Front Office shows the current focus with a link to the Market in 1309de3)*, allowing scouts to bias recruiting towards a specified game (5x weight), rarity tier (3.5x weight), and double the chance (2x weight) of rolling a chosen player trait.
  * **Content-Proportional Toast Durations**: Scaled toast lifetimes proportionally with message character length (`2800ms + length * 45ms`, clamped between 3.5s and 12s), and doubled display duration for ~~Season Champion~~ popups *(Changed 1 time since: renamed league champions in 424938d)*.
  * **Bad Drama Audio Cue**: Added synthesized `dramaBad` sound effect (descending gritty minor dissonance and sub thump) triggered when click drops yield negative outcomes.
  * **Coach Bench Automation**: Added `coach_bench` (18 LP) legacy purchase and Front Office toggle allowing coach automation to sign affordable players directly into bench slots when active lineups are full.
  * **Gear Gear Gear Budget Tiers**: Added three tiers of `gear_gear_gear` legacy upgrades (15, 50, 200 LP) unlocking front-office equipment spending caps of 10%, 25%, and 50% of cash.
  * **Player Look Editor Confirmation**: ~~Added a green checkmark button to save and close the look editor, and a confirmation banner when clicking the close cross~~ *(Changed 1 time since: labelled "Undo changes" / "Save look" footer and a "Keep the new look?" prompt in 1309de3)*, preventing accidental edits.
  * **Market Potential Line Markers**: Added white vertical potential markers on all player stat bars in the transfer market, making prospect ceilings immediately clear prior to purchase.
  * **Sponsor Benefit Differentiation**: ~~Added visual `Temp` badges to contract income boosts and category perks, paired with `Perm` badges~~ *(Changed 1 time since: two-zone cards, "While signed" and "Goal bonus · paid once", in 5160ae5)* and trophy callouts for goal payouts and trophy cabinet rewards.
  * **Prioritized Poaching Offers**: Elevated `ChoicePanel` z-index to 1000 and updated `offerChoice` to unshift transfer poaching offers to the front of the pending queue so they cannot be hidden or delayed.
  * **Market ~~Easter Egg~~ Legend Prospects** *(Changed 1 time since: shown as a "Legend" banner in 1309de3)*: Introduced a 1% chance for easter egg players to appear as rare legacy prospects on the transfer market, purchasable for 5 Legacy points.
  * **Expanded Name Pool & Scene Parodies**: Added hundreds of diverse first and last names, and added a ~~10%~~ chance *(Changed 1 time since: 16%, from 490 parody handles, in 2c355cb)* for players in all 12 games to roll parody handles inspired by famous pro esports figures.
  * **Automated Tests**: Added comprehensive test suite in `tests/new-features.test.ts` covering scouting biases, parody tags, coach bench logic, legacy market signings, toast duration math, and transfer queue prioritization.

---

#### `8696dc0` & `d9ece80` — Player-centric README rewrite and authentic in-game screenshot
*Date: Sun Sep 20 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * The previous README was heavily skewed toward developer instructions, contained excessive em dashes and rigid syntax, and featured an artificial AI-generated mockup that did not reflect actual gameplay.
* **What Changed**:
  * Replaced `docs/screenshot.png` with an authentic, high-resolution 1600x920 screenshot rendered directly from the running Svelte 5 engine with live teams, custom kit, operations, and match progression.
  * Rewrote `README.md` to focus on player engagement, core loops (Active Roster vs Commercial Empire), and web play, while completely eliminating em dashes and corporate phrasing.
  * Streamlined local setup instructions to a compact section at the end of the document.
  * Conducted a historical review across `PATCH_NOTES.md` adding strikethroughs and bracketed evolution counts (`*(Changed N times since: ...)*`) to superseded systems and numbers.
  * Updated AI contributor instructions in `AGENTS.md` and `PATCH_NOTES.md` to mandate maintaining evolution strikethroughs on prior entries.

---

#### `ba96581` — Add comprehensive patch notes documentation and AI agent workflow
*Date: Sun Sep 20 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * The project had 38 commits across foundational milestones, UX passes, game systems, and post-launch tuning, but lacked a centralized, narrative patch notes file detailing the problems and solutions of each major push.
  * AI agents working on the codebase lacked a defined protocol for documenting their changes during PR submission and promoting merged entries upon subsequent work.
* **What Changed**:
  * Created `PATCH_NOTES.md` documenting every major milestone, visual pass, system expansion, and balance update from scaffolding (`2b710ef`) through recent economy tuning (`de1e324`).
  * Established instructions for AI agents and human contributors to maintain the pending/committed changelog lifecycle.
  * Updated `AGENTS.md` to mandate patch notes logging for all AI agent workflows in the repository.

#### `de1e324` — Progression Balance, Merch Upgrades & Activity Polish
*Date: Sun Sep 20 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * **Merchandise Revenue Drop-off**: Merchandise sales lagged significantly behind operations in the late game, stalling an entire progression track.
  * **Clicker Intermittency Friction**: The hype meter decayed too rapidly during natural clicking pauses, frustrating active players.
  * **Notification Overload**: End-of-season events triggered four separate toast popups (titles, bonuses, MVPs, promotions) in rapid succession.
  * **Automation Inefficiency**: The legacy operations manager purchased low-tier operations instead of prioritizing higher-tier, higher-yield buildings within budget.
* **What Changed**:
  * **Merchandise Quality Upgrades**: Added purchasable product line quality tiers (`merchQualityCost`, `upgradeMerchQuality`) and visual store previews (`MerchPreview.svelte`), ~~enabling merch scaling to keep pace with late-game operations~~ *(Changed 1 time since: merch now tops out below operations when left alone and a few times above them when kept on trend, with finishes worth 0.15 a level)*.
  * **Hype Meter Decay Buffer**: Extended hype grace thresholds and reduced passive decay during short pauses, requiring ~80 clicks to reach maximum crowd mode.
  * **Consolidated Season End Toast**: Merged title championships, prize payouts, MVP player honours, and tier promotions into a single summary notification ~~with static display duration~~ *(Changed 1 time since: toast durations now scale proportionally with content length and double for season champions)*.
  * **Smarter Operations Automation**: Legacy operations manager now inspects the available cash budget and prioritizes purchasing the most expensive affordable operation.
  * **Player Retention Bidding**: Dynamically scaled player retention counter-offers based on available cash reserves and career achievements.
  * **Dynamic Ticker Retirement**: Automatically filters out beginner and small-audience ticker headlines once an org reaches arena-scale fanbases.

---

#### `b95ca3b` — Economy Pass & Ledger Documentation
*Date: Sun Sep 20 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * Complex economic interactions across active, semi-active, and passive playstyles needed documented telemetry to guide balance decisions.
* **What Changed**:
  * Authored `docs/economy.md` detailing exact income ledger statistics from 5-hour test runs across all three archetypes.
  * Documented sponsor yield shifts, hype meter impact, and benchmarks for merchandise and drop scaling.

---

#### `ef74a7b` — Sponsor Goal Re-evaluation (25% Earned Share) & Run Comparison Tooling
*Date: Sun Sep 20 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * Instant auto-completed sponsor goals were delivering outsized cash windfalls relative to long-term deals.
* **What Changed**:
  * Rebalanced sponsor completion bonuses to pay strictly **25% of what the org generated while the contract was active**, capped by the contract headline value.
  * Created `scripts/compare.ts` to diff two simulation runs side-by-side across income sources, pacing checkpoints, and half-hour intervals.
  * Added automated regression tests verifying the hype curve, click chain decay, and staff soft caps.

---

#### `28d2f1a` — Click Chains, Squad Drag-and-Drop & Staff Soft Caps
*Date: Sat Sep 19 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * Manual clicking became completely irrelevant after the first 10 minutes.
  * Stacking hundreds of coaches warped match win probabilities to 100%.
  * Lineup management was cumbersome on both mobile and desktop screens.
* **What Changed**:
  * **Interactive Click Chain**: Reduced hype fill requirement from 200 to ~~50 clicks~~ *(Changed 1 time since: rebalanced to ~80 clicks with decay buffer in de1e324)*. Reaching full hype initiates an interactive chain of popping bubbles granting escalating multipliers up to 20x for 200 seconds.
  * **Staff Soft Cap**: Applied diminishing-return soft caps to Coaches and Analysts after 10 hires, preventing runaway rating spikes *(Changed 1 time since: AI Trainers and Team Managers get their own curves in bfb4d86)*.
  * **Role-Based Coaching**: Coaches now automatically promote bench substitutes when the stat benefit exceeds the chemistry penalty.
  * **Squad Drag-and-Drop**: Implemented full drag-and-drop ~~and tap-to-swap lineup interactions~~ *(Changed 1 time since: pointer drag that works on touch, onto role-labelled desks and a bench, in 8727c16)* with live win-rate preview tooltips.

---

#### `1e42876` — Invisible Hype Drops, Market Pinning & Sponsor Nerf
*Date: Sat Sep 19 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * **Invisible Drops**: Hype Drops were spawning behind top navigational UI bars, consuming clicks without the player seeing them.
  * **Sponsor Inflation**: Sponsor goals paid flat percentages of current instantaneous income, allowing late-game players to instantly complete contracts for massive exploit payouts.
  * Players kept losing desirable scouting prospects on market timer refreshes.
* **What Changed**:
  * **Drop Canvas Clamping**: Clamped Hype Drop coordinates strictly within visible viewports and prevented drops from overlapping.
  * **Prospect Pinning**: Allowed players to pin favorite transfer prospects through market refreshes (1 per game/role).
  * **Sponsor Payout Formula**: Changed goal payouts to scale based on ~~20% of actual income earned during the contract duration~~ *(Changed 1 time since: settled at 25% of earned revenue in ef74a7b)*.
  * **Drama Survival**: Allowed orgs to "ride out" drama events over 5 minutes with temporary debuffs instead of forcing a cash buyout.

---

### Phase 5: Post-Launch Community Feedback & Hotfixes

#### `9f86bf9` — Save Auto-Migration: Founder Healing
*Date: Sat Sep 19 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * A rare edge-case bug permitted users to sell or delete their founding player, leaving existing save files in an unrecoverable broken state.
* **What Changed**:
  * Implemented an automated save migration step on boot that detects missing founders and generates a fully restored replacement founder player.

---

#### `c0174cd` & `871f292` / `8966017` — Comprehensive User Feedback Overhaul & Easter Eggs
*Date: Sat Sep 19 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * Player feedback revealed several friction points:
    * Flu recovery required clunky benching.
    * Front-office auto-buyers spent money while players were manually shopping on Market or Gear tabs.
    * Lineup fillers ignored user toggles and forced unwanted players into slots.
    * Auto-sponsorship signing ignored minimum tier settings.
    * Sponsor payouts were invisible.
    * Prestige threshold ($10^{15}$) felt impossibly far away.
* **What Changed**:
  * **Flu Recovery**: Changed to a pure elapsed-time recovery timer with clear UI countdowns, eliminating forced manual benching ~~with no benefit from resting~~ *(Changed 1 time since: benched players recover twice as fast in 8727c16)*.
  * **Contextual Auto-Pause**: Front-office automation now automatically pauses when the player is browsing the Market, Gear, or Lineup screens.
  * **Auto-Buy Logic Fixes**: Fixed auto-sponsor tier adherence and respected empty roster slot toggles ~~which only bought players for the active lineup~~ *(Changed 1 time since: coaches can now be instructed to buy bench players via coach_bench legacy purchase)*.
  * **Payout Transparency**: Added explicit dollar calculations to active sponsor cards and contracts ~~without visual distinction between contract perks and permanent rewards~~ *(Changed 2 times since: Temporary vs Permanent tags in de295ff, two-zone "While signed" / "Goal bonus" cards in 5160ae5)*.
  * **Prestige Acceleration**: Lowered `LEGACY_DIVISOR` from $10^{15}$ to $10^{12}$ ($1\text{ Trillion}$), making the first prestige attainable within a reasonable 2–3 hour session.
  * **Easter Eggs**: Added special custom traits and buffs for community members and iconic pros (*Faker*, *TheOnlyCook*, *Varantha*, etc.) ~~which were not available in the market~~ *(Changed 1 time since: legendary easter egg players now have a rare 1% chance to appear as legacy prospects on the transfer market)*.

---

#### `406ef59` — Audio Default Configuration
*Date: Sat Sep 19 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * Unexpected music on initial website visit caused jarring experiences for new players.
* **What Changed**:
  * Set procedural background music to disabled by default.

---

#### `3311c76` to `5f2d8aa` — v0.1.0 Documentation, Licensing & Assets
*Date: Sat Sep 19 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * Official public release required open-source licensing, formal changelog, and visual marketing assets.
* **What Changed**:
  * Added `LICENSE`, `CHANGELOG.md` (v0.1.0), social media preview cards, and README gameplay screenshots.

---

### Phase 4: Onboarding, First Experience & v0.1.0 Foundation

#### `2f5e522` — Team/Market Guides, Guaranteed First Win & Dynamic Ticker
*Date: Sat Sep 19 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * Early players frequently lost their first match and churned; the transfer market lacked clear explanations for player stat synergies.
* **What Changed**:
  * Scripted the first match an org plays to be a guaranteed win.
  * Added paged guidance dialogs explaining team management and scouting stats.
  * Composed *"Night Shift"*, an original procedural electronic music track with volume toggles.
  * Added 9 secret achievements with subtle clues.

---

#### `16e999b` — Founding Screen, Custom Founder & Calm Start
*Date: Sat Sep 19 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * New games skipped straight to random rosters without establishing an org identity, and early gameplay suffered from disruptive random events.
* **What Changed**:
  * **Founding Screen**: Added an interactive wizard to choose org name, badge shape, logo mark, and team colors.
  * **Custom Founder Player**: Players customize the appearance, name, and handle of their founding star, who never takes a prize cut, cannot be sold, and stays loyal across all prestige runs.
  * **Calm Start Buffer**: Disabled Hype Drops, world events, illnesses, and rival spawns for the first 8 minutes of play.
  * **Progressive Tab Milestones**: Gated tabs until milestones are reached (Teams $\rightarrow$ Market $\rightarrow$ House $\rightarrow$ Studio $\rightarrow$ Sponsors $\rightarrow$ Staff $\rightarrow$ Legacy).

---

#### `0f07b43` & `e13a4a8` — Guided Start: Tutorial, First-Player Draft & Quest Board
*Date: Sat Sep 19 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * New players were dropped into an overwhelming interface with all systems unlocked at once, leading to confusion and decision paralysis.
* **What Changed**:
  * **Step-by-Step Tutorial**: 5-step non-modal guided banner walking through initial clicking, player signing, match viewing, and opening operations.
  * **First-Player Draft**: ~~Offered 3 tiered Smash Siblings draft prospects ($10, $25, $50)~~ *(Changed 1 time since: replaced in 16e999b with 1 customizable permanent founding player)*.
  * **Quest Board**: Added 22 milestone quests offering choices between cash injections or ~~permanent account-wide perks, with a "Later" deferral option~~ *(Changed 1 time since: a linear quest line with no "Later", and perks that last for the current run only, in fc807ca)*.

---

### Phase 3: Metagame Depth, Progression & Narrative Systems

#### `4fb61ec` — Dynasty Ranks, Competitive Moods & Decor Visuals
*Date: Sat Sep 19 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * Completing the Legacy Tree left end-game players with no sink for Legacy Points. Smurfing in lower leagues was too lucrative compared to taking on challenging promotions.
* **What Changed**:
  * **Dynasty Ranks**: Added 4 infinite-sink prestige tracks (Income, Prize Money, Fan Growth, Team Rating/XP) with escalating costs.
  * **Match Stakes & Morale**: Lopsided matches with $>75\%$ win probability suffer up to a $50\%$ penalty to prizes and fan gains to discourage smurfing. Added team morale states (*Fired Up*, *Frustrated*, *Bored*).
  * **Decor Artwork**: Designed custom SVG models for all 16 Gaming House decor pieces.
  * **Notification Settings**: Added categorical notification mute controls in Options and top headers.

---

#### `19c4967` — Dynamic Rival Org, Career Milestones & Trophy Shelf
*Date: Fri Sep 18 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * Matches felt like disconnected dice rolls against generic names. There was no ongoing narrative arc or historic record of past achievements.
* **What Changed**:
  * **Dynamic Rival Org**: Generates a persistent rival esports team that matches up every ~8 games. Rivalry matches yield double fans and distinct headlines; beating them by 10 wins causes a stronger rival to step forward.
  * **Season Recaps & Milestones**: Preserves historic season records, championship MVPs, and individual player career milestones (50–1,000 wins, tenure).
  * **Physical Trophy Cabinet**: Real-time display shelf rendering won trophies categorized by league tier (bronze, silver, gold, crystal), persisting through prestige resets.

---

#### `47616d1` — HQ Agenda System
*Date: Fri Sep 18 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * Players opening the HQ tab were overwhelmed with raw numbers and lacked guidance on high-priority goals or imminent roster crises.
* **What Changed**:
  * Built a 3-part directive engine at the top of HQ:
    1. **Next Goal**: Calculated ETA to the next unlockable team, sponsor tier, or merch line.
    2. **Urgent Team Concern**: Alerts for empty slots, fatigued starters, unassigned roles, impending retirements, or relegation threats.
    3. **Immediate Opportunity**: Identifies optimal moments to sell the org, high-value transfer targets, or free sponsor slots.

---

#### `781d31c` — Roster Impact Previews
*Date: Fri Sep 18 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * Signing a player or changing a lineup gave zero feedback on whether the team would actually improve, hiding role mismatches and chemistry penalties.
* **What Changed**:
  * Added sandbox simulation functions (`previewSigning` and `previewAssign`) evaluating non-destructive copies of the team.
  * Market cards and roster slots now display live win-probability deltas ($\Delta\%$), rating shifts, and chemistry penalties before committing transactions.

---

#### `086194e` — Season Plans, Player Ageing & Transfer Market Resale
*Date: Fri Sep 18 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * Players could instantly flip newly signed prospects for effortless profit. Star players remained immortal and never retired, freezing roster turnover.
* **What Changed**:
  * **Season Tactical Plans**: Teams select between *Development* ($+80\%$ XP, bench training, early sub rotations), *Balanced*, or *Push for Promotion* ($+12\%$ rating, increased fatigue).
  * **Ageing & Retirement**: Players age every 2 seasons. Aging past 29 degrades stats; aging past 31 triggers retirement notices giving the org one final season to extract value or sell. Founders are exempt from aging.
  * **Player Resale Valuation**: Transfer sell prices now strictly factor in levels gained under the org's management, making immediate market flipping unprofitable.

---

#### `226cf8b` — Transformative Prestige, Front-Office Automation & Casual Sim
*Date: Fri Sep 18 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * Headless simulations revealed that the second prestige run was no faster than the first. A single legacy point provided only $+1\%$ income, offering no exciting strategic shift or head start.
* **What Changed**:
  * **Founding Charters**: First reset awards 4 Founding Points to pick a permanent archetype (*The Operator*, *The Scout*, *The Promoter*, or *The Coach*).
  * **Run Mandates**: Each prestige run presents 3 random trade-off contracts (e.g., *Esports Academy*: $2\times$ XP at the cost of higher contract fees).
  * **Front-Office Automation**: Added configurable background automated routines to buy upgrades, auto-fill rosters, auto-equip gear, and auto-sign qualifying sponsors within spend caps ~~running unconditionally in the background~~ *(Changed 2 times since: automatically paused while browsing store/market tabs in c0174cd, and operations manager upgraded to target priciest affordable building in de1e324)*.
  * **Casual Simulation Model**: Added an offline simulation profile to test game balance for players who check in only a few times daily.

---

### Phase 2: Visual & UX Architecture Polish

#### `47f34b4` — Bespoke SVG Art for 160 Equipment Items
*Date: Fri Sep 18 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * Gear slots displayed identical placeholder icons across all 16 tiers; beginner hardware looked identical to advanced gear.
* **What Changed**:
  * Implemented `src/ui/gearArt.ts` generating bespoke vector artwork for all 160 unique equipment items (10 slots $\times$ 16 tiers) using procedural SVG definitions.
  * Added rarity-linked glows, subtle stage spotlights, and live "Next Tier" visual upgrade previews on item cards.

---

#### `402dd94` — Non-Blocking Batched Achievement Popups
*Date: Fri Sep 18 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * Cascading achievement cards and sound chimes blocked store interactions when multiple unlocks occurred simultaneously.
* **What Changed**:
  * Relocated achievement popups to the top-left corner and made backgrounds click-through with `pointer-events: none`.
  * Batched rapid-fire unlocks occurring within $450\text{ms}$ into a single consolidated popup with a single chime.

---

#### `3a511e1` — Interface Tone, Custom Team Kits & Semantic Tokens
*Date: Fri Sep 18 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * The entire interface was locked to a rigid navy-violet tint, and all teams wore identical cyan/magenta uniforms regardless of player branding.
* **What Changed**:
  * **Interface Tone Engine**: Introduced a runtime CSS variable architecture (`--accent`, `color-mix`) letting players customize the UI's primary tone with live previews.
  * **Team Kit Customizer**: Added primary and secondary jersey/crest color selectors in the Studio and on individual team cards.
  * **Semantic Theme System**: Migrated arbitrary hex codes to structured design tokens (`src/data/palette.ts`).

---

#### `a7e9806` — Visual Hierarchy, Item Rarity & Click-Through Bug
*Date: Fri Sep 18 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * All items in the store and inventory looked visually identical. Toast notifications anchored bottom-right sat directly over primary buy buttons and intercepted user clicks.
* **What Changed**:
  * **Unified Rarity Ladder**: Standardized gear, players, and upgrades across 6 clear color tiers (Common, Uncommon, Rare, Epic, Legendary, Mythic).
  * **Character Detail**: Added ink outlines, radial face shading, idle breathing animation loops, and rendered the *Lucky Charm* directly on jersey sprites.
  * **Toast Anchoring**: ~~Shifted notifications away from interactive purchase columns to prevent click hijacking~~ *(Changed 2 times since: relocated to top-left with pointer-events pass-through in 402dd94, season end batching in de1e324)*.

---

### Phase 1: Foundational Milestones (M0 – M7)

#### `9692ec7` — M7: Sound Synthesis, Greedy Sim & Pacing Pass
*Date: Fri Sep 18 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * Headless simulation runs revealed extreme hyperinflation ($10^{12}$ cash reached within an hour) caused by unbounded compounding exponents in fame and match prize scaling. The game also lacked audio feedback.
* **What Changed**:
  * **Procedural WebAudio Synthesis**: Implemented 100% asset-free synthesized sound effects for clicks, purchases, drops, level-ups, and prestige.
  * **Economy Invariant Fixes**: ~~Capped `fameExp` at 0.12~~ *(Changed 1 time since: the cap left eight Fame upgrades and both legacy fame nodes doing nothing; only the first four Fame upgrades now raise the exponent, up to a 0.13 cap that equals their total, and the rest multiply the fame bonus)*, stopped match prizes from multiplying operations-linked income, and retuned league progression scaling.
  * **Automated Headless Sim**: Added `scripts/sim.ts` to execute automated runs, sampling milestones and mathematical invariants over 5-hour simulated gameplay sessions.

---

#### `fd332e0` — Hotfix: Tooltip Listener Types
*Date: Fri Sep 18 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * Widening tooltips to SVG nodes caused `svelte-check` in CI to fail due to generic `Event` listener type mismatches.
* **What Changed**:
  * Fixed typing by casting listener attachments cleanly through an `HTMLElement` wrapper.

---

#### `8df2e25` — M6: Prestige ("Sell the Org"), Legacy Tree & Challenges
*Date: Thu Sep 17 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * The game reached a natural ceiling with no long-term meta-reset mechanic, replayability incentives, or persistent progression between runs.
* **What Changed**:
  * **Sell the Org**: Prestige reset mechanic awarding Legacy Points based on all-time earnings via a cube-root formula ~~with a fixed 1e15 (1 Quadrillion) unlock threshold and linear single-point progression~~ *(Changed 3 times since: Founding Charters in 226cf8b, Dynasty Ranks in 4fb61ec, and divisor reduced to 1e12 in c0174cd)*.
  * **37-Node Legacy Tree**: Branching persistent upgrades boosting income, starting capital, scouting range, drop frequency, offline gains, and unlocking automation.
  * **Franchise Players & Legends**: Players could designate franchise players to carry across runs or retire veterans into permanent Legend Coaches.
  * **Hall of Fame & Challenges**: Challenge modes (*Solo Queue*, *Potato League*, *Skeleton Crew*, *No Hype*, *Tabloid Darling*) offering permanent game-wide perks.

---

#### `c2e08cf` — M5: Design Studio, Merch & Parody Sponsors
*Date: Thu Sep 17 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * Orgs had no creative identity or visual branding, and monetization lacked merchandise sales and commercial brand sponsorships.
* **What Changed**:
  * **Pixel Art Studio**: Integrated full 16/32/64 canvas editor featuring pencil, fill bucket, line, rectangle, ellipse, color picker, symmetry modes, undo/redo, and automated design appeal scoring.
  * **Merchandise Store**: 10 fan-gated product lines where sales volume dynamically reacts to design appeal, trend matching, brand freshness decay, and price elasticity curves ~~with static product quality~~ *(Changed 4 times since: merchandise quality upgrade tiers and visual store preview in de1e324, gear-style finish art in 2c355cb, products that physically change every few finish levels in c61a3fb, and in the trend rebalance: designers now extend freshness and trends instead of multiplying sales, Mania ×4 for 60–120s, trend-briefed designs)*.
  * **Sponsorship Board**: 36 parody sponsors across 12 categories with signing bonuses, passive yields, category perks, bonus goals, and volatile crypto sponsors ~~paying flat percentage instant bonuses~~ *(Changed 5 times since: contract payout preview in c0174cd, duration-based calculation in 1e42876, 25% earnings cap in ef74a7b, front-office auto-sign budget limits in de1e324, and ten tiers with scaling perks and no hidden 200% income cap in 5160ae5)*.

---

#### `10abc53` — M4: Hype Drops, Tournaments & World Events
*Date: Thu Sep 17 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * Active players lacked surprise mini-events, high-stakes tournament bracket experiences, and unpredictable macro events.
* **What Changed**:
  * **Hype Drops**: Introduced clickable drops (*LAN Frenzy*, *Prize Pool*, *Clutch Mode*, *Viral Clips*, *Operation Rushes*, and *Hype Train* chains) ~~spawning immediately from game start and unconstrained on viewport~~ *(Changed 2 times since: calm start 8-minute early delay in 16e999b, screen boundary clamping and anti-overlap in 1e42876)*.
  * **~~Tournament~~ Invitational Brackets** *(Changed 1 time since: renamed Invitationals, winnable more often than not, with shown odds and a cash stake, in 424938d)*: Added 3-round bracket tournaments offering trophy rewards, high cash prizes, and fan influxes.
  * **Drama Mechanics**: Optional high-risk rage-bait upgrades turning benign drops into volatile *Drama Drops* requiring costly PR cleanups.
  * **Dynamic World Events**: 23 global world events with interactive decision prompts.
  * **Trophy Spend**: Allowed trophies to permanently level up base operations (+1% per trophy) and buy unique trophy upgrades.

---

#### `271cd95` — M3: Staff, Player Health & Gaming House
*Date: Thu Sep 17 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * Players suffered no friction or wear-and-tear; orgs had no back-office infrastructure or physical progression space.
* **What Changed**:
  * **Staff Department**: Added 9 hireable staff roles with diminishing-return bonus curves ($\text{strength} \times \text{hires}^{0.8}$) ~~scaling indefinitely without soft caps~~ *(Changed 1 time since: soft-capped at 10 hires with role coaching in 28d2f1a)*.
  * **Player Well-being**: Added match-triggered illness, physical injury, and psychological burnout conditions, ~~requiring manual benching for flu recovery~~ *(Changed 3 times since: calm start early immunity in 16e999b, converted to pure elapsed-time recovery without benching in c0174cd, benching doubles recovery speed and plans carry an injury risk in 8727c16)*.
  * **Interactive Gaming House**: Developed a visual SVG environment upgrading from a cramped *Garage* up to an *Orbital HQ*, complete with real-time desk stations and 16 functional decor items.

---

#### `94ba79a` — M2: Esports Simulation, Matches, Gear & Avatars
*Date: Thu Sep 17 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * Passive income alone lacked an esports theme. The game needed actual simulated matches, procedural player generation, competitive ladders, and player customization.
* **What Changed**:
  * **Parody Games**: Added 12 esports titles across genres with genre stat weights and dynamic popularity walks.
  * **Procedural Players**: Implemented dynamic player generation with 6 core attributes, potential ratings, 32 gameplay traits, morale, energy, and progression levels.
  * **Match Engine & Leagues**: Team rating calculated as a genre-weighted geometric mean of player stats + gear. Added ~~10-match seasons~~ *(Changed 1 time since: expanded to 16-match seasons in 9692ec7 / M7)*, simulated round scoring, promotions, relegations, and ~~prize money scaling with an operations-linked multiplier~~ *(Changed 2 times since: decoupled from operations share in 9692ec7, and lopsided match smurfing penalty applied in 4fb61ec)*.
  * **Gear System**: 10 distinct gear slots across 15 equipment tiers ~~using generic placeholder glyphs~~ *(Changed 2 times since: standardized rarity frames in a7e9806, bespoke 160-item SVG vector artwork and 16 tiers in 47f34b4)*.
  * **Transfer Market**: Scouting system with timed market refreshes, contract buyouts, and roster/bench management.
  * **SVG Avatars**: Layered procedural avatar generator with 14 customizable appearance options.

---

#### `9c72b93` — M1: Core Idle Loop & Operations Engine
*Date: Wed Sep 16 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * An idle game requires a deterministic tick cycle, passive cash generation, multi-tier purchase progression, click mechanics, and robust save persistence.
* **What Changed**:
  * **Tick Simulation**: Implemented a fixed-step engine accumulator handling delta times and offline earnings.
  * **Operations**: Created 16 tiered revenue generators with bulk buying (`1x`, `10x`, `100x`, `Max`), ~~ordered Café → Bootcamp, Arena → Broadcast, Platform → Studio~~ *(Changed 1 time since: reordered by real-world cost to Bootcamp → Café, Broadcast → Arena, Game Studio → Platform)*.
  * **Upgrades**: Generated over 280 procedural and curated upgrades.
  * **Hype Engine**: Interactive logo clicker with clicking power calculations, hype meter accumulation, and *"Crowd Goes Wild"* burst multipliers ~~requiring 200 uninterrupted clicks with rapid 4%/s drain~~ *(Changed 2 times since: redesigned click chain in 28d2f1a, decay buffer and ~80 click tuning in de1e324)*.
  * **Persistence**: Implemented `lz-string` compressed LocalStorage saves, auto-migration hooks, schema versioning, and export/import.
  * **UI Foundation**: ~~3-column neon dashboard layout with fixed navy/cyan styling~~ *(Changed 2 times since: standardized 6-rarity theme in a7e9806, custom team kits and semantic interface tone in 3a511e1)*.
  * **News Ticker**: ~~Static initial headline pool~~ *(Changed 5 times since: 40 state-aware lines in 9692ec7, 110+ jokes in 4fb61ec, unlocked infrastructure lines in 2f5e522, satire flavor in c0174cd, rookie headline retirement in de1e324)*.

---

#### `2b710ef` — M0: Project Scaffolding
*Date: Wed Sep 16 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * Project initialization and architectural foundation setup.
* **What Changed**:
  * Initialized Svelte 5 + TypeScript + Vite project with test suite and baseline architecture.
