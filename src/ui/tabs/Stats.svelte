<script lang="ts">
  import { ACHIEVEMENTS } from '../../data/achievements';
  import { OPERATIONS } from '../../data/operations';
  import { UPGRADES, UPGRADE_MAP } from '../../data/upgrades';
  import { describeEffect } from '../../engine/describe';
  import { cabinetCount } from '../../engine/economy';
  import { fmt, fmtPct, fmtTime, money } from '../../engine/format';
  import { totalOperationsOwned } from '../../engine/operations';
  import Icon from '../components/Icon.svelte';
  import { game } from '../game.svelte';
  import { tierColor } from '../theme';
  import { tooltip } from '../tooltip.svelte';

  const v = $derived(game.view);
  const s = $derived(v.s);
  const r = $derived(v.r);
  const m = $derived(v.m);

  const purchased = $derived(
    Object.keys(s.upgrades)
      .map((id) => UPGRADE_MAP.get(id))
      .filter((u) => u !== undefined)
      .sort((a, b) => a.cost - b.cost),
  );

  const general = $derived<[string, string][]>([
    ['Cash in bank', money(s.cash)],
    ['Cash earned this run', money(s.earnedRun)],
    ['Cash earned all time', money(s.earnedTotal)],
    ['Income per second', `${money(r.totalCps, 1)} from operations, matches and merch`],
    ['From operations', `${money(r.cpsNoBuffs, 1)} before buffs (best ${money(s.stats.bestCps, 1)})`],
    ['Click value', money(r.click, 1)],
    ['Clicks', `${fmt(s.stats.clicksRun)} this run · ${fmt(s.stats.clicksTotal)} total`],
    ['Cash from clicks', `${money(s.stats.clickCashRun)} this run · ${money(s.stats.clickCashTotal)} total`],
    ['Fans', `${fmt(s.fans)} (${fmt(s.fansTotal)} gained all time)`],
    ['Operations owned', fmt(totalOperationsOwned(s))],
    ['Upgrades', `${Object.keys(s.upgrades).length} / ${UPGRADES.length}`],
    ['Achievements', `${Object.keys(s.achievements).length} / ${ACHIEVEMENTS.length}`],
    ['Crowds gone wild', fmt(s.stats.crowdsTotal)],
    ['Run length', fmtTime(s.time - s.runStartTime)],
    ['Total play time', fmtTime(s.stats.playtimeTotal)],
    ['Time away (offline)', fmtTime(s.stats.offlineSecondsTotal)],
    ['Org founded', new Date(s.createdAt).toLocaleDateString()],
    ['Legacy level', `${fmt(s.prestige.level)} (+${fmtPct(s.prestige.level * m.legacyLevelPct)} income)`],
    ['Legacy points', `${fmt(s.prestige.points)} unspent · ${fmt(s.prestige.spent)} spent`],
    ['Orgs sold', fmt(s.stats.orgsSold)],
    ['Invitationals', `${fmt(s.stats.tournamentsWon)} won of ${fmt(s.stats.tournamentsPlayed)}`],
    ['Hype Drops clicked', `${fmt(s.stats.dropsClicked)} (${fmt(s.stats.dramaClicked)} drama, ${fmt(s.stats.dropsMissed)} missed)`],
    ['Merch revenue', `${money(s.stats.merchRevenue)} · ${fmt(s.stats.merchSold)} items sold`],
    ['Sponsors', `${fmt(s.stats.sponsorsSigned)} signed · ${fmt(s.stats.sponsorGoals)} goals met`],
  ]);

  const multipliers = $derived<[string, string][]>([
    ['Base production', `${money(r.baseCps, 1)}/s`],
    ['Upgrades', `×${fmt(m.globalMult, 2)}`],
    ['Fame (fans)', `×${r.fameMult.toFixed(3)} (power ${m.fameExp.toFixed(3)})`],
    ['Superfans', `×${r.superfanMult.toFixed(3)}`],
    ['Trophy Cabinet', `${fmtPct(r.cabinet)} (${cabinetCount(s)} achievements)`],
    ['Active buffs', `×${fmt(r.buffIncomeMult, 2)}`],
    ['Offline efficiency', `${fmtPct(m.offlineRate)} for up to ${m.offlineCapHours}h`],
  ]);
</script>

<div class="stats">
  <section>
    <h3 class="section-title">General</h3>
    <dl>
      {#each general as [label, value] (label)}
        <dt>{label}</dt>
        <dd class="num">{value}</dd>
      {/each}
    </dl>
  </section>

  <section>
    <h3 class="section-title">Income multipliers</h3>
    <dl>
      {#each multipliers as [label, value] (label)}
        <dt>{label}</dt>
        <dd class="num">{value}</dd>
      {/each}
    </dl>
  </section>

  <section>
    <h3 class="section-title">Operations</h3>
    <dl>
      {#each OPERATIONS.filter((op) => s.ops[op.id].highest > 0) as op (op.id)}
        <dt><Icon name={op.icon} size={13} /> {op.plural}</dt>
        <dd class="num">{fmt(s.ops[op.id].owned)} owned · {money(s.ops[op.id].produced)} produced</dd>
      {/each}
    </dl>
  </section>

  <section>
    <h3 class="section-title">Purchased upgrades ({purchased.length})</h3>
    {#if purchased.length === 0}
      <p class="muted">None yet.</p>
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
            <Icon name={def.icon} size={18} />
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
    gap: 18px;
  }
  dl {
    display: grid;
    grid-template-columns: minmax(140px, max-content) 1fr;
    gap: 4px 16px;
    margin: 0;
  }
  dt {
    color: var(--muted);
    display: flex;
    align-items: center;
    gap: 5px;
  }
  dd {
    margin: 0;
    font-weight: 600;
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
    dl {
      grid-template-columns: 1fr;
      gap: 0;
    }
    dd {
      margin-bottom: 6px;
    }
  }
</style>
