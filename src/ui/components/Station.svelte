<svelte:options namespace="svg" />

<script lang="ts">
  import { SKIN_TONES } from '../../data/cosmetics';
  import { gearRarity, type GearSlot } from '../../data/gear';
  import { matchEasterEgg } from '../../engine/easterEggs';
  import { gameScreenSvg } from '../gameArt';
  import { gearArtMarkup } from '../gearArt';
  import type { Player } from '../../engine/types';
  import { shade } from '../color';
  import Avatar from './Avatar.svelte';
  import Icon from './Icon.svelte';

  let {
    player,
    x,
    y,
    scale = 1,
    primary,
    secondary,
    gameColor,
    status,
    label = true,
  }: {
    player: Player;
    x: number;
    y: number;
    scale?: number;
    primary: string;
    secondary: string;
    gameColor: string;
    status: 'playing' | 'bench' | 'out';
    /** Draw the name under the desk. The house draws names in its own top layer instead. */
    label?: boolean;
  } = $props();

  const uid = $props.id();
  const gear = $derived(player.gear);
  // Glowing effects take the rarity colour of the item producing them.
  const glow = (slot: GearSlot) => gearRarity(gear[slot]).color;
  /** The desk surface the keyboard, hands and charm sit on: the starter crate is lower than a real desk. */
  const deskTop = $derived(gear.desk === 0 ? -56 : -62);
  const skin = $derived(matchEasterEgg(player.tag) === 'varantha' ? '#4f558a' : (SKIN_TONES[player.look.skin] ?? SKIN_TONES[0]));
  // The lucky charm (the composure item) stands on the desk. Drawn from constants in gearArt.ts.
  const charmArt = $derived(gearArtMarkup('charm', gear.charm ?? 0));
  // Their game on the screens. Drawn from constants in gameArt.ts.
  const screenArt = $derived(gameScreenSvg(player.gameId, gameColor));
  const playing = $derived(status === 'playing');
  /** Each player types at their own tempo, so a full floor never moves in step. */
  const tempo = $derived.by(() => {
    let h = 0;
    for (let i = 0; i < player.id.length; i++) h = (h * 31 + player.id.charCodeAt(i)) % 997;
    return { delay: (h % 10) / 10, speed: 0.32 + (h % 5) * 0.03 };
  });
  const badge = $derived(
    status === 'playing'
      ? { icon: 'gamepad-2', fill: '#1f9d5c' }
      : status === 'bench'
        ? { icon: 'sleep', fill: '#55555e' }
        : { icon: 'thermometer', fill: '#c9304f' },
  );
</script>

<g transform="translate({x} {y}) scale({scale})" class="station" class:out={status === 'out'}>
  <defs>
    <filter id="{uid}-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2" result="b" />
      <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <linearGradient id="{uid}-screen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color={gameColor} stop-opacity="0.9" />
      <stop offset="1" stop-color="#0e0e10" />
    </linearGradient>
  </defs>

  <ellipse cx="0" cy="6" rx="78" ry="10" fill="rgba(0,0,0,0.35)" />

  <!-- Chair -->
  {#if gear.chair === 0}
    <rect x="-18" y="-40" width="36" height="7" rx="3" fill="#6b5a45" />
    <rect x="-3" y="-33" width="6" height="36" fill="#4a3d2f" />
  {:else if gear.chair <= 2}
    <rect x="-24" y="-96" width="48" height="56" rx="9" fill="#2e2e34" />
    <rect x="-3" y="-40" width="6" height="40" fill="#1c1c1f" />
    <path d="M-20 2 L20 2" stroke="#1c1c1f" stroke-width="5" stroke-linecap="round" />
  {:else if gear.chair <= 5}
    <path d="M-27 -40 L-29 -110 Q0 -124 29 -110 L27 -40 Z" fill={primary} />
    <path d="M-11 -112 L-9 -44 M11 -112 L9 -44" stroke={shade(primary, -0.45)} stroke-width="6" />
    <rect x="-3" y="-40" width="6" height="40" fill="#18181b" />
    <path d="M-22 2 L22 2" stroke="#18181b" stroke-width="5" stroke-linecap="round" />
  {:else}
    <path d="M-31 -40 L-34 -126 Q0 -142 34 -126 L31 -40 Z" fill={shade(primary, -0.2)} stroke="#f5c451" stroke-width="2.5" />
    <path d="M-12 -128 L0 -140 L12 -128" fill="none" stroke="#f5c451" stroke-width="2.5" />
    {#if gear.chair >= 10}
      <ellipse cx="0" cy="-2" rx="30" ry="5" fill={glow('chair')} opacity="0.55" filter="url(#{uid}-glow)" />
    {:else}
      <rect x="-4" y="-40" width="8" height="40" fill="#18181b" />
    {/if}
  {/if}

  <!-- Player -->
  <g transform="translate(-36 -124)">
    <Avatar look={player.look} gear={player.gear} {primary} {secondary} size={72} mode="bust" tag={player.tag} />
  </g>

  <!-- Desk -->
  {#if gear.desk === 0}
    <rect x="-40" y="-56" width="80" height="56" fill="#b98a55" />
    <path d="M-40 -56 L-52 -66 M40 -56 L52 -66" stroke="#a87945" stroke-width="5" />
    <path d="M-20 -34 h40" stroke="#8c6236" stroke-width="2" />
  {:else if gear.desk === 1}
    <rect x="-66" y="-60" width="132" height="6" rx="2" fill="#8a8f9c" />
    <path d="M-50 -54 L-30 0 M-30 -54 L-50 0 M50 -54 L30 0 M30 -54 L50 0" stroke="#5c606b" stroke-width="3" />
  {:else if gear.desk <= 4}
    <rect x="-70" y="-62" width="140" height="10" rx="2" fill="#3a3148" />
    <rect x="-64" y="-52" width="8" height="52" fill="#2a2336" />
    <rect x="56" y="-52" width="8" height="52" fill="#2a2336" />
  {:else if gear.desk <= 8}
    <path d="M-74 -64 H74 L70 -52 H-70 Z" fill="#1d1d21" />
    <path d="M-72 -52 H72" stroke={secondary} stroke-width="2" filter="url(#{uid}-glow)" />
    <path d="M-62 -52 L-70 0 M62 -52 L70 0" stroke="#141417" stroke-width="7" />
  {:else}
    <path d="M-78 -64 H78 L72 -50 H-72 Z" fill={glow('desk')} fill-opacity="0.18" stroke={glow('desk')} stroke-width="2" filter="url(#{uid}-glow)" />
    <path d="M-60 -50 L-40 0 H40 L60 -50" fill={glow('desk')} fill-opacity="0.06" stroke={glow('desk')} stroke-opacity="0.35" stroke-width="1.5" />
  {/if}

  <!-- Keyboard & mouse -->
  <rect x="-20" y={deskTop - 5} width="40" height="5" rx="1.5" fill={gear.keyboard >= 5 ? '#1d1d21' : '#d9d6cf'} />
  {#if gear.keyboard >= 5}
    <rect x="-18" y={deskTop - 4} width="36" height="1.4" fill={secondary} filter="url(#{uid}-glow)" />
  {/if}
  <ellipse cx="28" cy={deskTop - 3} rx="4" ry="2.5" fill={gear.mouse >= 5 ? secondary : '#cfcac0'} />

  <!-- Arms and hands: the left hand on the keys, the right on the mouse. -->
  <g class="arms" class:playing style="--tempo:{tempo.speed}s; --delay:{tempo.delay}s">
    <path d="M-21 {deskTop + 1} Q-19 {deskTop - 4} -10 {deskTop - 6}" fill="none" stroke={shade(primary, -0.15)} stroke-width="7" stroke-linecap="round" />
    <path d="M21 {deskTop + 1} Q25 {deskTop - 2} 27 {deskTop - 5}" fill="none" stroke={shade(primary, -0.15)} stroke-width="7" stroke-linecap="round" />
    <g class="hand keys">
      <ellipse cx="-8" cy={deskTop - 6.5} rx="4.2" ry="2.8" fill={skin} stroke="rgba(0,0,0,0.35)" stroke-width="0.8" />
      <path d="M-10 {deskTop - 4.5} v1.6 M-7.5 {deskTop - 4.3} v1.6 M-5 {deskTop - 4.5} v1.4" stroke={shade(skin, -0.3)} stroke-width="0.9" stroke-linecap="round" />
    </g>
    <g class="hand mouse">
      <ellipse cx="28" cy={deskTop - 5.5} rx="4" ry="2.8" fill={skin} stroke="rgba(0,0,0,0.35)" stroke-width="0.8" />
    </g>
  </g>

  <!-- Monitors -->
  {#snippet monitor(cx: number)}
    {@const baseY = gear.desk === 0 ? -56 : -62}
    {#if gear.monitor === 0}
      <rect x={cx - 20} y={baseY - 38} width="40" height="36" rx="4" fill="#c9c4b5" />
      <rect x={cx - 15} y={baseY - 33} width="30" height="24" rx="3" fill="#2b3a2f" />
      {@render game(cx - 14, baseY - 32, 28, 22, 0.7)}
    {:else if gear.monitor <= 10}
      {@const w = gear.monitor <= 2 ? 40 : gear.monitor <= 6 ? 48 : 54}
      <rect x={cx - 2} y={baseY - 10} width="4" height="10" fill="#18181b" />
      <rect x={cx - 10} y={baseY - 2} width="20" height="3" rx="1" fill="#18181b" />
      <rect x={cx - w / 2} y={baseY - 42} width={w} height="32" rx="2" fill="#111113" />
      <rect x={cx - w / 2 + 2} y={baseY - 40} width={w - 4} height="28" rx="1" fill="url(#{uid}-screen)" class="screen" />
      {#if screenArt}
        {@render game(cx - w / 2 + 2, baseY - 40, w - 4, 28, 0.92)}
      {:else}
        <path d="M{cx - w / 2 + 6} {baseY - 20} h {w / 3} M{cx - w / 2 + 6} {baseY - 16} h {w / 5}" stroke="#fff" stroke-width="1.2" opacity="0.5" />
      {/if}
    {:else}
      <rect
        x={cx - 28}
        y={baseY - 50}
        width="56"
        height="34"
        rx="3"
        fill={glow('monitor')} fill-opacity="0.22"
        stroke={glow('monitor')}
        stroke-width="1.5"
        filter="url(#{uid}-glow)"
        class="screen"
      />
      {@render game(cx - 26, baseY - 48, 52, 30, 0.6)}
    {/if}
  {/snippet}
  {#snippet game(gx: number, gy: number, gw: number, gh: number, opacity: number)}
    {#if screenArt}
      <svg x={gx} y={gy} width={gw} height={gh} viewBox="0 0 48 30" preserveAspectRatio="xMidYMid slice" opacity={status === 'playing' ? opacity : opacity * 0.4}>{@html screenArt}</svg>
    {/if}
  {/snippet}
  {@render monitor(44)}
  {#if gear.monitor >= 7}
    {@render monitor(-44)}
  {/if}

  <!-- PC -->
  {#if gear.pc === 0}
    <g transform="translate(-58 {gear.desk === 0 ? -56 : -62})">
      <rect x="-14" y="-2" width="28" height="3" rx="1" fill="#8a8f9c" />
      <path d="M-12 -2 L-10 -20 H10 L12 -2 Z" fill="#555a66" />
    </g>
  {:else if gear.pc <= 2}
    <rect x="78" y="-44" width="20" height="44" rx="2" fill="#d8d0bd" />
    <rect x="82" y="-38" width="12" height="3" fill="#a9a08a" />
  {:else if gear.pc <= 5}
    <rect x="76" y="-50" width="24" height="50" rx="3" fill="#19191c" />
    <circle cx="88" cy="-36" r="6" fill="none" stroke={secondary} stroke-width="2" filter="url(#{uid}-glow)" />
    <circle cx="88" cy="-18" r="6" fill="none" stroke={primary} stroke-width="2" filter="url(#{uid}-glow)" />
  {:else if gear.pc <= 8}
    <rect x="74" y="-62" width="30" height="62" rx="3" fill="rgba(24,24,27,0.9)" stroke={secondary} stroke-width="1.5" />
    <rect x="78" y="-58" width="22" height="54" rx="2" fill={secondary} opacity="0.25" filter="url(#{uid}-glow)" />
  {:else if gear.pc <= 11}
    <rect x="72" y="-86" width="34" height="86" rx="2" fill="#101012" stroke="#34343b" stroke-width="1.5" />
    {#each [0, 1, 2, 3, 4, 5] as i (i)}
      <rect x="76" y={-80 + i * 13} width="26" height="8" rx="1" fill="#1e1e22" />
      <circle cx="98" cy={-76 + i * 13} r="1.6" fill={i % 2 ? '#4ade80' : '#f5c451'} class="blink" style="animation-delay:{i * 0.3}s" />
    {/each}
  {:else}
    <circle cx="90" cy="-40" r="16" fill={glow('pc')} fill-opacity="0.35" stroke={glow('pc')} stroke-width="2" filter="url(#{uid}-glow)" class="orb" />
    <circle cx="90" cy="-40" r="6" fill="#fff" opacity="0.8" />
  {/if}

  <!-- The lucky charm: the composure item, standing on the desk in front of the screens. -->
  <g class="charm" class:lit={(gear.charm ?? 0) >= 11} transform="translate(-41 {deskTop - 19}) scale(0.4)">
    {@html charmArt}
  </g>

  <!-- Status badge -->
  <g transform="translate(30 -120)">
    <circle r="11" fill={badge.fill} stroke="#0e0e10" stroke-width="2" />
    <g transform="translate(-6.5 -6.5)"><Icon name={badge.icon} size={13} color="#fff" /></g>
  </g>

  {#if label}<text x="0" y="24" text-anchor="middle" class="tag">{player.tag}</text>{/if}
</g>

<style>
  .station.out {
    opacity: 0.6;
  }
  .tag {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 14px;
    fill: var(--text);
    paint-order: stroke;
    stroke: rgba(0, 0, 0, 0.6);
    stroke-width: 3px;
  }
  .screen {
    animation: flicker 3s ease-in-out infinite;
  }
  .blink {
    animation: blink 1.2s steps(2) infinite;
  }
  /* Typing: the key hand taps at the player's own tempo, the mouse hand flicks now and then. */
  .arms.playing .hand.keys {
    animation: type var(--tempo) ease-in-out var(--delay) infinite alternate;
  }
  .arms.playing .hand.mouse {
    animation: flick 2.2s ease-in-out var(--delay) infinite;
  }
  .charm.lit {
    filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.5));
  }
  @keyframes type {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(-1.3px);
    }
  }
  @keyframes flick {
    0%,
    55%,
    100% {
      transform: translate(0, 0);
    }
    65% {
      transform: translate(2px, -0.6px);
    }
    80% {
      transform: translate(-1.5px, 0.4px);
    }
  }
  .orb {
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes flicker {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.82;
    }
  }
  @keyframes blink {
    50% {
      opacity: 0.2;
    }
  }
  @keyframes pulse {
    50% {
      opacity: 0.6;
    }
  }
</style>
