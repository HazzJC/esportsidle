<script lang="ts">
  import Icon from '../components/Icon.svelte';
  import { game, type MobileView } from '../game.svelte';

  const ITEMS: { id: MobileView; label: string; icon: string }[] = [
    { id: 'clicker', label: 'Org', icon: 'gamepad-2' },
    { id: 'center', label: 'Manage', icon: 'house' },
    { id: 'store', label: 'Store', icon: 'store' },
  ];

  const hqWaiting = $derived(game.view.s.quests.active.some((q) => q.ready) || !!game.view.s.draft);
</script>

<nav class="mobile-nav panel" aria-label="Views">
  {#each ITEMS as item (item.id)}
    <button class:active={game.mobileView === item.id} onclick={() => (game.mobileView = item.id)}>
      <Icon name={item.icon} size={20} />
      <span>{item.label}</span>
      {#if item.id === 'center' && hqWaiting && game.mobileView !== 'center'}<i class="dot" aria-label="Something is waiting in HQ"></i>{/if}
    </button>
  {/each}
</nav>

<style>
  .dot {
    position: absolute;
    top: 6px;
    right: calc(50% - 20px);
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--gold);
    box-shadow: 0 0 6px var(--gold);
  }
  .mobile-nav {
    display: none;
  }
  @media (max-width: 1023px) {
    .mobile-nav {
      display: flex;
      position: fixed;
      left: 8px;
      right: 8px;
      bottom: 8px;
      z-index: 700;
      padding: 4px;
      gap: 4px;
      box-shadow: var(--shadow);
    }
    button {
      position: relative;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: 6px 0;
      border: none;
      border-radius: 8px;
      background: transparent;
      color: var(--muted);
      font-family: var(--font-ui);
      font-weight: 700;
      font-size: 12px;
    }
    button.active {
      color: var(--accent);
      background: color-mix(in srgb, var(--accent) 12%, transparent);
    }
  }
</style>
