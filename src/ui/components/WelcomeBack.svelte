<script lang="ts">
  import { fmt, fmtTime, money } from '../../engine/format';
  import { game } from '../game.svelte';
  import Modal from './Modal.svelte';

  const report = $derived(game.offlineReport);
  const close = () => (game.offlineReport = null);
</script>

{#if report}
  <Modal title="Welcome back" onclose={close} width={420}>
    <p class="lead">You were away for <b>{fmtTime(report.awaySeconds)}</b>.</p>
    <div class="grid">
      <div class="stat">
        <span class="label">Cash earned</span>
        <span class="value num gold-text">{money(report.earned)}</span>
      </div>
      <div class="stat">
        <span class="label">Fans gained</span>
        <span class="value num cyan-text">{fmt(report.fans)}</span>
      </div>
    </div>
    <p class="muted small">
      Your operations kept running at {Math.round(report.rate * 100)}% efficiency
      {#if report.countedSeconds < report.awaySeconds}
        for the first {fmtTime(report.countedSeconds)} (offline limit reached)
      {/if}.
    </p>
    {#snippet footer()}
      <button class="btn primary" onclick={close}>Back to work</button>
    {/snippet}
  </Modal>
{/if}

<style>
  .lead {
    margin: 0 0 12px;
    font-size: 15px;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .stat {
    display: flex;
    flex-direction: column;
    padding: 10px;
    border-radius: 8px;
    background: var(--bg-2);
    border: 1px solid var(--line);
  }
  .label {
    font-size: 12px;
    color: var(--muted);
  }
  .value {
    font-family: var(--font-display);
    font-size: 20px;
  }
  .small {
    font-size: 12.5px;
    margin: 12px 0 0;
  }
</style>
