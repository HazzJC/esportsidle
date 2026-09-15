<script lang="ts">
  import { scale } from 'svelte/transition';
  import { game } from '../game.svelte';
  import Icon from './Icon.svelte';

  const s = $derived(game.view.s);
</script>

<div class="drops">
  {#each s.drops.active as d (d.id)}
    {@const life = Math.max(0.001, d.expiresAt - d.spawnedAt)}
    {@const left = Math.max(0, d.expiresAt - s.time)}
    <button
      class="drop {d.kind}"
      class:chain={d.chain > 0}
      class:fading={left < 2.5}
      style="left:{d.x * 100}%; top:{d.y * 100}%"
      onclick={() => game.clickDrop(d.id)}
      aria-label={d.chain > 0 ? `Hype Train carriage ${d.chain}` : d.kind === 'drama' ? 'Drama Drop' : 'Hype Drop'}
      in:scale={{ duration: 220, start: 0.3 }}
    >
      <svg class="timer" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="46" pathLength="100" stroke-dasharray="{(left / life) * 100} 100" />
      </svg>
      <span class="core">
        <Icon name={d.chain > 0 ? 'rocket' : d.kind === 'drama' ? 'flame' : 'zap'} size={30} />
      </span>
      {#if d.chain > 0}<span class="carriage num">{d.chain}</span>{/if}
    </button>
  {/each}
</div>

<style>
  .drops {
    position: fixed;
    inset: 0;
    z-index: 750;
    pointer-events: none;
  }
  .drop {
    --c: #ffc83d;
    --c2: #ff8a3d;
    position: absolute;
    width: 72px;
    height: 72px;
    margin: -36px 0 0 -36px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
    pointer-events: auto;
    display: grid;
    place-items: center;
    animation: bob 1.6s ease-in-out infinite;
    -webkit-tap-highlight-color: transparent;
  }
  .drop.drama {
    --c: #ff4d6d;
    --c2: #8b1e3f;
  }
  .drop.chain {
    --c: #22e4ff;
    --c2: #8b5cff;
  }
  .core {
    display: grid;
    place-items: center;
    width: 58px;
    height: 58px;
    border-radius: 50%;
    color: #1a1000;
    background: radial-gradient(circle at 35% 30%, #fff8d6, var(--c) 45%, var(--c2));
    box-shadow:
      0 0 18px var(--c),
      0 0 40px color-mix(in srgb, var(--c) 60%, transparent);
    animation: glow 1.2s ease-in-out infinite;
    transition: transform 0.1s;
  }
  .drop.drama .core,
  .drop.chain .core {
    color: #fff;
  }
  .drop:hover .core {
    transform: scale(1.12);
  }
  .drop:active .core {
    transform: scale(0.92);
  }
  .timer {
    position: absolute;
    inset: 0;
    transform: rotate(-90deg);
    overflow: visible;
  }
  .timer circle {
    fill: none;
    stroke: var(--c);
    stroke-width: 4;
    stroke-linecap: round;
    opacity: 0.8;
  }
  .carriage {
    position: absolute;
    right: -2px;
    bottom: -2px;
    min-width: 22px;
    height: 22px;
    padding: 0 5px;
    border-radius: 999px;
    background: #0b0e1f;
    border: 2px solid var(--c);
    color: var(--c);
    font-family: var(--font-display);
    font-size: 11px;
    line-height: 18px;
  }
  .drop.fading {
    animation:
      bob 1.6s ease-in-out infinite,
      blink 0.35s steps(2) infinite;
  }
  @keyframes bob {
    0%,
    100% {
      translate: 0 0;
    }
    50% {
      translate: 0 -8px;
    }
  }
  @keyframes glow {
    50% {
      box-shadow:
        0 0 28px var(--c),
        0 0 60px color-mix(in srgb, var(--c) 70%, transparent);
    }
  }
  @keyframes blink {
    50% {
      opacity: 0.35;
    }
  }
</style>
