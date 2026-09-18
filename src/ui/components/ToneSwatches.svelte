<script lang="ts">
  import type { Swatch } from '../../data/palette';
  import { readableOn } from '../color';
  import Icon from './Icon.svelte';

  let {
    value,
    swatches,
    onpick,
    label = 'Colour',
  }: { value: string; swatches: Swatch[]; onpick: (color: string) => void; label?: string } = $props();

  const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
  const isPreset = $derived(swatches.some((s) => same(s.color, value)));
</script>

<div class="swatches" role="radiogroup" aria-label={label}>
  {#each swatches as sw (sw.id)}
    {@const active = same(sw.color, value)}
    <button
      type="button"
      class="sw"
      class:active
      role="radio"
      aria-checked={active}
      aria-label={sw.name}
      style="--c:{sw.color}; --ink:{readableOn(sw.color)}"
      onclick={() => onpick(sw.color)}
    >
      <span class="dot">{#if active}<Icon name="check" size={15} />{/if}</span>
      <span class="name">{sw.name}</span>
    </button>
  {/each}
  <label class="sw" class:active={!isPreset} style="--c:{value}; --ink:{readableOn(value)}">
    <span class="dot custom">
      <Icon name="pipette" size={14} />
      <input type="color" {value} oninput={(e) => onpick(e.currentTarget.value)} aria-label="Custom colour" />
    </span>
    <span class="name">Custom</span>
  </label>
</div>

<style>
  .swatches {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(58px, 1fr));
    gap: 8px 6px;
  }
  .sw {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    padding: 4px 0;
    border: none;
    background: none;
    cursor: pointer;
  }
  .dot {
    position: relative;
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: var(--c);
    color: var(--ink);
    box-shadow:
      0 0 0 2px var(--panel),
      0 0 0 3px color-mix(in srgb, var(--c) 35%, transparent);
    transition:
      transform 0.12s,
      box-shadow 0.12s;
  }
  .sw:hover .dot {
    transform: scale(1.08);
  }
  .sw.active .dot {
    box-shadow:
      0 0 0 2px var(--panel),
      0 0 0 4px var(--c),
      0 0 16px color-mix(in srgb, var(--c) 45%, transparent);
  }
  .custom {
    background: conic-gradient(#f0445a, #f5c451, #c5e84a, #2dd4bf, #60a5fa, #a78bfa, #fb7185, #f0445a);
    color: #141416;
  }
  .sw.active .custom {
    background: var(--c);
    color: var(--ink);
  }
  .custom input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    border: none;
    padding: 0;
  }
  .name {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 12px;
    color: var(--muted);
  }
  .sw.active .name {
    color: var(--text);
  }
</style>
