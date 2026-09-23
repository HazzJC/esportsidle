<script lang="ts">
  import { OPERATIONS } from '../../data/operations';
  import { activityEntries } from '../../engine/activity';
  import { PR_CLEANUP_SECONDS, SCANDAL_FAN_MULT, SCANDAL_INCOME_MULT, SCANDAL_SECONDS, dramaShare, prCleanupCost, scandalFanLoss } from '../../engine/drops';
  import { fmt, fmtPct, fmtTime, money } from '../../engine/format';
  import { operationLevelCost } from '../../engine/operations';
  import Agenda from '../components/Agenda.svelte';
  import Quests from '../components/Quests.svelte';
  import Stories from '../components/Stories.svelte';
  import Icon from '../components/Icon.svelte';
  import { game } from '../game.svelte';
  import { opColor } from '../theme';
  import { opSceneBackground, opSpriteSvg } from '../opsArt';
  import { tooltip } from '../tooltip.svelte';

  /** Sprites drawn per operation before the rest collapse into a count. */
  const MAX_UNITS = 32;
  /** Units per row: two rows, back and front, fill the strip left to right. */
  const PER_ROW = 16;

  /** Where the nth unit stands: rows alternate front and back, with a little jitter so it looks lived in. */
  function unitSpot(i: number) {
    const row = i % 2;
    const col = Math.floor(i / 2);
    const jitter = ((i * 0.618) % 1) - 0.5;
    return {
      x: 2 + (col / PER_ROW) * 95 + jitter * 1.6,
      y: row === 0 ? 1 : 17,
      back: row === 1,
      delay: ((i * 0.37) % 1.6).toFixed(2),
    };
  }

  const v = $derived(game.view);
  const s = $derived(v.s);
  const r = $derived(v.r);
  const owned = $derived(OPERATIONS.filter((op) => s.ops[op.id].owned > 0));
  // Built only from constants in opsArt.ts, so {@html} is safe.
  const art = $derived(
    Object.fromEntries(owned.map((op) => [op.id, { scene: opSceneBackground(op.id, opColor(op.index)), sprite: opSpriteSvg(op.id, opColor(op.index)) }])),
  );
  const modifiers = $derived(s.events.modifiers.filter((m) => m.endsAt > s.time));
  let activityMode = $state<'active' | 'all'>('active');
  const activityLog = $derived(activityEntries(s.events.log, s.time, activityMode).slice(0, 8));
  const showLevels = $derived(s.stats.trophiesTotal > 0);
  const drama = $derived(dramaShare(s, v.m));
  const calm = $derived(s.events.calmUntil > s.time);
  const prCost = $derived(prCleanupCost(r.cpsNoBuffs));
  const fansAtRisk = $derived(scandalFanLoss(s));
  const fansAway = $derived(s.events.fansHeld);

  function ago(time: number): string {
    const d = s.time - time;
    return d < 5 ? 'just now' : `${fmtTime(d)} ago`;
  }
</script>

<div class="hq">
  <Quests />
  {#if s.tutorial.step === 'done'}
    <Agenda />
    {#if Object.keys(s.teams).length > 0}<Stories />{/if}
  {/if}


  {#if modifiers.length > 0 || s.events.log.length > 0 || v.m.dramaLevel > 0}
    <section class="activity">
      <div class="activity-heading">
        <h3 class="section-title">Org activity</h3>
        <div class="activity-toggle" role="group" aria-label="Org activity view">
          <button class:chosen={activityMode === 'active'} aria-pressed={activityMode === 'active'} onclick={() => activityMode = 'active'}>Active</button>
          <button class:chosen={activityMode === 'all'} aria-pressed={activityMode === 'all'} onclick={() => activityMode = 'all'}>All</button>
        </div>
      </div>

      {#if v.m.dramaLevel > 0}
        <div class="drama" class:calm>
          <Icon name={calm ? 'shield' : 'flame'} size={18} />
          <span class="dtext">
            {#if calm}
              PR team on duty for {fmtTime(s.events.calmUntil - s.time)}. No Drama Drops.
              {#if fansAway > 0}<span class="dim">· {fmt(fansAway)} fans back in {fmtTime(Math.max(0, s.events.fansReturnAt - s.time))}</span>{/if}
            {:else}
              Drama level {v.m.dramaLevel}: {fmtPct(drama)} of Hype Drops are Drama Drops.
            {/if}
          </span>
          {#if !calm}
            <div class="dbuttons">
              <button
                class="btn small"
                disabled={s.cash < prCost}
                onclick={() => game.calmDrama()}
                use:tooltip={() => ({
                  title: 'PR cleanup',
                  icon: 'shield',
                  lines: [`Pay ${money(prCost)} to bury the story.`, { text: `No Drama Drops for ${fmtTime(PR_CLEANUP_SECONDS)}.`, tone: 'muted' }],
                })}
              >
                PR cleanup · {money(prCost)}
              </button>
              <button
                class="btn small"
                onclick={() => game.rideOutDrama()}
                use:tooltip={() => ({
                  title: 'Ride it out',
                  icon: 'flame',
                  lines: [
                    'Say nothing and let it burn out. Costs no cash.',
                    { text: `${fmt(fansAtRisk)} fans walk out and come back in ${fmtTime(SCANDAL_SECONDS)}.`, tone: 'bad' },
                    { text: `Income ×${SCANDAL_INCOME_MULT} and new fans ×${SCANDAL_FAN_MULT} while it lasts.`, tone: 'bad' },
                    { text: `No Drama Drops for ${fmtTime(PR_CLEANUP_SECONDS)}, same as paying.`, tone: 'muted' },
                  ],
                })}
              >
                Ride it out · {fmt(fansAtRisk)} fans
              </button>
            </div>
          {/if}
        </div>
      {/if}

      {#if modifiers.length > 0}
        <div class="mods">
          {#each modifiers as m (m.id)}
            <div class="mod {m.tone}">
              <Icon name={m.icon} size={15} />
              <span class="mname">{m.name}</span>
              <span class="mdesc muted">{m.desc}</span>
              <span class="mtime num dim">{fmtTime(m.endsAt - s.time)}</span>
            </div>
          {/each}
        </div>
      {/if}

      {#if activityLog.length > 0}
        <ul class="log">
          {#each activityLog as entry, i (`${entry.time}-${i}`)}
            <li class={entry.tone}>
              <Icon name={entry.icon} size={14} />
              <span class="ltitle">{entry.title}</span>
              <span class="lbody muted">{entry.body}</span>
              <span class="ltime dim">{ago(entry.time)}</span>
            </li>
          {/each}
        </ul>
      {:else if activityMode === 'active' && modifiers.length === 0}
        <p class="activity-empty muted">Nothing active right now. Switch to All for past events.</p>
      {/if}
    </section>
  {/if}

  {#if owned.length === 0}
    <div class="empty">
      <Icon name="gamepad-2" size={46} />
      <h3>It's just you and a dream</h3>
      <p class="muted">
        Operations earn money every second, even while the game is closed. Start with a <b>Ranked Grinder</b> from the store;
        every operation you own shows up here.
      </p>
    </div>
  {:else}
    <section>
      <h3 class="section-title">Operations</h3>
      <div class="lanes">
        {#each owned as op (op.id)}
          {@const st = s.ops[op.id]}
          {@const cost = operationLevelCost(st.level)}
          <div
            class="lane"
            style="--c:{opColor(op.index)}"
            use:tooltip={() => ({
              title: op.plural,
              icon: op.icon,
              iconColor: opColor(op.index),
              lines: [
                { text: op.desc, tone: 'muted' },
                `${fmt(game.view.s.ops[op.id].owned)} producing ${money(game.view.r.opCps[op.id], 1)}/s`,
                ...(game.view.s.ops[op.id].level > 0 ? [{ text: `Level ${game.view.s.ops[op.id].level}: +${game.view.s.ops[op.id].level}% production`, tone: 'gold' as const }] : []),
              ],
            })}
          >
            <div class="lane-head">
              <Icon name={op.icon} size={15} />
              <span class="lane-name">{op.plural}</span>
              <span class="lane-count num">{fmt(st.owned)}</span>
              <span class="lane-cps num">{money(r.opCps[op.id], 1)}/s</span>
              {#if showLevels}
                <button
                  class="lvl"
                  disabled={s.trophies < cost}
                  onclick={(e) => {
                    e.stopPropagation();
                    game.levelUpOperation(op.id);
                  }}
                  title="Spend {cost} {cost === 1 ? 'trophy' : 'trophies'} for +1% production"
                >
                  Lv {st.level} <Icon name="arrow-up" size={11} /> <Icon name="trophy" size={11} /> {cost}
                </button>
              {/if}
            </div>
            <div class="scene">
              <span class="backdrop" style="background-image:{art[op.id]?.scene}"></span>
              {#each { length: Math.min(st.owned, MAX_UNITS) } as _, i (i)}
                {@const spot = unitSpot(i)}
                <span class="sprite" class:back={spot.back} class:bob={i % 3 === 0} style="left:{spot.x}%; bottom:{spot.y}px; --d:{spot.delay}s; z-index:{spot.back ? 1 : 2}">{@html art[op.id]?.sprite}</span>
              {/each}
              {#if st.owned > MAX_UNITS}
                <span class="more num">+{fmt(st.owned - MAX_UNITS)}</span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}
</div>

<style>
  .hq {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 8px;
  }
  .card {
    display: flex;
    flex-direction: column;
    padding: 8px 10px;
    border-radius: 8px;
    background: var(--bg-2);
    border: 1px solid var(--line);
  }
  .label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--muted);
  }
  .value {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 16px;
  }
  .activity {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .activity .section-title {
    margin: 0;
  }
  .activity-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .activity-toggle {
    display: flex;
    padding: 2px;
    border: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
    border-radius: 8px;
    background: var(--panel);
  }
  .activity-toggle button {
    padding: 4px 10px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
  }
  .activity-toggle button.chosen {
    color: var(--text);
    background: var(--panel-3);
  }
  .activity-empty {
    margin: 4px 0 0;
    font-size: 12px;
  }
  .dbuttons {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .drama {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 9px;
    color: var(--red);
    border: 1px solid color-mix(in srgb, var(--red) 40%, transparent);
    background: color-mix(in srgb, var(--red) 8%, transparent);
  }
  .drama.calm {
    color: var(--green);
    border-color: color-mix(in srgb, var(--green) 40%, transparent);
    background: color-mix(in srgb, var(--green) 7%, transparent);
  }
  .dtext {
    flex: 1;
    font-size: 13px;
    color: var(--text);
  }
  .mods {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .mod {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 10px;
    border-radius: 8px;
    font-size: 13px;
    border: 1px solid color-mix(in srgb, var(--green) 35%, transparent);
    background: color-mix(in srgb, var(--green) 6%, transparent);
    color: var(--green);
  }
  .mod.bad {
    border-color: color-mix(in srgb, var(--red) 35%, transparent);
    background: color-mix(in srgb, var(--red) 6%, transparent);
    color: var(--red);
  }
  .mname {
    font-family: var(--font-ui);
    font-weight: 700;
    color: var(--text);
  }
  .mdesc {
    flex: 1;
    min-width: 0;
  }
  .log {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .log li {
    display: grid;
    grid-template-columns: 16px auto 1fr auto;
    align-items: center;
    gap: 8px;
    padding: 4px 6px;
    border-radius: 6px;
    font-size: 12.5px;
    color: var(--accent);
  }
  .log li:nth-child(odd) {
    background: rgba(255, 255, 255, 0.025);
  }
  .log li.good {
    color: var(--green);
  }
  .log li.bad {
    color: var(--red);
  }
  .log li.gold {
    color: var(--gold);
  }
  .ltitle {
    font-family: var(--font-ui);
    font-weight: 700;
    color: var(--text);
    white-space: nowrap;
  }
  .lbody {
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ltime {
    font-size: 11px;
    white-space: nowrap;
  }
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 6px;
    padding: 40px 20px;
    color: var(--dim);
  }
  .empty h3 {
    margin: 6px 0 0;
    color: var(--text);
    font-family: var(--font-ui);
    font-size: 20px;
  }
  .empty p {
    max-width: 380px;
    margin: 0;
  }
  .lanes {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .lane {
    /* Lanes scrolled out of view skip rendering entirely. */
    content-visibility: auto;
    contain-intrinsic-size: auto 118px;
    border-radius: 9px;
    padding: 6px 10px 8px;
    border: 1px solid color-mix(in srgb, var(--c) 30%, transparent);
    background:
      repeating-linear-gradient(90deg, color-mix(in srgb, var(--c) 5%, transparent) 0 1px, transparent 1px 28px),
      linear-gradient(90deg, color-mix(in srgb, var(--c) 13%, transparent), color-mix(in srgb, var(--c) 3%, transparent));
  }
  .lane-head {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--c);
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 14px;
  }
  .lane-name {
    color: var(--text);
  }
  .lane-cps {
    margin-left: auto;
    color: var(--muted);
    font-size: 12px;
  }
  .lvl {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 1px 7px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--gold) 50%, transparent);
    background: color-mix(in srgb, var(--gold) 10%, transparent);
    color: var(--gold);
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 11.5px;
  }
  .lvl:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .lvl:hover:not(:disabled) {
    border-color: var(--gold);
  }
  /* A strip of scenery per operation, with a sprite for every unit owned: Cookie Clicker's buildings. */
  .scene {
    position: relative;
    height: 72px;
    margin-top: 6px;
    border-radius: 7px;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--c) 25%, transparent);
  }
  .backdrop {
    position: absolute;
    inset: 0;
    background-repeat: repeat-x;
    background-size: auto 100%;
    background-position: left bottom;
  }
  .sprite {
    position: absolute;
    width: 40px;
    height: 40px;
    margin-left: -20px;
    filter: drop-shadow(0 2px 1px rgba(0, 0, 0, 0.55));
    animation: pop-in 0.25s ease-out both;
  }
  /* Only every third unit bobs: hundreds of animated, shadowed sprites were most of a frame late in a run. */
  .sprite.bob {
    animation:
      pop-in 0.25s ease-out both,
      idle 2.4s ease-in-out var(--d) infinite;
  }
  .sprite.back {
    width: 31px;
    height: 31px;
    margin-left: -15px;
    opacity: 0.8;
    filter: brightness(0.8) drop-shadow(0 1px 1px rgba(0, 0, 0, 0.5));
  }
  .sprite :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
  }
  @keyframes idle {
    0%,
    100% {
      translate: 0 0;
    }
    50% {
      translate: 0 -2px;
    }
  }
  .more {
    position: absolute;
    right: 6px;
    top: 4px;
    z-index: 3;
    padding: 0 6px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.55);
    font-size: 11px;
    color: var(--text);
  }
  @keyframes pop-in {
    from {
      transform: scale(0.2);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
  @media (max-width: 600px) {
    .log li {
      grid-template-columns: 16px 1fr auto;
    }
    .lbody {
      display: none;
    }
  }
</style>
