# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-10-03

A guided first run, deeper systems and a big visual pass. The full detail is in `PATCH_NOTES.md`.

### Added
- **A guided first run**: the quest line now runs the first run in order and opens each system as it explains it (transfer market, Staff, the House, the Studio, Sponsors), with waiting goals shown on the HQ quest console. Highlights pulse on whatever to press next, and every tutorial step and quest has a "Show me" button.
- **Staff tools**: the first hire of each staff role brings a quality-of-life tool: the Coach's game plan, buying 10 or 100 at a time, Max, Buy all upgrades, selling operations, and one design on every merch line.
- **First sponsorship choice**: three snack brands with different perks and goals, a "How a deal works" explainer, and one sponsor slot to start.
- **Match fixtures**: your crest against the next opponent's on every team card, and a victory card that counts up the prize money.
- **Team rooms**: walls and floors that follow your house, and props parodying each game (poros, a sniper rifle, a loot llama and more). Players type on their keyboards with their lucky charm on the desk.
- **More house**: nine new decor pieces and a move-in card each time the org moves into a bigger house.
- **Invitationals** you can win, with odds and a cash stake; **sponsors** across ten tiers with parody logos; **merch** drawn like gear that changes with its finish and rewards chasing trends.
- **Linear quests** with per-run perks and drawn emblems on an HQ quest console; a Cookie Clicker style HQ with drawn buildings and scenes.
- **One Teams page** with players at their desks, a real bench, drag-and-drop lineups, season plans, rest and injuries, and team Elo for promotion.
- A tablet layout, a recovery screen when the game cannot start, an accessibility auto-clicker, and a playstyle simulator for looking at how the economy plays.

### Changed
- The economy no longer stops at hard caps: fans, offline progress, drops and rerolls all slow on curves that never reach zero, and income-linked prices read a smoothed base income.
- Operations are ordered by real-world cost, gear is priced by league, and the first sale opens with the first Multiverse Championship.
- The first win pays a small bonus so the first Streamer comes before the crowd goes wild.

### Fixed
- Black screens after offline progress, invisible Hype Drops, Fame upgrades swallowed by the fame cap, and many layout and wording issues.

## [0.1.0] - 2026-09-19

### Added
- **Org Founding & Branding**: Custom org name, team colors, and interactive logo designer.
- **Dual Gameplay Loop**: Active ranked clicking and tournament play alongside passive operations revenue.
- **Operations & Synergies**: 16 tiered business operations from Ranked Grinders to Multiverse Championships.
- **Transfer Market**: Procedurally generated esports players with stats, potentials, nationalities, and traits.
- **Svelte 5 & Vite Architecture**: Reactive game state engine with offline earnings simulation and TypeScript typings.
- **Live Game**: Playable on GitHub Pages at [hazzjc.github.io/esportsidle](https://hazzjc.github.io/esportsidle/).
