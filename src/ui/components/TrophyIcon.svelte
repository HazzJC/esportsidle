<script lang="ts">
  import type { TrophyKind } from '../../engine/types';

  let { kind, tier, size = 26 }: { kind: TrophyKind; tier: number; size?: number } = $props();

  /** The metal follows the league tier, so the shelf shows how far the org climbed. */
  const metal = $derived(
    tier >= 9
      ? { fill: '#e2f4ff', shade: '#8fb8cf' }
      : tier >= 6
        ? { fill: '#f5c451', shade: '#c99a2e' }
        : tier >= 3
          ? { fill: '#d2d5d9', shade: '#9ea2a8' }
          : { fill: '#d08f58', shade: '#9a6436' },
  );
</script>

<svg width={size} height={size * 1.2} viewBox="0 0 24 29" aria-hidden="true">
  {#if kind === 'sponsor'}
    <!-- A presentation plate, as handed over for a sponsor goal. -->
    <circle cx="12" cy="9" r="7.5" fill={metal.fill} stroke={metal.shade} stroke-width="0.8" />
    <circle cx="12" cy="9" r="4.4" fill="none" stroke={metal.shade} stroke-width="0.9" opacity="0.7" />
    <path d="M9 5.5c-1.4 1-2.2 2.3-2.4 3.7" fill="none" stroke="#fff" stroke-width="1" opacity="0.5" stroke-linecap="round" />
    <rect x="10.8" y="16.5" width="2.4" height="4" fill={metal.shade} />
    <path d="M7.5 20.5h9l1 3h-11Z" fill={metal.fill} />
  {:else if kind === 'quest'}
    <!-- A rosette for finishing a quest. -->
    <circle cx="12" cy="7.5" r="5.2" fill={metal.fill} stroke={metal.shade} stroke-width="0.8" />
    <path d="M9.4 11.5 7.6 18l4.4-2.2L16.4 18l-1.8-6.5Z" fill={metal.shade} opacity="0.8" />
    <rect x="10.8" y="17.5" width="2.4" height="3" fill={metal.shade} />
    <path d="M7.5 20.5h9l1 3h-11Z" fill={metal.fill} />
  {:else if kind === 'title'}
    <path d="M5.5 5.5H3a3.2 3.2 0 0 0 3.4 5M18.5 5.5H21a3.2 3.2 0 0 1-3.4 5" fill="none" stroke={metal.shade} stroke-width="1.6" />
    <path d="M5 2h14v6.5a7 7 0 0 1-14 0Z" fill={metal.fill} />
    <path d="M12 2h7v6.5a7 7 0 0 1-7 7Z" fill={metal.shade} opacity="0.35" />
    <path d="M8 4.5c0 3 .6 5.4 2.2 6.8" fill="none" stroke="#fff" stroke-width="1.1" opacity="0.55" stroke-linecap="round" />
    <rect x="10.6" y="15.2" width="2.8" height="5.2" fill={metal.shade} />
    <path d="M7.5 20.4h9l1 3.1h-11Z" fill={metal.fill} />
  {:else}
    <!-- A star for a bracket run; the runner-up's is hollow. -->
    <path
      d="M12 1.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 14.8 6.8 17.5l1-5.8-4.2-4.1 5.8-.8Z"
      fill={kind === 'runnerUp' ? 'none' : metal.fill}
      stroke={metal.shade}
      stroke-width={kind === 'runnerUp' ? 1.4 : 0.8}
    />
    <rect x="10.8" y="16.5" width="2.4" height="4" fill={metal.shade} />
    <path d="M7.5 20.5h9l1 3h-11Z" fill={metal.fill} />
  {/if}
  <rect x="5" y="23.5" width="14" height="4.5" rx="0.8" fill="#2a2a2f" />
  <rect x="8" y="25" width="8" height="1.4" rx="0.5" fill={metal.fill} opacity="0.7" />
</svg>
