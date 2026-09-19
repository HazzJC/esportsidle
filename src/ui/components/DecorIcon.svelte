<script lang="ts">
  import { RARITY_COLORS } from '../../data/palette';
  import { decorArtSvg } from '../decorArt';

  let {
    id,
    rarity,
    size = 44,
    dim = false,
    locked = false,
  }: { id: string; rarity: number; size?: number; dim?: boolean; locked?: boolean } = $props();

  const color = $derived(RARITY_COLORS[Math.max(0, Math.min(RARITY_COLORS.length - 1, rarity))]);
  // Built only from constants in decorArt.ts and a palette colour, so {@html} is safe here.
  const art = $derived(decorArtSvg(id, color));
</script>

<span class="decor-icon" class:dim class:locked class:lit={rarity >= 4 && !locked && !dim} style="--r:{color}; --size:{size}px" role="img" aria-hidden="true">
  <span class="art">{@html art}</span>
</span>

<style>
  .decor-icon {
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
  }
  .decor-icon::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(145deg, color-mix(in srgb, var(--r) 20%, transparent), transparent 55%);
    pointer-events: none;
  }
  .art {
    position: relative;
    width: 88%;
    height: 88%;
  }
  .art :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
    filter: drop-shadow(0 0 0.6px rgba(255, 255, 255, 0.55)) drop-shadow(0 1px 1px rgba(0, 0, 0, 0.5));
  }
  .lit {
    border-color: var(--r);
    box-shadow:
      0 0 12px color-mix(in srgb, var(--r) 40%, transparent),
      inset 0 0 12px color-mix(in srgb, var(--r) 18%, transparent);
  }
  .dim {
    filter: saturate(0.35) brightness(0.75);
  }
  /* A silhouette teases items for rooms the org has not moved into yet. */
  .locked .art {
    filter: brightness(0);
    opacity: 0.55;
  }
  .locked .art :global(svg) {
    filter: drop-shadow(0 0 0.8px rgba(255, 255, 255, 0.35));
  }
</style>
