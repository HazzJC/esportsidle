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

### Smoother introductions to new mechanics [Status: Pending]

* **The Issue / Motivation**: The owner asked how to make each new mechanic's introduction smoother, then asked for all of the suggestions.
  * **New tabs could arrive in a burst.** In a simulated first run the Market, Staff, House and Studio opened within four minutes of each other (28.3 to 32.3 min) and seven quests were claimed in five. The strict quest line holds on one quest while the requirements for the next few are met quietly; when it moves, they all release.
  * **Each tab was announced once, then dumped on the player.** A toast that vanishes after nine seconds, a "New" badge and a line in the quest. Then the whole tab at once: Market and Teams had paged guides (Teams five pages long), and Staff, House, Studio, Sponsors, Trophies and Legacy had one muted sentence.
  * **Some mechanics turned up with no introduction.** The first Drama Drop is a gamble nobody explained. The first decision card falls back to an option when its timer runs out, without saying which. The first Invitational arrives mid-play.
* **What Changed**:
  * **Paced tab openings** (`engine/sections.ts` `sectionPace`, `SECTION_BREATHER`, `questSection`; `engine/quests.ts` `fillQuests`, `questLineWait`):
    * In the first run, a quest that would open a new tab waits until every tab a quest has opened has been visited, and until 120 seconds have passed since the last one opened.
    * It only applies while that quest's own tab is still closed, so orgs that skipped the tutorial, and every later run, are unaffected.
    * While it waits, the console says why, with the tab named: "Take a look at the new Market tab first", or "The Staff tab opens next. Until then, get to know the Market tab", with a meter and a countdown. Sections now carry a `name` for these messages.
    * In the simulated first run the tabs now open two minutes apart: Market 28.3, Staff 30.3, House 32.3, Studio 34.3 min.
  * **A "New tab" card on the quest console** (`Quests.svelte`): when a quest opens a tab, a lit card names it, says what it is for and has an "Open …" button. It stays until the tab has been visited, unlike the toast.
  * **Tab intro cards** (new `data/intros.ts` `TAB_INTROS`, new `TabIntro.svelte`, mounted once in `CenterPanel.svelte`):
    * The first visit to Teams, Market, Staff, House, Studio, Sponsors, Trophies or Legacy shows a short card: what the tab is for, a gold "Start here" step (the live quest's own words when it is about this tab) with "Show me", and two or three terms.
    * Opening a card makes its first step's target pulse for a few seconds, using the same highlights the quests use.
    * "Got it" puts the card away, and a "?" button beside the tab strip brings it back. The button sits outside the scrolling strip so it is always in view.
    * The Teams and Market paged guides no longer open by themselves; they open from the card's "The full guide" button (`Guide.svelte`). No cards show during the tutorial.
  * **First-encounter notes** (`data/intros.ts` `EVENT_INTROS`, new `FirstTimeNote.svelte`):
    * **The first Drama Drop** brings a floating note near the top of the screen. It explains that clicking one is a gamble, leaving one costs nothing, and HQ shows the drama level and how to calm it. The note stays until it is read, even if the drop fades.
    * **The first decision card** carries a note on the two-minute timer and what happens when it runs out.
    * **The first Invitational invite** explains the three rounds, preparing, and what happens if the invite is closed.
  * **"If you wait" tag** (`ChoicePanel.svelte`): every decision card now marks the option its timer picks.
  * **House shop** (`House.svelte`): decor for houses beyond the next one folds into its label row with a count of pieces. The next house still shows what it holds, so the shop stays about what can be bought.
  * **Saves**: no version bump. Intro and first-encounter state lives in `GameState.guides` (`intro:<tab>`, `first:<event>`). A new org is flagged `intros` from the start. A save from before is flagged on load, with every tab it has visited marked as read and the Drama, decision and Invitational notes marked read if it has met them, so a long-running org is not shown everything again.
  * **Simulator** (`scripts/sim/run-sim.ts`): the simulated player looks over every open tab when it makes decisions (so the line can move), and the record notes each tab as it opens (`tab market` milestones), to see how a run spaces new systems out. Nothing passes or fails on it.
  * **Tests**:
    * New `tests/intros.test.ts`: every later tab has a card, icons exist, a new org starts with none read, and the migration marks only what an older org has met.
    * `tests/firstrun.test.ts`: the visit hold, the breather with its meter, and that a quest whose tab is already open is never held.
    * `npm test`: 479 passing.

### Quest console and tracker, text clarity, rival crests and hands on the keys [Status: Committed]
*Commit*: `5de97c3` (Oct 4 2026)

* **The Issue / Motivation**: The owner asked for the quest board to fill its space, for bigger text where it was hard to read (team roles, org names on the fixture), for more interesting logos for the rival teams based on the real orgs they parody, and for the players' hands, which were hanging by their sides. A second request asked for the roles to be bigger still ("MAIN" was hard to read) and for better visuals on the quest tracker.
  * The quest line was 23 identical dots: it showed neither where the org was nor how far was left. The quest screen was flat grey with the quest's colour only on its icon, a yes-or-no quest showed an empty 24-cell meter that read as no progress, and a single reward stretched into a tall, mostly empty key.
  * The quest console was capped at 760px and centred, so on wide screens it sat in a band of empty space while everything else on HQ ran full width. Past four perks the shelf showed bare emblems even with room for the words.
  * Role plates were 10.5px, fixture org names 14px, and quest descriptions 12.5px.
  * 21 of the 60 rival orgs had a drawn parody crest, and the team fixture didn't use any of them: every opponent there got a generated initials badge ("GOT" for Guardians of the Lane).
  * The avatar always drew arms hanging at its sides. Behind the starter cardboard desk they were hidden; behind the thinner tables of every later desk they showed below the desktop, beside the station's own arms reaching for the keyboard and mouse.
  * The room sign added in the visual pass reused the `.sign` class of the empty seat's "Sign" chip in `Teams.svelte`, so its positioning leaked onto that chip.
* **What Changed**:
  * **Quest console** (`Quests.svelte`): fills the column. The quest screen and the reward keys share it 1.6 to 1, so the keys widen with the screen. Perk plaques keep their words whatever the count; they fold into bare emblems only on a narrow console (540px or less). Larger text: quest title 17px, description 14px, reward 14.5px and its detail 12px, perk 14px, stamped labels 10.5px.
  * **Role plates** (`Teams.svelte`): ~~12px~~ 26px tall with 14px lettering, lit in the game's colour (lighter lettering with a glow on a tinted plate, a coloured edge). On a narrow desk (six to a room, or a phone) the face drops to 12.5px, and a long role (Main Support, Flex Support) takes two lines inside the plate rather than being cut short. The plate height is one variable (`--plate`) that the floor line and the floor props read, so they still meet the desks.
  * **Quest tracker** (`Quests.svelte`): the quest line is a segmented gauge, one segment per quest in its colour (the four colour bands show which stretch of the line the org is in): lit when done, the live segment wider, outlined, glowing and filling with its progress, the rest dim. The live quest's screen takes its colour, with a stripe down the left, a glow from the corner and a larger emblem, and a "Quest 12 of 23" line over the title; it turns gold when ready. Counted quests keep their meter, in the quest's colour; a yes-or-no quest shows a lamp reading In progress or Done: claim your reward. Two rewards have an engraved "or" between them; a single reward is a prize card with its art large and centred (a row again when the console is narrow).
  * **Text sizes** (`Teams.svelte`, `MatchBanner.svelte`): role plates as above, fixture org names 16px (14px on phones, where long names wrap onto up to three lines rather than disappearing behind the match bar) with 46px crests, the grudge tag 10.5px. A step up for the genre line, team numbers, mood, crowd, player rating, out chips, bench label and cards, recent results and the team switcher. Player tags stay 13px so long tags still fit five-player desks.
  * **Rival crests** (`orgArt.ts`): every rival now has a drawn crest. New ones parody the real orgs: a pirate hat riding a wave (Rogue Waves, after Rogue), a neon megaphone (Loud & Clear, LOUD), a star in a C with some maths (Complexity Theory), a legionary helmet marked MAX (Dignitas Maximus), iG in a laurel wreath (Invictus Gamers), a crowned die that always rolls six (Royal Neverquit, after RNG), a spinning top that isn't sure (Top Esports Maybe), a station with a gamepad module (Spacestation Gamers), an O2 tank (Oxygen Tanks), a cartoon bomb (Boom Boom Esports), BIG in tiny letters under a magnifier (BIG Small), a Brussels sprout sprouting (Sprout Sprouts), an orange peak with a predator's eyes and teeth (Apeks Predators), a pulled plug (Endpoint Down), a handshake on a shield (Alliance of Allies), a galaxy question mark (Nigma Enigma), a crab with fangs (Beastly Coast), three gold claw marks (Talon Claws), a blocked list (Blacklist Blocklist), an X in shades on fire (Xtreme Gamers), a sweating droplet (Moist Esports), and Fnatic's F in OpTic's ring (Fnopic). The made-up names draw their joke: a snail with a loading spinner for a shell (Lag Legends), two leaning towers, a crowned paddle, a camel and a crosshair, a ranger hat with a respawn arrow, a target on a hero's forehead, a natural 20, a salt shaker with a pickaxe, a white flag reading GG, five swords in a pentagon, a thrown controller, a warning sign over a red and green diff (Diff Detected), a sleeping star, a football with horns and a chilli in a cape and mask (Hot Sauce Heroes). Names with no drawing still get the generated monogram.
  * **Fixture** (`MatchBanner.svelte`): the opponent wears their parody crest (`orgLogoSvg`), the same one the Invitationals and stories show.
  * **Hands** (`Avatar.svelte`, `Station.svelte`): the avatar takes an `arms` option; desk stations turn it off, so the only arms are the ones reaching for the keys and mouse.
  * **Fix**: the room sign's class is now `.room-sign`.
  * **Tests**: a new test checks every rival org has its own crest. `npm test`: 473 passing.

### HQ and team room visual pass, game signs and screens [Status: Committed]
*Commit*: `b1ebdd0` (Oct 4 2026)

* **The Issue / Motivation**: The owner asked for a visual pass over the HQ and the team rooms added in 0.2.0, then for more game-specific items and branding in each room, at a higher quality. Screenshots at every house level showed:
  * In a five-player room (most games) the desks fill the width, so the two wall props sat behind the role plates (the sniper rifle under ENTRY, the A-site sign under IGL) and the two floor props were hidden behind the name plates. The poros, the bomb and the loot llama were almost never seen.
  * The Gaming House wall's blinds read as a second garage door with a grey disc behind them, and the Esports Campus wall had a "big screen" showing an image-placeholder mountain, grey bookmark-shaped banners and a crowd hidden under the floor.
  * Every floor was a flat gradient with seams, so the six houses only differed above desk height.
  * The HQ banner named the org's house but was painted with its best operation scene; late in a run that is Global Leagues, which reads as a near-black grid.
  * A few props were hard to read: the Smash stage poster (looked like a boat), the dark Valorunt agent, the tiny Apex vegetable squad, and the Quantum Pong ball floating mid-air.
  * Nothing inside a room said which game it was apart from the props: every monitor showed the same blank gradient, and the game's logo and name appeared only in the card header. Many props were flat shapes (a plain grid for the goal, a box for the slurp barrel).
* **What Changed**:
  * **Room layout** (`Teams.svelte`): the desks start lower, leaving a strip of wall (50px, 44px on narrow rooms) above the role plates. The wall props hang in it and the neon strip runs between them. The floor props stand where the first row's floor meets the wall, just outside the desks, or at the room's edges when the desks fill it, so the desks pass in front of them. Their height is worked out from the room's width (`.floor` is now a `room` container; the team card's container is named `team` and its queries say so). The wall is less darkened and takes a wash of the team colour from the neon.
  * **Floors** (`roomArt.ts`, new `roomFloorBackground`): a drawn 256x64 tile per house, with a skirting board where it meets the wall: concrete slabs with an oil stain, staggered floorboards, a diamond carpet in the org's colour, polished stone tiles with a sheen, riveted stage panels with an LED line, and diamond deck plating. `ROOM_FLOORS` swaps its seam colour for the skirting colour.
  * **Walls** (`roomArt.ts`):
    * Gaming House redrawn: a window on the suburbs at night between curtains in the org's colour, hexagon acoustic panels, a neon "GG" sign, a shelf with a console and a figure, wainscot panels under a dado rail.
    * Esports Campus redrawn: tiers of fans rising into the dark with phone lights, a lighting truss with beams through the haze, banners with trophies, a live big screen with two crests and the score, and advertising boards along the barrier.
    * Team HQ: a dusk sky, paler distant towers, aerial lights, the org's colour etched along the glass, a ceiling with downlights.
    * Garage gains a workbench under the pegboard and the driveway under the roller door; the Apartment a radiator, a pendant lamp and a plant; Orbital HQ control panels between the portholes and a planet that shows above the floor.
  * **Game signs** (`roomArt.ts`, new `roomSignSvg`; placed in `Teams.svelte`): every room hangs its game's sign at the top of the wall, over the neon, between the wall props: the game's logo and name, lettered and framed to suit it. A slanted comic panel with stars (Smash Siblings), a broadcast score bug with boost chevrons (Rocket Soccar), a stencilled plate between hazard stripes (Counter-Stroke), a gold hextech plaque in serif (League of Lanes), a stitched red swallowtail banner (Apex Legumes), a cut-corner neon plate (Valorunt), nailed planks with painted letters (Fortnight), a bevelled riveted steel plate (StarCrafty), a white panel with an orange flash (Overclock), a tavern board on chains (Hearthstoned), an LED dot-matrix (Quantum Pong) and a hologram with scanlines (Galactic Siege VR). The width follows the name, and narrow rooms shrink it.
  * **Game screens** (`gameArt.ts`, new `gameScreenSvg`; drawn by `Station.svelte`, so the House shows them too): every monitor shows the player's own game instead of a blank gradient. Two fighters on a floating stage, a car boosting at the ball, a sandy bombsite through the crosshair, the three lanes with minions meeting mid, the ring closing on a hillside, a planted spike, a ramp built in a hurry with the storm coming, a base and a swarm from above, the payload in a sunny street, the card board with a fanned hand, a ball in two places, and a cockpit reticle. The old CRT, flat screens and holographic monitors all show it; it dims while the player is out.
  * **Props**: the Smash stage poster is a floating platform with two fighters under a starry sky; the Valorunt agent has a lit backdrop, a visor in the game colour and fire in both hands; the Apex poster shows a carrot, a pea pod and a broccoli with faces; the Quantum Pong ball sits on a pedestal with two faded copies of itself. Eleven more are redrawn with depth and detail: the item crate in three-quarter view with metal corners, the goal with posts, crossbar and a net with depth, the ring map with terrain, a river, the storm outside the ring and a drop marker, the build wall with a build bar, plank tones, a brace and nails, the victory banner on a rod with a jewelled crown, the slurp barrel with bands and a splash, the gas canister with hazard stripes and a glowing window, the payload with a domed core and tracks, the rocket hammer standing on its head, a framed paddle with its plaque, and the VR headset on a stand with glowing lenses and a controller.
  * **HQ banner** (`HQOverview.svelte`): painted with the org's house (its wall and a strip of its floor) instead of the best operation scene, so it matches the team rooms and changes when the org moves. Stacked on phones it is darkened evenly so the name stays readable.
  * **Tests**: the team room test also checks every house's floor, and that every game has a sign and a screen with nothing unsafe in them (and that a sign escapes its name). `npm test`: 472 passing.

### README refresh and the v0.2.0 GitHub release [Status: Committed]
*Commit*: `ce4694f` (Oct 3 2026)

* **The Issue / Motivation**: The README still described 0.1.0: nothing about the guided first run, Staff tools, team rooms, match fixtures or the House, and its Legacy Tree count (37 nodes) was stale. The hero screenshot cut off the tab bar. 0.2.0 also had no GitHub release.
* **What Changed**:
  * `docs/screenshot.png` is a fresh capture of the Teams page (squad at their desks, victory card, full tab bar) from a throwaway headless Chrome profile, so no real save was involved.
  * `README.md` gains a "A Guided First Run" section and bullets for team rooms and fixtures, lineup and bench management, Staff tools, the House, the starter sponsorship choice and invitationals. The Legacy Tree is ~~37~~ 45 nodes, matching `LEGACY_NODES`.
  * The `v0.2.0` tag and GitHub release are created from `main` after this merges, with notes drawn from `CHANGELOG.md`.
  * No game, economy or save changes.

### Fix the sound debounce that blocked the 0.2.0 deployment [Status: Committed]
*Commit*: `7f8a7bd` (Oct 3 2026)

* **The Issue / Motivation**: PR #10 merged, but its GitHub Pages workflow failed in `tests/sound.test.ts`: the first quest jingle started zero audio nodes. `playSound` treated a sound with no playback history as though it had played at time zero, suppressing its first use during the debounce window. Fast CI workers exposed this while slower local runs passed.
* **What Changed**:
  * `src/ui/sound.ts` checks the debounce gap only when that sound has a recorded previous play. First sounds play immediately, including at clock time zero; existing repeat gaps are preserved.
  * `tests/sound.test.ts` uses a controlled clock, fresh audio modules and restored globals for each test. Regression coverage checks the quest jingle at zero, repeats before and exactly at 400 ms, silent calls leaving playback available, and the first-play and gap boundaries of click, buy, win and upgrade sounds.
  * No economy or save changes. Redeploy through the existing Build & Deploy workflow after verification.
* **Validation**: The controlled-clock regressions reproduce the original failure before the fix. After the fix, all 472 unit tests pass, `npm run check` reports zero errors and warnings, and `npm run build` succeeds.

### 0.2.0: a guided first run, staff tools, team rooms and match fixtures
*Status: Committed* | `90b1586` (Oct 3 2026)

* **The Issue / Motivation**: The owner played the first run and asked for it to guide the player more and to look and feel better. A new player hit the crowd going wild while saving for the first Streamer, before the quest that explains it; the tutorial and quests did not show where to click (nobody found that clicking a player opens their gear); tabs and buttons appeared before they were explained (the Transfer market button showed before the market opened, Buy/Sell/10/100/Max and Buy all were there from the first second); quests did not line up with the systems they teach (the sponsor quest could arrive long after Sponsors opened, Staff waited for a third team); the first sponsorship was a random offer with no explanation; and the team cards were a plain stage with no sense of the game being played. Smaller asks: swap the hype and upgrade quests, collapse run perks into icons and drop the CRT look, move "Next steps" to a staff role, fold the HQ income splits away, more house upgrades with a clear moment when the next house opens, players with their hands on the keys and their composure item on the desk, a misaligned Stats card.
* **What Changed**:
  * **First win** (`data/tutorial.ts`, `engine/tutorial.ts`): the tutorial's first win pays a one-off **$85 bonus** (`FIRST_WIN_BONUS`, `tutorial.firstWinPaid`) with a toast. Clicking only what each step needs, the Streamer now comes at about 54 clicks with the hype meter around 64% (it was about 69 clicks and 83%); a player who keeps clicking hard still sets the crowd off.
  * **The quest line runs the first run** (`data/quests.ts`, `engine/quests.ts`, `engine/sections.ts`):
    * New order: Grinder squad, Gear up, **Hype streak, then Read the patch notes** (swapped), **Scout the market** (new: sign a player from the market; perk: one more bench seat), Catch the drop, Hire help, Have a plan, Branch out, Make it home, Design a shirt, Moving up, Take the money, Deliver for the sponsor, Merch drop, Homegrown, League champions, Invitational winners, Grudge match, Business is business, Business empire, Semi-pro, The big exit. Descriptions now say what each system does.
    * In the first run the line is **strict**: a quest whose requirement is not met yet holds the line (`strictQuestLine`), and the console shows what it waits for with a meter ("Up next: Take the money. Reach 1,000 fans (613 so far)", `questLineWait`, `QuestDef.waiting`). The rival quest waits on chance, so it is passed over and comes back (`skipWhileLocked`). After the first sale, quests not yet available are passed over as before.
    * **Quests open their tabs** (`SectionDef.quest`): the market (with Scout the market, at $500 in the bank), Staff (Hire help; its requirement is now ~~found a third team~~ two players signed, `STAFF_UNLOCK_SIGNINGS`), the House (Make it home, second team), the Studio (Design a shirt, 500 fans) and Sponsors (Take the money, 1,000 fans) open the moment their quest is offered ~~(back to back, when a held line released several met requirements at once)~~ *(Changed 1 time since: a tab-opening quest now waits until the last new tab has been visited and two minutes have passed since it opened, in the smoother mechanic introductions)*. After a sale tabs open on their requirement; open tabs stay open.
    * Catch the drop is offered once the calm start is over, brings the next drop forward to 12 seconds, and while it is live a missed drop is followed by another within 30 seconds (`DROP_QUEST_*`).
    * New emblem for Scout the market (binoculars over a player card) in `ui/questArt.ts`.
  * **Guidance and highlights** (`ui/hints.ts`, `Coach.svelte`, `global.css`):
    * The highlight is a ring in the interface tone with a ripple running out of it (`tut-pulse`), or an outline glow for drawings (`tut-soft`), replacing the faint glow. The tutorial card has a **Show me** button on every step that goes to the target and gives it an extra beat. New arrows: "Click your logo" above the logo, "Your first win is on its way" over the match.
    * The live quest's target pulses until it is done, when the next step is one click away: the tab it needs, then the thing to press (the cheapest upgrade, the Coach, the cheapest decor, a Sign button on the market, the Jersey button, the sponsor offers, the season plans, Found team, the Grinder row). Every quest has a **Show me** on the console (`QuestDef.hint`, `game.showQuestHint`).
    * **Gear up**: an arrow over the first player ("Click NAME to open their kit") with an outline glow; the kit opens on the Gear tab, the cheapest upgrade pulses, and a line explains what gear does and what to buy.
  * **Staff tools** (`data/staff.ts` `qol`, `engine/staff.ts`): the first hire of a role brings a tool for the run, announced with a toast and shown on the role's row (locked until then): **Coach** the game plan, **Chef** buy and hire 10 at a time, **Scout** Buy all upgrades, **Analyst** Max, **Talent Agent** selling operations, **Social Media Manager** 100 at a time, **Merch Designer** one design on every line. Until then the store and Staff tab buy one at a time; once Staff is open the tools still to come show as locked buttons that say who brings them. The engine's buyers (automation, simulator) are not limited.
  * **Coach's game plan**: "Next steps" leaves HQ and becomes the Coach's game plan at the top of the Staff page, shown once a Coach is hired (a teaser says how to get it before then).
  * **Sponsors** (`data/sponsors.ts`, `engine/sponsors.ts`, `Sponsors.svelte`): an org starts with ~~two~~ **one sponsor slot** (`BASE_SPONSOR_SLOTS`; the duplicate constant in `engine/sponsors.ts` is gone); Take the money's perk adds the second. The **first deal ever** is a choice of three snack brands (`STARTER_DEALS`), each a tier 1 contract with its own pitch, goal and perk: Crunchy Chips (win 10 matches, +morale, 15 min), Doritoes (gain 2,000 fans, +fans, 20 min) and Nacho Average Snacks (catch 3 Hype Drops, +player XP and the biggest income boost, 30 min). Brands can carry their own perk (`BrandDef.perk`, `brandPerk`): Doritoes now gives fans and Nacho Average XP instead of the snack category's morale. Signing one sends the other two away. A **How a deal works** panel explains what happens while a deal runs, when it ends and when it is ended early, and ending a deal early now asks with the consequence spelled out.
  * **Teams tab**:
    * A **fixture banner** on every team: your crest vs the next opponent's (each club's crest is drawn from its name), the match bar between them and the time to kick-off, a Grudge match tag for the rival. When a match ends a result card slides over it: **Victory** with the prize counting up and a shower of coins (and the first-win bonus on the first one), or a quiet **Defeat** with the consolation money. Teams draw their next opponent when a match ends (`TeamState.nextOpponent`), so the billed club is the one played; new teams start with a fixed first opponent.
    * **Team rooms** (`ui/roomArt.ts`): the walls and floor follow the org's house: a garage with a roller door and pegboard, a flat with a window on the street, a gaming house with acoustic foam, an HQ with a glass wall onto the skyline, a campus arena with a big screen and a crowd, an orbital station with portholes. Each game dresses its room with four parody props, two on the wall and two on the floor ~~among the desks~~ *(Changed 1 time since: wall props hang in a strip of wall above the role plates and floor props stand where the first row's floor meets the wall, so a five-player room no longer hides them; each house also gets a drawn floor, in the HQ and team room visual pass)*: a fight poster, a floating stage, the smash orb and an item crate (Smash Siblings); a goal, a car poster, the giant ball and a boost pad (Rocket Soccar); a green sniper rifle on a rack, the A-site sign, crates and the bomb (Counter-Stroke); the lane map, the nexus crystal and two poros (League of Lanes); the vegetable squad, the ring, a supply crate and a carrot hero (Apex Legumes); an agent, a neon ability sign, the spike and smokes (Valorunt); a wooden build wall, the victory crown, a loot llama and a slurp barrel (Fortnight); the three races, an APM readout, minerals and gas (StarCrafty); a hero poster, a health pack, the payload and a hammer (Overclock); a card, a tavern sign, card packs and a mug on a barrel (Hearthstoned); a scoreboard, a paddle, a cabinet and a ball in three places at once (Quantum Pong); a hologram planet, a starship, a VR headset and a helmet (Galactic Siege VR).
    * **At the desk** (`Station.svelte`): players sit a little higher, with their arms on the desk, the left hand on the keyboard tapping at their own tempo and the right on the mouse, flicking now and then (still when they are out). Their **lucky charm** (the gear item that boosts Composure) stands on the desk in its tier's drawing, glowing from legendary.
    * The **Transfer market** button and the empty seats' "Sign" link wait for the market to open.
  * **House** (`data/decor.ts`, `decorArt.ts`, `House.svelte`, new `MoveIn.svelte`): **nine new decor pieces** with drawings: Ring Light, Snack Drawer (garage), Soundproofing, VOD Monitor Wall (apartment), Home Gym (gaming house), Pro Kitchen (HQ), Simulation Pods, Fan Lounge (campus) and Hydroponic Garden (orbital); six of them also appear in the house scene. The shop lists each house's pieces cheapest first. **Moving house** now opens a card (the new place's wall, what changes, how many new pieces fit, what the next house needs) once per house per run (`checkHouseMove`, `roomSeen`, a `house` event; old saves start from the house they are in). The House tab's next-house bar is a card with the amount earned and what moving brings, and the HQ banner shows how close the next house is.
  * **HQ**: the quest console's screen is a flat display with no scanlines, glare or glowing text. **Run perks** fold into a row of emblems past four ~~(the perk and its quest on hover)~~ *(Changed 1 time since: only on a narrow console; wider ones keep every perk's words, in the quest console and text clarity pass)*. The banner's income **splits fold away** until the income figure or the bar is clicked (remembered per browser).
  * **Stats**: the Income multipliers card takes the full row and its values wrap between parts, so it no longer spills out of a half-width column.
  * **Save**: no version bump. New optional fields (`tutorial.firstWinPaid`, `roomSeen`, `TeamState.nextOpponent`, `SponsorOffer.starter`) default safely; existing teams get a first opponent through `mergeDefaults`.
  * **Tests**: new `tests/firstrun.test.ts` (first-win bonus, strict and later-run quest lines, the drop quest, starter deals and brand perks, staff tools, house moves, fixtures, room props). Updated: the onboarding tests for quest-gated tabs and the market, sponsor slot tests, the tour gap list (scouting is taught now). `npm test`: 468 passing.
* **For reviewers**: `FIRST_WIN_BONUS`, the starter deals' goals and lengths, the drop-quest timings and which role brings which tool are starting points for hand-playing. The simulated active player (`npm run sim -- --persona=active --hours=3`) walks the line with no stall (it never sells a player, so it sits on Business is business).

### Uncapped: fans, offline, drops, pricing, Elo, rerolls, and the old balance goals retired
*Status: Committed* | `07a5c32` (Oct 3 2026)

* **The Issue / Motivation**: A review of every hard cap and every income-linked price found things that read as arbitrary or hostile: fans stopped adding to fame at 3e9; drops paid the *lesser* of a share of the bank and some income, so spending first made a drop worthless, and an early drop could skip several tiers of buildings; income-linked prices read live income, so a hype streak or an injured starter could change what a purchase cost; promotion needed a 75% win rate while income started falling at a 75% win chance; a reroll cost climbed for the whole run; offline paid nothing after 24 hours; a crowd froze the hype meter; the operations manager bought one building per five seconds. The owner also asked for the old economic goals, tests and analysis to be retired: what is fun sometimes runs against what a model calls correct, and the game will be tuned by playing it.
* **What Changed**:
  * **Fans (`engine/economy.ts`, new `data/fanStages.ts`, new `FanCurve.svelte`)**:
    * ~~Fans past 3e9 add no more fame; above 100M fame grows at half rate~~ becomes a value per fan: every fan counts in full to 100M, then a new fan is worth `sqrt(100M / fans)` of a fan, down to a floor of 0.01 at 1T, and stays at the floor. Nothing stops adding and nothing adds zero (`fanValue`, `effectiveFans`, `FAN_VALUE_*`). Below 100M fans fame is unchanged.
    * Twelve named stages from Lobby Regulars through Internet Famous, Household Name and Cultural Icon to The Team Everyone Knows. The Stats tab gets a "How well known you are" card (stage, blurb, value per new fan, the 1× to 0.01× curve, a twelve-segment progress bar); the Fans tooltip and Stats' Fame row name the stage.
    * The last four Fame upgrades are ~~×1.1~~ ×1.3 / ×1.35 / ×1.4 / ×1.5 and each carries something fame has not done before: sponsor deals ×1.25 and the new **Fan Donations** Hype Drop (Cult Following), merch ×1.3 (Global Fandom), sponsor deals ×1.35 (Interplanetary Fandom), merch ×1.4 (Fandom Singularity).
    * Late Superfan upgrades are ~~0.025~~ 0.035 each (the full-cabinet ceiling rises from ×67 to about ×115). Snack upgrades cost a tenth of what they did (they still appear at the same earnings).
  * **Base income and pricing (`engine/baseIncome.ts`, save field `priceIncome`)**: every income-linked price reads operations income with no temporary buffs, smoothed over about five minutes. Gear's floor, a market reroll, a PR clean-up, a charity stream, Invitational preparation and retention bids use it. Gear's floor is measured against what the team's matches would earn at base income, with no popularity swing, win chance or injured starter in it. Tournament preparation: Scrims and Bootcamp cost a fixed number of seconds of base income (60 and 150), and only All in is also priced as half the bank. Retention bids keep their share of the bank but never fall below a few minutes of base income or rise above a fraction of the rival's offer.
  * **Hype Drops and lump sums (`engine/rewards.ts`, `engine/drops.ts`)**: what a drop can pay in minutes of base income follows time into the run (1 to 6 minutes in the first hour, 6 to 15, 15 to 30, 30 to 45, then ever more slowly). A roll leans good (a bell curve around 70% of the cap, never under 25%). A drop pays the ~~lesser~~ greater of its minutes and a small share of the bank (Prize Pool 2%, Leak 3%, Fan Donations 2.5%, Hype Train 5%), the bank part limited to twice the cap. While any tab is locked, a lump sum (drop, quest cash, investor) cannot exceed the price of one unit of the first building never owned. The good drop buffs, caught twice, add half the new duration. The Hype Train cap is the same scale (was ~~half the bank or six hours of income~~).
  * **Matches, Elo and engagement (`engine/elo.ts`, `engine/mood.ts`, `engine/teams.ts`, `data/leagues.ts`)**: ~~promotion at 12 wins in a season, relegation at 3 or fewer, and a challenge only at a 75% win chance~~ becomes team Elo: it moves by `K · (result − expected)` after every match, settles at the level the roster plays at and cannot be run up on weak sides; a team is promoted at season end near the next tier's Elo, relegated well under its own tier's, and can challenge up at the same Elo (`PROMOTE_MARGIN` 70, `RELEGATE_MARGIN` 230, `ELO_K` 24, about 301 Elo per tier). Titles stay at 15 wins. ~~Prize and fans fell by up to half above a 75% win chance~~ becomes a smooth engagement curve peaking at 55% and falling toward 0.3 on either side, applied to match prizes, fans, **XP** and **Invitational purses**, and lopsided matches wear players out up to 60% faster. Save v9 gives every team an Elo at its tier. The Teams card shows Elo and a tooltip with the line to promotion; the guide, agenda warning and tooltips are rewritten.
  * **Market rerolls (`engine/market.ts`)**: ~~60 seconds of income, +25% per reroll for the whole run~~ becomes 10 seconds of base income (at least $25), doubling with each reroll in a row and returning to the start after five quiet minutes; every reroll restarts the wait. The button shows when the price resets.
  * **Offline (`engine/game.ts`)**: ~~half rate to a hard 24 h cap, nothing after~~ becomes a fading rate that never stops (`W + 8 h · ln(1 + extra / 8 h)`): the same as before up to a day (15.4 counted hours at 24 h against 15), then slowly more (20.7 at 48 h, 30.4 at a week). Rate and window bonuses past 40% / 12 h count at a quarter / half instead of being clamped away (`softLimit`); a VPN sponsor is no longer wasted. Welcome Back and Stats say so in plain words.
  * **Smaller caps**: a bubble chain's ×20 volume stays but every bubble past it adds time (the chain no longer ends at 20); clicks during a crowd keep filling the meter, so the next crowd starts the moment this one ends; the first four click upgrades give flat cash per click and the other eight ~~1%~~ 0.5% of income each (a click is worth a flat sum early and a small share later); the merch finish keeps going past Hall of Fame edition as Masterwork levels (+5% sales each, double the price, no last one); the operations manager buys rounds of one more of each building until its budget is spent (up to 20 a pass, was ~~one unit of each per 5 seconds~~); `prizeSeconds` keeps growing past tier 10 on a log tail; Staff tooltips say how close a levelling-off role is to its limit and the copy no longer says "the bonus never stops growing" about roles that do level off; locked sponsor tiers show what they ask and which Legacy node opens them.
  * **The old goals, tests and analysis are retired**: `docs/economy.md`, `implementation-plan.md`, `design-roadmap.md`, `ascension-review.md` and `legacy-v2.md` moved to `docs/archive/` with a banner and a README telling agents not to use them. Deleted: `scripts/sim/targets.ts`, `report.ts`, `matrix.ts`, `paybacks.ts`, `price-curve.ts`, `scripts/lategame-*.ts`, `tests/slow/` and the veteran-save fixture, the `sim:quick`, `sim:report` and `test:slow` scripts and the slow test project. `npm run sim` is now the single-persona runner (`scripts/sim/cli.ts`) with nothing to pass or fail. A new, short `docs/economy.md` describes the rules as they are, with no targets; `AGENTS.md` says to ignore the archive and `output/sim/`, not to add pass/fail balance targets, and lists the principles to keep.
  * **Tests**: new `fans`, `elo` and `rewards` suites (the fan curve and stages, Elo settling and promotion, the drop scale and early guard, base income, rerolls, crowd and chain, buff extension, click upgrades, Masterwork, the v8 to v9 migration); updated `balance`, `teams`, `offline`, `events`, `stories`, `automation`, `effects`, `economy`, `fame`, `save`. The tests that asserted economic budgets (matches under a share, the Pedigree product cap, fame under 100 at a quadrillion fans, the late-game audit) are gone.
* **For reviewers**: nothing here was tuned against a simulation. The constants are starting points for hand-playing: `DROP_CAP_ANCHORS`, `DROP_ROLL_*`, the cash shares, `FAN_VALUE_*`, the engagement width and floor, `ELO_K` and the two margins, `REROLL_*`, `OFFLINE_FADE_HOURS`, the fame and superfan numbers. The fan curve lets fame keep growing after the ladder (about ×4.8 more between hours 3 and 8 of an active run, estimated), so a run will level off less than it did. Not done: a Legacy rank that raises the level-100 and gear-tier-15 ends (they stay finish lines, labelled MAX).

### Quest complete gets its own sound
*Status: Committed* | `07a5c32` (Oct 3 2026)

* **The Issue / Motivation**: Finishing a quest played `win`, the same two-pluck chime as every other gold toast (season titles, Invitational wins, rewards), so the most guided moment in the early game sounded like nothing in particular.
* **What Changed** (`src/ui/sound.ts`, `src/engine/bus.ts`, `src/engine/quests.ts`, `src/ui/game.svelte.ts`, new `tests/sound.test.ts`; no balance or save change):
  * New `quest` sound: a relay clack and a short sub knock (the quest console is a piece of hardware), a four-note major arpeggio of plucks climbing C5-E5-G5-C6, then a detuned major chord and a high FM bell holding the landing. Major and rising, where the achievement stab is minor and heavy and `promote` is a five-note run with a thump. Debounced to one per 400 ms so a burst of quests finishing together does not stack.
  * The toast event gains an optional `sound` hint (`'quest'`); `updateQuests` sets it on "Quest complete", and the game plays it instead of the tone's default chime. Claiming the reward still plays `win`.
  * ~~`tests/sound.test.ts` runs the sound against a stub audio context (layer count, debounce, silence at zero volume) and checks the quest toast asks for it.~~ *(Changed 1 time since: the clock is controlled and audio modules and globals are isolated per test; first-play and debounce-boundary regressions cover every debounced sound, alongside the original jingle and toast checks.)*

### HQ visual pass: the quest board and run perks become a skeuomorphic console
*Status: Committed* | `a583f01`, notes `6a2737e` (Oct 3 2026)

* **The Issue / Motivation**: The HQ quest board was two flat cards side by side (the live quest, and a five-medallion "quest line" card that took as much room as the quest), with the run's perks as a loose wrap of pills underneath. The owner asked for the quests and perks to be narrower and more interesting to look at, like a physical display.
* **What Changed** (UI and art: `src/ui/components/Quests.svelte`, new `src/ui/questArt.ts`, an `art` key on each quest in `src/data/quests.ts`; no balance or save change):
  * The board is one brushed-metal console with corner screws and stamped lettering, ~~at most 760px wide and centred, so it sits on wide screens like a piece of kit rather than stretching across the column~~ *(Changed 1 time since: it fills the column like the rest of HQ, in the quest console and text clarity pass)*.
  * The quest line is ~~a slot of 22 lamps, one per quest: gold when done, pulsing in the interface tone while live, dark still to come~~ *(Changed 1 time since: a segmented gauge in each quest's colour, the live segment wider and filling with progress, in the quest console and text clarity pass)*. Hovering a lamp names the quest, as the medallions did. A backlit LCD shows the count (08/22), and its tooltip carries the "follow it in order" hint that was a line of text.
  * The live quest is on ~~a recessed CRT with scanlines and a glare, glowing in the interface tone~~ *(Changed 1 time since: a flat, dark display with no scanlines, glare or glow, in 0.2.0)* a screen with a 24-cell segmented meter in place of the thin bar. A finished quest fills the meter gold and blinks READY. The screen's footer names the next quest.
  * Rewards are chunky hardware keys beside the screen (below it when the console is narrow). They sit unlit until the quest is done, then backlight gold and press down when clicked.
  * Every quest has its own drawn emblem in the store's upgrade-art style (`QuestDef.art`, drawn in `ui/questArt.ts`): the Ranked Grinder worker for Grinder squad, a pro headset with an upgrade arrow for Gear up, patch notes, the Hype Drop badge, a tactics clipboard, two pennants for Branch out, a podium for Moving up, the gaming house, a merch bag, the league cup, a medal for the Invitational, a sold player card, the bracket swords, a skyline for Business empire, a bullseye for the sponsor goal, a star for Semi-pro and a crown for the big exit. Twelve of them are new drawings and the other ten reuse store and operation art; cash, the palette and the level chevrons are three more new drawings for reward keys. Later quests glow in rarer colours (uncommon → legendary), like trophies further up a shelf.
  * The emblem replaces the flat line icon on the screen. The reward keys show drawn art too: notes and a coin for cash, the heart for fans, the cup for trophies, rank chevrons for levels, the crown for Legacy, a palette for cosmetics, a medal for titles, the tool's own picture for tools, the operation's worker for affinities, and the quest's own emblem for a perk, so the key matches the card the perk leaves.
  * Run perks are ~~an annunciator panel: a grille of backlit amber tiles, one per perk~~ *(Changed 2 times since: a trophy shelf, before review; past four perks the shelf folds into a row of emblems with the perk on hover, in 0.2.0; ~~always~~ only on a narrow console, in the quest console and text clarity pass)* a trophy shelf: a recessed tray of plaques, each with the quest's emblem lit in a niche in its colour, the perk in plain words and the quest that earned it underneath. The source quest is still on hover, and a perk claimed in the last few seconds flickers on. Phones show two plaques a row without the quest name.
  * `questPerkSources` also returns the quest id. New `tests/questArt.test.ts`: every quest and reward has a picture, every quest's emblem is its own, and the markup is well formed and inert.
  * The waiting state (~~"Next: X. It opens as your org grows."~~ *(Changed 1 time since: the next quest's emblem and exactly what the line waits for, with a meter, in 0.2.0)*) shows on the screen in standby.
  * Blinking and flicker stop under `prefers-reduced-motion`. At 1440px the board is about 275px tall with five perks and grows by one 50px row for every three more; at 390px it stacks screen, keys and perks.

### Phase B of the implementation plan: strict offline, and a run that levels off once the ladder is climbed
*Status: Committed* | `b9887c5` (Oct 3 2026)

* **The Issue / Motivation**:
  * Offline was 100% efficient for up to 72 hours with the Legacy offline nodes. Once a run levels off, being away would be the best way to play. The owner chose strict offline: at most 40%, a short full-rate window, ~~half rate to a hard 24 h cap~~ *(Changed 1 time since: a rate that fades but never stops, and bonuses past 40% / 12 h still count at a reduced share; see "Uncapped" below)*.
  * A run never levelled off. After the first Legacy point income still doubled every 5–12 minutes, purchases became nearly free (the next purchase of most kinds cost under a second of income), and staying beat selling 11 to 1. Fame, superfan, the late fame upgrades and the top operations' cheap tier doublings kept multiplying income without paying the ×1.15 price wall.
  * With the owner, two targets were redefined. Pace is measured 1 h and 3 h after the first Legacy point (not at hours 3 and 6, which is mid-climb for a 3–4 h first sale). The restart check now asks that run 2 feels measurably faster back to where run 1 was and reaches higher, rather than out-earning three more hours of run 1; most of run 2's edge is meant to come from Legacy v2's mechanics, not raw income.
* **What Changed**:
  * **Strict offline (WS4.2)**:
    * `economy.ts`: base rate 20%, ~~ceiling 40% (`MAX_OFFLINE_RATE`)~~ *(Changed 1 time since: 40% is where a bonus stops counting in full, `OFFLINE_RATE_FULL_VALUE`; past it a bonus counts at a quarter)*; a 6 h full-rate window, ~~at most 12 h~~ *(Changed 1 time since: 12 h is where bonus hours stop counting in full, `OFFLINE_WINDOW_FULL_VALUE_HOURS`; past it they count at half)* (`offlineWindowHours`, was `offlineCapHours`); ~~half rate after the window (`OFFLINE_TAPER`) to a hard 24 h cap (`OFFLINE_HARD_CAP_HOURS`)~~ *(Changed 1 time since: after the window the time counts as `FADE · ln(1 + extra / FADE)` with `FADE` 8 h, `OFFLINE_FADE_HOURS`)*. `offlineCredit()` in `game.ts` works out the credited time; the tab-throttling catch-up uses it too.
    * Legacy nodes: Autopilot +10% and 3 h of window (was ~~+15% and 12 h~~), Remote Management +10% (was ~~+25%~~), Always Running 3 h of window (was ~~+40% and 48 h~~). VPN sponsors add 2 h of window per strength (was ~~6 h of cap~~). Effect `offlineCap` is now `offlineWindow`.
    * **Save v8**: orgs that own any offline node get its points back in full (4 / 40 / 400) and keep the node, with a "Legacy refreshed" entry in the activity log.
    * Welcome Back states the rate and the window (~~"kept running at 40% of its income for the first 12h, then at 20% until 24 hours, and nothing after that"~~ *(Changed 1 time since: "then at a rate that fades the longer you stay away but never quite stops")*), says what waits for the player, and gives a neutral estimate of what an open game would have made. Stats shows the full rule.
    * Offline still pays operations, teams and merch only (no crowds, drops, sponsor goals or Invitationals); that was already true.
  * **Levelling off (WS3.3)**:
    * ~~Fans past 3e9 add no more fame (`FAME_CAP_FANS`); the Fans tooltip and Stats say when fame has topped out.~~ *(Changed 1 time since: no hard cap; each new fan is worth less as the org grows, down to a 0.01 floor, `fanValue`)* ~~The last four fame upgrades are ×1.1 (were ×1.3–1.5).~~ *(Changed 1 time since: ×1.3, ×1.35, ×1.4 and ×1.5, each with a second effect)*
    * Superfan upgrades 4 to 9 have factor ~~0.025~~ *(Changed 1 time since: 0.035, `LATE_SUPERFAN`)* (were 0.175–0.2); Street Team and Moderators cost 10× less and Moderators' factor is 0.1 (was 0.15), so the cabinet does its work during the climb.
    * The top four operations grow faster per unit (`OperationDef.priceGrowth`: Neural Link Lab ×1.2, Clone Academy ×1.25, Simulation ×1.4, Multiverse Championship ×1.6; everything else stays Cookie Clicker's ×1.15) and their tier upgrades cost 100× (`tierCostScale`).
    * Gear never costs less than 30 seconds of its team's ~~match income~~ *(Changed 1 time since: the team's matches at base income, with no buffs, popularity swing, win chance or injured starter in it)* (`GEAR_INCOME_FLOOR_SECONDS`, `gearPrice()`, `teamIncome()`); the player screen says so. `buyGear` takes the rates.
  * **Simulator and targets**:
    * Doubling targets are 1 h and 3 h after the first Legacy point (`DOUBLING_MINUTES`). The restart check sells an hour after the first point and plays run 2 for 6 h: run 2 must earn run 1's income within 75% of run 1's time (`RESTART_CATCH_UP`) and twice it by then (`RESTART_CEILING`). The stay job is gone.
    * Pace targets read steady income (buff-free, recorded per sample as `steadyCps`) around a moment; booked income was swamped by ×200 half-hour buff stacks late in a run.
    * Check E (nothing becomes free: best payback per kind, `MIN_PAYBACK_TREND`) is a target; gear moved from D to E.
    * New `--preset=tune` (three active seeds and the restart check, about 3 minutes). Active runs are 9 h. The price-curve script takes `--runs` and prints a summary per reading. A persona that sold before the once-a-minute milestone check now records its first Legacy point.
  * **Tests**: `tests/offline.test.ts` (the credit rule, the ceilings, a twelve-hour absence end to end), v7 → v8 refund migration tests, the gear floor, the per-operation price growth and tier scale in `tests/pricing.test.ts`, and the strict ceilings in `tests/effects.test.ts`.
* **Result** (`npm run sim`, five seeds, `output/sim/phaseB-2`):
  * First Legacy point 3h33 (3h13–3h58); the early game is unchanged (tutorial 2m, first sponsor 13m, merch 31m, $1e9 41m).
  * Income doubles in 31 min 1 h after the first point and 75 min 3 h after (were 6 and 12 min at hours 3 and 6). Over the 3 h after the first point, income grows ×126 (was ×8.6e4; target ×100, a near miss that is mostly the step of buying the final building).
  * Check D passes (operations ×274, upgrades ×50, staff ×104) and check E passes (gear ×0.70).
  * Run 2 is back to run 1's income at the sale in 60% of the time and earns ×28 more by then.
  * Offline: a hermit's first point is on day 13; an hour away pays 6–11% of an open hour. Over a week with sales (`--preset=offline --days=7`), lifetime earnings are ordered active > semi > idle > casual > hermit at days 3 and 7.
  * Check F: the Legacy level term is 0.7% of the income multiplier at 12 h (40% in the reference save).
  * **For reviewers, veterans lose income on loading**: the reference save earns 4.7e36 a second instead of 2.4e40 (superfan ×2.2e4 → ×58, fame ×633 → ×46), because the late superfan and fame upgrades it owns are now small. Legacy level and points are unchanged.
  * Still failing, unchanged: 7.4% of 10-minute windows are over 90% operations for idle and semi players.
  * 400 unit tests, the slow suite (18 pass, 4 expected failures) and `svelte-check` pass.

### Phase A of the implementation plan: measurement, quest data model, HQ clarity
*Status: Committed* | `b9887c5` (Oct 3 2026)

* **The Issue / Motivation**: `docs/implementation-plan.md` puts a measurement and groundwork phase before any further balance work. The price curve had no tests. Nothing measured whether a run is paced like Cookie Clicker (doubling time, the cost of the next purchase), and no simulated player stood for coming back rarely. The quest model could not express the run-1 tour (a mechanic per quest, tools, operation affinities, cosmetics). The HQ mixed units in one tile row, showed a raw 13-digit Legacy level, repeated dead text on every operation, gave icon-only tabs no name, and had three "what next" surfaces that could not be folded away.
* **What Changed**:
  * **Price-curve tests** (`tests/pricing.test.ts`): the 16 operation prices and outputs, ~~×1.15 growth~~ *(Changed 1 time since: the top four grow ×1.2, ×1.25, ×1.4 and ×1.6 per unit and their tier upgrades cost 100×, in Phase B)*, the doubling-tier counts and prices, bulk prices, max-affordable and the 25% refund are frozen.
    * Fix: with cash exactly equal to one unit's price, max-affordable could say 0 at large values (`geometricMax` now uses the price's own rounding).
  * **Price-curve measurement** (`scripts/sim/price-curve.ts`): checks A–F every 30 minutes across sales, plus the reference save. A (doubling time) and D (the next purchase's cost in seconds of income) are new report targets (`DOUBLING_MINUTES`, `MIN_AFFORD_TREND` in `targets.ts`). Each sim sample records `afford` and `earnedTotal`.
  * **Hermit personas** (`hermit`, `hermit-12`, `hermit-72` in `personas.ts`): open the game every 24/12/72 h for five minutes and spend everything.
    * New targets: the hermit's first Legacy is at least 2× the active player's and no sooner than the casual player's; lifetime earnings at days 3 and 7 are ordered active > semi > idle > casual > hermit; an hour away pays at most half an open hour. Every absence is recorded in the sim record.
    * `npm run sim -- --preset=offline --days=7` plays everyone for a week, selling as they go. The full matrix runs the hermit for 14 days; hermits are left out of the 10-minute mix check (their windows are offline lumps).
  * **Quest data model** (`src/data/quests.ts`, `src/engine/quests.ts`):
    * Every quest names the `mechanic` it teaches (`MECHANICS`).
    * New reward kinds: `tool` (kept for the run) and tokens (used up; `QUEST_TOOLS`, `hasTool`, `useToken`), `opAffinity` (×2 on an owned operation, otherwise its first 10 units 25% off, settled at the claim), `cosmetic` and `title` (kept across sales in `quests.collection`). A quest can pay a `bonus` on top of the chosen reward.
    * New effect `opFirstUnits` (`Mods.opFirstUnits`): the first units of one operation cost less. Every price, max-affordable and refund call passes it.
    * No live quest pays the new kinds yet, so balance is unchanged. Comments that said quests and perks survive a sale are corrected: ~~"Progress is kept for the life of the org, across sales"~~, ~~"A permanent bonus, kept for the life of the org, even after selling it"~~ *(Changed 1 time since: quests and perks belong to the run, as the code and the sell screen already said)*.
  * **HQ** (WS1.1, WS1.2):
    * The overview shows the Legacy level formatted (5.53e10, not 55283434774), with the missing space before it restored.
    * The Sponsors tile shows the $/s sponsors add, like the other three tiles, with the percentage and slots underneath.
    * Operation lanes no longer repeat "Every ×2 upgrade unlocked"; lanes under 0.5% of operations income are muted until hovered.
    * Every centre tab has an accessible name and a hover label (below 1280 px only the active tab shows its text).
    * **Collapsible cards** (`Collapsible.svelte`, `src/ui/collapse.ts`): ~~"Next steps"~~ *(Changed 1 time since: it is the Coach's game plan on the Staff page, in 0.2.0)* and "Org activity" fold away, remember their state in this browser, show a count when closed, and open themselves for a new urgent item (a starter who cannot play, a sale ready, a new setback). Closing the card again sticks until the next urgent item.
    * "Next goal" and "Opportunity" skip anything the active quest already asks for (agenda items carry a `mechanic`).
  * **Design for review** (docs only): `docs/legacy-v2.md` (stages, where today's 45 nodes go, four Paths with three rules each, Mastery, Heirlooms, the first-sale screen, migration rules) and `docs/quest-tour.md` (the 26 tour stops with metrics, engine hooks and affinities).
  * `docs/economy.md` records the new checks' baseline; `docs/content-catalog.md` lists the new canonical homes.
* **Result**: no balance change; a seeded `audit-compat` record is byte-identical to `1623db1` apart from the new fields. Baseline (`output/sim/phaseA`):
  * Doubling time is 6 min from hour 3 and 12 min from hour 6 (targets 20 and 60 ~~at hours 3 and 6~~ *(Changed 1 time since: measured 1 h and 3 h after the first Legacy point, because hour 3 is mid-climb for a 3-4 h first sale; Phase B)*).
  * Late in a run, the next purchase costs ×0.00–0.16 as many seconds of income as at hour 2 ~~(gear included)~~ *(Changed 1 time since: gear is checked by payback, check E, in Phase B)*.
  * The offline targets pass with no Legacy offline nodes (a hermit's first point is on day 12; an hour away pays 5–10% of an open hour).
  * Three days with sales (`--preset=offline --days=3`): earnings at day 3 are ordered active > semi > idle > casual > hermit, and an hour away pays at most 19% of an open hour.
  * Fix to the simulator found by that preset: a persona that sold before the once-a-minute milestone check never recorded run 1's first Legacy point. Milestones are now checked just before every sale.
  * 391 unit tests and `svelte-check` pass.

### Balance: the first Legacy point comes with the first Multiverse Championship
*Status: Committed* | `5f61dd2`, notes `b517044`, `1623db1` (Sep 30 2026)

* **The Issue / Motivation**: The active player could sell at 1h22–1h31, midway up the operations ladder, for a handful of points. After that, three more hours in the run earned about ten times more Legacy than selling and replaying. The design goal is a first prestige 3–4 hours into an active run, once the whole ladder has been climbed. From there Legacy should tick up, rather than arrive as a large pile.
* **What Changed**:
  * **First sale waits for the final operation** (`legacyUnlocked` in `src/engine/prestige.ts`). An org that has never sold must buy its first Multiverse Championship (`FINAL_OPERATION`) before it can sell. After the first sale this no longer applies.
    * `canSell`, the sale offer, the HQ suggestion, the clicker chip and "The big exit" quest all respect it.
    * The Legacy tab shows the points waiting and "Your first sale opens when you buy your first Multiverse Championship, the last operation".
  * **`LEGACY_DIVISOR` is 1e18** (was ~~1e12~~). Active players have 1e18–7e18 earned when they buy the final building, so the first point lands with it and ticks up (8 points at 8e18, 27 at 2.7e19).
  * **Save v7 migration** (`src/engine/save.ts`): Legacy levels, unspent points and Hall of Fame gains are divided by 100 (`LEGACY_RESCALE_V7`, the cube root of the millionfold divisor change). Every org stays where it was against its own earnings, and an org that had sold keeps at least level 1. The reference veteran save goes from Legacy 5.5e12 to 5.5e10.
  * **Simulator**:
    * The first-Legacy milestone and the bot's sale use `canSell`.
    * The active target is now 3–4 h (was 2h45–4h).
    * The full matrix runs longer (active 8 h, semi and idle 16 h, casual 4 days, optimal 4 h) so every persona can reach the ladder's end; the quick preset runs 5 h.
  * **Tests**: `finishLadder()` fixture for sale tests, v6 → v7 migration tests, and the veteran-save invariant updated for the rescale.
* **Result** (active persona, five seeds):
  * The first Multiverse Championship and the first point land at 3h30, 3h37, 3h55, 3h59 and 4h14 (median 3h55).
  * Points waiting: 1–3 at 4 h, 6–17 at 5 h, 24–35 at 6 h, 96–124 at 8 h.
  * `docs/economy.md` gets the full matrix (semi, idle, casual, the stay-or-sell check) once the long runs are summarised.
* **For reviewers**: a first sale is now small (1–3 points plus the free root node and four founding points), so selling right away is worth little. Making early Legacy strong (a larger, tapering per-level bonus and starter kits) is the next phase.

### Balance: runs stop compounding without limit (plateau pass, phase 2 of the economy refinements)
*Status: Committed* | `01e6749` (Sep 30 2026)

* **The Issue / Motivation**: The balance simulator's baseline (`docs/economy.md`) found several things compounding without limit:
  * Matches reached 71% of a 12-hour semi-active run and 98% of the veteran save.
  * Merch swung 480× between its worst and best case.
  * Gear on established teams cost under a second of income, which made league tiers (and with them fans and fame) free to climb.
  * Talent Agents, Team Managers and Pedigree had no ceiling.
  * A hard sponsor goal could pay 280% of what the org earned during the deal.
* **What Changed**:
  * **Gear is priced by league** (`src/data/gear.ts`, `players.ts`): every league tier a team's best result reaches this run doubles gear prices (`GEAR_LEAGUE_GROWTH = 2`), in step with opponents. The player card says "Priced for {league}". Relegation doesn't make gear cheaper. Gear paybacks went from under 10 s to about an hour.
  * **Fans per league tier** grow ×1.5 per tier instead of ~~×1.9~~ (`FAN_GROWTH`, `src/data/leagues.ts`).
  * **Fame knee**: above 100M fans, fame grows at half its usual exponent (`FAME_KNEE_FANS`, `FAME_KNEE_SLOPE` in `economy.ts`). Fame 6 hours into an active run: ×50 (was ×89). *(Changed 2 times since: fans past 3e9 added no more fame, `FAME_CAP_FANS`, in Phase B; then the knee and the cap became one continuous fan-value curve with a 0.01 floor)*
  * **Teams and merch lines share their income-linked earnings**: n teams earn n^0.65 times one team (`TEAM_SHARE_EXPONENT`), and n selling merch lines earn n^0.5 times one line (`MERCH_LINE_SHARE_EXPONENT`). Fielding every game or product no longer multiplies income by 12 or 10.
  * **Merch spikes**:
    * Mania is ×2.5 (was ~~×4~~).
    * Merch Spotlight is ×3 (was ~~×5~~, `MERCH_SPOTLIGHT_MULT`).
    * A stale design still sells half as well (`NOVELTY_FLOOR` 0.5, was ~~0.25~~).
    * The veteran save's worst-to-best merch swing is 11.8× (was 480×).
  * **Caps**:
    * Team Managers level off at twice as fast.
    * Talent Agents soft-cap from ten hires and level off at ×3 sponsor income (they were ~~uncapped~~).
    * Pedigree levels off at ×2 prize money.
    * The stale "sponsor total is capped" comment in `economy.ts` now describes the code.
  * **Sponsor goals** pay 35% of what the org earned during the deal, a bigger share for harder goals, but never more than 75% (`GOAL_SHARE_MAX`; drop goals used to pay ~~280%~~). The advertised ceiling uses the same share. The largest goal in an active run fell from 26 min of income to under 4 min.
  * **Simulator targets**: "a run levels off" (income growth in the 3 h after the first Legacy point) and "matches under 60% of a long semi run". The late-game check uses the live Spotlight and mania values.
  * **Tests**: the merch mania test reads `MANIA_BONUS`, and the sponsor headline test uses `goalShareRate`. Four late-game budgets now pass and lost their `it.fails`: matches ≤ 90%, operations ≥ 5%, Agent multiplier under 10, and no 100+-owned line repaying in under 30 s.
* **Result** (`npm run sim`, 5 seeds; before → after):
  * **Mix**: an active 6-hour run is operations 24%, matches 27%, merch 26%, drops 22%. A 12-hour semi run has matches at 40% (was 71%). The largest share of any run is 63% (was 79.5%).
  * **Paybacks** now lengthen through a run instead of shortening: operations 8m at 30m → 23–43m at 2–3 h.
  * **Pace**: the first Legacy point moved from 1h22 to 1h31 (active) and 3h51 to 4h28 (semi). Pace is the next phase.
  * **Still failing**: income still grows ×2e8 in the 3 h after the first Legacy point, and staying still beats selling (0.08×). Base operations income (Cookie Clicker's own building ladder) grows ×50–160 an hour until the last building is bought around hour 5–6.

### Design report: what to build after the first Legacy
*Status: Committed* | `f328057` (Sep 30 2026), corrections `b9887c5` (Oct 3 2026)

* **The Issue / Motivation**: Two AI-written idea lists and two Cookie Clicker deep dives proposed late-game features. Several of them fix problems the game already solves (multiplicative buff stacking, a rival org, Trophies as a non-cash currency), and none mention what `docs/economy.md` found: after the first Legacy point, staying in the run beats selling about ten times over, so nothing built for run 2 onwards would be seen.
* **What Changed**:
  * New `docs/design-roadmap.md`, docs only, no game or balance change. It covers:
    * what the code already has against what the lists claim is missing;
    * research on what idle players like and dislike, and why Cookie Clicker's mechanisms work and where they chafe;
    * seven design principles;
    * a ranked verdict on each idea, with how it would be built in this codebase and what to push back on;
    * a phased sequence and the open decisions.
  * Step 0 of the roadmap is the economy floor already listed in `docs/economy.md`.
  * New `docs/implementation-plan.md`, docs only: a phased plan for six workstreams (HQ UI/UX, Legacy v2, price-curve validation, strict offline, features A1/A2/A3/A4/A6, and the quest system), with findings from the code and the running game, acceptance tests and open decisions. It records the owner's decisions: strict offline (rate ≤ 0.4, half rate to a 24 h cap), a separate run-2 quest line with a run-1 tour of every mechanic, collapsible "Next steps" and alerts with quests kept on their own, and exclusive, swappable Legacy Paths.
  * New `docs/ascension-review.md`, docs only: a stage-by-stage review of Cookie Clicker's first run, early, mid and late ascensions, compared with Esports Idle, and the Legacy v2 design it leads to (a permanent staged tree, swappable Paths with mastery, and Heirloom slots modelled on permanent upgrade slots).
    * Finding recorded there: the 16 operation prices and base outputs are an exact copy of Cookie Clicker's (×1.15 growth, 25% refund), so the price curve is not what makes income outrun costs; uncoupled multipliers are.
    * Finding recorded there: offline is ~~100% efficient for up to 72 hours at max Legacy nodes~~ *(Changed 1 time since: at most 40% for a 6–12 h window, then half that to a 24 h cap, in Phase B)*, which becomes more attractive once the economy levels off.

### Fix: "The big exit" quest could never be completed, and the sell screen said quests were kept
*Status: Committed* | `f328057` (Sep 30 2026)

* **The Issue / Motivation**: The balance report found that the last quest, "The big exit" (sell the org), could never pay out:
  * It counts `stats.orgsSold`, but selling cleared the quest board before the sale was counted.
  * In the next run it reappeared with the new count as its baseline, and the next sale cleared it again.
  * Its +3 Legacy points or 10 trophies were unreachable.
  * The sell screen also listed "Quest progress" under **You keep**, when every quest and quest perk is lost.
  * The Legacy chip's tooltip always said "+1% income forever each", ignoring Heritage and Endowment.
* **What Changed**:
  * `sellOrg` pays "The big exit" itself when the quest is on the board (`completeQuestOnSale` in `src/engine/quests.ts`). It pays the Legacy points by default, or the trophies with `questReward: 1`, and counts as a claimed quest.
  * The sell screen says so ("Quest complete: selling finishes 'The big exit' for +3 legacy points") and moves quests to **You lose**.
  * The Legacy chip tooltip shows the real per-level bonus.
  * Tests:
    * `tests/prestige.test.ts` covers both rewards and a sale without the quest.
    * `tests/guidance.test.ts` is folded into `onboarding.test.ts` and a new `achievements.test.ts`.

### Balance tooling: one seeded, parallel playstyle simulator with source-over-time books
*Status: Committed* | `d4bfd31`, `7f63446` (Sep 29 2026)

* **The Issue / Motivation**: Balance numbers came from four overlapping harnesses (`scripts/sim.ts`, `scripts/audit.ts` plus `audit-report.ts`, `scripts/compare.ts`, and the broken test-only runner). All of them shared one bot shape:
  * It bought perfectly, measuring about 140 purchases with a full income evaluation each and taking the best payback.
  * It clicked five times a second, but only in fixed windows.
  * It caught drops instantly and ignored hype chains.
  * It ran one seed per process, with no parallelism.
  * No bot played the ways people actually play: acting every 20–30 seconds with a crowd every ten minutes, or ten minutes on and fifty idle with the tab open. A 12-hour active run took up to 27 minutes.
* **What Changed**:
  * **`scripts/sim/`** replaces the old harnesses. The loop (`run-sim.ts`) is `audit.ts` refactored into a pure `runSim(options)`. It was checked byte-for-byte against `audit.ts` on seed 1 over 3 hours: every purchase, milestone, sample and sponsor payout is identical.
  * **Personas** (`personas.ts`):
    * `active` (the balance target): acts every 20–30 s, fills the meter for a crowd about every ten minutes, catches 85% of drops after a 1–6 s reaction, and pops 12 chain bubbles.
    * `semi`: 10 minutes active, then 50 open and idle, every hour.
    * `casual`: four sessions a day, closed in between, using the real offline path.
    * `idle`: checks in every 10–15 minutes.
    * `optimal`: the ceiling.
    * `audit-compat`: the old bot, kept to check the simulator against.
    * Every persona follows the tutorial closely. They now also answer world events, spend trophies on operation levels and trophy upgrades, and buy decor.
  * **Buyers** (`buyers.ts`):
    * `optimal` is the old exact-payback buyer.
    * `human` judges payback through log-normal noise, sometimes ignores a category for a decision, and saves up for a favourite that is up to three minutes of income away.
    * The player's own dice are seeded separately from the game's RNG.
  * **Books every 10 simulated minutes** (`sampler` in `run-sim.ts`):
    * each ledger source;
    * the estimated share temporary buffs added (crowd, frenzy, other);
    * sponsor, Legacy, fame and superfan multipliers;
    * spending by kind, and cash moved outside the ledger;
    * crowds, chains, and drops seen and caught;
    * Legacy pending.
  * **Matrix** (`matrix.ts`, `npm run sim` / `npm run sim:quick`): one child process per persona, seed and variant, run in parallel. The `full` preset:
    * 5 personas × 5 seeds;
    * `no-drops`, `no-merch`, `no-teams` and `no-clicks` variants;
    * a restart check: ~~from an hour after the first Legacy point, stay 3 h or sell and replay 3 h~~ *(Changed 1 time since: sell an hour after the first Legacy point and play run 2 for 6 h, Phase B)*.
  * **Report and targets**: `report.ts` writes `report.md` and a self-contained `report.html` of share-over-time charts. `targets.ts` holds the design targets as data; the report checks each one and marks it pass or fail:
    * first Legacy at 2h45–4h active;
    * a crowd every ~10 min;
    * no source over 90% of a run or of a 10-minute window after 30 min;
    * merch and matches each 10–40% / 10–50% of an active run;
    * active play at least 1.5× faster than idle;
    * ~~selling at least 1.5× better than staying~~ *(Changed 1 time since: run 2 back to run 1's income within 75% of the time and ×2 above it by then, Phase B)*.
  * **Payback audit** (`paybacks.ts`): prices every operation, level, upgrade (visible or within a day of income), staff hire, gear slot, merch finish and line, decor item, Legacy node and Dynasty rank at five points of a real run. It flags purchases that change nothing, purchases paying back 10× faster or slower than their kind, and cards whose stated ×N differs from what they did.
  * **Faster engine**, identical results. These hot paths ran inside every income evaluation, so they speed up the game too:
    * `playerEasterEgg` caches per player;
    * gear stat multipliers look up only the slots that raise a stat;
    * `computeRates` counts the cabinet once;
    * `clickLogo` accepts precomputed modifiers.
    * The simulator reuses modifiers when measuring operations, gear and merch finish.
    * A 3-hour active run went from 140 s to 58 s with a byte-identical record.
  * **Deleted**: `scripts/sim.ts`, `scripts/audit.ts`, `scripts/audit-report.ts`, `scripts/compare.ts`. `scripts/lategame-audit.ts` now plays forward with `scripts/sim/cli.ts` and writes its report under `output/`.
  * **`tests/sim-smoke.test.ts`**: plays every persona for five minutes and checks determinism, so the simulator can't rot unnoticed again.
  * **Docs**:
    * `docs/economy.md` is rewritten as the single living write-up: how it is measured, the targets, pace, income mix over time, what each system is worth, paybacks, the late game, bugs found, and a ranked tuning list (not applied).
    * Deleted the dated audit docs it supersedes: `balance-audit-2026-09-20`, `progression-audit-2026-09-22`, `lategame-findings-2026-09-29`, and the generated `lategame-audit.md`.
    * `AGENTS.md` and `docs/content-catalog.md` point at the tooling. A stray Invitationals row in the catalog is back inside its table.
  * **Baseline** (`npm run sim`: 39 runs including the restart check, 2m30s on 18 workers):
    * The active player earns its first Legacy point at **1h22** (1h17–1h25 over five seeds), against a 2h45–4h target. Semi takes 3h51, idle 5h43, and casual 13h31 wall-clock (66 minutes of it with the game open).
    * **Staying in a run beats selling by about 10×**: from an hour after the first point, three more hours in the run end with 464–1,848 Legacy, while selling and replaying ends with 69–166. Income grows about 100× every 30 minutes and never levels off.
    * Matches climb to 71% of a 12-hour semi run and 66% of a 3-day casual game. Gear on established teams costs under a second of income. Snack upgrades pay back 12–22× slower than other upgrades.
    * **Bug found, not fixed**: the "The big exit" quest can never complete, because selling wipes the quest board before `orgsSold` increments.

### Test suite: reorganised by feature, dead tests removed, slow suite made opt-in
*Status: Committed* | `6a0d247` (Sep 29 2026)

* **The Issue / Motivation**: The suite had grown in batches. Seven files were named after the batch that added them rather than the feature they test, save migrations were spread over six files, and some tests checked nothing (a copy of the toast-duration formula tested against itself, a string compared with itself) or asserted that known exploits still worked. `tests/playtest-runner.ts` imported the removed `skipQuest`, so `npm run check` failed. `npm test` took 15.7 s, 20 s of CPU of it in two characterization tests that only logged numbers.
* **What Changed**:
  * **Deleted**:
    * `tests/playtest-runner.ts`, an unused third copy of the sim that no longer compiled.
    * `tests/playtest-results/`, a set of Sep-19 logs that nothing referenced.
    * `tests/playtest-audit.test.ts`, a console.log characterization suite that pinned the season-erase and buffed-transfer exploits. Its one real invariant, that squads develop only while the game is open, moved to `save.test.ts`.
    * The regenerable sim output under `output/`, which is now gitignored apart from `visual-comparisons/`.
  * **Merged by feature**: `feedback-batch`, `user-feedback-fixes`, `new-features`, `balance-update`, `rebalance` and `merch-rebalance` were split into the matching files:
    * new: `clicker`, `merch`, `market`, `players`, `automation`;
    * existing: `staff`, `roster`, `fame`, `business`, `events`.
    * `upgrade-audit` is now `effects.test.ts`.
  * **One migrations file**: every save-migration and save-heal test now lives in `migrations.test.ts`:
    * the v1, v2→v3 and v5→v6 migrations;
    * founder healing;
    * saves from before the first-player draft.
  * **Removed**:
    * The two no-op tests.
    * The legacy-node cost pins and the `LEGACY_DIVISOR` pin, which is already covered in `prestige`.
    * A third copy of "founder returns after a sale".
    * The "at least 250 upgrades" and "exactly 16 operations" / "14 fame sources" count pins. Where needed they now read from the data.
  * **Deterministic**: hand-written 27-field team literals now use `createTeam()`, and `createBaseState()` calls are seeded.
  * **Lategame suite**: moved to `tests/slow/`. Its setup runs lazily, and it runs in its own vitest project (`npm run test:slow`); `npm test` runs the `unit` project only. It gained a "finds everything the budgets measure" invariant, because an `it.fails` budget whose lookup found nothing would otherwise pass on the TypeError. The fresh-run (<15) and veteran (<50) prize-stack caps now reference each other.
  * **Result**: `npm test` takes 2.4 s (353 tests), `npm run test:slow` takes 15 s (14 plus 8 expected fails), and `npm run check` passes again.

### Test suite: ultra-lategame balance audit built on a real 1.8e50-earnings save
*Status: Committed* | `6a0d247` (Sep 29 2026)

* **The Issue / Motivation**: Every earlier audit stopped at a few hours into a fresh run, but real players sit 12 sales deep with Legacy in the trillions, where different things break. A player's very late-game save (12 sales, Legacy level 5.5e12, every Legacy node, 300 achievements) was supplied as a basis for finding what is out of hand there.
* **What Changed**:
  * `tests/fixtures/lategame-save.txt`: the save, read-only.
  * `scripts/lategame-lib.ts` and `scripts/lategame-checks.ts`: helpers that remove each owned thing in turn (every Legacy node, Dynasty track, upgrade, staff line, operation, team, sponsors, merch, fans, cabinet) and recompute income; lump-sum payouts in seconds of income; next-unit payback and elasticity for every operation and staff line; the whole bank spent on one line; merch's best and worst case; the cabinet and sponsor multiplier chains; numeric headroom to 1.8e308; a no-purchase forward projection.
  * `scripts/lategame-audit.ts` writes `docs/lategame-audit.md` and `output/lategame-audit/static.json`. It folds in any `play-*.json` from `scripts/audit.ts`.
  * `scripts/audit.ts` gained `--from=<save>` and `--sellnow=true`, so the existing progression bot can sell the veteran org and play the runs after it with that Legacy.
  * `tests/slow/lategame-audit.test.ts`: invariants (finite, headroom, formatting) plus budgets. Budgets that the working tree breaks are `it.fails`, so each flips red the moment a balance change fixes it and the `.fails` should then be removed.
  * Findings are in `docs/lategame-findings-2026-09-29.md`.

### Fix: the Prize line, click multipliers and Worlds-season events did nothing
*Status: Committed* | `a01e3c3` (Sep 29 2026)

* **The Issue / Motivation**: Audit of every store upgrade and legacy node (each removed in turn from an org that owns everything else, then measured against the real payouts on a 1-hour run and the late-game save). Every effect changed the modifier set, but two never reached the game:
  * **Match prize money**: `prizeMult` multiplied only the flat tier prize. A match prize is that flat amount plus a few seconds of operations income, and the flat part is 0.1% of it an hour into a run (10⁻²⁴ in the late-game save). So the eight Prize-line upgrades, Hall of Champions, Alumni Network, Pedigree ranks, Banking sponsors, the "Branch out" quest perk and the Worlds-season event (×1.5 prize for 5 minutes) paid nothing for matches while their cards said "Match prize money ×N". Only Invitationals used them.
  * **Click multiplier**: `clickMult` (Golden Controller, Veteran Fingers, the "Hype streak" quest perk, the Party mandate) multiplied only the flat click base. Next to the "+% of income per click" part that base is about 7% of a click at 1 hour and nothing later, so those cards did nothing.
  * Smaller mismatches: Superfan upgrades counted shadow achievements towards "Unlock N achievements" while the bonus ignores them; Hype Veterans said Drops appear "15% more often" when the interval is 15% shorter (about 18% more often).
* **What Changed**:
  * **Prize money** (`teams.ts`): `prizeMult` and the per-game event multiplier now multiply the whole match prize. To keep matches from becoming a scaled copy of the operations economy, the sources were retuned down: the eight Prize-line upgrades are ~~×2~~ ×1.15 each (×3 in total), Hall of Champions ~~×1.5~~ ×1.25, Alumni Network ~~×1.5~~ ×1.25, Pedigree ~~+6%~~ +4% per rank (levelling off at ×2 since the Phase 2 plateau pass), Banking sponsors ~~+20%~~ +10% per strength. The Media Circus mandate's "prize money 20% lower" is now a real cost.
  * **Clicks** (`economy.ts`): a click is `(base + income share) × clickMult × buffs`, so "Clicking is ×2 as powerful" is true.
  * **Superfan** unlocks count cabinet achievements only, the same number the bonus uses. Hype Veterans now reads "arrive 15% sooner".
  * **Tests** (`tests/upgrade-audit.test.ts`, `tests/teams.test.ts`):
    * With every other upgrade, legacy node, dynasty rank and challenge reward owned, removing any one of them must change the modifiers or rates. This is the check that catches a cap swallowing a purchase, at the point where the caps bite.
    * Every effect kind must change the modifier set.
    * Prize and click multipliers must move real payouts; the product of all prize sources stays under 15×.
    * Bench, market and sponsor slot totals, the offline efficiency and hours caps, and Superfan reachability (313 cabinet achievements against a top need of 200).
    * Legacy unlocks that change a run: IPO Money, Family Home, Merch Archive, Global Brand Portfolio, Operations Manager. The old teams test that pinned "prizes ignore the income share" now asserts the opposite.
  * **Checked and found working** (no change): every other legacy node and store upgrade group. Bench, market, sponsor slots and offline efficiency sit exactly at their caps (offline efficiency is ~~100%~~ *(Changed 1 time since: 40%, Phase B)* only with all three offline nodes, which is intended). The staff-upgrade morale, Designer and Chef ceilings are asymptotes by design, and Limited Edition Drops only matters in the first hour after a design launches (novelty then bottoms out).
  * **Not re-run**: the multi-hour progression sims. The 1-hour run had prize money ×2 at most, so the early game moves little; the late game is where the retuned line matters.

### Fix: eight Fame upgrades did nothing, and other swallowed bonuses
*Status: Committed* | `7bd889e` (Sep 24 2026)

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
    * Fan Conventions through Fandom Singularity now multiply the fame bonus (×1.2, 1.2, 1.25, 1.25, ~~1.3, 1.3, 1.4, 1.5~~ *(Changed 1 time since: the last four are ×1.1, in Phase B)*; a new `fameBonus` effect). A multiplier doesn't compound with the fanbase the way an exponent does, so the late line can't run away. Together they are ×8 at the top of the line.
    * The legacy nodes are now fame bonus ×1.25 (Legendary Fanbase, alongside fans ×1.5) and ×1.5 (Generational Fans).
    * Card text, the legacy descriptions, the Fans tooltip and the code comment now say what actually happens.
  * **VPN sponsors** add offline hours ~~(+6h per strength, uncapped)~~ *(Changed 1 time since: +2 h at the full offline rate per strength, inside the 12 h window cap, in Phase B)* instead of offline efficiency. Sponsor perk scaling handles hour-based effects.
  * **Morale**: Chef morale levels off at +15 and Psychologist at +12, through the staff effect ceiling. With decor's +19 that covers the 95 cap even for Homesick players, and the cards show what lands. Their other effects are unchanged.
  * **Tests** (`tests/fame.test.ts`):
    * Buying each Fame upgrade and legacy fame node in order must raise the fame bonus.
    * Every fame-exponent source together must fit under the cap, and every offline efficiency source within ~~100%~~ *(Changed 1 time since: the 40% ceiling, Phase B)*.
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
    * A banner painted with ~~the org's best operation scene~~ *(Changed 1 time since: the org's own house, its wall with a strip of its floor, the same art as the team rooms, in the HQ and team room visual pass)*, with a slow light sweep. It shows the logo, room, run and legacy, a large income figure, and boost and sponsor chips.
    * An income-mix bar splits income into Operations, Matches and Merch. *(Changed 1 time since: ~~always shown~~ the legend and the four tiles fold away until the income figure or the bar is clicked, in 0.2.0)*
    * Four tiles jump to where each stream is managed: Operations (buildings, best building), Teams (team count, average win chance), Merch (lines on the current trend, flagged when some aren't) and Sponsors ~~(boost, slots signed)~~ *(Changed 1 time since: the $/s sponsors add, with the boost and slots underneath, so the row has one unit, in Phase A of the implementation plan)*.
  * **Next steps**: the goal, team and opportunity cards are one panel of rows, each with a coloured marker, the detail and an action button. On phones the button drops under the text. *(Changed 2 times since: the panel collapses and opens itself for urgent items, and skips what the active quest says, in Phase A; ~~on HQ~~ it moves to the Staff page as the Coach's game plan, shown once a Coach is hired, in 0.2.0)*
  * **Operations**:
    * A header with the building count and operations income.
    * A **Scenes / List** toggle; List hides the scenes so every operation fits on one screen, and the choice is remembered in this browser.
    * Each lane shows the building's own sprite, the count, income, a bar for its share of operations income, and when its next ×2 upgrade unlocks ~~(or that every ×2 upgrade is unlocked)~~ *(Changed 1 time since: nothing is shown once all are unlocked, and lanes under 0.5% of operations income are muted, in Phase A)*. The level-up button explains itself in a tooltip.
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
    * Finishes add 0.15 a level (×2.5 at Q10). Trend matching is ×2 and a line earns 0.5× its share of operations income (`MERCH_INCOME_SCALE`) ~~per line~~, split between lines as n^0.5. *(Changed 1 time since: Phase 2 plateau pass)*
    * Mania is ~~×4~~ ×2.5 and lasts 60–120 seconds. *(Changed 1 time since: Phase 2 plateau pass)*
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
    * ~~The HQ quest card shows the quest line as a road of medallions.~~ *(Changed 1 time since: a skeuomorphic quest console with a lamp rail, drawn quest emblems and a perk trophy shelf, pending)*
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
  * **Staff** (`bfb4d86`): AI Trainers now train (XP, with some extra energy drain) instead of adding rating. Team Managers front-load: the first few matter most ~~with no ceiling~~, and level off at twice as fast. *(Changed 1 time since: Phase 2 plateau pass)*
  * **Sponsors** (`5160ae5`): ten tiers (six to ten behind the Global Brand Portfolio legacy node), perks that scale with tier and goal difficulty, no hidden income cap, no goals that the org would finish in under five minutes at its recent pace, two-zone cards ("While signed" / "Goal bonus · paid once") and parody logos for all 36 brands.
  * **Invitationals** (`424938d`): the Hype Drop sends an invitation showing the chance to win each round. Spending 10%, 25% or 50% of cash on preparation raises it, and an unanswered invite plays itself after two minutes. A team level with its league wins the bracket a little over half the time, and invites are about 70% more common. One glossary covers the competition words (docs/content-catalog.md): match, season, league title, Season MVP, Invitational, grudge match (was derby).
  * **Teams room** (`8727c16`): the Roster tab is folded into Teams. Each team is a room with a parody game logo, one role-labelled desk per player drawn like the House, and a wooden bench of player cards ~~(desks stretched to the full column on narrow screens)~~ *(Changed 1 time since: desks capped at their normal size, a sticky team switcher and foldable team cards, in 4f7b344 and 243122c)*. Players move by pointer drag (long press on touch), with the change in win chance shown and no layout movement. Clicking a player opens their gear and stats. Rival orgs get knock-off crests ~~(a monogram on the team fixture)~~ *(Changed 1 time since: every rival has a drawn parody crest, and the fixture shows it, in the quest console and text clarity pass)*.
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
  * **Interactive Click Chain**: Reduced hype fill requirement from 200 to ~~50 clicks~~ *(Changed 1 time since: rebalanced to ~80 clicks with decay buffer in de1e324)*. Reaching full hype initiates an interactive chain of popping bubbles granting escalating multipliers up to 20x for ~~200 seconds~~ *(Changed 1 time since: the ×20 volume stays, and every bubble past the twentieth keeps adding time)*.
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
  * **Prestige Acceleration**: Lowered `LEGACY_DIVISOR` from $10^{15}$ to ~~$10^{12}$ ($1\text{ Trillion}$), making the first prestige attainable within a reasonable 2–3 hour session~~. *(Changed 1 time since: raised to 1e18 and gated on the first Multiverse Championship, so the first point comes 3–4 hours into an active run)*
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
  * Added paged guidance dialogs explaining team management and scouting stats ~~(shown automatically on the first visit)~~ *(Changed 1 time since: the first visit shows a short intro card, and the paged guide opens from its "The full guide" button, in the smoother mechanic introductions)*.
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
  * **Dynasty Ranks**: Added 4 infinite-sink prestige tracks (Income, Prize Money, Fan Growth, Team Rating/XP) with escalating costs. *(Changed 2 times since: Pedigree gives +4% prize money per rank instead of ~~+6%~~, because it now multiplies the whole match prize; ~~uncapped~~ Pedigree now levels off at ×2)*
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
  * **Economy Invariant Fixes**: ~~Capped `fameExp` at 0.12~~ *(Changed 1 time since: the cap left eight Fame upgrades and both legacy fame nodes doing nothing; only the first four Fame upgrades now raise the exponent, up to a 0.13 cap that equals their total, and the rest multiply the fame bonus)*, ~~stopped match prizes from multiplying operations-linked income~~ *(Changed 1 time since: prize multipliers left the whole Prize line dead, because the operations-linked share is over 99% of a match prize a few minutes in; they now cover the whole prize and the line was retuned down)*, and retuned league progression scaling.
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
