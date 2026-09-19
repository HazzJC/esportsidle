<script lang="ts">
  import { OPERATIONS } from '../../data/operations';
  import { PR_CLEANUP_SECONDS, dramaShare, prCleanupCost } from '../../engine/drops';
  import { fmt, fmtPct, fmtTime, money } from '../../engine/format';
  import { operationLevelCost } from '../../engine/operations';
  import Agenda from '../components/Agenda.svelte';
  import FirstPlayer from '../components/FirstPlayer.svelte';
  import Quests from '../components/Quests.svelte';
  import Stories from '../components/Stories.svelte';
  import Icon from '../components/Icon.svelte';
  import { game } from '../game.svelte';
  import { opColor } from '../theme';
  import { tooltip } from '../tooltip.svelte';

  const MAX_UNITS = 40;

  const v = $derived(game.view);
  const s = $derived(v.s);
  const r = $derived(v.r);
  const owned = $derived(OPERATIONS.filter((op) => s.ops[op.id].owned > 0));
  const modifiers = $derived(s.events.modifiers.filter((m) => m.endsAt > s.time));
  const showLevels = $derived(s.stats.trophiesTotal > 0);
  const drama = $derived(dramaShare(s, v.m));
  const calm = $derived(s.events.calmUntil > s.time);
  const prCost = $derived(prCleanupCost(r.cpsNoBuffs));

  function ago(time: number): string {
    const d = s.time - time;
    return d < 5 ? 'just now' : `${fmtTime(d)} ago`;
  }
</script>

<div class="hq">
  <FirstPlayer />
  <Quests />
  {#if s.tutorial.step === 'done'}
    <Agenda />
    {#if Object.keys(s.teams).length > 0}<Stories />{/if}
  {/if}

  <div class="cards">
    <div class="card">
      <span class="label">Income</span>
      <span class="value num accent-text">{money(r.totalCps, 1)}/s</span>
    </div>
    <div class="card" use:tooltip={() => ({ title: 'Fame multiplier', icon: 'heart', iconColor: 'var(--accent-2)', lines: ['Every fan makes your whole org a little more valuable.'] })}>
      <span class="label">Fame</span>
      <span class="value num">×{r.fameMult.toFixed(2)}</span>
    </div>
    <div class="card" use:tooltip={() => ({ title: 'Trophies', icon: 'trophy', iconColor: 'var(--gold)', lines: ['Won from season titles and tournaments.', 'Spend them on operation levels below and on trophy upgrades.'] })}>
      <span class="label">Trophies</span>
      <span class="value num gold-text">{fmt(s.trophies)}</span>
    </div>
    <div class="card" use:tooltip={() => ({ title: 'Trophy Cabinet', icon: 'trophy', iconColor: 'var(--gold)', lines: ['Each achievement adds 4% to your cabinet. Superfan upgrades turn it into income.'] })}>
      <span class="label">Cabinet</span>
      <span class="value num gold-text">{fmtPct(r.cabinet)}</span>
    </div>
  </div>

  {#if modifiers.length > 0 || s.events.log.length > 0 || v.m.dramaLevel > 0}
    <section class="activity">
      <h3 class="section-title">Org activity</h3>

      {#if v.m.dramaLevel > 0}
        <div class="drama" class:calm>
          <Icon name={calm ? 'shield' : 'flame'} size={18} />
          <span class="dtext">
            {#if calm}
              PR team on duty for {fmtTime(s.events.calmUntil - s.time)}. No Drama Drops.
            {:else}
              Drama level {v.m.dramaLevel}: {fmtPct(drama)} of Hype Drops are Drama Drops.
            {/if}
          </span>
          {#if !calm}
            <button class="btn small" disabled={s.cash < prCost} onclick={() => game.calmDrama()}>
              PR cleanup · {money(prCost)}
            </button>
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

      {#if s.events.log.length > 0}
        <ul class="log">
          {#each s.events.log.slice(0, 8) as entry, i (`${entry.time}-${i}`)}
            <li class={entry.tone}>
              <Icon name={entry.icon} size={14} />
              <span class="ltitle">{entry.title}</span>
              <span class="lbody muted">{entry.body}</span>
              <span class="ltime dim">{ago(entry.time)}</span>
            </li>
          {/each}
        </ul>
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
            <div class="units">
              {#each { length: Math.min(st.owned, MAX_UNITS) } as _, i (i)}
                <span class="unit"><Icon name={op.icon} size={17} /></span>
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
  .units {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 4px;
    margin-top: 4px;
    align-items: center;
  }
  .unit {
    display: grid;
    place-items: center;
    color: var(--c);
    filter: drop-shadow(0 0 3px color-mix(in srgb, var(--c) 60%, transparent));
    animation: pop-in 0.25s ease-out both;
  }
  .more {
    font-size: 12px;
    color: var(--muted);
    margin-left: 4px;
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
