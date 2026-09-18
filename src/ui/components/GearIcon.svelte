<script lang="ts">
  import { GEAR_MAX_TIER, gearRarity, type GearSlot } from '../../data/gear';
  import { gearArtSvg } from '../gearArt';

  let {
    slot,
    tier,
    size = 40,
    showTier = true,
  }: { slot: GearSlot; tier: number; size?: number; showTier?: boolean } = $props();

  const rarity = $derived(gearRarity(tier));
  /** Legendary and mythic gear lights up, so the best items read across the whole list. */
  const lit = $derived(tier >= 11);
  const maxed = $derived(tier >= GEAR_MAX_TIER);
  // Built only from constants in gearArt.ts, never from player input, so {@html} is safe here.
  const art = $derived(gearArtSvg(slot, tier));
</script>

<span class="gear-icon" class:lit class:maxed style="--r:{rarity.color}; --size:{size}px" role="img" aria-label="{rarity.name} tier {tier}">
  <span class="art">{@html art}</span>
  {#if showTier}<span class="tier num">{tier}</span>{/if}
</span>

<style>
  .gear-icon {
    position: relative;
    display: grid;
    place-items: center;
    flex: none;
    width: var(--size);
    height: var(--size);
    border-radius: 10px;
    border: 1.5px solid color-mix(in srgb, var(--r) 55%, transparent);
    /* A soft spotlight, like product photography: black hardware stays black but never vanishes. */
    background:
      radial-gradient(circle at 50% 42%, #4a4a52 0%, #2c2c31 48%, #19191c 80%),
      #19191c;
  }
  .gear-icon::before {
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
    /* A faint light rim lifts dark silhouettes off the backdrop. */
    filter: drop-shadow(0 0 0.6px rgba(255, 255, 255, 0.55)) drop-shadow(0 1px 1px rgba(0, 0, 0, 0.5));
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
  .tier {
    position: absolute;
    right: -4px;
    bottom: -5px;
    min-width: 16px;
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
</style>
