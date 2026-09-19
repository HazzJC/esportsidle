<script lang="ts">
  import { BRAND_MAP, CATEGORY_INFO, SPONSORS_UNLOCK_FANS, SPONSOR_TIERS } from '../../data/sponsors';
  import { fmt, fmtPct, fmtTime, money } from '../../engine/format';
  import { goalLabel, goalProgress, offerRequirements, sponsorsUnlocked } from '../../engine/sponsors';
  import type { SponsorOffer } from '../../engine/types';
  import Icon from '../components/Icon.svelte';
  import { game } from '../game.svelte';
  import { tooltip } from '../tooltip.svelte';

  let confirmCancel = $state<number | null>(null);

  const v = $derived(game.view);
  const s = $derived(v.s);
  const unlocked = $derived(sponsorsUnlocked(s));
  const slots = $derived(v.m.sponsorSlots);
  const activeCategories = $derived(new Set(s.sponsors.active.map((c) => BRAND_MAP.get(c.brandId)?.category)));

  function blocker(offer: SponsorOffer): string | null {
    const brand = BRAND_MAP.get(offer.brandId);
    if (!brand) return 'Unknown brand';
    if (s.sponsors.active.length >= slots) return 'All slots full';
    if (activeCategories.has(brand.category)) return `Already have ${CATEGORY_INFO[brand.category].label}`;
    const req = offerRequirements(s, offer);
    return req.ok ? null : (req.reason ?? 'Requirements not met');
  }

  function stars(tier: number): string {
    return '★'.repeat(tier + 1) + '☆'.repeat(SPONSOR_TIERS.length - tier - 1);
  }
</script>

<div class="sponsors">
  <header class="head">
    <div>
      <h2 class="section-title">Sponsors <span class="dim">{s.sponsors.active.length}/{slots} slots</span></h2>
      <p class="muted small">Sponsors boost all income and each brand category adds a perk. Only one sponsor per category.</p>
    </div>
    {#if unlocked}
      <span class="dim small num">New offers in {fmtTime(Math.max(0, s.sponsors.nextRefresh - s.time))}</span>
    {/if}
  </header>

  {#if !unlocked}
    <div class="locked">
      <Icon name="lock" size={22} />
      <div>
        <b>Brands start calling at {fmt(SPONSORS_UNLOCK_FANS)} fans</b>
        <span class="bar"><i style="width:{Math.min(100, (s.fansRun / SPONSORS_UNLOCK_FANS) * 100)}%"></i></span>
      </div>
    </div>
  {:else}
    {#if v.m.sponsorIncomePct > 0}
      <div class="total">
        <Icon name="trending-up" size={18} />
        Sponsors are boosting all income by <b class="num">{fmtPct(v.m.sponsorIncomePct, false, 1)}</b>
      </div>
    {/if}

    <section>
      <h3 class="section-title">Active contracts</h3>
      {#if s.sponsors.active.length === 0}
        <p class="muted small">No sponsors yet. Sign an offer below.</p>
      {:else}
        <div class="cards">
          {#each s.sponsors.active as c (c.id)}
            {@const brand = BRAND_MAP.get(c.brandId)}
            {@const info = brand ? CATEGORY_INFO[brand.category] : undefined}
            {@const progress = goalProgress(s, c)}
            {#if brand && info}
              <div class="card active" style="--bc:{brand.color}">
                <div class="brand">
                  <span class="logo">{brand.name.slice(0, 2).toUpperCase()}</span>
                  <div>
                    <div class="bname">{brand.name}</div>
                    <div class="dim small">{info.label} · {stars(c.tier)}</div>
                  </div>
                  <span class="bonus num">+{fmtPct(c.incomePct * v.m.sponsorIncomeMult, false, 1)}</span>
                </div>
                <div class="perk"><Icon name={info.icon} size={13} /> {info.perk}</div>
                <div class="goal" class:done={c.completed}>
                  <div class="goal-head">
                    <span>{c.completed ? '✓ ' : ''}{goalLabel(c.goal.kind, c.goal.target)}</span>
                    <span class="num dim">{fmt(Math.min(progress, c.goal.target))}/{fmt(c.goal.target)}</span>
                  </div>
                  <span class="bar"><i style="width:{Math.min(100, (progress / c.goal.target) * 100)}%"></i></span>
                  {#if !c.completed}
                    {@const payout = Math.max(500 * (c.tier + 1), v.r.cpsNoBuffs * c.goal.rewardSeconds)}
                    <div class="payout-row small">
                      <span class="dim">Bonus payout:</span>
                      <b class="payout-val num">{money(payout)}</b>
                      {#if c.tier >= 2}<span class="dim">· +1 trophy</span>{/if}
                    </div>
                  {/if}
                </div>
                <div class="foot">
                  <span class="dim small num">{fmtTime(c.endsAt - s.time)} left</span>
                  {#if confirmCancel === c.id}
                    <button class="btn small danger" onclick={() => (game.cancelSponsor(c.id), (confirmCancel = null))}>End contract?</button>
                  {:else}
                    <button class="btn small" onclick={() => (confirmCancel = c.id)}>End early</button>
                  {/if}
                </div>
              </div>
            {/if}
          {/each}
        </div>
      {/if}
    </section>

    <section>
      <h3 class="section-title">Offers</h3>
      {#if s.sponsors.offers.length === 0}
        <p class="muted small">No offers on the table. New brands will call soon.</p>
      {:else}
        <div class="cards">
          {#each s.sponsors.offers as offer (offer.id)}
            {@const brand = BRAND_MAP.get(offer.brandId)}
            {@const info = brand ? CATEGORY_INFO[brand.category] : undefined}
            {@const block = blocker(offer)}
            {@const payout = Math.max(500 * (offer.tier + 1), v.r.cpsNoBuffs * offer.goal.rewardSeconds)}
            {#if brand && info}
              <div class="card" style="--bc:{brand.color}">
                <div class="brand">
                  <span class="logo">{brand.name.slice(0, 2).toUpperCase()}</span>
                  <div>
                    <div class="bname">{brand.name}</div>
                    <div class="dim small">{info.label} · {stars(offer.tier)}</div>
                  </div>
                  <span class="bonus num">+{fmtPct(offer.incomePct * v.m.sponsorIncomeMult, false, 1)}</span>
                </div>
                <p class="slogan small">“{brand.slogan}”</p>
                <div class="perk"><Icon name={info.icon} size={13} /> {info.perk}</div>
                <div
                  class="goal-offer small"
                  use:tooltip={() => ({ title: 'Bonus goal', lines: [`Complete during the contract for about ${money(payout)}${offer.tier >= 2 ? ' and a trophy' : ''}.`] })}
                >
                  <div class="goal-offer-main">
                    <Icon name="badge-check" size={13} />
                    <span>{goalLabel(offer.goal.kind, offer.goal.target)}</span>
                  </div>
                  <span class="payout-badge num">+{money(payout)}</span>
                </div>
                <div class="foot">
                  <span class="dim small">{fmtTime(offer.duration)} contract</span>
                  <button class="btn small" class:primary={!block} disabled={!!block} onclick={() => game.signSponsor(offer.id)}>
                    {block ?? 'Sign'}
                  </button>
                </div>
              </div>
            {/if}
          {/each}
        </div>
      {/if}
    </section>

    {#if s.sponsors.history.length > 0}
      <section>
        <h3 class="section-title">Past sponsors</h3>
        <ul class="history">
          {#each s.sponsors.history.slice(0, 8) as h, i (`${h.brandId}-${h.endedAt}-${i}`)}
            <li>
              <span>{BRAND_MAP.get(h.brandId)?.name ?? h.brandId}</span>
              <span class="dim small">{h.reason === 'crashed' ? 'collapsed' : h.reason}{h.completed ? ' · goal met' : ''}</span>
            </li>
          {/each}
        </ul>
      </section>
    {/if}
  {/if}
</div>

<style>
  .sponsors {
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
  .total {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 9px;
    border: 1px solid color-mix(in srgb, var(--green) 40%, transparent);
    background: color-mix(in srgb, var(--green) 8%, transparent);
    color: var(--green);
  }
  .total b {
    color: var(--text);
  }
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 8px;
  }
  .card {
    display: flex;
    flex-direction: column;
    gap: 7px;
    padding: 10px;
    border-radius: 10px;
    border: 1px solid color-mix(in srgb, var(--bc) 35%, var(--line));
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--bc) 12%, transparent), transparent 55%),
      var(--bg-2);
  }
  .card.active {
    border-color: color-mix(in srgb, var(--bc) 70%, var(--line));
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .logo {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 9px;
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 14px;
    color: var(--bg);
    background: var(--bc);
    flex: none;
  }
  .bname {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 16px;
    line-height: 1.1;
  }
  .bonus {
    margin-left: auto;
    font-family: var(--font-display);
    font-weight: 700;
    color: var(--green);
  }
  .slogan {
    font-style: italic;
    color: var(--dim);
  }
  .perk {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12.5px;
    color: var(--bc);
  }
  .goal-offer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    font-size: 12.5px;
    color: var(--gold);
  }
  .goal-offer-main {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .payout-badge {
    color: var(--green);
    font-weight: 700;
    margin-left: auto;
  }
  .payout-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 2px;
  }
  .payout-val {
    color: var(--green);
  }
  .goal {
    display: flex;
    flex-direction: column;
    gap: 3px;
    font-size: 12.5px;
  }
  .goal-head {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .goal .bar i {
    background: var(--gold);
  }
  .goal.done {
    color: var(--green);
  }
  .goal.done .bar i {
    background: var(--green);
  }
  .foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    margin-top: auto;
  }
  .history {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .history li {
    display: flex;
    justify-content: space-between;
    padding: 4px 8px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.02);
    font-size: 13px;
  }
</style>
