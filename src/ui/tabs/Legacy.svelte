<script lang="ts">
  import { AUTOMATION_MAP } from '../../data/automation';
  import { CHARTERS, CHARTER_MAP } from '../../data/charters';
  import { GAME_MAP } from '../../data/games';
  import { MANDATE_MAP } from '../../data/mandates';
  import { CHALLENGES, DYNASTY, LEGACY_NODES, LEGACY_NODE_MAP, type LegacyNodeDef } from '../../data/legacy';
  import { describeEffect } from '../../engine/describe';
  import { tierName } from '../../data/leagues';
  import { fmt, fmtPct, fmtTime, money } from '../../engine/format';
  import {
    FOUNDING_POINTS,
    LEGACY_DIVISOR,
    activeChallenge,
    canSell,
    dynastyCost,
    dynastyRank,
    dynastyTotal,
    dynastyUnlocked,
    hasSpecial,
    legacyFor,
    mandateOffers,
    nextLegacyThreshold,
    nodeState,
    pendingLegacy,
    treeComplete,
  } from '../../engine/prestige';
  import Avatar from '../components/Avatar.svelte';
  import DesignImage from '../components/DesignImage.svelte';
  import Icon from '../components/Icon.svelte';
  import Modal from '../components/Modal.svelte';
  import { game } from '../game.svelte';
  import { tooltip, type TipContent } from '../tooltip.svelte';

  const CELL_X = 96;
  const CELL_Y = 92;
  const PAD = 44;
  const COLS = Math.max(...LEGACY_NODES.map((n) => n.x)) + 1;
  const ROWS = Math.max(...LEGACY_NODES.map((n) => n.y)) + 1;
  const WIDTH = PAD * 2 + (COLS - 1) * CELL_X;
  const HEIGHT = PAD * 2 + (ROWS - 1) * CELL_Y + 16;
  const pos = (n: LegacyNodeDef) => ({ x: PAD + n.x * CELL_X, y: PAD + n.y * CELL_Y });
  const EDGES = LEGACY_NODES.flatMap((n) => n.requires.map((r) => ({ from: LEGACY_NODE_MAP.get(r)!, to: n })));

  let selling = $state(false);
  let keepId = $state('');
  let retireId = $state('');
  let challengeId = $state('');
  let charterId = $state('');
  let mandateId = $state('');

  const v = $derived(game.view);
  const s = $derived(v.s);
  const p = $derived(s.prestige);
  const pending = $derived(pendingLegacy(s));
  const progress = $derived.by(() => {
    const current = Math.max(p.level, legacyFor(s.earnedTotal));
    const lo = Math.pow(current, 3) * LEGACY_DIVISOR;
    const hi = nextLegacyThreshold(s);
    return Math.max(0, Math.min(1, (s.earnedTotal - lo) / Math.max(1, hi - lo)));
  });
  const tradable = $derived(Object.values(s.players).filter((pl) => !pl.founder).sort((a, b) => b.level - a.level));
  const active = $derived(activeChallenge(s));
  const charter = $derived(p.charter ? CHARTER_MAP.get(p.charter) : undefined);
  const mandate = $derived(p.mandate ? MANDATE_MAP.get(p.mandate) : undefined);
  const offers = $derived(mandateOffers(s));
  const complete = $derived(treeComplete(s));
  /** The charter is required the first time it can be chosen. */
  const needsCharter = $derived(!p.charter);

  function nodeTip(n: LegacyNodeDef): TipContent {
    const state = nodeState(game.view.s, n.id);
    const parents = n.requires.map((r) => LEGACY_NODE_MAP.get(r)?.name ?? r);
    return {
      title: n.name,
      subtitle: state === 'owned' ? 'Owned' : state === 'available' ? 'Available' : 'Locked',
      icon: n.icon,
      iconColor: state === 'owned' ? 'var(--gold)' : 'var(--accent)',
      cost: state === 'owned' ? undefined : `${fmt(n.cost)} legacy`,
      costOk: game.view.s.prestige.points >= n.cost,
      lines: [n.desc, ...(parents.length && state === 'locked' ? [{ text: `Requires ${parents.join(', ')}`, tone: 'muted' as const }] : [])],
    };
  }

  function onNodeKey(e: KeyboardEvent, id: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      game.buyLegacyNode(id);
    }
  }

  function openSell() {
    keepId = '';
    retireId = '';
    challengeId = '';
    charterId = '';
    mandateId = '';
    selling = true;
  }

  function confirmSell() {
    if (needsCharter && !charterId) return;
    const options = {
      keepPlayerId: keepId || null,
      retirePlayerId: retireId || null,
      challenge: challengeId || null,
      charter: charterId || null,
      mandate: mandateId || null,
    };
    if (game.sellOrg(options)) selling = false;
  }
</script>

<div class="legacy">
  <section class="hero">
    <div class="level">
      <Icon name="crown" size={34} color="var(--gold)" />
      <div>
        <div class="big num">Legacy {fmt(p.level)}</div>
        <div class="muted small">+{fmtPct(p.level * v.m.legacyLevelPct)} income forever · {fmt(p.points)} points to spend · {p.runs} org{p.runs === 1 ? '' : 's'} sold</div>
        {#if charter || mandate}
          <div class="run-chips">
            {#if charter}
              <span class="chip" use:tooltip={() => ({ title: charter.name, subtitle: 'Founding Charter', icon: charter.icon, lines: [charter.start, `${AUTOMATION_MAP.get(charter.automation)?.name} unlocked from the start of every run.`] })}>
                <Icon name={charter.icon} size={12} /> {charter.name}
              </span>
            {/if}
            {#if mandate}
              <span class="chip" use:tooltip={() => ({ title: mandate.name, subtitle: 'Mandate for this run', icon: mandate.icon, lines: [{ text: mandate.upside, tone: 'good' }, { text: mandate.downside, tone: 'bad' }] })}>
                <Icon name={mandate.icon} size={12} /> {mandate.name}
              </span>
            {/if}
          </div>
        {/if}
      </div>
    </div>
    <div class="sell">
      <div class="pending">
        <span class="muted small">Selling now earns</span>
        <span class="gain num">+{fmt(pending)} legacy</span>
      </div>
      <span class="bar"><i style="width:{progress * 100}%"></i></span>
      <span class="dim small">Next point at {money(nextLegacyThreshold(s))} earned all time (currently {money(s.earnedTotal)})</span>
      <button class="btn gold" disabled={!canSell(s)} onclick={openSell}><Icon name="crown" size={15} /> Sell the Org</button>
    </div>
  </section>

  {#if active}
    <div class="challenge-banner">
      <Icon name={active.icon} size={18} />
      <span><b>Challenge: {active.name}</b> · {active.desc} Goal: {active.goal}. Reward: {active.reward}.</span>
    </div>
  {/if}

  <section>
    <h3 class="section-title">Legacy tree</h3>
    <p class="muted small">Spend legacy points on permanent upgrades. Unlock a node to reveal the nodes below it.</p>
    <div class="tree-wrap">
      <svg class="tree" viewBox="0 0 {WIDTH} {HEIGHT}" width={WIDTH} height={HEIGHT} role="group" aria-label="Legacy tree">
        {#each EDGES as e (`${e.from.id}-${e.to.id}`)}
          {@const a = pos(e.from)}
          {@const b = pos(e.to)}
          <path
            class="edge"
            class:lit={p.nodes[e.from.id] !== undefined}
            class:done={p.nodes[e.to.id] !== undefined}
            d="M{a.x} {a.y} C{a.x} {(a.y + b.y) / 2} {b.x} {(a.y + b.y) / 2} {b.x} {b.y}"
          />
        {/each}
        {#each LEGACY_NODES as n (n.id)}
          {@const state = nodeState(s, n.id)}
          {@const c = pos(n)}
          {@const affordable = state === 'available' && p.points >= n.cost}
          <g
            class="node {state}"
            class:affordable
            transform="translate({c.x} {c.y})"
            role="button"
            tabindex={state === 'available' ? 0 : -1}
            aria-label="{n.name}, {state}, costs {n.cost}"
            onclick={() => game.buyLegacyNode(n.id)}
            onkeydown={(e) => onNodeKey(e, n.id)}
            use:tooltip={() => nodeTip(n)}
          >
            <circle r="25" />
            <g transform="translate(-11 -11)"><Icon name={state === 'locked' ? 'lock' : n.icon} size={22} /></g>
            {#if state !== 'owned'}
              <text y="42" text-anchor="middle" class="cost">{fmt(n.cost)}</text>
            {/if}
          </g>
        {/each}
      </svg>
    </div>
  </section>

  <section>
    <h3 class="section-title">Dynasty <span class="dim">{dynastyTotal(s)} rank{dynastyTotal(s) === 1 ? '' : 's'}</span></h3>
    {#if complete}
      <div class="tree-done"><Icon name="crown" size={16} color="var(--gold)" /> The tree is complete. Every point from here goes into Dynasty ranks, which never run out, so selling the org always pays.</div>
    {:else}
      <p class="muted small">Repeatable ranks with no cap. Each one is a small permanent boost to a base rate, and the price rises with every rank, so tree nodes are usually the better buy first.</p>
    {/if}
    {#if !dynastyUnlocked(s)}
      <p class="dim small">Opens with Legacy of Champions, your first sale.</p>
    {:else}
      <div class="dynasty">
        {#each DYNASTY as d (d.id)}
          {@const rank = dynastyRank(s, d.id)}
          {@const cost = dynastyCost(rank)}
          <div class="dyn" class:owned={rank > 0}>
            <span class="dyn-icon"><Icon name={d.icon} size={20} /></span>
            <div class="dyn-main">
              <span class="dyn-name"><b>{d.name}</b> <span class="num dim">rank {fmt(rank)}</span></span>
              <span class="small muted">{d.perRank} per rank</span>
              {#if rank > 0}<span class="small good">{d.effects(rank).map((e) => describeEffect(e)).join(' ')}</span>{/if}
            </div>
            <div class="dyn-buy">
              <button class="btn small gold" disabled={p.points < cost} onclick={() => game.buyDynasty(d.id)} aria-label="Buy one {d.name} rank for {fmt(cost)} legacy points">+1 · {fmt(cost)} pts</button>
              <button class="btn small" disabled={p.points < cost} onclick={() => game.buyDynasty(d.id, true)} aria-label="Buy as many {d.name} ranks as you can afford">Max</button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>

  {#if hasSpecial(s, 'challenges')}
    <section>
      <h3 class="section-title">Challenges</h3>
      <p class="muted small">Pick a challenge when you sell the org. Beat its goal during that run for a permanent reward.</p>
      <div class="challenges">
        {#each CHALLENGES as c (c.id)}
          {@const done = p.challengesDone[c.id] !== undefined}
          <div class="challenge" class:done class:active={p.challenge === c.id}>
            <div class="chead"><Icon name={c.icon} size={18} /> <b>{c.name}</b> {#if done}<span class="chip good">Completed</span>{:else if p.challenge === c.id}<span class="chip gold-text">Active</span>{/if}</div>
            <p class="small">{c.desc}</p>
            <p class="small muted">Goal: {c.goal}</p>
            <p class="small good">Reward: {c.reward}</p>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  {#if p.legends.length > 0}
    <section>
      <h3 class="section-title">Legend coaches</h3>
      <div class="legends">
        {#each p.legends as legend, i (`${legend.tag}-${i}`)}
          <div class="legend" use:tooltip={() => ({ title: legend.tag, subtitle: `${legend.first} ${legend.last}`, icon: 'medal', iconColor: 'var(--gold)', lines: [`Retired after run ${legend.run}.`, `+5% team rating in ${GAME_MAP.get(legend.gameId)?.name ?? legend.gameId}, +2% fans.`] })}>
            <Avatar look={legend.look} gear={{ pc: 0, monitor: 0, mouse: 0, keyboard: 0, headset: 8, chair: 0, desk: 0, shoes: 0, jersey: 9, charm: 0 }} primary={s.org.primary} secondary={s.org.secondary} size={52} mode="bust" />
            <span class="ltag">{legend.tag}</span>
            <span class="dim small">{GAME_MAP.get(legend.gameId)?.name}</span>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <section>
    <h3 class="section-title">Hall of Fame</h3>
    {#if p.hallOfFame.length === 0}
      <p class="muted small">Your past orgs will be remembered here.</p>
    {:else}
      <div class="hof">
        {#each p.hallOfFame as h (h.run)}
          <div class="entry">
            <div class="org">
              {#if h.logo && s.designs[h.logo]}
                <DesignImage design={s.designs[h.logo]} size={40} />
              {:else}
                <span class="runno num">#{h.run}</span>
              {/if}
              <div>
                <div class="oname">{h.orgName}</div>
                <div class="dim small">Run {h.run} · {fmtTime(h.duration)} · {new Date(h.endedAt).toLocaleDateString()}</div>
              </div>
            </div>
            <div class="facts small">
              <span>Earned <b class="num">{money(h.earned)}</b></span>
              <span>Legacy <b class="num gold-text">+{fmt(h.legacyGained)}</b></span>
              <span>Best <b>{h.bestGame ? `${GAME_MAP.get(h.bestGame)?.name}, ${tierName(h.bestTier)}` : '—'}</b></span>
              <span>Titles <b class="num">{h.titles}</b> · Tournaments <b class="num">{h.tournamentsWon}</b></span>
              {#if h.challenge}<span class="gold-text">Challenge: {CHALLENGES.find((c) => c.id === h.challenge)?.name}</span>{/if}
            </div>
            {#if h.mvp}
              <div class="mvp">
                <Avatar look={h.mvp.look} gear={{ pc: 0, monitor: 0, mouse: 0, keyboard: 0, headset: 4, chair: 0, desk: 0, shoes: 0, jersey: 5, charm: 0 }} primary={s.org.primary} secondary={s.org.secondary} size={40} mode="bust" />
                <div class="small">
                  <div class="dim">MVP</div>
                  <b>{h.mvp.tag}</b>
                  {#if h.retired === h.mvp.tag}<span class="gold-text"> · retired</span>{/if}
                  {#if h.kept === h.mvp.tag}<span class="accent-text"> · kept</span>{/if}
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </section>
</div>

{#if selling}
  <Modal title="Sell the Org" onclose={() => (selling = false)} width={640}>
    <div class="sell-modal">
      <p>
        Sell <b>{s.org.name}</b> and start again from the garage with <b class="gold-text">+{fmt(pending)} legacy</b>
        (+{fmtPct(pending * v.m.legacyLevelPct)} income forever and {fmt(pending)} points to spend).
      </p>

      {#if p.runs === 0}
        <div class="first-sale">
          <Icon name="crown" size={16} color="var(--gold)" />
          <span><b>First sale bonus:</b> Legacy of Champions (+10% income) is yours free, plus {FOUNDING_POINTS} extra points to spend.</span>
        </div>
      {/if}

      {#if needsCharter}
        <h4 class="pick-title">Choose a Founding Charter <span class="dim">· kept for every run</span></h4>
        <div class="picks">
          {#each CHARTERS as c (c.id)}
            <button type="button" class="pick" class:chosen={charterId === c.id} aria-pressed={charterId === c.id} onclick={() => (charterId = c.id)}>
              <span class="pick-head"><Icon name={c.icon} size={17} /> <b>{c.name}</b></span>
              <span class="pick-line muted">{c.start}</span>
              <span class="pick-line accent-text"><Icon name="zap" size={12} /> {AUTOMATION_MAP.get(c.automation)?.name} from the start</span>
            </button>
          {/each}
        </div>
      {/if}

      <h4 class="pick-title">Mandate for the next run <span class="dim">· optional, one run only</span></h4>
      <div class="picks">
        {#each offers as m (m.id)}
          <button type="button" class="pick" class:chosen={mandateId === m.id} aria-pressed={mandateId === m.id} onclick={() => (mandateId = mandateId === m.id ? '' : m.id)}>
            <span class="pick-head"><Icon name={m.icon} size={17} /> <b>{m.name}</b></span>
            <span class="pick-line good">+ {m.upside}</span>
            <span class="pick-line bad">− {m.downside}</span>
          </button>
        {/each}
      </div>
      <div class="lists">
        <div>
          <h4>You keep</h4>
          <ul class="small">
            <li>Org name, logo, jersey and all designs</li>
            <li>Achievements and all-time stats</li>
            <li>Trophies, operation levels and trophy upgrades</li>
            <li>Your founder's look and tag</li>
            {#if hasSpecial(s, 'keepDecor')}<li>Gaming House decor</li>{/if}
            {#if hasSpecial(s, 'keepMerch')}<li>Unlocked merch products</li>{/if}
          </ul>
        </div>
        <div>
          <h4>You lose</h4>
          <ul class="small">
            <li>Cash, fans and operations</li>
            <li>Upgrades (except trophy upgrades)</li>
            <li>Teams, players, staff and sponsors</li>
          </ul>
        </div>
      </div>

      {#if hasSpecial(s, 'keepPlayer')}
        <label class="field">
          <span>Franchise player to keep</span>
          <select bind:value={keepId}>
            <option value="">Nobody</option>
            {#each tradable as pl (pl.id)}
              <option value={pl.id}>{pl.tag} · Lv {pl.level} · {GAME_MAP.get(pl.gameId)?.name}</option>
            {/each}
          </select>
        </label>
      {/if}
      {#if hasSpecial(s, 'legends')}
        <label class="field">
          <span>Player to retire as a legend coach</span>
          <select bind:value={retireId}>
            <option value="">Nobody</option>
            {#each tradable.filter((pl) => pl.id !== keepId) as pl (pl.id)}
              <option value={pl.id}>{pl.tag} · Lv {pl.level} · {GAME_MAP.get(pl.gameId)?.name}</option>
            {/each}
          </select>
        </label>
      {/if}
      {#if hasSpecial(s, 'challenges')}
        <label class="field">
          <span>Challenge for the next run</span>
          <select bind:value={challengeId}>
            <option value="">No challenge</option>
            {#each CHALLENGES.filter((c) => p.challengesDone[c.id] === undefined) as c (c.id)}
              <option value={c.id}>{c.name}: {c.goal} ({c.reward})</option>
            {/each}
          </select>
        </label>
      {/if}
    </div>
    {#snippet footer()}
      <button class="btn" onclick={() => (selling = false)}>Not yet</button>
      <button class="btn gold" disabled={!canSell(s) || (needsCharter && !charterId)} onclick={confirmSell}>
        <Icon name="crown" size={14} />
        {needsCharter && !charterId ? 'Choose a charter first' : `Sell for +${fmt(pending)} legacy`}
      </button>
    {/snippet}
  </Modal>
{/if}

<style>
  .run-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
  }
  .first-sale {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 9px;
    border: 1px solid color-mix(in srgb, var(--gold) 45%, transparent);
    background: color-mix(in srgb, var(--gold) 9%, transparent);
    font-size: 13px;
  }
  .pick-title {
    margin: 4px 0 -2px;
    font-family: var(--font-ui);
    font-size: 14px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .picks {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
    gap: 8px;
  }
  .pick {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
    padding: 10px;
    text-align: left;
    border-radius: 10px;
    border: 1.5px solid var(--line);
    background: var(--bg-2);
  }
  .pick:hover {
    border-color: var(--line-2);
  }
  .pick.chosen {
    border-color: var(--accent);
    background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 14%, transparent), transparent 65%), var(--bg-2);
  }
  .pick-head {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-ui);
    font-size: 15px;
  }
  .pick-line {
    display: flex;
    align-items: flex-start;
    gap: 4px;
    font-size: 12px;
    line-height: 1.3;
  }
  .legacy {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .small {
    font-size: 12px;
    margin: 0;
  }
  .hero {
    display: grid;
    grid-template-columns: 1fr minmax(240px, 320px);
    gap: 14px;
    padding: 14px;
    border-radius: 12px;
    border: 1px solid color-mix(in srgb, var(--gold) 35%, transparent);
    background: linear-gradient(135deg, color-mix(in srgb, var(--gold) 12%, transparent), transparent 60%), var(--bg-2);
  }
  .level {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .big {
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 24px;
    color: var(--gold);
  }
  .sell {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .pending {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .gain {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 18px;
    color: var(--gold);
  }
  .sell .bar i {
    background: linear-gradient(90deg, #b8862f, var(--gold));
  }
  .challenge-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 9px;
    border: 1px solid var(--gold);
    background: color-mix(in srgb, var(--gold) 10%, transparent);
    color: var(--gold);
    font-size: 13px;
  }
  .challenge-banner span {
    color: var(--text);
  }
  .tree-wrap {
    overflow-x: auto;
    border-radius: 12px;
    border: 1px solid var(--line);
    background:
      radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--gold) 8%, transparent), transparent 60%),
      var(--bg-2);
  }
  .tree {
    display: block;
    margin: 0 auto;
    max-width: none;
  }
  .edge {
    fill: none;
    stroke: var(--line-2);
    stroke-width: 2;
  }
  .edge.lit {
    stroke: color-mix(in srgb, var(--accent) 50%, transparent);
  }
  .edge.done {
    stroke: var(--gold);
  }
  .node {
    cursor: default;
    outline: none;
  }
  .node circle {
    fill: var(--panel);
    stroke: var(--line-2);
    stroke-width: 2;
  }
  .node :global(svg) {
    color: var(--dim);
  }
  .node.available circle {
    stroke: var(--accent);
  }
  .node.available :global(svg) {
    color: var(--accent);
  }
  .node.available.affordable {
    cursor: pointer;
  }
  .node.available.affordable circle {
    fill: color-mix(in srgb, var(--accent) 12%, transparent);
    filter: drop-shadow(0 0 6px color-mix(in srgb, var(--accent) 60%, transparent));
  }
  .node.owned circle {
    fill: color-mix(in srgb, var(--gold) 20%, transparent);
    stroke: var(--gold);
  }
  .node.owned :global(svg) {
    color: var(--gold);
  }
  .node:focus-visible circle {
    stroke-width: 4;
  }
  .cost {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 13px;
    fill: var(--muted);
  }
  .node.affordable .cost {
    fill: var(--accent);
  }
  .tree-done {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    padding: 8px 10px;
    border-radius: 9px;
    border: 1px solid color-mix(in srgb, var(--gold) 45%, transparent);
    background: color-mix(in srgb, var(--gold) 9%, transparent);
    font-size: 13px;
  }
  .dynasty {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 8px;
  }
  .dyn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 10px;
    border-radius: 10px;
    border: 1px solid var(--line);
    background: var(--bg-2);
  }
  .dyn.owned {
    border-color: color-mix(in srgb, var(--gold) 35%, transparent);
  }
  .dyn-icon {
    display: grid;
    place-items: center;
    flex: none;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    color: var(--gold);
    border: 1.5px solid color-mix(in srgb, var(--gold) 45%, transparent);
    background: radial-gradient(circle, color-mix(in srgb, var(--gold) 16%, transparent), transparent 70%), var(--bg);
  }
  .dyn-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .dyn-name {
    font-family: var(--font-ui);
    font-size: 15px;
  }
  .dyn-buy {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: none;
  }
  .challenges {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 8px;
  }
  .challenge {
    padding: 10px;
    border-radius: 10px;
    border: 1px solid var(--line);
    background: var(--bg-2);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .challenge.done {
    border-color: color-mix(in srgb, var(--green) 45%, transparent);
  }
  .challenge.active {
    border-color: var(--gold);
  }
  .chead {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-ui);
  }
  .chip.good {
    color: var(--green);
    border-color: var(--green);
  }
  .legends {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .legend {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px;
    border-radius: 10px;
    border: 1px solid color-mix(in srgb, var(--gold) 40%, transparent);
    background: var(--bg-2);
    min-width: 96px;
  }
  .ltag {
    font-family: var(--font-ui);
    font-weight: 700;
  }
  .hof {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .entry {
    display: grid;
    grid-template-columns: minmax(180px, 1fr) 2fr auto;
    align-items: center;
    gap: 12px;
    padding: 8px 10px;
    border-radius: 10px;
    border: 1px solid var(--line);
    background: var(--bg-2);
  }
  .org {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .runno {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: color-mix(in srgb, var(--gold) 12%, transparent);
    color: var(--gold);
    font-family: var(--font-display);
  }
  .oname {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 15px;
  }
  .facts {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 14px;
    color: var(--muted);
  }
  .facts b {
    color: var(--text);
  }
  .mvp {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .mvp :global(svg) {
    border-radius: 6px;
  }
  .sell-modal {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .sell-modal p {
    margin: 0;
  }
  .lists {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .lists h4 {
    margin: 0 0 4px;
    font-family: var(--font-ui);
  }
  .lists ul {
    margin: 0;
    padding-left: 18px;
    color: var(--muted);
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 3px;
    font-size: 12.5px;
    color: var(--muted);
  }
  .field select {
    padding: 6px 8px;
    border-radius: 6px;
    border: 1px solid var(--line-2);
    background: var(--panel);
    color: var(--text);
  }
  @media (max-width: 760px) {
    .hero,
    .entry,
    .lists {
      grid-template-columns: 1fr;
    }
  }
</style>
