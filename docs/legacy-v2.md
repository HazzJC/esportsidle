# Legacy v2: design for review (WS2.1)

The detailed design behind WS2 in `docs/implementation-plan.md`, following `docs/ascension-review.md`. **Nothing here is built yet.** It is written for review: the stage table, the Path rules, the Heirloom list and the migration rules. Costs are **ratios** (a ladder), not final numbers; they are calibrated with the simulator once WS3 passes (a run has to level off before a cost ladder means anything).

## 1. The model in one paragraph

The **tree is permanent and additive**: you buy a node once and keep it, and most nodes add a *verb* (a mechanic, a slot, a tool) rather than a percentage. The **choices live in loadouts you refill at every sale**: one active **Path** (later two) and up to five **Heirlooms**. Paths are exclusive and swappable for free at each sale; **Path Mastery** makes switching interesting rather than lossy. Charters (once) and Mandates (per sale) stay as they are.

## 2. Stages

Each stage is one named cluster, in reach after one or two sales for the first eight or so sales. The first stage teaches the ladder with cheap steps; each later stage costs about 4–6× the one before.

| Stage | Name | Cost ladder (ratio to the cheapest Stage I node) | Unlocks (verbs first) |
| --- | --- | --- | --- |
| I | **Foundation** | 1, 3, 9, 25 | Legacy root; Heritage; the first Heirloom slot; Path slot I (empty until a Path is unlocked) |
| II | **Paths** | 60, 100, 160, 250 | Each of the four Paths, one node each; Path Mastery starts counting |
| III | **Bootcamp and Return** | 500 – 2,500 | Offline Bootcamp dispatch (A1); Analyst Desk forecast tape (A6); "Back in the building" |
| IV | **People** | 5,000 – 25,000 | Lineage schools and apprentices (A2); Nemesis and bounties (A3); Heirloom slot II |
| V | **Big Stage** | 50,000 – 250,000 | Finals calls and Crunch Time (A4); Path slot II |
| VI | **Unshackling** | 500,000+ | Early operations scale with late ones; Heirloom slots III–V |
| ∞ | **Dynasty** | repeatable | Today's Renown / Pedigree / Following / Academy ranks, plus a "next sale is worth ×2" prompt |

**Rule for every node:** its tooltip has a "what this unlocks" line and, when relevant, "depends on your Path". The tree shows a **Recommended next** chip on the cheapest node that unlocks a verb (Cookie Clicker's missing piece).

### 2.1 Where today's 45 nodes go

Grandfathered, not deleted: owned nodes keep working. Nodes marked *refund* are replaced by something better and refunded at migration (see §6).

| Today's node | Today's cost | Goes to | Notes |
| --- | --- | --- | --- |
| Legacy of Champions | 1 | I | the root, unchanged |
| Heritage, Endowment | 3, 25 | I | the Legacy level term; reshaped by WS3.3 |
| Old Money → Esports Oligarchy (+15% → ×2) | 5 – 5,000 | I – III | flat income; kept as filler between verbs |
| Seed Funding, Series A, IPO Money | 2, 20, 400 | I → **Heirloom** | *refund*: start cash becomes an Heirloom choice ("start with a run's first 10 minutes of cash") |
| Loyal Grinders (start ops), Loyal Staff | 8, 25 | I → **Heirloom** | *refund*: become Heirloom choices |
| Rocket / Counter-Stroke Charter (start teams) | 10, 60 | II | kept: they shape the run, not its speed |
| Offline 1–3 | 4, 40, 400 | III | *refund* where WS4 shrinks the effect (rate ≤ 0.4, window ≤ 12 h) |
| Family Home, Merch Archive, Franchise Player | 25, 35, 40 | II | "keep" verbs: good Stage II material |
| Hall of Fame Coaches (legends) | 80 | IV | becomes the root of Lineage (A2) |
| Proving Grounds (challenges) | 20 | II | kept |
| Drops 1–2, Tournament node | 5, 60, 30 | III | kept; the Analyst Desk sits next to them |
| Alumni Network (prize money ×1.25) | 4 | I | the root of the teams branch |
| Scouting, Scout bias, Scout trait | 8, 15, 25 | II (Scholar lane) | |
| Deep Bench, Mentorship, Winning Culture, Coach bench | 12, 20, 150, 18 | II (Purist and Scholar lanes) | |
| Brand Heritage, Household Name, Global Brand Portfolio | 15, 120, 250 | II (Dealmaker lane) | |
| Cult Merch | 150 | II (Content Empire lane) | |
| Clicks 1–2, Fame 1–2 | 3 – 100 | I – II | |
| Operations Manager | 30 | III | automation is a "return" verb |
| Gear ×3 | 15 – 200 | II (Purist lane) | |

## 3. Paths

Four Paths, unlocked once each with points (Stage II), **one active per run**, chosen on the sale screen for free. A second slot opens at Stage V. Never changed mid-run.

Each Path has three plain-language rules (shown on its card exactly like this), a colour, and a Mastery track.

| Path | Identity (one sentence on the card) | Rule 1 | Rule 2 | Rule 3 | Colour |
| --- | --- | --- | --- | --- | --- |
| **Purist** | "We win on the server, not in the press." | Prize money and team ratings +25% | Drama level capped at 1; no Drama Drops beyond that | Crypto and gambling sponsors refuse to sign | green |
| **Content Empire** | "Every match is a stream, every player a brand." | Merch sales and viral drops +50% | Player morale swings twice as far | Prize money −20% | gold |
| **Dealmaker** | "Everything has a price, including the roster." | Transfer fees and sale prices +25%; one extra sponsor slot | Sponsor goals pay +25% | Players gain 20% less XP | accent-2 |
| **Scholar** | "Grow your own." | XP +50%; better prospects in the draft and the Market | Lineage apprentices inherit an extra trait (Stage IV) | Operations income −10% | accent |

How rules are built: each rule is a small field on `Mods` owned by the module it changes (sponsors, drops, merch, teams), applied when the Path is active. No `if (path === …)` in the UI or in game logic outside `computeMods`.

### 3.1 Path Mastery

- Every sale adds one Mastery to the Path that was active for the run (two Paths, one each, once slot II is open).
- Mastery 1 / 3 / 6 / 10 opens that Path's deeper nodes in its lane of the tree (cheap verbs such as "Purist: one free Finals call", "Content Empire: a merch line keeps its trend for one rotation").
- Mastery is never lost, so switching Paths is a choice about *which* Path to advance next.

### 3.2 Making it very obvious (your requirement)

1. **Sale screen:** four large Path cards (colour, icon, identity sentence, the three rules, "what changes next run"). Unlocked but inactive cards are full colour; locked ones are greyed with their cost.
2. **Switching confirmation:** "You are switching from Purist to Content Empire. You keep 4 Purist Mastery. Next run: merch +50%, prize money −20%."
3. **Top bar:** a coloured Path chip all run; its tooltip lists the three rules.
4. **HQ overview:** a thin banner in the Path colour under the org name.
5. **Tree:** one coloured lane per Path; the active lane lit, the others dimmed but never hidden.
6. **Hall of Fame:** each entry shows the Path badge.

## 4. Heirlooms

Cookie Clicker's permanent upgrade slots: choose things to own from minute one of every run. The slot count is the progression; no power creep.

| Slot | Stage | Cost (ratio) |
| --- | --- | --- |
| I | I | 25 |
| II | IV | 20,000 |
| III – V | VI | 3M, 400M, 50B (Cookie Clicker's own ratios) |

**What can go in a slot** (one per slot, changed at each sale):

| Kind | Examples | Cap |
| --- | --- | --- |
| A store upgrade | a click doubler, the first ×2 tier of an operation, a staff tier | only upgrades the run would normally reach in its first hour |
| A starting kit | today's Seed Funding / Loyal Grinders / Loyal Staff, sized as "the first 10 minutes" of a run | one kit per slot |
| A merch design or a sponsor contract (later) | keep a design on a line; keep a signed tier-1 contract | Stage IV+ |

**Target:** a full set of Heirlooms shortens the first hour of a run by at most 25% (`targets.ts` once built).

## 5. The first sale

Push or wait is an open decision (plan, decision 2). Either way the screen shows both options side by side:

> **Sell now for 5 points** → Foundation (1 + 3), and a first Heirloom.
> **Keep going to about 25 points** (≈ 40 more minutes at today's pace) → Foundation, a Path, an Heirloom slot and the first Heirloom.

Target: the recommended first sale buys 6–8 things, at least two of them verbs.

## 6. Migration rules

1. **Refund, don't strand** (ground rule 7). A node whose effect is replaced (start cash, start ops, start staff) or shrunk (offline nodes under WS4) is refunded in full at migration, and a one-time "Your Legacy was refreshed: N points returned" notice explains it.
2. **Grandfather the rest.** Every other owned node keeps its id and effect; it simply moves to its stage.
3. **Paths start locked** for existing saves, but a save that has sold at least 5 times gets its first Path unlock free, so veterans see the new system immediately.
4. **Mastery starts at zero** for everyone. Hall of Fame entries from before v2 show no Path badge.
5. **Save format:** `prestige.paths: { unlocked: string[]; active: string[]; mastery: Record<string, number> }`, `prestige.heirlooms: string[]`, `prestige.heirloomSlots: number`. Defaults in `state.ts`, filled in by `mergeDefaults`, with a round-trip test.

## 7. Simulator work (WS2.5)

- A persona option per Path, and a buyer that fills Heirloom slots with the best-payback first-hour upgrade.
- Targets: first Legacy within ±15% across Paths; no Path over 25% ahead at hour 6; a full Heirloom set shortens the first hour by at most 25%; the main tree is done around sale 15–25.

## 8. Questions for you

1. Are the four Paths and their three rules each the right flavour? (Names are working names.)
2. Should a Path cost points to *unlock* (as above), or be free and only Mastery cost points?
3. Is folding start cash, start ops and start staff into Heirlooms, with a full refund, acceptable? (Plan, decision 5.)
4. Free switching at every sale (recommended), or a small point cost?
