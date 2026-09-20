<script lang="ts">
  import { GAMES, getGame } from '../../data/games';
  import { TRAIT_MAP, TRAITS } from '../../data/traits';
  import { fmtPct, fmtTime, money } from '../../engine/format';
  import { isPinned, pinnedRival, rerollCost } from '../../engine/market';
  import { ALL_STATS, RARITIES, STAT_LABEL } from '../../engine/players';
  import { tick } from 'svelte';
  import { hasRosterSpace } from '../../engine/teams';
  import Icon from '../components/Icon.svelte';
  import PlayerCard from '../components/PlayerCard.svelte';
  import RosterImpact from '../components/RosterImpact.svelte';
  import { previewSigning } from '../../engine/roster';
  import { game } from '../game.svelte';
  import { tooltip } from '../tooltip.svelte';
  import Guide from '../components/Guide.svelte';
  import { marketGuide } from '../guides';
  import { statTip } from '../statInfo';

  const v = $derived(game.view);
  const unlocked = $derived(GAMES.filter((g) => v.s.games[g.id]?.unlocked));
  const listings = $derived(v.s.market.listings.filter((l) => !game.marketFilter || l.player.gameId === game.marketFilter));
  const cost = $derived(rerollCost(v.r.cpsNoBuffs, v.s.market.rerolls));

  const guidePages = $derived(marketGuide(v.s));

  async function help() {
    game.showGuide('market');
    await tick();
    document.querySelector('.market .guide')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function openSlots(gameId: string): number {
    const team = v.s.teams[gameId];
    return team ? team.lineup.filter((id) => id === null).length : 0;
  }
</script>

<div class="market">
  <Guide id="market" title="Market guide" pages={guidePages} />
  <header class="head">
    <div>
      <h2 class="section-title">Transfer Market</h2>
      <p class="muted small">New players arrive in <span class="num">{fmtTime(v.s.market.nextRefresh - v.s.time)}</span>. Signing fees are paid once; players take a cut of their prize money.</p>
    </div>
    <div class="head-actions">
      <button class="btn" onclick={help} title="How to read the market and a player"><Icon name="help" size={14} /> Guide</button>
      <button class="btn" disabled={v.s.cash < cost} onclick={() => game.rerollMarket()}>
        <Icon name="refresh-cw" size={14} /> Scout now · {money(cost)}
      </button>
    </div>
  </header>

  {#if v.s.prestige.nodes.scout_bias !== undefined || v.s.prestige.nodes.scout_trait !== undefined}
    <div class="scout-focus">
      <span class="focus-title"><Icon name="crosshair" size={14} /> Scout Focus:</span>
      {#if v.s.prestige.nodes.scout_bias !== undefined}
        <label>
          Game:
          <select
            value={v.s.market.scouting?.gameBias ?? ''}
            onchange={(e) => game.setScouting({ gameBias: e.currentTarget.value || null })}
          >
            <option value="">Any game</option>
            {#each unlocked as g (g.id)}
              <option value={g.id}>{g.name}</option>
            {/each}
          </select>
        </label>
        <label>
          Tier:
          <select
            value={v.s.market.scouting?.rarityBias ?? ''}
            onchange={(e) => game.setScouting({ rarityBias: (e.currentTarget.value || null) as any })}
          >
            <option value="">Any tier</option>
            {#each RARITIES as r (r.id)}
              <option value={r.id}>{r.name}</option>
            {/each}
          </select>
        </label>
      {/if}
      {#if v.s.prestige.nodes.scout_trait !== undefined}
        <label>
          Trait:
          <select
            value={v.s.market.scouting?.traitFocus ?? ''}
            onchange={(e) => game.setScouting({ traitFocus: e.currentTarget.value || null })}
          >
            <option value="">Any trait (2× roll chance)</option>
            {#each TRAITS as t (t.id)}
              <option value={t.id}>{t.name} ({t.tone})</option>
            {/each}
          </select>
        </label>
      {/if}
    </div>
  {/if}

  <div class="filters">
    <button class:active={!game.marketFilter} onclick={() => (game.marketFilter = null)}>All</button>
    {#each unlocked as g (g.id)}
      {@const open = openSlots(g.id)}
      <button class:active={game.marketFilter === g.id} style="--gc:{g.color}" onclick={() => (game.marketFilter = g.id)}>
        <Icon name={g.icon} size={13} color={g.color} />
        {g.name}
        {#if open > 0}<span class="open">{open} open</span>{/if}
      </button>
    {/each}
  </div>

  {#if listings.length === 0}
    <div class="empty muted">
      <Icon name="search" size={36} />
      <p>No players available{game.marketFilter ? ` for ${getGame(game.marketFilter).name}` : ''} right now. Scout for more or wait for the next window.</p>
    </div>
  {:else}
    <div class="grid">
      {#each listings as l (l.player.id)}
        {@const p = l.player}
        {@const space = hasRosterSpace(v.s, p.gameId, v.m)}
        {@const isLegacy = l.currency === 'legacy'}
        {@const afford = isLegacy ? v.s.prestige.points >= l.price : v.s.cash >= l.price}
        {@const pinned = isPinned(v.s, p.id)}
        {@const replaces = pinned ? undefined : pinnedRival(v.s, p)}
        {@const scale = Math.max(p.potential, 100)}
        <div class="listing" class:pinned class:easter-egg={l.isEasterEgg}>
          {#if l.isEasterEgg}
            <span class="easter-egg-tag" use:tooltip={() => ({ title: 'Easter Egg Prospect', icon: 'sparkles', lines: ['A legendary esports figure has appeared! Acquirable with Legacy points.'] })}>
              <Icon name="sparkles" size={11} /> Easter Egg
            </span>
          {/if}
          <button
            class="pin"
            class:on={pinned}
            aria-pressed={pinned}
            onclick={() => game.togglePin(p.id)}
            use:tooltip={() => ({
              title: pinned ? 'Pinned' : 'Pin this prospect',
              icon: pinned ? 'pin-off' : 'pin',
              lines: [
                pinned ? 'They stay on the board through refreshes and scouting. Click to let them go.' : 'Keep them on the board through refreshes and scouting while you save up.',
                { text: `One pin per role${replaces ? `: this releases ${replaces.player.tag}` : ''}.`, tone: replaces ? 'gold' : 'muted' },
              ],
            })}
          >
            <Icon name={pinned ? 'pin-off' : 'pin'} size={14} />
          </button>
          <PlayerCard player={p} showCondition={false} />
          <RosterImpact preview={previewSigning(v.s, p, v.m)} />
          <div class="stats">
            {#each ALL_STATS as st (st)}
              <div class="stat" use:tooltip={() => statTip(st, getGame(p.gameId), p.stats[st])}>
                <span class="sl">{STAT_LABEL[st].slice(0, 3)}</span>
                <span class="sb">
                  <i style="width:{Math.min(100, (p.stats[st] / scale) * 100)}%"></i>
                  <b style="left:{(p.potential / scale) * 100}%" title="Potential {p.potential}"></b>
                </span>
                <span class="sv num">{p.stats[st]}</span>
              </div>
            {/each}
          </div>
          <div class="traits">
            {#each p.traits as id (id)}
              {@const t = TRAIT_MAP.get(id)}
              {#if t}
                <span class="trait {t.tone}" use:tooltip={() => ({ title: t.name, icon: t.icon, lines: [t.desc] })}>
                  <Icon name={t.icon} size={12} />
                  {t.name}
                </span>
              {/if}
            {/each}
          </div>
          <div class="foot">
            <span class="muted small">
              <span use:tooltip={() => ({ title: 'Potential', icon: 'trending-up', lines: ['The ceiling for every stat. The white vertical marker on the bars shows this limit.', { text: 'Players level up from match XP and bench training.', tone: 'muted' }] })}>Potential <b>{p.potential}</b></span>
              ·
              <span use:tooltip={() => ({ title: 'Cut', icon: 'handshake', lines: [`They keep ${fmtPct(p.cut)} of the prize money their team wins.`, { text: 'It comes out of winnings, never your bank. There are no wages.', tone: 'muted' }] })}>Cut <b>{fmtPct(p.cut)}</b></span>
            </span>
            <button
              class="btn small"
              class:primary={afford && space}
              class:legacy-btn={isLegacy}
              disabled={!afford || !space}
              onclick={() => game.signPlayer(p.id)}
              title={!space ? 'Roster full' : !afford ? (isLegacy ? 'Not enough legacy points' : 'Not enough cash') : 'Sign this player'}
            >
              {#if !space}
                Roster full
              {:else if isLegacy}
                <Icon name="award" size={13} /> Sign · {l.price} Legacy
              {:else}
                Sign · {money(l.price)}
              {/if}
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .market {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .head-actions {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .small {
    font-size: 12.5px;
    margin: 0;
  }
  .scout-focus {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    padding: 8px 12px;
    border-radius: 10px;
    border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--line-2));
    background: color-mix(in srgb, var(--accent) 8%, var(--bg-2));
    font-size: 12.5px;
    color: var(--muted);
  }
  .focus-title {
    display: flex;
    align-items: center;
    gap: 5px;
    color: var(--text);
    font-weight: 700;
  }
  .scout-focus label {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .scout-focus select {
    padding: 2px 8px;
    border-radius: 6px;
    border: 1px solid var(--line-2);
    background: var(--bg);
    color: var(--text);
    font-size: 12px;
  }
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .filters button {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid var(--line-2);
    background: var(--bg-2);
    color: var(--muted);
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 13px;
  }
  .filters button.active {
    color: var(--text);
    border-color: var(--gc, var(--accent));
    background: color-mix(in srgb, var(--gc, var(--accent)) 15%, var(--bg-2));
  }
  .open {
    font-size: 10px;
    padding: 0 5px;
    border-radius: 999px;
    background: var(--accent);
    color: #041318;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: 10px;
  }
  .listing {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
    border-radius: 12px;
    border: 1px solid var(--line);
    background: rgba(0, 0, 0, 0.15);
  }
  .listing.pinned {
    border-color: color-mix(in srgb, var(--gold) 55%, transparent);
    background: linear-gradient(160deg, color-mix(in srgb, var(--gold) 10%, transparent), rgba(0, 0, 0, 0.15) 60%);
  }
  .listing.easter-egg {
    border-color: color-mix(in srgb, #c084fc 60%, var(--gold));
    background: linear-gradient(160deg, rgba(192, 132, 252, 0.12), rgba(0, 0, 0, 0.2) 60%);
  }
  .easter-egg-tag {
    position: absolute;
    top: 6px;
    left: 6px;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 7px;
    border-radius: 999px;
    font-size: 10.5px;
    font-weight: 700;
    color: #f3e8ff;
    background: rgba(168, 85, 247, 0.35);
    border: 1px solid rgba(192, 132, 252, 0.5);
  }
  .legacy-btn {
    border-color: color-mix(in srgb, #c084fc 50%, var(--line-2));
    background: color-mix(in srgb, #c084fc 20%, var(--bg-2));
    color: #f3e8ff;
  }
  .legacy-btn.primary {
    background: #9333ea;
    border-color: #c084fc;
    color: #fff;
  }
  .pin {
    position: absolute;
    top: 6px;
    right: 6px;
    z-index: 1;
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 8px;
    border: 1px solid var(--line-2);
    background: var(--bg-2);
    color: var(--muted);
  }
  .pin:hover {
    color: var(--text);
    border-color: var(--gold);
  }
  .pin.on {
    color: #1a1406;
    background: var(--gold);
    border-color: var(--gold);
  }
  .stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3px 12px;
  }
  .stat {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
  }
  .sl {
    width: 26px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .sb {
    position: relative;
    flex: 1;
    height: 4px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.06);
  }
  .sb i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--gold), var(--accent));
  }
  .sb b {
    position: absolute;
    top: -2px;
    bottom: -2px;
    width: 2px;
    background: #fff;
    opacity: 0.75;
    border-radius: 1px;
    pointer-events: none;
  }
  .sv {
    width: 22px;
    text-align: right;
  }
  .traits {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .trait {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 1px 7px;
    border-radius: 999px;
    font-size: 11px;
    border: 1px solid var(--line-2);
    color: var(--muted);
  }
  .trait.good {
    color: var(--green);
    border-color: color-mix(in srgb, var(--green) 35%, transparent);
  }
  .trait.bad {
    color: var(--red);
    border-color: color-mix(in srgb, var(--red) 35%, transparent);
  }
  .trait.mixed {
    color: var(--gold);
    border-color: color-mix(in srgb, var(--gold) 35%, transparent);
  }
  .foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30px;
    text-align: center;
  }
</style>
