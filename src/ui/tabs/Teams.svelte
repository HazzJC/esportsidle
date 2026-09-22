<script lang="ts">
  import { GAMES, GENRE_LABEL, type GameDef } from '../../data/games';
  import { SEASON_PLANS, SEASON_PLAN_ORDER, type SeasonPlan } from '../../data/seasonPlans';
  import { PROMOTE_WINS, RELEGATE_WINS, SEASON_LENGTH, TITLE_WINS, prizeSeconds, tierName } from '../../data/leagues';
  import { tutorialPlayer } from '../../data/tutorial';
  import { fmt, fmtPct, fmtTime, money } from '../../engine/format';
  import { BENCH_RECOVERY_MULT, HEALTH_ICON } from '../../engine/health';
  import { isAvailable, skillRating } from '../../engine/players';
  import { CHALLENGE_WIN_CHANCE, teamKit } from '../../engine/teams';
  import { BORED_FORM, ENGAGED_MAX, ENGAGED_MIN, MOODS, teamMood } from '../../engine/mood';
  import { seasonSummary } from '../../engine/stories';
  import type { Player } from '../../engine/types';
  import Avatar from '../components/Avatar.svelte';
  import FirstPlayer from '../components/FirstPlayer.svelte';
  import Icon from '../components/Icon.svelte';
  import KitPicker from '../components/KitPicker.svelte';
  import Modal from '../components/Modal.svelte';
  import Rig from '../components/Rig.svelte';
  import Sparkline from '../components/Sparkline.svelte';
  import TutArrow from '../components/TutArrow.svelte';
  import { gameLogoSvg } from '../gameArt';
  import { game } from '../game.svelte';
  import { previewAssign } from '../../engine/roster';
  import { tip, tooltip, type TipContent } from '../tooltip.svelte';
  import Guide from '../components/Guide.svelte';
  import { teamsGuide } from '../guides';
  import { onDestroy, tick } from 'svelte';

  const TEAMS_GUIDE = teamsGuide();

  /** Brings the guide back and scrolls up to it. */
  async function help() {
    game.showGuide('teams');
    await tick();
    document.querySelector('.teams .guide')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  const planHelp = (): TipContent => ({
    title: 'Season plan',
    icon: 'activity',
    lines: [
      'How hard the team competes this season, how much the players learn and how fast they tire.',
      { text: 'Development: grow players. Balanced: the default. Push: chase promotion now.', tone: 'muted' },
      { text: 'Click for the full guide.', tone: 'cyan' },
    ],
  });

  const v = $derived(game.view);
  /** Game id whose kit is being edited. */
  let kitGame: string | null = $state(null);
  const kitTeam = $derived(kitGame ? v.s.teams[kitGame] : undefined);
  const nextLocked = $derived(GAMES.find((g) => !v.s.games[g.id]?.unlocked));
  const lockedCount = $derived(GAMES.filter((g) => !v.s.games[g.id]?.unlocked).length);

  // The roster at a glance, folded in from the old Roster page.
  const playerCount = $derived(Object.keys(v.s.players).length);
  const avgCut = $derived.by(() => {
    const list = Object.values(v.s.players).filter((p) => !p.founder);
    return list.length ? list.reduce((a, p) => a + p.cut, 0) / list.length : 0;
  });
  const hurtCount = $derived(Object.values(v.s.players).filter((p) => !isAvailable(p, v.s.time)).length);

  // ---------------------------------------------------------------------------------------------
  // Drag and drop
  //
  // Players are picked up with the pointer (mouse, pen or a long press on touch) and carried as a
  // floating card; stations and the bench light up as drop targets. Nothing in the page changes
  // size while a card is in the air: the card left behind only fades, and every hint is drawn over
  // its target rather than pushed into the layout.
  // ---------------------------------------------------------------------------------------------
  type From = number | 'bench';
  interface Drag {
    gameId: string;
    playerId: string;
    from: From;
    x: number;
    y: number;
    /** The drop target under the pointer: "slot:<game>:<index>", "bench:<game>" or "swap:<game>:<bench player>". */
    over: string | null;
  }
  interface Press {
    gameId: string;
    playerId: string;
    from: From;
    x0: number;
    y0: number;
    touch: boolean;
    timer: ReturnType<typeof setTimeout> | undefined;
  }

  /** How long a finger rests on a player before it picks them up, so a swipe still scrolls. */
  const LONG_PRESS_MS = 250;
  const EDGE = 56;

  let drag = $state<Drag | null>(null);
  let press: Press | null = null;
  let suppressClick = false;
  let scroller: HTMLElement | null = null;
  let edgeFrame = 0;
  let root: HTMLElement | undefined = $state();

  const dragPlayer = $derived(drag ? v.s.players[drag.playerId] : undefined);

  function onPress(e: PointerEvent, gameId: string, playerId: string, from: From) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    endPress();
    press = { gameId, playerId, from, x0: e.clientX, y0: e.clientY, touch: e.pointerType !== 'mouse', timer: undefined };
    if (press.touch) {
      press.timer = setTimeout(() => {
        if (press) begin(press.x0, press.y0);
      }, LONG_PRESS_MS);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', cancel);
  }

  function begin(x: number, y: number) {
    if (!press) return;
    drag = { gameId: press.gameId, playerId: press.playerId, from: press.from, x, y, over: null };
    drag.over = targetAt(x, y);
    clearTimeout(press.timer);
    tip.hide();
    if (press.touch) navigator.vibrate?.(12);
    scroller = scrollParent(root ?? null);
    document.body.classList.add('dragging-player');
    edgeFrame = requestAnimationFrame(edgeScroll);
  }

  function onMove(e: PointerEvent) {
    if (drag) {
      drag.x = e.clientX;
      drag.y = e.clientY;
      drag.over = targetAt(e.clientX, e.clientY);
      if (tip.anchor) tip.hide();
      return;
    }
    if (!press) return;
    const moved = Math.hypot(e.clientX - press.x0, e.clientY - press.y0);
    if (press.touch) {
      // Moving before the long press lands means the finger wants to scroll.
      if (moved > 10) endPress();
    } else if (moved > 5) {
      begin(e.clientX, e.clientY);
    }
  }

  function onUp(e: PointerEvent) {
    if (drag) {
      drag.over = targetAt(e.clientX, e.clientY);
      const d = drag;
      finishDrag();
      suppressClick = true;
      setTimeout(() => (suppressClick = false), 0);
      if (d.over) drop(d, d.over);
    }
    endPress();
  }

  function cancel() {
    finishDrag();
    endPress();
  }

  function finishDrag() {
    drag = null;
    cancelAnimationFrame(edgeFrame);
    document.body.classList.remove('dragging-player');
  }

  function endPress() {
    if (press) clearTimeout(press.timer);
    press = null;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', cancel);
  }

  onDestroy(cancel);

  /** Only this team's stations and bench take the player. */
  function targetAt(x: number, y: number): string | null {
    const el = document.elementFromPoint(x, y);
    const target = el?.closest<HTMLElement>('[data-drop]')?.dataset.drop ?? null;
    if (!target || !drag) return null;
    return target.split(':')[1] === drag.gameId ? target : null;
  }

  function drop(d: Drag, target: string) {
    const [kind, gameId, slot] = target.split(':');
    if (kind === 'slot') {
      if (d.from !== Number(slot)) game.assignSlot(gameId, d.playerId, Number(slot));
    } else if (kind === 'bench' && d.from !== 'bench') {
      game.benchPlayer(gameId, d.playerId);
    } else if (kind === 'swap' && typeof d.from === 'number' && slot !== d.playerId) {
      // A starter dropped on a substitute: the substitute takes the seat, the starter sits down.
      game.assignSlot(gameId, slot, d.from);
    }
  }

  /** The nearest scrolling box, so a card carried to the edge can scroll the page. */
  function scrollParent(el: HTMLElement | null): HTMLElement | null {
    for (let n = el?.parentElement; n; n = n.parentElement) {
      const oy = getComputedStyle(n).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight) return n;
    }
    return (document.scrollingElement as HTMLElement | null) ?? null;
  }

  function edgeScroll() {
    if (!drag) return;
    if (scroller) {
      const box = scroller === document.scrollingElement ? { top: 0, bottom: window.innerHeight } : scroller.getBoundingClientRect();
      if (drag.y < box.top + EDGE) scroller.scrollTop -= Math.ceil((box.top + EDGE - drag.y) / 5);
      else if (drag.y > box.bottom - EDGE) scroller.scrollTop += Math.ceil((drag.y - (box.bottom - EDGE)) / 5);
    }
    edgeFrame = requestAnimationFrame(edgeScroll);
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && drag) cancel();
  }

  /** Opens the player's page (gear, stats, looks), unless the click was the end of a drag. */
  function open(id: string) {
    if (suppressClick) return;
    game.selectedPlayer = id;
  }

  /** Moves the floating card to the end of <body>, clear of any panel that clips or transforms. */
  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return { destroy: () => node.remove() };
  }

  const isOver = (target: string) => drag?.over === target;
  const canTake = (gameId: string) => drag?.gameId === gameId;

  /** What dropping the carried player here would do to the win chance, in points. */
  const overDelta = $derived.by(() => {
    if (!drag?.over?.startsWith('slot:')) return null;
    const [, gameId, slot] = drag.over.split(':');
    if (drag.from === Number(slot)) return null;
    const preview = previewAssign(v.s, gameId, drag.playerId, Number(slot), v.m);
    return preview ? Math.round((preview.after.win - preview.before.win) * 100) : null;
  });

  // ---------------------------------------------------------------------------------------------

  function openMarket(gameId: string) {
    game.marketFilter = gameId;
    game.tab = 'market';
  }

  const times = (x: number) => (x === 1 ? 'normal' : `×${parseFloat(x.toFixed(2))}`);

  function planTip(id: SeasonPlan, deferred: boolean): TipContent {
    const d = SEASON_PLANS[id];
    return {
      title: d.name,
      subtitle: 'Season plan',
      icon: d.icon,
      lines: [
        d.summary,
        { text: `Team rating ${times(d.rating)} · XP ${times(d.xp)}`, tone: d.rating >= 1 ? 'good' : 'muted' },
        { text: `Fatigue ${times(d.drain)} · recovery ${times(d.recovery)}`, tone: 'muted' },
        { text: `Injury risk ${times(d.injuryRisk)}`, tone: d.injuryRisk > 1 ? 'bad' : d.injuryRisk < 1 ? 'good' : 'muted' },
        { text: d.benchXp > 0 ? `Bench players train at ${Math.round(d.benchXp * 100)}% of match XP` : 'Bench players do not train', tone: 'muted' },
        ...(deferred ? [{ text: 'Takes effect from next season.', tone: 'gold' as const }] : []),
      ],
    };
  }

  function popTip(g: GameDef): TipContent {
    const gp = game.view.s.games[g.id];
    const trend = gp.target > gp.popularity ? 'Trending up' : 'Cooling off';
    return {
      title: `${g.name} popularity`,
      icon: g.icon,
      iconColor: g.color,
      lines: [
        `×${gp.popularity.toFixed(2)} prize money and fans.`,
        { text: trend, tone: gp.target > gp.popularity ? 'good' : 'bad' },
        { text: 'Popularity drifts over time and reacts to patches, scandals and hype.', tone: 'muted' },
      ],
    };
  }

  function tierTip(g: GameDef): TipContent {
    const { s, r } = game.view;
    const team = s.teams[g.id];
    const ev = r.teams[g.id];
    return {
      title: tierName(team.tier),
      subtitle: `League tier ${team.tier + 1} · best ${team.bestTier + 1}`,
      icon: 'trophy',
      iconColor: 'var(--gold)',
      lines: [
        `Your team rating: ${fmt(ev?.rating ?? 0)} vs opponents ${fmt(ev?.opponent ?? 0)}.`,
        `Prize: ${money(g.basePrize)} × tier bonus + ${fmt(prizeSeconds(team.tier), 1)}s of operations income per win.`,
        { text: `${PROMOTE_WINS}+ wins promote · ${TITLE_WINS}+ wins take the league title and a trophy · ${RELEGATE_WINS} or fewer relegate.`, tone: 'muted' },
      ],
    };
  }

  function moodTip(g: GameDef): TipContent {
    const { s, r } = game.view;
    const team = s.teams[g.id];
    const ev = r.teams[g.id];
    const m = MOODS[teamMood(team)];
    const signed = (n: number) => (n > 0 ? `+${n}` : String(n));
    return {
      title: m.name,
      subtitle: `Team mood · form ${Math.round(team.form * 100)}%`,
      icon: m.icon,
      iconColor: m.tone === 'good' ? 'var(--green)' : m.tone === 'bad' ? 'var(--red)' : undefined,
      lines: [
        m.summary,
        { text: `Starters: XP ${times(m.xp)} · morale ${signed(m.moraleWin)} per win, ${signed(m.moraleLoss)} per loss`, tone: m.tone === 'bad' ? 'bad' : m.tone === 'good' ? 'good' : 'muted' },
        ...(ev && ev.stakes < 0.995
          ? [{ text: `Crowds ×${ev.stakes.toFixed(2)}: at ${Math.round(ev.winChance * 100)}% to win, matches are a foregone conclusion, so prize money and fans shrink.`, tone: 'bad' as const }]
          : []),
        { text: `Form follows roughly the last season. Players are fired up when they win ${Math.round(ENGAGED_MIN * 100)}–${Math.round(ENGAGED_MAX * 100)}% of matches and bored from ${Math.round(BORED_FORM * 100)}%.`, tone: 'muted' },
      ],
    };
  }

  function playerTip(id: string, benched: boolean): TipContent {
    const { s } = game.view;
    const p = s.players[id];
    if (!p) return { title: 'Player' };
    const out = !isAvailable(p, s.time);
    return {
      title: p.tag,
      subtitle: p.founder ? 'Founder' : `${p.first} ${p.last}`,
      icon: 'user',
      lines: [
        `Rating ${fmt(skillRating(p))} · Level ${p.level}`,
        `Energy ${Math.round(p.energy)} · Morale ${Math.round(p.morale)}`,
        ...(out
          ? [
              { text: `${p.status.reason || 'Unavailable'} · back in ${fmtTime(Math.max(0, p.status.until - s.time) / (benched ? BENCH_RECOVERY_MULT : 1))}`, tone: 'bad' as const },
              { text: benched ? `Resting: recovering ${BENCH_RECOVERY_MULT}× faster.` : `Bench them to recover ${BENCH_RECOVERY_MULT}× faster.`, tone: 'gold' as const },
            ]
          : []),
        { text: 'Click for gear and stats. Drag to move.', tone: 'muted' },
      ],
    };
  }

  function benchTip(): TipContent {
    return {
      title: 'The bench',
      icon: 'bed',
      lines: [
        `Drag a player here to rest them. Benched players recover energy faster, and shake off illness and injury ${BENCH_RECOVERY_MULT}× faster.`,
        { text: 'Drag a bench player onto a computer to bring them into the lineup.', tone: 'muted' },
        { text: 'Physios cut the risk of getting hurt; the Push for Promotion plan raises it.', tone: 'muted' },
      ],
    };
  }

  /** Seconds until a player is back, counting the bench speed-up. */
  const backIn = (p: Player, benched: boolean) => Math.max(0, p.status.until - v.s.time) / (benched ? BENCH_RECOVERY_MULT : 1);

  const ownedTeams = $derived(GAMES.filter((g) => v.s.games[g.id]?.unlocked && v.s.teams[g.id]));
  const outIn = (gameId: string) =>
    [...v.s.teams[gameId].lineup, ...v.s.teams[gameId].bench].filter((id) => {
      const p = id ? v.s.players[id] : undefined;
      return !!p && !isAvailable(p, v.s.time);
    }).length;

  /** Scrolls to a team, unfolding it first if it was folded. */
  async function jumpTo(gameId: string) {
    collapsed.delete(gameId);
    await tick();
    document.getElementById(`team-${gameId}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  function toggleFold(gameId: string) {
    if (collapsed.has(gameId)) collapsed.delete(gameId);
    else collapsed.add(gameId);
  }

  const restStep = $derived(v.s.tutorial.step === 'rest');
  const restPlayer = $derived(restStep ? tutorialPlayer(v.s) : undefined);
</script>

<svelte:window onkeydown={onKeydown} />

<div class="teams" bind:this={root}>
  <FirstPlayer />
  {#if Object.keys(v.s.teams).length > 0 && v.s.tutorial.step === 'done'}
    <Guide id="teams" title="How teams work" pages={TEAMS_GUIDE} />
  {/if}
  {#if playerCount > 0}
    <div class="summary">
      <span><b class="num">{fmt(playerCount)}</b> <span class="muted">player{playerCount === 1 ? '' : 's'}</span></span>
      <span><b class="num">{fmt(v.s.stats.playersSigned)}</b> <span class="muted">signed all time</span></span>
      <span><b class="num">{fmtPct(avgCut)}</b> <span class="muted">average cut</span></span>
      {#if hurtCount > 0}<span class="hurt"><Icon name="bandage" size={13} /> <b class="num">{hurtCount}</b> <span class="muted">out</span></span>{/if}
      <span class="how dim">Click a player for gear and stats · drag to move</span>
      <button class="btn small" onclick={() => ((game.marketFilter = null), (game.tab = 'market'))}>
        <Icon name="user-plus" size={14} /> Transfer market
      </button>
    </div>
  {/if}

  {#if ownedTeams.length > 1}
    <nav class="jump" aria-label="Jump to a team">
      {#each ownedTeams as g (g.id)}
        {@const ev = v.r.teams[g.id]}
        {@const out = outIn(g.id)}
        <button class="jump-chip" style="--gc:{g.color}" onclick={() => jumpTo(g.id)} title="Go to {g.name}">
          <span class="mini">{@html gameLogoSvg(g.id, g.color, g.name)}</span>
          <span class="jname">{g.name}</span>
          <span class="num jwin" class:good={(ev?.winChance ?? 0) >= 0.6} class:bad={!ev?.active || ev.winChance < 0.4}>{ev?.active ? fmtPct(ev.winChance) : 'idle'}</span>
          {#if out > 0}<i class="jout num" title="{out} out injured or ill">{out}</i>{/if}
        </button>
      {/each}
    </nav>
  {/if}

  {#each GAMES as g (g.id)}
    {#if v.s.games[g.id]?.unlocked && v.s.teams[g.id]}
      {@const team = v.s.teams[g.id]}
      {@const ev = v.r.teams[g.id]}
      {@const pop = v.s.games[g.id].popularity}
      {@const kit = teamKit(v.s, g.id)}
      {@const seats = Math.max(v.m.benchSlots, team.bench.length)}
      {@const folded = collapsed.has(g.id)}
      <article id="team-{g.id}" class="team" class:folded class:tut-target={v.s.tutorial.step === 'match' && g.index === 0} style="--gc:{g.color}">
        <header>
          <span class="logo">{@html gameLogoSvg(g.id, g.color, g.name)}</span>
          <div class="titles">
            <h3>{g.name}</h3>
            <span class="muted small">{GENRE_LABEL[g.genre]} · {g.teamSize === 1 ? 'Solo' : `${g.teamSize} players`}</span>
          </div>
          <button
            class="kit-btn"
            style="--p:{kit.primary}; --s:{kit.secondary}"
            onclick={() => (kitGame = g.id)}
            aria-label="{g.name} team colours"
            use:tooltip={() => ({ title: 'Team colours', icon: 'shirt', lines: [team.kit ? 'This team has its own colours.' : 'Using your org colours.', 'Click to change.'] })}
          ></button>
          <div class="pop" use:tooltip={() => popTip(g)}>
            <Sparkline values={v.s.games[g.id].history} color={g.color} width={90} />
            <span class="num" class:good={pop >= 1.05} class:bad={pop < 0.95}>×{pop.toFixed(2)}</span>
          </div>
          <button class="fold" onclick={() => toggleFold(g.id)} aria-expanded={!folded} aria-label={folded ? `Show ${g.name}` : `Fold ${g.name} away`} title={folded ? 'Show the room' : 'Fold away'}>
            <Icon name={folded ? 'chevron-down' : 'chevron-up'} size={16} />
          </button>
        </header>

        <div class="league">
          <div class="tier" use:tooltip={() => tierTip(g)}>
            <span class="tier-num">T{team.tier + 1}</span>
            <span class="tier-name">{tierName(team.tier)}</span>
          </div>
          <div class="season">
            <span class="muted small">Season {team.seasonNumber} · {team.seasonWins}-{team.seasonPlayed - team.seasonWins}</span>
            <div class="dots">
              {#each { length: SEASON_LENGTH } as _, i (i)}
                {@const rec = i < team.seasonPlayed ? team.history[team.seasonPlayed - 1 - i] : undefined}
                <i class:win={rec?.win === true} class:loss={rec?.win === false}></i>
              {/each}
            </div>
          </div>
          {#if ev}
            {@const mood = teamMood(team)}
            <div class="numbers">
              <span class="mood {MOODS[mood].tone}" use:tooltip={() => moodTip(g)}>
                <Icon name={MOODS[mood].icon} size={12} />
                {MOODS[mood].name}
              </span>
              <span use:tooltip={() => ({ title: 'Win chance', lines: ['Based on your lineup rating against this tier.'] })}>
                <b class="num" class:good={ev.winChance >= 0.6} class:bad={ev.winChance < 0.4}>{fmtPct(ev.winChance)}</b> win
              </span>
              <span>
                <b class="num gold-text">{money(ev.winPrize)}</b> /win
                {#if ev.stakes < 0.995}<span class="crowd bad num" use:tooltip={() => moodTip(g)}>×{ev.stakes.toFixed(2)}</span>{/if}
              </span>
              <span><b class="num accent-text">{money(ev.cps, 1)}</b> /s</span>
            </div>
          {/if}
        </div>

        {#if !folded}
        <!-- The gaming floor: one computer per role, with the player sitting at it. -->
        <div class="floor" style="--cols:{g.teamSize}">
          <div class="wall" aria-hidden="true">
            <span class="neon"></span>
          </div>
          <div class="bays">
            {#each team.lineup as id, slot (slot)}
              {@const p = id ? v.s.players[id] : undefined}
              {@const target = `slot:${g.id}:${slot}`}
              {@const out = p ? !isAvailable(p, v.s.time) : false}
              <div
                class="bay"
                class:droppable={canTake(g.id) && drag?.from !== slot}
                class:over={isOver(target) && drag?.from !== slot}
                data-drop={target}
              >
                <span class="role-plate">{g.roles[slot]}</span>
                {#if p}
                  <button
                    class="rig-btn"
                    class:lifted={drag?.playerId === p.id}
                    class:tut-target={restStep && restPlayer?.id === p.id}
                    onpointerdown={(e) => onPress(e, g.id, p.id, slot)}
                    onclick={() => open(p.id)}
                    oncontextmenu={(e) => e.preventDefault()}
                    aria-label="{p.tag}, {g.roles[slot]}. Open player"
                    use:tooltip={() => playerTip(p.id, false)}
                  >
                    <Rig player={p} primary={kit.primary} secondary={kit.secondary} gameColor={g.color} status={out ? 'out' : 'playing'} />
                    {#if out}
                      <span class="out-chip"><Icon name={HEALTH_ICON[p.status.kind]} size={11} /> {fmtTime(backIn(p, false))}</span>
                    {/if}
                    {#if p.retiring}<span class="retiring" title="Retiring after this season"><Icon name="calendar-clock" size={11} /></span>{/if}
                  </button>
                  <div class="plate" class:offrole={g.teamSize > 1 && p.role !== slot}>
                    <span class="ptag">{p.tag}</span>
                    <span class="prtg num">{fmt(skillRating(p, g))}</span>
                    <span class="energy" title="Energy {Math.round(p.energy)}"><i style="width:{p.energy}%"></i></span>
                  </div>
                {:else}
                  <button class="rig-btn empty" onclick={() => openMarket(g.id)} aria-label="Sign a {g.roles[slot]}">
                    <Rig primary={kit.primary} secondary={kit.secondary} gameColor={g.color} />
                  </button>
                  <div class="plate empty">
                    <span class="dim">Empty seat</span>
                    <span class="sign"><Icon name="user-plus" size={11} /> Sign</span>
                  </div>
                {/if}
                {#if isOver(target) && drag?.from !== slot}
                  <span class="drop-hint">
                    {#if overDelta !== null}
                      <b class="num" class:good={overDelta > 0} class:bad={overDelta < 0}>{overDelta > 0 ? '+' : ''}{overDelta}%</b> win
                    {:else}
                      Put here
                    {/if}
                  </span>
                {/if}
              </div>
            {/each}
          </div>
        </div>

        <!-- The bench: little cards for the substitutes, sitting on an actual bench. -->
        {#if restStep && g.index === 0 && restPlayer && !isAvailable(restPlayer, v.s.time)}
          <TutArrow label="Drag {restPlayer.tag} onto the bench" />
        {/if}
        <div
          class="bench"
          class:droppable={canTake(g.id) && drag?.from !== 'bench'}
          class:over={isOver(`bench:${g.id}`) && drag?.from !== 'bench'}
          class:tut-target={restStep && g.index === 0}
          data-drop="bench:{g.id}"
          use:tooltip={benchTip}
        >
          <span class="bench-label"><Icon name="bed" size={13} /> Bench <span class="dim">· rest here, recover {BENCH_RECOVERY_MULT}× faster</span></span>
          <div class="seats">
            {#each { length: seats } as _, i (i)}
              {@const id = team.bench[i]}
              {@const p = id ? v.s.players[id] : undefined}
              {#if p}
                {@const out = !isAvailable(p, v.s.time)}
                <button
                  class="card"
                  class:lifted={drag?.playerId === p.id}
                  class:out
                  onpointerdown={(e) => onPress(e, g.id, p.id, 'bench')}
                  onclick={() => open(p.id)}
                  oncontextmenu={(e) => e.preventDefault()}
                  aria-label="{p.tag}, on the bench. Open player"
                  data-drop="swap:{g.id}:{p.id}"
                  class:over={isOver(`swap:${g.id}:${p.id}`) && typeof drag?.from === 'number'}
                  use:tooltip={() => playerTip(p.id, true)}
                >
                  <span class="card-face">
                    <Avatar look={p.look} gear={p.gear} primary={kit.primary} secondary={kit.secondary} size={44} mode="bust" tag={p.tag} />
                  </span>
                  <span class="card-tag">{p.tag}</span>
                  <span class="card-meta num">
                    {#if out}
                      <span class="bad"><Icon name={HEALTH_ICON[p.status.kind]} size={10} /> {fmtTime(backIn(p, true))}</span>
                    {:else}
                      {fmt(skillRating(p, g))} · {g.roles[p.role] ?? ''}
                    {/if}
                  </span>
                  <span class="energy"><i style="width:{p.energy}%"></i></span>
                </button>
              {:else}
                <span class="card seat" aria-hidden="true"><Icon name="armchair" size={16} /></span>
              {/if}
            {/each}
          </div>
          <span class="plank" aria-hidden="true"></span>
          {#if drag?.over?.startsWith(`swap:${g.id}:`) && typeof drag.from === 'number'}
            <span class="drop-hint bench-hint">Swap with {v.s.players[drag.over.split(':')[2]]?.tag ?? 'them'}</span>
          {:else if isOver(`bench:${g.id}`) && drag?.from !== 'bench'}
            <span class="drop-hint bench-hint">
              {#if team.bench.length >= v.m.benchSlots}
                Bench full · drop on a player to swap
              {:else if dragPlayer && !isAvailable(dragPlayer, v.s.time)}
                Rest · recovers {BENCH_RECOVERY_MULT}× faster
              {:else}
                Rest on the bench
              {/if}
            </span>
          {/if}
        </div>

        <div class="match">
          {#if ev?.active}
            <span class="bar"><i style="width:{Math.min(100, (team.progress / ev.interval) * 100)}%"></i></span>
          {:else}
            <span class="muted small">{teamHasPlayers(team) ? 'Nobody fit to play. Rest your players or sign a substitute.' : 'Sign a player to start competing.'}</span>
          {/if}
          <div class="results">
            {#each team.history.slice(0, 8) as m, i (i)}
              <span
                class="res"
                class:win={m.win}
                use:tooltip={() => ({
                  title: `${m.win ? 'Win' : 'Loss'} ${m.score}`,
                  subtitle: `vs ${m.opponent}${m.rival ? ' · grudge match' : ''}`,
                  icon: m.win ? 'trophy' : 'skull',
                  iconColor: m.win ? 'var(--green)' : 'var(--red)',
                  lines: [`+${money(m.prize)} · +${fmt(m.fans)} fans`, { text: tierName(m.tier), tone: 'muted' }],
                })}>{m.win ? 'W' : 'L'}</span
              >
            {/each}
          </div>
        </div>

        {#if team.lastSeason}
          <p class="last-season"><Icon name="calendar-clock" size={12} /> Last season: {seasonSummary(team.lastSeason)}</p>
        {/if}
        <div class="plan-row">
          <button class="plan-label" onclick={help} use:tooltip={planHelp}>Season plan <Icon name="help" size={12} /></button>
          <div class="plans" role="radiogroup" aria-label="{g.name} season plan">
            {#each SEASON_PLAN_ORDER as id (id)}
              {@const def = SEASON_PLANS[id]}
              <button
                role="radio"
                aria-checked={team.plan === id}
                class:current={team.plan === id}
                class:queued={team.nextPlan === id}
                onclick={() => game.setSeasonPlan(g.id, id)}
                use:tooltip={() => planTip(id, team.seasonPlayed > 0 && team.plan !== id)}
              >
                <Icon name={def.icon} size={13} /> {def.name}
              </button>
            {/each}
          </div>
          {#if team.nextPlan}<span class="plan-next dim">{SEASON_PLANS[team.nextPlan].name} from next season</span>{/if}
        </div>

        <footer>
          <button
            class="btn small"
            disabled={team.tier === 0}
            onclick={() => game.changeTier(g.id, -1)}
            use:tooltip={() => ({
              title: 'Drop tier',
              icon: 'arrow-down',
              lines: [
                'Move down a tier right now: easier opponents, smaller prizes.',
                { text: 'The season starts again from zero.', tone: 'muted' },
                { text: 'Winning too easily bores players and crowds, so staying low costs money in the long run.', tone: 'muted' },
              ],
            })}
          >
            <Icon name="arrow-down" size={13} /> Drop tier
          </button>
          <button
            class="btn small"
            disabled={!(team.tier < team.bestTier || (ev?.winChance ?? 0) >= CHALLENGE_WIN_CHANCE)}
            onclick={() => game.changeTier(g.id, 1)}
            use:tooltip={() => ({
              title: 'Challenge up',
              icon: 'arrow-up',
              lines: [
                'Move up a tier right now: bigger prizes, tougher opponents.',
                { text: `Available when you are winning at least ${Math.round(CHALLENGE_WIN_CHANCE * 100)}% of matches, or to return to a tier you already reached.`, tone: 'muted' },
                { text: 'The season starts again from zero.', tone: 'muted' },
              ],
            })}
          >
            <Icon name="arrow-up" size={13} /> Challenge
          </button>
          <label
            class="check"
            use:tooltip={() => ({
              title: 'Auto-promote',
              icon: 'trending-up',
              lines: [
                `On: a season with ${PROMOTE_WINS}+ wins moves the team up a tier.`,
                'Off: the team stays in its tier until you challenge. League titles and relegation still happen.',
              ],
            })}
          >
            <input type="checkbox" checked={team.autoPromote} onchange={(e) => game.setTeamOption(g.id, 'autoPromote', e.currentTarget.checked)} /> Auto-promote
          </label>
          <label
            class="check"
            use:tooltip={() => ({
              title: 'Auto-sub',
              icon: 'refresh-cw',
              lines: [
                'On: tired, sick or injured starters swap out for the best rested bench player.',
                { text: `With the ${SEASON_PLANS[team.plan].name} plan, starters rotate out below ${SEASON_PLANS[team.plan].subAt} energy.`, tone: 'muted' },
                ...(team.bench.length === 0 ? [{ text: 'Nobody on the bench yet, so there is no one to bring on.', tone: 'bad' as const }] : []),
              ],
            })}
          >
            <input type="checkbox" checked={team.autoSub} onchange={(e) => game.setTeamOption(g.id, 'autoSub', e.currentTarget.checked)} /> Auto-sub
          </label>
          <button class="help-btn" onclick={help} aria-label="How teams work" title="How teams work"><Icon name="help" size={15} /></button>
          <span class="record muted small num">{fmt(team.wins)}W {fmt(team.losses)}L · {team.titles} league title{team.titles === 1 ? '' : 's'} · {money(team.earnings)}</span>
        </footer>
        {/if}
      </article>
    {:else if g.id === nextLocked?.id && !v.s.draft}
      <article class="team locked" style="--gc:{g.color}">
        <header>
          <span class="logo">{@html gameLogoSvg(g.id, g.color, g.name)}</span>
          <div class="titles">
            <h3>{g.name}</h3>
            <span class="muted small">{GENRE_LABEL[g.genre]} · {g.teamSize === 1 ? 'Solo' : `${g.teamSize} players`}</span>
          </div>
        </header>
        <p class="desc muted">{g.desc}</p>
        <div class="unlock">
          <span class="muted small">Roles: {g.roles.join(', ')} · base prize {money(g.basePrize)} per win</span>
          <button class="btn gold" disabled={v.s.cash < g.unlockCost} onclick={() => game.unlockGame(g.id)}>
            <Icon name="flag" size={14} /> Found team · {money(g.unlockCost)}
          </button>
        </div>
      </article>
    {/if}
  {/each}
  {#if lockedCount > 1}
    <p class="more dim small">{lockedCount - 1} more game{lockedCount - 1 === 1 ? '' : 's'} waiting to be discovered…</p>
  {/if}
</div>

{#if drag && dragPlayer}
  {@const kit = teamKit(v.s, dragPlayer.gameId)}
  <div class="ghost" use:portal style="transform: translate({drag.x}px, {drag.y}px)" aria-hidden="true">
    <div class="ghost-card" style="--gc:{GAMES.find((x) => x.id === dragPlayer.gameId)?.color ?? 'var(--accent)'}">
      <Avatar look={dragPlayer.look} gear={dragPlayer.gear} primary={kit.primary} secondary={kit.secondary} size={52} mode="bust" tag={dragPlayer.tag} />
      <span>{dragPlayer.tag}</span>
    </div>
  </div>
{/if}

{#if kitGame && kitTeam}
  {@const g = GAMES.find((x) => x.id === kitGame)!}
  {@const kit = teamKit(v.s, g.id)}
  <Modal title="{g.name} colours" onclose={() => (kitGame = null)} width={440}>
    <div class="kit-modal">
      <label class="check follow">
        <input
          type="checkbox"
          checked={!kitTeam.kit}
          onchange={(e) => game.setTeamKit(g.id, e.currentTarget.checked ? null : { primary: v.s.org.primary, secondary: v.s.org.secondary })}
        />
        Use org colours
      </label>
      <p class="muted small">{kitTeam.kit ? 'This team plays in its own colours.' : 'Picking a kit below gives this team its own colours.'}</p>
      <KitPicker primary={kit.primary} secondary={kit.secondary} onchange={(p, a) => game.setTeamKit(g.id, { primary: p, secondary: a })} />
    </div>
  </Modal>
{/if}

<script module lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import type { TeamState } from '../../engine/types';

  /** Team cards the player has folded away. Kept for the session, across tab switches. */
  const collapsed = new SvelteSet<string>();
  function teamHasPlayers(team: TeamState): boolean {
    return team.lineup.some((id) => id !== null) || team.bench.length > 0;
  }
</script>

<style>
  :global(body.dragging-player) {
    cursor: grabbing;
    user-select: none;
    -webkit-user-select: none;
  }
  .teams {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .summary {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 16px;
    padding: 8px 12px;
    border-radius: 10px;
    background: var(--bg-2);
    border: 1px solid var(--line);
    font-size: 13px;
  }
  .summary b {
    font-family: var(--font-display);
    font-size: 16px;
  }
  .summary .hurt {
    color: var(--red);
  }
  .summary .how {
    font-size: 12px;
    margin-left: auto;
  }
  .jump {
    position: sticky;
    top: -12px;
    z-index: 5;
    display: flex;
    gap: 6px;
    margin-top: -12px;
    padding: 12px 0 8px;
    overflow-x: auto;
    scrollbar-width: thin;
    background: linear-gradient(180deg, var(--panel) 85%, transparent);
  }
  .jump-chip {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 9px 3px 3px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--gc) 40%, var(--line-2));
    background: color-mix(in srgb, var(--gc) 8%, var(--bg-2));
    color: var(--text);
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 12.5px;
    cursor: pointer;
  }
  .jump-chip:hover {
    border-color: var(--gc);
  }
  .mini {
    display: block;
    width: 22px;
    height: 22px;
  }
  .mini :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
  }
  .jwin {
    font-size: 11.5px;
    color: var(--muted);
  }
  .jout {
    display: grid;
    place-items: center;
    min-width: 16px;
    height: 16px;
    padding: 0 3px;
    border-radius: 999px;
    font-style: normal;
    font-size: 10px;
    color: #fff;
    background: var(--red);
  }
  .fold {
    flex: none;
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border-radius: 8px;
    border: 1px solid var(--line-2);
    background: var(--bg-2);
    color: var(--muted);
  }
  .fold:hover {
    color: var(--text);
    border-color: var(--gc);
  }
  .team {
    scroll-margin-top: 44px;
    container-type: inline-size;
    border-radius: 12px;
    border: 1px solid color-mix(in srgb, var(--gc) 35%, var(--line));
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--gc) 10%, transparent), transparent 45%),
      var(--bg-2);
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .team.locked {
    border-style: dashed;
  }
  header {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .logo {
    flex: none;
    width: 52px;
    height: 52px;
    filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.45));
  }
  .logo :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
  }
  .titles {
    flex: 1;
    min-width: 0;
  }
  h3 {
    margin: 0;
    font-family: var(--font-ui);
    font-size: 19px;
    line-height: 1.1;
  }
  .small {
    font-size: 12px;
  }
  .kit-btn {
    flex: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: none;
    padding: 0;
    background: linear-gradient(135deg, var(--p) 0 58%, var(--s) 58% 76%, var(--p) 76%);
    box-shadow:
      0 0 0 2px var(--panel),
      0 0 0 3px var(--line-2);
    transition: transform 0.12s;
  }
  .kit-btn:hover {
    transform: scale(1.12);
    box-shadow:
      0 0 0 2px var(--panel),
      0 0 0 3px var(--accent);
  }
  .pop {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-ui);
    font-weight: 700;
  }
  .league {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 16px;
  }
  .tier {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 10px 4px 4px;
    border-radius: 8px;
    background: color-mix(in srgb, var(--gold) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--gold) 30%, transparent);
  }
  .tier-num {
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 13px;
    padding: 2px 6px;
    border-radius: 5px;
    background: var(--gold);
    color: #1a1400;
  }
  .tier-name {
    font-family: var(--font-ui);
    font-weight: 700;
    color: var(--gold);
  }
  .season {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .dots {
    display: flex;
    gap: 3px;
  }
  .dots i {
    width: 10px;
    height: 10px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid var(--line-2);
  }
  .dots i.win {
    background: var(--green);
    border-color: var(--green);
  }
  .dots i.loss {
    background: var(--red);
    border-color: var(--red);
  }
  .numbers {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 14px;
    margin-left: auto;
    font-size: 12px;
    color: var(--muted);
  }
  .numbers b {
    font-family: var(--font-ui);
    font-size: 15px;
  }
  .mood {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid var(--line-2);
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 12px;
    color: var(--muted);
  }
  .mood.good {
    color: var(--green);
    border-color: color-mix(in srgb, var(--green) 45%, transparent);
    background: color-mix(in srgb, var(--green) 8%, transparent);
  }
  .mood.bad {
    color: var(--red);
    border-color: color-mix(in srgb, var(--red) 45%, transparent);
    background: color-mix(in srgb, var(--red) 8%, transparent);
  }
  .crowd {
    margin-left: 2px;
    font-size: 11px;
  }

  /* ---- The gaming floor ------------------------------------------------------------------- */
  .floor {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--gc) 30%, #000);
    background:
      /* the wall, lit by the team colour */
      radial-gradient(ellipse 70% 90% at 50% 0%, color-mix(in srgb, var(--gc) 22%, transparent), transparent 70%),
      linear-gradient(180deg, #17151f, #12111a);
    box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.04), inset 0 10px 24px rgba(0, 0, 0, 0.35);
  }
  .wall {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(90deg, transparent 0 46px, rgba(255, 255, 255, 0.018) 46px 48px);
  }
  .neon {
    position: absolute;
    left: 6%;
    right: 6%;
    top: 12px;
    height: 3px;
    border-radius: 3px;
    background: var(--gc);
    box-shadow:
      0 0 8px var(--gc),
      0 0 22px color-mix(in srgb, var(--gc) 60%, transparent);
    opacity: 0.8;
  }
  .bays {
    position: relative;
    isolation: isolate;
    display: grid;
    grid-template-columns: repeat(var(--cols), minmax(0, 196px));
    justify-content: center;
    padding: 22px 6px 0;
  }
  /* Narrow rooms wrap to three desks a row, but a desk never grows past its normal size. */
  @container (max-width: 560px) {
    .bays {
      grid-template-columns: repeat(min(var(--cols), 3), minmax(0, 196px));
    }
  }
  @container (max-width: 440px) {
    .pop :global(svg) {
      display: none;
    }
  }
  @container (max-width: 250px) {
    .bays {
      grid-template-columns: repeat(min(var(--cols), 2), minmax(0, 196px));
    }
  }
  .bay {
    position: relative;
    container-type: inline-size;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
    min-width: 0;
    padding: 4px 4px 10px;
    border-radius: 10px;
    outline: 2px solid transparent;
    outline-offset: -2px;
    transition:
      outline-color 0.12s,
      background-color 0.12s;
  }
  /*
   * Each row of desks stands on its own strip of floor, starting at desk height and running the
   * full width of the room, so wrapped rows on a phone still sit on the floor rather than the wall.
   * 28px is the padding, role plate and gap above the rig; the rig is 170/198 as tall as it is wide.
   */
  .bay::before {
    content: '';
    position: absolute;
    z-index: -1;
    left: -100vw;
    right: -100vw;
    top: calc(28px + (100cqw - 8px) * 0.47);
    bottom: 0;
    background:
      repeating-linear-gradient(90deg, rgba(0, 0, 0, 0.2) 0 2px, transparent 2px 64px),
      linear-gradient(180deg, #2e2433, #1c1720);
    box-shadow:
      inset 0 2px 0 rgba(255, 255, 255, 0.05),
      inset 0 10px 14px rgba(0, 0, 0, 0.35);
    pointer-events: none;
  }
  .bay.droppable {
    outline: 2px dashed color-mix(in srgb, var(--gc) 55%, transparent);
  }
  .bay.over {
    outline: 2px solid var(--gc);
    background-color: color-mix(in srgb, var(--gc) 14%, transparent);
  }
  .role-plate {
    align-self: center;
    height: 20px;
    line-height: 14px;
    box-sizing: border-box;
    max-width: 100%;
    padding: 2px 9px;
    border-radius: 4px;
    font-family: var(--font-ui);
    font-size: 10.5px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--gc);
    background: linear-gradient(180deg, #24222c, #16151c);
    border: 1px solid color-mix(in srgb, var(--gc) 45%, #000);
    box-shadow:
      0 2px 0 rgba(0, 0, 0, 0.45),
      inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }
  .rig-btn {
    position: relative;
    display: block;
    width: 100%;
    padding: 0;
    border: none;
    background: none;
    color: inherit;
    cursor: grab;
    touch-action: manipulation;
    -webkit-touch-callout: none;
    user-select: none;
    -webkit-user-select: none;
    transition:
      opacity 0.15s,
      transform 0.15s,
      filter 0.15s;
  }
  .rig-btn:hover {
    filter: drop-shadow(0 0 8px color-mix(in srgb, var(--gc) 45%, transparent));
  }
  .rig-btn:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
    border-radius: 8px;
  }
  .rig-btn.empty {
    cursor: pointer;
    opacity: 0.75;
  }
  .rig-btn.empty:hover {
    opacity: 1;
  }
  .lifted {
    opacity: 0.28;
  }
  .out-chip {
    position: absolute;
    top: 2px;
    left: 2px;
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 1px 6px;
    border-radius: 999px;
    font-size: 10.5px;
    font-weight: 700;
    color: #fff;
    background: color-mix(in srgb, var(--red) 85%, #000);
  }
  .retiring {
    position: absolute;
    top: 2px;
    right: 2px;
    display: grid;
    place-items: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--gold);
    color: #141416;
  }
  /* The name plate on the front of the desk. Fixed height, so nothing moves when a player swaps. */
  .plate {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    column-gap: 6px;
    height: 34px;
    padding: 3px 8px 4px;
    border-radius: 7px;
    background: linear-gradient(180deg, #232129, #19181e);
    border: 1px solid var(--line-2);
    box-shadow: 0 3px 0 rgba(0, 0, 0, 0.35);
  }
  .plate.empty {
    border-style: dashed;
    background: rgba(0, 0, 0, 0.2);
    font-size: 12px;
  }
  .sign {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    font-weight: 700;
    color: var(--gc);
  }
  .ptag {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .plate.offrole .ptag::after {
    content: ' *';
    color: var(--orange);
  }
  .prtg {
    font-family: var(--font-display);
    font-size: 12px;
    color: var(--gc);
  }
  .energy {
    grid-column: 1 / -1;
    height: 3px;
    border-radius: 2px;
    background: rgba(0, 0, 0, 0.5);
    overflow: hidden;
  }
  .energy i {
    display: block;
    height: 100%;
    background: var(--lime);
  }
  .drop-hint {
    position: absolute;
    left: 50%;
    top: 34%;
    transform: translate(-50%, -50%);
    z-index: 2;
    padding: 4px 10px;
    border-radius: 999px;
    white-space: nowrap;
    font-size: 12px;
    font-weight: 700;
    color: var(--text);
    background: color-mix(in srgb, var(--panel) 92%, transparent);
    border: 1px solid var(--gc);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
    pointer-events: none;
  }
  .drop-hint b.good {
    color: var(--green);
  }
  .drop-hint b.bad {
    color: var(--red);
  }

  /* ---- The bench ------------------------------------------------------------------------- */
  .bench {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px 12px 0;
    border-radius: 12px;
    border: 1px solid var(--line);
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.28));
    outline: 2px solid transparent;
    outline-offset: -2px;
    transition:
      outline-color 0.12s,
      background-color 0.12s;
  }
  .bench.droppable {
    outline: 2px dashed color-mix(in srgb, var(--gc) 55%, transparent);
  }
  .bench.over {
    outline: 2px solid var(--gc);
    background-color: color-mix(in srgb, var(--gc) 12%, transparent);
  }
  .bench-label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .bench-label .dim {
    text-transform: none;
    letter-spacing: 0;
    font-weight: 600;
  }
  .seats {
    position: relative;
    z-index: 1;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 8px;
    padding: 0 10px;
    min-height: 102px;
  }
  .card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    width: 76px;
    height: 100px;
    padding: 4px 4px 5px;
    border-radius: 8px 8px 4px 4px;
    border: 1px solid color-mix(in srgb, var(--gc) 40%, var(--line-2));
    background: linear-gradient(180deg, color-mix(in srgb, var(--gc) 18%, #1d1c22), #17161b);
    color: inherit;
    font: inherit;
    cursor: grab;
    touch-action: manipulation;
    -webkit-touch-callout: none;
    user-select: none;
    -webkit-user-select: none;
    box-shadow: 0 4px 0 rgba(0, 0, 0, 0.35);
    transition:
      opacity 0.15s,
      transform 0.12s;
  }
  .card:hover {
    transform: translateY(-2px);
  }
  .card.over {
    border-color: var(--gc);
    box-shadow:
      0 4px 0 rgba(0, 0, 0, 0.35),
      0 0 0 2px var(--gc);
  }
  .card.out {
    border-color: color-mix(in srgb, var(--red) 55%, transparent);
  }
  .card.seat {
    justify-content: center;
    border-style: dashed;
    background: rgba(255, 255, 255, 0.02);
    color: var(--dim);
    box-shadow: none;
    cursor: default;
  }
  .card.seat:hover {
    transform: none;
  }
  .card-face {
    display: block;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.3);
  }
  .card-tag {
    max-width: 100%;
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .card-meta {
    max-width: 100%;
    font-size: 10px;
    color: var(--muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .card-meta .bad {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    color: var(--red);
  }
  .card .energy {
    width: 80%;
    margin-top: auto;
  }
  /* A wooden bench seat and legs for the cards to sit on. */
  .plank {
    position: relative;
    display: block;
    height: 12px;
    margin: -4px 0 12px;
    border-radius: 4px;
    background:
      repeating-linear-gradient(90deg, rgba(0, 0, 0, 0.12) 0 1px, transparent 1px 90px),
      linear-gradient(180deg, #a8764b, #7d5535);
    box-shadow:
      0 3px 0 #5b3d25,
      0 8px 12px rgba(0, 0, 0, 0.35);
  }
  .plank::before,
  .plank::after {
    content: '';
    position: absolute;
    top: 12px;
    width: 8px;
    height: 10px;
    border-radius: 0 0 2px 2px;
    background: #5b3d25;
  }
  .plank::before {
    left: 8%;
  }
  .plank::after {
    right: 8%;
  }
  .bench-hint {
    top: 50%;
  }

  /* ---- The card in the air -------------------------------------------------------------- */
  .ghost {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 2000;
    pointer-events: none;
  }
  .ghost-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 6px 8px;
    border-radius: 10px;
    transform: translate(-50%, -70%) rotate(-4deg);
    background: linear-gradient(180deg, color-mix(in srgb, var(--gc) 26%, #1d1c22), #17161b);
    border: 1px solid var(--gc);
    box-shadow:
      0 12px 28px rgba(0, 0, 0, 0.55),
      0 0 18px color-mix(in srgb, var(--gc) 40%, transparent);
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 12px;
    color: var(--text);
  }

  /* ---- Below the floor ------------------------------------------------------------------ */
  .match {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .match .bar {
    flex: 1;
  }
  .match .bar i {
    background: linear-gradient(90deg, color-mix(in srgb, var(--gc) 60%, #fff), var(--gc));
  }
  .results {
    display: flex;
    gap: 3px;
  }
  .res {
    display: grid;
    place-items: center;
    width: 18px;
    height: 18px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 800;
    background: color-mix(in srgb, var(--red) 20%, transparent);
    color: var(--red);
  }
  .res.win {
    background: color-mix(in srgb, var(--green) 18%, transparent);
    color: var(--green);
  }
  .last-season {
    display: flex;
    align-items: center;
    gap: 5px;
    margin: 0;
    font-size: 12px;
    color: var(--muted);
  }
  .plan-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .plan-label {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0;
    border: none;
    background: none;
    cursor: help;
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 12px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .plans {
    display: inline-flex;
    border: 1px solid var(--line-2);
    border-radius: 7px;
    overflow: hidden;
  }
  .plans button {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border: none;
    background: var(--bg-2);
    color: var(--muted);
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 12.5px;
  }
  .plans button + button {
    border-left: 1px solid var(--line-2);
  }
  .plans button.current {
    background: color-mix(in srgb, var(--accent) 20%, var(--bg-2));
    color: var(--text);
  }
  .plans button.queued {
    box-shadow: inset 0 -2px 0 var(--gold);
    color: var(--gold);
  }
  .plan-next {
    font-size: 12px;
  }
  footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--muted);
    cursor: pointer;
  }
  .plan-label:hover,
  .help-btn:hover {
    color: var(--accent);
  }
  .help-btn {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    padding: 0;
    border: none;
    border-radius: 7px;
    background: none;
    color: var(--dim);
  }
  .record {
    margin-left: auto;
  }
  .desc {
    margin: 0;
  }
  .unlock {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .more {
    text-align: center;
    margin: 0;
  }
  .kit-modal {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .kit-modal .small {
    margin: 0;
    font-size: 12.5px;
  }
  .follow {
    font-weight: 700;
  }
  @media (max-width: 600px) {
    .numbers {
      margin-left: 0;
    }
    .summary .how {
      display: none;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .card,
    .rig-btn {
      transition: none;
    }
  }
</style>
