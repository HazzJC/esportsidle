<script lang="ts">
  import { tip, type TipLine } from '../tooltip.svelte';
  import Icon from './Icon.svelte';

  let width = $state(0);
  let height = $state(0);

  const content = $derived(tip.source ? tip.source() : null);

  const pos = $derived.by(() => {
    const margin = 14;
    const vw = typeof window === 'undefined' ? 1200 : window.innerWidth;
    const vh = typeof window === 'undefined' ? 800 : window.innerHeight;
    let left = tip.x + margin;
    let top = tip.y + margin;
    if (left + width > vw - 8) left = tip.x - width - margin;
    if (left < 8) left = 8;
    if (top + height > vh - 8) top = vh - height - 8;
    if (top < 8) top = 8;
    return { left, top };
  });

  function line(l: string | TipLine): TipLine {
    return typeof l === 'string' ? { text: l } : l;
  }
</script>

{#if content}
  <div
    class="tooltip"
    style="left:{pos.left}px; top:{pos.top}px"
    bind:clientWidth={width}
    bind:clientHeight={height}
    role="tooltip"
  >
    <div class="head">
      {#if content.icon}
        <span class="icon" style="--c:{content.iconColor ?? 'var(--cyan)'}"><Icon name={content.icon} size={20} /></span>
      {/if}
      <div class="titles">
        <div class="title">{content.title}</div>
        {#if content.subtitle}<div class="subtitle">{content.subtitle}</div>{/if}
      </div>
      {#if content.cost}
        <div class="cost num" class:ok={content.costOk} class:no={content.costOk === false}>{content.cost}</div>
      {/if}
    </div>
    {#if content.lines && content.lines.length > 0}
      <div class="lines">
        {#each content.lines as l, i (i)}
          {@const L = line(l)}
          <div class="line {L.tone ?? ''}">{L.text}</div>
        {/each}
      </div>
    {/if}
    {#if content.flavor}
      <div class="flavor">“{content.flavor}”</div>
    {/if}
  </div>
{/if}

<style>
  .tooltip {
    position: fixed;
    z-index: 1000;
    width: max-content;
    max-width: min(340px, calc(100vw - 16px));
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid var(--line-2);
    background: linear-gradient(180deg, rgba(24, 29, 60, 0.98), rgba(12, 15, 34, 0.98));
    box-shadow:
      var(--shadow),
      0 0 0 1px rgba(34, 228, 255, 0.08) inset;
    pointer-events: none;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .icon {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 8px;
    color: var(--c);
    border: 1px solid color-mix(in srgb, var(--c) 60%, transparent);
    background: color-mix(in srgb, var(--c) 14%, transparent);
    flex: none;
  }
  .titles {
    flex: 1;
    min-width: 0;
  }
  .title {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 16px;
    line-height: 1.1;
  }
  .subtitle {
    font-size: 11px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .cost {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 15px;
    white-space: nowrap;
  }
  .cost.ok {
    color: var(--green);
  }
  .cost.no {
    color: var(--red);
  }
  .lines {
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    font-size: 13px;
  }
  .line.good {
    color: var(--green);
  }
  .line.bad {
    color: var(--red);
  }
  .line.muted {
    color: var(--muted);
  }
  .line.gold {
    color: var(--gold);
  }
  .line.cyan {
    color: var(--cyan);
  }
  .flavor {
    margin-top: 8px;
    font-size: 12px;
    font-style: italic;
    color: var(--dim);
  }
</style>
