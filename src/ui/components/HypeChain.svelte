<script lang="ts">
  import { onMount } from 'svelte';
  import { CHAIN_MAX, CHAIN_SECONDS_PER_BUBBLE, chainBubble } from '../../engine/clicker';
  import { subscribe } from '../../engine/bus';
  import { game } from '../game.svelte';
  import Icon from './Icon.svelte';

  /**
   * A rare Hype Drop starts the bubble chain; popping one spawns the next, a
   * little smaller and a little quicker to fade. Every pop makes the crowd louder and longer, and
   * the chain ends the moment one gets away.
   */
  interface Bubble {
    n: number;
    /** Position as a share of the play area. */
    x: number;
    y: number;
    size: number;
    life: number;
    bornAt: number;
  }

  let bubble = $state<Bubble | null>(null);
  let popped = $state(0);
  /** Shown for a moment after a chain ends. */
  let result = $state<{ mult: number; seconds: number; popped: number } | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let resultTimer: ReturnType<typeof setTimeout> | undefined;
  let frame = $state(0);

  const enabled = $derived(game.view.s.settings.hypeChain !== false);

  function place(n: number): Bubble {
    const { size, life } = chainBubble(n);
    // Never right on top of the last one: a chain should make you move.
    const prev = bubble;
    let x = 0;
    let y = 0;
    for (let i = 0; i < 8; i++) {
      x = 0.08 + Math.random() * 0.84;
      y = 0.1 + Math.random() * 0.8;
      if (!prev || Math.hypot(x - prev.x, y - prev.y) > 0.25) break;
    }
    return { n, x, y, size, life, bornAt: performance.now() };
  }

  function next(n: number) {
    clearTimeout(timer);
    bubble = place(n);
    timer = setTimeout(() => end(), bubble.life * 1000);
  }

  function pop() {
    if (!bubble) return;
    popped = bubble.n;
    game.popHypeBubble(popped);
    if (popped >= CHAIN_MAX) {
      end();
      return;
    }
    next(popped + 1);
  }

  function end() {
    clearTimeout(timer);
    const total = popped;
    bubble = null;
    popped = 0;
    if (total > 0) {
      const reward = game.finishHypeChain(total);
      result = { mult: Math.round(reward.mult), seconds: Math.round(reward.duration), popped: total };
      clearTimeout(resultTimer);
      resultTimer = setTimeout(() => (result = null), 3200);
    }
  }

  onMount(() => {
    const stop = subscribe((e) => {
      if (e.type !== 'hypeChain' || !enabled) return;
      popped = 0;
      next(1);
    });
    const tick = setInterval(() => (frame += 1), 60);
    return () => {
      stop();
      clearInterval(tick);
      clearTimeout(timer);
      clearTimeout(resultTimer);
    };
  });

  /** How much of the current bubble's life is left, for the ring. */
  const remaining = $derived.by(() => {
    void frame;
    if (!bubble) return 0;
    return Math.max(0, 1 - (performance.now() - bubble.bornAt) / (bubble.life * 1000));
  });
</script>

<div class="chain-layer">
  {#if bubble}
    {@const b = bubble}
    <button
      class="bubble"
      style="left:calc({b.x * 100}% - {(b.x * 2 - 1) * (b.size / 2 + 6)}px); top:calc({b.y * 100}% - {(b.y * 2 - 1) * (b.size / 2 + 6)}px); --size:{b.size}px"
      onclick={pop}
      aria-label="Hype bubble {b.n}: pop it to keep the chain going"
    >
      <svg class="ring" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="46" pathLength="100" stroke-dasharray="{remaining * 100} 100" />
      </svg>
      <span class="core">
        <Icon name="megaphone" size={Math.round(b.size * 0.34)} />
        <span class="n num">×{Math.max(2, b.n)}</span>
      </span>
    </button>
  {/if}

  {#if result}
    <div class="result" role="status">
      <Icon name="megaphone" size={16} />
      <span>{result.popped} in a row · income ×{result.mult} for {result.seconds}s</span>
    </div>
  {/if}
</div>

<style>
  .chain-layer {
    position: fixed;
    inset: 62px 8px 12px 8px;
    z-index: 940;
    pointer-events: none;
  }
  @media (min-width: 1024px) {
    .chain-layer {
      right: 340px;
    }
  }
  @media (max-width: 1023px) {
    .chain-layer {
      bottom: 84px;
    }
  }
  .bubble {
    position: absolute;
    width: var(--size);
    height: var(--size);
    margin: calc(var(--size) / -2) 0 0 calc(var(--size) / -2);
    padding: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
    pointer-events: auto;
    display: grid;
    place-items: center;
    animation: pop-in 0.16s ease-out;
    -webkit-tap-highlight-color: transparent;
  }
  .core {
    display: grid;
    place-items: center;
    gap: 0;
    width: 82%;
    height: 82%;
    border-radius: 50%;
    color: #10131a;
    background: radial-gradient(circle at 34% 28%, #fff, var(--accent-2) 45%, var(--accent));
    box-shadow:
      0 0 16px var(--accent-2),
      0 0 38px color-mix(in srgb, var(--accent-2) 55%, transparent);
  }
  .n {
    font-family: var(--font-display);
    font-weight: 900;
    font-size: clamp(10px, calc(var(--size) * 0.17), 18px);
    line-height: 1;
  }
  .ring {
    position: absolute;
    inset: 0;
    transform: rotate(-90deg);
    overflow: visible;
  }
  .ring circle {
    fill: none;
    stroke: var(--gold);
    stroke-width: 5;
    stroke-linecap: round;
  }
  .result {
    position: absolute;
    left: 50%;
    bottom: 12px;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--gold) 50%, transparent);
    background: color-mix(in srgb, var(--panel-2) 92%, transparent);
    color: var(--text);
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 13px;
    white-space: nowrap;
    animation: pop-in 0.2s ease-out;
  }
  @keyframes pop-in {
    from {
      transform: scale(0.4);
      opacity: 0;
    }
  }
</style>
