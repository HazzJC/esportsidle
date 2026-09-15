<script lang="ts">
  import { GAME_MAP } from '../../data/games';
  import { tierName } from '../../data/leagues';
  import { fmt, fmtPct, money } from '../../engine/format';
  import { game } from '../game.svelte';
  import Icon from './Icon.svelte';
  import Modal from './Modal.svelte';

  const REVEAL_MS = 900;

  let revealed = $state(0);

  const t = $derived(game.view.s.events.lastTournament);
  const openId = $derived(t && !t.seen ? t.id : null);
  const reduced = $derived(game.view.s.settings.reducedMotion);

  $effect(() => {
    const id = openId;
    if (id === null) return;
    const total = game.state.events.lastTournament?.rounds.length ?? 0;
    if (reduced) {
      revealed = total + 1;
      return;
    }
    revealed = 0;
    let count = 0;
    const timer = setInterval(() => {
      count++;
      revealed = count;
      if (count > total) clearInterval(timer);
    }, REVEAL_MS);
    return () => clearInterval(timer);
  });
</script>

{#if t && !t.seen}
  {@const g = GAME_MAP.get(t.gameId)}
  {@const done = revealed > t.rounds.length}
  <Modal title="Tournament Invite" onclose={() => game.dismissTournament()} width={480}>
    <div class="head" style="--gc:{g?.color ?? 'var(--cyan)'}">
      <span class="gicon"><Icon name={g?.icon ?? 'trophy'} size={24} /></span>
      <div>
        <div class="gname">{g?.name ?? 'Your team'} Invitational</div>
        <div class="muted small">{tierName(t.tier)} level · three rounds, one champion</div>
      </div>
    </div>

    <ol class="bracket">
      {#each ['Quarter-final', 'Semi-final', 'Grand Final'] as roundName, i (roundName)}
        {@const round = t.rounds[i]}
        {@const shown = revealed > i || done || (!round && revealed >= t.rounds.length)}
        <li class="round" class:win={shown && round?.win} class:loss={shown && round && !round.win} class:skipped={shown && !round}>
          <span class="rname">{roundName}</span>
          {#if !shown}
            <span class="pending muted">{revealed === i && round ? 'Playing…' : '—'}</span>
          {:else if round}
            <span class="vs">vs {round.opponent} <span class="dim">({fmtPct(round.chance)} to win)</span></span>
            <span class="result num">{round.win ? 'W' : 'L'} {round.score}</span>
          {:else}
            <span class="pending dim">Did not reach</span>
          {/if}
        </li>
      {/each}
    </ol>

    {#if done}
      <div class="summary" class:champion={t.champion}>
        <div class="big">
          <Icon name={t.champion ? 'trophy' : t.rounds.some((r) => r.win) ? 'medal' : 'skull'} size={28} />
          {t.champion ? 'Champions!' : t.trophies > 0 ? 'Runners-up' : 'Knocked out'}
        </div>
        <div class="rewards">
          <span><b class="num gold-text">{money(t.totalPrize)}</b> prize money</span>
          <span><b class="num cyan-text">{fmt(t.fans)}</b> fans</span>
          <span><b class="num gold-text">{t.trophies}</b> {t.trophies === 1 ? 'trophy' : 'trophies'}</span>
        </div>
        {#if t.champion}<p class="muted small">Income ×2 for two minutes while you celebrate.</p>{/if}
      </div>
    {/if}

    {#snippet footer()}
      <button class="btn primary" onclick={() => game.dismissTournament()}>{done ? 'Continue' : 'Skip'}</button>
    {/snippet}
  </Modal>
{/if}

<style>
  .head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }
  .gicon {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 10px;
    color: var(--gc);
    background: color-mix(in srgb, var(--gc) 16%, transparent);
    border: 1px solid color-mix(in srgb, var(--gc) 50%, transparent);
  }
  .gname {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 18px;
  }
  .small {
    font-size: 12.5px;
    margin: 0;
  }
  .bracket {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .round {
    display: grid;
    grid-template-columns: 96px 1fr auto;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 9px;
    border: 1px solid var(--line);
    background: var(--bg-2);
    transition:
      border-color 0.2s,
      background 0.2s;
  }
  .round.win {
    border-color: rgba(61, 255, 154, 0.5);
    background: rgba(61, 255, 154, 0.08);
  }
  .round.loss {
    border-color: rgba(255, 77, 109, 0.5);
    background: rgba(255, 77, 109, 0.08);
  }
  .round.skipped {
    opacity: 0.45;
  }
  .rname {
    font-family: var(--font-ui);
    font-weight: 700;
  }
  .vs {
    font-size: 13px;
    min-width: 0;
  }
  .result {
    font-family: var(--font-display);
    font-weight: 700;
  }
  .round.win .result {
    color: var(--green);
  }
  .round.loss .result {
    color: var(--red);
  }
  .pending {
    grid-column: span 2;
    font-size: 13px;
  }
  .summary {
    margin-top: 12px;
    padding: 12px;
    border-radius: 10px;
    border: 1px solid var(--line-2);
    background: var(--bg-2);
    text-align: center;
    animation: pop 0.3s ease-out;
  }
  .summary.champion {
    border-color: var(--gold);
    background: linear-gradient(180deg, rgba(255, 200, 61, 0.16), transparent);
  }
  .big {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 22px;
  }
  .summary.champion .big {
    color: var(--gold);
  }
  .rewards {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 14px;
    margin-top: 8px;
    font-size: 13px;
  }
  @keyframes pop {
    from {
      transform: scale(0.9);
      opacity: 0;
    }
  }
</style>
