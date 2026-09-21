<script lang="ts">
  import { FINISH_NAMES, PRODUCTS, TREND_MAP, finishBand, finishSalesMult } from '../../data/merch';
  import { MAX_DESIGNS, analyzeDesign, type DesignDraft } from '../../engine/designs';
  import { fmt, fmtPct, fmtTime, money } from '../../engine/format';
  import { MAX_MERCH_QUALITY, MERCH_UNLOCK_FANS, PRICE_MAX, PRICE_MIN, isMerchUnlocked, merchQualityCost, optimalPrice } from '../../engine/merch';
  import type { Design } from '../../engine/types';
  import Avatar from '../components/Avatar.svelte';
  import DesignImage from '../components/DesignImage.svelte';
  import EmblemPicker from '../components/EmblemPicker.svelte';
  import OrgLogo from '../components/OrgLogo.svelte';
  import KitPicker from '../components/KitPicker.svelte';
  import Icon from '../components/Icon.svelte';
  import Modal from '../components/Modal.svelte';
  import MerchIcon from '../components/MerchIcon.svelte';
  import MerchPreview from '../components/MerchPreview.svelte';
  import { rarityColor, rarityName } from '../theme';
  import PixelEditor from '../components/PixelEditor.svelte';
  import { game } from '../game.svelte';
  import { tooltip, type TipContent } from '../tooltip.svelte';

  /** Pip indices for the finish track, one per purchasable level. */
  const FINISH_PIPS = Array.from({ length: MAX_MERCH_QUALITY }, (_, i) => i);

  let editing = $state<{ id: string | null } | null>(null);
  let confirmDelete = $state<string | null>(null);

  const v = $derived(game.view);
  const s = $derived(v.s);
  /** Someone to model the kit: the founder if they are still around, otherwise any player. */
  const model = $derived(s.players.founder ?? Object.values(s.players)[0]);
  const customKits = $derived(Object.values(s.teams).filter((t) => t.kit).length);
  const designs = $derived(Object.values(s.designs).sort((a, b) => b.createdAt - a.createdAt));
  const full = $derived(designs.length >= MAX_DESIGNS);
  const trend = $derived(TREND_MAP.get(s.merch.trend));
  const merchOpen = $derived(isMerchUnlocked(s));
  const editingDesign = $derived(editing?.id ? (s.designs[editing.id] ?? null) : null);

  function save(draft: DesignDraft) {
    if (game.saveDesign(editing?.id ?? null, draft)) editing = null;
  }

  function usage(id: string): string[] {
    const out: string[] = [];
    if (s.org.logo === id) out.push('Logo');
    if (s.org.jersey === id) out.push('Jersey');
    for (const p of PRODUCTS) if (s.merch.lines[p.id]?.designId === id) out.push(p.name);
    return out;
  }

  function appealTip(d: Design): TipContent {
    const a = analyzeDesign(d, game.view.s.merch.trend);
    return {
      title: `${Math.round(a.total * 100)}% merch appeal`,
      subtitle: d.handmade ? 'Hand-drawn (+15%)' : 'Auto-generated',
      icon: 'palette',
      iconColor: 'var(--gold)',
      lines: [
        `Colours ${fmtPct(a.colors)} · Coverage ${fmtPct(a.coverage)} · Symmetry ${fmtPct(a.symmetry)}`,
        `Contrast ${fmtPct(a.contrast)} · Trend match ${fmtPct(a.trend)}`,
        ...a.hints.map((h) => ({ text: h, tone: 'cyan' as const })),
      ],
    };
  }
</script>

<div class="studio">
  <header class="head">
    <div>
      <h2 class="section-title">Design Studio</h2>
      <p class="muted small">Draw pixel-art designs for your logo, team jerseys and merch. Good designs sell more merch.</p>
    </div>
    {#if merchOpen && trend}
      <div class="trend" use:tooltip={() => ({ title: `Trend: ${trend.name}`, icon: trend.icon, lines: [trend.desc, 'Matching designs sell 2.5 times as much, and fans are less fussy about price.'] })}>
        <Icon name={trend.icon} size={18} />
        <span>Trend: <b>{trend.name}</b></span>
        <span class="dim small num">{fmtTime(s.merch.trendEndsAt - s.time)} left</span>
      </div>
      {#if s.merch.mania && s.merch.mania.endsAt > s.time}
        <div class="trend mania"><Icon name="flame" size={18} /> <b>MANIA: {PRODUCTS.find((p) => p.id === s.merch.mania?.productId)?.name}</b> · {fmtTime(s.merch.mania.endsAt - s.time)} left</div>
      {/if}
    {/if}
  </header>

  <section class="colours">
    <div class="kit-preview">
      {#if model}
        <Avatar look={model.look} gear={model.gear} primary={s.org.primary} secondary={s.org.secondary} size={92} number={model.jersey} tag={model.tag} />
      {/if}
    </div>
    <div class="kit-main">
      <h3 class="section-title">Team colours</h3>
      <p class="muted small">
        The default kit for every team: jerseys, chairs and your gaming house. Give a single team its own colours from its card in the
        Teams tab.{#if customKits > 0}<span class="dim"> {customKits} {customKits === 1 ? 'team uses' : 'teams use'} their own colours.</span>{/if}
      </p>
      <KitPicker primary={s.org.primary} secondary={s.org.secondary} onchange={(p, a) => game.setOrgKit(p, a)} />
    </div>
  </section>

  <section class="colours">
    <div class="kit-preview">
      <OrgLogo name={s.org.name} primary={s.org.primary} secondary={s.org.secondary} size={96} shape={s.org.emblem.shape} mark={s.org.emblem.mark} />
    </div>
    <div class="kit-main">
      <h3 class="section-title">Logo</h3>
      <p class="muted small">
        Pick a badge and a mark.{#if s.org.logo}<span class="dim"> Your drawn logo sits inside the badge in place of the mark.</span>{:else}
          Or draw a design below and set it as your logo to put it inside the badge.{/if}
      </p>
      <EmblemPicker emblem={s.org.emblem} name={s.org.name} primary={s.org.primary} secondary={s.org.secondary} onchange={(e) => game.setEmblem(e)} />
    </div>
  </section>

  <section>
    <div class="section-head">
      <h3 class="section-title">Your designs <span class="dim">{designs.length}/{MAX_DESIGNS}</span></h3>
      <div class="row">
        <button class="btn small primary" disabled={full} onclick={() => (editing = { id: null })}><Icon name="pencil" size={13} /> New design</button>
        <button class="btn small" disabled={full} onclick={() => game.generateDesign()}><Icon name="wand-sparkles" size={13} /> Auto-generate</button>
      </div>
    </div>
    {#if designs.length === 0}
      <div class="empty">
        <Icon name="palette" size={40} />
        <p class="muted">No designs yet. Draw a logo for {s.org.name}. It will replace the initials on your clicker shield and appear on every jersey.</p>
      </div>
    {:else}
      <div class="designs">
        {#each designs as d (d.id)}
          {@const a = analyzeDesign(d, s.merch.trend)}
          {@const uses = usage(d.id)}
          <div class="design">
            <button class="thumb" onclick={() => (editing = { id: d.id })} title="Edit {d.name}">
              <DesignImage design={d} size={92} alt={d.name} />
            </button>
            <div class="dname">{d.name}</div>
            <div class="dmeta">
              <span class="appeal num" use:tooltip={() => appealTip(d)}>{Math.round(a.total * 100)}% appeal</span>
              {#if !d.handmade}<span class="dim">auto</span>{/if}
            </div>
            {#if uses.length > 0}<div class="uses">{uses.join(' · ')}</div>{/if}
            <div class="dactions">
              <button class="btn small" class:primary={s.org.logo === d.id} onclick={() => game.setLogo(s.org.logo === d.id ? null : d.id)}>Logo</button>
              <button class="btn small" class:primary={s.org.jersey === d.id} onclick={() => game.setJersey(s.org.jersey === d.id ? null : d.id)}>Jersey</button>
              {#if confirmDelete === d.id}
                <button class="btn small danger" onclick={() => (game.deleteDesign(d.id), (confirmDelete = null))}>Delete?</button>
              {:else}
                <button class="btn small" onclick={() => (confirmDelete = d.id)} aria-label="Delete {d.name}"><Icon name="trash" size={13} /></button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>

  <section>
    <h3 class="section-title">Merch store</h3>
    {#if !merchOpen}
      <div class="locked">
        <Icon name="lock" size={22} />
        <div>
          <b>Merch unlocks at {fmt(MERCH_UNLOCK_FANS)} fans</b>
          <span class="bar"><i style="width:{Math.min(100, (s.fansRun / MERCH_UNLOCK_FANS) * 100)}%"></i></span>
        </div>
      </div>
    {:else}
      <div class="products">
        {#each PRODUCTS as p (p.id)}
          {#if s.merch.unlocked[p.id] && s.merch.lines[p.id]}
            {@const line = s.merch.lines[p.id]}
            {@const rate = v.r.merchLines[p.id]}
            {@const d = line.designId ? s.designs[line.designId] : undefined}
            {@const q = line.quality ?? 0}
            {@const maxed = q >= MAX_MERCH_QUALITY}
            {@const cost = merchQualityCost(s, p.id)}
            <div class="product" class:live={!!rate}>
              <div class="phead">
                <MerchIcon productId={p.id} quality={line.quality ?? 0} primary={s.org.primary} secondary={s.org.secondary} size={30} showLevel={false} />
                <b>{p.name}</b>
                {#if rate?.trending}<span class="chip trending">Trending</span>{/if}
                <span class="pcps num">{money(rate?.cps ?? 0, 1)}/s</span>
              </div>
              <div class="pbody">
                <MerchPreview productId={p.id} design={d} quality={line.quality ?? 0} primary={s.org.primary} secondary={s.org.secondary} />
                <div class="controls">
                  <select value={line.designId ?? ''} onchange={(e) => game.setLineDesign(p.id, e.currentTarget.value || null)} aria-label="{p.name} design">
                    <option value="">No design (not selling)</option>
                    {#each designs as dd (dd.id)}
                      <option value={dd.id}>{dd.name} · {Math.round(analyzeDesign(dd, s.merch.trend).total * 100)}%</option>
                    {/each}
                  </select>
                  <label class="price">
                    <span class="small">Price {money(p.basePrice * line.price, 2)} <span class="dim">(×{line.price.toFixed(2)})</span></span>
                    <input
                      type="range"
                      min={PRICE_MIN}
                      max={PRICE_MAX}
                      step="0.05"
                      value={line.price}
                      oninput={(e) => game.setLinePrice(p.id, Number(e.currentTarget.value))}
                    />
                  </label>
                  <span class="dim small">Sweet spot ≈ ×{optimalPrice(rate?.trending ?? false).toFixed(2)}</span>
                </div>
              </div>
              <div class="finish-row" class:maxed style="--r:{rarityColor(finishBand(q))}">
                <div class="finfo">
                  <div class="fname">
                    {FINISH_NAMES[q]}
                    <span class="rarity">{rarityName(finishBand(q))} finish</span>
                  </div>
                  <div class="fdesc muted">
                    Sales ×{finishSalesMult(q).toFixed(2)}
                    {#if !maxed}<span class="good"> → ×{finishSalesMult(q + 1).toFixed(2)}</span>{/if}
                  </div>
                  <div class="pips" aria-hidden="true">
                    {#each FINISH_PIPS as i (i)}<i class:on={i < q}></i>{/each}
                  </div>
                  {#if !maxed}
                    <div class="next dim">
                      <MerchIcon productId={p.id} quality={q + 1} primary={s.org.primary} secondary={s.org.secondary} size={24} showLevel={false} />
                      Next: {FINISH_NAMES[q + 1]}
                    </div>
                  {/if}
                </div>
                {#if maxed}
                  <span class="chip gold-text">MAX</span>
                {:else}
                  <button class="btn small" class:primary={s.cash >= cost} disabled={s.cash < cost} onclick={() => game.upgradeMerchQuality(p.id)}>
                    <Icon name="sparkles" size={13} /> {money(cost)}
                  </button>
                {/if}
              </div>
              {#if rate}
                <div class="pstats small">
                  <span use:tooltip={() => ({ title: 'Appeal', lines: ['How much fans like the design (squared in sales).'] })}>Appeal <b>{fmtPct(rate.appeal)}</b></span>
                  <span use:tooltip={() => ({ title: 'Freshness', lines: ['New designs sell best. Freshness fades over time; swap designs to relaunch.'] })}>Fresh <b>{fmtPct(rate.novelty)}</b></span>
                  <span use:tooltip={() => ({ title: 'Price efficiency', lines: ['Profit compared with the ideal price.'] })}>Price <b>{fmtPct(rate.priceFactor)}</b></span>
                  <span>Sold <b class="num">{fmt(line.sold)}</b></span>
                </div>
              {/if}
            </div>
          {:else}
            {@const canUnlock = s.fansRun >= p.unlockFans}
            <div class="product locked-product">
              <div class="phead">
                <MerchIcon productId={p.id} primary={s.org.primary} secondary={s.org.secondary} size={30} showLevel={false} locked={!canUnlock} />
                <b>{canUnlock ? p.name : '???'}</b>
              </div>
              <p class="muted small">{canUnlock ? p.desc : `Unlocks at ${fmt(p.unlockFans)} fans.`}</p>
              {#if canUnlock}
                <button class="btn small gold" disabled={s.cash < p.unlockCost} onclick={() => game.unlockProduct(p.id)}>
                  Launch · {money(p.unlockCost)}
                </button>
              {/if}
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  </section>
</div>

{#if editing}
  <Modal title={editing.id ? 'Edit design' : 'New design'} onclose={() => (editing = null)} width={1000}>
    {#key editing.id ?? 'new'}
      <PixelEditor initial={editingDesign} trend={s.merch.trend} onsave={save} oncancel={() => (editing = null)} />
    {/key}
  </Modal>
{/if}

<style>
  .studio {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .small {
    font-size: 12px;
    margin: 0;
  }
  .trend {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--accent-2) 45%, transparent);
    background: color-mix(in srgb, var(--accent-2) 10%, transparent);
    color: var(--accent-2);
  }
  .trend b {
    color: var(--text);
  }
  .trend.mania { color:var(--gold); border-color:var(--gold); background:color-mix(in srgb,var(--gold) 12%,var(--bg-2)); }
  .section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 8px;
  }
  .colours {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    padding: 12px;
    border-radius: 12px;
    border: 1px solid var(--line);
    background: var(--bg-2);
  }
  .kit-preview {
    flex: none;
    display: grid;
    place-items: center;
    width: 110px;
    padding-top: 6px;
  }
  .kit-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .kit-main .section-title {
    margin: 0;
  }
  @media (max-width: 520px) {
    .colours {
      flex-direction: column;
      align-items: stretch;
    }
    .kit-preview {
      width: 100%;
    }
  }
  .section-head .section-title {
    margin: 0;
  }
  .row {
    display: flex;
    gap: 6px;
  }
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 6px;
    padding: 24px;
    color: var(--dim);
  }
  .empty p {
    max-width: 420px;
    margin: 0;
  }
  .designs {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 8px;
  }
  .design {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px;
    border-radius: 10px;
    background: var(--bg-2);
    border: 1px solid var(--line);
  }
  .thumb {
    padding: 0;
    border: 1px solid var(--line-2);
    border-radius: 6px;
    background: transparent;
    overflow: hidden;
  }
  .thumb:hover {
    border-color: var(--accent);
  }
  .dname {
    font-family: var(--font-ui);
    font-weight: 700;
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .dmeta {
    display: flex;
    gap: 6px;
    font-size: 12px;
  }
  .appeal {
    color: var(--gold);
  }
  .uses {
    font-size: 10.5px;
    color: var(--accent);
    text-align: center;
  }
  .dactions {
    display: flex;
    gap: 3px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .locked {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    border-radius: 10px;
    border: 1px dashed var(--line-2);
    color: var(--muted);
  }
  .locked div {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .products {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: 8px;
  }
  .product {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px;
    border-radius: 10px;
    background: var(--bg-2);
    border: 1px solid var(--line);
  }
  .product.live {
    border-color: color-mix(in srgb, var(--green) 35%, transparent);
  }
  .locked-product {
    border-style: dashed;
  }
  .finish-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 9px;
    border: 1px solid color-mix(in srgb, var(--r) 35%, var(--line));
    background: linear-gradient(90deg, color-mix(in srgb, var(--r) 10%, transparent), transparent 70%);
  }
  .finish-row.maxed {
    border-color: color-mix(in srgb, var(--r) 70%, transparent);
  }
  .finfo {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .fname {
    display: flex;
    align-items: baseline;
    gap: 6px;
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 13px;
  }
  .rarity {
    color: var(--r);
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .fdesc {
    font-size: 12px;
  }
  .pips {
    display: flex;
    gap: 2px;
  }
  .pips i {
    flex: 1;
    max-width: 14px;
    height: 4px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.08);
  }
  .pips i.on {
    background: var(--r);
  }
  .next {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
  }
  .phead {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-ui);
  }
  .pcps {
    margin-left: auto;
    color: var(--green);
    font-weight: 700;
  }
  .trending {
    color: var(--accent-2);
    border-color: var(--accent-2);
  }
  .pbody {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }
  .controls {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-width: 0;
  }
  select {
    width: 100%;
    padding: 4px 6px;
    border-radius: 6px;
    border: 1px solid var(--line-2);
    background: var(--panel);
    font-size: 12.5px;
  }
  .price {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .price input {
    width: 100%;
    accent-color: var(--accent);
  }
  .pstats {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    color: var(--muted);
  }
  .pstats b {
    color: var(--text);
  }
</style>
