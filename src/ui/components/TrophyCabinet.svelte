<script lang="ts">
  import { fmt } from '../../engine/format';
  import type { TrophyEntry } from '../../engine/types';
  import { game } from '../game.svelte';
  import { tooltip } from '../tooltip.svelte';
  import { trophyTip } from '../trophyTip';
  import TrophyIcon from './TrophyIcon.svelte';

  /** Trophies drawn per shelf before collapsing into a count. */
  const SHELF_LIMIT = 48;

  const s = $derived(game.view.s);
  const currentRun = $derived(s.prestige.runs + 1);
  const shelves = $derived.by(() => {
    const byRun = new Map<number, TrophyEntry[]>();
    for (const t of s.trophyCase) byRun.set(t.run, [...(byRun.get(t.run) ?? []), t]);
    return [...byRun.entries()].sort((a, b) => b[0] - a[0]);
  });

  const tip = (t: TrophyEntry) => trophyTip(s, t);
</script>

<section class="cabinet">
  <h3
    class="section-title"
    use:tooltip={() => ({
      title: 'Trophy shelf',
      icon: 'trophy',
      iconColor: 'var(--gold)',
      lines: [
        `${fmt(s.trophyCase.length)} trophies won, across every run.`,
        { text: `${fmt(s.trophies)} are still unspent. Spending them on operation levels and trophy upgrades leaves the trophy itself on the shelf.`, tone: 'muted' },
      ],
    })}
  >
    Trophy shelf <span class="dim">{s.trophyCase.length}</span>
  </h3>
  {#if s.trophyCase.length === 0}
    <p class="muted small">Win a season title or a tournament to put your first trophy on the shelf. Trophies stay here when you sell the org.</p>
  {:else}
    {#each shelves as [run, trophies] (run)}
      <div class="shelf-label">{run === currentRun ? 'This run' : `Run ${run}`} · {trophies.length}</div>
      <div class="shelf">
        {#each trophies.slice(0, SHELF_LIMIT) as t (t.id)}
          <span class="trophy" use:tooltip={() => tip(t)}><TrophyIcon kind={t.kind} tier={t.tier} /></span>
        {/each}
        {#if trophies.length > SHELF_LIMIT}<span class="more dim">+{trophies.length - SHELF_LIMIT}</span>{/if}
      </div>
    {/each}
  {/if}
</section>

<style>
  .cabinet {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .small {
    margin: 0;
    font-size: 12.5px;
  }
  .shelf-label {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 12px;
    color: var(--muted);
  }
  .shelf {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 3px 4px;
    padding: 8px 10px 0;
    border-radius: 8px 8px 0 0;
    background: linear-gradient(180deg, transparent, color-mix(in srgb, var(--gold) 5%, transparent));
    border-bottom: 5px solid #3a3a40;
    box-shadow: 0 6px 10px -6px rgba(0, 0, 0, 0.6);
  }
  .trophy {
    display: block;
    transition: transform 0.12s;
  }
  .trophy:hover {
    transform: translateY(-3px);
  }
  .more {
    align-self: center;
    font-size: 12px;
    padding-bottom: 6px;
  }
</style>
