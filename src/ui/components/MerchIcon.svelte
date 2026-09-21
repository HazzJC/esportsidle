<script lang="ts">
  import { finishBand } from '../../data/merch';
  import { merchArtSvg } from '../merchArt';
  import { rarityColor, rarityName } from '../theme';

  /**
   * A product tile, drawn the way gear is: bespoke art on a spotlit backdrop, framed in the colour of
   * its finish level. Locked products show as a silhouette; `dim` shows a look still to come.
   */
  let {
    productId,
    quality = 0,
    primary,
    secondary,
    size = 40,
    showLevel = true,
    locked = false,
    dim = false,
    animate = false,
  }: {
    productId: string;
    quality?: number;
    primary: string;
    secondary: string;
    size?: number;
    showLevel?: boolean;
    locked?: boolean;
    dim?: boolean;
    animate?: boolean;
  } = $props();

  const band = $derived(finishBand(quality));
  const color = $derived(rarityColor(band));
  const lit = $derived(quality >= 7 && !dim);
  const maxed = $derived(quality >= 10 && !dim);
  // Built only from constants in merchArt.ts and the org's validated hex colours, so {@html} is safe.
  const art = $derived(merchArtSvg(productId, primary, secondary, quality, animate && !dim && !locked));
</script>

<span
  class="merch-icon"
  class:lit
  class:maxed
  class:locked
  class:dim
  style="--r:{locked ? 'var(--line-2)' : color}; --size:{size}px"
  role="img"
  aria-label={locked ? 'Locked product' : `${rarityName(band)} finish, level ${quality}`}
>
  <span class="art">{@html art}</span>
  {#if showLevel && !locked}<span class="level num">Q{quality}</span>{/if}
</span>

<style>
  .merch-icon {
    position: relative;
    display: grid;
    place-items: center;
    flex: none;
    width: var(--size);
    height: var(--size);
    border-radius: 10px;
    border: 1.5px solid color-mix(in srgb, var(--r) 55%, transparent);
    background:
      radial-gradient(circle at 50% 42%, #4a4a52 0%, #2c2c31 48%, #19191c 80%),
      #19191c;
    transition:
      opacity 0.2s,
      filter 0.2s;
  }
  .merch-icon::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(145deg, color-mix(in srgb, var(--r) 20%, transparent), transparent 55%);
    pointer-events: none;
  }
  .art {
    position: relative;
    width: 86%;
    height: 86%;
  }
  .art :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
    filter: drop-shadow(0 0 0.6px rgba(255, 255, 255, 0.55)) drop-shadow(0 1px 1px rgba(0, 0, 0, 0.5));
  }
  .locked .art {
    filter: brightness(0) opacity(0.45);
  }
  .dim {
    opacity: 0.5;
    filter: grayscale(0.7);
    border-style: dashed;
  }
  .lit {
    border-color: var(--r);
    box-shadow:
      0 0 12px color-mix(in srgb, var(--r) 45%, transparent),
      inset 0 0 12px color-mix(in srgb, var(--r) 22%, transparent);
  }
  .maxed {
    animation: sheen 3.5s ease-in-out infinite;
  }
  .level {
    position: absolute;
    right: -4px;
    bottom: -5px;
    min-width: 18px;
    padding: 0 3px;
    border-radius: 5px;
    background: var(--bg);
    border: 1px solid color-mix(in srgb, var(--r) 60%, transparent);
    color: var(--r);
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 10px;
    line-height: 14px;
    text-align: center;
  }
  @keyframes sheen {
    0%,
    100% {
      box-shadow: 0 0 12px color-mix(in srgb, var(--r) 45%, transparent);
    }
    50% {
      box-shadow: 0 0 22px color-mix(in srgb, var(--r) 75%, transparent);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .maxed {
      animation: none;
    }
  }
</style>
