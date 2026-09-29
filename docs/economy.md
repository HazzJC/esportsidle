# Economy

Where the money in Esports Idle comes from, how fast it comes, and what to change next. The numbers are measured by playing the real engine, not modelled. This is the one living write-up: update it after a balance pass instead of adding a dated audit doc. The history of earlier passes is in `PATCH_NOTES.md`.

**Current baseline:** `npm run sim` at commit `6a0d247` plus the uncommitted simulator changes, 29 Sep 2026. Five seeds per persona. The full tables are in `output/sim/full/report.md` and `report.html`; the purchase audit is in `output/sim/full/paybacks.md`. Both are regenerated, not committed.

## How it is measured

`scripts/sim/` plays the engine second by second as a simulated player (a *persona*). Every ten simulated minutes it records:

- cash booked to each income source;
- the share of it that temporary buffs added;
- the sponsor, fame and superfan multipliers;
- spending by kind;
- crowds, chains, and drops seen and caught.

| persona | how it plays | clicks | Hype Drops | buys |
| --- | --- | --- | --- | --- |
| `active` (**the balance target**) | acts every 20–30 s | 5 min of steady clicking, then fills the meter for a crowd about every 10 min | notices 85%, clicks after 1–6 s | like a person: noisy judgement, sometimes skips a category, saves up for a favourite |
| `semi` | 10 min like `active`, then 50 min with the tab open and ignored, every hour | active stretches only | active stretches only | like a person; routines on |
| `casual` | four sessions a day (20/15/30/20 min), game closed between | a burst per session | notices 70% | like a person; routines on |
| `idle` | open all day, looks every 10–15 min | tutorial only | only those on screen when it looks | like a person; routines on |
| `optimal` | every 20 s, never stops clicking | 5/s | all, instantly | exact payback (the ceiling) |

Every persona follows the tutorial closely, as a new player does.

```bash
npm run sim:quick     # active, semi, idle x 2 seeds x 3 h, about 30 s: use while tuning
npm run sim           # the full matrix: 34 runs, about 5-9 minutes on 18 workers
npx tsx scripts/sim/report.ts output/sim/after --compare=output/sim/before
npx tsx scripts/sim/paybacks.ts output/sim/full/active-1.json
```

- **Targets:** `scripts/sim/targets.ts` holds the design targets; the report marks each one pass or fail.
- **Seeds:** runs are deterministic per seed. The five seeds agree closely (the active player's first Legacy point lands between 1h17 and 1h25), so one seed is enough for quick comparisons.
- **Estimates:** the buff-uplift columns are estimates. They split the extra income among the active buffs in proportion to log(multiplier).

## Targets

| | target | now |
| --- | --- | --- |
| FAIL | Active player's first Legacy point at 2h45–4h (about 3 hours, like Cookie Clicker's first ascension) | **1h22** median (1h17–1h25) |
| PASS | A Crowd Goes Wild about every 10 minutes for the active player | 5.6 an hour |
| PASS | Merch 10–40% of an active run (to the first Legacy point) | 24% |
| PASS | Matches 10–50% of an active run (to the first Legacy point) | 20% |
| PASS | Active play at least 1.5× faster to the first Legacy point than idling | 4.2× (idle: 5h43) |
| PASS | No source over 90% of any run | largest 79.5% (matches, a 12-hour semi run) |
| FAIL | No 10-minute window after the first 30 min over 90% one source | 7.6% of windows, all operations, in `semi` and `idle` |
| FAIL | Selling an hour after the first Legacy point beats staying by 1.5× over 3 hours | **staying wins ~10×** (sell ÷ stay: 0.04–0.19) |

## Pace

Run 1 with no Legacy, median of five seeds (min–max). Casual times are wall-clock, with the time the game was actually open after the comma.

| persona | tutorial done | first sponsor | merch | $1e9 | first Legacy point | $1e15 |
| --- | --- | --- | --- | --- | --- | --- |
| active | 2m | 13m | 28m | 39m | **1h22** (1h17–1h25) | 2h10 |
| semi | 2m | 1h01 | 2h01 | 2h09 | **3h51** (3h35–4h10) | 5h09 |
| idle | 14m | 50m | 1h44 | 3h08 | **5h43** (5h29–6h00) | 8h39 |
| casual | 2m | 14m | 4h31 (21m open) | 10h01 (36m open) | **13h31** (1h06 open) | 24h01 (1h26 open) |
| optimal (ceiling) | 2m | 11m | 23m | 26m | **53m** (45m–56m) | 1h11 |

- **The active player is about 2.3× too fast** against the three-hour target, and remarkably consistent across seeds.
- **Everything after $1e9 compresses:**
  - It takes 40 minutes to reach $1e9 and another 43 to reach the first Legacy point ($1e12).
  - Income grows about 100× every 30 minutes from the 1-hour mark: $5.7e7/s at 1h, $6.9e9 at 1h30, $2.4e11 at 2h.
  - Cookie Clicker spends much longer between 1e9 and 1e12.
- **The semi player (3h51) is closest to the target by accident:** most of its hour is spent idle.
- **The casual player reaches its first point on day one**, with 66 minutes of actual play. Offline progress at 20% carries it.

## Restart pressure

Each active seed was played to an hour after its first Legacy point (about 2h25), then played for three more hours in two ways:

- **stay**: remain in the same run;
- **sell**: sell for the 13–24 points waiting, spend them, and replay.

| | Legacy after 3 more hours (level + pending), five seeds |
| --- | --- |
| stay | 464, 839, 887, 1,025, 1,848 |
| sell | 69, 71, 80, 88, 166 |

**Staying is about ten times better**, and selling early is a real mistake. This is the core problem behind the pace and the restart targets alike:

- **A run never levels off.** Income grows about 100× every 30 minutes from the first hour to the sixth, because prices fall behind income (the purchase table below shows paybacks getting shorter as the run goes on).
- **Legacy is `cbrt(earnings / 1e12)`**, so another 3 hours at ×100 per half hour multiplies Legacy ×100.
- **A sale buys too little to compete:**
  - +13–24% income from Legacy levels;
  - ×1.1 from the free root node;
  - a few cheap nodes.
- In Cookie Clicker, a run slows to a crawl (building prices ×1.15 each, and upgrades run out), so ascending wins. Here the player should just never sell.

This one number is what "save 1 should not be viable forever" needs to move. Tuning item 1 below is aimed at it.

## Where the money comes from

Share of run 1 income, mean of five seeds:

| persona | span | operations | matches | merch | clicks | drops | sponsor goals | quests | Invitationals & events |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| active | to 1st Legacy | 48% | 21% | 24% | 0.1% | 1.3% | 5.0% | 0.9% | 0.1% |
| active | 6 h | 13% | 39% | 34% | 0.0% | 12% | 1.7% | 0.0% | 0.2% |
| semi | 12 h | 8% | **71%** | 19% | 0.0% | 0.5% | 1.7% | 0.0% | 0.0% |
| casual | 72 h | 15% | **66%** | 11% | 2.3% | 4.7% | 0.9% | 0.0% | 0.2% |
| idle | 10 h | 33% | 53% | 10% | 0.0% | 0.0% | 3.6% | 0.0% | 0.0% |

How the active player's mix moves (every ten minutes, mean of five seeds):

| time | income/s | ops | matches | merch | drops | quests | crowd adds | frenzy adds | fame × |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 10m | 52 | 86% | 6% | 0% | 1% | 0% | 5% | 4% | 1.2 |
| 30m | 1.3e5 | 42% | 6% | 0% | 0% | **48%** | 3% | 11% | 1.7 |
| 1h | 5.7e7 | 48% | 17% | 15% | 3% | 3% | 12% | 21% | 3.3 |
| 1h30 | 6.9e9 | 34% | 19% | 37% | 3% | 0% | 22% | 15% | 6.7 |
| 2h | 2.4e11 | 28% | 26% | 37% | 4% | 0% | 24% | 2% | 13 |
| 3h | 4.4e13 | 18% | 24% | 40% | 16% | 0% | 28% | 5% | 21 |
| 6h | 1.4e18 | 11% | 34% | 27% | 22% | 0% | 21% | 8% | 89 |

- **Matches are the runaway of long runs.** Their share climbs steadily in every persona that plays for more than a few hours. In the semi player's run it goes 5% → 22% → 44% → 64% → 78% at hours 1, 3, 6, 8 and 10. It is under the 90% line in a fresh run, but it is the same trend that ends at 98% in the late-game save (below). The match prize contains a share of total income (`income × (0.8 + 0.05 × min(tier, 10))`), and more teams and higher tiers stack on top of it.
- **Operations fade to about 10% by hour 6.** An idle game's buildings end up as the smallest line; in Cookie Clicker they are the economy.
- **Quest cash is half of all income around 30 minutes.** Early quest rewards pay 8–30 minutes of income, at a point where that is a lot. It is harmless, but it is the biggest single jump in the opening.
- **Crowds are worth something.** The crowd buff adds 20–28% of the active player's income from 1h30 on. Direct click cash stays near zero, which is fine: clicking buys crowds, not coins.
- **Fame is a quiet giant.** The fame multiplier alone is ×21 at 3 h and ×89 at 6 h (×815 in a 72-hour casual game). It is a multiplier on everything, so its growth is a large part of why the active run compresses.

## What each system is worth

The active persona on seed 1, with one system switched off (`--variant`):

| switched off | first Legacy point | slower by | merch share | matches share |
| --- | --- | --- | --- | --- |
| nothing | 1h25 | | 38% | 41% |
| clicking (crowds) | 2h17 | +61% | 33% | 25% |
| Hype Drops | 2h08 | +51% | 29% | 47% |
| teams | 2h00 | +41% | 61% | 2% |
| merch | 1h37 | +14% | 0% | 74% |

- **Every system matters, and none is a crutch.**
- **Clicking and drops are the largest levers**, which suits an active game.
- **Without merch, matches take 74%** and would pass 90% in a longer run. The two big active systems currently balance each other, and neither has a ceiling.

## Purchases and paybacks

Median payback of what is in the store (cost ÷ income added), from the active persona's seed-1 saves:

| kind | 30m | 1h | 2h | 2h25 | 3h |
| --- | --- | --- | --- | --- | --- |
| operation | 9m | 18m | 6m | 3m | 3m |
| upgrade | 16m | 26m | 15m | 39m | 18m |
| staff | 16h | 12m | 3m | 1m | 2m |
| gear | – | – | 7m | 1m | 2m |
| merch finish | – | 22m | 20m | 6m | 7m |

In Cookie Clicker, paybacks lengthen as a run goes on. Here they **shorten** after the first hour (operations 18m → 3m, staff 12m → 1–2m). Income outgrows prices, which is the same compression the pace table shows.

Outliers the audit flags:

- **Gear is nearly free on every team but the newest.** A whole team's next gear tier costs under a second of income and pays back in under ten seconds (26–32 items at 2h25 and 3h). The active player made 41,000 gear purchases in five runs. At the same moment, the newest game's first gear tier pays back in 4–21 hours. Gear is priced from the game's `costScale`, not from what the team earns, so it is either trivial or pointless and never a decision.
- **Gear for a team that cannot play yet does nothing**: Counter-Stroke gear at 1h, before its lineup is complete.
- **Snack upgrades are 12–22× worse than their peers**: Gamer Fuel Powder pays back in 6h at 30m, Ambrosia Energy in 3h at 2h. A flat +2–5% of income at 7–9 minutes of income is a poor deal next to operation tiers.
- **Operation tier upgrades can be 19× better than the median**: Clip Buttons pays back in 2 minutes. This is expected Cookie Clicker behaviour for a building the player owns a lot of.
- **Staff get cheap fast**: Coach #169 and Analyst #129 at 2h25 each cost under a second of income. Staff costs grow 12–15% per hire, and income outruns that.

At the first sale, Legacy is worth this per point: Legacy of Champions ×1.10 for 1 point, Old Money ×1.15 for 5, Legendary Fanbase ×1.25 for 10. Heritage and Endowment show nothing until the org has Legacy levels, as intended.

## Late game (the reference save)

From `tests/fixtures/lategame-save.txt`: 12 sales, Legacy level 5.5e12, 1.8e50 lifetime earnings. The budgets live in `tests/slow/lategame-audit.test.ts`, eight of them `it.fails`; run `npx tsx scripts/lategame-audit.ts` for the full tables.

- **Matches are 98% of steady income** since `a01e3c3` made prize multipliers cover the whole prize. Dynasty Pedigree has no ceiling (152 ranks, ×7.1), so a veteran's prize stack is ×37 against the ×15 a fresh run can reach.
- **The Legacy level term is a straight line**: income ×(1 + level × 2%) with level = cbrt(earnings / 1e12). It is worth ×1.1e11 in the save, 11 orders of magnitude above every other source, and no Legacy node matters next to it.
- **Talent Agents are uncapped**: 600 hires multiply sponsor income ×59, so contracts are worth ×62. The next agent pays back in about two seconds. (A comment in `economy.ts` still says sponsor bonuses are capped; the cap was removed.)
- **Merch swings 480× between its worst and best case** (stale and off-trend vs. a fresh design, on trend, with a Spotlight and a mania).
- **For the veteran, staying is nearly as good as selling**: the reference org's next sale adds 2% to its Legacy.

## Bugs found

- **"The big exit" quest can never be completed.** `sell_org` counts `stats.orgsSold` in delta mode, but `sellOrg` wipes the quest board (`prestige.ts:384`) before it increments `orgsSold` (`:398`). The quest's baseline therefore resets at exactly the moment it would complete. Its +3 Legacy and 10 trophies are unreachable.

## Proposed tuning (not applied)

Ranked by impact on the targets. Each should be followed by `npm run sim:quick`, and by `npm run sim` before committing.

1. **Make a run level off, which fixes pace and restart pressure together.**
   - Income should stop outgrowing prices somewhere after the first Legacy point, so paybacks lengthen instead of shortening. The restart check (sell ÷ stay) is the measure: aim for 1.5× or better.
   - Stretch the middle rather than the start. The opening (tutorial, first sponsor, merch by 30 min) feels right.
   - It is $1e9 → $1e12 that takes 43 minutes. Levers, in order of preference:
     - soften the fame curve, which is ×3 at 1h and ×13 at 2h;
     - raise operation and upgrade price growth for the upper tiers;
     - make the upgrade tiers bite later (Cookie Clicker's unlock counts at a higher cost).
   - Changing `LEGACY_DIVISOR` alone would move the goalposts without fixing the compression. It also shifts every Legacy balance downstream.
2. **Put a ceiling on matches.**
   - Make the income-share part of the prize taper with the number of teams, or cap the income share per team.
   - Cap Dynasty Pedigree.
   - Target: matches under 60% of a 12-hour semi run, and the late-game budget "matches ≤ 90%" flipping to passing.
3. **Price gear from what the team earns**, e.g. a floor of N seconds of that team's match income. Every gear tier should then be a real choice with a payback in minutes, instead of free on old games and hopeless on new ones.
4. **Give operations a late role.**
   - They fall to about 10% of income by hour 6.
   - Cookie Clicker keeps buildings central through synergy and tier upgrades that keep coming. Extend the operation tier ladder or add per-operation fame synergies, so the base the multipliers sit on keeps growing.
5. **Fix `sell_org`**: check the quest before the board is wiped, or count the sale into the new run's quest.
6. **Rework the Legacy level term for the long game.** Use a log or sqrt of level, or a capped per-level %, so selling keeps paying for veterans and staying in save 1 stops being viable (see the restart check above).
7. **Cap Talent Agents** with the same soft cap coaches have.
8. **Make snack upgrades worth buying**: +2–5% at their prices is 12–22× worse than anything next to them. Either cheaper, or ×1.1–1.25.
9. **Merch**: keep its 24–40% share, but narrow the best/worst swing (mania × spotlight × trend × novelty stack multiplicatively).
