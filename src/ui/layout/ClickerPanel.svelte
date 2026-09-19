<script lang="ts">
  import { CROWD_BUFF_ID, HYPE_MAX } from '../../engine/clicker';
  import { fmt, fmtTime, money } from '../../engine/format';
  import Icon from '../components/Icon.svelte';
  import OrgLogo from '../components/OrgLogo.svelte';
  import { designUrl } from '../designImage';
  import { pendingLegacy } from '../../engine/prestige';
  import { game } from '../game.svelte';
  import { tooltip, type TipContent } from '../tooltip.svelte';

  interface Floater {
    id: number;
    x: number;
    y: number;
    text: string;
  }
  interface Particle {
    id: number;
    x: number;
    y: number;
    dx: number;
    dy: number;
    hue: number;
  }

  let floaters = $state<Floater[]>([]);
  let particles = $state<Particle[]>([]);
  let stage: HTMLDivElement | undefined = $state();
  let nextId = 0;

  const v = $derived(game.view);
  const s = $derived(v.s);
  const r = $derived(v.r);

  const crowd = $derived(s.buffs.find((b) => b.id === CROWD_BUFF_ID && b.endsAt > s.time));
  const ringPct = $derived(crowd ? (crowd.endsAt - s.time) / (crowd.endsAt - crowd.startedAt) : s.hype / HYPE_MAX);
  const pending = $derived(pendingLegacy(s));
  const logoDesign = $derived(s.org.logo ? s.designs[s.org.logo] : undefined);
  const logoUrl = $derived(logoDesign ? designUrl(logoDesign) : undefined);
  const activeBuffs = $derived(s.buffs.filter((b) => b.endsAt > s.time));
  const modifiers = $derived(s.events.modifiers.filter((m) => m.endsAt > s.time));
  const recent = $derived(
    Object.values(s.teams)
      .flatMap((t) => t.history.slice(0, 3).map((m) => ({ m, gameId: t.gameId })))
      .sort((a, b) => b.m.time - a.m.time)
      .slice(0, 3),
  );

  const incomeTip = (): TipContent => {
    const { r } = game.view;
    return {
      title: 'Income per second',
      icon: 'trending-up',
      iconColor: 'var(--accent)',
      lines: [
        `Operations: ${money(r.cps, 1)}/s`,
        `Matches (average): ${money(r.matchCps, 1)}/s`,
        ...(r.buffIncomeMult > 1 ? [{ text: `Buffs: ×${fmt(r.buffIncomeMult, 2)}`, tone: 'gold' as const }] : []),
      ],
    };
  };

  function onClick(e: MouseEvent) {
    const result = game.click();
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const keyboard = e.detail === 0;
    const x = keyboard ? rect.width / 2 : e.clientX - rect.left;
    const y = keyboard ? rect.height / 2 : e.clientY - rect.top;

    if (s.settings.floatingText) {
      const id = nextId++;
      floaters.push({ id, x: x + (Math.random() * 30 - 15), y, text: `+${money(result.gain, 1)}` });
      if (floaters.length > 24) floaters.splice(0, floaters.length - 24);
      setTimeout(() => {
        floaters = floaters.filter((f) => f.id !== id);
      }, 1000);
    }
    if (s.settings.particles && !s.settings.reducedMotion) {
      const burst: Particle[] = [];
      for (let i = 0; i < (result.crowd ? 24 : 5); i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 40 + Math.random() * (result.crowd ? 140 : 70);
        burst.push({
          id: nextId++,
          x,
          y,
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist,
          hue: Math.random() < 0.5 ? 188 : 312,
        });
      }
      particles.push(...burst);
      if (particles.length > 80) particles.splice(0, particles.length - 80);
      const ids = new Set(burst.map((p) => p.id));
      setTimeout(() => {
        particles = particles.filter((p) => !ids.has(p.id));
      }, 700);
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.repeat) e.preventDefault();
  }

  const cashTip = (): TipContent => {
    const { s, r } = game.view;
    return {
      title: 'Cash',
      icon: 'dollar-sign',
      iconColor: 'var(--gold)',
      lines: [
        `Earning ${money(r.cps, 1)} per second.`,
        { text: `${money(s.earnedRun)} earned this run.`, tone: 'muted' },
        { text: `Clicks are worth ${money(r.click, 1)}.`, tone: 'muted' },
      ],
    };
  };

  const fansTip = (): TipContent => {
    const { s, r, m } = game.view;
    return {
      title: 'Fans',
      icon: 'heart',
      iconColor: 'var(--accent-2)',
      lines: [
        `${fmt(s.fans)} fans, gaining ${fmt(r.fansPerSec, 1)} per second.`,
        { text: `Fame multiplies all income by ×${r.fameMult.toFixed(3)}.`, tone: 'good' },
        { text: `Fame power: ${m.fameExp.toFixed(3)} (more fans and Fame upgrades raise this bonus).`, tone: 'muted' },
      ],
    };
  };

  const hypeTip = (): TipContent => ({
    title: 'Hype Meter',
    icon: 'megaphone',
    iconColor: 'var(--accent-2)',
    lines: [
      'Clicking your logo fills the hype meter.',
      'When it is full, the crowd goes wild: income ×2 for 30 seconds.',
      { text: 'Hype drains if you stop clicking.', tone: 'muted' },
    ],
  });
</script>

<div class="clicker panel">
  <div class="head">
    <div class="cash num" use:tooltip={cashTip}>{money(s.cash)}</div>
    <div class="cps num" class:buffed={r.buffIncomeMult > 1} use:tooltip={incomeTip}>
      {money(r.totalCps, 1)} <span>per second</span>
    </div>
    <div class="subline">
      <span class="fans num" use:tooltip={fansTip}>
        <Icon name="heart" size={14} />
        {fmt(s.fans)} fans
        <span class="muted">+{fmt(r.fansPerSec, 1)}/s</span>
      </span>
      {#if pending >= 1}
        <button
          class="legacy-chip num"
          onclick={() => ((game.tab = 'legacy'), (game.mobileView = 'center'))}
          use:tooltip={() => ({
            title: 'Sell the Org',
            icon: 'crown',
            iconColor: 'var(--gold)',
            lines: [`Selling now earns ${fmt(pendingLegacy(game.view.s))} legacy: +1% income forever each.`, { text: 'Open the Legacy tab to sell.', tone: 'muted' }],
          })}
        >
          <Icon name="crown" size={13} /> +{fmt(pending)} legacy
        </button>
      {/if}
      {#if s.stats.trophiesTotal > 0}
        <span
          class="trophies num"
          use:tooltip={() => ({
            title: 'Trophies',
            icon: 'trophy',
            iconColor: 'var(--gold)',
            lines: ['Won from season titles and tournaments.', { text: 'Spend them on operation levels (HQ) and trophy upgrades.', tone: 'muted' }],
          })}
        >
          <Icon name="trophy" size={14} />
          {fmt(s.trophies)}
        </span>
      {/if}
    </div>
  </div>

  <div class="stage" bind:this={stage}>
    <div class="spotlight" class:crowd={!!crowd}></div>
    <svg class="ring" viewBox="0 0 100 100" aria-hidden="true">
      <circle class="track" cx="50" cy="50" r="47" pathLength="100" />
      <circle
        class="fill"
        class:crowd={!!crowd}
        cx="50"
        cy="50"
        r="47"
        pathLength="100"
        stroke-dasharray="{Math.max(0, Math.min(1, ringPct)) * 100} 100"
      />
    </svg>
    <button class="logo" class:crowd={!!crowd} class:tut-target={s.tutorial.step === 'click'} onclick={onClick} onkeydown={onKeyDown} aria-label="Hype your org (click)">
      <OrgLogo name={s.org.name} primary={s.org.primary} secondary={s.org.secondary} size={190} {logoUrl} />
    </button>
    {#each particles as p (p.id)}
      <i class="particle" style="left:{p.x}px; top:{p.y}px; --dx:{p.dx}px; --dy:{p.dy}px; --h:{p.hue}"></i>
    {/each}
    {#each floaters as f (f.id)}
      <span class="floater num" style="left:{f.x}px; top:{f.y}px">{f.text}</span>
    {/each}
  </div>

  <div class="hype" use:tooltip={hypeTip}>
    {#if crowd}
      <span class="crowd-text">CROWD GOES WILD · ×2 income · {fmtTime(crowd.endsAt - s.time)}</span>
    {:else}
      <span class="muted">Hype</span>
      <span class="bar"><i style="width:{(s.hype / HYPE_MAX) * 100}%"></i></span>
      <span class="num muted">{Math.floor(s.hype)}%</span>
    {/if}
  </div>

  {#if activeBuffs.length > 0 || modifiers.length > 0}
    <div class="buffs">
      {#each modifiers as m (m.id)}
        {@const frac = (m.endsAt - s.time) / Math.max(0.001, m.endsAt - m.startedAt)}
        <div
          class="buff mod {m.tone}"
          use:tooltip={() => ({
            title: m.name,
            icon: m.icon,
            iconColor: m.tone === 'bad' ? 'var(--red)' : 'var(--accent)',
            lines: [m.desc, { text: `${fmtTime(m.endsAt - game.view.s.time)} remaining`, tone: 'muted' }],
          })}
        >
          <Icon name={m.icon} size={18} />
          <span class="buff-bar"><i style="width:{frac * 100}%"></i></span>
        </div>
      {/each}
      {#each activeBuffs as b (b.id)}
        {@const frac = (b.endsAt - s.time) / Math.max(0.001, b.endsAt - b.startedAt)}
        <div
          class="buff {b.tone}"
          use:tooltip={() => ({
            title: b.name,
            icon: b.icon,
            iconColor: b.tone === 'bad' ? 'var(--red)' : 'var(--green)',
            lines: [b.desc, { text: `${fmtTime(b.endsAt - game.view.s.time)} remaining`, tone: 'muted' }],
          })}
        >
          <Icon name={b.icon} size={18} />
          <span class="buff-bar"><i style="width:{frac * 100}%"></i></span>
        </div>
      {/each}
    </div>
  {/if}

  {#if recent.length > 0}
    <div class="recent">
      {#each recent as { m, gameId } (`${gameId}-${m.time}`)}
        <button class="match" class:win={m.win} onclick={() => (game.tab = 'teams', game.mobileView = 'center')}>
          <span class="wl">{m.win ? 'W' : 'L'}</span>
          <span class="vs">{m.score} vs {m.opponent}{#if m.rival}<span class="derby" title="Derby against your rival"><Icon name="swords" size={11} /></span>{/if}</span>
          <span class="prize num">+{money(m.prize)}</span>
        </button>
      {/each}
    </div>
  {/if}

  <div class="footer muted">Click value <span class="num">{money(r.click, 1)}</span></div>
</div>

<style>
  .derby {
    display: inline-grid;
    place-items: center;
    margin-left: 4px;
    color: var(--gold);
    vertical-align: -1px;
  }
  .clicker {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 14px 12px;
    gap: 10px;
    overflow: hidden;
    position: relative;
  }
  .head {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .cash {
    font-family: var(--font-display);
    font-weight: 900;
    font-size: clamp(22px, 2.3vw, 30px);
    letter-spacing: 0.02em;
    text-shadow: 0 0 18px color-mix(in srgb, var(--accent) 35%, transparent);
  }
  .cps {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 15px;
    color: var(--accent);
  }
  .cps span {
    color: var(--muted);
    font-weight: 500;
  }
  .cps.buffed {
    color: var(--gold);
  }
  .subline {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .fans,
  .trophies {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    font-size: 13px;
    color: var(--accent-2);
  }
  .trophies {
    color: var(--gold);
    font-weight: 700;
  }
  .legacy-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 1px 8px;
    border-radius: 999px;
    border: 1px solid var(--gold);
    background: color-mix(in srgb, var(--gold) 14%, transparent);
    color: var(--gold);
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 12px;
    animation: pulse 1.6s ease-in-out infinite;
  }
  .buff.mod {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 10%, transparent);
    color: var(--accent);
    border-style: dashed;
  }
  .buff.mod.bad {
    border-color: var(--red);
    background: color-mix(in srgb, var(--red) 10%, transparent);
    color: var(--red);
  }
  .stage {
    position: relative;
    width: 250px;
    height: 250px;
    flex: none;
    display: grid;
    place-items: center;
    margin: 6px 0;
  }
  .spotlight {
    position: absolute;
    inset: -20px;
    border-radius: 50%;
    background: radial-gradient(circle, color-mix(in srgb, var(--accent) 18%, transparent), transparent 65%);
    animation: breathe 4s ease-in-out infinite;
    pointer-events: none;
  }
  .spotlight.crowd {
    background: radial-gradient(circle, color-mix(in srgb, var(--gold) 30%, transparent), transparent 65%);
    animation-duration: 0.8s;
  }
  .ring {
    position: absolute;
    inset: 0;
    transform: rotate(-90deg);
    pointer-events: none;
  }
  .ring circle {
    fill: none;
    stroke-width: 3;
  }
  .ring .track {
    stroke: rgba(255, 255, 255, 0.07);
  }
  .ring .fill {
    stroke: var(--accent-2);
    stroke-linecap: round;
    filter: drop-shadow(0 0 3px var(--accent-2));
    transition: stroke-dasharray 0.15s linear;
  }
  .ring .fill.crowd {
    stroke: var(--gold);
    filter: drop-shadow(0 0 4px var(--gold));
  }
  .logo {
    position: relative;
    border: none;
    background: transparent;
    padding: 0;
    border-radius: 50%;
    display: grid;
    place-items: center;
    transition: transform 0.08s ease-out;
    animation: bob 5s ease-in-out infinite;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  .logo:hover {
    transform: scale(1.03);
  }
  .logo:active {
    transform: scale(0.94);
  }
  .logo:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 6px;
  }
  .logo.crowd {
    animation: bob 0.6s ease-in-out infinite;
  }
  .floater {
    position: absolute;
    transform: translate(-50%, -50%);
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 17px;
    color: #fff;
    text-shadow:
      0 0 8px color-mix(in srgb, var(--accent) 90%, transparent),
      0 2px 2px rgba(0, 0, 0, 0.6);
    pointer-events: none;
    white-space: nowrap;
    animation: float-up 1s ease-out forwards;
  }
  .particle {
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 2px;
    background: hsl(var(--h) 100% 60%);
    box-shadow: 0 0 6px hsl(var(--h) 100% 60%);
    pointer-events: none;
    animation: burst 0.7s ease-out forwards;
  }
  .hype {
    width: 100%;
    max-width: 260px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-family: var(--font-ui);
    font-weight: 700;
    min-height: 20px;
  }
  .hype .bar {
    flex: 1;
  }
  .hype .bar i {
    background: linear-gradient(90deg, var(--accent), var(--accent-2));
  }
  .crowd-text {
    width: 100%;
    text-align: center;
    color: var(--gold);
    letter-spacing: 0.05em;
    animation: pulse 0.8s ease-in-out infinite;
  }
  .buffs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
  }
  .buff {
    width: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 5px 4px 4px;
    border-radius: 8px;
    border: 1px solid var(--green);
    background: color-mix(in srgb, var(--green) 10%, transparent);
    color: var(--green);
  }
  .buff.bad {
    border-color: var(--red);
    background: color-mix(in srgb, var(--red) 10%, transparent);
    color: var(--red);
  }
  .buff-bar {
    width: 100%;
    height: 3px;
    border-radius: 2px;
    background: rgba(0, 0, 0, 0.4);
    overflow: hidden;
  }
  .buff-bar i {
    display: block;
    height: 100%;
    background: currentColor;
  }
  .footer {
    font-size: 12px;
  }
  .recent {
    margin-top: auto;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .match {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 3px 8px;
    border-radius: 6px;
    border: 1px solid var(--line);
    background: color-mix(in srgb, var(--red) 6%, transparent);
    font-size: 12px;
    text-align: left;
  }
  .match.win {
    background: color-mix(in srgb, var(--green) 6%, transparent);
  }
  .wl {
    font-weight: 800;
    color: var(--red);
  }
  .match.win .wl {
    color: var(--green);
  }
  .vs {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--muted);
  }
  .prize {
    color: var(--gold);
  }
  .ring {
    overflow: visible;
  }
  @keyframes float-up {
    from {
      opacity: 1;
      transform: translate(-50%, -50%);
    }
    to {
      opacity: 0;
      transform: translate(-50%, -140%);
    }
  }
  @keyframes burst {
    from {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    to {
      opacity: 0;
      transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.3);
    }
  }
  @keyframes breathe {
    0%,
    100% {
      opacity: 0.7;
      transform: scale(0.96);
    }
    50% {
      opacity: 1;
      transform: scale(1.04);
    }
  }
  @keyframes bob {
    0%,
    100% {
      translate: 0 0;
    }
    50% {
      translate: 0 -4px;
    }
  }
  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.65;
    }
  }
  @media (max-height: 700px) {
    .stage {
      width: 210px;
      height: 210px;
    }
    .logo :global(svg) {
      width: 160px;
      height: 160px;
    }
  }
</style>
