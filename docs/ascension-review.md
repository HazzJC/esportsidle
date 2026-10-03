# Cookie Clicker's progression, stage by stage, and what Esports Idle should take from it

You said the Cookie Clicker ascension tree is the gold standard for progression. I agree, and this review explains why it works, where it chafes, and exactly how Esports Idle compares. It feeds the Legacy v2 design in `docs/implementation-plan.md` (WS2).

**Sources and confidence.** Mechanics and chip costs come from the Cookie Clicker wiki's [Ascension guide](https://cookieclicker.wiki.gg/wiki/Ascension_guide), [Permanent upgrade slots guide](https://cookieclicker.wiki.gg/wiki/Permanent_upgrade_slots_guide), [Ascension](https://cookieclicker.wiki.gg/wiki/Ascension) and [Heavenly Chips](https://cookieclicker.wiki.gg/wiki/Heavenly_Chips) pages, plus Steam threads and guides. Some pages I wanted (the heavenly upgrade list, the dragon page) returned errors, so the **full tree and dragon-aura details are not verified**; I note where I am inferring. Community guides also disagree on when to first ascend (see section 2), so treat the stage numbers as a community consensus, not a spec.

---

## 1. The shape of Cookie Clicker's progression

### 1.1 The loop in one line

Bake for a while, ascend for chips, spend chips on permanent upgrades, and the next run starts further along. Prestige level is `cbrt(cookies baked all time / 1e12)`, and each level is +1% production. Chips are the spendable currency, earned 1:1 with prestige level.

### 1.2 The stages, as the community plays them

| Stage | Chips available (cumulative target) | What the player buys | What that *unlocks* | What it feels like |
| --- | --- | --- | --- | --- |
| **First run** | 0 | Buildings, upgrades, golden cookies, achievements (milk), sugar lumps after 1 billion baked | Golden-cookie combos, building levels, minigames | A long discovery run. The game never forces you to reset; the Legacy button just shows a number. |
| **Ascension 1** | ~365 (about 4.9e19 cookies) | Legacy (1), Heavenly Cookies (3), How to Bake Your Dragon (9), three tier-one cookie lines (25 each), Heavenly Luck (77), Permanent Upgrade Slot I (100), Heralds (100) | The **dragon**, **golden-cookie tuning**, the first **permanent slot** | A *shopping spree* of eight or so purchases, three of which add a new thing to do. |
| **Early, 2–5** | 2,185 → 12,301 → 62,217 → 127,776 | Golden Switch (999), Season Switcher, the angel line (Twin Gates), Starter Kitchen, Permanent Slot II (20,000) | **Seasons**, the **Golden Switch**, **offline gains**, a second slot | Each ascension is one new cluster to learn. |
| **Mid, 6–10** | 825,019 → 2.6M → 32.9M → 210M → 1.6B | Demon synergies, Lucky Number (77,777), Unshackled Cursors, Label Printer, the wrinkler line, Permanent Slots III (3M) and IV (400M), Sugar Baking | **Synergies**, **wrinklers**, **sugar mechanics** | Depth and quality of life. More choices about *how* to play. |
| **Late, 11–15** | 6.8B → 35B → 228B → 1.4T → 9.8T | Unshackled building upgrades, Chimera, Aura Gloves, Permanent Slot V (50B) | **Unshackling**, **elder dragon** | Polishing a finished engine. |
| **End** | up to ~1e18 prestige; "optimal" ~70T | The last unshackled tiers | Completion | Ascend each time prestige roughly doubles; achievements for 100 and 1,000 ascensions. |

The total cost of the tree is about 7.5e16 chips (from a search result; I did not verify it line by line).

### 1.3 What makes it work

| # | Mechanism | Evidence | Why it feels good |
| --- | --- | --- | --- |
| M1 | **A ladder of costs that teaches the tree.** The first three purchases cost 1, 3 and 9 chips, then 25, 77, 100, 999, 7,777… | Ascension guide | The cheap early items show the player how the system works, and the numbers are themselves a joke and a tempo. |
| M2 | **Each ascension needs roughly 5–6× the chips of the last** (365 → 2,185 → 12,301 → 62,217…) | Ascension guide | Runs get longer *on purpose*. Each stage is one ascension, each ascension buys one named cluster. There is always a next thing in reach. |
| M3 | **Many nodes unlock mechanics, not numbers.** Dragon, Golden Switch, Season Switcher, angels, wrinklers, sugar, minigames, unshackling. | Ascension guide; a Steam answer notes the tree "unlock[s] … new minigames", not just multipliers | The reset buys a new *verb*. This is the thing flat-percentage trees lack. |
| M4 | **Loadout slots: permanent slots, dragon auras, pantheon gods.** Five permanent upgrade slots cost 100 → 20,000 → 3M → 400M → 50B. | Permaslots guide | The wiki says permaslots "move boosts earlier in time" with "no power creep". You choose *what* carries over, and you change that choice as the game changes. |
| M5 | **Prestige potency is itself gated by the tree** (community-reported: a fresh ascension with many levels and no unlock upgrades "gives you nothing") | Steam guide summary | The tree is the gate to the number, so the tree matters more than the number. I could not confirm the exact percentages. |
| M6 | **The first ascension is deliberately late and big.** Guides say do not ascend at the first chip; wait for a spree. | Ascension guides | The first reset is a payoff, not a nudge. |
| M7 | **Post-tree pacing rule:** "ascend when your prestige roughly doubles". | Steam thread | A simple heuristic keeps ascension meaningful even after everything is bought. |
| M8 | **Theme and humour in the numbers** (777, 7,777, 999, 444,444…) | Ascension guide | Makes a spreadsheet feel like a game. |

### 1.4 Where it chafes

- **The first run takes days.** Guides disagree wildly (one says 100–200 *trillion* cookies, which is inconsistent with the cube-root formula; 365 levels is about 4.9e19 cookies). Either way, it is long, and some players quit before seeing ascension at all.
- **You need a community guide to know what to buy.** Nothing in the tree tells you the order, which is why "Ascension 1, 2, 3…" lists exist.
- **Late ascensions become maintenance.** "Slow ascensions" beyond ~100,000 prestige and a hundred-step endless window are for completionists.
- **The system is invisible to newcomers.** The Legacy button hides in the Info menu.
- **Some upgrade costs are arbitrary and punishing** (the Synergies chain 7 → 49 → 343 → 2,401 chips is a flavourful but opaque ladder).

---

## 2. Esports Idle against that model

| Stage / mechanism | Cookie Clicker | Esports Idle today | Verdict |
| --- | --- | --- | --- |
| First reset timing | Late, optional, a spree (~365 chips) | **Offered automatically at the first point** (`checkSaleOffer`); first sale is about 1 point plus 4 founding points; first Legacy at about 1h31 | **Gap.** The game nudges the weakest, earliest reset. |
| First reset payoff | ~8 purchases, three of which add a mechanic | About 5 points; the tree's cheapest nodes cost 2–5, so one or two purchases; one Charter pick and one Mandate pick | **Partly there.** Charter and Mandate are good, but the tree itself is a thin spree. |
| Cost ladder | 1, 3, 9, 25, 77, 100 … with a joke | 1, 2, 3, 4, 5, 8, 10, 15, 20, 25 … 5,000 (mixed, no rhythm) | **Gap.** No teaching ladder, no per-stage jump. |
| Stage stretching | Each stage needs ~5–6× the last, runs get longer | Runs compress: income grows ×2.5e8 in the 3 h after the first point (target ≤ ×100); staying beats selling ~12× | **The biggest gap.** The tree cannot pace a run that does not slow down. |
| Mechanic-unlock nodes | Dragon, seasons, wrinklers, sugar, minigames | Few: Franchise Player, Hall of Fame Coaches, Targeted Scouting, sponsor tiers, challenges, automation | **Gap.** Most nodes are `+N%` or start bonuses. |
| Loadout slots | Dragon auras, pantheon, 5 permaslots | **Mandate** (1 of 3 offered, one run), **Charter** (once). No slots, no carrying a chosen upgrade into the next run | **Gap** and the biggest opportunity. |
| Real-time currency | Sugar lumps | Trophies (earned by play) | **Different, arguably better.** Keep. |
| Achievements give a permanent bonus | Milk (kittens) | Superfans scale with the trophy cabinet | **Already there.** |
| Post-tree sink | Ascend when prestige doubles; achievements | Dynasty ranks (linear, slowly compounding cost ×1.15) | **Fine**, but has no pacing heuristic or milestone. |
| Discoverability | Weak (needs a guide) | Good tutorial, agenda, tooltips | **You can beat CC here**: show the recommended next unlock in the tree. |

**What is right already:** Charters and Mandates are loadout-style choices; Challenges are a permanent-reward-for-a-restriction mechanic with no CC equivalent; the sale screen's "You keep / You lose" is clearer than anything in Cookie Clicker; Trophies already do what Sugar Lumps do without a daily wait.

---

## 3. What to take: Legacy v2

Direction: **a permanent tree that unlocks mechanics and slots (Cookie Clicker's model), with swappable Paths on top (your "exclusive paths that can change between runs").** The tree is where things are *earned*; Paths and Heirlooms are where they are *chosen*.

### 3.1 Stages, named after what they unlock

Each stage is one or two sales. A new cluster is in reach after every sale for the first ten or so, then the gaps lengthen. Point targets are **ratios**, not absolute values; calibrate them with the simulator once the run levels off (see section 4).

| Stage | Name | First costs (ratio ladder ~×3 then ×2.5) | Unlocks | Ties to |
| --- | --- | --- | --- | --- |
| I | **Foundation** | 1, 3, 9, 25 | Legacy root; the Heritage +% nodes; Loyal Grinders; **Path slot I**; first **Heirloom slot** | Founding sale spree |
| II | **Paths** | ~60–250 | The four Paths unlock one at a time; **Path Mastery** begins | WS2 Paths |
| III | **Bootcamp and Return** | ~500–2,500 | Offline Bootcamp details and "Back in the building" (A1); Analyst Desk (A6) | A1, A6 |
| IV | **People** | ~5,000–25,000 | Lineage schools and apprentices (A2); Nemesis bounties (A3); **Heirloom slot II** | A2, A3 |
| V | **Big Stage** | ~50,000–250,000 | Finals calls and Crunch Time (A4); **Path slot II** | A4 |
| VI | **Unshackling** | ~500,000+ | Early operations scale with late ones; **Heirloom slots III–V** | "Give operations a late role" |
| ∞ | **Dynasty** | continuing | Linear ranks, with a "next sale is worth ×2" prompt | M7 |

Rules for any node: *a new verb beats a bigger number*, and every node says what it adds in a before/after line.

### 3.2 Paths: exclusive, swappable, obvious

- **Four Paths** (working names): **Purist**, **Content Empire**, **Dealmaker**, **Scholar**. Each changes *rules* (for example Purist: risky sponsor categories are refused, drama is capped at level 1, prize money rises; Content Empire: merch and viral drops rise, morale is volatile; Dealmaker: transfers and sponsor deals; Scholar: XP, scouting and lineage).
- **Unlocked once with points (permanent), chosen per run at the sale.** One active Path at first, a second slot later (Stage V). You may change Path **for free at every sale** and never mid-run. That is exactly how the dragon and pantheon work: slots you refill.
- **Path Mastery.** Every run on a Path adds mastery that permanently opens that Path's deeper nodes. So changing Path is interesting, not lossy: you never lose mastery, you choose which Path to advance.
- **Very obvious.** The design rules, because this is the point you stressed:
  1. The sale screen shows each Path as a large card with colour, icon, one sentence of identity, **three plain-language rules** ("No crypto sponsors", "Drama level capped at 1", "Prize money +25%") and a "what this changes in run N+1" preview.
  2. The active Path appears as a coloured chip in the top bar and as a banner on the HQ overview for the whole run, plus a badge on the Hall of Fame entry.
  3. The tree is drawn as coloured lanes, one per Path, with the active one lit and the others dimmed, never hidden.
  4. Any node whose effect depends on the Path says so in its tooltip.
  5. A "switching" confirmation on the sale screen spells out what you gain and lose by changing.

### 3.3 Heirlooms: our permanent upgrade slots

- The Cookie Clicker pattern: choose an upgrade you would normally buy at 40 minutes and own it from minute one, "no power creep".
- Esports Idle version: **Heirloom slots** (five, costs on the same ladder as permaslots) let you pick a store upgrade to start every run owned. The slot count is the progression; the choice changes as you learn what matters.
- Also fits: sponsor contracts and merch designs (A5-style items) as later heirloom types.
- Conflict to resolve: today's start bonuses (Seed Funding, IPO Money, Loyal Grinders, Loyal Staff) overlap. Fold them into Stage I and VI, or retire them with a refund.

### 3.4 Keep the charter and mandate system

Charter (once) and Mandate (per sale) sit on top of Paths. Keep them short and keep them as flavour. Paths are the big choice; Mandates are the small spice.

### 3.5 First-sale design

This is the piece of CC I would copy most carefully.

- **Do not make the first sale a nudge.** Show the sale screen as a *preview*: "Sell now for 5 points, or keep going: at 25 points you can afford Foundation, Path I and your first Heirloom."
- Keep the automatic offer if you like it, but make it a choice with the trade-off visible, so the game teaches the heuristic "wait until a spree."
- **Decision for you:** whether the first-sale screen is pushed at the first point (as now) or only offered after the player has enough points for a spree.

### 3.6 Post-tree

- Keep Dynasty as the infinite sink, slowed, with a clear "ascend when the next sale would be about double" hint (CC's M7).
- Add sale milestones (for example 10, 25, 50, 100 sales) with cosmetic and Hall of Fame rewards, the equivalent of CC's 100/1,000-ascension achievements.

---

## 4. Risks and pushbacks

1. **Do not copy the range.** CC's 7.5e16 chips is a consequence of a game where runs last weeks. Yours should finish the main tree in roughly 15–25 sales and then become Dynasty.
2. **The pacing depends on leveling off.** Stage costs only mean something if a run takes longer than the last. That is WS3, and the current baseline still fails it (income ×2.5e8 in the 3 h after the first point, selling is 12× worse than staying). Do not calibrate the ladder before that passes.
3. **Do not make run 1 longer to match CC.** You like pre-legacy pacing. The first run can stay the same length; what changes is what the *first sale* buys.
4. **Do not hide the order.** CC needs guides because the tree doesn't say what to buy. Add a recommended-next chip and a "what this unlocks" line to every node.
5. **Exclusivity needs mastery or it feels like loss.** Path Mastery is what makes switching feel free.
6. **Heirlooms must be capped per stage.** Nothing that is worth more than the slot's price at its stage.

## 5. Calibration targets to add to the simulator

| Target | Suggested value |
| --- | --- |
| First sale spree | At the recommended sale, the points buy 6–8 nodes, at least 2 of which unlock mechanics |
| Unlock cadence | A new stage cluster affordable within 1–2 sales, for sales 1–8 |
| Stage ratio | Each stage costs 4–6× the previous |
| Tree completion | Main tree done around sale 15–25 for the `active` persona |
| Path parity | First Legacy within ±15% across Paths; no Path over 25% ahead at hour 6 |
| Heirloom value | A full set of heirlooms shortens the first hour by at most 25% |
| Post-tree | "Next sale worth ×2" appears at most once per 2 sales |
