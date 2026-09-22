<script lang="ts">
  import { GENRE_WEIGHTS, getGame } from '../../data/games';
  import { GEAR_MAX_TIER, GEAR_SLOTS, gearRarity } from '../../data/gear';
  import { NATIONS } from '../../data/names';
  import { fmt, fmtPct, fmtTime, money } from '../../engine/format';
  import {
    ALL_STATS,
    RARITY_MAP,
    STAT_LABEL,
    baseStat,
    gearStatMult,
    gearTraitMult,
    gearUpgradeCost,
    isAvailable,
    randomLook,
    transferValue,
    skillRating,
    traitsOf,
    xpToNext,
  } from '../../engine/players';
  import { Rng } from '../../engine/rng';
  import { teamKit } from '../../engine/teams';
  import { BENCH_RECOVERY_MULT } from '../../engine/health';
  import type { Appearance } from '../../engine/types';
  import { game } from '../game.svelte';
  import { tooltip } from '../tooltip.svelte';
  import { statTip } from '../statInfo';
  import Avatar from './Avatar.svelte';
  import GearIcon from './GearIcon.svelte';
  import Icon from './Icon.svelte';
  import LookEditor from './LookEditor.svelte';
  import Modal from './Modal.svelte';
  import RosterImpact from './RosterImpact.svelte';
  import { previewAssign } from '../../engine/roster';

  /** Pip indices for the 15-step gear track. */
  const PIPS = Array.from({ length: GEAR_MAX_TIER }, (_, i) => i);

  type Tab = 'stats' | 'gear' | 'look' | 'lineup';
  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'stats', label: 'Stats', icon: 'activity' },
    { id: 'gear', label: 'Gear', icon: 'cpu' },
    { id: 'look', label: 'Look', icon: 'palette' },
    { id: 'lineup', label: 'Lineup', icon: 'users' },
  ];

  let tab = $state<Tab>('stats');
  let confirmSell = $state(false);
  let initialLook = $state<Appearance | null>(null);
  let hasLookChanges = $state(false);
  let confirmDiscard = $state(false);

  const v = $derived(game.view);
  const p = $derived(game.selectedPlayer ? v.s.players[game.selectedPlayer] : undefined);

  $effect(() => {
    game.viewingGear = !!(game.selectedPlayer && tab === 'gear');
    return () => {
      game.viewingGear = false;
    };
  });

  $effect(() => {
    if (p && !initialLook) {
      initialLook = { ...p.look };
    }
  });

  function close() {
    game.selectedPlayer = null;
    game.viewingGear = false;
    confirmSell = false;
    initialLook = null;
    hasLookChanges = false;
    confirmDiscard = false;
  }

  function handleLookChange(patch: Partial<Appearance>) {
    if (!p) return;
    hasLookChanges = true;
    game.updateLook(p.id, patch);
  }

  function randomise() {
    if (!p) return;
    hasLookChanges = true;
    game.updateLook(p.id, randomLook(new Rng({ rng: (Math.random() * 4294967296) >>> 0 })));
  }

  /** Keeps the new look: it becomes the one "Undo" goes back to. */
  function saveLook(andClose = false) {
    if (p) initialLook = { ...p.look };
    hasLookChanges = false;
    confirmDiscard = false;
    if (andClose) close();
  }

  /** Puts the look back the way it was when the editor opened (or was last saved). */
  function undoLook(andClose = false) {
    if (initialLook && p) game.updateLook(p.id, { ...initialLook });
    hasLookChanges = false;
    confirmDiscard = false;
    if (andClose) close();
  }

  /** Closing with unsaved look changes asks first, in the footer, rather than guessing. */
  function requestClose() {
    if (hasLookChanges) {
      tab = 'look';
      confirmDiscard = true;
      return;
    }
    close();
  }

  function nationName(code: string): string {
    return NATIONS.find((n) => n.code === code)?.name ?? code;
  }
</script>

{#snippet lookFooter()}
  <div class="look-bar" class:asking={confirmDiscard}>
    {#if confirmDiscard}
      <span class="look-state"><Icon name="palette" size={14} /> Keep {p ? `${p.tag}'s` : 'the'} new look?</span>
      <button class="btn" onclick={() => undoLook(true)}>Undo changes</button>
      <button class="btn primary" onclick={() => saveLook(true)}>Keep it</button>
    {:else}
      <span class="look-state dim">{hasLookChanges ? 'Unsaved changes. The preview shows them live.' : 'No changes yet.'}</span>
      <button class="btn" disabled={!hasLookChanges} onclick={() => undoLook()}>Undo changes</button>
      <button class="btn primary" disabled={!hasLookChanges} onclick={() => saveLook()}>Save look</button>
    {/if}
  </div>
{/snippet}

{#if p}
  {@const g = getGame(p.gameId)}
  {@const rarity = RARITY_MAP.get(p.rarity)!}
  {@const team = v.s.teams[p.gameId]}
  {@const slot = team ? team.lineup.indexOf(p.id) : -1}
  <Modal title={p.founder ? `${p.tag} · Founder` : `${p.first} “${p.tag}” ${p.last}`} onclose={requestClose} width={860} footer={tab === 'look' || hasLookChanges ? lookFooter : undefined}>
    <div class="detail" style="--rc:{rarity.color}; --gc:{g.color}">
      <aside class="side">
        <div class="stage">
          <Avatar look={p.look} gear={p.gear} primary={teamKit(v.s, p.gameId).primary} secondary={teamKit(v.s, p.gameId).secondary} size={132} number={p.jersey} tag={p.tag} />
        </div>
        <div class="chips">
          <span class="chip rarity">{p.founder ? 'Founder' : rarity.name}</span>
          <span class="chip"><Icon name={g.icon} size={12} color={g.color} /> {g.name}</span>
          <span class="chip">{g.roles[p.role]}</span>
        </div>
        <div class="muted small">{nationName(p.nation)} · age {p.age} · #{p.jersey}{p.founder ? '' : ` · ${p.seasons} season${p.seasons === 1 ? '' : 's'} with you`}</div>
        {#if p.retiring}
          <div class="status warn"><Icon name="calendar-clock" size={14} /> Retiring after this season. Sell now for a fee, or give them a send-off.</div>
        {/if}

        <div class="meter">
          <div class="meter-head"><span>Level {p.level}</span><span class="num muted">{Math.floor(p.xp)}/{xpToNext(p.level)} XP</span></div>
          <span class="bar"><i style="width:{Math.min(100, (p.xp / xpToNext(p.level)) * 100)}%"></i></span>
        </div>
        <div class="meter">
          <div class="meter-head"><span>Energy</span><span class="num muted">{Math.round(p.energy)}</span></div>
          <span class="bar energy"><i style="width:{p.energy}%"></i></span>
        </div>
        <div class="meter">
          <div class="meter-head"><span>Morale</span><span class="num muted">{Math.round(p.morale)}</span></div>
          <span class="bar morale"><i style="width:{p.morale}%"></i></span>
        </div>
        {#if !isAvailable(p, v.s.time)}
          {@const benched = !team?.lineup.includes(p.id)}
          <div class="status bad">
            <Icon name="thermometer" size={14} />
            <div>
              <b>{p.status.reason || 'Unavailable'}</b> · back in {fmtTime(Math.max(0, p.status.until - v.s.time) / (benched ? BENCH_RECOVERY_MULT : 1))}
              <div class="dim small">{benched ? `Resting on the bench: recovering ${BENCH_RECOVERY_MULT}× faster.` : `Bench them to recover ${BENCH_RECOVERY_MULT}× faster.`}</div>
            </div>
          </div>
        {/if}

        <dl>
          <dt>Record</dt>
          <dd class="num">{fmt(p.wins)}W {fmt(p.matches - p.wins)}L ({p.matches ? fmtPct(p.wins / p.matches) : '—'})</dd>
          <dt>Prize cut</dt>
          <dd class="num">{fmtPct(p.cut)}</dd>
          {#if !p.founder}
            {@const levels = Math.max(0, p.level - p.signedLevel)}
            <dt>Resale value</dt>
            <dd class="num" use:tooltip={() => ({ title: 'Transfer value', icon: 'handshake', lines: [levels > 0 ? `Includes ${levels} level${levels === 1 ? '' : 's'} developed with you, priced from the income they bring in.` : 'No development with you yet: sells for about what they cost.', { text: 'Young players carry a premium; veterans and retirees sell for less.', tone: 'muted' }] })}>{money(transferValue(p, v.r.teams[p.gameId]?.cps ?? 0, g.teamSize))}</dd>
          {/if}
        </dl>

        {#if p.milestones.length > 0}
          <div class="career">
            <h4>Career</h4>
            <ul>
              {#each p.milestones as m (m.id)}
                <li><Icon name="medal" size={12} color="var(--gold)" /> {m.label}{#if m.run !== v.s.prestige.runs + 1}{' '}<span class="dim">· run {m.run}</span>{/if}</li>
              {/each}
            </ul>
          </div>
        {/if}

        {#if !p.founder}
          {#if confirmSell}
            <div class="sell">
              <button class="btn danger small" onclick={() => (game.sellPlayer(p.id), (confirmSell = false))}>Confirm sale</button>
              <button class="btn small" onclick={() => (confirmSell = false)}>Cancel</button>
            </div>
          {:else}
            <button class="btn small" onclick={() => (confirmSell = true)}><Icon name="handshake" size={13} /> Sell to rival org</button>
          {/if}
        {/if}
      </aside>

      <section class="main">
        <nav class="tabs">
          {#each TABS as t (t.id)}
            <button class:active={tab === t.id} onclick={() => (tab = t.id)}><Icon name={t.icon} size={14} /> {t.label}</button>
          {/each}
        </nav>

        {#if tab === 'stats'}
          <div class="rating">
            <span class="big num">{fmt(skillRating(p, g))}</span>
            <span class="muted">skill rating in {g.name}</span>
          </div>
          <div class="stats">
            {#each ALL_STATS as st (st)}
              {@const base = baseStat(p, st)}
              {@const mult = gearStatMult(p, st)}
              {@const weight = (GENRE_WEIGHTS[g.genre] as Record<string, number>)[st] ?? 0}
              {@const scale = Math.max(p.potential, 100)}
              <div class="stat" use:tooltip={() => statTip(st, g, base)}>
                <span class="sname">{STAT_LABEL[st]}{#if weight > 0}<span class="weight">{Math.round(weight * 100)}%</span>{/if}</span>
                <span class="sbar">
                  <i style="width:{Math.min(100, (base / scale) * 100)}%"></i>
                  <b style="left:{(p.potential / scale) * 100}%" title="Potential"></b>
                </span>
                <span class="sval num">{Math.round(base)}{#if mult > 1.001}{' '}<span class="good">×{fmt(mult, 2)}</span>{/if}</span>
              </div>
            {/each}
          </div>
          <p class="muted small">
            The white marker is potential ({p.potential}). Percentages show how much each stat matters in {g.name}. Charisma
            attracts fans; Stamina slows energy loss.
          </p>
          <h4>Traits</h4>
          <div class="traits">
            {#each traitsOf(p) as t (t.id)}
              <div class="trait {t.tone}">
                <Icon name={t.icon} size={18} />
                <div><b>{t.name}</b><span class="muted">{t.desc}</span></div>
              </div>
            {/each}
          </div>
        {:else if tab === 'gear'}
          <div class="gear">
            {#each GEAR_SLOTS as gs (gs.id)}
              {@const tier = p.gear[gs.id]}
              {@const maxed = tier >= GEAR_MAX_TIER}
              {@const cost = gearUpgradeCost(p, gs.id, v.m)}
              {@const tm = gearTraitMult(p, gs.id)}
              {@const rarity = gearRarity(tier)}
              <div class="gear-row" class:maxed style="--r:{rarity.color}">
                <GearIcon slot={gs.id} {tier} size={56} />
                <div class="ginfo">
                  <div class="gname">
                    {gs.tiers[tier]}
                    <span class="rarity">{rarity.name}</span>
                  </div>
                  <div class="gdesc muted">
                    {gs.stats.map((st) => STAT_LABEL[st]).join(' & ')} ×{fmt(Math.pow(gs.growth, tier * tm), 2)}
                    {#if !maxed}<span class="good"> → ×{fmt(Math.pow(gs.growth, (tier + 1) * tm), 2)}</span>{/if}
                  </div>
                  <div class="pips" aria-hidden="true">
                    {#each PIPS as i (i)}<i class:on={i < tier}></i>{/each}
                  </div>
                  {#if !maxed}
                    <div class="next dim"><GearIcon slot={gs.id} tier={tier + 1} size={24} showTier={false} /> Next: {gs.tiers[tier + 1]}</div>
                  {/if}
                </div>
                {#if maxed}
                  <span class="chip gold-text">MAX</span>
                {:else}
                  <button class="btn small" class:primary={v.s.cash >= cost} disabled={v.s.cash < cost} onclick={() => game.buyGear(p.id, gs.id)}>
                    {money(cost)}
                  </button>
                {/if}
              </div>
            {/each}
          </div>
        {:else if tab === 'look'}
          <div class="names">
            <label>Tag <input value={p.tag} maxlength="16" onchange={(e) => game.renamePlayer(p.id, { tag: e.currentTarget.value })} /></label>
            {#if !p.founder}
              <label>First <input value={p.first} maxlength="16" onchange={(e) => game.renamePlayer(p.id, { first: e.currentTarget.value })} /></label>
              <label>Last <input value={p.last} maxlength="20" onchange={(e) => game.renamePlayer(p.id, { last: e.currentTarget.value })} /></label>
            {/if}
            <label class="short">No. <input type="number" min="0" max="99" value={p.jersey} onchange={(e) => game.renamePlayer(p.id, { jersey: Number(e.currentTarget.value) })} /></label>
          </div>
          <LookEditor look={p.look} onchange={handleLookChange} onrandomise={randomise} />
        {:else if tab === 'lineup'}
          {#if team}
            <p>
              {slot >= 0 ? `Starting as ${g.roles[slot]}.` : 'Currently on the bench.'}
              {#if g.teamSize > 1}Preferred role: <b>{g.roles[p.role]}</b> (other roles play at 85%).{/if}
            </p>
            <div class="slots">
              {#each team.lineup as id, i (i)}
                {@const occ = id ? v.s.players[id] : undefined}
                {@const pv = i === slot ? null : previewAssign(v.s, p.gameId, p.id, i, v.m)}
                <button class="slot-btn" class:current={i === slot} class:preferred={i === p.role && g.teamSize > 1} onclick={() => game.assignSlot(p.gameId, p.id, i)}>
                  <b>{g.roles[i]}</b>
                  <span>{occ ? occ.tag : 'Empty'}</span>
                  {#if pv}<RosterImpact preview={pv} />{:else}<span class="here dim">Playing here</span>{/if}
                </button>
              {/each}
            </div>
            {#if slot >= 0}
              <button class="btn small" onclick={() => game.benchPlayer(p.gameId, p.id)}><Icon name="arrow-down" size={13} /> Move to bench</button>
            {/if}
          {/if}
        {/if}
      </section>
    </div>
  </Modal>
{/if}

<style>
  .detail {
    display: grid;
    grid-template-columns: 230px 1fr;
    gap: 16px;
  }
  .side {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .stage {
    display: grid;
    place-items: center;
    padding: 10px 0 4px;
    border-radius: 12px;
    background:
      radial-gradient(circle at 50% 35%, color-mix(in srgb, var(--gc) 25%, transparent), transparent 65%),
      var(--bg-2);
    border: 1px solid color-mix(in srgb, var(--rc) 40%, var(--line));
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .chip.rarity {
    color: var(--rc);
    border-color: var(--rc);
  }
  .small {
    font-size: 12px;
    margin: 0;
  }
  .meter-head {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    margin-bottom: 3px;
  }
  .bar.energy i {
    background: var(--lime);
  }
  .bar.morale i {
    background: var(--accent-2);
  }
  .career h4 {
    margin: 4px 0 3px;
    font-family: var(--font-ui);
    font-size: 13px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .career ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 12px;
  }
  .career li {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .status.warn {
    color: var(--gold);
    border-color: color-mix(in srgb, var(--gold) 40%, transparent);
    background: color-mix(in srgb, var(--gold) 8%, transparent);
  }
  .status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
  }
  dl {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 2px 10px;
    margin: 4px 0;
    font-size: 12.5px;
  }
  dt {
    color: var(--muted);
  }
  dd {
    margin: 0;
    text-align: right;
  }
  .sell {
    display: flex;
    gap: 6px;
  }
  .main {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .tabs {
    display: flex;
    gap: 4px;
    border-bottom: 1px solid var(--line);
    padding-bottom: 6px;
  }
  .tabs button {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    border-radius: 7px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--muted);
    font-family: var(--font-ui);
    font-weight: 700;
  }
  .tabs button.active {
    color: var(--accent);
    border-color: var(--line-2);
    background: color-mix(in srgb, var(--accent) 10%, transparent);
  }
  .rating {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .big {
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 30px;
    color: var(--rc);
  }
  .stats {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .stat {
    display: grid;
    grid-template-columns: 130px 1fr 90px;
    align-items: center;
    gap: 10px;
    font-size: 13px;
  }
  .weight {
    margin-left: 6px;
    font-size: 10px;
    padding: 0 5px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--gc) 20%, transparent);
    color: var(--gc);
  }
  .sbar {
    position: relative;
    height: 7px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.06);
  }
  .sbar i {
    position: absolute;
    inset: 0 auto 0 0;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--gold), var(--accent));
  }
  .sbar b {
    position: absolute;
    top: -3px;
    bottom: -3px;
    width: 2px;
    background: #fff;
    opacity: 0.7;
  }
  .sval {
    text-align: right;
  }
  h4 {
    margin: 4px 0 0;
    font-family: var(--font-ui);
    font-size: 15px;
  }
  .traits {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 6px;
  }
  .trait {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    padding: 6px 8px;
    border-radius: 8px;
    background: var(--bg-2);
    border: 1px solid var(--line);
    font-size: 12.5px;
  }
  .trait div {
    display: flex;
    flex-direction: column;
  }
  .trait.good {
    color: var(--green);
  }
  .trait.bad {
    color: var(--red);
  }
  .trait.mixed {
    color: var(--gold);
  }
  .trait b {
    color: var(--text);
  }
  .gear {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .gear-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 9px;
    border-radius: 9px;
    background: linear-gradient(90deg, color-mix(in srgb, var(--r) 10%, transparent), transparent 42%), var(--bg-2);
    border: 1px solid color-mix(in srgb, var(--r) 28%, var(--line));
  }
  .gear-row.maxed {
    border-color: color-mix(in srgb, var(--r) 60%, transparent);
  }
  .rarity {
    margin-left: 4px;
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 10.5px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--r);
    vertical-align: 1px;
  }
  /* A 15-step track so the distance left to max is visible without reading numbers. */
  .pips {
    display: flex;
    gap: 2px;
    margin: 4px 0 3px;
  }
  .pips i {
    flex: 1;
    height: 3px;
    border-radius: 2px;
    background: var(--line);
  }
  .pips i.on {
    background: var(--r);
    box-shadow: 0 0 5px color-mix(in srgb, var(--r) 55%, transparent);
  }
  .ginfo {
    flex: 1;
    min-width: 0;
  }
  .gname {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 14.5px;
  }
  .tier {
    font-size: 11px;
    color: var(--dim);
  }
  .gdesc,
  .next {
    font-size: 11.5px;
  }
  .next {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .names {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .names label {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 11px;
    color: var(--muted);
    flex: 1;
    min-width: 110px;
  }
  .names label.short {
    flex: 0 0 64px;
    min-width: 64px;
  }
  .names input {
    padding: 5px 8px;
    border-radius: 6px;
    border: 1px solid var(--line-2);
    background: var(--bg-2);
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 14px;
    width: 100%;
  }
  .names input:focus {
    outline: none;
    border-color: var(--accent);
  }
  .slots {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;
  }
  .slot-btn {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 6px 10px;
    border-radius: 8px;
    border: 1px solid var(--line-2);
    background: var(--bg-2);
    min-width: 110px;
  }
  .slot-btn b {
    font-size: 12px;
    font-family: var(--font-ui);
  }
  .slot-btn span {
    font-size: 11.5px;
    color: var(--muted);
  }
  .slot-btn.preferred {
    border-color: var(--gold);
  }
  .slot-btn.current {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, transparent);
  }
  .look-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    width: 100%;
  }
  .look-state {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-right: auto;
    font-size: 12.5px;
  }
  .look-bar.asking .look-state {
    color: var(--gold);
    font-weight: 700;
  }
  @media (max-width: 720px) {
    .detail {
      grid-template-columns: 1fr;
    }
    .stat {
      grid-template-columns: 100px 1fr 70px;
    }
  }
</style>
