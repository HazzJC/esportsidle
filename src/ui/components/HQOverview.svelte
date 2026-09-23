<script lang="ts">
  import { GAMES } from '../../data/games';
  import { TREND_MAP } from '../../data/merch';
  import { OPERATIONS } from '../../data/operations';
  import { ROOMS } from '../../data/decor';
  import { fmt, fmtPct, money } from '../../engine/format';
  import { sectionOpen } from '../../engine/sections';
  import { roomLevel } from '../../engine/staff';
  import { game } from '../game.svelte';
  import { opSceneBackground } from '../opsArt';
  import { opColor } from '../theme';
  import { tooltip } from '../tooltip.svelte';
  import Icon from './Icon.svelte';
  import OrgLogo from './OrgLogo.svelte';

  const v = $derived(game.view);
  const s = $derived(v.s);
  const r = $derived(v.r);
  const m = $derived(v.m);

  /** The org's biggest operation sets the scene behind the banner. */
  const topOp = $derived([...OPERATIONS].reverse().find((op) => s.ops[op.id].owned > 0));
  const scene = $derived(topOp ? opSceneBackground(topOp.id, opColor(topOp.index)) : undefined);
  const room = $derived(ROOMS[roomLevel(s)]);
  const buildings = $derived(OPERATIONS.reduce((n, op) => n + s.ops[op.id].owned, 0));

  // Where the money comes from right now. Sponsors multiply everything, so they are a badge, not a slice.
  const mix = $derived.by(() => {
    const parts = [
      { id: 'ops', label: 'Operations', value: r.cps, color: 'var(--accent)' },
      { id: 'match', label: 'Matches', value: r.matchCps, color: 'var(--green)' },
      { id: 'merch', label: 'Merch', value: r.merchCps, color: 'var(--gold)' },
    ];
    const total = parts.reduce((n, p) => n + p.value, 0) || 1;
    return parts.map((p) => ({ ...p, share: p.value / total }));
  });

  const teams = $derived(Object.values(r.teams).filter((t) => t.active));
  const avgWin = $derived(teams.length ? teams.reduce((n, t) => n + t.winChance, 0) / teams.length : 0);
  const gamesOpen = $derived(GAMES.filter((g) => s.games[g.id]?.unlocked).length);
  const merchLines = $derived(Object.values(r.merchLines));
  const onTrend = $derived(merchLines.filter((l) => l.trending).length);
  const trend = $derived(TREND_MAP.get(s.merch.trend));

  function open(tab: 'teams' | 'studio' | 'sponsors'): void {
    game.tab = tab;
    game.mobileView = 'center';
  }
</script>

<section class="overview" style="--scene:{scene ?? 'none'}">
  <div class="banner">
    <span class="logo"><OrgLogo name={s.org.name} primary={s.org.primary} secondary={s.org.secondary} size={58} shape={s.org.emblem.shape} mark={s.org.emblem.mark} /></span>
    <div class="who">
      <b class="name">{s.org.name}</b>
      <span class="sub">{room.name} · Run {s.prestige.runs + 1}{#if s.prestige.level > 0} · Legacy {s.prestige.level}{/if}</span>
    </div>
    <div class="income" use:tooltip={() => ({ title: 'Income per second', icon: 'trending-up', lines: [`Operations, matches and merch together.`, ...(m.sponsorIncomePct > 0 ? [{ text: `Sponsors add ${fmtPct(m.sponsorIncomePct, false, 1)} to all of it.`, tone: 'good' as const }] : [])] })}>
      <span class="big num">{money(r.totalCps, 1)}<small>/s</small></span>
      <span class="chips">
        {#if r.buffIncomeMult > 1}<span class="chip buff"><Icon name="zap" size={11} /> ×{fmt(r.buffIncomeMult, 1)} boost</span>{/if}
        {#if m.sponsorIncomePct > 0}<span class="chip spons"><Icon name="handshake" size={11} /> +{fmtPct(m.sponsorIncomePct, false, 0)}</span>{/if}
      </span>
    </div>
  </div>

  <div class="mix" aria-label="Where income comes from">
    <div class="bar">
      {#each mix as p (p.id)}
        {#if p.share > 0.004}<i style="width:{p.share * 100}%; background:{p.color}" title="{p.label} {fmtPct(p.share)}"></i>{/if}
      {/each}
    </div>
    <div class="legend">
      {#each mix as p (p.id)}
        <span><i style="background:{p.color}"></i>{p.label} <b class="num">{fmtPct(p.share, false, 0)}</b></span>
      {/each}
    </div>
  </div>

  <div class="tiles">
    <button class="tile" style="--k:var(--accent)" onclick={() => (game.mobileView = 'store')}>
      <span class="ticon"><Icon name="landmark" size={18} /></span>
      <span class="tbody">
        <span class="tlabel">Operations</span>
        <b class="num">{money(r.cps, 1)}/s</b>
        <span class="tsub">{fmt(buildings)} buildings{#if topOp}{' · best: ' + topOp.plural}{/if}</span>
      </span>
    </button>
    <button class="tile" style="--k:var(--green)" disabled={!sectionOpen(s, 'teams')} onclick={() => open('teams')}>
      <span class="ticon"><Icon name="swords" size={18} /></span>
      <span class="tbody">
        <span class="tlabel">Teams</span>
        <b class="num">{money(r.matchCps, 1)}/s</b>
        <span class="tsub">{gamesOpen} {gamesOpen === 1 ? 'team' : 'teams'}{#if teams.length}{' · ' + fmtPct(avgWin, false, 0) + ' avg win'}{/if}</span>
      </span>
    </button>
    <button class="tile" style="--k:var(--gold)" disabled={!sectionOpen(s, 'studio')} onclick={() => open('studio')}>
      <span class="ticon"><Icon name="shirt" size={18} /></span>
      <span class="tbody">
        <span class="tlabel">Merch</span>
        {#if merchLines.length}
          <b class="num">{money(r.merchCps, 1)}/s</b>
          <span class="tsub" class:warn={onTrend < merchLines.length}>{onTrend}/{merchLines.length} lines on {trend?.name ?? 'trend'}</span>
        {:else}
          <b class="dim">Not selling yet</b>
          <span class="tsub">Launch a product in the Studio</span>
        {/if}
      </span>
    </button>
    <button class="tile" style="--k:var(--accent-2)" disabled={!sectionOpen(s, 'sponsors')} onclick={() => open('sponsors')}>
      <span class="ticon"><Icon name="handshake" size={18} /></span>
      <span class="tbody">
        <span class="tlabel">Sponsors</span>
        <b class="num">{m.sponsorIncomePct > 0 ? `+${fmtPct(m.sponsorIncomePct, false, 0)}` : '—'}</b>
        <span class="tsub" class:warn={s.sponsors.active.length < m.sponsorSlots && sectionOpen(s, 'sponsors')}>{s.sponsors.active.length}/{m.sponsorSlots} slots signed</span>
      </span>
    </button>
  </div>
</section>

<style>
  .overview {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    border-radius: 14px;
    border: 1px solid color-mix(in srgb, var(--accent) 25%, var(--line));
    background: var(--bg-2);
  }
  /* The org's best operation scene, darkened on the left so the text stays readable. */
  .banner {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 84px;
    padding: 10px 14px;
    border-radius: 10px;
    overflow: hidden;
    background:
      linear-gradient(90deg, rgba(8, 8, 14, 0.82) 0%, rgba(8, 8, 14, 0.35) 50%, rgba(8, 8, 14, 0.55) 100%),
      var(--scene) left bottom / auto 100% repeat-x,
      #111220;
  }
  /* A slow sweep of light across the banner, like a stadium spotlight passing over. */
  .banner::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(105deg, transparent 35%, rgba(255, 255, 255, 0.07) 50%, transparent 65%);
    transform: translateX(-100%);
    animation: sweep 7s ease-in-out infinite;
    pointer-events: none;
  }
  @keyframes sweep {
    60%,
    100% {
      transform: translateX(100%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .banner::after {
      display: none;
    }
  }
  .logo {
    position: relative;
    z-index: 1;
    flex: none;
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.6));
  }
  .who,
  .income {
    position: relative;
    z-index: 1;
  }
  .who {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }
  .name {
    font-family: var(--font-display);
    font-size: 18px;
    letter-spacing: 0.04em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.7);
  }
  .sub {
    font-size: 12px;
    color: var(--muted);
  }
  .income {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 3px;
    text-align: right;
  }
  .big {
    font-family: var(--font-display);
    font-size: 24px;
    font-weight: 900;
    line-height: 1;
    color: #fff;
    text-shadow: 0 0 14px color-mix(in srgb, var(--accent) 45%, transparent), 0 2px 4px rgba(0, 0, 0, 0.8);
  }
  .big small {
    font-size: 13px;
    color: var(--muted);
  }
  .chips {
    display: flex;
    gap: 4px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 1px 7px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    background: rgba(0, 0, 0, 0.5);
  }
  .chip.buff {
    color: var(--gold);
    border: 1px solid color-mix(in srgb, var(--gold) 60%, transparent);
  }
  .chip.spons {
    color: var(--green);
    border: 1px solid color-mix(in srgb, var(--green) 50%, transparent);
  }
  .mix .bar {
    display: flex;
    height: 8px;
    border-radius: 999px;
    overflow: hidden;
    background: var(--bg);
  }
  .mix .bar i {
    display: block;
    height: 100%;
    transition: width 0.6s ease;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin-top: 5px;
    font-size: 12px;
    color: var(--muted);
  }
  .legend i {
    display: inline-block;
    width: 8px;
    height: 8px;
    margin-right: 5px;
    border-radius: 2px;
  }
  .legend b {
    color: var(--text);
  }
  .tiles {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(230px, 100%), 1fr));
    gap: 8px;
  }
  .tile {
    min-width: 0;
    display: flex;
    align-items: flex-start;
    gap: 9px;
    padding: 9px 10px;
    border-radius: 10px;
    border: 1px solid color-mix(in srgb, var(--k) 30%, var(--line));
    background: linear-gradient(135deg, color-mix(in srgb, var(--k) 10%, transparent), transparent 60%), var(--bg);
    color: var(--text);
    text-align: left;
    transition:
      border-color 0.15s,
      transform 0.15s;
  }
  .tile:hover:not(:disabled) {
    border-color: var(--k);
    transform: translateY(-1px);
  }
  .tile:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .ticon {
    display: grid;
    place-items: center;
    flex: none;
    width: 32px;
    height: 32px;
    border-radius: 9px;
    color: var(--k);
    background: color-mix(in srgb, var(--k) 15%, transparent);
  }
  .tbody {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .tlabel {
    font-family: var(--font-display);
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .tbody b {
    font-family: var(--font-ui);
    font-size: 16px;
  }
  .tsub {
    font-size: 11.5px;
    color: var(--muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tsub.warn {
    color: var(--gold);
  }
  @media (max-width: 520px) {
    .tiles {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }
    .tile {
      padding: 8px;
      gap: 7px;
    }
    .ticon {
      display: none;
    }
    .banner {
      flex-wrap: wrap;
    }
    .income {
      width: 100%;
      align-items: flex-start;
      text-align: left;
    }
  }
</style>
