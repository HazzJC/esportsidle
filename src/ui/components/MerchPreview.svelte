<script lang="ts">
  import { FINISH_NAMES, finishBand } from '../../data/merch';
  import type { Design } from '../../engine/types';
  import { merchArtSvg, merchPrintWindow } from '../merchArt';
  import { rarityColor } from '../theme';
  import DesignImage from './DesignImage.svelte';

  /**
   * The product as it would ship: the bespoke art in the org's colours, with the chosen design
   * printed where it belongs on that product, framed in the colour of its finish level.
   */
  let {
    productId,
    design,
    quality = 0,
    primary = '#22e4ff',
    secondary = '#8b5cff',
  }: { productId: string; design: Design | undefined; quality?: number; primary?: string; secondary?: string } = $props();

  const band = $derived(finishBand(quality));
  const color = $derived(rarityColor(band));
  // Built only from constants in merchArt.ts and the org's validated hex colours, so {@html} is safe.
  const art = $derived(merchArtSvg(productId, primary, secondary, quality));
  const win = $derived(merchPrintWindow(productId));
  const pct = (v: number) => `${((v / 48) * 100).toFixed(2)}%`;
</script>

<div
  class="stage"
  class:lit={quality >= 7}
  class:maxed={quality >= 10}
  style="--r:{color}"
  aria-label="{productId} preview, {FINISH_NAMES[quality] ?? 'finish'} (Q{quality})"
>
  <div class="product">
    <span class="art">{@html art}</span>
    {#if design}
      <span
        class="print"
        style="left:{pct(win.x)}; top:{pct(win.y)}; width:{pct(win.w)}; height:{pct(win.h)}; transform:rotate({win.rotate ?? 0}deg); border-radius:{(win.round ?? 0) * 100}%"
      >
        <DesignImage {design} size={64} />
      </span>
    {:else}
      <span class="print empty" style="left:{pct(win.x)}; top:{pct(win.y)}; width:{pct(win.w)}; height:{pct(win.h)}; transform:rotate({win.rotate ?? 0}deg)">?</span>
    {/if}
  </div>
  <span class="finish num">Q{quality} · {FINISH_NAMES[quality] ?? ''}</span>
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
    filter: drop-shadow(0 0 0.6px rgba(255, 255, 255, 0.5)) drop-shadow(0 1px 1px rgba(0, 0, 0, 0.5));
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
</style>
