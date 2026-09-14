<script lang="ts">
  import Icon from '../components/Icon.svelte';
  import { game, type TabId } from '../game.svelte';
  import Achievements from '../tabs/Achievements.svelte';
  import HQ from '../tabs/HQ.svelte';
  import Options from '../tabs/Options.svelte';
  import Stats from '../tabs/Stats.svelte';

  const TABS: { id: TabId; label: string; icon: string }[] = [
    { id: 'hq', label: 'HQ', icon: 'house' },
    { id: 'achievements', label: 'Trophies', icon: 'trophy' },
    { id: 'stats', label: 'Stats', icon: 'chart-column' },
    { id: 'options', label: 'Options', icon: 'settings' },
  ];
</script>

<div class="center panel">
  <nav class="tabs" aria-label="Sections">
    {#each TABS as t (t.id)}
      <button class="tab" class:active={game.tab === t.id} onclick={() => (game.tab = t.id)} aria-current={game.tab === t.id}>
        <Icon name={t.icon} size={16} />
        <span>{t.label}</span>
      </button>
    {/each}
  </nav>
  <div class="body">
    {#if game.tab === 'hq'}
      <HQ />
    {:else if game.tab === 'achievements'}
      <Achievements />
    {:else if game.tab === 'stats'}
      <Stats />
    {:else if game.tab === 'options'}
      <Options />
    {/if}
  </div>
</div>

<style>
  .center {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .tabs {
    display: flex;
    gap: 2px;
    padding: 6px 6px 0;
    border-bottom: 1px solid var(--line);
    overflow-x: auto;
    flex: none;
  }
  .tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 12px;
    border: 1px solid transparent;
    border-bottom: none;
    border-radius: 8px 8px 0 0;
    background: transparent;
    color: var(--muted);
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 14px;
    letter-spacing: 0.03em;
    white-space: nowrap;
  }
  .tab:hover {
    color: var(--text);
  }
  .tab.active {
    color: var(--cyan);
    border-color: var(--line);
    background: linear-gradient(180deg, rgba(34, 228, 255, 0.12), transparent);
    box-shadow: inset 0 2px 0 var(--cyan);
  }
  .body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 12px;
  }
</style>
