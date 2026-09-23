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

{#snippet row(kind: 'growth' | 'concern' | 'opportunity', label: string, item: AgendaItem | null, empty: string)}
  <li class="row {kind}" class:quiet={!item}>
    <span class="icon"><Icon name={item?.icon ?? 'check'} size={18} /></span>
    <div class="text">
      <span class="kind">{label}</span>
      {#if item}
        <b>{item.title}</b>
        <span class="detail">{item.detail}</span>
        {#if item.progress !== undefined}
          <span class="bar"><i style="width:{Math.max(0, Math.min(100, item.progress * 100))}%"></i></span>
        {/if}
      {:else}
        <span class="detail">{empty}</span>
      {/if}
    </div>
    {#if item?.action}
      {@const target = item.action.target}
      <button class="btn small go" onclick={() => go(target)}>{item.action.label} <Icon name="chevron-right" size={13} /></button>
    {/if}
  </li>
{/snippet}

<section class="agenda" aria-label="Next steps">
  <h3 class="section-title">Next steps</h3>
  <ul>
    {@render row('growth', 'Next goal', agenda.growth, '')}
    {@render row('concern', 'Teams', agenda.concern, 'Every team is in good shape.')}
    {@render row('opportunity', 'Opportunity', agenda.opportunity, 'Nothing pressing right now.')}
  </ul>
</section>

<style>
  /* One panel, one row per thing to do: a coloured marker, what and why, and the button to act on it. */
  .agenda {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .agenda .section-title {
    margin: 0;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    border-radius: 12px;
    border: 1px solid var(--line);
    background: var(--bg-2);
    overflow: hidden;
  }
  .row {
    --k: var(--accent);
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 10px 12px;
    border-left: 3px solid var(--k);
    background: linear-gradient(90deg, color-mix(in srgb, var(--k) 9%, transparent), transparent 45%);
  }
  .row + .row {
    border-top: 1px solid var(--line);
  }
  .row.concern {
    --k: var(--gold);
  }
  .row.opportunity {
    --k: var(--green);
  }
  .row.quiet {
    --k: var(--line-2);
    background: none;
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
  .icon {
    display: grid;
    place-items: center;
    flex: none;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    color: var(--k);
    background: color-mix(in srgb, var(--k) 15%, transparent);
  }
  .quiet .icon {
    color: var(--dim);
  }
  .text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1px;
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
  .quiet .detail {
    color: var(--dim);
  }
  .bar {
    margin-top: 4px;
    max-width: 260px;
  }
  .bar > i {
    background: var(--k);
  }
  .go {
    flex: none;
  }
  /* On a phone the button drops under the text instead of squeezing it into a column. */
  @media (max-width: 520px) {
    .row {
      flex-wrap: wrap;
      align-items: flex-start;
    }
    .text {
      flex-basis: calc(100% - 50px);
    }
    .go {
      margin-left: 45px;
    }
  }
</style>
