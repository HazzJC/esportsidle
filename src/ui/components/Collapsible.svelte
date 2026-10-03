<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import { readCollapse, withUrgent, writeCollapse, type CollapseMemory } from '../collapse';
  import Icon from './Icon.svelte';

  interface Props {
    /** Remembers this card's state under this id. */
    id: string;
    title: string;
    /** Shown beside the title when the card is closed, so nothing is hidden silently ("3", "1 new"). */
    summary?: string;
    /** An item that needs the player now. A new one opens the card (see collapse.ts). */
    urgent?: string | null;
    /** Controls beside the title, shown while the card is open. */
    actions?: Snippet;
    children: Snippet;
  }
  let { id, title, summary, urgent = null, actions, children }: Props = $props();

  // A card keeps its id for life, so its memory is read once.
  let mem = $state<CollapseMemory>(untrack(() => readCollapse(id)));
  $effect(() => {
    const next = withUrgent(mem, urgent);
    if (next !== mem) {
      mem = next;
      writeCollapse(id, next);
    }
  });

  function toggle(): void {
    mem = { ...mem, open: !mem.open };
    writeCollapse(id, mem);
  }
</script>

<section class="collapsible" class:closed={!mem.open} aria-label={title}>
  <div class="head">
    <button class="toggle" aria-expanded={mem.open} onclick={toggle}>
      <Icon name={mem.open ? 'chevron-down' : 'chevron-right'} size={14} />
      <h3 class="section-title">{title}</h3>
      {#if !mem.open && summary}<span class="badge num" class:urgent={urgent !== null}>{summary}</span>{/if}
    </button>
    {#if mem.open && actions}{@render actions()}{/if}
  </div>
  {#if mem.open}{@render children()}{/if}
</section>

<style>
  .collapsible {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--muted);
    cursor: pointer;
    font: inherit;
  }
  .toggle:hover {
    color: var(--text);
  }
  .toggle:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
    border-radius: 4px;
  }
  .section-title {
    margin: 0;
  }
  .badge {
    padding: 1px 7px;
    border-radius: 999px;
    font-size: 11px;
    background: var(--panel-2);
    border: 1px solid var(--line);
    color: var(--muted);
  }
  .badge.urgent {
    border-color: var(--gold);
    color: var(--gold);
  }
</style>
