<script lang="ts">
  import type { TrophyKind } from '../../engine/types';

  let { kind, tier, size = 26 }: { kind: TrophyKind; tier: number; size?: number } = $props();

  /**
   * The metal follows the league tier, so the shelf shows how far the org climbed: bronze, silver,
   * gold, platinum, then a neon crystal for the far tiers. Flat fills only (lit / mid / shade), since a
   * shelf can hold a hundred of these and per-icon gradients would need an id each.
   */
  const metal = $derived(
    tier >= 12
      ? { lit: '#f3dcff', mid: '#b98bff', dark: '#6d3fc4', glow: '#22e4ff' }
      : tier >= 9
        ? { lit: '#ffffff', mid: '#cfe6f2', dark: '#7fa6ba', glow: '' }
        : tier >= 6
          ? { lit: '#fff1bf', mid: '#f5c451', dark: '#b07f1c', glow: '' }
          : tier >= 3
            ? { lit: '#ffffff', mid: '#cfd3d8', dark: '#8b9097', glow: '' }
            : { lit: '#f3c79e', mid: '#cf8c52', dark: '#8a5329', glow: '' },
  );
</script>

<svg width={size} height={size * 1.2} viewBox="0 0 24 29" aria-hidden="true">
  {#if metal.glow}<ellipse cx="12" cy="9" rx="10" ry="9" fill={metal.glow} opacity="0.18" />{/if}
  {#if kind === 'sponsor'}
    <!-- A presentation plate, as handed over for a sponsor goal. -->
    <circle cx="12" cy="9" r="7.6" fill={metal.dark} />
    <circle cx="12" cy="8.6" r="7.1" fill={metal.mid} />
    <circle cx="12" cy="8.6" r="4.6" fill="none" stroke={metal.dark} stroke-width="0.9" opacity="0.6" />
    <path d="M12 1.5a7.1 7.1 0 0 1 7.1 7.1H12Z" fill="#000" opacity="0.12" />
    <path d="M8.2 4.2c-1.4 1-2.3 2.5-2.5 4.1" fill="none" stroke={metal.lit} stroke-width="1.3" stroke-linecap="round" />
    <rect x="10.9" y="16" width="2.2" height="4.5" fill={metal.dark} />
  {:else if kind === 'quest'}
    <!-- A rosette for finishing a quest, ribbon tails behind. -->
    <path d="M9 10.5 6.8 18.2l2.9-1.4 1.6 2.4 1.2-7.5Z" fill="#e0405d" />
    <path d="M15 10.5l2.2 7.7-2.9-1.4-1.6 2.4-1.2-7.5Z" fill="#b8243f" />
    <circle cx="12" cy="7.6" r="5.8" fill={metal.dark} />
    <circle cx="12" cy="7.2" r="5.2" fill={metal.mid} />
    <circle cx="12" cy="7.2" r="3" fill={metal.lit} opacity="0.55" />
    <path d="M12 2a5.2 5.2 0 0 1 5.2 5.2H12Z" fill="#000" opacity="0.12" />
    <rect x="10.9" y="17.5" width="2.2" height="3" fill={metal.dark} />
  {:else if kind === 'title'}
    <!-- The league cup: handles, a lit bowl, a stem and a knob. -->
    <path d="M5.6 4.6H2.9a3.4 3.4 0 0 0 3.7 5.6M18.4 4.6h2.7a3.4 3.4 0 0 1-3.7 5.6" fill="none" stroke={metal.dark} stroke-width="1.8" stroke-linecap="round" />
    <path d="M5 2h14v6.6a7 7 0 0 1-14 0Z" fill={metal.mid} />
    <path d="M13.5 2H19v6.6a7 7 0 0 1-5.5 6.8Z" fill="#000" opacity="0.2" />
    <ellipse cx="12" cy="2.2" rx="7" ry="1.2" fill={metal.lit} />
    <ellipse cx="12" cy="2.4" rx="5.4" ry="0.6" fill={metal.dark} opacity="0.45" />
    <path d="M7.6 4.6c0 3.1.6 5.5 2.2 6.9" fill="none" stroke={metal.lit} stroke-width="1.3" stroke-linecap="round" />
    <path d="M10.6 15.4h2.8v2.6h-2.8Z" fill={metal.dark} />
    <ellipse cx="12" cy="18.4" rx="2.6" ry="1" fill={metal.mid} />
    <rect x="11" y="18.6" width="2" height="2" fill={metal.dark} />
  {:else}
    <!-- A star for a bracket run; the runner-up's is hollow. -->
    {#if kind === 'runnerUp'}
      <path d="M12 1.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 14.8 6.8 17.5l1-5.8-4.2-4.1 5.8-.8Z" fill="none" stroke={metal.dark} stroke-width="2.2" stroke-linejoin="round" />
      <path d="M12 1.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 14.8 6.8 17.5l1-5.8-4.2-4.1 5.8-.8Z" fill="none" stroke={metal.mid} stroke-width="1.1" stroke-linejoin="round" />
    {:else}
      <path d="M12 2l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 15.3 6.8 18l1-5.8-4.2-4.1 5.8-.8Z" fill={metal.dark} />
      <path d="M12 1.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 14.8 6.8 17.5l1-5.8-4.2-4.1 5.8-.8Z" fill={metal.mid} />
      <path d="M12 1.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 14.8Z" fill="#000" opacity="0.16" />
      <path d="M12 5.4 10.5 8.6l-3.4.5" fill="none" stroke={metal.lit} stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" />
    {/if}
    <rect x="10.9" y="16.5" width="2.2" height="4" fill={metal.dark} />
  {/if}
  <!-- A plinth with an engraved plate. -->
  <path d="M6.6 20.3h10.8l.9 2.4H5.7Z" fill={metal.mid} />
  <path d="M12 20.3h5.4l.9 2.4H12Z" fill="#000" opacity="0.18" />
  <rect x="4.6" y="22.7" width="14.8" height="5.3" rx="0.9" fill="#3b2a1f" />
  <rect x="4.6" y="22.7" width="14.8" height="1.1" rx="0.5" fill="#5c4331" />
  <rect x="8" y="24.6" width="8" height="1.8" rx="0.4" fill={metal.mid} />
  <rect x="8" y="24.6" width="8" height="0.6" rx="0.3" fill={metal.lit} opacity="0.7" />
</svg>
