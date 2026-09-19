<script lang="ts">
  import { DEFAULT_EMBLEM, EMBLEM_SHAPE_MAP, type EmblemShape } from '../../data/emblems';
  import { DEFAULT_KIT } from '../../data/palette';
  import { luminance, mix, shade } from '../color';
  import Icon from './Icon.svelte';

  let {
    name,
    primary = DEFAULT_KIT.primary,
    secondary = DEFAULT_KIT.secondary,
    size = 160,
    logoUrl,
    shape = DEFAULT_EMBLEM.shape,
    mark = DEFAULT_EMBLEM.mark,
  }: { name: string; primary?: string; secondary?: string; size?: number; logoUrl?: string; shape?: EmblemShape; mark?: string } =
    $props();

  const uid = $props.id();
  const def = $derived(EMBLEM_SHAPE_MAP.get(shape) ?? EMBLEM_SHAPE_MAP.get('shield')!);

  const initials = $derived.by(() => {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return '?';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return words
      .slice(0, 3)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  });

  /** An icon mark takes the brighter team colour, lifted a little so it reads on the dark panel. */
  const markColor = $derived(mix(luminance(primary) >= luminance(secondary) ? primary : secondary, '#ffffff', 0.15));
</script>

<svg width={size} height={size} viewBox="0 0 200 200" role="img" aria-label="{name} logo">
  <defs>
    <linearGradient id="{uid}-fill" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color={primary} />
      <stop offset="1" stop-color={secondary} />
    </linearGradient>
    <linearGradient id="{uid}-inner" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color={shade(primary, -0.72)} />
      <stop offset="1" stop-color={shade(primary, -0.9)} />
    </linearGradient>
    <filter id="{uid}-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="6" result="b" />
      <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <clipPath id="{uid}-clip">
      <path d={def.inner} />
    </clipPath>
  </defs>
  <path d={def.outer} fill="url(#{uid}-fill)" filter="url(#{uid}-glow)" />
  <path d={def.inner} fill="url(#{uid}-inner)" />
  {#if logoUrl}
    <image href={logoUrl} x="46" y="46" width="108" height="108" clip-path="url(#{uid}-clip)" style="image-rendering: pixelated" />
  {:else if mark === 'initials'}
    {#if shape === 'shield'}
      <path d="M52 62 L100 44 L148 62" stroke="url(#{uid}-fill)" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.7" />
    {/if}
    <text
      x="100"
      y="118"
      text-anchor="middle"
      font-family="Orbitron, Rajdhani, sans-serif"
      font-weight="900"
      font-size={initials.length > 2 ? 40 : 52}
      fill="url(#{uid}-fill)"
      letter-spacing="2">{initials}</text
    >
    <path d="M70 142 H130" stroke="url(#{uid}-fill)" stroke-width="4" stroke-linecap="round" opacity="0.6" />
  {:else}
    <g transform="translate(58 58)" filter="url(#{uid}-glow)">
      <Icon name={mark} size={84} color={markColor} />
    </g>
  {/if}
</svg>
