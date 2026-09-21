<script lang="ts">
  import { GAME_MAP } from '../../data/games';
  import { tierName } from '../../data/leagues';
  import { OPERATIONS } from '../../data/operations';
  import { fmt, fmtPct, fmtTime, money } from '../../engine/format';
  import { INCOME_SOURCES, type IncomeSource } from '../../engine/types';
  import { game } from '../game.svelte';
  import Modal from './Modal.svelte';

  /**
   * Numbers for testing and balancing: where the money comes from right now, where it has come from
   * this run and across every run, the multipliers behind it and the counters behind achievements.
   * Opened from Options by tapping the version number seven times.
   */
  let { onclose }: { onclose: () => void } = $props();

  const v = $derived(game.view);

  const SOURCE_LABEL: Record<IncomeSource, string> = {
    ops: 'Operations',
    click: 'Clicks',
    match: 'Matches',
    merch: 'Merch',
    sponsor: 'Sponsor goals',
    quest: 'Quests',
    drop: 'Hype Drops',
    event: 'Events',
    tournament: 'Invitationals',
  };

  const live = $derived.by(() => {
    const r = v.r;
    const rows = [
      { label: 'Operations', value: r.cps },
      { label: 'Matches (expected)', value: r.matchCps },
      { label: 'Merch', value: r.merchCps },
    ];
    const total = rows.reduce((a, x) => a + x.value, 0);
    return { rows, total };
  });

  function ledger(book: Record<IncomeSource, number> | undefined) {
    const rows = INCOME_SOURCES.map((k) => ({ label: SOURCE_LABEL[k], value: book?.[k] ?? 0 })).sort((a, b) => b.value - a.value);
    const total = rows.reduce((a, x) => a + x.value, 0);
    return { rows, total };
  }
  const run = $derived(ledger(v.s.incomeRun));
  const all = $derived(ledger(v.s.incomeTotal));

  const topOps = $derived(
    OPERATIONS.map((op) => ({ name: op.name, owned: v.s.ops[op.id]?.owned ?? 0, cps: v.r.opCps[op.id] ?? 0 }))
      .filter((o) => o.owned > 0)
      .sort((a, b) => b.cps - a.cps)
      .slice(0, 8),
  );

  const multipliers = $derived([
    ['Global income', `×${fmt(v.r.globalMult, 2)}`],
    ['Fame', `×${fmt(v.r.fameMult, 2)}`],
    ['Superfans', `×${fmt(v.r.superfanMult, 2)}`],
    ['Trophy cabinet', `×${fmt(v.r.cabinet, 2)}`],
    ['Active buffs', `×${fmt(v.r.buffIncomeMult, 2)}`],
    ['Sponsors (in global)', `+${fmtPct(v.m.sponsorIncomePct, false, 1)}`],
    ['Prize money', `×${fmt(v.m.prizeMult, 2)}`],
    ['Click value', money(v.r.click, 1)],
  ]);

  const counters = $derived([
    ['Game time this run', fmtTime(v.s.time)],
    ['Playtime, all runs', fmtTime(v.s.stats.playtimeTotal)],
    ['Earned this run', money(v.s.earnedRun)],
    ['Earned all time', money(v.s.earnedTotal)],
    ['Best income', `${money(v.s.stats.bestCps)}/s`],
    ['Matches', `${fmt(v.s.stats.matchesWon)}W ${fmt(v.s.stats.matchesLost)}L`],
    ['League titles', fmt(v.s.stats.seasonTitles)],
    ['Invitationals won', `${fmt(v.s.stats.tournamentsWon)} of ${fmt(v.s.stats.tournamentsPlayed)}`],
    ['Hype Drops', `${fmt(v.s.stats.dropsClicked)} caught, ${fmt(v.s.stats.dropsMissed)} missed`],
    ['Drama clicked', fmt(v.s.stats.dramaClicked)],
    ['Sponsors', `${fmt(v.s.stats.sponsorsSigned)} signed, ${fmt(v.s.stats.sponsorGoals)} goals`],
    ['Players signed', fmt(v.s.stats.playersSigned)],
    ['Merch sold', fmt(v.s.stats.merchSold)],
    ['Illness / injury / burnout', `${fmt(v.s.stats.illnesses)} / ${fmt(v.s.stats.injuries)} / ${fmt(v.s.stats.burnouts)}`],
    ['Orgs sold', fmt(v.s.prestige.runs)],
  ]);

  let copied = $state(false);
  async function copy() {
    const data = {
      live: Object.fromEntries(live.rows.map((x) => [x.label, x.value])),
      incomeRun: v.s.incomeRun,
      incomeTotal: v.s.incomeTotal,
      multipliers: Object.fromEntries(multipliers),
      counters: Object.fromEntries(counters),
      teams: Object.values(v.r.teams).map((t) => ({ game: t.gameId, tier: v.s.teams[t.gameId]?.tier, rating: t.rating, opponent: t.opponent, win: t.winChance, cps: t.cps })),
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      copied = true;
    } catch {
      copied = false;
    }
  }

  const share = (x: number, total: number) => (total > 0 ? x / total : 0);
</script>

<Modal title="Debug stats" {onclose} width={640}>
  <div class="debug">
    <section>
      <h4>Income right now <span class="dim">· {money(live.total)}/s</span></h4>
      {#each live.rows as row (row.label)}
        <div class="row">
          <span class="label">{row.label}</span>
          <span class="bar"><i style="width:{share(row.value, live.total) * 100}%"></i></span>
          <span class="num">{money(row.value, 1)}/s</span>
          <span class="num dim pct">{fmtPct(share(row.value, live.total))}</span>
        </div>
      {/each}
    </section>

    <div class="cols">
      <section>
        <h4>Earned this run <span class="dim">· {money(run.total)}</span></h4>
        {#each run.rows as row (row.label)}
          <div class="row compact">
            <span class="label">{row.label}</span>
            <span class="bar"><i style="width:{share(row.value, run.total) * 100}%"></i></span>
            <span class="num">{money(row.value)}</span>
          </div>
        {/each}
      </section>
      <section>
        <h4>Earned all time <span class="dim">· {money(all.total)}</span></h4>
        {#each all.rows as row (row.label)}
          <div class="row compact">
            <span class="label">{row.label}</span>
            <span class="bar"><i style="width:{share(row.value, all.total) * 100}%"></i></span>
            <span class="num">{money(row.value)}</span>
          </div>
        {/each}
        <p class="dim tiny">Tracked from this version on.</p>
      </section>
    </div>

    <div class="cols">
      <section>
        <h4>Multipliers</h4>
        <dl>
          {#each multipliers as [k, val] (k)}<dt>{k}</dt><dd class="num">{val}</dd>{/each}
        </dl>
      </section>
      <section>
        <h4>Top operations</h4>
        {#if topOps.length === 0}<p class="dim tiny">None owned.</p>{/if}
        <dl>
          {#each topOps as op (op.name)}<dt>{op.name} <span class="dim">×{fmt(op.owned)}</span></dt><dd class="num">{money(op.cps, 1)}/s</dd>{/each}
        </dl>
      </section>
    </div>

    <section>
      <h4>Teams</h4>
      <table>
        <thead><tr><th>Game</th><th>League</th><th>Rating</th><th>Opponent</th><th>Win</th><th>$/s</th><th>Match every</th></tr></thead>
        <tbody>
          {#each Object.values(v.r.teams) as t (t.gameId)}
            {@const team = v.s.teams[t.gameId]}
            <tr>
              <td>{GAME_MAP.get(t.gameId)?.name ?? t.gameId}</td>
              <td>T{(team?.tier ?? 0) + 1} {tierName(team?.tier ?? 0)}</td>
              <td class="num">{fmt(t.rating, 1)}</td>
              <td class="num">{fmt(t.opponent, 1)}</td>
              <td class="num">{fmtPct(t.winChance)}</td>
              <td class="num">{money(t.cps, 1)}</td>
              <td class="num">{fmt(t.interval, 1)}s</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </section>

    <section>
      <h4>Counters</h4>
      <dl class="wide">
        {#each counters as [k, val] (k)}<dt>{k}</dt><dd class="num">{val}</dd>{/each}
      </dl>
    </section>
  </div>

  {#snippet footer()}
    <button class="btn" onclick={copy}>{copied ? 'Copied' : 'Copy as JSON'}</button>
    <button class="btn primary" onclick={onclose}>Close</button>
  {/snippet}
</Modal>

<style>
  .debug {
    display: flex;
    flex-direction: column;
    gap: 14px;
    font-size: 12.5px;
  }
  h4 {
    margin: 0 0 6px;
    font-family: var(--font-ui);
    font-size: 12px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  h4 .dim {
    text-transform: none;
    letter-spacing: 0;
  }
  .cols {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 14px;
  }
  .row {
    display: grid;
    grid-template-columns: 130px 1fr auto 44px;
    align-items: center;
    gap: 8px;
    padding: 2px 0;
  }
  .row.compact {
    grid-template-columns: 100px 1fr auto;
  }
  .label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .bar {
    height: 6px;
  }
  .pct {
    text-align: right;
  }
  dl {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 3px 10px;
    margin: 0;
  }
  dl.wide {
    grid-template-columns: repeat(auto-fit, minmax(150px, auto) minmax(90px, auto));
  }
  dt {
    color: var(--muted);
  }
  dd {
    margin: 0;
    text-align: right;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th,
  td {
    padding: 3px 6px;
    text-align: left;
    border-bottom: 1px solid var(--line);
    white-space: nowrap;
  }
  th {
    color: var(--muted);
    font-weight: 600;
  }
  section {
    overflow-x: auto;
  }
  .tiny {
    font-size: 11px;
    margin: 4px 0 0;
  }
</style>
