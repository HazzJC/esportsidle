<script lang="ts">
  import { GAME_MAP } from '../../data/games';
  import { tierName } from '../../data/leagues';
  import { fmt, fmtPct, fmtTime, money } from '../../engine/format';
  import {
    INVITATION_STAKES,
    ROUND_NAMES,
    championPrize,
    championTrophies,
    invitationOdds,
    invitationalName,
    stakeCost,
  } from '../../engine/tournament';
  import { Rng } from '../../engine/rng';
  import { game } from '../game.svelte';
  import { orgLogoSvg } from '../orgArt';
  import Icon from './Icon.svelte';
  import Modal from './Modal.svelte';

  const REVEAL_MS = 900;

  let revealed = $state(0);
  /** The invitation the player put off for now; it waits in a pill until it plays itself. */
  let laterId = $state<number | null>(null);
  let stakeId = $state('none');

  const v = $derived(game.view);
  const t = $derived(v.s.events.lastTournament);
  const inv = $derived(v.s.events.invitation);
  const showResult = $derived(!!t && !t.seen);
  const showOffer = $derived(!showResult && !!inv && laterId !== inv.id);
  const openId = $derived(t && !t.seen ? t.id : null);
  const reduced = $derived(v.s.settings.reducedMotion);

  /** Odds with each preparation, so the choice shows what it buys. */
  const offer = $derived.by(() => {
    if (!inv) return null;
    const base = invitationOdds(v.s, v.r, v.m, 0, inv.gameId);
    if (!base) return null;
    const stakes = INVITATION_STAKES.map((stake) => {
      const odds = invitationOdds(v.s, v.r, v.m, stake.boost, inv.gameId);
      const cost = stakeCost(v.s, v.r, stake);
      return { stake, odds, cost, affordable: cost <= v.s.cash };
    });
    const ctx = { rng: new Rng(v.s), mods: v.m, rates: v.r };
    return { base, stakes, prize: championPrize(v.s, ctx, inv.gameId), trophies: championTrophies(base.tier) };
  });
  const picked = $derived(offer?.stakes.find((x) => x.stake.id === stakeId && x.affordable) ?? offer?.stakes[0]);

  // A new invitation starts on "Just show up".
  $effect(() => {
    if (inv?.id !== undefined) stakeId = 'none';
  });

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

  const chanceTone = (p: number) => (p >= 0.75 ? 'var(--green)' : p >= 0.5 ? 'var(--gold)' : 'var(--red)');
</script>

{#if showOffer && inv && offer && picked}
  {@const g = GAME_MAP.get(inv.gameId)}
  {@const odds = picked.odds ?? offer.base}
  <Modal title="Invitational invite" onclose={() => (laterId = inv.id)} width={520}>
    <div class="head" style="--gc:{g?.color ?? 'var(--accent)'}">
      <span class="gicon"><Icon name={g?.icon ?? 'trophy'} size={24} /></span>
      <div>
        <div class="gname">{invitationalName(offer.base.tier)}</div>
        <div class="muted small">{g?.name ?? 'Your team'} · {tierName(offer.base.tier)} prizes · starts in <b class="num">{fmtTime(Math.max(0, inv.expiresAt - v.s.time))}</b></div>
      </div>
    </div>

    <div class="odds" style="--oc:{chanceTone(odds.champion)}">
      <div class="odds-big num">{fmtPct(odds.champion, false, 0)}</div>
      <div class="odds-text">
        <b>chance to win it all</b>
        <span class="muted small">Invitationals draw a softer field than your league, and each round is harder than the last.</span>
      </div>
    </div>

    <ol class="bracket">
      {#each ROUND_NAMES as roundName, i (roundName)}
        <li class="round preview">
          <span class="rname">{roundName}</span>
          <span class="bar"><i style="width:{odds.rounds[i] * 100}%; background:{chanceTone(odds.rounds[i])}"></i></span>
          <span class="num chance">{fmtPct(odds.rounds[i], false, 0)}</span>
        </li>
      {/each}
    </ol>

    <h4 class="sub">Prepare <span class="dim">· the money is spent whatever happens</span></h4>
    <div class="stakes" role="radiogroup" aria-label="Preparation">
      {#each offer.stakes as x (x.stake.id)}
        <button
          class="stake"
          class:on={picked.stake.id === x.stake.id}
          role="radio"
          aria-checked={picked.stake.id === x.stake.id}
          disabled={!x.affordable}
          onclick={() => (stakeId = x.stake.id)}
        >
          <span class="sname">{x.stake.name}</span>
          <span class="sdesc dim">{x.stake.desc}</span>
          <span class="scost num">{x.cost > 0 ? money(x.cost) : 'Free'}</span>
          <span class="sodds num" style="color:{chanceTone(x.odds?.champion ?? 0)}">{fmtPct(x.odds?.champion ?? 0, false, 0)}</span>
        </button>
      {/each}
    </div>

    <div class="prize small">
      <Icon name="trophy" size={13} />
      <span>Champions take <b class="gold-text num">{money(offer.prize)}</b>, <b class="gold-text num">{offer.trophies}</b> trophies and income ×2 for two minutes. Reach the final for a trophy.</span>
    </div>

    {#snippet footer()}
      <button class="btn" onclick={() => (laterId = inv.id)}>Decide later</button>
      <button class="btn primary" onclick={() => game.playInvitation(picked.stake.id)}>
        Play · {fmtPct(odds.champion, false, 0)} to win
      </button>
    {/snippet}
  </Modal>
{/if}

{#if inv && laterId === inv.id && !showResult}
  <button class="inv-pill" onclick={() => (laterId = null)}>
    <Icon name="trophy" size={14} />
    <span>{invitationalName(offer?.base.tier ?? 0)}</span>
    <b class="num">{fmtTime(Math.max(0, inv.expiresAt - v.s.time))}</b>
  </button>
{/if}

{#if showResult && t}
  {@const g = GAME_MAP.get(t.gameId)}
  {@const done = revealed > t.rounds.length}
  <Modal title={invitationalName(t.tier)} onclose={() => game.dismissTournament()} width={480}>
    <div class="head" style="--gc:{g?.color ?? 'var(--accent)'}">
      <span class="gicon"><Icon name={g?.icon ?? 'trophy'} size={24} /></span>
      <div>
        <div class="gname">{g?.name ?? 'Your team'}</div>
        <div class="muted small">
          {tierName(t.tier)} prizes{#if t.odds !== undefined} · {fmtPct(t.odds, false, 0)} to win going in{/if}{#if t.stake}
            · {money(t.stake)} on preparation{/if}
        </div>
      </div>
    </div>

    <ol class="bracket">
      {#each ROUND_NAMES as roundName, i (roundName)}
        {@const round = t.rounds[i]}
        {@const shown = revealed > i || done || (!round && revealed >= t.rounds.length)}
        <li class="round" class:win={shown && round?.win} class:loss={shown && round && !round.win} class:skipped={shown && !round}>
          <span class="rname">{roundName}</span>
          {#if !shown}
            <span class="pending muted">{revealed === i && round ? 'Playing…' : '—'}</span>
          {:else if round}
            <span class="vs"><span class="crest">{@html orgLogoSvg(round.opponent)}</span> {round.opponent} <span class="dim">({fmtPct(round.chance, false, 0)} to win)</span></span>
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
          <span><b class="num accent-text">{fmt(t.fans)}</b> fans</span>
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
    flex: none;
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
  .odds {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 10px 12px;
    margin-bottom: 10px;
    border-radius: 10px;
    border: 1px solid color-mix(in srgb, var(--oc) 45%, transparent);
    background: color-mix(in srgb, var(--oc) 9%, transparent);
  }
  .odds-big {
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 34px;
    line-height: 1;
    color: var(--oc);
    min-width: 3.2ch;
    text-align: center;
  }
  .odds-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
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
  .round.preview {
    padding: 6px 10px;
  }
  .bar {
    display: block;
    height: 6px;
    border-radius: 3px;
    background: var(--bg-3, rgba(255, 255, 255, 0.06));
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    border-radius: 3px;
    transition: width 0.25s;
  }
  .chance {
    min-width: 4ch;
    text-align: right;
    font-weight: 700;
  }
  .round.win {
    border-color: color-mix(in srgb, var(--green) 50%, transparent);
    background: color-mix(in srgb, var(--green) 8%, transparent);
  }
  .round.loss {
    border-color: color-mix(in srgb, var(--red) 50%, transparent);
    background: color-mix(in srgb, var(--red) 8%, transparent);
  }
  .round.skipped {
    opacity: 0.45;
  }
  .rname {
    font-family: var(--font-ui);
    font-weight: 700;
  }
  .vs {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    min-width: 0;
  }
  .crest {
    flex: none;
    width: 22px;
    height: 22px;
  }
  .crest :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
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
  .sub {
    margin: 14px 0 6px;
    font-family: var(--font-ui);
    font-size: 13px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .sub .dim {
    text-transform: none;
    letter-spacing: 0;
    font-weight: 400;
  }
  .stakes {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 6px;
  }
  .stake {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-areas:
      'name odds'
      'desc odds'
      'cost odds';
    align-items: center;
    column-gap: 8px;
    padding: 7px 10px;
    text-align: left;
    border-radius: 9px;
    border: 1px solid var(--line);
    background: var(--bg-2);
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  .stake:hover:not(:disabled) {
    border-color: var(--line-2);
  }
  .stake.on {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 10%, var(--bg-2));
  }
  .stake:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .sname {
    grid-area: name;
    font-family: var(--font-ui);
    font-weight: 700;
  }
  .sdesc {
    grid-area: desc;
    font-size: 11.5px;
  }
  .scost {
    grid-area: cost;
    font-size: 12px;
    color: var(--gold);
  }
  .sodds {
    grid-area: odds;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 18px;
  }
  .prize {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin-top: 10px;
    color: var(--muted);
  }
  .prize :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--gold);
  }
  .inv-pill {
    position: fixed;
    left: 50%;
    bottom: calc(16px + env(safe-area-inset-bottom, 0px));
    transform: translateX(-50%);
    z-index: 900;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 8px 14px;
    border-radius: 999px;
    border: 1px solid var(--gold);
    background: color-mix(in srgb, var(--gold) 16%, var(--bg-1, #12141c));
    color: var(--text);
    font-family: var(--font-ui);
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 6px 22px rgba(0, 0, 0, 0.45);
    animation: nudge 2.4s ease-in-out infinite;
  }
  .inv-pill :global(svg) {
    color: var(--gold);
  }
  @keyframes nudge {
    0%,
    100% {
      transform: translateX(-50%) translateY(0);
    }
    50% {
      transform: translateX(-50%) translateY(-3px);
    }
  }
  /* On phones and tablets popups use the bottom of the screen, so the invite waits at the top. */
  @media (max-width: 1023px) {
    .inv-pill {
      top: calc(62px + env(safe-area-inset-top, 0px));
      bottom: auto;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .inv-pill {
      animation: none;
    }
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
    background: linear-gradient(180deg, color-mix(in srgb, var(--gold) 16%, transparent), transparent);
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
