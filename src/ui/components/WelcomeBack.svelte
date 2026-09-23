<script lang="ts">
  import { OPERATIONS } from '../../data/operations';
  import { fmt, fmtTime, money } from '../../engine/format';
  import { game } from '../game.svelte';
  import { opSpriteSvg } from '../opsArt';
  import { opColor } from '../theme';
  import Icon from './Icon.svelte';
  import Modal from './Modal.svelte';
  import OrgLogo from './OrgLogo.svelte';

  const report = $derived(game.offlineReport);
  const s = $derived(game.view.s);
  const close = () => (game.offlineReport = null);
  /** The biggest operations the org owns stood on the skyline, kept working overnight. */
  const skyline = $derived(
    OPERATIONS.filter((op) => s.ops[op.id].owned > 0)
      .slice(-5)
      .map((op) => opSpriteSvg(op.id, opColor(op.index))),
  );
  const capped = $derived(!!report && report.countedSeconds < report.awaySeconds);
</script>

{#if report}
  <Modal title="Welcome back" onclose={close} width={440}>
    <div class="scene" aria-hidden="true">
      <span class="moon"></span>
      <span class="stars"></span>
      <span class="logo"><OrgLogo name={s.org.name} primary={s.org.primary} secondary={s.org.secondary} size={62} shape={s.org.emblem.shape} mark={s.org.emblem.mark} /></span>
      <div class="row">
        {#each skyline as svg, i (i)}
          <!-- Built only from constants in opsArt.ts, so {@html} is safe. -->
          <span class="building" style="--i:{i}">{@html svg}</span>
        {/each}
      </div>
      <span class="away"><Icon name="moon" size={13} /> Away {fmtTime(report.awaySeconds)}</span>
    </div>
    <div class="grid">
      <div class="stat cash">
        <span class="badge"><Icon name="dollar-sign" size={18} /></span>
        <span class="label">Cash earned</span>
        <span class="value num">{money(report.earned)}</span>
      </div>
      <div class="stat fans">
        <span class="badge"><Icon name="heart" size={18} /></span>
        <span class="label">Fans gained</span>
        <span class="value num">{fmt(report.fans)}</span>
      </div>
    </div>
    <p class="muted small">
      {s.org.name} kept running at {Math.round(report.rate * 100)}% while you were gone{#if capped}, for the first {fmtTime(report.countedSeconds)} (the offline limit){/if}.
    </p>
    {#snippet footer()}
      <button class="btn primary" onclick={close}>Back to work</button>
    {/snippet}
  </Modal>
{/if}

<style>
  /* The HQ skyline at night, with the org's biggest operations lit up. */
  .scene {
    position: relative;
    height: 132px;
    margin: -4px 0 12px;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid var(--line-2);
    background:
      radial-gradient(120% 70% at 50% 120%, color-mix(in srgb, var(--accent) 30%, transparent), transparent 70%),
      linear-gradient(180deg, #0b0d24 0%, #1b1640 55%, #2a1b3f 100%);
  }
  .moon {
    position: absolute;
    right: 26px;
    top: 16px;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #fff8dc, #f2d27a 60%, #c9a24a);
    box-shadow: 0 0 22px rgba(255, 230, 160, 0.45);
  }
  .moon::after {
    content: '';
    position: absolute;
    left: 8px;
    top: 7px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: rgba(160, 120, 40, 0.35);
    box-shadow: 7px 6px 0 -1px rgba(160, 120, 40, 0.3);
  }
  .stars {
    position: absolute;
    inset: 0;
    background-image:
      radial-gradient(1px 1px at 12% 20%, #fff, transparent),
      radial-gradient(1px 1px at 30% 12%, #fff, transparent),
      radial-gradient(1.5px 1.5px at 48% 26%, #fff, transparent),
      radial-gradient(1px 1px at 64% 10%, #fff, transparent),
      radial-gradient(1px 1px at 76% 34%, #fff, transparent),
      radial-gradient(1.5px 1.5px at 88% 52%, #fff, transparent),
      radial-gradient(1px 1px at 22% 44%, #fff, transparent);
    opacity: 0.8;
  }
  .logo {
    position: absolute;
    left: 14px;
    top: 14px;
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.6));
  }
  .row {
    position: absolute;
    left: 90px;
    right: 12px;
    bottom: 10px;
    display: flex;
    justify-content: space-around;
    align-items: flex-end;
  }
  .row::before {
    content: '';
    position: absolute;
    left: -90px;
    right: -12px;
    bottom: -10px;
    height: 16px;
    background: linear-gradient(180deg, #151226, #0d0b18);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }
  .building {
    position: relative;
    width: 50px;
    height: 50px;
    filter: drop-shadow(0 3px 2px rgba(0, 0, 0, 0.6)) brightness(0.95);
    animation: glow 3s ease-in-out calc(var(--i) * 0.4s) infinite;
  }
  .building :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
  }
  @keyframes glow {
    50% {
      filter: drop-shadow(0 3px 2px rgba(0, 0, 0, 0.6)) brightness(1.15);
    }
  }
  .away {
    position: absolute;
    right: 10px;
    top: 50px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 9px;
    border-radius: 999px;
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 12px;
    color: #fff;
    background: rgba(0, 0, 0, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.15);
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .stat {
    --c: var(--gold);
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 10px 10px 10px 50px;
    border-radius: 10px;
    background: linear-gradient(135deg, color-mix(in srgb, var(--c) 14%, var(--bg-2)), var(--bg-2));
    border: 1px solid color-mix(in srgb, var(--c) 40%, var(--line));
  }
  .stat.fans {
    --c: var(--pink, #ff4d6d);
  }
  .badge {
    position: absolute;
    left: 10px;
    top: 50%;
    translate: 0 -50%;
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    color: #111;
    background: radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--c) 40%, #fff), var(--c) 60%, color-mix(in srgb, var(--c) 60%, #000));
    box-shadow: inset 0 -2px 0 rgba(0, 0, 0, 0.25);
  }
  .label {
    font-size: 12px;
    color: var(--muted);
  }
  .value {
    font-family: var(--font-display);
    font-size: 18px;
    color: var(--c);
    white-space: nowrap;
  }
  .small {
    font-size: 12.5px;
    margin: 12px 0 0;
  }
  @media (prefers-reduced-motion: reduce) {
    .building {
      animation: none;
    }
  }
</style>
