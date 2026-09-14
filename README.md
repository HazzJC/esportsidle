# Esports Idle

An incremental (idle/clicker) game about building an esports empire, inspired by the depth of Cookie Clicker.

Start as a solo player grinding ranked in a garage. Sign players, upgrade their rigs (PCs, monitors, mice, headsets, chairs… and shoes), hire coaches, chefs and AI trainers, climb league ladders across a dozen games, land sponsors, draw your own logo and merch, and eventually sell your org to build a legacy.

**Play online:** https://hazzjc.github.io/esportsidle/

## Features

- **Operations** – 16 bulk-buy businesses, from Ranked Grinders to the Multiverse Championship, each with tiered upgrades
- **Players** – individually generated players with stats, traits, morale, health and fully customisable looks
- **Gear** – 10 gear slots per player with 10 tiers each, visible on the avatar and in the Gaming House
- **Staff** – coaches, analysts, chefs, physios, psychologists, AI trainers and more
- **Leagues & matches** – simulated matches, league ladders, seasons, promotion and relegation
- **Dynamic events** – Hype Drops (tournaments, frenzies), sickness, poaching, patches and game popularity swings
- **Sponsors & Merch** – sponsor contracts, a pixel-art design studio for your logo, jerseys and merch
- **Prestige** – sell your org for Legacy Points, a Legacy Tree and a Hall of Fame
- **Saves** – autosave to your browser, offline progress, export/import save strings and files

## Development

Requires Node 22+.

```bash
npm install
npm run dev      # start the dev server
npm test         # run engine unit tests
npm run check    # type-check Svelte + TS
npm run build    # production build into dist/
npm run sim      # headless balance simulation
```

Built with Svelte 5, TypeScript and Vite. The game engine (`src/engine`) is plain TypeScript with no DOM access; content lives in `src/data`; UI in `src/ui`.

Game titles, organisations and brands in the game are fictional parodies.
