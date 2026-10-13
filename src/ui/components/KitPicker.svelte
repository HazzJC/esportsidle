<script lang="ts">
  import { TEAM_KITS, UI_TONES } from '../../data/palette';
  import { kitForTone } from '../../engine/org';

  let {
    primary,
    secondary,
    onchange,
  }: { primary: string; secondary: string; onchange: (primary: string, secondary: string) => void } = $props();

  const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
  /**
   * A kit that matches none of the presets is shown first, so the colour picked when the org was founded
   * (Violet, Sky...) is still there by name rather than seeming to have vanished.
   */
  const own = $derived.by(() => {
    if (TEAM_KITS.some((k) => same(k.primary, primary) && same(k.secondary, secondary))) return null;
    const tone = UI_TONES.find((t) => {
      const k = kitForTone(t.color);
      return same(k.primary, primary) && same(k.secondary, secondary);
    });
    return { name: tone?.name ?? 'Yours' };
  });
</script>

<div class="kit-picker">
  <div class="presets">
    {#if own}
      <button type="button" class="kit active" aria-pressed="true" title="Your current team colours">
        <span class="split" style="--p:{primary}; --s:{secondary}"></span>
        <span class="name">{own.name}</span>
      </button>
    {/if}
    {#each TEAM_KITS as k (k.id)}
      {@const active = same(k.primary, primary) && same(k.secondary, secondary)}
      <button type="button" class="kit" class:active aria-pressed={active} onclick={() => onchange(k.primary, k.secondary)}>
        <span class="split" style="--p:{k.primary}; --s:{k.secondary}"></span>
        <span class="name">{k.name}</span>
      </button>
    {/each}
  </div>
  <div class="custom">
    <label>
      <input type="color" value={primary} oninput={(e) => onchange(e.currentTarget.value, secondary)} />
      <span>Primary</span>
    </label>
    <label>
      <input type="color" value={secondary} oninput={(e) => onchange(primary, e.currentTarget.value)} />
      <span>Accent</span>
    </label>
  </div>
</div>

<style>
  .kit-picker {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .presets {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(62px, 1fr));
    gap: 8px 6px;
  }
  .kit {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    padding: 4px 0;
    border: none;
    background: none;
    cursor: pointer;
  }
  /* A jersey-style split: primary body, accent sash. */
  .split {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--p) 0 58%, var(--s) 58% 76%, var(--p) 76%);
    box-shadow:
      0 0 0 2px var(--panel),
      0 0 0 3px var(--line-2);
    transition: transform 0.12s;
  }
  .kit:hover .split {
    transform: scale(1.08);
  }
  .kit.active .split {
    box-shadow:
      0 0 0 2px var(--panel),
      0 0 0 4px var(--accent);
  }
  .name {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 12px;
    color: var(--muted);
  }
  .kit.active .name {
    color: var(--text);
  }
  .custom {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
  }
  .custom label {
    display: flex;
    align-items: center;
    gap: 7px;
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 13px;
    color: var(--muted);
    cursor: pointer;
  }
  .custom input {
    width: 34px;
    height: 26px;
    padding: 0;
    border: 1px solid var(--line-2);
    border-radius: 6px;
    background: none;
    cursor: pointer;
  }
</style>
