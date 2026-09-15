<script lang="ts">
  let {
    name,
    primary = '#22e4ff',
    secondary = '#ff2bd6',
    size = 160,
    logoUrl,
  }: { name: string; primary?: string; secondary?: string; size?: number; logoUrl?: string } = $props();

  const uid = $props.id();

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
</script>

<svg width={size} height={size} viewBox="0 0 200 200" role="img" aria-label="{name} logo">
  <defs>
    <linearGradient id="{uid}-fill" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color={primary} />
      <stop offset="1" stop-color={secondary} />
    </linearGradient>
    <linearGradient id="{uid}-inner" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1a2050" />
      <stop offset="1" stop-color="#090b1c" />
    </linearGradient>
    <filter id="{uid}-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="6" result="b" />
      <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <clipPath id="{uid}-clip">
      <path d="M100 26 L160 48 V96 C160 132 136 158 100 174 C64 158 40 132 40 96 V48 Z" />
    </clipPath>
  </defs>
  <path
    d="M100 12 L172 38 V96 C172 140 142 172 100 190 C58 172 28 140 28 96 V38 Z"
    fill="url(#{uid}-fill)"
    filter="url(#{uid}-glow)"
  />
  <path d="M100 26 L160 48 V96 C160 132 136 158 100 174 C64 158 40 132 40 96 V48 Z" fill="url(#{uid}-inner)" />
  {#if logoUrl}
    <image href={logoUrl} x="46" y="46" width="108" height="108" clip-path="url(#{uid}-clip)" style="image-rendering: pixelated" />
  {:else}
    <path d="M52 62 L100 44 L148 62" stroke="url(#{uid}-fill)" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.7" />
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
  {/if}
</svg>
