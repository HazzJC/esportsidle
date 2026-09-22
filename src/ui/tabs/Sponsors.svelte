<script lang="ts">
  import { BRAND_MAP, CATEGORY_INFO, SPONSORS_UNLOCK_FANS, SPONSOR_TIERS } from '../../data/sponsors';
  import { fmt, fmtPct, fmtTime, money } from '../../engine/format';
  import { GOAL_EARNINGS_SHARE, MIN_GOAL_SECONDS, goalDifficultyBonus, goalLabel, goalProgress, goalReward, goalRewardPotential, maxSponsorTier, offerRequirements, sponsorsUnlocked } from '../../engine/sponsors';
  import { brandLogoSvg } from '../brandArt';
  import { rarityColor } from '../theme';
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

  /** Tiers share the rarity ladder: two tiers to a band, so tier 10 is mythic red. */
  const tierColor = (tier: number) => rarityColor(Math.floor(tier / 2));
  const topTier = $derived(maxSponsorTier(s) + 1);
</script>

<div class="sponsors">
  <header class="head">
    <div>
      <h2 class="section-title">Sponsors <span class="dim">{s.sponsors.active.length}/{slots} slots</span></h2>
      <p class="muted small">
        Every deal has two parts: a boost that lasts <b>while the contract runs</b>, and a goal that pays a <b>one-off bonus</b> when you hit it.
        Harder goals come with stronger perks. Tiers {topTier < SPONSOR_TIERS.length ? `1 to ${topTier} are open; the Global Brand Portfolio legacy node opens up to tier ${SPONSOR_TIERS.length}` : `1 to ${topTier} are open`}.
      </p>
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
                  <span class="logo">{@html brandLogoSvg(brand.id, brand.color, brand.name)}</span>
                  <div class="bmeta">
                    <div class="bname">{brand.name}</div>
                    <div class="dim small">{info.label} · <b class="tier" style="--t:{tierColor(c.tier)}">Tier {c.tier + 1}</b></div>
                  </div>
                </div>
                <div class="zone during">
                  <div class="zone-head"><Icon name="clock" size={12} /> While signed <span class="num dim">· {fmtTime(Math.max(0, c.endsAt - s.time))} left</span></div>
                  <div class="zone-line"><Icon name="trending-up" size={13} /> <b class="num">+{fmtPct(c.incomePct * v.m.sponsorIncomeMult, false, 1)}</b> all income</div>
                  <div class="zone-line"><Icon name={info.icon} size={13} /> {info.perk(c.perkScale ?? 1)}</div>
                </div>
                <div class="zone reward" class:done={c.completed}>
                  <div class="zone-head"><Icon name="badge-check" size={12} /> Goal bonus <span class="dim">· paid once</span></div>
                  <div class="goal-head">
                    <span>{c.completed ? '✓ ' : ''}{goalLabel(c.goal.kind, c.goal.target)}</span>
                    <span class="num dim">{fmt(Math.min(progress, c.goal.target))}/{fmt(c.goal.target)}</span>
                  </div>
                  <span class="bar"><i style="width:{Math.min(100, (progress / c.goal.target) * 100)}%"></i></span>
                  {#if c.completed}
                    <span class="small good">Paid out{c.tier >= 2 ? ', and a trophy for the shelf' : ''}.</span>
                  {:else}
                    {@const payout = goalReward(s, c, v.r.cpsNoBuffs)}
                    {@const potential = goalRewardPotential(c.tier, c.goal.rewardSeconds, v.r.cpsNoBuffs, c.goal.kind)}
                    <div
                      class="payout-row small"
                      use:tooltip={() => ({
                        title: 'Goal bonus',
                        icon: 'badge-check',
                        lines: [
                          `Hitting the goal now pays ${money(payout)}, once.`,
                          { text: `It is ${Math.round(GOAL_EARNINGS_SHARE * 100)}% of what your org earns while the deal runs${goalDifficultyBonus(c.goal.kind) > 1 ? `, ×${goalDifficultyBonus(c.goal.kind)} for a harder goal` : ''}, up to ${money(potential)}.`, tone: 'muted' },
                          { text: `A goal hit early pays proportionally less: the full bonus needs ${fmtTime(c.goal.rewardSeconds)} on the contract.`, tone: 'muted' },
                          ...(c.tier >= 2 ? [{ text: 'Also puts a trophy on your shelf.', tone: 'gold' as const }] : []),
                        ],
                      })}
                    >
                      <span class="dim">Pays now</span>
                      <b class="payout-val num">{money(payout)}</b>
                      <span class="dim">of up to {money(potential)}</span>
                      {#if c.tier >= 2}<span class="trophy-chip"><Icon name="trophy" size={11} /> +1</span>{/if}
                    </div>
                  {/if}
                </div>
                <div class="foot">
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
            {@const payout = goalRewardPotential(offer.tier, offer.goal.rewardSeconds, v.r.cpsNoBuffs, offer.goal.kind)}
            {#if brand && info}
              <div class="card" style="--bc:{brand.color}">
                <div class="brand">
                  <span class="logo">{@html brandLogoSvg(brand.id, brand.color, brand.name)}</span>
                  <div class="bmeta">
                    <div class="bname">{brand.name}</div>
                    <div class="dim small">{info.label} · <b class="tier" style="--t:{tierColor(offer.tier)}">Tier {offer.tier + 1}</b></div>
                  </div>
                </div>
                <p class="slogan small">“{brand.slogan}”</p>
                <div class="zone during">
                  <div class="zone-head"><Icon name="clock" size={12} /> While signed <span class="num dim">· {fmtTime(offer.duration)} contract</span></div>
                  <div class="zone-line"><Icon name="trending-up" size={13} /> <b class="num">+{fmtPct(offer.incomePct * v.m.sponsorIncomeMult, false, 1)}</b> all income</div>
                  <div class="zone-line"><Icon name={info.icon} size={13} /> {info.perk(offer.perkScale ?? 1)}</div>
                </div>
                <div
                  class="zone reward"
                  use:tooltip={() => ({
                    title: 'Goal bonus',
                    icon: 'badge-check',
                    lines: [
                      `Worth up to ${money(payout)}, paid once${offer.tier >= 2 ? ', plus a trophy for the shelf' : ''}.`,
                      { text: `The bonus is ${Math.round(GOAL_EARNINGS_SHARE * 100)}% of what your org earns while the deal runs, and pays less if the goal is hit early.`, tone: 'muted' },
                      { text: `Goals are set so your org needs at least ${fmtTime(MIN_GOAL_SECONDS)} at its recent pace.`, tone: 'muted' },
                    ],
                  })}
                >
                  <div class="zone-head"><Icon name="badge-check" size={12} /> Goal bonus <span class="dim">· paid once</span></div>
                  <div class="goal-head">
                    <span>{goalLabel(offer.goal.kind, offer.goal.target)}</span>
                    <span class="payout-badge num">up to {money(payout)}{#if offer.tier >= 2}<Icon name="trophy" size={11} />{/if}</span>
                  </div>
                </div>
                <div class="foot">
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
  .logo {
    flex: none;
    width: 44px;
    height: 44px;
    filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.5));
  }
  .logo :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
  }
  .bmeta {
    min-width: 0;
  }
  .tier {
    color: var(--t);
  }
  .zone {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 7px 9px;
    border-radius: 8px;
    font-size: 12.5px;
  }
  .zone.during {
    border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
    background: color-mix(in srgb, var(--accent) 7%, transparent);
  }
  .zone.reward {
    border: 1px dashed color-mix(in srgb, var(--gold) 45%, transparent);
    background: color-mix(in srgb, var(--gold) 6%, transparent);
  }
  .zone.reward.done {
    border-style: solid;
    border-color: color-mix(in srgb, var(--green) 50%, transparent);
  }
  .zone-head {
    display: flex;
    align-items: center;
    gap: 5px;
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 10.5px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .zone-line {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .trophy-chip {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    color: var(--gold);
  }
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
  .slogan {
    font-style: italic;
    color: var(--dim);
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
  .goal-head {
    display: flex;
    justify-content: space-between;
    gap: 8px;
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
