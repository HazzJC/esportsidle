<script lang="ts">
  import { GAMES } from '../../data/games';
  import { fmt, fmtPct } from '../../engine/format';
  import { rosterCapacity, teamPlayerIds } from '../../engine/teams';
  import Icon from '../components/Icon.svelte';
  import PlayerCard from '../components/PlayerCard.svelte';
  import { game } from '../game.svelte';

  const v = $derived(game.view);
  const teams = $derived(GAMES.filter((g) => v.s.games[g.id]?.unlocked && v.s.teams[g.id]));
  const total = $derived(Object.keys(v.s.players).length);
  const avgCut = $derived.by(() => {
    const list = Object.values(v.s.players).filter((p) => !p.founder);
    return list.length ? list.reduce((a, p) => a + p.cut, 0) / list.length : 0;
  });
</script>

<div class="roster">
  <div class="summary">
    <div><span class="big num">{fmt(total)}</span> <span class="muted">players</span></div>
    <div><span class="big num">{fmt(v.s.stats.playersSigned)}</span> <span class="muted">signed all time</span></div>
    <div><span class="big num">{fmtPct(avgCut)}</span> <span class="muted">average cut</span></div>
    <button class="btn small" onclick={() => ((game.marketFilter = null), (game.tab = 'market'))}>
      <Icon name="user-plus" size={14} /> Transfer market
    </button>
  </div>

  {#each teams as g (g.id)}
    {@const team = v.s.teams[g.id]}
    {@const ids = teamPlayerIds(team)}
    <section>
      <h3 class="section-title">
        <Icon name={g.icon} size={14} color={g.color} />
        {g.name}
        <span class="dim">{ids.length}/{rosterCapacity(team, v.m)}</span>
      </h3>
      {#if ids.length === 0}
        <p class="muted small">No players yet.</p>
      {:else}
        <div class="list">
          {#each ids as id (id)}
            {@const p = v.s.players[id]}
            {@const slot = team.lineup.indexOf(id)}
            {#if p}
              <PlayerCard player={p} onclick={() => (game.selectedPlayer = id)}>
                <span class="where" class:bench={slot < 0}>{slot >= 0 ? g.roles[slot] : 'Bench'}</span>
              </PlayerCard>
            {/if}
          {/each}
        </div>
      {/if}
    </section>
  {/each}
</div>

<style>
  .roster {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .summary {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 18px;
    padding: 10px 12px;
    border-radius: 10px;
    background: var(--bg-2);
    border: 1px solid var(--line);
  }
  .summary button {
    margin-left: auto;
  }
  .big {
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 18px;
  }
  .section-title {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 6px;
  }
  .where {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 2px 6px;
    border-radius: 999px;
    background: rgba(34, 228, 255, 0.15);
    color: var(--cyan);
  }
  .where.bench {
    background: rgba(255, 255, 255, 0.06);
    color: var(--muted);
  }
  .small {
    font-size: 12.5px;
    margin: 0;
  }
</style>
