<script lang="ts">
  import { getGame } from '../../data/games';
  import { tierName } from '../../data/leagues';
  import { RIVAL_AFTER_MATCHES, seasonSummary } from '../../engine/stories';
  import { game } from '../game.svelte';
  import Icon from './Icon.svelte';
  import TrophyIcon from './TrophyIcon.svelte';

  const s = $derived(game.view.s);
  const rival = $derived(s.rival);
  const recent = $derived(s.seasonLog.slice(0, 4));
  const latestTrophy = $derived(s.trophyCase[0]);

  const streakText = (n: number) =>
    n >= 2 ? `You have won ${n} in a row` : n <= -2 ? `They have won ${-n} in a row` : n === 1 ? 'You won the last one' : n === -1 ? 'They won the last one' : '';
</script>

<section class="stories">
  <article class="story rival">
    <span class="kind"><Icon name="swords" size={12} /> Rival</span>
    {#if rival}
      <b class="name">{rival.name}</b>
      <span class="h2h num"><span class="good">{rival.wins}</span> – <span class="bad">{rival.losses}</span></span>
      <span class="muted small">{streakText(rival.streak) || 'Head to head so far'} · derby matches against your rival bring double fans</span>
    {:else}
      <span class="muted small">
        {s.stats.matchesWon + s.stats.matchesLost < RIVAL_AFTER_MATCHES ? 'Nobody has noticed you yet. Keep playing.' : 'The next challenger is sizing you up.'}
      </span>
    {/if}
    {#if s.rivalHistory.length > 0}
      <span class="dim small">Left behind: {s.rivalHistory.slice(0, 3).map((r) => `${r.name} (${r.wins}-${r.losses})`).join(', ')}</span>
    {/if}
  </article>

  <article class="story seasons">
    <span class="kind"><Icon name="calendar-clock" size={12} /> Season recaps</span>
    {#if recent.length === 0}
      <span class="muted small">Recaps appear here as your teams finish seasons.</span>
    {:else}
      <ul>
        {#each recent as r (r.gameId + r.season + '-' + r.run)}
          <li class:good={r.title || r.promoted} class:bad={r.relegated}>
            <span class="game">{getGame(r.gameId).name} · S{r.season} · {tierName(r.tier)}</span>
            <span class="sum">{seasonSummary(r)}</span>
          </li>
        {/each}
      </ul>
    {/if}
  </article>

  <button class="story shelf" onclick={() => ((game.tab = 'achievements'), (game.mobileView = 'center'))}>
    <span class="kind"><Icon name="trophy" size={12} /> Trophy shelf</span>
    {#if latestTrophy}
      <span class="trophy-row">
        <TrophyIcon kind={latestTrophy.kind} tier={latestTrophy.tier} size={30} />
        <span>
          <b class="num">{s.trophyCase.length}</b> trophies
          <span class="muted small">Latest: {getGame(latestTrophy.gameId).name}, {tierName(latestTrophy.tier)}</span>
        </span>
      </span>
    {:else}
      <span class="muted small">Win a title or a tournament to start the collection.</span>
    {/if}
  </button>
</section>

<style>
  .stories {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr) minmax(0, 1fr);
    gap: 8px;
  }
  @media (max-width: 1250px) {
    .stories {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .story {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 12px;
    border-radius: 11px;
    border: 1px solid var(--line);
    background: var(--bg-2);
    text-align: left;
    min-width: 0;
  }
  button.story:hover {
    border-color: var(--line-2);
  }
  .kind {
    display: flex;
    align-items: center;
    gap: 5px;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .small {
    font-size: 12px;
  }
  .name {
    font-family: var(--font-ui);
    font-size: 17px;
  }
  .h2h {
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 20px;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  li {
    display: flex;
    flex-direction: column;
    padding-left: 8px;
    border-left: 2px solid var(--line-2);
    font-size: 12px;
  }
  li.good {
    border-left-color: var(--green);
  }
  li.bad {
    border-left-color: var(--red);
  }
  li.good .sum,
  li.bad .sum {
    color: inherit;
  }
  .game {
    font-family: var(--font-ui);
    font-weight: 700;
    color: var(--text);
  }
  .sum {
    color: var(--muted);
  }
  .trophy-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .trophy-row > span {
    display: flex;
    flex-direction: column;
  }
</style>
