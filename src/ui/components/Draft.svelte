<script lang="ts">
  import { getGame } from '../../data/games';
  import { tierName } from '../../data/leagues';
  import { TRAIT_MAP } from '../../data/traits';
  import { draftOutlook } from '../../engine/draft';
  import { fmt, money } from '../../engine/format';
  import { game } from '../game.svelte';
  import { tooltip } from '../tooltip.svelte';
  import Icon from './Icon.svelte';
  import PlayerCard from './PlayerCard.svelte';

  /** How each of the three picks is pitched, cheapest first. */
  const PITCH = [
    { label: 'Quick start', icon: 'zap' },
    { label: 'Worth the wait', icon: 'clock' },
    { label: 'Big bet', icon: 'gem' },
  ];

  const v = $derived(game.view);
  const s = $derived(v.s);
  const picks = $derived(s.draft ?? []);
  const firstRun = $derived(s.prestige.runs === 0);
  const clickValue = $derived(Math.max(1e-9, v.r.click));
  const g = $derived(picks[0] ? getGame(picks[0].player.gameId) : undefined);
</script>

{#if picks.length > 0 && g}
  <section class="draft" class:tut-target={s.tutorial.step === 'draft'}>
    <header>
      <h2 class="section-title">Sign your first player</h2>
      <p class="muted small">
        {#if firstRun}
          Three prospects want to play {g.name} for {s.org.name}. Whoever you sign founds your first team. Sign the rookie now, or keep clicking for someone better.
        {:else}
          A new chapter, and your name opens doors. Three prospects want to play {g.name} for {s.org.name}; whoever you sign founds the team.
        {/if}
      </p>
    </header>
    <div class="picks">
      {#each picks as l, i (l.player.id)}
        {@const p = l.player}
        {@const outlook = draftOutlook(s, p, v.m)}
        {@const short = Math.max(0, l.price - s.cash)}
        {@const pitch = PITCH[i] ?? PITCH[0]}
        <article class="pick" class:ready={short === 0}>
          <span class="pitch"><Icon name={pitch.icon} size={12} /> {pitch.label}</span>
          <PlayerCard player={p} showCondition={false} />
          <div class="outlook">
            <span use:tooltip={() => ({ title: 'Win chance', lines: [`In the ${tierName(0)}, the bottom league, before any gear or staff.`] })}>
              <b class="num">{Math.round(outlook.win * 100)}%</b> to win
            </span>
            <span
              class="reach"
              use:tooltip={() => ({
                title: 'How far they can climb',
                lines: [
                  `Wins at least half their matches up to the ${tierName(outlook.reach)}, before any gear or staff.`,
                  { text: 'Higher leagues pay far more, and a winning season earns promotion.', tone: 'muted' },
                ],
              })}
            >
              up to <b>{tierName(outlook.reach)}</b>
            </span>
          </div>
          <div class="traits">
            {#each p.traits as id (id)}
              {@const t = TRAIT_MAP.get(id)}
              {#if t}
                <span class="trait {t.tone}" use:tooltip={() => ({ title: t.name, icon: t.icon, lines: [t.desc] })}><Icon name={t.icon} size={12} /> {t.name}</span>
              {/if}
            {/each}
          </div>
          <div class="foot">
            <span class="small {short === 0 ? 'good' : 'muted'}">
              {#if short === 0}
                Ready to sign
              {:else}
                {fmt(Math.ceil(short / clickValue))} more click{Math.ceil(short / clickValue) === 1 ? '' : 's'}
              {/if}
            </span>
            <button class="btn small" class:primary={short === 0} disabled={short > 0} onclick={() => game.signDraft(p.id)}>
              <Icon name="user-plus" size={13} /> Sign · {money(l.price)}
            </button>
          </div>
          <span class="bar" aria-hidden="true"><i style="width:{Math.min(100, (s.cash / l.price) * 100)}%"></i></span>
        </article>
      {/each}
    </div>
  </section>
{/if}

<style>
  .draft {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    border-radius: 12px;
    border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--line));
    background: linear-gradient(160deg, color-mix(in srgb, var(--accent) 8%, transparent), transparent 60%), var(--bg-2);
  }
  header .section-title {
    margin: 0;
  }
  .small {
    font-size: 12.5px;
    margin: 2px 0 0;
  }
  .picks {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 8px;
  }
  .pick {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 7px;
    padding: 8px 8px 10px;
    border-radius: 11px;
    border: 1px solid var(--line);
    background: rgba(0, 0, 0, 0.18);
    overflow: hidden;
  }
  .pick.ready {
    border-color: color-mix(in srgb, var(--green) 50%, transparent);
  }
  .pitch {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .outlook {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 12px;
    color: var(--muted);
  }
  .reach {
    text-align: right;
  }
  .outlook b {
    font-family: var(--font-ui);
    font-size: 15px;
    color: var(--text);
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
    margin-top: auto;
  }
  .foot .small {
    margin: 0;
  }
  .bar {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 3px;
    border-radius: 0;
  }
  .pick.ready .bar :global(i) {
    background: var(--green);
  }
</style>
