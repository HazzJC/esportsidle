<script lang="ts">
  import { EMBLEM_MARKS, EMBLEM_SHAPES, type Emblem } from '../../data/emblems';
  import Icon from './Icon.svelte';
  import OrgLogo from './OrgLogo.svelte';

  let {
    emblem,
    name,
    primary,
    secondary,
    onchange,
  }: { emblem: Emblem; name: string; primary: string; secondary: string; onchange: (next: Emblem) => void } = $props();
</script>

<div class="picker">
  <div class="shapes" role="radiogroup" aria-label="Badge shape">
    {#each EMBLEM_SHAPES as sh (sh.id)}
      <button
        type="button"
        class="shape"
        class:on={emblem.shape === sh.id}
        role="radio"
        aria-checked={emblem.shape === sh.id}
        aria-label={sh.name}
        title={sh.name}
        onclick={() => onchange({ ...emblem, shape: sh.id })}
      >
        <OrgLogo name={name || 'Org'} {primary} {secondary} size={40} shape={sh.id} mark={emblem.mark} />
      </button>
    {/each}
  </div>
  <div class="marks" role="radiogroup" aria-label="Logo mark">
    {#each EMBLEM_MARKS as m (m.id)}
      <button
        type="button"
        class="mark"
        class:on={emblem.mark === m.id}
        role="radio"
        aria-checked={emblem.mark === m.id}
        aria-label={m.name}
        title={m.name}
        onclick={() => onchange({ ...emblem, mark: m.id })}
      >
        {#if m.id === 'initials'}<span class="aa">Aa</span>{:else}<Icon name={m.id} size={18} />{/if}
      </button>
    {/each}
  </div>
</div>

<style>
  .picker {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .shapes {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .shape {
    display: grid;
    place-items: center;
    width: 54px;
    height: 54px;
    border-radius: 12px;
    border: 1.5px solid var(--line-2);
    background: var(--bg-2);
    padding: 0;
  }
  .marks {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(38px, 1fr));
    gap: 5px;
  }
  .mark {
    display: grid;
    place-items: center;
    height: 38px;
    border-radius: 9px;
    border: 1.5px solid var(--line-2);
    background: var(--bg-2);
    color: var(--muted);
  }
  .aa {
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 13px;
  }
  .shape:hover,
  .mark:hover {
    border-color: var(--muted);
    color: var(--text);
  }
  .shape.on,
  .mark.on {
    border-color: var(--accent);
    color: var(--accent);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 25%, transparent);
  }
</style>
