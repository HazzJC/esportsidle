<script lang="ts">
  import type { Player } from '../../engine/types';
  import Station from './Station.svelte';

  /**
   * One gaming station from the House, drawn on its own so it can scale to any width: the player at
   * their desk with their actual chair, monitors and PC, or an empty desk waiting for a signing.
   */
  let {
    player,
    primary,
    secondary,
    gameColor,
    status = 'playing',
  }: {
    player?: Player;
    primary: string;
    secondary: string;
    gameColor: string;
    status?: 'playing' | 'bench' | 'out';
  } = $props();
</script>

<svg class="rig" viewBox="-86 -150 198 170" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">
  {#if player}
    <Station {player} x={0} y={0} {primary} {secondary} {gameColor} {status} label={false} />
  {:else}
    <g class="empty">
      <ellipse cx="0" cy="6" rx="78" ry="10" fill="rgba(0,0,0,0.35)" />
      <!-- An empty chair, pushed back a little -->
      <rect x="-22" y="-92" width="44" height="52" rx="9" fill="#26262b" />
      <rect x="-3" y="-40" width="6" height="40" fill="#18181b" />
      <path d="M-20 2 L20 2" stroke="#18181b" stroke-width="5" stroke-linecap="round" />
      <!-- Desk -->
      <rect x="-70" y="-62" width="140" height="10" rx="2" fill="#2e2a38" />
      <rect x="-64" y="-52" width="8" height="52" fill="#221f2b" />
      <rect x="56" y="-52" width="8" height="52" fill="#221f2b" />
      <!-- A monitor, switched off -->
      <rect x="42" y="-72" width="4" height="10" fill="#18181b" />
      <rect x="34" y="-64" width="20" height="3" rx="1" fill="#18181b" />
      <rect x="20" y="-104" width="48" height="32" rx="2" fill="#111113" />
      <rect x="22" y="-102" width="44" height="28" rx="1" fill="#16161a" />
      <circle cx="64" cy="-75" r="1.4" fill={gameColor} opacity="0.8" />
      <!-- Keyboard -->
      <rect x="-20" y="-67" width="40" height="5" rx="1.5" fill="#3a3a40" />
      <!-- A chalk outline of a plus: this seat is open -->
      <g opacity="0.55" stroke={gameColor} stroke-width="3" stroke-linecap="round">
        <path d="M0 -84 V-60 M-12 -72 H12" />
      </g>
    </g>
  {/if}
</svg>

<style>
  .rig {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 198 / 170;
    overflow: visible;
    pointer-events: none;
  }
</style>
