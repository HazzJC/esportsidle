# Esports Idle

An incremental (idle/clicker) game about building an esports empire, inspired by the depth of Cookie Clicker.

You start with nothing but a logo to click in a garage. You end up running leagues in orbit.

**Play it here: https://hazzjc.github.io/esportsidle/**

## What you actually do

- **Get started** — a short guided tutorial: click your logo, pick your first player from three prospects
  (a rookie in seconds or a pro after a few minutes of clicking), watch them compete, then open the store.
- **Two sides to every org** — players, gear and seasons are the active side; operations are the passive
  side that earns every second, even while the game is closed.
- **Chase quests** — two milestone quests at a time (gear up, take a sponsor, design a shirt, hit a hype
  streak, win a tournament, sell a player and more). Finish one and pick one of two rewards.
- **Click your logo** to grind ranked and fill the hype meter. A full meter sends the crowd wild (income ×2).
- **Buy operations** — 16 businesses from Ranked Grinders and Streamers up to Simulation Servers and the
  Multiverse Championship, each with tiered upgrades, collabs and cross-synergies.
- **Sign players** from a rotating transfer market. Every player is generated with stats, potential, traits,
  a nationality, a look you can customise, and a price.
- **Kit them out** — 10 gear slots with 15 tiers each: PC, monitor, mouse, keyboard, headset, chair, desk,
  jersey, lucky charm and, of course, shoes. Gear boosts the stats that matter in that player's game.
- **Win matches** — teams play simulated matches across 12 parody games, climbing an endless league ladder
  through seasons, promotions, relegations and titles.
- **Hire staff** — coaches, chefs, scouts, physios, analysts, social media managers, sports psychologists,
  team managers, AI trainers, merch designers and talent agents.
- **Look after people** — players get tired, sick, injured and burnt out. Chefs, physios, psychologists,
  better chairs and a deep bench keep them playing.
- **Catch Hype Drops** — the golden-cookie moment: LAN Frenzy, Prize Pools, Clutch Mode, Viral Clips,
  operation Rushes, chaining Hype Trains and Tournament Invites that play out as a three-round bracket.
- **Ride the news** — patches, streamer hype, meta shifts, food poisoning, flash sales, GPU shortages,
  investors, poaching offers and contract demands all change the run as you play.
- **Draw your own art** — a pixel editor with mirroring, fill, shapes, a text stamp and a live "merch appeal"
  score. Your design becomes your logo, your jersey crest and your merch.
- **Sell merch and sign sponsors** — 10 products with pricing sweet spots and fading novelty, plus 36 parody
  brands across 12 categories with perks, bonus goals and a crypto sponsor that can collapse.
- **Sell the org** — prestige into legacy points, spend them on a 37-node Legacy Tree, keep a franchise
  player, retire stars as legend coaches, and take on challenge runs (Solo Queue, Potato League,
  Skeleton Crew, No Hype, Tabloid Darling).

Everything is tracked by roughly 300 achievements and 380+ upgrades, and it autosaves in your browser.

## Saves

The game autosaves to local storage, keeps rotating backups, and credits offline earnings when you return.
In **Options** you can export your save as text or a file and import it on another device. There is no
account and nothing is uploaded anywhere.

## Development

Requires Node 22+.

```bash
npm install
npm run dev      # start the dev server
npm test         # engine unit tests (vitest)
npm run check    # type-check Svelte + TypeScript
npm run build    # production build into dist/
npm run sim      # headless balance simulation
```

The balance simulation plays the real engine with a greedy "sensible player" and reports when milestones
happen, which is how the pacing is tuned:

```bash
npm run sim -- --hours=5 --mode=active --seed=1
```

### Layout

- `src/engine` — the game simulation. Plain TypeScript, no DOM access, unit tested.
- `src/data` — content: operations, upgrades, games, gear, traits, staff, decor, sponsors, merch, legacy, news.
- `src/ui` — Svelte 5 components and the store that drives them.
- `scripts/sim.ts` — the headless balance simulation.

Game titles, organisations and brands in the game are fictional parodies.
