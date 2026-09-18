<script lang="ts">
  import { HAIR_COLORS, PANTS_COLORS, SHOE_COLORS, SKIN_TONES } from '../../data/cosmetics';
  import { gearRarity, type GearSlot } from '../../data/gear';
  import type { Appearance } from '../../engine/types';
  import { BRAND_MAP } from '../../data/sponsors';
  import { shade } from '../color';
  import { designUrl } from '../designImage';
  import { game } from '../game.svelte';

  let {
    look,
    gear,
    primary = '#22e4ff',
    secondary = '#ff2bd6',
    size = 120,
    mode = 'full',
    number,
  }: {
    look: Appearance;
    gear: Record<GearSlot, number>;
    primary?: string;
    secondary?: string;
    size?: number;
    mode?: 'full' | 'bust';
    number?: number;
  } = $props();

  const uid = $props.id();

  const skin = $derived(SKIN_TONES[look.skin] ?? SKIN_TONES[0]);
  const hairColor = $derived(HAIR_COLORS[look.hairColor] ?? HAIR_COLORS[0]);
  const pants = $derived(PANTS_COLORS[look.pants] ?? PANTS_COLORS[0]);
  const shoeColor = $derived(SHOE_COLORS[look.shoeColor] ?? SHOE_COLORS[0]);
  const w = $derived((look.body - 1) * 4);
  const headset = $derived(gear.headset ?? 0);
  const shoes = $derived(gear.shoes ?? 0);
  const jerseyTier = $derived(gear.jersey ?? 0);
  const full = $derived(mode === 'full');
  const hatCovers = $derived(look.hat >= 1 && look.hat <= 3);
  const torso = $derived(`M${32 - w} 86 Q60 74 ${88 + w} 86 L${91 + w} 125 Q60 131 ${29 - w} 125 Z`);
  const org = $derived(game.view.s.org);
  const crestDesign = $derived(org.jersey ? game.view.s.designs[org.jersey] : undefined);
  const crestUrl = $derived(crestDesign ? designUrl(crestDesign) : undefined);
  const sponsor = $derived.by(() => {
    const first = game.view.s.sponsors.active[0];
    return first ? BRAND_MAP.get(first.brandId) : undefined;
  });
  const charm = $derived(gear.charm ?? 0);
  const charmColor = $derived(gearRarity(charm).color);
  // A soft dark outline separates overlapping flat shapes against the dark background.
  const ink = 'rgba(0, 0, 0, 0.42)';
  const idleDelay = $derived.by(() => {
    let h = 0;
    for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) % 997;
    return (h % 20) / 10;
  });
  const line = '#1a1a22';
  const lip = '#5a2a22';
</script>

<svg
  width={size}
  height={full ? size * 1.5 : size}
  viewBox={full ? '0 0 120 180' : '16 8 88 88'}
  class="avatar"
  style="animation-delay: {idleDelay}s"
  aria-hidden="true"
>
  <defs>
    <clipPath id="{uid}-torso"><path d={torso} /></clipPath>
    <filter id="{uid}-glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="1.4" result="b" />
      <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <linearGradient id="{uid}-shade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity="0.22" />
      <stop offset="0.35" stop-color="#000" stop-opacity="0" />
      <stop offset="0.7" stop-color="#fff" stop-opacity="0.06" />
      <stop offset="1" stop-color="#000" stop-opacity="0.25" />
    </linearGradient>
    <radialGradient id="{uid}-face" cx="0.34" cy="0.28" r="0.88">
      <stop offset="0" stop-color="#fff" stop-opacity="0.14" />
      <stop offset="0.55" stop-color="#fff" stop-opacity="0" />
      <stop offset="1" stop-color="#000" stop-opacity="0.3" />
    </radialGradient>
    <linearGradient id="{uid}-holo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#22e4ff" stop-opacity="0.45" />
      <stop offset="0.5" stop-color="#ff2bd6" stop-opacity="0.2" />
      <stop offset="1" stop-color="#9dff3b" stop-opacity="0.45" />
    </linearGradient>
  </defs>

  {#if full}
    <ellipse cx="60" cy="173" rx="30" ry="4.5" fill="rgba(0,0,0,0.35)" />
  {/if}

  <!-- Back hair -->
  {#if look.hair === 4}
    <path d="M37 44 Q35 25 60 24 Q85 25 83 44 L85 88 Q60 94 35 88 Z" fill={hairColor} />
  {:else if look.hair === 5 && !hatCovers}
    <circle cx="60" cy="40" r="27" fill={hairColor} />
  {:else if look.hair === 8}
    <path d="M74 34 Q97 44 88 82 Q84 62 72 50 Z" fill={hairColor} />
  {:else if look.hair === 11}
    <g fill={hairColor}>
      <rect x="35" y="44" width="8" height="46" rx="4" />
      <rect x="77" y="44" width="8" height="46" rx="4" />
    </g>
  {/if}

  <!-- Legs & shoes -->
  {#if full}
    <rect x={43 - w / 2} y="118" width="15" height="46" rx="5" fill={pants} stroke={ink} stroke-width="1" />
    <rect x={62 + w / 2} y="118" width="15" height="46" rx="5" fill={pants} stroke={ink} stroke-width="1" />
    {#each [50.5 - w / 2, 69.5 + w / 2] as cx, i (i)}
      <g transform="translate({cx} 0) scale({i === 0 ? -1 : 1} 1) translate({-cx} 0)">
        {#if shoes === 0}
          <rect x={cx - 8} y="160" width="16" height="9" rx="4.5" fill="#e9ecf5" />
        {:else if shoes === 1}
          <ellipse cx={cx + 1} cy="168" rx="11" ry="3" fill="#2b2f45" />
          <path d="M{cx - 4} 167 L{cx + 1} 161 L{cx + 6} 167" stroke={shoeColor} stroke-width="2.2" fill="none" />
        {:else if shoes === 2}
          <rect x={cx - 8} y="159" width="19" height="10" rx="5" fill={shoeColor} />
          <circle cx={cx - 2} cy="162.5" r="1" fill="rgba(0,0,0,0.3)" />
          <circle cx={cx + 3} cy="162.5" r="1" fill="rgba(0,0,0,0.3)" />
        {:else}
          <path
            d="M{cx - 9} {shoes >= 5 ? 155 : 159} h 13 q 8 0 9 8 v 1 h -22 z"
            fill={shoes >= 14 ? '#ffc83d' : shoeColor}
          />
          <rect
            x={cx - 10}
            y="167"
            width="23"
            height="3.5"
            rx="1.5"
            fill={shoes >= 11 ? '#22e4ff' : '#f4f4f4'}
            filter={shoes >= 7 ? `url(#${uid}-glow)` : undefined}
          />
          {#if shoes >= 7}
            <path d="M{cx - 6} 163 h 11" stroke={shoes >= 11 ? '#ff2bd6' : '#22e4ff'} stroke-width="1.5" filter="url(#{uid}-glow)" />
          {/if}
          {#if shoes >= 12}
            <path d="M{cx - 6} 172 l 2 5 l 2 -3 l 2 4 l 2 -5" stroke="#ff8a3d" stroke-width="1.4" fill="none" filter="url(#{uid}-glow)" />
          {/if}
        {/if}
      </g>
    {/each}
  {/if}

  <!-- Arms -->
  <rect x={22 - w} y="84" width="12" height="36" rx="6" fill={shade(primary, -0.12)} stroke={ink} stroke-width="1" transform="rotate(8 {28 - w} 86)" />
  <rect x={86 + w} y="84" width="12" height="36" rx="6" fill={shade(primary, -0.12)} stroke={ink} stroke-width="1" transform="rotate(-8 {92 + w} 86)" />
  <circle cx={23 - w} cy="121" r="5.5" fill={skin} />
  <circle cx={97 + w} cy="121" r="5.5" fill={skin} />
  {#if look.accessory === 2}
    <rect x={18 - w} y="113" width="11" height="4" rx="1.5" fill={secondary} />
    <rect x={91 + w} y="113" width="11" height="4" rx="1.5" fill={secondary} />
  {/if}

  <!-- Torso / jersey -->
  <path d={torso} fill={primary} stroke={ink} stroke-width="1.1" />
  <g clip-path="url(#{uid}-torso)">
    {#if look.jersey === 1}
      {#each [0, 1, 2, 3, 4, 5, 6] as k (k)}
        <rect x={27 + k * 10} y="70" width="4" height="64" fill={secondary} opacity="0.85" />
      {/each}
    {:else if look.jersey === 2}
      <path d="M18 80 L38 74 L102 132 L82 138 Z" fill={secondary} />
    {:else if look.jersey === 3}
      <rect x="60" y="70" width="42" height="66" fill={secondary} />
    {:else if look.jersey === 4}
      <path d="M18 84 L60 104 L102 84 L102 94 L60 114 L18 94 Z" fill={secondary} />
    {:else if look.jersey === 5}
      {#each [0, 1, 2] as k (k)}
        <rect x="18" y={94 + k * 11} width="84" height="5" fill={secondary} />
      {/each}
    {/if}
    <rect x="18" y="70" width="84" height="66" fill="url(#{uid}-shade)" />
    {#if jerseyTier >= 9}
      <rect x="18" y="70" width="84" height="66" fill="url(#{uid}-holo)" />
    {/if}
  </g>
  {#if jerseyTier >= 8}
    <path d={torso} fill="none" stroke="#22e4ff" stroke-width="1.2" filter="url(#{uid}-glow)" />
  {/if}
  <path d="M51 80 Q60 89 69 80" fill="none" stroke={shade(primary, -0.4)} stroke-width="3" />
  {#if crestUrl}
    <image href={crestUrl} x="52" y="88" width="16" height="16" style="image-rendering: pixelated" />
  {/if}
  {#if charm >= 3}
    <g filter={charm >= 11 ? `url(#${uid}-glow)` : undefined}>
      <path d="M45 94 L48.5 99 L45 104 L41.5 99 Z" fill={charmColor} stroke={ink} stroke-width="0.7" />
      <path d="M45 94 L48.5 99 L45 100.5 Z" fill="#fff" opacity="0.35" />
    </g>
  {/if}
  {#if sponsor && full}
    <text x="60" y="124" text-anchor="middle" font-family="Rajdhani, sans-serif" font-weight="700" font-size="6" fill={sponsor.color} letter-spacing="0.5"
      >{sponsor.name.toUpperCase().slice(0, 16)}</text
    >
  {/if}
  {#if number !== undefined && full}
    <text
      x="60"
      y={crestUrl ? 117 : 113}
      text-anchor="middle"
      font-family="Orbitron, Rajdhani, sans-serif"
      font-weight="900"
      font-size={crestUrl ? 9 : 13}
      fill="#fff"
      stroke="rgba(0,0,0,0.45)"
      stroke-width="1"
      paint-order="stroke">{number}</text
    >
  {/if}

  <!-- Neck & head -->
  <rect x="54" y="66" width="12" height="15" rx="3" fill={shade(skin, -0.12)} />
  {#if look.accessory === 1}
    <path d="M50 80 Q60 93 70 80" fill="none" stroke="#ffc83d" stroke-width="1.6" />
    <circle cx="60" cy="87" r="2" fill="#ffc83d" />
  {/if}
  <ellipse cx="39.5" cy="51" rx="3.5" ry="5" fill={skin} />
  <ellipse cx="80.5" cy="51" rx="3.5" ry="5" fill={skin} />
  {#if look.accessory === 3}
    <circle cx="39" cy="57" r="1.6" fill="#ffc83d" />
  {/if}
  <circle cx="60" cy="50" r="20.5" fill={skin} stroke={ink} stroke-width="1.1" />
  <circle cx="60" cy="50" r="20.5" fill="url(#{uid}-face)" />

  <!-- Face -->
  {#if look.accessory === 4}
    <g fill={secondary} opacity="0.85">
      <rect x="43" y="55" width="7" height="2" rx="1" />
      <rect x="43" y="58.5" width="7" height="2" rx="1" />
      <rect x="70" y="55" width="7" height="2" rx="1" />
      <rect x="70" y="58.5" width="7" height="2" rx="1" />
    </g>
  {/if}

  {#each [52, 68] as ex (ex)}
    {#if look.eyes === 0}
      <circle cx={ex} cy="50" r="2.2" fill={line} />
    {:else if look.eyes === 1}
      <ellipse cx={ex} cy="50" rx="3.6" ry="3" fill="#fff" />
      <circle cx={ex + 0.5} cy="50.3" r="1.8" fill={line} />
    {:else if look.eyes === 2}
      <path d="M{ex - 3} 50 Q{ex} 52.5 {ex + 3} 50" stroke={line} stroke-width="1.6" fill="none" stroke-linecap="round" />
      <path d="M{ex - 3.4} 48.4 h 6.8" stroke={shade(skin, -0.3)} stroke-width="1.2" />
    {:else if look.eyes === 3}
      <rect x={ex - 3} y="49" width="6" height="2.4" rx="1.2" fill={line} />
    {:else}
      <path d="M{ex - 3} 51 Q{ex} 47.5 {ex + 3} 51" stroke={line} stroke-width="1.8" fill="none" stroke-linecap="round" />
    {/if}
  {/each}

  {#if look.brows !== 4}
    {#each [52, 68] as bx (bx)}
      {#if look.brows === 2}
        <path
          d={bx < 60 ? `M${bx - 4} 42.5 L${bx + 4} 45` : `M${bx - 4} 45 L${bx + 4} 42.5`}
          stroke={hairColor}
          stroke-width="2.2"
          stroke-linecap="round"
        />
      {:else}
        {@const lift = look.brows === 3 ? -2.2 : 0}
        <path
          d="M{bx - 4} {44 + lift} Q{bx} {42 + lift} {bx + 4} {44 + lift}"
          stroke={hairColor}
          stroke-width={look.brows === 1 ? 2.8 : 1.6}
          fill="none"
          stroke-linecap="round"
        />
      {/if}
    {/each}
  {/if}

  {#if look.facial === 1}
    <path d="M43 55 Q45 71 60 72 Q75 71 77 55 Q72 64 60 65 Q48 64 43 55 Z" fill={hairColor} opacity="0.28" />
  {:else if look.facial === 3}
    <path d="M55 63 Q60 71 65 63 Q62 66.5 60 66.5 Q58 66.5 55 63 Z" fill={hairColor} />
  {:else if look.facial === 4}
    <path d="M40 49 Q40 73 60 75 Q80 73 80 49 L77 51 Q75 65 60 66.5 Q45 65 43 51 Z" fill={hairColor} />
  {/if}

  {#if look.mouth === 0}
    <path d="M54 58.5 Q60 63 66 58.5" stroke={lip} stroke-width="1.6" fill="none" stroke-linecap="round" />
  {:else if look.mouth === 1}
    <path d="M55 60 h10" stroke={lip} stroke-width="1.6" stroke-linecap="round" />
  {:else if look.mouth === 2}
    <path d="M53 58 Q60 66 67 58 Z" fill={lip} />
    <path d="M54.5 58.6 Q60 61 65.5 58.6 Z" fill="#fff" />
  {:else if look.mouth === 3}
    <path d="M55 60 Q61 61 66 57.5" stroke={lip} stroke-width="1.6" fill="none" stroke-linecap="round" />
  {:else}
    <ellipse cx="60" cy="60" rx="3" ry="2.4" fill={lip} />
  {/if}

  {#if look.facial === 2 || look.facial === 3}
    <path d="M53 56.5 Q60 53.5 67 56.5 Q64 58.5 60 57 Q56 58.5 53 56.5 Z" fill={hairColor} />
  {/if}

  <!-- Front hair -->
  {#if !hatCovers}
    {#if look.hair === 1}
      <path d="M40 48 Q40 28 60 27 Q80 28 80 48 Q72 38 60 38 Q48 38 40 48 Z" fill={hairColor} opacity="0.9" />
    {:else if look.hair === 2}
      <path d="M38 46 L40 32 L46 36 L50 24 L56 33 L62 22 L67 32 L74 25 L76 36 L82 34 L81 47 Q72 37 60 37 Q48 37 38 46 Z" fill={hairColor} />
    {:else if look.hair === 3 || look.hair === 4 || look.hair === 8 || look.hair === 11}
      <path d="M39 48 Q37 27 60 26 Q84 27 81 46 Q76 34 64 33 L56 40 Q46 38 39 48 Z" fill={hairColor} />
    {:else if look.hair === 5}
      <path d="M40 46 Q38 30 60 28 Q82 30 80 46 Q70 38 60 38 Q50 38 40 46 Z" fill={hairColor} />
    {:else if look.hair === 6}
      <path d="M40 48 Q40 34 50 31 L50 40 Q44 42 40 48 Z" fill={hairColor} opacity="0.35" />
      <path d="M80 48 Q80 34 70 31 L70 40 Q76 42 80 48 Z" fill={hairColor} opacity="0.35" />
      <path d="M54 22 Q60 11 66 22 L67 40 Q60 37 53 40 Z" fill={hairColor} />
    {:else if look.hair === 7}
      <circle cx="60" cy="25" r="8" fill={hairColor} />
      <path d="M40 48 Q40 28 60 27 Q80 28 80 48 Q72 38 60 38 Q48 38 40 48 Z" fill={hairColor} />
    {:else if look.hair === 9}
      <g fill={hairColor}>
        {#each [[42, 42], [46, 34], [53, 29], [61, 27], [69, 29], [75, 34], [79, 42]] as [hx, hy] (hx)}
          <circle cx={hx} cy={hy} r="7" />
        {/each}
      </g>
    {:else if look.hair === 10}
      <path
        d="M37 46 Q35 24 60 24 Q85 24 83 46 L84 66 Q79 70 75 64 L76 44 Q68 36 60 36 Q52 36 44 44 L45 64 Q41 70 36 66 Z"
        fill={hairColor}
      />
    {:else if look.hair === 12}
      <path d="M41 42 Q42 22 64 22 Q84 24 80 42 Q72 30 58 33 Q48 35 41 42 Z" fill={hairColor} />
    {:else if look.hair === 13}
      <path
        d="M38 46 Q34 30 46 26 Q52 18 62 24 Q72 18 78 28 Q88 32 82 46 Q76 38 68 40 Q60 34 52 40 Q44 38 38 46 Z"
        fill={hairColor}
      />
    {:else if look.hair === 14}
      <path d="M40 44 Q38 22 58 19 Q72 15 81 26 Q86 34 80 44 Q74 32 60 34 Q48 34 40 44 Z" fill={hairColor} />
    {/if}
  {/if}

  <!-- Headwear -->
  {#if look.hat === 1}
    <path d="M39 44 Q39 24 60 24 Q81 24 81 44 Z" fill={secondary} />
    <ellipse cx="62" cy="44.5" rx="25" ry="4" fill={shade(secondary, -0.3)} />
    <circle cx="60" cy="25" r="1.8" fill={shade(secondary, -0.3)} />
  {:else if look.hat === 2}
    <path d="M39 44 Q39 24 60 24 Q81 24 81 44 Z" fill={secondary} />
    <rect x="38" y="40" width="44" height="4.5" rx="2" fill={shade(secondary, -0.3)} />
    <rect x="55" y="36" width="10" height="4" rx="1.5" fill={shade(secondary, 0.3)} />
  {:else if look.hat === 3}
    <path d="M38 46 Q37 21 60 20 Q83 21 82 46 Z" fill={primary} />
    <rect x="37" y="39" width="46" height="8" rx="3" fill={shade(primary, -0.25)} />
    <circle cx="60" cy="19" r="4" fill={secondary} />
  {:else if look.hat === 4}
    <path d="M39 38 Q60 31 81 38 L81 44 Q60 37 39 44 Z" fill={secondary} />
    <circle cx="82" cy="41" r="2.5" fill={shade(secondary, -0.2)} />
    <path d="M83 42 l 6 6 M83 42 l 7 2" stroke={secondary} stroke-width="2" stroke-linecap="round" />
  {:else if look.hat === 5}
    <path d="M42 36 L44 17 L55 28 Z" fill={hairColor} />
    <path d="M78 36 L76 17 L65 28 Z" fill={hairColor} />
    <path d="M45 31 L46 22 L51 28 Z" fill="#ff8fc8" />
    <path d="M75 31 L74 22 L69 28 Z" fill="#ff8fc8" />
  {/if}

  <!-- Glasses -->
  {#if look.glasses === 1}
    <g fill="none" stroke={line} stroke-width="1.4">
      <circle cx="52" cy="50" r="4.8" />
      <circle cx="68" cy="50" r="4.8" />
      <path d="M56.8 50 h6.4" />
    </g>
  {:else if look.glasses === 2}
    <g fill="none" stroke={line} stroke-width="1.4">
      <rect x="46.5" y="46" width="11" height="8" rx="1.5" />
      <rect x="62.5" y="46" width="11" height="8" rx="1.5" />
      <path d="M57.5 50 h5" />
    </g>
  {:else if look.glasses === 3}
    <g fill="#101018">
      <rect x="45.5" y="46" width="12" height="8" rx="2.5" />
      <rect x="62.5" y="46" width="12" height="8" rx="2.5" />
      <rect x="57" y="48" width="6" height="1.6" />
    </g>
    <path d="M47.5 48 l 3 0" stroke="#fff" stroke-width="1" opacity="0.5" />
  {:else if look.glasses === 4}
    <rect x="41" y="45" width="38" height="9" rx="4.5" fill="#22e4ff" opacity="0.55" filter="url(#{uid}-glow)" />
  {/if}

  <!-- Headset (gear) -->
  {#if headset === 0}
    <circle cx="39.5" cy="53" r="2" fill="#e9ecf5" />
    <circle cx="80.5" cy="53" r="2" fill="#e9ecf5" />
    <path d="M39.5 55 Q38 70 50 84" stroke="#e9ecf5" stroke-width="0.9" fill="none" />
    <path d="M80.5 55 Q82 70 70 84" stroke="#e9ecf5" stroke-width="0.9" fill="none" />
  {:else}
    {@const big = headset >= 4}
    {@const neon = headset >= 8}
    {@const band = neon ? '#22e4ff' : big ? '#2a2f4a' : '#444a66'}
    <path
      d="M{big ? 36 : 38} 50 Q{big ? 34 : 37} 21 60 {big ? 20 : 22} Q{big ? 86 : 83} 21 {big ? 84 : 82} 50"
      fill="none"
      stroke={band}
      stroke-width={big ? 4 : 3}
      filter={neon ? `url(#${uid}-glow)` : undefined}
    />
    {#each [big ? 31 : 34, big ? 79 : 78] as cupX (cupX)}
      <rect
        x={cupX}
        y="43"
        width={big ? 10 : 8}
        height={big ? 16 : 13}
        rx="4"
        fill={neon ? '#0b0e1f' : '#23263a'}
        stroke={big ? (neon ? '#ff2bd6' : secondary) : 'none'}
        stroke-width="1.6"
        filter={neon ? `url(#${uid}-glow)` : undefined}
      />
    {/each}
    {#if big}
      <path d="M35 57 Q39 68 51 64" stroke={band} stroke-width="1.6" fill="none" />
      <circle cx="51.5" cy="64" r="1.9" fill={neon ? '#ff2bd6' : secondary} />
    {/if}
  {/if}
</svg>

<style>
  .avatar {
    display: block;
    overflow: visible;
    transform-origin: 50% 92%;
    animation: idle 3.6s ease-in-out infinite;
    will-change: transform;
  }
  /* Just enough motion to stop a roster reading as stickers. */
  @keyframes idle {
    0%,
    100% {
      transform: translateY(0) scaleY(1);
    }
    50% {
      transform: translateY(-1.2px) scaleY(1.008);
    }
  }
</style>
