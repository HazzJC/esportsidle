# The first-run quest line: a guided story in six chapters

The first run is told as a story. A quest line on the HQ console walks the player through every system one at a time, and the systems themselves stay asleep until their quest arrives, so nothing turns up before something has explained it. This page is the design; the data lives in `src/data/quests.ts` (`QUESTS`, `CHAPTERS`, `QUEST_TOOLS`) and the wake rules in `src/engine/firstRun.ts`.

It applies to a **guided first run**: an org's first run when the player did not skip the tutorial (`guidedRun`). Later runs, and orgs that skipped the tutorial, have every system awake from the start, and their quest line passes over anything not available yet.

## 1. The shape

- **Chapters.** Six of them, each with a title and a line of story shown above its first quest. The first chapters are short steps a minute or two apart; the later ones are goals to work towards, each with a meter.
- **One quest at a time, in order.** A quest that cannot be offered yet holds the line, and the console says what it is waiting for, with a meter when there is a number.
- **Each reward leads into the next quest.** A perk for the system just learned, or a tool or token for the next one (Scout's choice for the Market, a PR shield for Drama Drops). A quest that wakes a system shows it as "Unlocks: …" under its reward, and a quest whose successor opens a tab says "opens …" next to "Next".
- **Systems wake with their quest** (`awake` in `engine/firstRun.ts`):

| Wakes | When | Before then |
| --- | --- | --- |
| Hype Drops | "Hype streak" claimed | none fall |
| Invitational invites | "Invitational winners" offered (the first drop after it is the invite) | drops never carry one |
| Decisions | "A tough call" offered (one arrives within seconds) | none fire |
| Drama Drops | "A tough call" claimed (its PR shield covers the first bad one) | none fall |
| Other world events | "Branch out" claimed | none fire |
| The rival | "Grudge match" offered | none appears |
| Illness and injury | "Best on the field" claimed | none (the tutorial's one injury apart) |
| Merch | "Merch drop" offered, at 25,000 fans | the Studio's merch store stays locked |
| Found team cards, the Coach's "found a team" goal | "Branch out" offered | hidden |
| Trophy spending (operation levels, trophy upgrades) | the Trophies tab opens | hidden |
| Drop tier, Challenge, Auto-promote, Auto-sub | "League champions" claimed | hidden |
| Promotion out of a league | the org's first title (a title season can promote) | a team ready to go up stays and dominates |
| Front Office routines | "Front office" offered | hidden |
| Move-house cards | the House tab opens | the org moves quietly |
| Achievement popups | the Trophies tab opens | held, then shown together |

Tabs still open with their quest (`SectionDef.quest`), and the next tab-opening quest waits until the last new tab has been visited. The two-minute breather after a new tab only applies while that tab's own quest is unclaimed, which the strict line never leaves it in, so in practice the line moves on as soon as the player has finished with the tab.

## 2. The line

| # | Quest | Teaches | Reward (pick one) · also paid | Leads into |
| --- | --- | --- | --- | --- |
| | **1. Garage days** | | | |
| 1 | Grinder squad | operations | Grinders ×2 | upgrades |
| 2 | Read the patch notes | upgrades | Clicks ×2 | clicking fills the meter |
| 3 | Hype streak | clicking | Crowd 50% longer · *unlocks Hype Drops* | the first drop |
| 4 | Catch the drop | drops (the promised drop is always a plain Prize Pool) | Drops 20% more often | |
| 5 | Gear up | gear | +2 levels | a title |
| | **2. Making a name** | | | |
| 6 | League champions (credits a title already won) | league titles | 2 trophies · *unlocks team controls* | trophies to spend |
| 7 | Trophy room (opens Trophies) | trophies | Players +10% XP / 3 trophies · Scout's choice | a star on the Market |
| | **3. Building a squad** | | | |
| 8 | Scout the market (opens Market) | scouting | +1 bench seat | the signing sits on the bench |
| 9 | Best on the field | lineup | Players tire 10% slower / +2 levels · *unlocks injuries* | |
| 10 | Hire help (opens Staff) | staff | Staff 10% cheaper | the Coach's plan |
| 11 | Have a plan | season plans | +2 levels / +15% XP | |
| 12 | Branch out | teams | Prize +10% / fans · *unlocks world events* | a home for two teams |
| | **4. The brand** | | | |
| 13 | Make it home (opens House) | decor | Gear 15% cheaper / fans | |
| 14 | Design a shirt (opens Studio) | jersey | +10% fans / Content Creator affinity | fans bring sponsors |
| 15 | Take the money (opens Sponsors) | sponsors | +1 sponsor slot / fans | |
| 16 | Deliver for the sponsor | sponsor goals | Sponsor meeting / sponsor income +15% | |
| 17 | A tough call | decisions | PR shield · *unlocks Drama Drops* | |
| 18 | Merch drop (a line with a design) | merch design | Trend tip / fans | |
| 19 | Price it right (a selling line at its sweet spot) | merch pricing | Merch +20% / Platform affinity | |
| | **5. The circuit** | | | |
| 20 | Invitational winners | Invitationals | Wildcard invite / prizes ×1.5 | |
| 21 | Grudge match | the rival | Rival file / fans | |
| 22 | Moving up (a promotion from when it is offered) | promotion | Team ratings +3% / 5 trophies | |
| 23 | Business is business (credits a sale already made) | player sales | Fees 15% cheaper / 3 trophies | |
| 24 | Landmark (the next new kind of building) | the empire | +5% income / 5 trophies | |
| 25 | Front office | automation | Upgrades 10% cheaper / 5 trophies | |
| | **6. The big exit** | | | |
| 26 | The big exit (opens Legacy) | the sale | 3 legacy / 10 trophies | the next run |

No quest pays cash: while any tab is locked, a lump sum is capped at one new building's price (`earlyRewardLimit`), which made cash the option nobody took.

## 3. Quest mechanics

- **Credit** (`QuestDef.credit`). A milestone a quick org can reach just before the line arrives (a league title, selling a player) counts if it happened earlier in the run. The console says "You did this before the quest arrived". Quick actions (filling the crowd, buying gear) are asked for again, since repeating them costs seconds.
- **Meters** (`QuestDef.meter`) for yes-or-no quests that take a while: wins this season for a title, Elo against the promotion line, the closest sponsor goal, cash towards the next building, the climb to a first sale.
- **Tips** (`QuestDef.stuck`). After five minutes live (`STUCK_SECONDS`), the console offers one concrete step.
- **Ready stays ready.** Once a quest has been announced as done it can be claimed, even if its condition slips (a merch price off its sweet spot after the trend changes).

## 4. Quest tools

`QUEST_TOOLS` in `data/quests.ts`, read with `hasTool` / `useToken`:

| Tool | Kind | What it does | Read in |
| --- | --- | --- | --- |
| Scout's choice | token | A pinned star prospect for the flagship team, the moment the Market is open | `engine/market.ts` `placeScoutsChoice` |
| Sponsor meeting | token | The next batch of offers includes one from the highest tier the org qualifies for | `engine/sponsors.ts` `refreshOffers` |
| PR shield | token | Buries the next scandal, outage or backlash | `engine/drops.ts` `clickDrop` |
| Wildcard invite | token | The next Hype Drop is an Invitational invite | `engine/drops.ts` `forcedOutcome` |
| Rival file | tool | +10 points of win chance in grudge matches | `engine/teams.ts` `playMatch` |
| Trend tip | tool | The Studio shows the next merch trend | `engine/merch.ts` `rotateTrend`, `Studio.svelte` |

## 5. How positions were checked

Each quest should usually arrive before the player has done its thing. The simulator (`npm run sim`) records when each quest arrives and marks it `(credited)` if it was already done: `quest title_1`, `quest title_1 (credited)`. It also records `first title`, `first promotion` and `first crowd` for comparison. Read across several seeds, these show whether a quest is placed after the moment most players would reach it anyway. They are notes to look at, not targets: nothing passes or fails on them.

What that showed when the line was laid out:
- A first promotion usually lands at the same season end as the first title, so "Moving up" sits in chapter 5 and counts from when it is offered, and promotion out of the first league waits for the first title.
- An active player claims a quest a minute or two apart in chapters 3 and 4, and spends longer in chapters 2 and 5, where the meters are.

## 6. Orgs from the old line

`engine/questMigration.ts`, run once on load (flag `questline2`):
- A reward pick that means something else today is carried as the perk it paid, in `quests.carried`.
- Quests now earlier than the furthest one an org had claimed are marked done.
- Quests that have left the line (`level_10`, `ops_100`, `tier_5`) come off the board.
