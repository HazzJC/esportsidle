<script lang="ts">
  import { FIRST_WIN_BONUS } from '../../data/tutorial';
  import { fmt, fmtTime, money } from '../../engine/format';
  import type { MatchRecord, TeamState } from '../../engine/types';
  import { game } from '../game.svelte';
  import { orgLogoSvg } from '../orgArt';
  import OrgLogo from './OrgLogo.svelte';

  /**
   * The fixture on a team card: your crest against the next opponent's, the match bar between them,
   * and when a match ends a short result card. A win pops the prize, counting up, with a shower of
   * coins; a loss shows the consolation money, quietly.
   */
  let {
    team,
    interval,
    active,
    primary,
    secondary,
    gameColor,
  }: { team: TeamState; interval: number; active: boolean; primary: string; secondary: string; gameColor: string } = $props();

  const s = $derived(game.view.s);

  const opponent = $derived(team.nextOpponent ?? null);
  /** The opponent's parody crest. Drawn from constants in orgArt.ts. */
  const theirCrest = $derived(opponent ? orgLogoSvg(opponent.name) : null);
  const pct = $derived(active ? Math.min(100, (team.progress / Math.max(0.001, interval)) * 100) : 0);
  const secondsLeft = $derived(active ? Math.max(0, interval - team.progress) : 0);

  // ---- The result card -------------------------------------------------------------------------
  const RESULT_MS = 2600;
  let seen = $state(-1);
  let result = $state<{ record: MatchRecord; firstWin: boolean; key: number } | null>(null);
  let shown = $state(0);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let frame = 0;

  /** Counts the prize up from zero over the first part of the card. */
  function countUp(target: number) {
    cancelAnimationFrame(frame);
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 700);
      shown = target * (1 - Math.pow(1 - t, 3));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
  }

  $effect(() => {
    const played = team.wins + team.losses;
    if (seen < 0) {
      seen = played;
      return;
    }
    if (played <= seen) return;
    seen = played;
    const record = team.history[0];
    if (!record) return;
    const firstWin = record.win && s.stats.matchesWon + s.stats.matchesLost === 1;
    result = { record, firstWin, key: played };
    shown = 0;
    countUp(record.prize + (firstWin ? FIRST_WIN_BONUS : 0));
    clearTimeout(timer);
    timer = setTimeout(() => (result = null), RESULT_MS);
  });

  $effect(() => () => {
    clearTimeout(timer);
    cancelAnimationFrame(frame);
  });

  /** Coins thrown from the prize: fixed spreads so the shower looks the same each time. */
  const COINS = [-64, -44, -26, -10, 8, 24, 40, 58].map((dx, i) => ({ dx, dy: -(34 + ((i * 37) % 26)), delay: (i % 4) * 0.05, spin: i % 2 ? 1 : -1 }));
</script>

<div class="versus" style="--gc:{gameColor}" class:idle={!active}>
  <div class="side us">
    <span class="crest"><OrgLogo name={s.org.name} {primary} {secondary} size={46} shape={s.org.emblem.shape} mark={s.org.emblem.mark} /></span>
    <span class="nm"><span class="nt">{s.org.name}</span></span>
  </div>

  <div class="mid">
    <span class="vs">VS</span>
    <span class="track" aria-hidden="true"><i style="width:{pct}%"></i></span>
    <span class="when num">{active ? (secondsLeft < 1 ? 'Live' : `${fmtTime(secondsLeft)}`) : 'No match'}</span>
  </div>

  <div class="side them">
    {#if opponent && theirCrest}
      <span class="nm">
        <span class="nt">{opponent.name}</span>
        {#if opponent.rival}<b class="grudge">Grudge match</b>{/if}
      </span>
      <span class="crest them-crest" role="img" aria-label="{opponent.name} logo">{@html theirCrest}</span>
    {:else}
      <span class="nm dim">Opponent to be drawn</span>
    {/if}
  </div>

  {#if result}
    {#key result.key}
      <div class="result" class:win={result.record.win} role="status">
        <span class="verdict">{result.record.win ? 'Victory' : 'Defeat'} <span class="score num">{result.record.score}</span></span>
        <span class="prize num">+{money(shown)}</span>
        <span class="extra">
          {#if result.firstWin}<b class="bonus">incl. ${FIRST_WIN_BONUS} first-win bonus</b>{/if}
          {#if result.record.fans >= 1}<span>+{fmt(result.record.fans)} fans</span>{/if}
          <span class="dim">vs {result.record.opponent}</span>
        </span>
        {#if result.record.win}
          <span class="coins" aria-hidden="true">
            {#each COINS as c, i (i)}
              <i style="--dx:{c.dx}px; --dy:{c.dy}px; --d:{c.delay}s; --spin:{c.spin}"></i>
            {/each}
          </span>
        {/if}
      </div>
    {/key}
  {/if}
</div>

<style>
  .versus {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--gc) 30%, var(--line));
    background:
      linear-gradient(90deg, color-mix(in srgb, var(--accent) 12%, transparent), transparent 35%, transparent 65%, color-mix(in srgb, var(--gc) 14%, transparent)),
      rgba(0, 0, 0, 0.28);
  }
  .side {
    display: flex;
    align-items: center;
    gap: 9px;
    min-width: 0;
  }
  .them {
    justify-content: flex-end;
    text-align: right;
  }
  .crest {
    flex: none;
    display: grid;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.55));
  }
  .them-crest {
    width: 46px;
    height: 46px;
  }
  .them-crest :global(svg) {
    width: 100%;
    height: 100%;
  }
  .us .crest {
    --lean: 3px;
    animation: lean-in 2.4s ease-in-out infinite;
  }
  .them .crest {
    --lean: -3px;
    animation: lean-in 2.4s ease-in-out infinite;
  }
  .idle .crest {
    animation: none;
  }
  .nm {
    display: flex;
    flex-direction: column;
    min-width: 0;
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 16px;
    line-height: 1.15;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .nt {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .grudge {
    font-family: var(--font-display);
    font-size: 10.5px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--red);
  }
  .mid {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    width: 120px;
  }
  .vs {
    font-family: var(--font-display);
    font-weight: 900;
    font-style: italic;
    font-size: 20px;
    line-height: 1;
    letter-spacing: 0.04em;
    color: #fff;
    text-shadow:
      0 0 10px color-mix(in srgb, var(--gc) 80%, transparent),
      2px 2px 0 color-mix(in srgb, var(--gc) 55%, #000);
  }
  .versus:not(.idle) .vs {
    animation: vs-beat 1.2s ease-in-out infinite;
  }
  .track {
    position: relative;
    display: block;
    width: 100%;
    height: 6px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.45);
    overflow: hidden;
  }
  .track i {
    position: absolute;
    inset: 0 auto 0 0;
    border-radius: inherit;
    background: linear-gradient(90deg, color-mix(in srgb, var(--gc) 55%, #fff), var(--gc));
  }
  .when {
    font-size: 10.5px;
    color: var(--muted);
  }

  /* The result card slides over the fixture and fades away. */
  .result {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px 14px;
    flex-wrap: wrap;
    padding: 4px 10px;
    background: linear-gradient(90deg, rgba(10, 10, 14, 0.94), rgba(28, 12, 16, 0.94), rgba(10, 10, 14, 0.94));
    animation: result-in 2.6s ease-out forwards;
  }
  .result.win {
    background:
      radial-gradient(60% 140% at 50% 50%, color-mix(in srgb, var(--gold) 26%, transparent), transparent 70%),
      linear-gradient(90deg, rgba(10, 10, 14, 0.94), rgba(26, 22, 8, 0.95), rgba(10, 10, 14, 0.94));
  }
  .verdict {
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 15px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--red);
  }
  .win .verdict {
    color: var(--gold);
    text-shadow: 0 0 12px color-mix(in srgb, var(--gold) 60%, transparent);
  }
  .score {
    margin-left: 4px;
    font-family: var(--font-ui);
    font-size: 13px;
    letter-spacing: 0.04em;
    color: var(--muted);
  }
  .prize {
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 22px;
    color: var(--muted);
  }
  .win .prize {
    color: #fff;
    text-shadow:
      0 0 14px color-mix(in srgb, var(--gold) 70%, transparent),
      0 2px 0 color-mix(in srgb, var(--gold) 45%, #000);
    animation: prize-pop 0.5s cubic-bezier(0.2, 1.6, 0.4, 1) both;
  }
  .extra {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 10px;
    font-size: 12px;
    color: var(--text);
  }
  .bonus {
    color: var(--gold);
  }
  .coins {
    position: absolute;
    left: 50%;
    top: 55%;
    width: 0;
    height: 0;
    pointer-events: none;
  }
  .coins i {
    position: absolute;
    left: -6px;
    top: -6px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #fff3c4, var(--gold) 50%, #a3740e);
    box-shadow: inset 0 0 0 1.5px rgba(120, 80, 0, 0.55);
    opacity: 0;
    animation: coin 1.1s cubic-bezier(0.15, 0.7, 0.4, 1) var(--d) forwards;
  }
  @keyframes coin {
    0% {
      opacity: 0;
      transform: translate(0, 0) scale(0.4) rotateY(0deg);
    }
    15% {
      opacity: 1;
    }
    60% {
      opacity: 1;
      transform: translate(var(--dx), var(--dy)) scale(1) rotateY(calc(var(--spin) * 360deg));
    }
    100% {
      opacity: 0;
      transform: translate(calc(var(--dx) * 1.2), calc(var(--dy) + 40px)) scale(0.8) rotateY(calc(var(--spin) * 540deg));
    }
  }
  @keyframes result-in {
    0% {
      opacity: 0;
      transform: scale(1.06);
    }
    8%,
    82% {
      opacity: 1;
      transform: none;
    }
    100% {
      opacity: 0;
    }
  }
  @keyframes prize-pop {
    from {
      transform: scale(0.4);
    }
    to {
      transform: none;
    }
  }
  @keyframes vs-beat {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.08);
    }
  }
  @keyframes lean-in {
    0%,
    100% {
      transform: translateX(0);
    }
    50% {
      transform: translateX(var(--lean));
    }
  }
  @media (max-width: 520px) {
    .versus {
      gap: 6px;
      padding: 6px 8px;
    }
    .nm {
      font-size: 14px;
    }
    /* Names wrap onto more lines rather than vanishing behind the match bar. */
    .nt {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      line-clamp: 3;
      white-space: normal;
      overflow-wrap: anywhere;
    }
    .them-crest {
      width: 38px;
      height: 38px;
    }
    .us .crest :global(svg) {
      width: 38px;
      height: 38px;
    }
    .mid {
      width: 76px;
    }
    .vs {
      font-size: 16px;
    }
    .prize {
      font-size: 18px;
    }
  }
</style>
