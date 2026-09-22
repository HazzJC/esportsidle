<script lang="ts">
  import { untrack } from 'svelte';
  import { SECTION_MAP, sectionOpen } from '../../engine/sections';
  import Icon from '../components/Icon.svelte';
  import PlayerDetail from '../components/PlayerDetail.svelte';
  import { game } from '../game.svelte';
  import { TABS } from '../tabs';
  import { tooltip } from '../tooltip.svelte';
  import Achievements from '../tabs/Achievements.svelte';
  import HQ from '../tabs/HQ.svelte';
  import Legacy from '../tabs/Legacy.svelte';
  import Market from '../tabs/Market.svelte';
  import Options from '../tabs/Options.svelte';
  import House from '../tabs/House.svelte';
  import Sponsors from '../tabs/Sponsors.svelte';
  import Staff from '../tabs/Staff.svelte';
  import Studio from '../tabs/Studio.svelte';
  import Stats from '../tabs/Stats.svelte';
  import Teams from '../tabs/Teams.svelte';

  const s = $derived(game.view.s);
  /** Tabs open one at a time as the org grows (engine/sections); the rest wait behind a lock chip. */
  const open = $derived(TABS.filter((t) => sectionOpen(s, t.id)));
  const locked = $derived(TABS.filter((t) => !sectionOpen(s, t.id)));
  const isNew = (id: string) => !!SECTION_MAP.get(id)?.unlock && !s.sectionsSeen[id];

  /** A finished quest or an open draft waits in HQ. */
  const hqWaiting = $derived(s.quests.active.some((q) => q.ready) || !!s.draft);

  // Never leave the player on a tab that has not opened yet.
  $effect(() => {
    if (!sectionOpen(s, game.tab)) game.tab = 'hq';
  });
  // A new tab opens at the top, not wherever the last one was scrolled to.
  let body: HTMLElement | undefined = $state();
  $effect(() => {
    void game.tab;
    if (body) body.scrollTop = 0;
  });
  // Visiting a tab clears its "new" flag.
  $effect(() => {
    const tab = game.tab;
    untrack(() => game.markSectionSeen(tab));
  });

  function lockedTip() {
    const st = game.view.s;
    return {
      title: 'Still to unlock',
      icon: 'lock',
      lines: locked.map((t) => `${t.label}: ${SECTION_MAP.get(t.id)?.requirement?.(st) ?? 'Keep playing'}`),
    };
  }
</script>

<div class="center panel">
  <nav class="tabs" aria-label="Sections">
    {#each open as t (t.id)}
      <button class="tab" class:active={game.tab === t.id} onclick={() => (game.tab = t.id)} aria-current={game.tab === t.id}>
        <Icon name={t.icon} size={16} />
        <span>{t.label}</span>
        {#if t.id === 'hq' && hqWaiting && game.tab !== 'hq'}<i class="dot" aria-label="Something is waiting in HQ"></i>{/if}
        {#if isNew(t.id) && game.tab !== t.id}<i class="new">New</i>{/if}
      </button>
    {/each}
    {#if locked.length > 0}
      <span class="locked" use:tooltip={lockedTip} aria-label="{locked.length} more tabs to unlock"><Icon name="lock" size={13} /> {locked.length}</span>
    {/if}
  </nav>
  <div class="body" bind:this={body}>
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
  .new {
    position: absolute;
    top: -2px;
    right: 0;
    padding: 0 5px;
    border-radius: 999px;
    background: var(--gold);
    color: #1a1406;
    font-family: var(--font-ui);
    font-style: normal;
    font-weight: 700;
    font-size: 9.5px;
    line-height: 14px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    animation: new-pop 0.4s ease-out;
  }
  .locked {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: 4px;
    padding: 4px 9px;
    align-self: center;
    border-radius: 999px;
    border: 1px dashed var(--line-2);
    color: var(--dim);
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 12px;
    white-space: nowrap;
    cursor: help;
  }
  @keyframes new-pop {
    from {
      transform: scale(0.4);
      opacity: 0;
    }
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
