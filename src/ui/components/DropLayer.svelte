<script lang="ts">
  import { scale } from 'svelte/transition';
  import { game } from '../game.svelte';
  import Icon from './Icon.svelte';

  const s = $derived(game.view.s);

  /** Half a drop, so one placed at the very edge still sits fully inside the play area. */
  const HALF = 40;
</script>

<div class="drops">
  {#each s.drops.active as d (d.id)}
    {@const life = Math.max(0.001, d.expiresAt - d.spawnedAt)}
    {@const left = Math.max(0, d.expiresAt - s.time)}
    <button
      class="drop {d.kind}"
      class:chain={d.chain > 0}
      class:fading={left < 2.5}
      style="left:calc({d.x * 100}% - {(d.x * 2 - 1) * HALF}px); top:calc({d.y * 100}% - {(d.y * 2 - 1) * HALF}px)"
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
  /*
   * Drops only ever appear inside the play area. They used to cover the whole window, which put
   * them behind the top bar (higher up the stack) where a drop was invisible but still took the
   * click, and let one sit over the store, where aiming at an operation caught the drop instead.
   * Above the popups now, so nothing can hide one.
   */
  .drops {
    position: fixed;
    inset: 62px 8px 12px 8px;
    z-index: 950;
    pointer-events: none;
  }
  @media (min-width: 1024px) {
    .drops {
      /* Clear of the store column, so a drop can never be mistaken for a purchase. */
      right: 340px;
    }
  }
  @media (max-width: 1180px) and (min-width: 1024px) {
    .drops {
      right: 300px;
    }
  }
  @media (max-width: 1023px) {
    .drops {
      /* Above the tab bar on phones. */
      bottom: 84px;
    }
  }
  .drop {
    --c: var(--gold);
    --c2: var(--accent);
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
    --c: var(--red);
    --c2: #8b1e3f;
  }
  .drop.chain {
    --c: var(--accent-2);
    --c2: var(--accent);
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
    background: var(--bg);
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
