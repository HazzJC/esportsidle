<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import Icon from './Icon.svelte';

  let {
    title,
    onclose,
    width = 460,
    children,
    footer,
  }: { title: string; onclose: () => void; width?: number; children: Snippet; footer?: Snippet } = $props();

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') onclose();
  }
</script>

<svelte:window onkeydown={onKey} />

<div class="backdrop" in:fade={{ duration: 150 }} onclick={onclose} role="presentation">
  <div
    class="modal panel"
    style="--w:{width}px"
    role="dialog"
    aria-modal="true"
    aria-label={title}
    tabindex="-1"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
    in:scale={{ start: 0.95, duration: 160 }}
  >
    <header>
      <h2>{title}</h2>
      <button class="close" onclick={onclose} aria-label="Close"><Icon name="x" size={18} /></button>
    </header>
    <div class="body">{@render children()}</div>
    {#if footer}<footer>{@render footer()}</footer>{/if}
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 800;
    display: grid;
    place-items: center;
    padding: 16px;
    background: rgba(3, 4, 12, 0.72);
    backdrop-filter: blur(3px);
  }
  .modal {
    width: min(var(--w), 100%);
    max-height: calc(100vh - 32px);
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow);
    outline: none;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    border-bottom: 1px solid var(--line);
  }
  h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 15px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .close {
    border: none;
    background: transparent;
    color: var(--muted);
    display: grid;
    place-items: center;
    padding: 4px;
    border-radius: 6px;
  }
  .close:hover {
    color: var(--text);
    background: var(--panel-3);
  }
  .body {
    padding: 14px;
    overflow: auto;
  }
  footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 10px 14px;
    border-top: 1px solid var(--line);
  }
</style>
