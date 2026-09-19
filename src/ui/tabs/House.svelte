<script lang="ts">
  import { DECOR, ROOMS, type DecorDef } from '../../data/decor';
  import { GAMES } from '../../data/games';
  import { STAT_DESCRIPTIONS } from '../../data/staff';
  import { fmtPct, money } from '../../engine/format';
  import { isAvailable } from '../../engine/players';
  import { teamKit } from '../../engine/teams';
  import { roomLevel } from '../../engine/staff';
  import type { Player } from '../../engine/types';
  import { mix } from '../color';
  import DecorIcon from '../components/DecorIcon.svelte';
  import Icon from '../components/Icon.svelte';
  import Station from '../components/Station.svelte';
  import { decorArtMarkup } from '../decorArt';
  import { game } from '../game.svelte';
  import { rarityName, roomColor } from '../theme';
  import { tooltip } from '../tooltip.svelte';
  import { trophyTip } from '../trophyTip';

  const MAX_STATIONS = 10;
  /** Trophies drawn on the house shelf, newest first. */
  const SHELF_TROPHIES = 9;

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
  const primary = $derived(v.s.org.primary);
  const secondary = $derived(v.s.org.secondary);
  const orgName = $derived(v.s.org.name);
  const wallTop = $derived(mix(WALLS[level][0], primary, 0.1));
  const wallBottom = $derived(mix(WALLS[level][1], primary, 0.06));
  const floor = $derived(mix(FLOORS[level], primary, 0.05));
  /** The skyline glows in the team colour at night. */
  const skyGlow = $derived(level >= 5 ? '#121216' : mix('#24242a', primary, 0.3));

  /**
   * Where each item stands in the 960x460 scene: top-left corner and scale of its 48x48 drawing.
   * Wall items hang behind everything; back items stand against the wall behind the players; front
   * items sit on the floor in front of them.
   */
  interface Placement {
    x: number;
    y: number;
    s: number;
    layer: 'wall' | 'back' | 'front';
  }
  const PLACES: Record<string, Placement> = {
    posters: { x: 292, y: 70, s: 2.2, layer: 'wall' },
    whiteboard: { x: 570, y: 64, s: 2.6, layer: 'wall' },
    arcade: { x: -22, y: 150, s: 3.1, layer: 'back' },
    napPods: { x: 150, y: 170, s: 2.6, layer: 'back' },
    holotable: { x: 420, y: 178, s: 2.5, layer: 'back' },
    aquarium: { x: 690, y: 164, s: 2.8, layer: 'back' },
    fridge: { x: 858, y: 168, s: 2.7, layer: 'back' },
    beanbags: { x: 58, y: 340, s: 2.7, layer: 'front' },
    cat: { x: 626, y: 372, s: 1.9, layer: 'front' },
    massage: { x: 770, y: 356, s: 2.3, layer: 'front' },
  };
  const PLANT_SPOTS = [
    { x: -14, y: 360 },
    { x: 880, y: 360 },
  ];
  const placedIn = (layer: Placement['layer']) => Object.entries(PLACES).filter(([id, p]) => p.layer === layer && has(id));

  // Built only from constants in decorArt.ts and the org's validated hex colour, so {@html} is safe.
  const sceneArt = $derived.by(() => {
    const out: Record<string, string> = {};
    for (const d of DECOR) out[d.id] = decorArtMarkup(d.id, primary, true);
    return out;
  });

  const shelfTrophies = $derived(v.s.trophyCase.slice(0, SHELF_TROPHIES));
  /** Metal by league tier, as on the trophy cabinet. */
  const metal = (tier: number) =>
    tier >= 9 ? ['#e2f4ff', '#8fb8cf'] : tier >= 6 ? ['#f5c451', '#c99a2e'] : tier >= 3 ? ['#d2d5d9', '#9ea2a8'] : ['#d08f58', '#9a6436'];
  /** The neon sign squeezes long names instead of running off its board. */
  const NEON_MAX = 230;
  const neonWidth = $derived(Math.min(NEON_MAX, orgName.length * 21));

  function effectsText(d: DecorDef): string {
    return d.effects.map((e) => STAT_DESCRIPTIONS[e.stat](e.amount)).join(' · ');
  }

  function decorTip(d: DecorDef) {
    const owned = !!game.view.s.decor[d.id];
    return {
      title: d.name,
      subtitle: `${rarityName(d.room)} decor · ${owned ? 'Installed' : `for the ${ROOMS[d.room].name}`}`,
      icon: d.icon,
      iconColor: roomColor(d.room),
      cost: owned ? undefined : money(d.cost),
      costOk: game.view.s.cash >= d.cost,
      lines: [{ text: d.desc, tone: 'muted' as const }, ...d.effects.map((e) => ({ text: STAT_DESCRIPTIONS[e.stat](e.amount), tone: 'good' as const }))],
    };
  }
</script>

<div class="house">
  <header class="head">
    <div>
      <h2 class="section-title room-title" style="--rc:{roomColor(level)}"><i></i>{room.name} <span class="rar">{rarityName(level)}</span></h2>
      <p class="muted small">{room.desc}</p>
    </div>
    {#if next}
      <div class="next" use:tooltip={() => ({ title: `Next: ${next.name}`, icon: 'house', iconColor: roomColor(level + 1), lines: [next.desc, `Earn ${money(next.threshold)} this run to move in.`] })}>
        <span class="muted small">Next: {next.name}</span>
        <span class="bar" style="--bar:{roomColor(level + 1)}"><i style="width:{Math.min(100, (v.s.earnedRun / next.threshold) * 100)}%"></i></span>
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
          <stop offset="0" stop-color={primary} />
          <stop offset="0.5" stop-color={secondary} />
          <stop offset="1" stop-color={primary} />
        </linearGradient>
        <radialGradient id="house-pool" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#000" stop-opacity="0.4" />
          <stop offset="1" stop-color="#000" stop-opacity="0" />
        </radialGradient>
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
        <rect x="70" y="50" width="200" height="140" rx="4" fill="url(#house-sky)" stroke="#5b4a3f" stroke-width="8" />
        {#each [[90, 125, 26, 65], [122, 105, 20, 85], [148, 140, 34, 50], [188, 115, 24, 75], [218, 135, 40, 55]] as [bx, by, bw, bh] (bx)}
          <rect x={bx} y={by} width={bw} height={bh} fill="#141733" />
        {/each}
        <path d="M170 50 V190 M70 120 H270" stroke="#5b4a3f" stroke-width="5" />
      {:else if level === 2}
        <rect x="60" y="40" width="160" height="120" rx="4" fill="url(#house-sky)" stroke="#2a2a2f" stroke-width="6" />
        <rect x="740" y="40" width="160" height="120" rx="4" fill="url(#house-sky)" stroke="#2a2a2f" stroke-width="6" />
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
        {#each [120, 360, 600, 840] as lx (lx)}
          <circle cx={lx} cy="6" r="3" fill="#fff" opacity="0.8" class="rgb" />
        {/each}
      {/if}
      {#if has('neon')}
        <g class="neon-sign">
          <path d="M{480 - neonWidth / 2 - 10} 0 V16 M{480 + neonWidth / 2 + 10} 0 V16" stroke="#3d3e45" stroke-width="2" />
          <rect x={480 - neonWidth / 2 - 22} y="14" width={neonWidth + 44} height="46" rx="10" fill="#0e0e11" stroke="#2c2d33" stroke-width="2" />
          <rect x={480 - neonWidth / 2 - 14} y="20" width={neonWidth + 28} height="34" rx="7" fill={primary} opacity="0.08" />
          <text
            x="480"
            y="48"
            text-anchor="middle"
            class="neon"
            fill={primary}
            filter="url(#house-glow)"
            textLength={orgName.length * 21 > NEON_MAX ? NEON_MAX : undefined}
            lengthAdjust="spacingAndGlyphs">{orgName}</text
          >
        </g>
      {/if}
      {#each placedIn('wall') as [id, p] (id)}
        <g transform="translate({p.x} {p.y}) scale({p.s})">{@html sceneArt[id]}</g>
      {/each}
      {#if has('shelf')}
        <g class="shelf">
          <path d="M800 70 L716 170 H884 Z" fill={primary} opacity="0.06" />
          {#each shelfTrophies as t, i (t.id)}
            {@const [fill, shadeColor] = metal(t.tier)}
            <g transform="translate({716 + i * 19} {t.kind === 'title' ? 144 : 148})" class="shelf-trophy" use:tooltip={() => trophyTip(v.s, t)}>
              <!-- A hit area, so a thin trophy is still easy to hover. -->
              <rect x="-2" y="-4" width="19" height="32" fill="transparent" />
              {#if t.kind === 'title'}
                <path d="M0 0 H14 V6 Q14 14 7 14 Q0 14 0 6 Z" fill={fill} />
                <path d="M7 0 H14 V6 Q14 14 7 14 Z" fill={shadeColor} opacity="0.4" />
                <rect x="5.5" y="14" width="3" height="6" fill={shadeColor} />
                <rect x="2" y="20" width="10" height="4" rx="1" fill={fill} />
              {:else if t.kind === 'sponsor' || t.kind === 'quest'}
                <circle cx="7" cy="7" r="6.4" fill={t.kind === 'quest' ? 'none' : fill} stroke={shadeColor} stroke-width={t.kind === 'quest' ? 1.6 : 0.8} />
                {#if t.kind === 'quest'}<path d="M4.4 11 3 18l4-2.2L11 18l-1.4-7Z" fill={shadeColor} opacity="0.85" />{/if}
                <rect x="5.8" y="13.4" width="2.4" height="6.6" fill={shadeColor} />
                <rect x="2" y="20" width="10" height="3" rx="1" fill={fill} />
              {:else}
                <path
                  d="M7 0 L9.2 4.6 L14 5.2 L10.4 8.6 L11.4 13.4 L7 11 L2.6 13.4 L3.6 8.6 L0 5.2 L4.8 4.6 Z"
                  fill={t.kind === 'runnerUp' ? 'none' : fill}
                  stroke={shadeColor}
                  stroke-width={t.kind === 'runnerUp' ? 1.3 : 0.8}
                />
                <rect x="5.8" y="13" width="2.4" height="7" fill={shadeColor} />
                <rect x="2" y="20" width="10" height="3" rx="1" fill={fill} />
              {/if}
            </g>
          {/each}
          {#if shelfTrophies.length === 0}
            <text x="800" y="162" text-anchor="middle" class="shelf-empty">Your trophies go here</text>
          {/if}
          <rect x="708" y="168" width="184" height="7" rx="1.5" fill="#a8764b" />
          <rect x="708" y="175" width="184" height="2" fill="#7d5535" />
          <path d="M718 177 H726 L718 186 Z M874 177 H882 V186 Z" fill="#6d7077" />
        </g>
      {/if}

      <!-- Floor decor at the back, behind the players -->
      {#if has('espresso')}
        <rect x="590" y="244" width="100" height="48" rx="3" fill="#232327" />
        <rect x="586" y="240" width="108" height="7" rx="2" fill="#3d3e45" />
        <g transform="translate(606 186) scale(1.45)">{@html sceneArt.espresso}</g>
      {/if}
      {#each placedIn('back') as [id, p] (id)}
        <ellipse cx={p.x + 24 * p.s} cy={p.y + 44 * p.s} rx={16 * p.s} ry={2.6 * p.s} fill="url(#house-pool)" />
        <g transform="translate({p.x} {p.y}) scale({p.s})">{@html sceneArt[id]}</g>
      {/each}

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
          label={false}
        />
      {/each}

      <!-- Floor decor at the front -->
      {#if has('plants')}
        {#each PLANT_SPOTS as spot (spot.x)}
          <ellipse cx={spot.x + 24 * 2.1} cy={spot.y + 44 * 2.1} rx="34" ry="6" fill="url(#house-pool)" />
          <g transform="translate({spot.x} {spot.y}) scale(2.1)">{@html sceneArt.plants}</g>
        {/each}
      {/if}
      {#each placedIn('front') as [id, p] (id)}
        <ellipse cx={p.x + 24 * p.s} cy={p.y + 44 * p.s} rx={18 * p.s} ry={2.6 * p.s} fill="url(#house-pool)" />
        <!-- The CSS animation sits on an inner group: it would replace the outer group's transform. -->
        <g transform="translate({p.x} {p.y}) scale({p.s})"><g class="decor-{id}">{@html sceneArt[id]}</g></g>
      {/each}
      {#if has('zeroG')}
        <g class="float">
          <ellipse cx="170" cy="120" rx="34" ry="11" fill="#ecebe6" transform="rotate(-12 170 120)" />
          <ellipse cx="170" cy="116" rx="26" ry="6" fill={primary} opacity="0.7" transform="rotate(-12 170 116)" />
        </g>
        <g class="float slow">
          <circle cx="820" cy="110" r="12" fill={primary} opacity="0.55" filter="url(#house-glow)" />
          <ellipse cx="820" cy="110" rx="22" ry="5" fill="none" stroke="#fff" stroke-opacity="0.5" stroke-width="1.5" />
        </g>
        <g class="float">
          <circle cx="520" cy="100" r="6" fill="#4ade80" opacity="0.8" />
          <circle cx="532" cy="90" r="3" fill="#4ade80" opacity="0.6" />
        </g>
      {/if}

      <!-- Names go on top of everything, so no player, desk or decor in front can hide one. -->
      {#each placed as pos (pos.seat.player.id)}
        <text
          x={pos.x}
          y={pos.y + 26 * pos.scale}
          text-anchor="middle"
          class="name-tag"
          class:out={pos.seat.status === 'out'}
          font-size={Math.max(14, 16 * pos.scale)}>{pos.seat.player.tag}</text
        >
      {/each}

      {#if seats.length === 0}
        <text x="480" y="380" text-anchor="middle" class="empty">No players here yet. Sign some from the transfer market.</text>
      {/if}
    </svg>
  </div>

  <section>
    <h3 class="section-title">Decor</h3>
    <p class="muted small">Every room unlocks a rarer set of decor. Items keep their room's rarity colour, from Garage common to Orbital mythic.</p>
    {#each ROOMS as rm, ri (rm.name)}
      {@const items = DECOR.filter((d) => d.room === ri)}
      {#if items.length > 0}
        <div class="room-group" class:closed={level < ri} style="--rc:{roomColor(ri)}">
          <div class="room-label">
            <i></i>
            <span>{rm.name}</span>
            <span class="rar">{rarityName(ri)}</span>
            {#if level < ri}<span class="dim small"><Icon name="lock" size={11} /> Earn {money(rm.threshold)} this run to move in</span>{/if}
          </div>
          <div class="decor">
            {#each items as d (d.id)}
              {@const owned = has(d.id)}
              {@const fits = level >= d.room}
              {@const poor = !owned && fits && v.s.cash < d.cost}
              <button
                class="item"
                class:owned
                class:locked={!fits}
                class:poor
                disabled={owned || !fits || v.s.cash < d.cost}
                onclick={() => game.buyDecor(d.id)}
                use:tooltip={() => decorTip(d)}
              >
                <DecorIcon id={d.id} rarity={d.room} size={50} locked={!fits} dim={poor} />
                <span class="info">
                  <span class="dname">{fits ? d.name : '???'}</span>
                  <span class="deffect">{fits ? effectsText(d) : `Fits in the ${rm.name}`}</span>
                  <span class="dcost num">{owned ? 'Installed' : money(d.cost)}</span>
                </span>
                {#if owned}<span class="tick" aria-label="Installed"><Icon name="check" size={12} /></span>{/if}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    {/each}
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
  .room-title {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .room-title i,
  .room-label i {
    width: 10px;
    height: 10px;
    border-radius: 3px;
    background: var(--rc);
    box-shadow: 0 0 8px color-mix(in srgb, var(--rc) 60%, transparent);
  }
  .rar {
    padding: 1px 7px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--rc) 50%, transparent);
    color: var(--rc);
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
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
  .next .bar :global(i) {
    background: var(--bar);
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
  .neon-sign {
    animation: flicker 7s linear infinite;
  }
  .shelf-trophy {
    cursor: help;
  }
  .shelf-empty {
    font-family: var(--font-ui);
    font-size: 12px;
    fill: var(--dim);
  }
  .name-tag {
    font-family: var(--font-ui);
    font-weight: 700;
    fill: #fff;
    paint-order: stroke;
    stroke: rgba(8, 8, 10, 0.9);
    stroke-width: 4px;
    stroke-linejoin: round;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.85));
  }
  .name-tag.out {
    fill: #d6d6d9;
  }
  .empty {
    font-family: var(--font-ui);
    font-size: 20px;
    fill: var(--muted);
  }
  .rgb {
    animation: hue 6s linear infinite;
  }
  .float {
    animation: float 4s ease-in-out infinite;
  }
  .float.slow {
    animation-duration: 6s;
  }
  .decor-cat {
    animation: breathe 3.5s ease-in-out infinite;
    transform-box: fill-box;
    transform-origin: 50% 100%;
  }

  .room-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 10px;
  }
  .room-label {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 7px;
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 14px;
  }
  .room-group.closed .room-label > span:first-of-type {
    color: var(--muted);
  }
  .decor {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 6px;
  }
  .item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 10px 7px 7px;
    border-radius: 10px;
    border: 1px solid color-mix(in srgb, var(--rc) 30%, var(--line-2));
    background: linear-gradient(100deg, color-mix(in srgb, var(--rc) 9%, transparent), transparent 60%), var(--bg-2);
    text-align: left;
  }
  .item:hover:not(:disabled) {
    border-color: var(--rc);
    transform: translateY(-1px);
  }
  .item:disabled {
    cursor: default;
  }
  .item.owned {
    border-color: color-mix(in srgb, var(--rc) 60%, transparent);
    background: linear-gradient(100deg, color-mix(in srgb, var(--rc) 16%, transparent), transparent 70%), var(--bg-2);
  }
  .item.locked {
    opacity: 0.6;
  }
  .item.owned .info {
    padding-right: 16px;
  }
  .info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .dname {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 14px;
    line-height: 1.15;
  }
  .deffect {
    font-size: 11.5px;
    color: var(--muted);
    line-height: 1.25;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .dcost {
    font-size: 12px;
    color: var(--green);
  }
  .item.owned .dcost {
    color: var(--rc);
  }
  .item.poor .dcost {
    color: var(--red);
  }
  .item.locked .dcost {
    color: var(--muted);
  }
  .tick {
    position: absolute;
    top: 6px;
    right: 6px;
    display: grid;
    place-items: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    color: #0c0c0e;
    background: var(--rc);
  }
  @keyframes hue {
    to {
      filter: hue-rotate(360deg);
    }
  }
  @keyframes float {
    50% {
      transform: translateY(-12px);
    }
  }
  @keyframes breathe {
    50% {
      transform: scaleY(1.03);
    }
  }
  @keyframes flicker {
    0%,
    91%,
    94%,
    100% {
      opacity: 1;
    }
    92%,
    95% {
      opacity: 0.55;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .rgb,
    .float,
    .decor-cat,
    .neon-sign {
      animation: none;
    }
  }
</style>
