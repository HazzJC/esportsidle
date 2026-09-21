<script lang="ts">
  import { FINISH_NAMES, finishBand } from '../../data/merch';
  import type { Design } from '../../engine/types';
  import { game } from '../game.svelte';
  import { merchArtSvg, merchLookName, merchPrintWindow } from '../merchArt';
  import { rarityColor } from '../theme';
  import DesignImage from './DesignImage.svelte';

  /**
   * The product as it would ship: the bespoke art in the org's colours, with the chosen design
   * printed where it belongs on that product, framed in the colour of its finish level. It tilts
   * towards the pointer like a card in the hand, and pops when the finish improves.
   */
  let {
    productId,
    design,
    quality = 0,
    primary = '#22e4ff',
    secondary = '#8b5cff',
  }: { productId: string; design: Design | undefined; quality?: number; primary?: string; secondary?: string } = $props();

  const reduced = $derived(game.view.s.settings.reducedMotion);
  const band = $derived(finishBand(quality));
  const color = $derived(rarityColor(band));
  // Built only from constants in merchArt.ts and the org's validated hex colours, so {@html} is safe.
  const art = $derived(merchArtSvg(productId, primary, secondary, quality, !reduced));
  const win = $derived(merchPrintWindow(productId, quality));
  const look = $derived(merchLookName(productId, quality));
  const pct = (v: number) => `${((v / 48) * 100).toFixed(2)}%`;

  // Pointer tilt, in degrees, and where the glare sits.
  let rx = $state(0);
  let ry = $state(0);
  let gx = $state(50);
  let gy = $state(30);
  let hovering = $state(false);

  function onMove(e: PointerEvent) {
    if (reduced || e.pointerType === 'touch') return;
    const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const nx = (e.clientX - box.left) / box.width - 0.5;
    const ny = (e.clientY - box.top) / box.height - 0.5;
    rx = -ny * 16;
    ry = nx * 18;
    gx = (nx + 0.5) * 100;
    gy = (ny + 0.5) * 100;
    hovering = true;
  }

  function onLeave() {
    rx = 0;
    ry = 0;
    hovering = false;
  }
</script>

<div
  class="stage"
  class:lit={quality >= 7}
  class:maxed={quality >= 10}
  class:hovering
  style="--r:{color}; --rx:{rx}deg; --ry:{ry}deg; --gx:{gx}%; --gy:{gy}%"
  onpointermove={onMove}
  onpointerleave={onLeave}
  role="img"
  aria-label="{look}, {FINISH_NAMES[quality] ?? 'finish'} (Q{quality})"
>
  {#key quality}
    <div class="product" class:pop={!reduced}>
      <span class="art">{@html art}</span>
      {#if design}
        <span
          class="print"
          class:stitched={quality >= 4}
          class:foil={quality >= 6 && !reduced}
          style="left:{pct(win.x)}; top:{pct(win.y)}; width:{pct(win.w)}; height:{pct(win.h)}; transform:rotate({win.rotate ?? 0}deg); border-radius:{(win.round ?? 0) * 100}%"
        >
          <DesignImage {design} size={64} />
        </span>
      {:else}
        <span class="print empty" style="left:{pct(win.x)}; top:{pct(win.y)}; width:{pct(win.w)}; height:{pct(win.h)}; transform:rotate({win.rotate ?? 0}deg)">?</span>
      {/if}
    </div>
  {/key}
  <span class="glare" aria-hidden="true"></span>
  <span class="finish num" title={FINISH_NAMES[quality] ?? ''}>{look} · Q{quality}</span>
</div>

<style>
  .stage {
    position: relative;
    flex: none;
    width: 116px;
    height: 116px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    border: 1.5px solid color-mix(in srgb, var(--r) 55%, transparent);
    background:
      radial-gradient(circle at 50% 40%, #4a4a52 0%, #2c2c31 50%, #19191c 82%),
      #19191c;
    overflow: hidden;
    perspective: 420px;
  }
  .stage::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(145deg, color-mix(in srgb, var(--r) 22%, transparent), transparent 55%);
    pointer-events: none;
  }
  .lit {
    border-color: var(--r);
    box-shadow:
      0 0 14px color-mix(in srgb, var(--r) 45%, transparent),
      inset 0 0 14px color-mix(in srgb, var(--r) 22%, transparent);
  }
  .maxed {
    animation: sheen 3.5s ease-in-out infinite;
  }
  .product {
    position: relative;
    width: 96px;
    height: 96px;
    margin-top: -10px;
    transform: rotateX(var(--rx)) rotateY(var(--ry));
    transform-style: preserve-3d;
    transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .hovering .product {
    transition: transform 0.08s linear;
  }
  .product.pop {
    animation: pop 0.45s cubic-bezier(0.3, 1.6, 0.5, 1);
  }
  .art {
    position: absolute;
    inset: 0;
  }
  .art :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
    filter: drop-shadow(0 0 0.6px rgba(255, 255, 255, 0.5)) drop-shadow(0 2px 2px rgba(0, 0, 0, 0.55));
  }
  .glare {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(circle at var(--gx) var(--gy), rgba(255, 255, 255, 0.16), transparent 45%);
    opacity: 0;
    transition: opacity 0.25s;
  }
  .hovering .glare {
    opacity: 1;
  }
  .print {
    position: absolute;
    display: grid;
    place-items: center;
    overflow: hidden;
    /* The print sits on the fabric: slightly softened and shaded, not pasted on top. */
    filter: saturate(0.92) contrast(0.95);
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.25);
  }
  /* From Q4 the design is stitched on: a raised patch with a thread edge. */
  .print.stitched {
    filter: saturate(1) contrast(1.02);
    outline: 1px dashed rgba(255, 255, 255, 0.55);
    outline-offset: -1.5px;
    box-shadow:
      inset 0 0 0 1px rgba(0, 0, 0, 0.3),
      0 1px 1.5px rgba(0, 0, 0, 0.45);
  }
  /* From Q6 the print is foiled: a band of light sweeps across it now and then. */
  .print.foil::after {
    content: '';
    position: absolute;
    inset: -20%;
    background: linear-gradient(105deg, transparent 38%, rgba(255, 255, 255, 0.55) 50%, transparent 62%);
    mix-blend-mode: screen;
    animation: foil 4.2s ease-in-out infinite;
    pointer-events: none;
  }
  .print :global(img),
  .print :global(canvas),
  .print :global(svg) {
    width: 100% !important;
    height: 100% !important;
    image-rendering: pixelated;
  }
  .print.empty {
    border: 1px dashed rgba(255, 255, 255, 0.35);
    color: rgba(255, 255, 255, 0.55);
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 12px;
    border-radius: 3px;
  }
  .finish {
    position: absolute;
    left: 6px;
    right: 6px;
    bottom: 5px;
    overflow: hidden;
    padding: 1px 5px;
    border-radius: 5px;
    background: var(--bg);
    border: 1px solid color-mix(in srgb, var(--r) 55%, transparent);
    color: var(--r);
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 10px;
    line-height: 14px;
    text-align: center;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  @keyframes sheen {
    0%,
    100% {
      box-shadow: 0 0 14px color-mix(in srgb, var(--r) 45%, transparent);
    }
    50% {
      box-shadow: 0 0 24px color-mix(in srgb, var(--r) 75%, transparent);
    }
  }
  @keyframes pop {
    from {
      transform: scale(0.82) rotateX(var(--rx)) rotateY(var(--ry));
      opacity: 0.4;
    }
  }
  @keyframes foil {
    0%,
    55% {
      transform: translateX(-70%);
    }
    100% {
      transform: translateX(70%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .maxed,
    .product.pop,
    .print.foil::after {
      animation: none;
    }
    .product {
      transform: none;
    }
  }
</style>
