<script lang="ts">
  import { DECOR, ROOMS, type DecorDef } from '../../data/decor';
  import { GAMES } from '../../data/games';
  import { STAT_DESCRIPTIONS } from '../../data/staff';
  import { fmtPct, money } from '../../engine/format';
  import { isAvailable } from '../../engine/players';
  import { teamKit } from '../../engine/teams';
  import { roomLevel } from '../../engine/staff';
  import type { Player } from '../../engine/types';
  import { mix, shade } from '../color';
  import Icon from '../components/Icon.svelte';
  import Station from '../components/Station.svelte';
  import { game } from '../game.svelte';
  import { tooltip } from '../tooltip.svelte';

  const MAX_STATIONS = 10;

  let filter = $state<string | null>(null);

  const v = $derived(game.view);
  const level = $derived(roomLevel(v.s));
  const room = $derived(ROOMS[level]);
  const next = $derived(ROOMS[level + 1]);
  const unlocked = $derived(GAMES.filter((g) => v.s.games[g.id]?.unlocked && v.s.teams[g.id]));
  const has = (id: string) => !!v.s.decor[id];

  interface Seat {
    player: Player;
    status: 'playing' | 'bench' | 'out';
    color: string;
  }

  const seats = $derived.by(() => {
    const list: Seat[] = [];
    for (const g of unlocked) {
      if (filter && g.id !== filter) continue;
      const team = v.s.teams[g.id];
      for (const id of team.lineup) {
        const p = id ? v.s.players[id] : undefined;
        if (p) list.push({ player: p, status: isAvailable(p, v.s.time) ? 'playing' : 'out', color: g.color });
      }
      for (const id of team.bench) {
        const p = v.s.players[id];
        if (p) list.push({ player: p, status: isAvailable(p, v.s.time) ? 'bench' : 'out', color: g.color });
      }
    }
    return list.slice(0, MAX_STATIONS);
  });

  /** Positions stations in one or two rows, back row first so the front row paints over it. */
  const placed = $derived.by(() => {
    const n = seats.length;
    if (n === 0) return [];
    const spread = (count: number, y: number, scale: number, offset: number) =>
      Array.from({ length: count }, (_, i) => ({
        seat: seats[offset + i],
        x: count === 1 ? 480 : 130 + (700 * i) / (count - 1),
        y,
        scale,
      }));
    if (n <= 5) return spread(n, 398, n <= 3 ? 1.15 : 1, 0);
    const back = Math.ceil(n / 2);
    return [...spread(back, 312, 0.78, 0), ...spread(n - back, 414, 0.95, back)];
  });

  const trophies = $derived(Math.min(10, Math.floor(v.s.trophies)));

  // Neutral surfaces per room, getting darker and sleeker as the org grows. The org's team colours
  // are mixed in at render time, so the house is dressed in the player's own colours.
  const WALLS = [
    ['#3c3c40', '#2a2a2d'],
    ['#35353a', '#242428'],
    ['#2e2e33', '#1e1e22'],
    ['#28282c', '#19191c'],
    ['#222226', '#141417'],
    ['#161618', '#0a0a0b'],
  ];
  const FLOORS = ['#48484c', '#3a3a3f', '#303035', '#26262a', '#1f1f23', '#18181b'];
  const kit = $derived(v.s.org);
  const wallTop = $derived(mix(WALLS[level][0], kit.primary, 0.1));
  const wallBottom = $derived(mix(WALLS[level][1], kit.primary, 0.06));
  const floor = $derived(mix(FLOORS[level], kit.primary, 0.05));
  /** The skyline glows in the team colour at night. */
  const skyGlow = $derived(level >= 5 ? '#121216' : mix('#24242a', kit.primary, 0.3));
  const POSTERS: { x: number; y: number; tone: 'primary' | 'secondary' | 'gold' }[] = [
    { x: 330, y: 60, tone: 'primary' },
    { x: 410, y: 50, tone: 'secondary' },
    { x: 490, y: 64, tone: 'gold' },
  ];
  const posterColor = (tone: 'primary' | 'secondary' | 'gold') => (tone === 'gold' ? '#f5c451' : kit[tone]);

  function decorTip(d: DecorDef) {
    const owned = !!game.view.s.decor[d.id];
    return {
      title: d.name,
      subtitle: owned ? 'Installed' : `Needs the ${ROOMS[d.room].name}`,
      icon: d.icon,
      iconColor: owned ? 'var(--green)' : 'var(--gold)',
      cost: owned ? undefined : money(d.cost),
      costOk: game.view.s.cash >= d.cost,
      lines: [{ text: d.desc, tone: 'muted' as const }, ...d.effects.map((e) => ({ text: STAT_DESCRIPTIONS[e.stat](e.amount), tone: 'good' as const }))],
    };
  }
</script>

<div class="house">
  <header class="head">
    <div>
      <h2 class="section-title">{room.name}</h2>
      <p class="muted small">{room.desc}</p>
    </div>
    {#if next}
      <div class="next" use:tooltip={() => ({ title: `Next: ${next.name}`, icon: 'house', lines: [next.desc, `Earn ${money(next.threshold)} this run to move in.`] })}>
        <span class="muted small">Next: {next.name}</span>
        <span class="bar"><i style="width:{Math.min(100, (v.s.earnedRun / next.threshold) * 100)}%"></i></span>
        <span class="num small">{fmtPct(Math.min(1, v.s.earnedRun / next.threshold))}</span>
      </div>
    {/if}
  </header>

  {#if unlocked.length > 1}
    <div class="filters">
      <button class:active={!filter} onclick={() => (filter = null)}>Everyone</button>
      {#each unlocked as g (g.id)}
        <button class:active={filter === g.id} style="--gc:{g.color}" onclick={() => (filter = g.id)}>
          <Icon name={g.icon} size={13} color={g.color} />
          {g.name}
        </button>
      {/each}
    </div>
  {/if}

  <div class="scene-wrap">
    <svg class="scene" viewBox="0 0 960 460" role="img" aria-label="{room.name} with {seats.length} players">
      <defs>
        <linearGradient id="house-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color={wallTop} />
          <stop offset="1" stop-color={wallBottom} />
        </linearGradient>
        <linearGradient id="house-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color={level >= 5 ? '#050506' : '#101013'} />
          <stop offset="1" stop-color={skyGlow} />
        </linearGradient>
        <linearGradient id="house-rgb" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color={kit.primary} />
          <stop offset="0.5" stop-color={kit.secondary} />
          <stop offset="1" stop-color={kit.primary} />
        </linearGradient>
        <filter id="house-glow" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <!-- Structure -->
      <rect x="0" y="0" width="960" height="290" fill="url(#house-wall)" />
      <rect x="0" y="290" width="960" height="170" fill={floor} />
      <path d="M0 290 H960" stroke="rgba(255,255,255,0.08)" stroke-width="3" />
      {#each [0, 1, 2, 3, 4, 5, 6, 7, 8] as i (i)}
        <path d="M{480 + (i - 4) * 60} 290 L{480 + (i - 4) * 180} 460" stroke="rgba(255,255,255,0.03)" stroke-width="2" />
      {/each}

      {#if level === 0}
        <g opacity="0.85">
          <rect x="700" y="60" width="220" height="230" fill="#2f333c" />
          {#each [0, 1, 2, 3, 4, 5, 6, 7] as i (i)}
            <rect x="706" y={68 + i * 28} width="208" height="22" rx="2" fill="#3b404a" />
          {/each}
        </g>
        <path d="M480 0 V52" stroke="#222" stroke-width="2" />
        <circle cx="480" cy="60" r="9" fill="#ffe9a3" filter="url(#house-glow)" />
        <ellipse cx="300" cy="420" rx="60" ry="10" fill="rgba(0,0,0,0.25)" />
      {:else if level === 1}
        {#each [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as i (i)}
          <rect x={i * 80} y="0" width="40" height="290" fill="rgba(255,255,255,0.025)" />
        {/each}
        <rect x="70" y="50" width="220" height="150" rx="4" fill="url(#house-sky)" stroke="#5b4a3f" stroke-width="8" />
        {#each [[90, 130, 26, 70], [122, 110, 20, 90], [148, 145, 34, 55], [188, 120, 24, 80], [218, 140, 40, 60], [262, 125, 22, 75]] as [bx, by, bw, bh] (bx)}
          <rect x={bx} y={by} width={bw} height={bh} fill="#141733" />
        {/each}
        <path d="M180 50 V200 M70 125 H290" stroke="#5b4a3f" stroke-width="5" />
      {:else if level === 2}
        <rect x="60" y="40" width="160" height="130" rx="4" fill="url(#house-sky)" stroke="#2a2a2f" stroke-width="6" />
        <rect x="740" y="40" width="160" height="130" rx="4" fill="url(#house-sky)" stroke="#2a2a2f" stroke-width="6" />
        <circle cx="850" cy="80" r="14" fill="#f5f0d8" opacity="0.85" />
      {:else if level === 3 || level === 4}
        <rect x="0" y="20" width="960" height="250" fill="url(#house-sky)" opacity="0.9" />
        {#each Array.from({ length: 24 }, (_, i) => i) as i (i)}
          <rect x={i * 40 + 4} y={level === 4 ? 200 - ((i * 37) % 60) : 150 - ((i * 53) % 90)} width="32" height="140" fill={level === 4 ? '#0b1b24' : '#0b1128'} />
        {/each}
        {#if level === 4}
          <path d="M120 270 Q480 120 840 270" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="10" />
          {#each [160, 480, 800] as lx (lx)}
            <circle cx={lx} cy="60" r="10" fill="#fffbe0" filter="url(#house-glow)" />
          {/each}
        {/if}
        {#each [0, 1, 2, 3, 4, 5, 6, 7] as i (i)}
          <path d="M{i * 120} 20 V270" stroke="rgba(255,255,255,0.08)" stroke-width="4" />
        {/each}
      {:else}
        {#each [180, 480, 780] as px (px)}
          <circle cx={px} cy="130" r="92" fill="url(#house-sky)" stroke="#2c2c31" stroke-width="12" />
        {/each}
        {#each Array.from({ length: 40 }, (_, i) => i) as i (i)}
          <circle cx={(i * 211) % 960} cy={50 + ((i * 97) % 170)} r={i % 5 === 0 ? 1.8 : 1} fill="#fff" opacity="0.7" />
        {/each}
        <path d="M400 200 Q480 150 560 200" fill="none" stroke="#ff9a3c" stroke-width="10" opacity="0.45" />
      {/if}

      <!-- Wall decor -->
      {#if has('rgb')}
        <rect x="0" y="4" width="960" height="4" fill="url(#house-rgb)" filter="url(#house-glow)" class="rgb" />
        <rect x="0" y="286" width="960" height="3" fill="url(#house-rgb)" filter="url(#house-glow)" class="rgb" />
      {/if}
      {#if has('posters')}
        {#each POSTERS as poster (poster.x)}
          <rect x={poster.x} y={poster.y} width="58" height="80" rx="2" fill="#141417" stroke={posterColor(poster.tone)} stroke-width="2" />
          <circle cx={poster.x + 29} cy={poster.y + 32} r="14" fill={posterColor(poster.tone)} opacity="0.6" />
          <rect x={poster.x + 10} y={poster.y + 58} width="38" height="4" fill="#fff" opacity="0.5" />
        {/each}
      {/if}
      {#if has('whiteboard')}
        <rect x="580" y="54" width="120" height="80" rx="3" fill="#eef0f5" stroke="#a3a09a" stroke-width="3" />
        <path d="M596 110 q 20 -30 40 -10 t 40 -20 M600 76 l 20 10 M650 70 a 10 10 0 1 0 0.1 0" stroke="#f0525f" stroke-width="2" fill="none" />
      {/if}
      {#if has('neon')}
        <text x="480" y="44" text-anchor="middle" class="neon" fill={kit.primary} filter="url(#house-glow)">{v.s.org.name}</text>
      {/if}
      {#if has('shelf')}
        <rect x="80" y="210" width="200" height="8" fill="#3a3a40" />
        {#each Array.from({ length: trophies }, (_, i) => i) as i (i)}
          <g transform="translate({92 + i * 19} 188)">
            <path d="M0 0 H14 V6 Q14 14 7 14 Q0 14 0 6 Z" fill="#f5c451" />
            <rect x="5" y="14" width="4" height="5" fill="#d9a441" />
            <rect x="2" y="19" width="10" height="3" fill="#b8862f" />
          </g>
        {/each}
      {/if}
      {#if has('aquarium')}
        <rect x="720" y="190" width="140" height="90" rx="4" fill="rgba(34,168,255,0.35)" stroke="#9ad4ff" stroke-width="3" />
        <ellipse cx="760" cy="230" rx="10" ry="5" fill="#ff9a3c" class="fish" />
        <ellipse cx="820" cy="250" rx="8" ry="4" fill="#f5c451" class="fish slow" />
        <circle cx="840" cy="210" r="3" fill="none" stroke="#fff" opacity="0.6" />
      {/if}

      <!-- Floor decor (back) -->
      {#if has('fridge')}
        <rect x="900" y="200" width="50" height="110" rx="5" fill="#d7dbe3" />
        <path d="M900 240 H950" stroke="#aeb3bd" stroke-width="2" />
        <rect x="940" y="214" width="3" height="18" fill="#8d929c" />
      {/if}
      {#if has('arcade')}
        <path d="M20 180 H90 L96 320 H14 Z" fill="#1d1d21" stroke={kit.secondary} stroke-width="2" />
        <rect x="30" y="196" width="50" height="40" fill={kit.primary} opacity="0.6" filter="url(#house-glow)" />
      {/if}
      {#if has('espresso')}
        <rect x="600" y="262" width="60" height="30" fill="#2a2a2e" />
        <rect x="612" y="236" width="36" height="28" rx="3" fill="#b9bec7" />
      {/if}
      {#if has('massage')}
        <path d="M860 330 Q880 260 930 280 L940 360 H860 Z" fill={shade(kit.primary, -0.55)} />
      {/if}
      {#if has('napPods')}
        <ellipse cx="60" cy="350" rx="44" ry="60" fill="#ecebe6" stroke={kit.primary} stroke-width="2" />
        <ellipse cx="60" cy="340" rx="28" ry="36" fill="#1d1d21" />
      {/if}
      {#if has('holotable')}
        <path d="M430 300 L400 270 H560 L530 300 Z" fill={kit.primary} fill-opacity="0.25" filter="url(#house-glow)" />
      {/if}

      <!-- Stations -->
      {#each placed as pos (pos.seat.player.id)}
        <Station
          player={pos.seat.player}
          x={pos.x}
          y={pos.y}
          scale={pos.scale}
          primary={teamKit(v.s, pos.seat.player.gameId).primary}
          secondary={teamKit(v.s, pos.seat.player.gameId).secondary}
          gameColor={pos.seat.color}
          status={pos.seat.status}
        />
      {/each}

      <!-- Front decor -->
      {#if has('plants')}
        {#each [24, 920] as px (px)}
          <g transform="translate({px} 400)">
            <path d="M-14 0 H14 L10 40 H-10 Z" fill="#a0522d" />
            <path d="M0 0 Q-24 -30 -8 -60 M0 0 Q20 -40 6 -70 M0 0 Q-4 -40 14 -50" stroke="#4ade80" stroke-width="6" fill="none" stroke-linecap="round" />
          </g>
        {/each}
      {/if}
      {#if has('beanbags')}
        <ellipse cx="180" cy="440" rx="54" ry="24" fill={v.s.org.secondary} opacity="0.85" />
        <ellipse cx="250" cy="448" rx="44" ry="20" fill={v.s.org.primary} opacity="0.85" />
      {/if}
      {#if has('cat')}
        <g transform="translate(690 432)" class="cat">
          <ellipse cx="0" cy="0" rx="20" ry="12" fill="#1b1b22" />
          <circle cx="18" cy="-12" r="9" fill="#1b1b22" />
          <path d="M12 -18 L14 -28 L19 -20 Z M20 -20 L25 -28 L26 -17 Z" fill="#1b1b22" />
          <circle cx="21" cy="-13" r="1.6" fill="#c5e84a" />
          <path d="M-20 0 Q-36 -6 -30 -22" stroke="#1b1b22" stroke-width="4" fill="none" stroke-linecap="round" />
        </g>
      {/if}
      {#if has('zeroG')}
        {#each [[140, 120], [480, 90], [820, 140]] as [ox, oy] (ox)}
          <circle cx={ox} cy={oy} r="10" fill="#a97bff" opacity="0.5" filter="url(#house-glow)" class="float" />
        {/each}
      {/if}

      {#if seats.length === 0}
        <text x="480" y="380" text-anchor="middle" class="empty">No players here yet. Sign some from the transfer market.</text>
      {/if}
    </svg>
  </div>

  <section>
    <h3 class="section-title">Decor</h3>
    <div class="decor">
      {#each DECOR as d (d.id)}
        {@const owned = has(d.id)}
        {@const fits = level >= d.room}
        <button
          class="item"
          class:owned
          class:locked={!fits}
          class:poor={!owned && fits && v.s.cash < d.cost}
          disabled={owned || !fits || v.s.cash < d.cost}
          onclick={() => game.buyDecor(d.id)}
          use:tooltip={() => decorTip(d)}
        >
          <span class="dicon"><Icon name={fits ? d.icon : 'lock'} size={20} /></span>
          <span class="dname">{fits ? d.name : '???'}</span>
          <span class="dcost num">{owned ? 'Installed' : fits ? money(d.cost) : ROOMS[d.room].name}</span>
        </button>
      {/each}
    </div>
  </section>
</div>

<style>
  .house {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .small {
    font-size: 12.5px;
    margin: 0;
  }
  .next {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 220px;
  }
  .next .bar {
    flex: 1;
  }
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .filters button {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid var(--line-2);
    background: var(--bg-2);
    color: var(--muted);
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 13px;
  }
  .filters button.active {
    color: var(--text);
    border-color: var(--gc, var(--accent));
  }
  .scene-wrap {
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--line-2);
    box-shadow: var(--shadow);
  }
  .scene {
    display: block;
    width: 100%;
    height: auto;
  }
  .neon {
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 30px;
    letter-spacing: 4px;
  }
  .empty {
    font-family: var(--font-ui);
    font-size: 20px;
    fill: var(--muted);
  }
  .rgb {
    animation: hue 6s linear infinite;
  }
  .fish {
    animation: swim 6s ease-in-out infinite;
  }
  .fish.slow {
    animation-duration: 9s;
  }
  .float {
    animation: float 4s ease-in-out infinite;
  }
  .decor {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 6px;
  }
  .item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: 8px 10px;
    border-radius: 9px;
    border: 1px solid var(--line-2);
    background: var(--bg-2);
    text-align: left;
  }
  .item:hover:not(:disabled) {
    border-color: var(--gold);
  }
  .item:disabled {
    cursor: default;
  }
  .item.owned {
    border-color: color-mix(in srgb, var(--green) 45%, transparent);
    background: linear-gradient(180deg, color-mix(in srgb, var(--green) 10%, transparent), transparent), var(--bg-2);
  }
  .item.locked {
    opacity: 0.45;
  }
  /* Framed like gear and staff icons so every purchasable in the game reads the same way. */
  .dicon {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    margin-bottom: 3px;
    border-radius: 8px;
    color: var(--gold);
    border: 1.5px solid color-mix(in srgb, var(--gold) 40%, transparent);
    background: linear-gradient(145deg, color-mix(in srgb, var(--gold) 18%, transparent), transparent 60%), var(--bg);
  }
  .item.owned .dicon {
    color: var(--green);
    border-color: color-mix(in srgb, var(--green) 55%, transparent);
    background: linear-gradient(145deg, color-mix(in srgb, var(--green) 20%, transparent), transparent 60%), var(--bg);
  }
  .item.poor .dicon {
    color: var(--dim);
    border-color: var(--line-2);
    background: var(--bg);
  }
  .item.poor .dcost {
    color: var(--red);
  }
  .dname {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 14px;
  }
  .dcost {
    font-size: 12px;
    color: var(--muted);
  }
  @keyframes hue {
    to {
      filter: hue-rotate(360deg);
    }
  }
  @keyframes swim {
    50% {
      transform: translateX(40px);
    }
  }
  @keyframes float {
    50% {
      transform: translateY(-12px);
    }
  }
</style>
