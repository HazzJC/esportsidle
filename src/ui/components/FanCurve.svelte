<script lang="ts">
  import { FAN_STAGES } from '../../data/fanStages';
  import { FAN_VALUE_FLOOR, fanStage, fanValue } from '../../engine/economy';
  import { fmt } from '../../engine/format';
  import { tooltip } from '../tooltip.svelte';

  /**
   * Where the org is on the road from the lobby to the team everyone knows, and what one more fan is
   * worth there. The line is the value of a fan (1 down to 0.01, never zero) across the twelve stages;
   * the dot is the org. Hover a stage to see where it starts.
   */
  let { fans }: { fans: number } = $props();

  const info = $derived(fanStage(fans));
  const W = 360;
  const H = 70;
  const PAD = 10;
  // Stage i sits at x = i; the curve is the value at the start of each stage, joined up. Height is
  // log10(value) so the fall from 1 to 0.01 reads as a slope, not a cliff and a flat line.
  const yOf = (value: number) => PAD + ((0 - Math.log10(Math.max(value, FAN_VALUE_FLOOR))) / 2) * (H - 2 * PAD);
  const xOf = (stagePos: number) => PAD + (stagePos / (FAN_STAGES.length - 1)) * (W - 2 * PAD);
  const points = FAN_STAGES.map((st, i) => `${xOf(i).toFixed(1)},${yOf(fanValue(st.from)).toFixed(1)}`).join(' ');
  const here = $derived.by(() => {
    const pos = info.index + (info.next ? info.progress : 0);
    return { x: xOf(pos), y: yOf(info.value) };
  });
  const valueText = $derived(info.value >= 0.995 ? 'a full fan' : `${info.value.toFixed(info.value < 0.1 ? 3 : 2)}× a first fan`);
</script>

<div class="fan-curve">
  <div class="top">
    <div>
      <div class="stage">{info.stage.name}</div>
      <div class="blurb muted small">{info.stage.blurb}</div>
    </div>
    <div class="value" use:tooltip={() => ({ title: 'What a fan is worth', lines: ['The first fans each add a full fan to your fame. As the team gets better known, each new fan adds less, because the people left to find already half-know you.', `Never less than ${FAN_VALUE_FLOOR}× of a first fan: a bigger fanbase always still pays.`] })}>
      <b class="num">{info.value >= 0.995 ? '1.00' : info.value.toFixed(info.value < 0.1 ? 3 : 2)}×</b>
      <span class="dim small">per new fan</span>
    </div>
  </div>

  <svg viewBox="0 0 {W} {H}" role="img" aria-label="Value of a new fan across the fan stages. Now: {info.stage.name}, {valueText}.">
    <line class="grid" x1={PAD} x2={W - PAD} y1={yOf(1)} y2={yOf(1)} />
    <line class="grid" x1={PAD} x2={W - PAD} y1={yOf(0.1)} y2={yOf(0.1)} />
    <line class="grid" x1={PAD} x2={W - PAD} y1={yOf(0.01)} y2={yOf(0.01)} />
    <text class="axis" x={W - PAD} y={yOf(1) - 3} text-anchor="end">1×</text>
    <text class="axis" x={W - PAD} y={yOf(0.1) - 3} text-anchor="end">0.1×</text>
    <text class="axis" x={W - PAD} y={yOf(0.01) - 3} text-anchor="end">0.01×</text>
    <polyline class="curve" {points} />
    {#each FAN_STAGES as st, i (st.id)}
      <circle class="stop" class:passed={i <= info.index} cx={xOf(i)} cy={yOf(fanValue(st.from))} r="2.6" />
    {/each}
    <circle class="you" cx={here.x} cy={here.y} r="5" />
  </svg>

  <ol class="stages">
    {#each FAN_STAGES as st, i (st.id)}
      <li
        class:passed={i < info.index}
        class:current={i === info.index}
        use:tooltip={() => ({ title: st.name, subtitle: i === 0 ? 'Where every org starts' : `From ${fmt(st.from)} fans`, lines: [st.blurb, `A new fan is worth ${fanValue(st.from) >= 0.995 ? 'a full fan' : `${fanValue(st.from).toFixed(3)}× a first fan`} here.`] })}
      >
        <i style="--fill:{i < info.index ? 1 : i === info.index ? info.progress : 0}"></i>
      </li>
    {/each}
  </ol>
  {#if info.next}
    <div class="next dim small">Next: <b>{info.next.name}</b> at {fmt(info.next.from)} fans</div>
  {:else}
    <div class="next dim small">There is no next stage. Every fan still counts.</div>
  {/if}
</div>

<style>
  .fan-curve {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .top {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
  }
  .stage {
    font-family: var(--font-display);
    font-size: 1.05rem;
    color: var(--accent-2);
  }
  .blurb {
    max-width: 46ch;
  }
  .value {
    text-align: right;
    white-space: nowrap;
  }
  .value b {
    display: block;
    font-size: 1.3rem;
    color: var(--gold);
  }
  svg {
    width: 100%;
    height: auto;
    display: block;
  }
  .grid {
    stroke: var(--line);
    stroke-dasharray: 3 4;
  }
  .axis {
    fill: var(--dim);
    font-size: 8px;
  }
  .curve {
    fill: none;
    stroke: var(--accent-2);
    stroke-width: 2;
    stroke-linejoin: round;
    opacity: 0.8;
  }
  .stop {
    fill: var(--panel-3);
    stroke: var(--line-2);
  }
  .stop.passed {
    fill: var(--accent-2);
    stroke: var(--accent-2);
  }
  .you {
    fill: var(--gold);
    stroke: var(--bg);
    stroke-width: 2;
  }
  .stages {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 3px;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .stages li {
    height: 8px;
    border-radius: 3px;
    background: var(--panel-3);
    overflow: hidden;
    cursor: help;
  }
  .stages li i {
    display: block;
    height: 100%;
    width: calc(var(--fill) * 100%);
    background: var(--accent-2);
  }
  .stages li.current {
    outline: 1px solid var(--gold);
  }
  .next b {
    color: var(--text);
  }
</style>
