# Design roadmap: what to build after the first Legacy

A critical review of the ideas on the table (the two AI-generated idea lists, the Cookie Clicker deep dives, and your own shortlist), checked against the actual code, your own balance numbers, and what players and designers say about idle games. It is written to be argued with. Every recommendation has a verdict, and several ideas are pushed back on.

**Method.** I read `docs/economy.md`, the Legacy tree, drops, clicker, rival, prestige and offline code, and the sim targets. I then researched idle-game design writing, Cookie Clicker's history and its player community. Sources are at the end. Two caveats: the Cookie Clicker Fandom wiki blocked me (HTTP 402), so Cookie Clicker facts come from wiki.gg, Steam threads and guides; and I did not verify the claims in the pasted dives beyond the ones I note as wrong below.

---

## 0. The short version

1. **The pasted ideas are built for a game that isn't quite yours.** Many of them fix problems that are already solved here (multiplicative buff stacking, a rival org, a non-cash "sugar lump" currency) and ignore the problem your own sim found: **after the first Legacy, staying in the run is about 10× better than selling it.** Until a sale is a real decision, no post-legacy feature has an audience, because players will not be there.
2. **Do not add more multipliers to the pile.** Cookie Clicker can afford ×7,000,000 combos because its costs rise 15% per building and run growth stalls. Yours doesn't stall: income grows about ×100 per 30 minutes through hour six, fame is ×89 by then, and the Legacy level term is ×1.1e11 in your reference save. New features should pay in **new, bounded currencies and qualitative unlocks**, not another `×N` on the pile.
3. **Your differentiator is people, not buildings.** Every idle game has buildings, prestige and buffs. Almost none have a procedural cast with traits, careers, rivals and a Hall of Fame. The best post-legacy features make the reset a *story beat* and make the past run matter: lineage, a nemesis that remembers you, offline seasons that really happen, a live finals moment.
4. **Ranked verdicts** (detail in section 6):

| # | Feature | Verdict | Why, in one line |
| --- | --- | --- | --- |
| 0 | Fix the floor (prestige must be a decision) | **Do first** | Every feature below depends on players actually selling |
| A1 | Offline Bootcamp (real offline seasons + dispatch) | **Build** | Fixes a true gap, and it is the most "esports-native" way to reward returning |
| A2 | Lineage: legends become schools, rookies get apprentices | **Build** | Turns a flat +5% into a story; best differentiator; most of the data already exists |
| A3 | Nemesis: a rival that persists and escalates across runs | **Build (reshaped)** | The rival is 60% built; it only needs to survive the sale and carry stakes |
| A4 | The Finals Moment: one burst window you can engineer | **Build (reshaped)** | The genre's "megacombo" made native to esports, with bounded payoffs |
| A5 | Org Identity: replace the flat tree with branching philosophies | **Build** | Identity and choice are the post-prestige fuel; also fixes the dominant-strategy problem |
| A6 | Analyst Desk: a visible forecast of the next drops | **Build (small)** | Removes Cookie Clicker's worst flaw (mandatory external planners) |
| B1 | Grand Slam | **Later** | Good capstone, but needs A1–A5 and a fixed economy |
| B2 | Ghost Roster scrims | **Later** | Lovely, but needs A2/A3 and a match-engine hook |
| B3 | Transfer windows / buyout offers | **Later** | Cheap and fun, but it is an event, not a system |
| B4 | Press conferences | **Later** | Cheap flavour; fine as an extension of `worldEvents.ts` |
| B5 | Competitive Calendar (seasonal metas) | **Later** | Good Cookie Clicker lesson, but only after a 2-hour-run economy exists |
| C1 | Sugar-lump style real-time currency ("Board Capital") | **Skip as pitched** | You already have the performance-gated version: Trophies |
| C2 | Patch Room mana / Algorithm Lab grid (operation minigames) | **Skip now** | They attach to a system that is 11% of income by hour six |
| C3 | Godzamok-style building sacrifice, stock-market loans | **Skip** | Sells the wrong asset; loans fight your "no dead time" ethos |
| C4 | Second prestige layer (Publisher/Syndicate) | **Not yet** | No one is selling once yet; layers multiply complexity |
| C5 | League Governance votes, Advisory Board seats, stance toggles | **Skip / fold in** | Duplicates Mandates and the tree; complexity without a new feeling |

---

## 1. Where the game actually is

### 1.1 What you already have that the pasted lists say is missing

| The lists claim | What the code does |
| --- | --- |
| "Drops are isolated; there is no multiplicative stacking" | `buffTotals` in `src/engine/buffs.ts` multiplies every active income/click/fans/merch buff. Frenzy ×7, Clutch ×777, Legendary Clutch ×7777, Merch Spotlight ×5, Hype Train ×7 per carriage, Crowd ×2 to ×20 from the bubble chain, and operation Rush ×(1 + owned/10) all stack. This **is** Cookie Clicker's Frenzy / Click Frenzy / Building Special system. What is missing is the ability to *aim* it. |
| "No active clicking beyond tapping" | The logo feeds a hype meter; a full meter starts a chain where each bubble is smaller and faster than the last (`clicker.ts`). That is already a skill test. Your sim shows direct click cash near 0% while crowds add 20–28% of income, so clicking *buys crowds*, by design. |
| "Nothing to spend on besides cash" | **Trophies** are earned from league titles, Invitationals, sponsor goals and quests, and spent to level operations (+1% each) and on trophy upgrades. That is Cookie Clicker's Sugar Lump role, but gated by performance rather than the calendar. |
| "No risk/spend decisions" | Invitationals let you pay 10%, 25% or 50% of your cash for preparation that raises the odds, and the money is gone either way. |
| "Nemesis org doesn't exist" | `stories.ts` has a rival with heat, head-to-head record, streaks, grudge matches (12% of matches, ×1.5 prize, ×2 fans, morale penalty on loss), a vanquish rule at a +10 lead, and `rivalHistory`. I only found it initialised in `state.ts`; nothing in `prestige.ts` carries it across a sale. |
| "Retired players give a flat bonus and nothing else" | True, but the `Legend` record already stores tag, name, game, `Appearance`, rating and run. The data for lineage is there. |
| "Prestige is purely numeric" | Founding Charters and Run Mandates already add identity and trade-offs. The Legacy tree is where it goes flat (section 1.3). |

### 1.2 The real post-legacy problems, from your own sim

From `docs/economy.md` (baseline 29 Sep 2026):

| Finding | Number | Why it matters for new features |
| --- | --- | --- |
| Staying beats selling | sell ÷ stay = 0.04–0.19 (**staying wins ~10×**) | The post-legacy game is never played. Nothing built for "run 2+" has players. |
| A run never levels off | income ~×100 per 30 min from hour 1 to 6; paybacks *shorten* (operations 18 m → 3 m) | New multipliers would make it worse. Cookie Clicker's runs slow down; yours accelerate. |
| Legacy level term | `cbrt(earnings/1e12) × 2%`; ×1.1e11 in the reference save | Every Legacy node is invisible next to this one term. A richer tree changes nothing until this is reshaped. |
| Matches own the late economy | 34% at 6 h → 98% of steady income in the reference save | A feature that doesn't touch matches barely touches the late game. |
| Operations fade | ~11% of income by hour 6 | Operation minigames would decorate the smallest part of the economy. |
| Fame is a quiet giant | ×13 at 2 h, ×21 at 3 h, ×89 at 6 h | A second uncapped multiplier source compounds with it. |
| First Legacy arrives early | 1h22 active vs a 2h45–4h target | You said you like pre-legacy. Note it is a deliberate fail in your own targets file; decide whether the 3-hour target still stands, because it changes what "post-legacy" means. |
| Offline | 20% base rate, 12 h cap; teams earn a flat rate but play no matches | Returning feels like a number, not a story. (Legacy nodes can raise the rate to 100%.) |

### 1.3 The Legacy tree is almost all percentages

Of 54 tree entries in `src/data/legacy.ts`, the large majority are `+N% income`, start bonuses or automation unlocks. The qualitative ones are few: Franchise Player, Hall of Fame Coaches, Targeted Scouting, Trait Headhunting, Global Brand Portfolio and the five challenge runs. Every node is eventually bought (`treeComplete` exists), so the tree is a checklist, not a build. Dynasty ranks are four linear, uncapped boosts.

The design writing is consistent about this: *"An upgrade that just increases a number by 10% is not meaningful"*, and phase transitions are what keep people (see section 2). Cookie Clicker's own prestige level is just +1% each; its real pull is what the heavenly tree **unlocks** (permanent upgrade slots, dragon auras, offline gains, golden-cookie tuning).

---

## 2. What the research says

### 2.1 What players love in idle games

- **Prestige that feels like acceleration, not punishment.** After a reset the next run should be visibly faster within about 30 seconds. Most prestige formulas use a fractional exponent (cube root in Cookie Clicker, so ~8× the earnings to double your currency), which is what yours does.
- **Phase transitions.** The fun is the moment the game's *shape* changes (manual → automated → strategic), not a steady stream of +10%.
- **Decisions.** Good waiting gives you something to think about: the next purchase, a reset plan. Players complain when the choice is a foregone sequence.
- **Presence beats absence, but absence is not punished.** A reduced offline rate (around half) makes closing the tab feel fine without making active play pointless.
- **Theme matters.** The same loop framed as training an AI vs mining gold feels different. You already have this.
- **Variance between players.** Antimatter Dimensions' creator called out "plenty of choices to make and variance between player experiences" as why its Reality layer worked.

### 2.2 What players hate

- **Forced waiting and forced resets.** The strongest language in the research was about forced prestige timers and waits longer than a minute. "Respect the player's time."
- **"Idle" games that need a check-in every 5–15 minutes.** This is the attention tax. Cookie Clicker's Golden Cookies are the textbook case: optional in theory, mandatory in practice.
- **Dead mid-game and late-game grinds.** Antimatter Dimensions' creator admits some late mechanics felt tedious until sped up. Cookie Clicker players say that after every ascension upgrade is bought, it is "rather slow".
- **Opaque late game.** After a point AD "stops explaining itself with the confidence it showed in the first hour", and you end up on external guides or scripts. Cookie Clicker needs planners and auto-combo tools (FrozenCookies, seed planners) to play the top tier.
- **Real-time locks that feel like a leash.** Sugar lumps ripen about once a day (20 h mature + 3 h ripe + 1 h to fall) and cannot be rushed. It gives long-term retention; it also makes progress feel gated behind the calendar, and leveling everything takes years.

### 2.3 What Cookie Clicker does well, and why

| Mechanism | Why it works | Friction to avoid |
| --- | --- | --- |
| Golden Cookies and buff stacking | Random, visible, high-value moments that reward attention without requiring it. Stacks multiplicatively, so skill compounds. | Attention tax. Top play requires engineering the stack. |
| Cost curve (×1.15 per building) | Growth slows, so resets matter and runs have a shape. | You currently lack this. |
| Prestige: +1% per level plus a tree | Small number, big unlocks. Permanent upgrade slots add choice after you've seen the game. | Late tree is "done". |
| Minigames on top buildings (Garden, Grimoire, Pantheon, Stock Market) | They give the main income source its own depth: planning, timing, synergy. | Hours of UI. Garden-scumming and FtHoF need external planners. |
| Sugar lumps | A currency you can't buy: a retention hook with no cash shortcut. | Feels like a leash; years to max. |
| Seasons | Four timed "moods" per year; collectible chase that changes what you buy. | Only matters to completionists. |
| Grandmapocalypse / wrinklers | An optional alternate playstyle that is the most rewarding for *AFK* players. | Can stress or confuse. |
| 2.048 "Unshackled" upgrades (added with Cortex Bakers) | Early buildings scale off late ones, keeping cheap purchases relevant. | Adds multiplier layers to an already huge pile. |

A note on the pasted dive: it lists the Stock Market under v2.031. The Stock Market arrived in v2.028 (23 Aug 2020); Unshackled and Cortex Bakers in v2.048; "You" in v2.052. Minor, but check any further specifics before building on them.

---

## 3. Ethos: what this game should be

Seven rules to judge every feature against. The test is in italics.

1. **Stories over spreadsheets.** The game's edge is a cast of characters and a living org. A feature that would work identically in a generic idle game should have to earn its place. *Would this produce a sentence a player tells a friend?*
2. **Every reset should leave something you can point at.** A retired legend, a nemesis, a school of players, a ghost roster. Not just a bigger multiplier. *What does the next run contain that the last one didn't?*
3. **Bounded payoffs, open-ended choices.** Pay bursts in fixed or capped currencies (Trophies, a new token), not another uncapped `×N`. *Does this make the `matches ≤ 90%` and fame targets worse?*
4. **Attention is a dial, not a tax.** Active play should be a faster way to win, never the only way. Idle and casual personas must still advance. *What happens to the `idle` and `casual` personas' pace?*
5. **No dead time, no forced waiting.** Timers are fine when they unlock a story beat (a bootcamp finishing), never when they gate power on a calendar. *Is the player waiting on a clock, or choosing something?*
6. **The game should teach its late game.** If a mechanic needs an external planner (Cookie Clicker's seed planners), the planner belongs in the game. *Can a new player read this feature's state from the screen?*
7. **Sim first.** Every new system gets a persona behaviour and a target in `scripts/sim/` before it ships, or it will quietly break the economy the way fame did. *Can the simulator play it?*

---

## 4. Step 0: make a sale a decision

This is not a feature, but it gates the roadmap. Your own `docs/economy.md` already lists the fixes; I would order them by what a post-legacy player feels:

1. **Reshape the Legacy level term** (`legacyLevelPct`, currently a straight line in a level that grows as cbrt of earnings). Use a log or sqrt, or cap per-level %. This one change stops "staying is ten times better".
2. **Make a run level off** (softer fame curve, steeper upper operation prices, later tier unlocks). This is the real fix for pace and restart pressure.
3. **Cap Dynasty Pedigree and Talent Agents**, and taper the matches' income-share term so matches don't hit 98%.
4. **Give operations a late role**, which is also the honest version of the lists' "Grassroots Unshackling" (early operations scale off late tiers or fame).
5. **Price gear from team income** so gear is a choice, not free-or-hopeless.
6. **Fix the `sell_org` quest bug** (quest board wiped before `orgsSold` increments).

Once 1 and 2 hold, the restart check in `scripts/sim/targets.ts` (sell ÷ stay ≥ 1.5×) becomes the acceptance test for the features below. Until then, treat each feature as unbalanced by definition.

*Pushback on the brief:* two of the pasted ideas (Megacombos, Stances) are multiplier-adding features. Shipping them before step 0 makes the compression worse.

---

## 5. Where you are strong, and where you can beat Cookie Clicker

**Already strong**

- A two-engine economy (people and operations) from minute one. Cookie Clicker started as one clicker and needed years of patches to branch.
- Expressive ownership: pixel editor, jerseys, merch designer with trend pricing, sponsor choices. Cookie Clicker has nothing like it.
- Qualitative prestige from the first sale: Charters and Mandates, 12 parody games, genre metas, world events, ticker, Hall of Fame.
- A sim that plays the real engine (`scripts/sim/`), which is rare and is what makes sensible late-game tuning possible.
- Tutorial that hits its "5-minute" mark (2 min to tutorial done, sponsor by 13 min).

**Where you can improve on Cookie Clicker's known flaws**

| Cookie Clicker flaw | Your opportunity |
| --- | --- |
| Top-tier play needs external planners | Build the planner in (A6, the Analyst Desk). |
| Combos are clumsy UI gymnastics (sell 4 building types in 10 s) | One decision at a narrative moment (A4). |
| Sugar lumps are a daily leash | Gate by performance and story (Trophies, A1), not by the calendar. |
| Offline is just a number | Offline is a *story*: "your team played 38 scrims, unlocked a perk" (A1). |
| Each run restarts the same world | The world remembers: nemesis, lineage, ghost rosters (A2, A3). |
| Everything is an abstract cookie | Every burst is a moment with characters in it. |

---

## 6. The candidates

Each entry: what it is, why the comparison game does it, the good, the friction, how it could be built here, and a verdict. "Cost" is engineering size: **S** (days), **M** (a week or two), **L** (several weeks, UI heavy).

### Tier A: build these

#### A1. Offline Bootcamp (real offline seasons, and a dispatch on return)

- **What.** While the game is closed, teams actually play: matches, promotions, XP, injuries, milestones. On return, the "Welcome back" modal becomes a dispatch: "Counter-Stroke played 38 matches, won 26, earned promotion; *Kade* hit level 25; scouts flagged two prospects." Today `applyOfflineProgress` fast-forwards `advance(s, counted, true)` and `updateTeams` just pays `cps × dt × factor` for active teams, so nothing in the world moves.
- **Why others do it.** Cookie Clicker pairs offline gains with a "welcome back" line. The design writing says the goal is a return that feels like "modest rewards waiting, not a salary". Stories beat totals.
- **Good.** Directly fixes the "frozen roster" gap. It makes closing the game feel like progress, not loss. It is pure upside for casual and idle players, which your sim says are slow (casual first Legacy 13h31 wall-clock).
- **Friction.** Simulating matches offline costs CPU (cap per tick, use the fast path). Risk of double-counting income. Offline earnings must not exceed the rate cap (today max 100% with every node).
- **How.**
  - In `updateTeams`, replace the offline branch with a coarse match loop: each active team plays `floor(dt / interval)` matches through `playMatch` with a flag that skips toasts and collects a summary. Reuse `MAX_MATCHES_PER_TICK`.
  - Pay out through the existing `earnCash` so ledger and sim tests keep working. Discount by `offlineRate` so away is still below present.
  - Extend `OfflineReport` with `{ matches, wins, promotions, levelUps, milestones, injuries }` and render them in `WelcomeBack.svelte`.
  - Add `offlineRate` to the `casual` persona tests, and a seeded test asserting offline and online yield comparable totals at rate 1.
- **Verdict. Build.** Cost **M**. Probably the highest value-per-effort item in the report.

#### A2. Lineage: legends become schools, rookies get apprentices

- **What.** When you retire a player to the Hall of Fame Coaches node, they found a **school** (for example "Hyper-Carry", "Macro Hivemind", "Scrim Grinders") defined by their top stats and traits. Future signings can be assigned as apprentices: they learn a trait, tilt stat growth, and inherit a signature perk. Over several sales you have 2nd and 3rd generation players, a tree of who trained whom, and a named philosophy you can see on the roster screen.
- **Why others do it.** Realm Grinder's bloodlines and Kittens Game's kitten leaders give continuity across resets. Prestige games mostly reduce a run to a number; games that keep *a character* are the ones players talk about. No other idle game has a procedural, named cast to build on.
- **Good.** It is your best differentiator. It replaces the flat "+5% rating, +2% fans" with something the player sees. It gives the Legacy tree a human dimension. The `Legend` record already holds `look`, `rating`, `gameId` and `run`.
- **Friction.** The hard part is *legibility*: a lineage UI can overwhelm. Risk of power creep, since each generation is better than the last. Test interactions with traits (`src/data/traits.ts`: 30+ traits) and save migration.
- **How.**
  - Extend `Legend` with `school` (derived from top stats + traits), `apprentices: string[]` and `generation`. Add a migration in `save.ts`.
  - Add an `apprentice` assignment to a signed rookie: one trait inherited (weighted by the school), XP curve from the mentor's stats, bounded by a rating cap so power is **transferred, not compounded**.
  - Schools grant a *named* effect through the existing `Effect` union, not new multiplier kinds (for example `+xpMult` for one game, or a new trait pool).
  - UI: a "Lineage" view in the Legacy tab, a mini-tree card, and a school badge on `PlayerCard.svelte`.
  - Sim: a persona that retires and assigns; target that lineage doesn't add more than N% to income.
- **Verdict. Build.** Cost **L**, but it is the feature most likely to be remembered.

#### A3. Nemesis: a rival that persists and escalates

- **What.** Promote the existing rival into a cross-run **Nemesis**. It survives the sale (name kept, head-to-head record kept, a short history); it hires away a star from your old roster; its strength scales with *your* best tier, not with the run; beating it is a named trophy; losing to it costs fans and sponsor appeal. After several sales it becomes the game's storyline.
- **Why others do it.** Persistent antagonists are the heart of games like Shadow of Mordor's Nemesis system, which inspired this. Idle games rarely try it, and the ones that do (Egg Inc. "contracts") use it for events rather than narrative.
- **Good.** 60% built already (heat, streaks, grudge matches, `rivalHistory`). Gives each reset an emotional reason: "I'm selling to beat Apex Void." Cheap compared to its narrative payoff.
- **Friction.** Rubber-banding risk: a rival that scales with you feels unfair; one that doesn't feels toothless. Tone: losses must sting but never soft-lock. Watch for double-dipping with grudge match prize multipliers (×1.5 prize, ×2 fans already).
- **How.**
  - Carry `s.rival` through `sellOrg` (today a fresh state leaves it `null`); keep `rivalHistory`. Add a `nemesis: { name, wins, losses, stolen: string[], generation }` block under `prestige`.
  - Hook `recordRivalMatch` and Invitational finals: a loss in a final can "poach" a player from the market (`poaching` already exists as a world event in `worldEvents.ts`), a win adds a "Bounty" trophy kind to `TrophyKind`.
  - New ticker lines in `src/data/news.ts` referencing the Nemesis by name; keep bounds on scale-specific lines per `AGENTS.md`.
  - Bound the cost of losing: capped fan steal, cool-down, never below a floor.
- **Verdict. Build (reshaped).** Cost **M**. Pair with A2 so the nemesis can poach from your school.

#### A4. The Finals Moment: one burst window you can engineer

This combines the best of the pasted lists' "Championship All-In", "Shotcaller Desk" and "Godzamok equivalent" into one system that fits what you have.

- **What.** The Invitational's grand final (and later league-title deciders) becomes the game's **combo window**. You stack what you can: buy preparation (already exists), have a crowd running, have a Frenzy up, and then the final plays out with two or three short **live calls** (push / eco save / hype ping) that shift the win chance. One optional **Crunch Time** toggle burns your roster's energy (with injury and morale risk, using the existing energy, injury and morale systems) for a rating boost. The payoff is **Trophies plus a bounded cash prize**, not a raw income multiplier.
- **Why others do it.** Cookie Clicker's late game is a 10–15 second engineered stack (Frenzy × Click Frenzy × Godzamok × loans). The genre lesson is that *a designed moment of peak play* converts knowledge into a payoff and changes the feel of the late game. Godzamok's own execution is clumsy (mass-selling four building types in ten seconds), and you can do better.
- **Good.** It is native: a final *is* the climactic moment of esports. The pieces exist (`tournament.ts` rounds, prep stakes, `invitationOdds`, buffs, energy, trophies). It rewards tactical knowledge over reflexes.
- **Friction.** Invites arrive about every 40 minutes, so this is a set-piece, not the moment-to-moment loop. Don't expect it to fix "mindless clicking". Live calls can feel fake if the math is hidden; show the odds. Crunch Time must have a real downside or it is always correct.
- **How.**
  - Add a `calls` step per round in `tournament.ts`: each call is a `{ id, label, winShift, risk }`; show the updated champion odds (the same `invitationOdds`).
  - Crunch Time: a per-invitation toggle that sets `energyDrain` and `injuryMult` effects for the event window via the existing modifier system (`addModifier`).
  - Payout: Trophies (bounded) and a prize computed from the existing formula. Explicitly *not* multiplied by the stacked buffs, but the buffs raise the odds and the crowd raises the audience fans. That's the "bounded payoff" rule.
  - Sim: an `active` persona that uses calls; target "Invitational champion rate" between 40% and 60%.
- **Verdict. Build (reshaped).** Cost **M**. **Pushback:** don't add `×25 global income` windows, loans, or building sales. They add to the multiplier pile you are trying to level off.

#### A5. Org Identity: branching philosophies instead of a flat tree

This is the pasted lists' "Purists vs Content Empire", "Advisory Board", and "Stances" done once, in the place your game already keeps identity.

- **What.** Replace part of the Legacy tree with **mutually exclusive branches** you commit to for a run (or a few runs): *Purist* (prize money, loyalty, low drama, coaching), *Content Empire* (merch and sponsors, viral drops, morale volatility), *Dealmaker* (market, transfers, sponsors), and so on. Each branch has three or four nodes that **change a rule**, not a number: "Sponsors of category X are refused, and drop drama is capped at level 1," "Every drama drop converts into a press event." You can switch branches only on a sale, so the choice is part of the sale.
- **Why others do it.** Realm Grinder's factions and Cookie Clicker's Pantheon slots are the examples: a small number of meaningful, exclusive choices per run, with visible trade-offs. Antimatter Dimensions credits "variance between player experiences" for its appeal.
- **Good.** It gives the Legacy currency a **destination** (a build) rather than a checklist. It makes different runs feel different, which is the thing post-legacy lacks. It fits your existing vocabulary (Mandates already offer trade-offs per run).
- **Friction.** Design effort: each branch needs its own payoffs, UI and sim behaviour. Risk of a dominant branch (your sim will catch it). The pasted Culture idea assigns "×10 merch income", which is exactly the wrong size of reward; keep it in single-digit percentages or qualitative.
- **How.**
  - Add `branch` nodes to `LEGACY_NODES` with an `exclusive: string` group and a `rule` special (for example `{ kind: 'rule', id: 'noGamblingSponsors' }`). Enforce in `buyNode`.
  - Implement rules as small hooks in the same modules that own the system (sponsors, drops, merch), as `mods` fields, not by scattering `if (branch === ...)` across the UI.
  - Keep Mandates as the small per-run flavour on top of the branch.
  - Sim: a persona per branch; target that each branch reaches first Legacy within ±15% of the others.
- **Verdict. Build.** Cost **L**. **Pushback:** don't also add an Advisory Board and stance toggles. Mandates, branches and Charters already cover this space; a fourth layer of "choose a stance" reads as noise.

#### A6. Analyst Desk: a visible forecast

- **What.** An Analyst unlock that shows the next two or three hype drops and world events on a small tape ("LAN Frenzy in ~3 m, Invitation in ~9 m"), and later lets you **hold** one drop in reserve (pop it when a crowd is up) or **re-roll** once per hour.
- **Why others do it.** Cookie Clicker's seeded spells and garden rolls are so predictable that the community built planners (FrozenCookies, seeded FtHoF tools). Players love foresight, but hate needing a third-party tool.
- **Good.** Turns random events into deliberate ones without adding a multiplier. Staff already includes an `analyst` role. It rewards planning for the Finals Moment (A4).
- **Friction.** Forecasting trivialises surprise if it's too exact: show ranges and kinds, not the exact second. Holding a drop has an edge case with `DROP_LIFETIME`.
- **How.**
  - Pre-roll the next N drop outcomes in `drops.ts` (the `rng` is seeded, so this is a matter of drawing ahead and storing a `queue` in state). Persist the queue in the save so it survives reload.
  - UI: a tape in `ClickerPanel.svelte`. Gate length by analyst count.
  - Hold: store one drop with a capped lifetime.
- **Verdict. Build (small).** Cost **S–M**. Cheap, clearly good, and answers a real Cookie Clicker complaint.

### Tier B: good, but later

| Feature | The idea | Cookie Clicker / genre parallel | Good / friction | Verdict |
| --- | --- | --- | --- | --- |
| **B1. Grand Slam** | Win Tier-1 titles in three genres in one cycle for a trophy and a **temporary** cross-team boost | Achievement-style capstones; Antimatter Dimensions' "challenge" cascades | Strong capstone; gives 12 parallel games a reason to interact. Needs a "cycle" definition and a late economy worth boosting. Keep it temporary, as in your own draft. | **Later**, after A1–A5 |
| **B2. Ghost Roster scrims** | Past rosters kept as sim opponents; beat them for a "passing the torch" perk | Nothing in the genre; unique | Wonderful use of Hall of Fame data. Needs the match engine to accept an archived roster and a snapshot of team ratings. | **Later**, needs A2/A3 |
| **B3. Transfer windows / buyout offers** | Periodic offers to sell your star for cash or points | Stock Market as a timing decision; `poaching` already exists | Real dilemma, cheap to build as a world event with a choice. Loses value if cash is meaningless late. | **Later**, extend `worldEvents.ts` |
| **B4. Press conferences** | Choose a stance after big events | Cookie Clicker news ticker is flavour only | Charming and cheap; reuse the choice-panel UI. Payoffs must be small. | **Later**, flavour |
| **B5. Competitive Calendar** | Four seasonal metas that change what's best to buy | Cookie Clicker seasons (Christmas, Halloween) | Good idea: a run that changes mood. Only worth it once the run levels off (step 0) and the rules per season are readable. | **Later** |

### Tier C: push back or skip

| Idea | Why it's tempting | Why I'd skip or reshape it |
| --- | --- | --- |
| **Board Capital / real-time lumps** | Retention without screen time. | You already have Trophies, which do the job and are earned by play. A daily token adds the "leash" players dislike, and in a browser game with `localStorage` the clock is trivially editable. If you want a real-time hook, use A1 (offline story) instead. |
| **Patch Room mana, Algorithm Lab grid** | Minigames make buildings deep. | Cookie Clicker's minigames attach to its main income (buildings). Yours are ~11% of income by hour six. A 6×6 grid (a Garden clone) is a large UI build for a small slice of the economy. Put depth where the money is: teams, matches, merch. |
| **Godzamok-style sale of Ranked Grinders** | "Sacrifice low-tier assets for a burst." | It sells the wrong asset: operations are cheap and fading. The esports-native sacrifice is **energy** (Crunch Time in A4). |
| **Commercial loans / stock-market-style windows** | Loans feed combos in Cookie Clicker. | They front-load income, which your economy already does too much of. They also make you wait for repayment, which is dead time. |
| **Tier-2 prestige (Publisher/Syndicate)** | Antimatter Dimensions and Realm Grinder do it. | Their layers work because the whole game was built around them. You have a first layer where selling is worse than staying; a second adds complexity on a broken floor. Revisit when a sale is a decision and the tree is a build. Design it as a new *era* with new mechanics (you run the league, not one org), not "reset with a bigger number". |
| **League Governance votes** | Changing the rules is a cool fantasy. | Overlaps Mandates and the tree; votes need a constituency and a budget; hard to make readable. |
| **Stance toggles (Autopilot / Tournament Drive)** | Mirrors the Golden Switch. | Your active-vs-idle gap is already healthy (active is 4.2× faster than idle), and Mandates like Grassroots Hype cover it per run. |
| **"×25 global overclock", "×10 merch" style numbers in the lists** | Big numbers feel good. | Your multiplier stack already explodes (fame ×89 at 6 h). Keep new rewards qualitative or bounded. |

### How your own shortlist fares

| Your idea | Assessment |
| --- | --- |
| **1. Generational Coaching Tree** | Best idea on the list. Becomes A2. |
| **2. Procedural Nemesis Org** | Excellent, and partly built. Becomes A3. |
| **3. Ghost Roster scrims** | Great as a *reward* for A2/A3. Tier B2. |
| **5. Shotcaller Desks** | Good, but it is a finals feature, not a cure for mindless clicking. It lives inside A4. |
| **6. Org Culture** | Good, with smaller payoffs than "×10". It lives inside A5. |
| **10. Grand Slam** | Fine as a capstone. Tier B1; keep the boost temporary. |

---

## 7. Sequencing

| Phase | Work | Exit test |
| --- | --- | --- |
| **0. Floor** | Section 4: Legacy level term, levelling off, matches cap, gear pricing, `sell_org` bug | `sim` restart check sell ÷ stay ≥ 1.5×; matches ≤ 90% of any window |
| **1. Story and return** | A1 Offline Bootcamp; A6 Analyst Desk | `casual` persona's offline and online totals agree; forecast tape shows on load |
| **2. People** | A2 Lineage; A3 Nemesis | Two sales later, the roster screen shows a named school and a named nemesis |
| **3. Burst and identity** | A4 Finals Moment; A5 Org Identity | Branch personas within ±15% pace; Invitational win rate 40–60% |
| **4. Capstones** | B1–B5 as capacity allows; revisit tier-2 prestige | Decide after watching how many players sell twice |

Each phase ships with: persona behaviour in `scripts/sim/personas.ts`, targets in `scripts/sim/targets.ts`, a short section in `docs/economy.md`, an entry in `PATCH_NOTES.md`, and content in its canonical data file (`docs/content-catalog.md`).

---

## 8. Decisions I need from you

1. **Is the 3-hour first-Legacy target still the intent?** Your sim says 1h22 and marks it a failure. You said you're happy with pre-legacy progression. If you like it fast, update `targets.ts` and leave it; if not, it is part of step 0.
2. **Do you want to fix the floor first?** My strong recommendation, because otherwise A1–A5 will ship to a player base that stays in run 1.
3. **How much UI are you willing to spend on lineage (A2)?** It is the highest-ceiling item and also the most screen-hungry.
4. **Do you want a real-time hook at all?** If yes, I'd attach it to A1 (a finished bootcamp) rather than a daily token.
5. **Is a later second prestige layer part of the plan?** If so, design the tree (A5) so its branches can become the first layer's "era 1".

---

## Sources

- [The Math of Idle Games, Part III (prestige)](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-iii)
- [The Math of Idle Games, Part I](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-i)
- [I Built 7 Idle Games in 30 Days (DEV Community)](https://dev.to/aguier/i-built-7-idle-games-in-30-days-what-i-learned-about-incremental-design-5d3f)
- [Active or idle? (Four Divine Abidings devlog)](https://fourda.itch.io/four-divine-abidings-full/devlog/981439/active-or-idle)
- [Interview with Hevipelle, creator of Antimatter Dimensions](https://www.incrementaldb.com/community/interview/31)
- [Antimatter Dimensions review](https://playwanderer.online/game-reviews/antimatter-dimensions)
- [Cookie Clicker Wiki: Sugar Lumps](https://cookieclicker.wiki.gg/wiki/Sugar_Lumps)
- [Cookie Clicker Wiki: Heavenly Chips](https://cookieclicker.wiki.gg/wiki/Heavenly_Chips)
- [Cookie Clicker Wiki: Endgame combo guide](https://cookieclicker.wiki.gg/wiki/Endgame_combo_guide)
- [Cookie Clicker Wiki: Grimoire](https://cookieclicker.wiki.gg/wiki/Grimoire)
- [FrozenCookies (auto-combo add-on)](https://github.com/Darkroman/FrozenCookies)
- [Cookie Clicker Steam discussions on the endgame](https://steamcommunity.com/app/1454400/discussions/0/3421061982937708980/?ctp=2)
- [Universal Paperclips vs Cookie Clicker](https://dinogame.gg/blog/cookie-clicker-vs-universal-paperclips/)
- [Universal Paperclips (Wikipedia)](https://en.wikipedia.org/wiki/Universal_Paperclips)
- [Incremental game (Wikipedia)](https://en.wikipedia.org/wiki/Incremental_game)
- [How to Design an Idle or Incremental Game (Bugnet)](https://bugnet.io/blog/how-to-design-an-idle-or-incremental-game)
- In-repo: `docs/economy.md`, `src/data/legacy.ts`, `src/engine/drops.ts`, `src/engine/clicker.ts`, `src/engine/stories.ts`, `src/engine/prestige.ts`, `src/engine/tournament.ts`, `src/engine/game.ts`
