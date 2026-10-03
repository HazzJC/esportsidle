# Economy: how the rules work now

This describes how money, fans and rewards behave in the game today. It does **not** carry balance targets or measured pace tables: the old ones were retired (see `docs/archive/README.md`), and the game is tuned by playing it. Keep this page to the rules; when a rule changes, change it here and add a `PATCH_NOTES.md` entry.

## Principles

- **Nothing stops adding.** No source of income ends at a hard ceiling. Where something has to slow down, it slows on a curve that never reaches zero, and the player is shown the curve.
- **Rewards are never worthless and never break a run.** A reward scales with how far into the run the org is, so an early one is a bump and a late one is worth catching.
- **Prices follow income, but never hype.** Anything priced from income uses base income (below), so a crowd, a frenzy or a scandal changes what you earn and never what things cost.
- **Say what is happening.** Anything that slows or levels off has a meter, a tooltip or a line of text that names it.

## Fans and fame

Fame multiplies all income by `(1 + effective fans / 100) ^ fame power`, plus the fame bonus from later Fame upgrades and Legacy.

- **What a fan is worth** (`fanValue` in `engine/economy.ts`). The first fans each count in full. From 100 million fans a new fan counts for `sqrt(100M / fans)` of a fan, down to a floor of 0.01 at 1 trillion fans, and stays at the floor from there. It never reaches zero and nothing ever stops adding.
- **Effective fans** (`effectiveFans`) is the sum of what every fan is worth, so fame is continuous and always rising. Below 100 million fans it is exactly the fan count.
- **Stages** (`data/fanStages.ts`) name the road from the lobby to the team everyone knows: Lobby Regulars, Local Scene, Rising Streamer, Community Favourite, Internet Famous, Mainstream Star, Household Name, Global Phenomenon, Cultural Icon, Living Legend, Part of History, The Team Everyone Knows. `FanCurve.svelte` (Stats tab) shows the stage, what a new fan is worth and the curve.
- **Fame power** only ever rises through the first four Fame upgrades, to a ceiling of 0.13. Every later Fame upgrade multiplies the fame bonus, and the last four carry something extra: Cult Following opens the Fan Donations drop and lifts sponsor deals, Global Fandom and Fandom Singularity lift merch, Interplanetary Fandom lifts sponsor deals.
- **Superfans** scale with the trophy cabinet (`CABINET_PER_ACHIEVEMENT`). The first three are large, the six after are `LATE_SUPERFAN` each.

## Base income

`engine/baseIncome.ts`. Operations income with no temporary buffs, smoothed over about five minutes (`PRICE_INCOME_SECONDS`) and stored as `priceIncome`. Prices that read it: gear's price floor, a market reroll, a PR clean-up, a charity stream, tournament preparation, retention bids. It follows income slowly in both directions, so buying a building does not reprice everything in the same instant and a hype streak ending never makes something cheaper.

Gear's floor is measured in what the team's matches would earn at base income (`teamIncome` in `engine/players.ts`), with no popularity swing, win chance or injured starter in it.

Rewards that are minutes of income (drops, quests) are paid, not charged, and read the live base income (`rates.cpsNoBuffs`).

## Hype Drops and lump-sum rewards

`engine/rewards.ts`.

- **Cap by time into the run.** The most a drop can pay, in minutes of base income, climbs by band: 1 to 6 minutes in the first hour, 6 to 15 in the second, 15 to 30 in the third, 30 to 45 in the fourth, then ever more slowly (`DROP_CAP_ANCHORS`, `DROP_CAP_TAIL_MINUTES`).
- **Random within the cap.** A roll leans good: a bell curve around 70% of the cap, never below 25% (`dropRoll`).
- **Greater of income and bank.** A drop pays the greater of its minutes of income and a small share of the bank (Prize Pool 2%, Leak 3%, Fan Donations 2.5%, Hype Train 5%). The bank part may run to twice the cap and no further (`dropPayout`).
- **Early-game guard.** While any tab is still locked, a lump sum (drop, quest cash, investor) cannot be more than the price of one unit of the first building the org has never owned (`earlyRewardLimit`). It can fund the next step and never several steps at once.
- Good drop buffs that are caught twice add half of the new duration on top of what is left (`extend: 'half'`).

## Matches, Elo and engagement

- **Team Elo** (`engine/elo.ts`, constants in `data/leagues.ts`). Each tier is about 301 Elo apart. After every match a team's Elo moves by `K · (result − expected)` against its tier, so it settles at the level the roster really plays at and cannot be run up by beating weaker sides.
- **Promotion** at the end of a season needs Elo of at least the next tier's Elo minus `PROMOTE_MARGIN`. **Relegation** is below this tier's Elo minus `RELEGATE_MARGIN`. A title is still 15 or more wins in a season. Challenging up a new tier needs the same Elo.
- **Engagement** (`engagementMult` in `engine/mood.ts`) is a smooth curve peaking at a 55% win chance and falling toward a floor of 0.3 either side. It multiplies match prizes, fans, XP and Invitational purses, and players tire sooner the more lopsided the matches are.

## Offline

Full rate (20% base) for the window (6 hours base), then a rate that fades: the time past the window counts as `FADE · ln(1 + extra / FADE)` with `FADE` = 8 hours (`offlineCredit`). A longer absence always pays a little more. Offline rate and window bonuses past 40% and 12 hours still count, at a quarter and a half of their value (`softLimit`).

## The market

A scouting reroll costs 10 seconds of base income (never under $25), doubling with every reroll in a row. Five quiet minutes after the last one the price returns to the start, and every reroll restarts the wait (`REROLL_*` in `engine/market.ts`).

## Clicking and the crowd

- The first four click upgrades give flat cash per click (priced against the money around when they appear); the other eight give a small share of income per click.
- Clicks during a crowd keep filling the meter, and the next crowd starts on the next click once this one ends.
- A bubble chain's volume tops out at ×20, and every bubble past it still adds time.

## The first run: tutorial, quest line and unlocks

- **First win.** The tutorial's first win pays a one-off `FIRST_WIN_BONUS` ($85, `data/tutorial.ts`) on top of its prize, so a player who clicks only for what they need reaches the first Streamer with the hype meter about two-thirds full. The crowd going wild belongs to a later quest; clicking hard still gets there early.
- **The quest line is the spine of the first run.** It is followed strictly in order (`strictQuestLine`, `fillQuests` in `engine/quests.ts`): a quest whose requirement is not met yet holds the line, and the HQ console says what it is waiting for, with a meter when there is a number (`questLineWait`). Quests that wait on chance (`skipWhileLocked`, the rival) are passed over and come back.
- **Quests open the systems they teach.** The transfer market, Staff, the House, the Studio and Sponsors each name a quest (`SectionDef.quest` in `engine/sections.ts`). In the first run a tab opens when its quest is offered, and the quest is offered once the tab's own requirement is met ($500 in the bank, two players signed, a second team, 500 fans, 1,000 fans). After the first sale tabs open on their requirement alone; tabs that are open stay open.
- **Staff bring tools.** The first hire of several staff roles brings a tool for the rest of the run (`StaffDef.qol`): the Coach's game plan of next steps (on the Staff page), buying and hiring 10 at a time (Chef), Buy all upgrades (Scout), Max (Analyst), selling operations (Talent Agent), 100 at a time (Social Media Manager), one design on every merch line (Merch Designer). Until then the store and the Staff tab buy one at a time. The engine's own buyers (automation, the simulator) are not limited.

## Sponsors

- An org starts with **one sponsor slot** (`BASE_SPONSOR_SLOTS`). The first sponsor quest's perk adds a second; Legacy adds more.
- **The first deal ever** is a choice between three snack brands (`STARTER_DEALS` in `data/sponsors.ts`), each a tier 1 contract with its own perk and goal: Crunchy Chips (an easy wins goal, +morale), Doritoes (a fans goal, +fans) and Nacho Average Snacks (a Hype Drop goal that pays the largest share, +XP, the biggest income boost). Signing one sends the other two away and ordinary offers follow. A brand can carry its own perk in place of its category's (`BrandDef.perk`, `brandPerk`).
- While a deal runs it adds its share to all income and gives its perk; a goal met before it ends pays its bonus there and then. When it ends, or is ended early, the boost and perk stop, an unmet goal pays nothing, and there is no other penalty.
