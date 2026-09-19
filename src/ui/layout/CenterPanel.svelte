<script lang="ts">
  import Icon from '../components/Icon.svelte';
  import PlayerDetail from '../components/PlayerDetail.svelte';
  import { game, type TabId } from '../game.svelte';
  import Achievements from '../tabs/Achievements.svelte';
  import HQ from '../tabs/HQ.svelte';
  import Legacy from '../tabs/Legacy.svelte';
  import Market from '../tabs/Market.svelte';
  import Options from '../tabs/Options.svelte';
  import Roster from '../tabs/Roster.svelte';
  import House from '../tabs/House.svelte';
  import Sponsors from '../tabs/Sponsors.svelte';
  import Staff from '../tabs/Staff.svelte';
  import Studio from '../tabs/Studio.svelte';
  import Stats from '../tabs/Stats.svelte';
  import Teams from '../tabs/Teams.svelte';

  const TABS: { id: TabId; label: string; icon: string }[] = [
    { id: 'hq', label: 'HQ', icon: 'building' },
    { id: 'house', label: 'House', icon: 'house' },
    { id: 'teams', label: 'Teams', icon: 'swords' },
    { id: 'roster', label: 'Roster', icon: 'users' },
    { id: 'market', label: 'Market', icon: 'user-plus' },
    { id: 'staff', label: 'Staff', icon: 'briefcase' },
    { id: 'studio', label: 'Studio', icon: 'palette' },
    { id: 'sponsors', label: 'Sponsors', icon: 'handshake' },
    { id: 'legacy', label: 'Legacy', icon: 'crown' },
    { id: 'achievements', label: 'Trophies', icon: 'trophy' },
    { id: 'stats', label: 'Stats', icon: 'chart-column' },
    { id: 'options', label: 'Options', icon: 'settings' },
  ];

  /** A finished quest or an open draft waits in HQ. */
  const hqWaiting = $derived(game.view.s.quests.active.some((q) => q.ready) || !!game.view.s.draft);
</script>

<div class="center panel">
  <nav class="tabs" aria-label="Sections">
    {#each TABS as t (t.id)}
      <button class="tab" class:active={game.tab === t.id} onclick={() => (game.tab = t.id)} aria-current={game.tab === t.id}>
        <Icon name={t.icon} size={16} />
        <span>{t.label}</span>
        {#if t.id === 'hq' && hqWaiting && game.tab !== 'hq'}<i class="dot" aria-label="Something is waiting in HQ"></i>{/if}
      </button>
    {/each}
  </nav>
  <div class="body">
    {#if game.tab === 'hq'}
      <HQ />
    {:else if game.tab === 'house'}
      <House />
    {:else if game.tab === 'staff'}
      <Staff />
    {:else if game.tab === 'studio'}
      <Studio />
    {:else if game.tab === 'sponsors'}
      <Sponsors />
    {:else if game.tab === 'legacy'}
      <Legacy />
    {:else if game.tab === 'teams'}
      <Teams />
    {:else if game.tab === 'roster'}
      <Roster />
    {:else if game.tab === 'market'}
      <Market />
    {:else if game.tab === 'achievements'}
      <Achievements />
    {:else if game.tab === 'stats'}
      <Stats />
    {:else if game.tab === 'options'}
      <Options />
    {/if}
  </div>
</div>

{#if game.selectedPlayer}
  <PlayerDetail />
{/if}

<style>
  .dot {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--gold);
    box-shadow: 0 0 6px var(--gold);
  }
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
    scrollbar-width: none;
  }
  .tab {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 11px;
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
    color: var(--accent);
    border-color: var(--line);
    background: linear-gradient(180deg, color-mix(in srgb, var(--accent) 12%, transparent), transparent);
    box-shadow: inset 0 2px 0 var(--accent);
  }
  .body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 12px;
  }
  @media (max-width: 1280px) {
    .tab span {
      display: none;
    }
    .tab.active span {
      display: inline;
    }
  }
</style>
