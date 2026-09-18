<script lang="ts">
  import { GAMES, getGame } from '../../data/games';
  import { TRAIT_MAP } from '../../data/traits';
  import { fmtPct, fmtTime, money } from '../../engine/format';
  import { rerollCost } from '../../engine/market';
  import { ALL_STATS, STAT_LABEL } from '../../engine/players';
  import { hasRosterSpace } from '../../engine/teams';
  import Icon from '../components/Icon.svelte';
  import PlayerCard from '../components/PlayerCard.svelte';
  import RosterImpact from '../components/RosterImpact.svelte';
  import { previewSigning } from '../../engine/roster';
  import { game } from '../game.svelte';
  import { tooltip } from '../tooltip.svelte';

  const v = $derived(game.view);
  const unlocked = $derived(GAMES.filter((g) => v.s.games[g.id]?.unlocked));
  const listings = $derived(v.s.market.listings.filter((l) => !game.marketFilter || l.player.gameId === game.marketFilter));
  const cost = $derived(rerollCost(v.r.cpsNoBuffs, v.s.market.rerolls));

  function openSlots(gameId: string): number {
    const team = v.s.teams[gameId];
    return team ? team.lineup.filter((id) => id === null).length : 0;
  }
</script>

<div class="market">
  <header class="head">
    <div>
      <h2 class="section-title">Transfer Market</h2>
      <p class="muted small">New players arrive in <span class="num">{fmtTime(v.s.market.nextRefresh - v.s.time)}</span>. Signing fees are paid once; players take a cut of their prize money.</p>
    </div>
    <button class="btn" disabled={v.s.cash < cost} onclick={() => game.rerollMarket()}>
      <Icon name="refresh-cw" size={14} /> Scout now · {money(cost)}
    </button>
  </header>

  <div class="filters">
    <button class:active={!game.marketFilter} onclick={() => (game.marketFilter = null)}>All</button>
    {#each unlocked as g (g.id)}
      {@const open = openSlots(g.id)}
      <button class:active={game.marketFilter === g.id} style="--gc:{g.color}" onclick={() => (game.marketFilter = g.id)}>
        <Icon name={g.icon} size={13} color={g.color} />
        {g.name}
        {#if open > 0}<span class="open">{open} open</span>{/if}
      </button>
    {/each}
  </div>

  {#if listings.length === 0}
    <div class="empty muted">
      <Icon name="search" size={36} />
      <p>No players available{game.marketFilter ? ` for ${getGame(game.marketFilter).name}` : ''} right now. Scout for more or wait for the next window.</p>
    </div>
  {:else}
    <div class="grid">
      {#each listings as l (l.player.id)}
        {@const p = l.player}
        {@const space = hasRosterSpace(v.s, p.gameId, v.m)}
        {@const afford = v.s.cash >= l.price}
        <div class="listing">
          <PlayerCard player={p} showCondition={false} />
          <RosterImpact preview={previewSigning(v.s, p, v.m)} />
          <div class="stats">
            {#each ALL_STATS as st (st)}
              <div class="stat" title={STAT_LABEL[st]}>
                <span class="sl">{STAT_LABEL[st].slice(0, 3)}</span>
                <span class="sb"><i style="width:{Math.min(100, p.stats[st])}%"></i></span>
                <span class="sv num">{p.stats[st]}</span>
              </div>
            {/each}
          </div>
          <div class="traits">
            {#each p.traits as id (id)}
              {@const t = TRAIT_MAP.get(id)}
              {#if t}
                <span class="trait {t.tone}" use:tooltip={() => ({ title: t.name, icon: t.icon, lines: [t.desc] })}>
                  <Icon name={t.icon} size={12} />
                  {t.name}
                </span>
              {/if}
            {/each}
          </div>
          <div class="foot">
            <span class="muted small">Potential <b>{p.potential}</b> · Cut <b>{fmtPct(p.cut)}</b></span>
            <button
              class="btn small"
              class:primary={afford && space}
              disabled={!afford || !space}
              onclick={() => game.signPlayer(p.id)}
              title={!space ? 'Roster full' : !afford ? 'Not enough cash' : 'Sign this player'}
            >
              {space ? `Sign · ${money(l.price)}` : 'Roster full'}
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .market {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .small {
    font-size: 12.5px;
    margin: 0;
  }
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .filters button {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid var(--line-2);
    background: var(--bg-2);
    color: var(--muted);
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 13px;
  }
  .filters button.active {
    color: var(--text);
    border-color: var(--gc, var(--accent));
    background: color-mix(in srgb, var(--gc, var(--accent)) 15%, var(--bg-2));
  }
  .open {
    font-size: 10px;
    padding: 0 5px;
    border-radius: 999px;
    background: var(--accent);
    color: #041318;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: 10px;
  }
  .listing {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
    border-radius: 12px;
    border: 1px solid var(--line);
    background: rgba(0, 0, 0, 0.15);
  }
  .stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3px 12px;
  }
  .stat {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
  }
  .sl {
    width: 26px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .sb {
    flex: 1;
    height: 4px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.06);
    overflow: hidden;
  }
  .sb i {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, var(--gold), var(--accent));
  }
  .sv {
    width: 22px;
    text-align: right;
  }
  .traits {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .trait {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 1px 7px;
    border-radius: 999px;
    font-size: 11px;
    border: 1px solid var(--line-2);
    color: var(--muted);
  }
  .trait.good {
    color: var(--green);
    border-color: color-mix(in srgb, var(--green) 35%, transparent);
  }
  .trait.bad {
    color: var(--red);
    border-color: color-mix(in srgb, var(--red) 35%, transparent);
  }
  .trait.mixed {
    color: var(--gold);
    border-color: color-mix(in srgb, var(--gold) 35%, transparent);
  }
  .foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30px;
    text-align: center;
  }
</style>
