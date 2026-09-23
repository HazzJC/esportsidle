# Progression and visual audit — 22 September 2026

Player reports: scrolling misbehaves on some pages, merch goes "insane" late in the game, and other things feel off.
This audit reruns the progression tests for three playstyles with legacy in play, then reviews every screen against the art standard set by the recent operations, logo and merch passes.

Nothing in the game was changed. The findings are ranked worst first.

## How it was tested

`scripts/audit.ts` simulates a player for 12 hours of game time: 3 seeds per playstyle, up to 4 runs each, selling the org whenever a legacy point is waiting (or after 4 hours).
Each purchase is chosen greedily on cost ÷ income gained. The candidates are operations, upgrades, gear, staff and merch finishes.

| playstyle | looks at the game | clicks | Hype Drops | automation |
| --- | --- | --- | --- | --- |
| active | every 20s | first 10 min of each run | catches every drop and plays every Invitational | off |
| semi | every 2 min | a 5-min burst, then 15s every 5 min | only if one is on screen when they look | off |
| passive | every 10 min | tutorial only | never | on |

At each sale the harness measures what every legacy node and Dynasty rank would add to income right then.
`scripts/audit-report.ts output/progression-audit` turns the nine JSON files into tables (`output/progression-audit/report.md`).
The visual review used two saves the harness wrote: 3 hours in, and 12 hours in after 3 sales. Screenshots were taken at 1440×900 and 390×844.

Limits worth knowing:
- The harness sells as soon as it can, so its early sales are small. Real players who wait will see bigger sales, but the curve shape is the same.
- The harness never buys decor, so `decor_1` stalling for the active and semi players is a gap in the harness, not the game.

## Headline numbers (median of 3 seeds)

| | passive | semi | active |
| --- | --- | --- | --- |
| earned in 12h | 7 Qa | 28 Sp (10²⁵) | 2.9 No (10³⁰) |
| run lengths before selling | 3h50 / 2h30 / 2h50 | 1h32 / 1h04 / 1h32 | 47m / 43m / 38m |
| legacy per sale | +1–2, +1–2, +3–15 | +1, +1, +2–5 | +1, +1, +2–3 |
| legacy waiting unsold at the end of run 4 | 0–51 points | 21,000–34,000 points | 1.3–1.8 million points |
| merch share of run income | 81–98% | 78–100% | 83–100% (100% in run 4) |
| peak merch ÷ operations | 55–400× | 2,200–44,000× | 100,000–480,000× |
| biggest 10-minute income jump | 27–270× | 157–1,050× | 2,900–24,800× |
| longest near-flat stretch | 30m | 2h20–4h10 | 2h10–6h20 |
| run 2 reaches run 1's milestones | 2.0× faster | 1.7× faster | 1.7× faster |
| quests claimed across 4 runs | 12 of 88 | 30–44 | 36 |
| Invitationals won/played | 0/0 | 0–3 of 1–5 | 23–47 of 43–83 |

## Progression outliers

### 1. Merch has no ceiling and feeds itself (the "insane merch" reports)

Merch earns 80–100% of every run for every playstyle.
Late in a run it is thousands to hundreds of thousands of times operations income. Operations, matches, sponsors and tournaments stop mattering.

Each product line earns `ops income × share × 2 × quality × merchMult` (`src/engine/merch.ts:73`). Every factor in it stacks:

- **Quality.** It is appeal² × trend 2.5 × Mania 7 × novelty × price × finish (up to 4.5), so as much as ~80 per line.
- **Merch multiplier.** The four merch upgrades give 1.5 × 2 × 2 × 3 = 18. Cult Merch legacy adds ×2, a mandate ×1.75 and a quest ×1.2.
- **Merch Designers (the feedback loop).** Each hire multiplies merch again with no cap (`src/engine/staff.ts:58`, power hires^0.8). In the late save: ×3 with no designers, ×27 at 100, ×61 at 300, ×154 at 1,000. Designers are bought with merch income, so more merch buys more designers, which makes more merch.
- **Finish upgrades.** Cost is a fixed `unlockCost × 0.4 × 2^q` that doesn't follow income. Each step is worth ×1.35–×4.5 on its line, so every one of the 100 steps pays back in under a minute. At $19–27B/s per line, steps cost $256B–$800B, which is 10–40 seconds of that line's income.

Once all 10 lines reach Q10 (about 1 hour in for active, 2 for semi), the run goes flat for 2–6 hours. Nothing left to buy moves income more than 1.5× per 10 minutes.
When Mania ends, income falls about 7× (active seed 2: 1.15e22 → 1.68e21/s).

Where to look: the designer bonus (cap it or make it diminish harder), the finish cost (scale it with income or the line's revenue), and Mania ×7 stacked on trend ×2.5 (a ×17.5 swing).
A sensible target is merch at 1–3× operations at its peak, not 10⁵×.

### 2. Legacy barely matters, then one run makes it pointless

- **Tiny sales.** The first two sales give +1 or +2 each for every playstyle. A second run is only 1.7–2.1× faster, while in-run merch gives ×4.5 per line.
- **Few useful nodes.** In the harness's buy order, the first two sales went on `start_cash_1`, `heritage` and `click_1`. Their income effect measures as 0%, as do `offline`, `drops`, `fame`, `bench`, `scouting`, `xp`, `teams_1`, `tourney` and the Pedigree/Following/Academy Dynasty ranks. Only `legacy` (+10% for 1 point), `income_1` (+3%/point) and the Renown rank show up.
- **One runaway wipes out every earlier sale.** Points are ∛(all-time earnings ÷ 10¹²). Because merch explodes, run 4 ends with 21,000–34,000 points waiting for semi players and 1.3–1.8 million for active ones, against 4–7 earned in all previous sales combined. So selling early is never worth it: the best play is one long run, then everything in the tree (`income_4` costs 5,000) in one go.

### 3. Passive players are locked out of the quest line

Quests go strictly in order. Quest 4, `crowd_1` "Hype streak", needs about 80 fast clicks in a row: 100 hype at 1.25 a click, and hype drains after 4 idle seconds.
Passive players never pass it, so each run stops at 3 of 22 quests (12 of 88 across 4 runs). The next quest, `drop_1` "Catch the drop", stalled a semi player for 5 hours.
A single missed action blocks everything behind it, including perks and the `sell_org` step that teaches prestige.

### 4. Late game stalls after about an hour

After merch maxes out, active and semi runs sit at under 1.5× per 10 minutes for 2–6 hours. Cash piles up with nothing that matters to spend it on.
The screenshots show why: staff at $2B, decor at $500, and player signings at $5,000–$37,000, against $170B/s of income.
Only the top operations and new upgrades cost anything.

### 5. Smaller outliers

- **The first Streamer is worth ×20–26 income** (it costs $100). Expected at that point, since the only other income is clicking.
- **Quest cash rewards** are up to 38% of a semi player's first run. They pay minutes of income, and income is tiny early on. Not harmful.
- **Sponsor goal payouts** top out at 3–38 minutes of income. They are in line.
- **Invitationals** are active-only. Passive players never see one, because they come from Hype Drops.
- **Tutorial pace** for passive players is 41–51 minutes. The first legacy point comes at 3h20–3h50, inside the 3–5h target. Semi players get it at 1h17–1h41, and active players sell within the first hour.

## Scrolling and performance

1. **The phone top bar is wider than the phone (confirmed; the most likely cause of the reports).**
   - Outside the Org view, the top bar needs 422px: logo, org name, cash, music, bell and save.
   - On anything narrower (360, 375, 390, 393 and 412px phones), the page becomes 422px wide. It then scrolls and wobbles sideways, the Save button is cut off, and the fixed bottom nav is pushed below the screen (measured at y=845 on an 844px screen) until the player pinch-zooms.
   - This happens in the Manage (every tab) and Store views, but not on the Org view, which has no cash pill.
   - `src/ui/layout/TopBar.svelte`.
2. **Late-game jank.**
   - Frame time on the same machine (headless, 1440×900): fresh game 8ms, 3-hour save 30–40ms, 12-hour save 85–180ms, with spikes up to 1s.
   - About 26% of CPU goes to the HQ agenda's "opportunity" card. `buildAgenda → opportunity → previewSigning` runs a full roster what-if for every market listing on every UI update (`src/engine/agenda.ts:248`, `src/engine/roster.ts:58`).
   - Most of the rest is painting (operation scenes, glows, animation).
   - On a phone this shows up as sticky, stuttering scroll.
   - A smaller cost: `matchEasterEgg` normalises player names with a regex on every rating calculation. It was 25% of harness time.
3. **No `overscroll-behavior` anywhere (likely).** The page body doesn't scroll; the panels do. On Android Chrome, pulling down at the top of a panel can chain to the page and trigger pull-to-refresh, which reloads the game.
4. **Dragging players on touch fights scrolling (likely, from the code).**
   - Team cards use `touch-action: manipulation`, and nothing calls `preventDefault` once a long-press drag starts (`src/ui/tabs/Teams.svelte:104–145`).
   - Moving the finger after the long press lets the browser scroll the page, which cancels the drag.
   - This needs checking on a real phone.
5. **Teams page height changes as matches resolve.** It varies between 4,428 and 4,474px. Chrome keeps your place, but Safari on iPhone has no scroll anchoring, so the content moves about 35px while you read.
6. **The Store on phones is two scroll boxes.** Upgrades take up to 45% of the height and scroll on their own. The operations list gets 453px of 844.

Not reproduced: pages jumping back to the top on their own. I scrolled each of the 11 tabs halfway down and left it for 4–12 seconds at desktop and phone sizes. Nothing moved except Teams (item 5).

## Visual review: items below the new standard

The operations buildings and scenes, logos, staff faces, gear, merch cases and the House room now share one look: layered pixel art with light, shadow and depth. These fall short of it:

1. **World-event choice panel** (`ChoicePanel.svelte`).
   - It is fixed at the bottom-left, 360px wide over a 320px column, so it runs out of the clicker column and over the HQ cards ("Opportunity" is cut in half).
   - The panel is see-through, so the buff icons underneath show through.
   - It is text-only: five stacked buttons with no art for the event or the player involved.
   - With several events queued it covers the whole clicker.
2. **Legacy tree** (`Legacy.svelte`).
   - Nodes are flat outline icons in circles, and most of them are grey padlocks with a bare number.
   - The canvas is mostly empty and needs sideways scrolling inside a fixed box. On a phone you see three columns at a time.
   - Nodes show no names, and bought, affordable and locked look too alike.
   - The Dynasty cards are plain.
3. **Hype Drop icon** (`DropLayer.svelte`). A flat gold circle with a lightning glyph. It is the game's golden cookie, but it has less art than a mousepad.
4. **Welcome Back modal** (`WelcomeBack.svelte`). A small plain box with two numbers; nothing shows what happened while you were away. It also has a text bug: "20% efficiency ." with a stray space before the full stop (the line break before `{/if}.`).
5. **HQ quest card.** "Up next" is a large empty dashed box taking half the card. The HQ Trophy Shelf is one trophy icon with a count, and Season Recaps is a dense wall of small text.
6. **Achievements.**
   - The trophy shelf is 131 near-identical tiny cups in rows.
   - Achievement tiles are generic outline icons in coloured squares with Roman numerals.
   - Consistent, but well below the pixel art on every other tab.
7. **House "Team HQ" backdrop.** The skyline is flat navy rectangles over a plain grey floor, behind detailed desks and players. It looks unfinished next to the operation scenes.
8. **Small polish.**
   - The Teams game switcher shows a native grey scrollbar on desktop.
   - The Stats "Money" card wraps values onto orphan lines ("sold", "met").
   - The Options popup toggles look the same on and off.
   - At about 1080px wide, the centre tab strip clips its first and last icons.

## Suggested order of work

1. Fix the phone top bar width. It is small, confirmed, and probably most of the scroll complaints.
2. Rein in merch: cap or flatten Merch Designers, price finishes against income, and shrink the Mania and trend stack. Then rerun `scripts/audit.ts` and aim for merch at 1–3× operations.
3. Rework legacy value.
   - Make the early nodes pay: fold the 0% nodes into ones that carry some income.
   - Change the points curve so the first sales count and one runaway run doesn't dwarf them.
4. Let the quest line skip or park a quest the player can't do (Hype streak, Catch the drop) instead of stopping.
5. Memoise the HQ opportunity card per market refresh, and add `overscroll-behavior: contain` to the scroll panels.
6. Art passes in the order of the visual list above.

## After the fixes (same harness, 3 seeds per playstyle, 12 hours)

In the rerun the active player follows trends: when a trend changes, it briefs a new design for it and puts that design on every line. Semi and passive players set a design once and leave it.

| | passive | semi | active |
| --- | --- | --- | --- |
| median merch ÷ operations | 0.04–0.08× | 0.34–0.50× | 2.0–3.1× |
| last run median | 0.03–0.11× | 0.51–0.91× | 4.1–5.1× |
| first sale | 5h20 | 2h06–2h20 | 1h26–1h56 |
| earned in 12h | 10–16 T | 0.6 Sx–20 Sx | 250–440 Sp |

Short peaks remain when an active player stacks buffs: Frenzy, Merch Spotlight and a Mania together reach a few hundred times operations for a minute. Passive players now reach their first sale later than the 3–5h target, because merch no longer carries them.

Late-game frame times (headless, 1440×900, same machine):

| | HQ | Teams | Studio |
| --- | --- | --- | --- |
| before | 84ms | 95ms | 178ms |
| after | 10ms | 15ms | 12ms |

The phone top bar now fits a 360px screen, so every tab's page matches the screen width.
