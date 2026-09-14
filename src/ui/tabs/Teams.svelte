<script lang="ts">
  import { GAMES, GENRE_LABEL, type GameDef } from '../../data/games';
  import { PROMOTE_WINS, RELEGATE_WINS, SEASON_LENGTH, TITLE_WINS, prizeSeconds, tierName } from '../../data/leagues';
  import { fmt, fmtPct, money } from '../../engine/format';
  import { isAvailable, skillRating } from '../../engine/players';
  import { CHALLENGE_WIN_CHANCE } from '../../engine/teams';
  import Avatar from '../components/Avatar.svelte';
  import Icon from '../components/Icon.svelte';
  import Sparkline from '../components/Sparkline.svelte';
  import { game } from '../game.svelte';
  import { tooltip, type TipContent } from '../tooltip.svelte';

  const v = $derived(game.view);
  const nextLocked = $derived(GAMES.find((g) => !v.s.games[g.id]?.unlocked));
  const lockedCount = $derived(GAMES.filter((g) => !v.s.games[g.id]?.unlocked).length);

  function openMarket(gameId: string) {
    game.marketFilter = gameId;
    game.tab = 'market';
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
  {#each GAMES as g (g.id)}
    {#if v.s.games[g.id]?.unlocked && v.s.teams[g.id]}
      {@const team = v.s.teams[g.id]}
      {@const ev = v.r.teams[g.id]}
      {@const pop = v.s.games[g.id].popularity}
      <article class="team" style="--gc:{g.color}">
        <header>
          <span class="gicon"><Icon name={g.icon} size={20} /></span>
          <div class="titles">
            <h3>{g.name}</h3>
            <span class="muted small">{GENRE_LABEL[g.genre]} · {g.teamSize === 1 ? 'Solo' : `${g.teamSize} players`}</span>
          </div>
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
            <div class="numbers">
              <span use:tooltip={() => ({ title: 'Win chance', lines: ['Based on your lineup rating against this tier.'] })}>
                <b class="num" class:good={ev.winChance >= 0.6} class:bad={ev.winChance < 0.4}>{fmtPct(ev.winChance)}</b> win
              </span>
              <span><b class="num gold-text">{money(ev.winPrize)}</b> /win</span>
              <span><b class="num cyan-text">{money(ev.cps, 1)}</b> /s</span>
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
                  <Avatar look={p.look} gear={p.gear} primary={v.s.org.primary} secondary={v.s.org.secondary} size={54} mode="bust" />
                  <span class="ptag">{p.tag}</span>
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
                  <Avatar look={p.look} gear={p.gear} primary={v.s.org.primary} secondary={v.s.org.secondary} size={26} mode="bust" />
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

        <footer>
          <button class="btn small" disabled={team.tier === 0} onclick={() => game.changeTier(g.id, -1)}>
            <Icon name="arrow-down" size={13} /> Drop tier
          </button>
          <button
            class="btn small"
            disabled={!(team.tier < team.bestTier || (ev?.winChance ?? 0) >= CHALLENGE_WIN_CHANCE)}
            onclick={() => game.changeTier(g.id, 1)}
            use:tooltip={() => ({
              title: 'Challenge up',
              lines: [
                'Move up a tier immediately.',
                { text: `Available when you are winning at least ${Math.round(CHALLENGE_WIN_CHANCE * 100)}% of matches, or to return to a tier you already reached.`, tone: 'muted' },
              ],
            })}
          >
            <Icon name="arrow-up" size={13} /> Challenge
          </button>
          <label class="check"><input type="checkbox" checked={team.autoPromote} onchange={(e) => game.setTeamOption(g.id, 'autoPromote', e.currentTarget.checked)} /> Auto-promote</label>
          <label class="check"><input type="checkbox" checked={team.autoSub} onchange={(e) => game.setTeamOption(g.id, 'autoSub', e.currentTarget.checked)} /> Auto-sub</label>
          <span class="record muted small num">{fmt(team.wins)}W {fmt(team.losses)}L · {team.titles} titles · {money(team.earnings)}</span>
        </footer>
      </article>
    {:else if g.id === nextLocked?.id}
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

<style>
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
    background: rgba(255, 200, 61, 0.08);
    border: 1px solid rgba(255, 200, 61, 0.3);
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
    color: var(--cyan);
    border-color: var(--cyan);
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
    background: rgba(255, 77, 109, 0.2);
    color: var(--red);
  }
  .res.win {
    background: rgba(61, 255, 154, 0.18);
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
