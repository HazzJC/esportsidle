<script lang="ts">
  import { scale } from 'svelte/transition';
  import { game } from '../game.svelte';

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
      <span class="rays" aria-hidden="true"></span>
      <span class="core">
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <defs>
            <linearGradient id="drop-face-{d.id}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#fffbe6" />
              <stop offset=".35" style="stop-color: var(--c)" />
              <stop offset="1" style="stop-color: var(--c2)" />
            </linearGradient>
          </defs>
          <ellipse cx="32" cy="60" rx="16" ry="3" fill="#000" opacity=".35" />
          <path d="M32 3 57 17.5v29L32 61 7 46.5v-29z" fill="#000" opacity=".45" />
          <path d="M32 5 55 18.5v27L32 59 9 45.5v-27z" fill="url(#drop-face-{d.id})" />
          <path d="M32 5 55 18.5 32 31 9 18.5z" fill="#fff" opacity=".22" />
          <path d="M32 31 55 18.5v27L32 59z" fill="#000" opacity=".16" />
          <path d="M32 9.5 51 20.5v23L32 54.5 13 43.5v-23z" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.2" />
          {#if d.chain > 0}
            <path d="M32 15c7 5 9 13 7 21h-14c-2-8 0-16 7-21z" fill="#fff" stroke="#16213a" stroke-width="2" />
            <circle cx="32" cy="26" r="3.4" fill="#22e4ff" stroke="#16213a" stroke-width="1.6" />
            <path d="M25 34l-5 6h7M39 34l5 6h-7" fill="#ff4d6d" stroke="#16213a" stroke-width="1.6" stroke-linejoin="round" />
            <path d="M28 40h8l-4 9z" fill="#ffc83d" />
          {:else if d.kind === 'drama'}
            <path d="M32 13c2 6 10 9 10 19a10 10 0 0 1-20 0c0-5 3-8 5-10 0 4 2 6 4 6-2-5 0-11 1-15z" fill="#ffd166" stroke="#3a0a16" stroke-width="2" stroke-linejoin="round" />
            <path d="M32 28c1 3 5 5 5 9a5 5 0 0 1-10 0c0-3 2-5 5-9z" fill="#ff6b3d" />
          {:else}
            <path d="M36 11 20 35h10l-4 18 18-26H34z" fill="#1a1000" transform="translate(1.5 1.5)" opacity=".35" />
            <path d="M36 11 20 35h10l-4 18 18-26H34z" fill="#fff" stroke="#3a2600" stroke-width="2" stroke-linejoin="round" />
            <path d="M34 16 25 31" stroke="#fff6c7" stroke-width="2" stroke-linecap="round" opacity=".9" />
          {/if}
          <path d="M50 8l1.6 3.4L55 13l-3.4 1.6L50 18l-1.6-3.4L45 13l3.4-1.6z" fill="#fff" class="twinkle" />
        </svg>
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
  /* A bevelled hex badge, lit from above, with light rays turning behind it. */
  .core {
    position: relative;
    display: block;
    width: 60px;
    height: 60px;
    filter: drop-shadow(0 0 10px var(--c)) drop-shadow(0 0 22px color-mix(in srgb, var(--c) 55%, transparent));
    animation: glow 1.2s ease-in-out infinite;
    transition: transform 0.1s;
  }
  .core svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  .rays {
    position: absolute;
    inset: -14px;
    border-radius: 50%;
    background: repeating-conic-gradient(from 0deg, color-mix(in srgb, var(--c) 45%, transparent) 0deg 10deg, transparent 10deg 30deg);
    mask: radial-gradient(circle, #000 30%, transparent 70%);
    animation: spin 6s linear infinite;
    pointer-events: none;
  }
  .twinkle {
    transform-origin: 50px 13px;
    animation: twinkle 1.4s ease-in-out infinite;
  }
  @keyframes spin {
    to {
      rotate: 360deg;
    }
  }
  @keyframes twinkle {
    50% {
      opacity: 0.2;
      transform: scale(0.5);
    }
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
      filter: drop-shadow(0 0 16px var(--c)) drop-shadow(0 0 34px color-mix(in srgb, var(--c) 70%, transparent));
    }
  }
  @keyframes blink {
    50% {
      opacity: 0.35;
    }
  }
</style>
