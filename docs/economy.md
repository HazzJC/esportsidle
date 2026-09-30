# Economy

Where the money in Esports Idle comes from, how fast it comes, and what to change next. The numbers are measured by playing the real engine, not modelled. This is the one living write-up: update it after a balance pass instead of adding a dated audit doc. The history of earlier passes is in `PATCH_NOTES.md`.

**Current numbers:** after the plateau pass (phase 2 of the refinements, 30 Sep 2026). `npm run sim`, five seeds per persona. The pre-refinement baseline (29 Sep) is kept in `output/sim/baseline` for `--compare`; its numbers appear below as "was". The full tables are in `output/sim/full/report.md` and `report.html`, and the purchase audit is in `output/sim/full/paybacks.md`. Both are regenerated, not committed.

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
npm run sim           # the full matrix: 39 runs, about 2.5 minutes on 18 workers
npx tsx scripts/sim/report.ts output/sim/after --compare=output/sim/before
npx tsx scripts/sim/paybacks.ts output/sim/full/active-1.json
```

- **Targets:** `scripts/sim/targets.ts` holds the design targets; the report marks each one pass or fail.
- **Seeds:** runs are deterministic per seed. The five seeds agree closely (the active player's first Legacy point lands between 1h26 and 1h46), so one seed is enough for quick comparisons.
- **Estimates:** the buff-uplift columns are estimates. They split the extra income among the active buffs in proportion to log(multiplier).

## First sale opens with the final building (30 Sep 2026)

Since  the first sale waits for the first Multiverse Championship, and  is 1e18, so the first point arrives with it and ticks up. Full matrix (, five seeds, runs long enough for every persona to reach the end of the ladder):

| persona | first Legacy point | time the game was open |
| --- | --- | --- |
| active | **3h55** (3h30–4h14): target 3–4 h, **PASS** | all of it |
| semi | 10h02 (9h05–10h06) | about 1h40 active |
| casual | 37h48 wall-clock (37h31–48h02) | 2h48 |
| idle | 14h53 (13h25–14h56) | open, rarely looked at |
| optimal (ceiling) | 2h12 (1h08–2h20) | all of it |

- Points tick up rather than arrive as a pile: an active org has 1–3 points waiting at 4 h, 6–17 at 5 h, 24–35 at 6 h, and about 100 at 8 h.
- **Levels off:** income growth in the 3 h after the first point fell from ×2.5e8 to ×8.6e4, because the point now lands where the building ladder flattens. That is still above the ×100 target.
- **Staying still beats selling** (sell ÷ stay 0.07–0.12), because a first sale is only 1–3 points. Early Legacy has to become worth taking; that is the next phase.
- **Mix:** no source above 52% of any run, and matches are 42% of a 16-hour semi run.

The sections below describe the plateau pass (before the gate).

## Targets

| | target | now | was |
| --- | --- | --- | --- |
| FAIL | Active player's first Legacy point at 2h45–4h (about 3 hours, like Cookie Clicker's first ascension) | **1h31** (1h26–1h46) | 1h22 |
| PASS | A Crowd Goes Wild about every 10 minutes for the active player | 5.5 an hour | 5.6 |
| PASS | Merch 10–40% of an active run (to the first Legacy point) | 15% | 24% |
| PASS | Matches 10–50% of an active run (to the first Legacy point) | 14% | 20% |
| FAIL | A run levels off: income grows at most ×100 in the 3 h after the first Legacy point | ×2.5e8 | ×2.7e7 |
| PASS | Matches under 60% of a 12-hour semi run | 40% | **71%** |
| PASS | Active play at least 1.5× faster to the first Legacy point than idling | 4.1× (idle: 6h10) | 4.2× |
| PASS | No source over 90% of any run | largest 63% (operations, idle) | 79.5% (matches) |
| FAIL | No 10-minute window after the first 30 min over 90% one source | 10.5%, all operations, almost all `idle` and `semi` | 6.5% |
| FAIL | Selling an hour after the first Legacy point beats staying by 1.5× over 3 hours | **staying wins ~12×** (sell ÷ stay 0.06–0.10) | ~10× |

The "levels off" growth figure is higher than before only because the first Legacy point now lands later, where the building ladder is steepest. See the restart section.

## Pace

Run 1 with no Legacy, median of five seeds (min–max). Casual times are wall-clock, with the time the game was actually open after the comma.

| persona | tutorial done | first sponsor | merch | $1e9 | first Legacy point | $1e15 |
| --- | --- | --- | --- | --- | --- | --- |
| active | 2m | 13m | 30m | 40m | **1h31** (1h26–1h46), was 1h22 | 2h36 |
| semi | 2m | 1h01 | 2h01 | 2h07 | **4h28** (4h01–4h49), was 3h51 | 7h07 |
| idle | 15m | 52m | 1h50 | 3h04 | **6h10** (6h00–6h30), was 5h43 | not within 10 h in 3 of 5 seeds |
| casual | 2m | 15m | 4h34 (24m open) | 10h01 (36m open) | **13h39** (1h14 open) | 34h01 (2h01 open) |
| optimal (ceiling) | 2m | 11m | 24m | 27m | **57m** (40m–59m) | 1h29 |

- **The active player is still about 2× too fast.** The opening (tutorial 2m, first sponsor 13m, merch 30m) is right. It is $1e9 → $1e12 (40m → 1h31) that is short. This is phase 3.
- **The casual player reaches its first point on day one**, with 74 minutes of actual play; offline progress at 20% carries it.

## Restart pressure

Each active seed was played to an hour after its first Legacy point, then for three more hours in two ways: **stay** in the same run, or **sell** for the points waiting, spend them and replay.

| | Legacy after 3 more hours (level + pending), five seeds |
| --- | --- |
| stay | 1,998, 2,158, 2,268, 2,389, 4,231 |
| sell | 181, 183, 201, 231, 234 |

**Staying is still about twelve times better.** The plateau pass removed the runaway multipliers, but the growth that is left is Cookie Clicker's own building ladder:

- Base operations income (buildings × tier upgrades) grows ×55, ×164 and ×79 in hours 2, 3 and 4 of an active run.
- It only flattens (×3 an hour) once the last building, Multiverse Championship, is reached around hour 5–6.
- The first Legacy point lands in the middle of that climb. Another three hours multiplies earnings ~1e8, so Legacy (cube root) ~500×.
- A sale buys too little to compete: a 6–25 point sale is +6–25% income, ×1.1 from the free root node, and a few cheap nodes.

In Cookie Clicker the first ascension also lands on the climb, but a heavenly-chip run starts far faster (+1% per chip once unlocked, starter kits, permanent upgrade slots, kept milk). The remaining lever is the Legacy side (phase 4): a first sale must make run 2 reach run 1's income within a fraction of the time.

## Where the money comes from

Share of run 1 income, mean of five seeds (was = before the plateau pass):

| persona | span | operations | matches | merch | clicks | drops | sponsor goals | quests | Invitationals & events |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| active | to 1st Legacy | 67% | 14% | 13% | 0.3% | 1.3% | 2.6% | 1.6% | 0.5% |
| active | 6 h | 24% (was 13%) | 27% (was 39%) | 26% (was 34%) | 0.0% | 22% | 1.1% | 0.0% | 0.5% |
| semi | 12 h | 34% (was 8%) | 41% (was **71%**) | 23% | 0.0% | 0.4% | 1.4% | 0.0% | 0.0% |
| casual | 72 h | 39% (was 15%) | 37% (was **66%**) | 19% | 0.0% | 2.4% | 1.5% | 0.0% | 0.5% |
| idle | 10 h | 58% | 31% | 8% | 0.0% | 0.0% | 3.5% | 0.0% | 0.1% |

How the active player's mix moves (every ten minutes, mean of five seeds):

| time | income/s | ops | matches | merch | drops | quests | crowd adds | frenzy adds | fame × | superfan × |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 10m | 47 | 88% | 5% | 0% | 0.6% | 0% | 5% | 9% | 1.2 | 1.0 |
| 30m | 8.7e4 | 43% | 4% | 0% | 0% | **48%** | 2% | 6% | 1.8 | 1.2 |
| 1h | 2.1e7 | 67% | 12% | 5% | 1% | 7% | 27% | 6% | 3.5 | 1.3 |
| 2h | 1.1e10 | 60% | 19% | 17% | 3% | 0% | 25% | 20% | 7.8 | 2.3 |
| 3h | 1.1e13 | 42% | 18% | 28% | 9% | 0% | 25% | 4% | 16 | 5.1 |
| 4h | 9.0e15 | 31% | 17% | 31% | 20% | 0% | 24% | 0% | 28 | 13 |
| 6h | 1.7e19 | 25% | 30% | 29% | 14% | 0% | 29% | 11% | 50 (was 89) | 37 |

- **No source runs away any more.** Operations lead early, then operations, matches and merch settle at about a quarter to a third each, with drops the fourth leg for an active player.
- **Quest cash is still half of all income around 30 minutes** (8–30 minutes of income per quest). Phase 3 trims it.
- **Superfan is the next quiet giant**: ×37 at 6 h. The cabinet grows with achievements, and a first run earns a lot of them. Worth a look alongside pace.
- **Crowds add a quarter of the active player's income**, which is what clicking is for.

## What each system is worth

The active persona on seed 1, with one system switched off (`--variant`):

| switched off | first Legacy point | slower by | ops | matches | merch |
| --- | --- | --- | --- | --- | --- |
| nothing | 1h26 | | 26% | 25% | 33% |
| clicking (crowds) | 2h50 | +98% | 30% | 19% | 42% |
| Hype Drops | 2h38 | +84% | 37% | 26% | 32% |
| teams | 2h09 | +50% | 39% | 2% | 56% |
| merch | 1h45 | +22% | 36% | 36% | 0% |

- Every system matters, and switching any one off hands its share to the others rather than to a single winner.
- Clicking and drops are the biggest levers: an active player is twice as fast as one who never clicks.

## Purchases and paybacks

Median payback of what is in the store (cost ÷ income added), from the active persona's seed-1 saves:

| kind | 30m | 1h | 2h | 2h33 | 3h |
| --- | --- | --- | --- | --- | --- |
| operation | 8m | 28m | 43m | 17m | 23m |
| upgrade | 25m | 2h27 | 1h03 | 59m | 1h14 |
| staff | 16m | 44m | 26m | 16m | 41m |
| gear | 2m | 2h31 | 1h41 | 54m | 53m |
| merch finish | 12m | 48m | 49m | 21m | 23m |

Paybacks now **lengthen** as the run goes on, as in Cookie Clicker. Before the plateau pass they shortened: operations fell from 18m to 3m, and gear to under 10 s.

- **Gear** is priced by the league the team has reached, so no team's gear is pocket change. The 41,000 gear purchases in five runs are gone.
- **Snack upgrades** are still 12–22× worse than their peers (+1–5% of income each). This is phase 3.
- **Gear for a team that cannot play yet does nothing** (a team before its lineup is complete). Minor.

At the first sale, Legacy is worth this per point: Legacy of Champions ×1.10 for 1 point, Old Money ×1.15 for 5, Legendary Fanbase ×1.25 for 10.

## Late game (the reference save)

From `tests/fixtures/lategame-save.txt`: 12 sales, Legacy level 5.5e12, 1.8e50 lifetime earnings. The budgets live in `tests/slow/lategame-audit.test.ts`: 18 pass and 4 are still `it.fails`. Run `npx tsx scripts/lategame-audit.ts` for the full tables.

- **Mix:** matches are 79% of steady income (was 98%) and operations 19%. The budgets "matches ≤ 90%" and "operations ≥ 5%" now pass. Pedigree levels off at ×2.
- **Talent Agents** level off at ×3 sponsor income, and the Agent budget passes. No operation line with 100+ owned repays in under 30 s any more.
- **Merch** swings 11.8× between neglected and cared-for (was 480×). The best case with a Spotlight and a mania is ×13.6 operations for a minute or two. Two budgets still fail: best ≤ 3× operations, and swing under 10×.
- **Legacy level term** is still a straight line worth ×1.1e11 (phase 4). An operation line is still worth up to 1.7% income per 1% more of it (the elasticity budget).
- **For the veteran, staying is nearly as good as selling**: the reference org's next sale adds 2% to its Legacy (phase 4).

## Bugs found

- ~~**"The big exit" quest can never be completed.**~~ Fixed: the sale pays it (`completeQuestOnSale`).

## Refinement plan

Phases from the approved plan; each is measured against `output/sim/baseline`.

1. ~~Bugs and truthful UI~~ done: "The big exit" pays on sale, and the sell screen and Legacy chip tell the truth.
2. ~~Stop the runaway~~ done (this page):
   - gear priced by league;
   - slower tier fans and a fame knee;
   - teams and merch lines share their income-linked earnings;
   - smaller merch spikes and a higher freshness floor;
   - caps on Team Managers, Talent Agents and Pedigree;
   - sponsor goals capped at 75% of the deal's earnings.
3. **Pace the first run to about 3 hours** by stretching $1e9 → $1e12:
   - fewer quest minutes;
   - fame's early curve;
   - prize and merch shares;
   - superfan;
   - snack upgrades worth buying.
4. **Make selling worth it**:
   - a tapering Legacy level bonus that is strong early (×2+ for 15–25 levels) and small for veterans (the level term under 1e6);
   - starter kits sized by Legacy;
   - the sell screen showing what run 2 gains.
5. **Lock it in**:
   - `npm run sim:check` as the gate for balance changes;
   - unit tests for the new rules;
   - the remaining late-game `it.fails` flipped.
