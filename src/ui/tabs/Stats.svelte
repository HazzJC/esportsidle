<script lang="ts">
  import { ACHIEVEMENTS } from '../../data/achievements';
  import { OPERATIONS } from '../../data/operations';
  import { UPGRADES, UPGRADE_MAP } from '../../data/upgrades';
  import { describeEffect } from '../../engine/describe';
  import { cabinetCount } from '../../engine/economy';
  import { fmt, fmtPct, fmtTime, money } from '../../engine/format';
  import { totalOperationsOwned } from '../../engine/operations';
  import { INCOME_SOURCES, type IncomeSource } from '../../engine/types';
  import Icon from '../components/Icon.svelte';
  import { game } from '../game.svelte';
  import { opSpriteSvg } from '../opsArt';
  import { upgradeIconSvg } from '../upgradeArt';
  import { opColor, tierColor } from '../theme';
  import { tooltip } from '../tooltip.svelte';

  const v = $derived(game.view);
  const s = $derived(v.s);
  const r = $derived(v.r);
  const m = $derived(v.m);

  const OP_INDEX = new Map(OPERATIONS.map((o) => [o.id, o.index]));
  /** Built from constants in opsArt.ts, so {@html} is safe. */
  const opArt = (id: string) => opSpriteSvg(id, opColor(OP_INDEX.get(id) ?? 0));

  const purchased = $derived(
    Object.keys(s.upgrades)
      .map((id) => UPGRADE_MAP.get(id))
      .filter((u) => u !== undefined)
      .sort((a, b) => a.cost - b.cost),
  );

  /** The four numbers people look for first. */
  const headline = $derived([
    { label: 'Cash in bank', value: money(s.cash), icon: 'wallet', tone: 'gold' },
    { label: 'Income per second', value: money(r.totalCps, 1), icon: 'trending-up', tone: 'green' },
    { label: 'Fans', value: fmt(s.fans), icon: 'heart', tone: 'pink' },
    { label: 'Earned this run', value: money(s.earnedRun), icon: 'coins', tone: 'accent' },
  ]);

  const SOURCE: Record<IncomeSource, { label: string; color: string }> = {
    ops: { label: 'Operations', color: 'var(--accent)' },
    match: { label: 'Matches', color: 'var(--green)' },
    merch: { label: 'Merch', color: '#ff8a3d' },
    sponsor: { label: 'Sponsor goals', color: '#3fb6ff' },
    tournament: { label: 'Invitationals', color: 'var(--gold)' },
    drop: { label: 'Hype Drops', color: '#ff2bd6' },
    quest: { label: 'Quests', color: '#8b5cff' },
    event: { label: 'Events', color: '#9dff3b' },
    click: { label: 'Clicks', color: 'var(--muted)' },
  };

  /** This run's cash by where it came from, biggest first. */
  const sources = $derived.by(() => {
    const rows = INCOME_SOURCES.map((k) => ({ key: k, value: s.incomeRun[k] ?? 0 })).filter((x) => x.value > 0);
    const total = rows.reduce((a, x) => a + x.value, 0);
    return { rows: rows.sort((a, b) => b.value - a.value).map((x) => ({ ...x, share: total > 0 ? x.value / total : 0 })), total };
  });

  const groups = $derived<{ title: string; icon: string; rows: [string, string][] }[]>([
    {
      title: 'Money',
      icon: 'coins',
      rows: [
        ['Earned all time', money(s.earnedTotal)],
        ['From operations', `${money(r.cpsNoBuffs, 1)}/s before buffs`],
        ['Best operations income', `${money(s.stats.bestCps, 1)}/s`],
        ['Merch revenue', `${money(s.stats.merchRevenue)} · ${fmt(s.stats.merchSold)} sold`],
        ['Sponsors', `${fmt(s.stats.sponsorsSigned)} signed · ${fmt(s.stats.sponsorGoals)} goal${s.stats.sponsorGoals === 1 ? '' : 's'} met`],
      ],
    },
    {
      title: 'Clicking',
      icon: 'mouse-pointer-click',
      rows: [
        ['Click value', money(r.click, 1)],
        ['Clicks', `${fmt(s.stats.clicksRun)} this run · ${fmt(s.stats.clicksTotal)} total`],
        ['Cash from clicks', `${money(s.stats.clickCashRun)} this run · ${money(s.stats.clickCashTotal)} total`],
        ['Crowds gone wild', fmt(s.stats.crowdsTotal)],
      ],
    },
    {
      title: 'Competition',
      icon: 'swords',
      rows: [
        ['Matches', `${fmt(s.stats.matchesWon)} won · ${fmt(s.stats.matchesLost)} lost`],
        ['League titles', fmt(s.stats.seasonTitles)],
        ['Invitationals', `${fmt(s.stats.tournamentsWon)} won of ${fmt(s.stats.tournamentsPlayed)}`],
        ['Hype Drops', `${fmt(s.stats.dropsClicked)} caught · ${fmt(s.stats.dramaClicked)} drama · ${fmt(s.stats.dropsMissed)} missed`],
      ],
    },
    {
      title: 'Progress',
      icon: 'flag',
      rows: [
        ['Operations owned', fmt(totalOperationsOwned(s))],
        ['Upgrades', `${Object.keys(s.upgrades).length} of ${UPGRADES.length}`],
        ['Achievements', `${Object.keys(s.achievements).length} of ${ACHIEVEMENTS.length}`],
        ['Fans gained all time', fmt(s.fansTotal)],
      ],
    },
    {
      title: 'Time',
      icon: 'clock',
      rows: [
        ['This run', fmtTime(s.time - s.runStartTime)],
        ['Total play time', fmtTime(s.stats.playtimeTotal)],
        ['Time away', fmtTime(s.stats.offlineSecondsTotal)],
        ['Org founded', new Date(s.createdAt).toLocaleDateString()],
      ],
    },
    {
      title: 'Legacy',
      icon: 'crown',
      rows: [
        ['Legacy level', `${fmt(s.prestige.level)} (+${fmtPct(s.prestige.level * m.legacyLevelPct)} income)`],
        ['Legacy points', `${fmt(s.prestige.points)} unspent · ${fmt(s.prestige.spent)} spent`],
        ['Orgs sold', fmt(s.stats.orgsSold)],
      ],
    },
    {
      title: 'Income multipliers',
      icon: 'sparkles',
      rows: [
        ['Base production', `${money(r.baseCps, 1)}/s`],
        ['Upgrades', `×${fmt(m.globalMult, 2)}`],
        ['Fame (fans)', `×${r.fameMult.toFixed(3)} (power ${m.fameExp.toFixed(3)})`],
        ['Superfans', `×${r.superfanMult.toFixed(3)}`],
        ['Trophy Cabinet', `${fmtPct(r.cabinet)} (${cabinetCount(s)} achievements)`],
        ['Active buffs', `×${fmt(r.buffIncomeMult, 2)}`],
        ['Offline', `${fmtPct(m.offlineRate)} for up to ${m.offlineCapHours}h`],
      ],
    },
  ]);

  const ops = $derived(OPERATIONS.filter((op) => s.ops[op.id].highest > 0 || s.ops[op.id].owned > 0));
  const topProduced = $derived(Math.max(1, ...ops.map((op) => s.ops[op.id].produced)));
</script>

<div class="stats">
  <div class="headline">
    {#each headline as h (h.label)}
      <div class="big-card {h.tone}">
        <Icon name={h.icon} size={16} />
        <span class="big-label">{h.label}</span>
        <b class="big-value num">{h.value}</b>
      </div>
    {/each}
  </div>

  <section class="card">
    <h3 class="section-title">Where the money comes from <span class="dim">· this run</span></h3>
    {#if sources.total <= 0}
      <p class="muted small">Nothing earned yet this run.</p>
    {:else}
      <div class="stack" aria-hidden="true">
        {#each sources.rows as row (row.key)}
          <i style="flex:{row.share}; background:{SOURCE[row.key].color}" title="{SOURCE[row.key].label}: {fmtPct(row.share, false, 1)}"></i>
        {/each}
      </div>
      <ul class="sources">
        {#each sources.rows as row (row.key)}
          <li>
            <span class="dot" style="background:{SOURCE[row.key].color}"></span>
            <span class="src-name">{SOURCE[row.key].label}</span>
            <span class="num src-value">{money(row.value)}</span>
            <span class="num dim src-share">{fmtPct(row.share, false, 1)}</span>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <div class="groups">
    {#each groups as g (g.title)}
      <section class="card">
        <h3 class="section-title"><Icon name={g.icon} size={14} /> {g.title}</h3>
        <dl>
          {#each g.rows as [label, value] (label)}
            <dt>{label}</dt>
            <!-- Values wrap between their parts, never in the middle of one ("24.25 T" / "sold"). -->
            <dd class="num">{#each String(value).split(' · ') as part, i (i)}<span class="part">{i > 0 ? ' · ' : ''}{part}</span>{/each}</dd>
          {/each}
        </dl>
      </section>
    {/each}
  </div>

  {#if ops.length > 0}
    <section class="card">
      <h3 class="section-title">Operations</h3>
      <ul class="ops">
        {#each ops as op (op.id)}
          {@const st = s.ops[op.id]}
          <li>
            <span class="op-art">{@html opArt(op.id)}</span>
            <span class="op-name">{op.plural} <span class="dim num">×{fmt(st.owned)}</span></span>
            <span class="bar"><i style="width:{(st.produced / topProduced) * 100}%; background:{opColor(op.index)}"></i></span>
            <span class="num op-made">{money(st.produced)}</span>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <section class="card">
    <h3 class="section-title">Purchased upgrades <span class="dim">· {purchased.length}</span></h3>
    {#if purchased.length === 0}
      <p class="muted small">None yet.</p>
    {:else}
      <div class="grid">
        {#each purchased as def (def.id)}
          <div
            class="up"
            style="--c:{tierColor(def.tier)}"
            use:tooltip={() => ({
              title: def.name,
              icon: def.icon,
              iconColor: tierColor(def.tier),
              lines: def.effects.map((e) => describeEffect(e)),
              flavor: def.flavor?.replaceAll('{org}', game.view.s.org.name),
            })}
          >
            {#if def.art}<span class="up-art">{@html opArt(def.art)}</span>{:else if upgradeIconSvg(def.icon, def.group, tierColor(def.tier))}<span class="up-art">{@html upgradeIconSvg(def.icon, def.group, tierColor(def.tier))}</span>{:else}<Icon name={def.icon} size={18} />{/if}
          </div>
        {/each}
      </div>
    {/if}
  </section>
</div>

<style>
  .stats {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .headline {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 8px;
  }
  .big-card {
    --t: var(--accent);
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 2px 6px;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid color-mix(in srgb, var(--t) 35%, var(--line));
    background: linear-gradient(145deg, color-mix(in srgb, var(--t) 12%, transparent), transparent 60%), var(--bg-2);
    color: var(--t);
  }
  .big-card.gold {
    --t: var(--gold);
  }
  .big-card.green {
    --t: var(--green);
  }
  .big-card.pink {
    --t: #ff6f9a;
  }
  .big-label {
    font-size: 11.5px;
    color: var(--muted);
  }
  .big-value {
    grid-column: 1 / -1;
    font-family: var(--font-display);
    font-size: 20px;
    color: var(--text);
  }
  .card {
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid var(--line);
    background: var(--bg-2);
  }
  .section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 8px;
  }
  .section-title .dim {
    text-transform: none;
    letter-spacing: 0;
  }
  .small {
    font-size: 12.5px;
    margin: 0;
  }
  .stack {
    display: flex;
    height: 12px;
    border-radius: 6px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.05);
  }
  .stack i {
    display: block;
    min-width: 2px;
  }
  .sources {
    list-style: none;
    margin: 10px 0 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 4px 16px;
    font-size: 13px;
  }
  .sources li {
    display: grid;
    grid-template-columns: 10px 1fr auto auto;
    align-items: center;
    gap: 8px;
  }
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 3px;
  }
  .src-share {
    min-width: 4.5ch;
    text-align: right;
  }
  .groups {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 8px;
  }
  dl {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 4px 12px;
    margin: 0;
    font-size: 13px;
  }
  dt {
    color: var(--muted);
  }
  dd {
    margin: 0;
    font-weight: 600;
    text-align: right;
  }
  .part {
    white-space: nowrap;
  }
  .ops {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
  }
  .ops li {
    display: grid;
    grid-template-columns: 26px minmax(120px, 1.2fr) 2fr auto;
    align-items: center;
    gap: 8px;
  }
  .op-art,
  .up-art {
    display: block;
    width: 24px;
    height: 24px;
  }
  .op-art :global(svg),
  .up-art :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
  }
  .bar {
    height: 6px;
  }
  .op-made {
    min-width: 9ch;
    text-align: right;
  }
  .grid {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .up {
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border-radius: 6px;
    color: var(--c);
    border: 1px solid color-mix(in srgb, var(--c) 50%, transparent);
    background: color-mix(in srgb, var(--c) 10%, var(--bg-2));
  }
  @media (max-width: 520px) {
    .ops li {
      grid-template-columns: 26px 1fr auto;
    }
    .ops .bar {
      display: none;
    }
  }
</style>
