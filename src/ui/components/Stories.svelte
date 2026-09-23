<script lang="ts">
  import { getGame } from '../../data/games';
  import { tierName } from '../../data/leagues';
  import { RIVAL_AFTER_MATCHES, seasonSummary } from '../../engine/stories';
  import { game } from '../game.svelte';
  import { gameLogoSvg } from '../gameArt';
  import { orgLogoSvg } from '../orgArt';
  import Icon from './Icon.svelte';
  import TrophyIcon from './TrophyIcon.svelte';

  const s = $derived(game.view.s);
  const rival = $derived(s.rival);
  const recent = $derived(s.seasonLog.slice(0, 4));
  const latestTrophy = $derived(s.trophyCase[0]);
  /** The newest few trophies, stood on a little shelf, best last so it takes the middle. */
  const shelfRow = $derived(s.trophyCase.slice(0, 5));

  const streakText = (n: number) =>
    n >= 2 ? `You have won ${n} in a row` : n <= -2 ? `They have won ${-n} in a row` : n === 1 ? 'You won the last one' : n === -1 ? 'They won the last one' : '';
</script>

<section class="stories">
  <article class="story rival">
    <span class="kind"><Icon name="swords" size={12} /> Rival</span>
    {#if rival}
      <div class="rival-head">
        <span class="crest">{@html orgLogoSvg(rival.name)}</span>
        <b class="name">{rival.name}</b>
      </div>
      <span class="h2h num"><span class="good">{rival.wins}</span> – <span class="bad">{rival.losses}</span></span>
      <span class="muted small">{streakText(rival.streak) || 'Head to head so far'} · grudge matches against your rival bring double fans</span>
      {#if rival.formerPlayer}<span class="bad small">Their new signing: your former player {rival.formerPlayer}</span>{/if}
      {#if rival.heat}<span class="small">Rivalry heat {rival.heat}/8 · bigger match payouts, harder morale hits on losses</span>{/if}
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
        {#each recent as r, i (`${r.gameId}-${r.season}-${r.run}-${i}`)}
          {@const g = getGame(r.gameId)}
          <li class:good={r.title || r.promoted} class:bad={r.relegated}>
            <!-- Built from constants in gameArt.ts, so {@html} is safe. -->
            <span class="glogo">{@html gameLogoSvg(g.id, g.color, g.name)}</span>
            <span class="rtext">
              <span class="game">{g.name} · S{r.season}{#if r.title}<b class="badge title">Champions</b>{:else if r.promoted}<b class="badge up">Promoted</b>{:else if r.relegated}<b class="badge down">Relegated</b>{/if}</span>
              <span class="tier dim">{tierName(r.tier)}</span>
              <span class="sum">{seasonSummary(r)}</span>
            </span>
          </li>
        {/each}
      </ul>
    {/if}
  </article>

  <button class="story shelf" onclick={() => ((game.tab = 'achievements'), (game.mobileView = 'center'))}>
    <span class="kind"><Icon name="trophy" size={12} /> Trophy shelf</span>
    {#if latestTrophy}
      <span class="mini-shelf" aria-hidden="true">
        {#each shelfRow as t, i (t.id)}
          <span class="mini-trophy" class:front={i === 0}><TrophyIcon kind={t.kind} tier={t.tier} size={i === 0 ? 34 : 24} /></span>
        {/each}
      </span>
      <span class="shelf-text">
        <span><b class="num">{s.trophyCase.length}</b> trophies</span>
        <span class="muted small">Latest: {getGame(latestTrophy.gameId).name}, {tierName(latestTrophy.tier)}</span>
      </span>
    {:else}
      <span class="muted small">Win a league title or an Invitational to start the collection.</span>
    {/if}
  </button>
</section>

<style>
  .rival-head {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .crest {
    flex: none;
    width: 34px;
    height: 34px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
  }
  .crest :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
  }
  .stories {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 8px;
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
  /* A scoreboard in the UI face, whose zero is a plain oval rather than Orbitron's slashed box. */
  .h2h {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 26px;
    line-height: 1.1;
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
    gap: 8px;
    align-items: flex-start;
    padding: 5px 6px;
    border-radius: 8px;
    border-left: 2px solid var(--line-2);
    background: color-mix(in srgb, var(--bg-2) 70%, transparent);
    font-size: 12px;
  }
  .glogo {
    flex: none;
    width: 26px;
    height: 26px;
    filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.5));
  }
  .glogo :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
  }
  .rtext {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .tier {
    font-size: 11px;
  }
  .badge {
    margin-left: 6px;
    padding: 0 6px;
    border-radius: 999px;
    font-size: 9.5px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    vertical-align: 1px;
  }
  .badge.title {
    color: #1a1406;
    background: var(--gold);
  }
  .badge.up {
    color: #06210f;
    background: var(--green);
  }
  .badge.down {
    color: #fff;
    background: var(--red);
  }
  li.good {
    border-left-color: var(--green);
  }
  li.bad {
    border-left-color: var(--red);
  }
  li.good .sum,
  li.bad .sum {
    color: var(--muted);
  }
  .game {
    font-family: var(--font-ui);
    font-weight: 700;
    color: var(--text);
  }
  .sum {
    color: var(--muted);
  }
  /* The newest trophies stood on a small wooden shelf. */
  .mini-shelf {
    display: flex;
    align-items: flex-end;
    gap: 4px;
    padding: 6px 8px 0;
    margin-top: 2px;
    border-bottom: 5px solid #4a3526;
    border-radius: 6px 6px 0 0;
    background: radial-gradient(80% 90% at 30% 100%, color-mix(in srgb, var(--gold) 16%, transparent), transparent 70%);
    box-shadow: 0 6px 8px -6px rgba(0, 0, 0, 0.7);
  }
  .mini-trophy {
    display: block;
    filter: drop-shadow(0 2px 1px rgba(0, 0, 0, 0.5));
  }
  .mini-trophy.front {
    filter: drop-shadow(0 0 8px color-mix(in srgb, var(--gold) 45%, transparent)) drop-shadow(0 2px 1px rgba(0, 0, 0, 0.5));
  }
  .shelf-text {
    display: flex;
    flex-direction: column;
  }
</style>
