<script lang="ts">
  import { AUTOMATIONS, type AutomationId } from '../../data/automation';
  import { CHARTER_MAP } from '../../data/charters';
  import { GAME_MAP } from '../../data/games';
  import { SPONSOR_TIERS } from '../../data/sponsors';
  import { TRAIT_MAP } from '../../data/traits';
  import { automationUnlocked } from '../../engine/automation';
  import { fmtTime } from '../../engine/format';
  import { RARITY_MAP } from '../../engine/players';
  import { game } from '../game.svelte';
  import Icon from './Icon.svelte';

  /** Cash-share presets per routine: small enough to be safe, large enough to matter. */
  const SHARES: Record<Exclude<AutomationId, 'sponsors' | 'roles'>, number[]> = {
    operations: [0.01, 0.05, 0.1, 0.25],
    upgrades: [0.05, 0.1, 0.25, 0.5],
    roster: [0.1, 0.25, 0.5, 1],
    gear: [0.005, 0.01, 0.025, 0.05],
  };
  const SHARE_LABEL: Record<Exclude<AutomationId, 'sponsors' | 'roles'>, string> = {
    operations: 'Spend up to',
    upgrades: 'Spend up to',
    roster: 'Spend up to',
    gear: 'Spend up to',
  };

  const v = $derived(game.view);
  const s = $derived(v.s);

  /** The market scouting focus in words; it is set in the Market, where its results show. */
  function scoutSummary(): string {
    const f = s.market.scouting;
    const parts = [
      f?.gameBias ? (GAME_MAP.get(f.gameBias)?.name ?? f.gameBias) : 'any game',
      f?.rarityBias ? (RARITY_MAP.get(f.rarityBias)?.name ?? f.rarityBias) : 'any rarity',
      f?.traitFocus ? (TRAIT_MAP.get(f.traitFocus)?.name ?? f.traitFocus) : 'any trait',
    ];
    return parts.join(', ');
  }
  const charter = $derived(s.prestige.charter ? CHARTER_MAP.get(s.prestige.charter) : undefined);
  const pct = (x: number) => `${parseFloat((x * 100).toFixed(1))}%`;

  const gearShares = $derived.by(() => {
    const list = [0.005, 0.01, 0.025, 0.05];
    if (s.prestige.nodes.gear_gear_gear_1 !== undefined) list.push(0.10);
    if (s.prestige.nodes.gear_gear_gear_2 !== undefined) list.push(0.25);
    if (s.prestige.nodes.gear_gear_gear_3 !== undefined) list.push(0.50);
    return list;
  });

  function sharesFor(id: Exclude<AutomationId, 'sponsors' | 'roles'>): number[] {
    return id === 'gear' ? gearShares : SHARES[id];
  }
</script>

<section class="front-office">
  <header>
    <h3 class="section-title">Front office</h3>
    <p class="muted small">
      Standing orders your staff carry out every few seconds while the game is open. Routines unlock as the org grows{charter
        ? `, and your ${charter.name} charter starts one unlocked every run`
        : ', or from the start of every run with a Founding Charter'}.
    </p>
  </header>

  <div class="routines">
    {#each AUTOMATIONS as a (a.id)}
      {@const unlocked = automationUnlocked(s, a.id)}
      {@const rule = s.automation[a.id]}
      {@const fromCharter = charter?.automation === a.id}
      <article class="routine" class:locked={!unlocked} class:on={unlocked && rule.on}>
        <div class="top">
          <span class="ricon"><Icon name={unlocked ? a.icon : 'lock'} size={18} /></span>
          <div class="rname">
            <b>{a.name}</b>
            <span class="dim small">{a.owner}{fromCharter ? ' · charter' : ''}</span>
          </div>
          {#if unlocked}
            <label class="switch">
              <input type="checkbox" checked={rule.on} onchange={(e) => game.setAutomation(a.id, { on: e.currentTarget.checked })} />
              <span>{rule.on ? 'On' : 'Off'}</span>
            </label>
          {/if}
        </div>
        <p class="desc small">{a.desc}</p>
        {#if !unlocked}
          <p class="req small"><Icon name="lock" size={12} /> {a.requirement}</p>
        {:else if a.id === 'sponsors'}
          <div class="rule small">
            <label>
              Target tier
              <select value={s.automation.sponsors.minTier} onchange={(e) => game.setAutomation('sponsors', { minTier: Number(e.currentTarget.value) })}>
                <option value={0}>Any tier</option>
                {#each SPONSOR_TIERS as _, i (i)}<option value={i + 1}>Tier {i + 1}</option>{/each}
              </select>
            </label>
            <label class="check">
              <input type="checkbox" checked={s.automation.sponsors.avoidCrypto} onchange={(e) => game.setAutomation('sponsors', { avoidCrypto: e.currentTarget.checked })} />
              Skip crypto
            </label>
          </div>
        {:else if a.id === 'roles'}
          <p class="rule small dim">Coaches only move someone when the new lineup is clearly stronger, so a settled team is left alone.</p>
        {:else}
          {@const current = s.automation[a.id].maxCostPct}
          <div class="rule small">
            <span>{SHARE_LABEL[a.id]}</span>
            <span class="seg">
              {#each sharesFor(a.id) as share (share)}
                <button class:active={current === share} onclick={() => game.setAutomation(a.id, { maxCostPct: share })}>{pct(share)}</button>
              {/each}
            </span>
            <span>of cash {a.id === 'roster' ? 'per signing' : 'each round'}</span>
          </div>
          {#if a.id === 'roster' && s.prestige.nodes.coach_bench !== undefined}
            <div class="rule small">
              <label class="check">
                <input
                  type="checkbox"
                  checked={s.automation.roster.buyBench ?? false}
                  onchange={(e) => game.setAutomation('roster', { buyBench: e.currentTarget.checked })}
                />
                Also sign substitutes for the bench
              </label>
            </div>
          {/if}
          {#if a.id === 'roster' && (s.prestige.nodes.scout_bias !== undefined || s.prestige.nodes.scout_trait !== undefined)}
            <div class="rule small scout-rule">
              <span class="dim">
                Scout focus: {scoutSummary()}
              </span>
              <button class="btn small" onclick={() => ((game.marketFilter = null), (game.tab = 'market'))}>Change in Market</button>
            </div>
          {/if}
        {/if}
      </article>
    {/each}
  </div>

  {#if s.automationLog.length > 0}
    <ul class="log small">
      {#each s.automationLog as entry, i (i)}
        <li><span class="dim num">{fmtTime(Math.max(0, s.time - entry.time))} ago</span> {entry.text}</li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .front-office {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  header .section-title {
    margin-bottom: 2px;
  }
  .small {
    font-size: 12.5px;
    margin: 0;
  }
  .routines {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 8px;
  }
  .routine {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid var(--line);
    background: var(--bg-2);
  }
  .routine.on {
    border-color: color-mix(in srgb, var(--accent) 50%, var(--line));
    background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 10%, transparent), transparent 60%), var(--bg-2);
  }
  .routine.locked {
    opacity: 0.7;
  }
  .top {
    display: flex;
    align-items: center;
    gap: 9px;
  }
  .ricon {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    flex: none;
    border-radius: 8px;
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, transparent);
  }
  .locked .ricon {
    color: var(--dim);
    background: var(--panel-2);
  }
  .rname {
    flex: 1;
    display: flex;
    flex-direction: column;
    font-family: var(--font-ui);
    font-size: 15px;
    line-height: 1.15;
  }
  .desc {
    color: var(--muted);
  }
  .req {
    display: flex;
    align-items: center;
    gap: 5px;
    color: var(--gold);
  }
  .switch {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
  }
  .switch input {
    accent-color: var(--accent);
    width: 16px;
    height: 16px;
  }
  .rule {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    color: var(--muted);
  }
  .rule label {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .rule select {
    padding: 2px 6px;
    border-radius: 6px;
    border: 1px solid var(--line-2);
    background: var(--bg);
    font-size: 12.5px;
  }
  .check input {
    accent-color: var(--accent);
  }
  .seg {
    display: inline-flex;
    border: 1px solid var(--line-2);
    border-radius: 6px;
    overflow: hidden;
  }
  .seg button {
    border: none;
    padding: 2px 8px;
    background: var(--bg);
    color: var(--muted);
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 12px;
  }
  .seg button + button {
    border-left: 1px solid var(--line-2);
  }
  .seg button.active {
    background: color-mix(in srgb, var(--accent) 22%, var(--bg));
    color: var(--text);
  }
  .log {
    list-style: none;
    margin: 0;
    padding: 8px 10px;
    border-radius: 8px;
    background: var(--bg-2);
    display: flex;
    flex-direction: column;
    gap: 3px;
    color: var(--muted);
  }
  .log .num {
    display: inline-block;
    min-width: 70px;
  }
</style>
