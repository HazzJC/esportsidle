<script lang="ts">
  import { buildAgenda, type AgendaItem, type AgendaTarget } from '../../engine/agenda';
  import { game } from '../game.svelte';
  import Icon from './Icon.svelte';

  const v = $derived(game.view);
  const agenda = $derived(buildAgenda(v.s, v.m, v.r));

  function go(t: AgendaTarget): void {
    switch (t.kind) {
      case 'tab':
        if (t.tab === 'market') game.marketFilter = t.gameId ?? null;
        game.tab = t.tab;
        game.mobileView = 'center';
        break;
      case 'store':
        game.mobileView = 'store';
        break;
      case 'player':
        game.selectedPlayer = t.id;
        break;
      case 'unlockGame':
        game.unlockGame(t.gameId);
        break;
    }
  }
</script>

{#snippet card(kind: 'growth' | 'concern' | 'opportunity', label: string, item: AgendaItem | null, empty: string)}
  <article class="card {kind}" class:quiet={!item}>
    <span class="kind">{label}</span>
    {#if item}
      <div class="body">
        <span class="icon"><Icon name={item.icon} size={18} /></span>
        <div class="text">
          <b>{item.title}</b>
          <span class="detail">{item.detail}</span>
        </div>
      </div>
      {#if item.progress !== undefined}
        <span class="bar"><i style="width:{Math.max(0, Math.min(100, item.progress * 100))}%"></i></span>
      {/if}
      {#if item.action}
        {@const target = item.action.target}
        <button class="btn small go" onclick={() => go(target)}>{item.action.label} <Icon name="chevron-right" size={13} /></button>
      {/if}
    {:else}
      <p class="empty"><Icon name="check" size={14} /> {empty}</p>
    {/if}
  </article>
{/snippet}

<section class="agenda" aria-label="Agenda">
  {@render card('growth', 'Next goal', agenda.growth, '')}
  {@render card('concern', 'Team', agenda.concern, 'Every team is in good shape.')}
  {@render card('opportunity', 'Opportunity', agenda.opportunity, 'Nothing pressing right now.')}
</section>

<style>
  .agenda {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  @media (max-width: 1250px) {
    .agenda {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .card {
    --k: var(--accent);
    display: flex;
    flex-direction: column;
    gap: 7px;
    padding: 10px 12px;
    border-radius: 11px;
    border: 1px solid color-mix(in srgb, var(--k) 32%, var(--line));
    background: linear-gradient(135deg, color-mix(in srgb, var(--k) 11%, transparent), transparent 55%), var(--bg-2);
  }
  .card.concern {
    --k: var(--gold);
  }
  .card.opportunity {
    --k: var(--green);
  }
  .card.quiet {
    border-color: var(--line);
    background: var(--bg-2);
  }
  .kind {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--k);
  }
  .quiet .kind {
    color: var(--dim);
  }
  .body {
    display: flex;
    gap: 9px;
    align-items: flex-start;
  }
  .icon {
    display: grid;
    place-items: center;
    flex: none;
    width: 32px;
    height: 32px;
    border-radius: 9px;
    color: var(--k);
    background: color-mix(in srgb, var(--k) 14%, transparent);
  }
  .text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .text b {
    font-family: var(--font-ui);
    font-size: 15px;
    line-height: 1.2;
  }
  .detail {
    font-size: 12.5px;
    color: var(--muted);
    line-height: 1.35;
  }
  .bar > i {
    background: var(--k);
  }
  .go {
    align-self: flex-start;
  }
  .empty {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: 12.5px;
    color: var(--dim);
  }
</style>
