<script lang="ts">
  import { OPERATIONS, type OperationDef } from '../../data/operations';
  import type { UpgradeDef, UpgradeGroup } from '../../data/upgrades';
  import { describeEffect } from '../../engine/describe';
  import { fmt, fmtPct, money } from '../../engine/format';
  import { bulkPrice, isOperationRevealed, maxAffordable, sellRefund } from '../../engine/operations';
  import { canAffordUpgrade, storeUpgrades, upgradePrice } from '../../engine/upgrades';
  import Icon from '../components/Icon.svelte';
  import { game } from '../game.svelte';
  import { laneHue, tierColor } from '../theme';
  import { tooltip, type TipContent } from '../tooltip.svelte';

  const GROUP_LABEL: Record<UpgradeGroup, string> = {
    grind: 'Grinder upgrade',
    op: 'Operation upgrade',
    collab: 'Streamer collab',
    synergy: 'Synergy upgrade',
    click: 'Clicking upgrade',
    hype: 'Hype upgrade',
    snack: 'Team snacks',
    fame: 'Fame upgrade',
    superfan: 'Superfans',
    team: 'Team upgrade',
    roster: 'Roster upgrade',
    gear: 'Gear upgrade',
    staff: 'Staff upgrade',
    drops: 'Hype Drop upgrade',
    tournament: 'Tournament upgrade',
    drama: 'Drama upgrade',
    trophy: 'Trophy upgrade',
    sponsor: 'Sponsor upgrade',
    merch: 'Merch upgrade',
  };
  const AMOUNTS: { value: number; label: string }[] = [
    { value: 1, label: '1' },
    { value: 10, label: '10' },
    { value: 100, label: '100' },
    { value: -1, label: 'Max' },
  ];
  const COLLAPSED_UPGRADES = 14;

  let mode = $state<'buy' | 'sell'>('buy');
  let expanded = $state(false);

  const v = $derived(game.view);
  const s = $derived(v.s);
  const amount = $derived(s.settings.buyAmount);
  const upgrades = $derived(storeUpgrades(s));
  const shownUpgrades = $derived(expanded ? upgrades : upgrades.slice(0, COLLAPSED_UPGRADES));
  const affordable = $derived(upgrades.filter((u) => u.currency === 'cash' && canAffordUpgrade(s, u, v.m)).length);
  const lastRevealed = $derived.by(() => {
    let last = 0;
    for (const op of OPERATIONS) if (isOperationRevealed(s, op)) last = op.index;
    return last;
  });
  const shownOps = $derived(OPERATIONS.slice(0, Math.min(OPERATIONS.length, lastRevealed + 2)));

  function upgradeTip(def: UpgradeDef): TipContent {
    const { s, m } = game.view;
    const price = upgradePrice(def, m);
    return {
      title: def.name,
      subtitle: GROUP_LABEL[def.group],
      icon: def.icon,
      iconColor: tierColor(def.tier),
      cost: def.currency === 'cash' ? money(price) : `${fmt(price)} trophies`,
      costOk: canAffordUpgrade(s, def, m),
      lines: def.effects.map((e) => describeEffect(e)),
      flavor: def.flavor?.replaceAll('{org}', s.org.name),
    };
  }

  function opTip(op: OperationDef): TipContent {
    const { s, r, m } = game.view;
    const st = s.ops[op.id];
    const share = r.cps > 0 ? r.opCps[op.id] / r.cps : 0;
    const lines: TipContent['lines'] = [{ text: op.desc, tone: 'muted' }];
    lines.push(`Each ${op.name} produces ${money(r.opUnit[op.id], 1)} per second.`);
    if (st.owned > 0) {
      lines.push(
        `${fmt(st.owned)} ${st.owned === 1 ? op.name : op.plural} producing ${money(r.opCps[op.id], 1)}/s (${fmtPct(share, false, 1)} of income).`,
      );
      lines.push({ text: `${money(st.produced)} produced so far.`, tone: 'muted' });
    }
    if (op.fansPerSec > 0) {
      lines.push({ text: `Each attracts ${fmt(op.fansPerSec * m.fansMult, 2)} fans per second.`, tone: 'cyan' });
    }
    if (op.id === 'grinder') lines.push({ text: 'Grinder upgrades also power up your clicks.', tone: 'gold' });
    return {
      title: op.name,
      subtitle: `Owned: ${fmt(st.owned)}`,
      icon: op.icon,
      iconColor: `hsl(${laneHue(op.index)} 90% 65%)`,
      lines,
    };
  }

  function rowInfo(op: OperationDef): { n: number; price: number; ok: boolean } {
    const st = s.ops[op.id];
    const costMult = v.m.opCostMult;
    if (mode === 'sell') {
      const n = amount < 0 ? st.owned : Math.min(amount, st.owned);
      return { n, price: sellRefund(op, st.owned, n, costMult), ok: n > 0 };
    }
    if (amount < 0) {
      const max = maxAffordable(op, st.owned, s.cash, costMult);
      const n = Math.max(1, max);
      return { n, price: bulkPrice(op, st.owned, n, costMult), ok: max > 0 };
    }
    const price = bulkPrice(op, st.owned, amount, costMult);
    return { n: amount, price, ok: s.cash >= price };
  }

  function onOp(op: OperationDef) {
    if (mode === 'buy') game.buyOperation(op.id, amount);
    else game.sellOperation(op.id, amount);
  }
</script>

<div class="store panel">
  <section class="upgrades">
    <header class="section-head">
      <h2 class="section-title">Upgrades <span class="count">{upgrades.length}</span></h2>
      {#if affordable > 1}
        <button class="btn small" onclick={() => game.buyAllUpgrades()}>Buy all ({affordable})</button>
      {/if}
    </header>
    {#if upgrades.length === 0}
      <p class="empty muted">New upgrades appear here as your org grows.</p>
    {:else}
      <div class="grid">
        {#each shownUpgrades as def (def.id)}
          {@const ok = canAffordUpgrade(s, def, v.m)}
          <button
            class="upgrade"
            class:ok
            style="--c:{tierColor(def.tier)}"
            onclick={() => game.buyUpgrade(def.id)}
            use:tooltip={() => upgradeTip(def)}
            aria-label="{def.name}, costs {money(upgradePrice(def, v.m))}"
          >
            <Icon name={def.icon} size={22} />
            {#if def.badge}<span class="badge"><Icon name={def.badge} size={11} /></span>{/if}
          </button>
        {/each}
      </div>
      {#if upgrades.length > COLLAPSED_UPGRADES}
        <button class="more" onclick={() => (expanded = !expanded)}>
          {expanded ? 'Show fewer' : `Show all ${upgrades.length}`}
        </button>
      {/if}
    {/if}
  </section>

  <section class="ops">
    <header class="section-head">
      <h2 class="section-title">Operations</h2>
      <div class="controls">
        <div class="seg">
          <button class:active={mode === 'buy'} onclick={() => (mode = 'buy')}>Buy</button>
          <button class:active={mode === 'sell'} class:sell={mode === 'sell'} onclick={() => (mode = 'sell')}>Sell</button>
        </div>
        <div class="seg">
          {#each AMOUNTS as a (a.value)}
            <button class:active={amount === a.value} onclick={() => game.setSetting('buyAmount', a.value)}>{a.label}</button>
          {/each}
        </div>
      </div>
    </header>

    <div class="op-list">
      {#each shownOps as op (op.id)}
        {#if isOperationRevealed(s, op)}
          {@const info = rowInfo(op)}
          <button
            class="op"
            class:no={!info.ok}
            class:selling={mode === 'sell'}
            style="--h:{laneHue(op.index)}"
            onclick={() => onOp(op)}
            use:tooltip={() => opTip(op)}
          >
            <span class="op-icon"><Icon name={op.icon} size={24} /></span>
            <span class="op-main">
              <span class="op-name">{op.name}</span>
              <span class="op-price num">
                {mode === 'sell' ? '+' : ''}{money(info.price)}
                {#if info.n !== 1}<span class="qty">×{fmt(info.n)}</span>{/if}
              </span>
            </span>
            {#if s.ops[op.id].owned > 0}<span class="op-owned num">{fmt(s.ops[op.id].owned)}</span>{/if}
          </button>
        {:else}
          <div class="op mystery">
            <span class="op-icon"><Icon name="lock" size={20} /></span>
            <span class="op-main">
              <span class="op-name">???</span>
              <span class="op-price num">{money(op.baseCost)}</span>
            </span>
          </div>
        {/if}
      {/each}
    </div>
  </section>
</div>

<style>
  .store {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  section {
    padding: 10px 10px 8px;
  }
  .upgrades {
    border-bottom: 1px solid var(--line);
    flex: none;
    max-height: 45%;
    overflow-y: auto;
  }
  .section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
  }
  .section-head .section-title {
    margin: 0;
  }
  .count {
    display: inline-block;
    margin-left: 4px;
    padding: 0 6px;
    border-radius: 999px;
    background: var(--panel-3);
    color: var(--text);
    font-size: 11px;
  }
  .empty {
    margin: 0;
    font-size: 12.5px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
    gap: 5px;
  }
  .upgrade {
    position: relative;
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    border-radius: 8px;
    border: 1.5px solid color-mix(in srgb, var(--c) 45%, transparent);
    background: color-mix(in srgb, var(--c) 8%, var(--bg-2));
    color: color-mix(in srgb, var(--c) 55%, var(--dim));
    opacity: 0.6;
    transition:
      transform 0.08s,
      box-shadow 0.15s,
      opacity 0.15s;
  }
  .upgrade.ok {
    opacity: 1;
    color: var(--c);
    border-color: var(--c);
    box-shadow: 0 0 10px color-mix(in srgb, var(--c) 35%, transparent);
  }
  .upgrade:hover {
    transform: translateY(-2px);
  }
  .upgrade:active {
    transform: translateY(0) scale(0.95);
  }
  .badge {
    position: absolute;
    right: 2px;
    bottom: 2px;
    display: grid;
    place-items: center;
    width: 15px;
    height: 15px;
    border-radius: 4px;
    background: var(--bg);
    color: var(--text);
  }
  .more {
    margin-top: 6px;
    width: 100%;
    padding: 3px;
    border: 1px dashed var(--line-2);
    border-radius: 6px;
    background: transparent;
    color: var(--muted);
    font-size: 12px;
  }
  .more:hover {
    color: var(--text);
  }
  .ops {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  .controls {
    display: flex;
    gap: 6px;
  }
  .seg {
    display: flex;
    border: 1px solid var(--line-2);
    border-radius: 6px;
    overflow: hidden;
  }
  .seg button {
    border: none;
    background: var(--bg-2);
    color: var(--muted);
    padding: 3px 8px;
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 12px;
  }
  .seg button + button {
    border-left: 1px solid var(--line-2);
  }
  .seg button.active {
    background: rgba(34, 228, 255, 0.2);
    color: var(--cyan);
  }
  .seg button.active.sell {
    background: rgba(255, 77, 109, 0.2);
    color: var(--red);
  }
  .op-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding-right: 2px;
  }
  .op {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 6px 10px 6px 6px;
    border-radius: 9px;
    text-align: left;
    border: 1px solid hsl(var(--h, 220) 60% 50% / 0.35);
    background:
      linear-gradient(90deg, hsl(var(--h, 220) 80% 55% / 0.16), transparent 70%),
      var(--bg-2);
    transition:
      border-color 0.12s,
      transform 0.06s,
      filter 0.12s;
  }
  button.op:hover {
    border-color: hsl(var(--h) 90% 65%);
  }
  button.op:active {
    transform: scale(0.99);
  }
  .op.no {
    filter: saturate(0.4) brightness(0.8);
  }
  .op-icon {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 8px;
    color: hsl(var(--h, 220) 90% 70%);
    background: hsl(var(--h, 220) 70% 50% / 0.15);
    flex: none;
  }
  .op-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .op-name {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 16px;
    line-height: 1.15;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .op-price {
    font-size: 13px;
    color: var(--green);
  }
  .op.no .op-price {
    color: var(--red);
  }
  .op.selling .op-price {
    color: var(--gold);
  }
  .qty {
    color: var(--muted);
    margin-left: 3px;
  }
  .op-owned {
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 24px;
    color: hsl(var(--h, 220) 30% 80% / 0.55);
  }
  .op.mystery {
    opacity: 0.45;
    --h: 230;
  }
  .op.mystery .op-price {
    color: var(--muted);
  }
</style>
