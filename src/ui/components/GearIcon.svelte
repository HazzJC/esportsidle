<script lang="ts">
  import { GEAR_MAX_TIER, gearRarity } from '../../data/gear';
  import Icon from './Icon.svelte';

  let {
    icon,
    tier,
    size = 40,
    showTier = true,
  }: { icon: string; tier: number; size?: number; showTier?: boolean } = $props();

  const rarity = $derived(gearRarity(tier));
  /** Legendary and mythic gear lights up, so the best items read across the whole list. */
  const lit = $derived(tier >= 11);
  const maxed = $derived(tier >= GEAR_MAX_TIER);
</script>

<span
  class="gear-icon"
  class:lit
  class:maxed
  style="--r:{rarity.color}; --size:{size}px"
  aria-label="{rarity.name} tier {tier}"
>
  <Icon name={icon} size={Math.round(size * 0.48)} />
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
    border-radius: 9px;
    color: var(--r);
    border: 1.5px solid color-mix(in srgb, var(--r) 55%, transparent);
    background:
      linear-gradient(145deg, color-mix(in srgb, var(--r) 22%, transparent), transparent 62%),
      var(--bg-2);
  }
  /* A clipped corner reads as a facet and separates the bands without extra colour. */
  .gear-icon::before {
    content: '';
    position: absolute;
    inset: -1.5px;
    border-radius: inherit;
    background: linear-gradient(135deg, transparent 72%, color-mix(in srgb, var(--r) 70%, transparent));
    opacity: 0.85;
    pointer-events: none;
  }
  .lit {
    border-color: var(--r);
    box-shadow:
      0 0 12px color-mix(in srgb, var(--r) 45%, transparent),
      inset 0 0 10px color-mix(in srgb, var(--r) 18%, transparent);
  }
  .maxed {
    animation: sheen 3.5s ease-in-out infinite;
  }
  .tier {
    position: absolute;
    right: -3px;
    bottom: -4px;
    min-width: 15px;
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
      box-shadow: 0 0 20px color-mix(in srgb, var(--r) 75%, transparent);
    }
  }
</style>
