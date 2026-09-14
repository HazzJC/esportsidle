<script lang="ts">
  import { OPERATIONS } from '../../data/operations';
  import { fmt, fmtPct, money } from '../../engine/format';
  import Icon from '../components/Icon.svelte';
  import { game } from '../game.svelte';
  import { laneHue } from '../theme';
  import { tooltip } from '../tooltip.svelte';

  const MAX_UNITS = 40;

  const v = $derived(game.view);
  const s = $derived(v.s);
  const r = $derived(v.r);
  const owned = $derived(OPERATIONS.filter((op) => s.ops[op.id].owned > 0));
</script>

<div class="hq">
  <div class="cards">
    <div class="card">
      <span class="label">Income</span>
      <span class="value num cyan-text">{money(r.cps, 1)}/s</span>
    </div>
    <div class="card" use:tooltip={() => ({ title: 'Fame multiplier', icon: 'heart', iconColor: 'var(--magenta)', lines: ['Every fan makes your whole org a little more valuable.'] })}>
      <span class="label">Fame</span>
      <span class="value num">×{r.fameMult.toFixed(2)}</span>
    </div>
    <div class="card" use:tooltip={() => ({ title: 'Upgrade multiplier', icon: 'sparkles', lines: ['Combined bonus from snacks and other global upgrades.'] })}>
      <span class="label">Upgrades</span>
      <span class="value num">{fmtPct(v.m.globalMult - 1, true)}</span>
    </div>
    <div class="card" use:tooltip={() => ({ title: 'Trophy Cabinet', icon: 'trophy', iconColor: 'var(--gold)', lines: ['Each achievement adds 4% to your cabinet. Superfan upgrades turn it into income.'] })}>
      <span class="label">Cabinet</span>
      <span class="value num gold-text">{fmtPct(r.cabinet)}</span>
    </div>
  </div>

  {#if owned.length === 0}
    <div class="empty">
      <Icon name="gamepad-2" size={46} />
      <h3>It's just you and a dream</h3>
      <p class="muted">
        Click your logo to earn your first cash, then recruit a <b>Ranked Grinder</b> from the store. Every operation you buy
        shows up here.
      </p>
    </div>
  {:else}
    <div class="lanes">
      {#each owned as op (op.id)}
        {@const st = s.ops[op.id]}
        <div
          class="lane"
          style="--h:{laneHue(op.index)}"
          use:tooltip={() => ({
            title: op.plural,
            icon: op.icon,
            iconColor: `hsl(${laneHue(op.index)} 90% 65%)`,
            lines: [
              { text: op.desc, tone: 'muted' },
              `${fmt(game.view.s.ops[op.id].owned)} producing ${money(game.view.r.opCps[op.id], 1)}/s`,
            ],
          })}
        >
          <div class="lane-head">
            <Icon name={op.icon} size={15} />
            <span class="lane-name">{op.plural}</span>
            <span class="lane-count num">{fmt(st.owned)}</span>
            <span class="lane-cps num">{money(r.opCps[op.id], 1)}/s</span>
          </div>
          <div class="units">
            {#each { length: Math.min(st.owned, MAX_UNITS) } as _, i (i)}
              <span class="unit" style="--i:{i}"><Icon name={op.icon} size={17} /></span>
            {/each}
            {#if st.owned > MAX_UNITS}
              <span class="more num">+{fmt(st.owned - MAX_UNITS)}</span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .hq {
    display: flex;
    flex-direction: column;
    gap: 12px;
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
    border: 1px solid hsl(var(--h) 60% 50% / 0.3);
    background:
      repeating-linear-gradient(90deg, hsl(var(--h) 60% 50% / 0.05) 0 1px, transparent 1px 28px),
      linear-gradient(90deg, hsl(var(--h) 80% 50% / 0.14), hsl(var(--h) 80% 50% / 0.03));
  }
  .lane-head {
    display: flex;
    align-items: center;
    gap: 6px;
    color: hsl(var(--h) 90% 72%);
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 14px;
  }
  .lane-name {
    color: var(--text);
  }
  .lane-count {
    color: hsl(var(--h) 90% 72%);
  }
  .lane-cps {
    margin-left: auto;
    color: var(--muted);
    font-size: 12px;
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
    color: hsl(var(--h) 90% 70%);
    filter: drop-shadow(0 0 3px hsl(var(--h) 90% 60% / 0.6));
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
</style>
