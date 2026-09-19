<script lang="ts">
  import {
    ACCESSORIES,
    BODY_TYPES,
    BROW_STYLES,
    EYE_STYLES,
    FACIAL_STYLES,
    GLASSES_STYLES,
    HAIR_COLORS,
    HAIR_STYLES,
    HAT_STYLES,
    JERSEY_STYLES,
    MOUTH_STYLES,
    PANTS_COLORS,
    SHOE_COLORS,
    SKIN_TONES,
  } from '../../data/cosmetics';
  import type { Appearance } from '../../engine/types';
  import Icon from './Icon.svelte';

  let {
    look,
    onchange,
    onrandomise,
    compact = false,
  }: { look: Appearance; onchange: (patch: Partial<Appearance>) => void; onrandomise?: () => void; compact?: boolean } = $props();

  interface LookOption {
    key: keyof Appearance;
    label: string;
    values?: string[];
    colors?: string[];
  }
  const LOOK_OPTIONS: LookOption[] = [
    { key: 'skin', label: 'Skin tone', colors: SKIN_TONES },
    { key: 'hair', label: 'Hair', values: HAIR_STYLES },
    { key: 'hairColor', label: 'Hair colour', colors: HAIR_COLORS },
    { key: 'eyes', label: 'Eyes', values: EYE_STYLES },
    { key: 'brows', label: 'Brows', values: BROW_STYLES },
    { key: 'mouth', label: 'Mouth', values: MOUTH_STYLES },
    { key: 'facial', label: 'Facial hair', values: FACIAL_STYLES },
    { key: 'glasses', label: 'Glasses', values: GLASSES_STYLES },
    { key: 'hat', label: 'Headwear', values: HAT_STYLES },
    { key: 'accessory', label: 'Accessory', values: ACCESSORIES },
    { key: 'body', label: 'Build', values: BODY_TYPES },
    { key: 'jersey', label: 'Jersey style', values: JERSEY_STYLES },
    { key: 'pants', label: 'Trousers', colors: PANTS_COLORS },
    { key: 'shoeColor', label: 'Shoe colour', colors: SHOE_COLORS },
  ];

  function step(o: LookOption, delta: number) {
    if (!o.values) return;
    const n = o.values.length;
    onchange({ [o.key]: (((look[o.key] + delta) % n) + n) % n } as Partial<Appearance>);
  }
</script>

<div class="look" class:compact>
  {#each LOOK_OPTIONS as o (o.key)}
    <div class="look-row">
      <span class="lbl">{o.label}</span>
      {#if o.colors}
        <div class="swatches">
          {#each o.colors as c, i (i)}
            <button
              class="sw"
              class:active={look[o.key] === i}
              style="background:{c}"
              aria-label="{o.label} option {i + 1}"
              onclick={() => onchange({ [o.key]: i } as Partial<Appearance>)}
            ></button>
          {/each}
        </div>
      {:else if o.values}
        <div class="stepper">
          <button onclick={() => step(o, -1)} aria-label="Previous {o.label}"><Icon name="chevron-left" size={16} /></button>
          <span>{o.values[look[o.key]] ?? '—'}</span>
          <button onclick={() => step(o, 1)} aria-label="Next {o.label}"><Icon name="chevron-right" size={16} /></button>
        </div>
      {/if}
    </div>
  {/each}
</div>
{#if onrandomise}
  <div class="look-foot">
    <span class="muted small">Headset, shoes and jersey visuals come from their gear tiers.</span>
    <button class="btn small" onclick={onrandomise}><Icon name="shuffle" size={13} /> Randomise</button>
  </div>
{/if}

<style>
  .look {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 6px 14px;
  }
  .look.compact {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
  .look-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 30px;
  }
  .lbl {
    font-size: 12.5px;
    color: var(--muted);
  }
  .stepper {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .stepper span {
    min-width: 96px;
    text-align: center;
    font-family: var(--font-ui);
    font-weight: 700;
  }
  .stepper button {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 6px;
    border: 1px solid var(--line-2);
    background: var(--bg-2);
  }
  .stepper button:hover {
    border-color: var(--accent);
  }
  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    justify-content: flex-end;
    max-width: 170px;
  }
  .sw {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.15);
    padding: 0;
  }
  .sw.active {
    border-color: #fff;
    box-shadow: 0 0 0 2px var(--accent);
  }
  .look-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 8px;
  }
  .small {
    font-size: 12px;
  }
</style>
