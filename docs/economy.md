# Economy pass, September 2026

Where the money in Esports Idle actually comes from, measured rather than guessed, and what the
September balance changes did to it.

## How this was measured

The engine keeps an income ledger: every payment is tagged with the system that made it (`ops`,
`click`, `match`, `merch`, `sponsor`, `drop`, `quest`, `event`, `tournament`). The balance sim plays
the real engine and samples that ledger every ten minutes, so the tables below are the run's own
books rather than a model of them.

Three player models, each five hours with the game open:

| model | attention | clicks | Hype Drops | routines |
| --- | --- | --- | --- | --- |
| `active` | decides every 20s | first 10 minutes solidly | catches every one | off |
| `semi` | decides every 2 minutes | first 5 minutes, then a burst every 5 | the ones still on screen | off |
| `passive` | decides every 10 minutes | only enough to afford the first player | none | on |

```bash
npm run sim -- --mode=semi --hours=5 --income --json=run.json
npx tsx scripts/compare.ts before.json after.json
```

A caution that applies to every number here: the economy is exponential and the sim is a single
seed, so totals diverge chaotically between runs. Ratios, shares and orderings are stable; absolute
totals for one run are not.

## What the baseline showed

### 1. Sponsor goal bonuses were the biggest problem in the game

A goal paid `income/second × the contract's goal time`, regardless of when it completed. Late-game
orgs complete tier-4 and tier-5 goals the instant they sign, so the bonus was free money equal to up
to 40 minutes of income. From the baseline active run:

| at | brand | tier | held | payout | payout as seconds of income | share of everything earned while held |
| --- | --- | --- | --- | --- | --- | --- |
| 2h28m | Emiratez | 3 | 1s | 46.93 Qa | 19m 49s | 99.8% |
| 2h55m | Razr-Sharp | 4 | 1s | 23.12 Qi | 40m 0s | 99.9% |
| 4h3m | Tesler | 3 | 1s | 69.91 Qi | 20m 0s | 99.7% |
| 4h11m | G-Fuelish | 2 | 1s | 36.17 Qi | 10m 0s | 99.2% |

Nine of 25 goals in that run completed inside a minute. Across the three models a goal paid **58–61%
of everything the org earned while the deal ran**, and sponsors were 28% of a passive player's entire
income.

### 2. Clicking is irrelevant, and the hype meter was why

Manual clicking was 0.0% of run income for the active model and 0.5% for the semi model. Filling the
hype meter took 200 clicks against a 4%/second drain — roughly 40 seconds of unbroken clicking for a
30-second ×2 buff, so most players never saw a crowd.

### 3. Merchandise does not scale

Merch launches around two hours in and then stays flat as a share of income, even as product lines
are added. A passive player's merch share by interval, with the number of product lines beside it:

| interval end | merch share | lines |
| --- | --- | --- |
| 2h20m | 0.7% | 1 |
| 3h00m | 0.7% | 3 |
| 3h30m | 3.8% | 4 |
| 4h10m | 2.6% | 6 |
| 5h00m | 1.9% | 7 |

It peaks at about 13% of an interval for the active model around the two-hour mark and decays from
there. Merch revenue grows with fans and appeal; operations and prize money grow faster, so merch
falls behind however many lines are open. Worth its own pass.

## What changed

- **Sponsor goal bonuses** are now 25% of what the org earned while the deal ran, capped by the
  contract's headline value and scaled by how much of the goal time actually elapsed. A goal that
  completes the moment it is signed pays almost nothing; one that runs its full term pays well.
- **The hype meter** fills in about 50 clicks and drains at 2.5%/second after a longer grace period.
- **Crowd duration** scales with lifetime clicks and fans, and four fan-gated hype upgrades extend it.
- **The click chain** turns a crowd into a skill test: each hype bubble popped raises the multiplier
  and its duration, up to ×20 for 200 seconds.
- **Coaches and analysts** hit a soft cap at ten hires: identical up to that point, about half as
  strong by fifty, and 12% cost growth per hire instead of 15%.

## What it did

Comparisons are `before → after` from the same seed.

### Sponsors

| model | sponsor share of run income | a goal pays, as a share of what the org earned while it ran |
| --- | --- | --- |
| active | 4.4% → 5.1% | 57.8% → 9.8% |
| semi | 15.3% → 2.0% | 64.3% → 5.4% |
| passive | 27.8% → 2.3% | 61.1% → 18.6% |

The share of income barely moves for the active model, because that model was already earning most
of its money elsewhere. The number that matters is the second column: a sponsor goal is now paid for
what the org did while the deal ran, not for signing it. Deals that still complete quickly now pay
accordingly — from the active run, a goal finished in 63 seconds paid 2.6% of what was earned in
that window, where the equivalent before paid 99%.

A sample of goals after the change, with what each was worth:

| at | tier | held | payout as seconds of income | share of earnings while held |
| --- | --- | --- | --- | --- |
| 12m36s | 1 | 2m16s | 18s | 11.3% |
| 26m06s | 1 | 15m46s | 3m01s | 25.0% |
| 47m59s | 2 | 8m39s | 4m24s | 21.6% |
| 50m23s | 2 | 1m03s | 9s | 2.6% |
| 1h16m | 1 | 12m32s | 4m41s | 25.0% |

### Pacing

The early game is unchanged or slightly faster, because crowds are now reachable:

| milestone | active | semi | passive |
| --- | --- | --- | --- |
| tutorial done | 3m21s → 3m01s | 6m01s → 6m01s | 1h10m → 1h10m |
| market opens | 3m44s → 3m15s | 6m09s → 6m01s | 1h10m → 1h10m |
| first sponsor | 12m00s → 10m20s | 20m00s → 16m00s | 1h20m → 1h20m |
| merch launched | 24m20s → 22m40s | 44m00s → 38m00s | 2h10m → 2h10m |
| $1e9 earned | 39m22s → 39m40s | 1h09m → 1h02m | 2h54m → 3h04m |
| first legacy point | 1h30m → 1h33m | 2h17m → 2h06m | 4h32m → 5h06m² |
| $1e15 earned | 2h04m → 2h48m | 3h50m → 3h30m | never → never |

² measured on an eight-hour passive run; it falls outside the five-hour window.

The semi-engaged player — the one most likely to be a real player — is about 10% faster to every
milestone, because the hype meter is now reachable in short bursts and a crowd is worth chasing.
The passive model is slower late, which is the point: a third of its income used to come from
sponsor bonuses it did nothing to earn, and its first prestige moves out by about half an hour.
The active model, which catches every drop and clicks through the opening, gives up about 45
minutes on the way to $1e15 and gains four minutes at the start.

### Progression checks

Every model still reaches every system, in order: tutorial, market, second game, gear, staff,
sponsors, merch, promotions, quests. The `--income` report prints this checklist at the end of a run
so a regression here is loud rather than silent.

## Still open

- **Hype Drops are the next thing to look at.** They are 27% of the active model's income, second
  only to prize money, because drop payouts scale with current income and that model catches every
  single one. It is an upper bound rather than a typical player, but the drop payout curve deserves
  the same treatment sponsors just had.
- **Merch needs a scaling pass**, as above.
- **Clicking is still a rounding error** in cash terms after the first ten minutes. That is defensible
  for an idle game — clicking now buys crowds rather than coins — but if clicking should pay, the
  click line needs to scale with income rather than with upgrades alone.
