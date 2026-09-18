<script lang="ts">
  import type { RosterPreview } from '../../engine/roster';
  import Icon from './Icon.svelte';

  let { preview, compact = false }: { preview: RosterPreview; compact?: boolean } = $props();

  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const target = $derived(preview.placement === 'bench' && preview.couldStart ? preview.couldStart.after : preview.after);
  const winDelta = $derived(Math.round((target.win - preview.before.win) * 100));
  const ratingDelta = $derived(preview.before.rating > 0 ? target.rating / preview.before.rating - 1 : 0);
  /** Chemistry is worth up to +20% rating, so a drop is shown in rating terms. */
  const chemDelta = $derived(Math.round((preview.after.chemistry - preview.before.chemistry) * 20));
  const tone = $derived(winDelta > 0 ? 'good' : winDelta < 0 ? 'bad' : 'flat');
</script>

<div class="impact" class:compact>
  {#if preview.placement === 'noTeam'}
    <span class="muted"><Icon name="lock" size={12} /> Found this team first</span>
  {:else if preview.placement === 'full'}
    <span class="muted"><Icon name="users" size={12} /> Roster full</span>
  {:else}
    <div class="headline">
      {#if preview.placement === 'bench'}
        <span class="where">
          {preview.couldStart ? `Bench · better at ${preview.couldStart.role}` : 'Joins the bench'}
        </span>
      {:else if preview.role}
        <span class="where">{preview.role}</span>
      {/if}
      <span class="win num">Win {pct(preview.before.win)} → {pct(target.win)}</span>
      <span class="delta num {tone}">{winDelta > 0 ? '+' : ''}{winDelta}</span>
    </div>
    {#if !compact}
      <div class="chips">
        {#if preview.placement === 'lineup' && preview.role}
          <span class="chip" class:bad={!preview.onRole}>{preview.onRole ? 'On-role' : 'Off-role · plays at 85%'}</span>
        {/if}
        {#if Math.abs(ratingDelta) >= 0.005}
          <span class="chip" class:good={ratingDelta > 0} class:bad={ratingDelta < 0}>Rating {ratingDelta > 0 ? '+' : ''}{Math.round(ratingDelta * 100)}%</span>
        {/if}
        {#if chemDelta < 0}
          <span class="chip bad" title="New lineups take time to gel; chemistry rebuilds as they play together">Chemistry {chemDelta}%</span>
        {/if}
        {#if preview.displaced}
          <span class="chip muted">{preview.displacedTo === 'swap' ? `Swaps with ${preview.displaced}` : `${preview.displaced} to the bench`}</span>
        {/if}
      </div>
    {/if}
  {/if}
</div>

<style>
  .impact {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
  }
  .headline {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }
  .where {
    font-family: var(--font-ui);
    font-weight: 700;
    color: var(--muted);
  }
  .win {
    font-weight: 600;
  }
  .delta {
    padding: 0 6px;
    border-radius: 999px;
    font-family: var(--font-ui);
    font-weight: 700;
    line-height: 17px;
  }
  .delta.good {
    color: var(--green);
    background: color-mix(in srgb, var(--green) 14%, transparent);
  }
  .delta.bad {
    color: var(--red);
    background: color-mix(in srgb, var(--red) 14%, transparent);
  }
  .delta.flat {
    color: var(--muted);
    background: var(--panel-3);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .chip {
    font-size: 11px;
    padding: 0 6px;
  }
  .chip.good {
    color: var(--green);
    border-color: color-mix(in srgb, var(--green) 40%, transparent);
  }
  .chip.bad {
    color: var(--red);
    border-color: color-mix(in srgb, var(--red) 40%, transparent);
  }
  .chip.muted {
    color: var(--muted);
  }
</style>
