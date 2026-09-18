<script lang="ts">
  import { fly } from 'svelte/transition';
  import { game } from '../game.svelte';
  import Icon from './Icon.svelte';
</script>

<div class="toasts" aria-live="polite">
  {#each game.toasts as t (t.id)}
    <button class="toast {t.tone}" onclick={() => game.dismissToast(t.id)} transition:fly={{ x: 40, duration: 220 }}>
      {#if t.icon}<span class="icon"><Icon name={t.icon} size={18} /></span>{/if}
      <span class="text">
        <span class="title">{t.title}</span>
        {#if t.body}<span class="body">{t.body}</span>{/if}
      </span>
    </button>
  {/each}
</div>

<style>
  .toasts {
    position: fixed;
    right: 14px;
    bottom: 14px;
    z-index: 900;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
    pointer-events: none;
  }
  /* On wide screens the store sits bottom-right, so toasts anchored there mask its buy rows.
     The left column below the clicker is read-only, so they cover nothing clickable. */
  @media (min-width: 1100px) {
    .toasts {
      right: auto;
      left: 14px;
      align-items: flex-start;
    }
  }
  .toast {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 220px;
    max-width: 340px;
    padding: 9px 12px;
    text-align: left;
    border-radius: 10px;
    border: 1px solid var(--line-2);
    background: linear-gradient(180deg, rgba(24, 29, 60, 0.97), rgba(14, 17, 38, 0.97));
    box-shadow: var(--shadow);
    --c: var(--cyan);
  }
  .toast.good {
    --c: var(--green);
  }
  .toast.bad {
    --c: var(--red);
  }
  .toast.gold {
    --c: var(--gold);
  }
  .toast {
    border-left: 3px solid var(--c);
  }
  .icon {
    color: var(--c);
    display: grid;
    place-items: center;
  }
  .text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .title {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 15px;
  }
  .body {
    font-size: 12.5px;
    color: var(--muted);
  }
  @media (max-width: 860px) {
    .toasts {
      right: 8px;
      left: 8px;
      bottom: 64px;
      align-items: stretch;
    }
    .toast {
      max-width: none;
    }
  }
</style>
