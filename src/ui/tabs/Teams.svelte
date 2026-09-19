<script lang="ts">
  import { GAMES, GENRE_LABEL, type GameDef } from '../../data/games';
  import { SEASON_PLANS, SEASON_PLAN_ORDER, type SeasonPlan } from '../../data/seasonPlans';
  import { PROMOTE_WINS, RELEGATE_WINS, SEASON_LENGTH, TITLE_WINS, prizeSeconds, tierName } from '../../data/leagues';
  import { fmt, fmtPct, money } from '../../engine/format';
  import { isAvailable, skillRating } from '../../engine/players';
  import { CHALLENGE_WIN_CHANCE, teamKit } from '../../engine/teams';
  import { BORED_FORM, ENGAGED_MAX, ENGAGED_MIN, MOODS, teamMood } from '../../engine/mood';
  import { seasonSummary } from '../../engine/stories';
  import Avatar from '../components/Avatar.svelte';
  import FirstPlayer from '../components/FirstPlayer.svelte';
  import Icon from '../components/Icon.svelte';
  import KitPicker from '../components/KitPicker.svelte';
  import Modal from '../components/Modal.svelte';
  import Sparkline from '../components/Sparkline.svelte';
  import { game } from '../game.svelte';
  import { tooltip, type TipContent } from '../tooltip.svelte';
  import Guide from '../components/Guide.svelte';
  import { teamsGuide } from '../guides';
  import { tick } from 'svelte';

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

  function openMarket(gameId: string) {
    game.marketFilter = gameId;
    game.tab = 'market';
  }

  const times = (x: number) => (x === 1 ? "normal" : `×${parseFloat(x.toFixed(2))}`);

  function planTip(id: SeasonPlan, deferred: boolean): TipContent {
    const d = SEASON_PLANS[id];
    return {
      title: d.name,
      subtitle: "Season plan",
      icon: d.icon,
      lines: [
        d.summary,
        { text: `Team rating ${times(d.rating)} · XP ${times(d.xp)}`, tone: d.rating >= 1 ? "good" : "muted" },
        { text: `Fatigue ${times(d.drain)} · recovery ${times(d.recovery)}`, tone: "muted" },
        { text: d.benchXp > 0 ? `Bench players train at ${Math.round(d.benchXp * 100)}% of match XP` : "Bench players do not train", tone: "muted" },
        ...(deferred ? [{ text: "Takes effect from next season.", tone: "gold" as const }] : []),
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
        { text: `${PROMOTE_WINS}+ wins promote · ${TITLE_WINS}+ wins earn a title and a trophy · ${RELEGATE_WINS} or fewer relegate.`, tone: 'muted' },
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

  function playerTip(id: string): TipContent {
    const { s } = game.view;
    const p = s.players[id];
    if (!p) return { title: 'Player' };
    return {
      title: p.tag,
      subtitle: p.founder ? 'Founder' : `${p.first} ${p.last}`,
      icon: 'user',
      lines: [
        `Rating ${fmt(skillRating(p))} · Level ${p.level}`,
        `Energy ${Math.round(p.energy)} · Morale ${Math.round(p.morale)}`,
        ...(isAvailable(p, s.time) ? [] : [{ text: p.status.reason || 'Unavailable', tone: 'bad' as const }]),
        { text: 'Click to manage.', tone: 'muted' },
      ],
    };
  }
</script>

<div class="teams">
  <FirstPlayer />
  {#if Object.keys(v.s.teams).length > 0 && v.s.tutorial.step === 'done'}
    <Guide id="teams" title="How teams work" pages={TEAMS_GUIDE} />
  {/if}
  {#each GAMES as g (g.id)}
    {#if v.s.games[g.id]?.unlocked && v.s.teams[g.id]}
      {@const team = v.s.teams[g.id]}
      {@const ev = v.r.teams[g.id]}
      {@const pop = v.s.games[g.id].popularity}
      {@const kit = teamKit(v.s, g.id)}
      <article class="team" class:tut-target={v.s.tutorial.step === 'match' && g.index === 0} style="--gc:{g.color}">
        <header>
          <span class="gicon"><Icon name={g.icon} size={20} /></span>
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

        <div class="lineup" style="--cols:{Math.min(g.teamSize, 6)}">
          {#each team.lineup as id, slot (slot)}
            {@const p = id ? v.s.players[id] : undefined}
            <div class="slot">
              <span class="role">{g.roles[slot]}</span>
              {#if p}
                <button
                  class="slot-player"
                  class:out={!isAvailable(p, v.s.time)}
                  class:offrole={g.teamSize > 1 && p.role !== slot}
                  onclick={() => (game.selectedPlayer = p.id)}
                  use:tooltip={() => playerTip(p.id)}
                >
                  <Avatar look={p.look} gear={p.gear} primary={teamKit(v.s, p.gameId).primary} secondary={teamKit(v.s, p.gameId).secondary} size={54} mode="bust" />
                  <span class="ptag">{p.tag}</span>
                  {#if p.retiring}<span class="retiring" title="Retiring after this season"><Icon name="calendar-clock" size={11} /></span>{/if}
                  <span class="prtg num">{fmt(skillRating(p, g))}</span>
                  <span class="energy"><i style="width:{p.energy}%"></i></span>
                </button>
              {:else}
                <button class="slot-empty" onclick={() => openMarket(g.id)}>
                  <Icon name="user-plus" size={20} />
                  <span>Sign player</span>
                </button>
              {/if}
            </div>
          {/each}
        </div>

        {#if team.bench.length > 0}
          <div class="bench">
            <span class="muted small">Bench</span>
            {#each team.bench as id (id)}
              {@const p = v.s.players[id]}
              {#if p}
                <button class="bench-player" onclick={() => (game.selectedPlayer = p.id)} use:tooltip={() => playerTip(p.id)}>
                  <Avatar look={p.look} gear={p.gear} primary={teamKit(v.s, p.gameId).primary} secondary={teamKit(v.s, p.gameId).secondary} size={26} mode="bust" />
                  <span>{p.tag}</span>
                </button>
              {/if}
            {/each}
          </div>
        {/if}

        <div class="match">
          {#if ev?.active}
            <span class="bar"><i style="width:{Math.min(100, (team.progress / ev.interval) * 100)}%"></i></span>
          {:else}
            <span class="muted small">Sign a player to start competing.</span>
          {/if}
          <div class="results">
            {#each team.history.slice(0, 8) as m, i (i)}
              <span
                class="res"
                class:win={m.win}
                use:tooltip={() => ({
                  title: `${m.win ? 'Win' : 'Loss'} ${m.score}`,
                  subtitle: `vs ${m.opponent}`,
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
                'Off: the team stays in its tier until you challenge. Titles and relegation still happen.',
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
          <span class="record muted small num">{fmt(team.wins)}W {fmt(team.losses)}L · {team.titles} titles · {money(team.earnings)}</span>
        </footer>
      </article>
    {:else if g.id === nextLocked?.id && !v.s.draft}
      <article class="team locked" style="--gc:{g.color}">
        <header>
          <span class="gicon"><Icon name={g.icon} size={20} /></span>
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

<style>
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
  .retiring {
    position: absolute;
    top: 4px;
    left: 4px;
    display: grid;
    place-items: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--gold);
    color: #141416;
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
  .teams {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .team {
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
  .gicon {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 9px;
    color: var(--gc);
    background: color-mix(in srgb, var(--gc) 15%, transparent);
    border: 1px solid color-mix(in srgb, var(--gc) 45%, transparent);
    flex: none;
  }
  .titles {
    flex: 1;
    min-width: 0;
  }
  h3 {
    margin: 0;
    font-family: var(--font-ui);
    font-size: 18px;
    line-height: 1.1;
  }
  .small {
    font-size: 12px;
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
    gap: 14px;
    margin-left: auto;
    font-size: 12px;
    color: var(--muted);
  }
  .numbers {
    align-items: center;
    flex-wrap: wrap;
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
  .numbers b {
    font-family: var(--font-ui);
    font-size: 15px;
  }
  .lineup {
    display: grid;
    grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
    gap: 6px;
  }
  .slot {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .role {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--dim);
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .slot-player,
  .slot-empty {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 6px 4px;
    border-radius: 9px;
    border: 1px solid var(--line-2);
    background: rgba(0, 0, 0, 0.2);
    min-height: 104px;
    justify-content: center;
  }
  .slot-player:hover {
    border-color: var(--gc);
  }
  .slot-player.out {
    opacity: 0.55;
    border-color: var(--red);
  }
  .slot-player.offrole .ptag::after {
    content: ' *';
    color: var(--orange);
  }
  /* Name and rating sit above the avatar, which can overflow its box, with a shadow to stay readable. */
  .ptag,
  .prtg {
    position: relative;
    z-index: 1;
    text-shadow:
      0 1px 2px rgba(0, 0, 0, 0.9),
      0 0 4px rgba(0, 0, 0, 0.75);
  }
  .ptag {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 13px;
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .prtg {
    font-family: var(--font-display);
    font-size: 12px;
    color: var(--gc);
  }
  .energy {
    width: 70%;
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
  .slot-empty {
    border-style: dashed;
    color: var(--dim);
    font-size: 12px;
  }
  .slot-empty:hover {
    color: var(--accent);
    border-color: var(--accent);
  }
  .bench {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .bench-player {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 2px 8px 2px 2px;
    border-radius: 999px;
    border: 1px solid var(--line-2);
    background: rgba(0, 0, 0, 0.2);
    font-size: 12px;
    font-family: var(--font-ui);
    font-weight: 700;
    overflow: hidden;
  }
  .bench-player :global(svg) {
    border-radius: 50%;
  }
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
  @media (max-width: 600px) {
    .lineup {
      grid-template-columns: repeat(min(var(--cols), 3), minmax(0, 1fr));
    }
    .numbers {
      margin-left: 0;
    }
  }
</style>
