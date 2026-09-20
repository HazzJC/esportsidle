# Esports Idle — Patch Notes

> ### 🤖 Instructions for AI Agents & Contributors
> Every AI agent working on this repository MUST maintain and update this file:
> 1. **When submitting work for a PR / branch / review**:
>    - Add a new entry under the top **Pending Changes** section marked with `[Status: Pending]`.
>    - Clearly explain **The Issue / Motivation** (what problem or feature request is being addressed).
>    - Clearly explain **What Changed** (the exact code, balance, UI, tests, or mechanical changes made).
> 2. **When beginning or finishing work on top of merged/committed work**:
>    - Check if there are any existing `[Status: Pending]` entries that have now been committed to the branch/main history.
>    - Update their status to `[Status: Committed]` with their commit hash and date.
>    - Add your new work as `[Status: Pending]`.

---

## Pending Changes

### Add comprehensive patch notes documentation and AI agent workflow
*Status: Pending*

* **The Issue / Motivation**:
  * The project had 38 commits across foundational milestones, UX passes, game systems, and post-launch tuning, but lacked a centralized, narrative patch notes file detailing the problems and solutions of each major push.
  * AI agents working on the codebase lacked a defined protocol for documenting their changes during PR submission and promoting merged entries upon subsequent work.
* **What Changed**:
  * Created `PATCH_NOTES.md` documenting every major milestone, visual pass, system expansion, and balance update from scaffolding (`2b710ef`) through recent economy tuning (`de1e324`).
  * Established instructions for AI agents and human contributors to maintain the pending/committed changelog lifecycle.
  * Updated `AGENTS.md` to mandate patch notes logging for all AI agent workflows in the repository.

---

## Historical Release & Commit Notes

### Phase 6: Economy Overhaul, Balance & Feedback Loop Tuning

#### `de1e324` — Progression Balance, Merch Upgrades & Activity Polish
*Date: Sun Sep 20 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * **Merchandise Revenue Drop-off**: Merchandise sales lagged significantly behind operations in the late game, stalling an entire progression track.
  * **Clicker Intermittency Friction**: The hype meter decayed too rapidly during natural clicking pauses, frustrating active players.
  * **Notification Overload**: End-of-season events triggered four separate toast popups (titles, bonuses, MVPs, promotions) in rapid succession.
  * **Automation Inefficiency**: The legacy operations manager purchased low-tier operations instead of prioritizing higher-tier, higher-yield buildings within budget.
* **What Changed**:
  * **Merchandise Quality Upgrades**: Added purchasable product line quality tiers (`merchQualityCost`, `upgradeMerchQuality`) and visual store previews (`MerchPreview.svelte`), enabling merch scaling to keep pace with late-game operations.
  * **Hype Meter Decay Buffer**: Extended hype grace thresholds and reduced passive decay during short pauses, requiring ~80 clicks to reach maximum crowd mode.
  * **Consolidated Season End Toast**: Merged title championships, prize payouts, MVP player honours, and tier promotions into a single summary notification.
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
  * **Interactive Click Chain**: Reduced hype fill requirement from 200 to ~50 clicks. Reaching full hype initiates an interactive chain of popping bubbles granting escalating multipliers up to 20x for 200 seconds.
  * **Staff Soft Cap**: Applied diminishing-return soft caps to Coaches and Analysts after 10 hires, preventing runaway rating spikes.
  * **Role-Based Coaching**: Coaches now automatically promote bench substitutes when the stat benefit exceeds the chemistry penalty.
  * **Squad Drag-and-Drop**: Implemented full drag-and-drop and tap-to-swap lineup interactions with live win-rate preview tooltips.

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
  * **Sponsor Payout Formula**: Changed goal payouts to scale based on actual income earned during the contract duration.
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
  * **Flu Recovery**: Changed to a pure elapsed-time recovery timer with clear UI countdowns, eliminating forced manual benching.
  * **Contextual Auto-Pause**: Front-office automation now automatically pauses when the player is browsing the Market, Gear, or Lineup screens.
  * **Auto-Buy Logic Fixes**: Fixed auto-sponsor tier adherence and respected empty roster slot toggles.
  * **Payout Transparency**: Added explicit dollar calculations to active sponsor cards and contracts.
  * **Prestige Acceleration**: Lowered `LEGACY_DIVISOR` from $10^{15}$ to $10^{12}$ ($1\text{ Trillion}$), making the first prestige attainable within a reasonable 2–3 hour session.
  * **Easter Eggs**: Added special custom traits and buffs for community members and iconic pros (*Faker*, *TheOnlyCook*, *Varantha*, etc.).

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
  * **Quest Board**: Added 22 milestone quests offering choices between cash injections or permanent account-wide perks, with a "Later" deferral option.

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
  * **Front-Office Automation**: Added configurable background automated routines to buy upgrades, auto-fill rosters, auto-equip gear, and auto-sign qualifying sponsors within spend caps.
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
  * **Toast Anchoring**: Shifted notifications away from interactive purchase columns to prevent click hijacking.

---

### Phase 1: Foundational Milestones (M0 – M7)

#### `9692ec7` — M7: Sound Synthesis, Greedy Sim & Pacing Pass
*Date: Fri Sep 18 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * Headless simulation runs revealed extreme hyperinflation ($10^{12}$ cash reached within an hour) caused by unbounded compounding exponents in fame and match prize scaling. The game also lacked audio feedback.
* **What Changed**:
  * **Procedural WebAudio Synthesis**: Implemented 100% asset-free synthesized sound effects for clicks, purchases, drops, level-ups, and prestige.
  * **Economy Invariant Fixes**: Capped `fameExp`, stopped match prizes from multiplying operations-linked income, and retuned league progression scaling.
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
  * **Sell the Org**: Prestige reset mechanic awarding Legacy Points based on all-time earnings via a cube-root formula.
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
  * **Merchandise Store**: 10 fan-gated product lines where sales volume dynamically reacts to design appeal, trend matching, brand freshness decay, and price elasticity curves.
  * **Sponsorship Board**: 36 parody sponsors across 12 categories with signing bonuses, passive yields, category perks, bonus goals, and volatile crypto sponsors.

---

#### `10abc53` — M4: Hype Drops, Tournaments & World Events
*Date: Thu Sep 17 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * Active players lacked surprise mini-events, high-stakes tournament bracket experiences, and unpredictable macro events.
* **What Changed**:
  * **Hype Drops**: Introduced clickable drops (*LAN Frenzy*, *Prize Pool*, *Clutch Mode*, *Viral Clips*, *Operation Rushes*, and *Hype Train* chains).
  * **Tournament Brackets**: Added 3-round bracket tournaments offering trophy rewards, high cash prizes, and fan influxes.
  * **Drama Mechanics**: Optional high-risk rage-bait upgrades turning benign drops into volatile *Drama Drops* requiring costly PR cleanups.
  * **Dynamic World Events**: 23 global world events with interactive decision prompts.
  * **Trophy Spend**: Allowed trophies to permanently level up base operations (+1% per trophy) and buy unique trophy upgrades.

---

#### `271cd95` — M3: Staff, Player Health & Gaming House
*Date: Thu Sep 17 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * Players suffered no friction or wear-and-tear; orgs had no back-office infrastructure or physical progression space.
* **What Changed**:
  * **Staff Department**: Added 9 hireable staff roles with diminishing-return bonus curves ($\text{strength} \times \text{hires}^{0.8}$).
  * **Player Well-being**: Added match-triggered illness, physical injury, and psychological burnout conditions, managed by staff and bench rotations.
  * **Interactive Gaming House**: Developed a visual SVG environment upgrading from a cramped *Garage* up to an *Orbital HQ*, complete with real-time desk stations and 16 functional decor items.

---

#### `94ba79a` — M2: Esports Simulation, Matches, Gear & Avatars
*Date: Thu Sep 17 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * Passive income alone lacked an esports theme. The game needed actual simulated matches, procedural player generation, competitive ladders, and player customization.
* **What Changed**:
  * **Parody Games**: Added 12 esports titles across genres with genre stat weights and dynamic popularity walks.
  * **Procedural Players**: Implemented dynamic player generation with 6 core attributes, potential ratings, 32 gameplay traits, morale, energy, and progression levels.
  * **Match Engine & Leagues**: Team rating calculated as a genre-weighted geometric mean of player stats + gear. Added 10-match seasons, simulated round scoring, promotions, relegations, and prize money scaling.
  * **Gear System**: 10 distinct gear slots across 15 equipment tiers.
  * **Transfer Market**: Scouting system with timed market refreshes, contract buyouts, and roster/bench management.
  * **SVG Avatars**: Layered procedural avatar generator with 14 customizable appearance options.

---

#### `9c72b93` — M1: Core Idle Loop & Operations Engine
*Date: Wed Sep 16 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * An idle game requires a deterministic tick cycle, passive cash generation, multi-tier purchase progression, click mechanics, and robust save persistence.
* **What Changed**:
  * **Tick Simulation**: Implemented a fixed-step engine accumulator handling delta times and offline earnings.
  * **Operations**: Created 16 tiered revenue generators with bulk buying (`1x`, `10x`, `100x`, `Max`).
  * **Upgrades**: Generated over 280 procedural and curated upgrades.
  * **Hype Engine**: Interactive logo clicker with clicking power calculations, hype meter accumulation, and *"Crowd Goes Wild"* burst multipliers.
  * **Persistence**: Implemented `lz-string` compressed LocalStorage saves, auto-migration hooks, schema versioning, and export/import.
  * **UI Foundation**: 3-column neon dashboard layout with floating numbers and particle effects.

---

#### `2b710ef` — M0: Project Scaffolding
*Date: Wed Sep 16 2026* | *Status: Committed*

* **The Issue / Motivation**:
  * Project initialization and architectural foundation setup.
* **What Changed**:
  * Initialized Svelte 5 + TypeScript + Vite project with test suite and baseline architecture.
