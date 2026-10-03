<script lang="ts">
  import { STAFF, STAT_DESCRIPTIONS, effectAmount, type StaffDef } from '../../data/staff';
  import { fmt, money } from '../../engine/format';
  import { bulkAmount, bulkAmounts, hasQol, isStaffUnlocked, maxStaffAffordable, staffPower, staffPrice, totalStaff } from '../../engine/staff';
  import Agenda from '../components/Agenda.svelte';
  import { hinted } from '../hints';
  import FrontOffice from '../components/FrontOffice.svelte';
  import Icon from '../components/Icon.svelte';
  import { game } from '../game.svelte';
  import { countQuality } from '../theme';
  import { tooltip, type TipContent } from '../tooltip.svelte';

  import { hasTheOnlyCook } from '../../engine/easterEggs';
  import { randomLook } from '../../engine/players';
  import { Rng } from '../../engine/rng';
  import type { Appearance } from '../../engine/types';
  import Avatar from '../components/Avatar.svelte';
  import { GEAR_SLOTS, type GearSlot } from '../../data/gear';

  /** A face for every job: the same person turns up for each staff type, every time. */
  function seedOf(text: string): number {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
    return h >>> 0;
  }
  /** Staff wear plain clothes: no gear on show. */
  const NO_GEAR = Object.fromEntries(GEAR_SLOTS.map((g) => [g.id, 0])) as Record<GearSlot, number>;
  const FACES: Record<string, Appearance> = Object.fromEntries(STAFF.map((d) => [d.id, randomLook(new Rng({ rng: seedOf(`staff-${d.id}`) }))]));

  const AMOUNTS: { value: number; label: string }[] = [
    { value: 1, label: '1' },
    { value: 10, label: '10' },
    { value: 100, label: '100' },
    { value: -1, label: 'Max' },
  ];

  const v = $derived(game.view);
  const amounts = $derived(bulkAmounts(v.s));
  const amount = $derived(bulkAmount(v.s));
  const coach = STAFF.find((d) => d.qol?.id === 'advisor');
  const staffHint = $derived(hinted(v.s, 'staff'));
  /** The staff role that brings each bulk amount, for the locked buttons' tooltips. */
  const AMOUNT_SOURCE: Record<number, StaffDef | undefined> = {
    10: STAFF.find((d) => d.qol?.id === 'buy10'),
    100: STAFF.find((d) => d.qol?.id === 'buy100'),
    [-1]: STAFF.find((d) => d.qol?.id === 'buyMax'),
  };
  const nextLocked = $derived(STAFF.find((d) => !isStaffUnlocked(v.s, d)));

  function info(def: StaffDef): { n: number; price: number; ok: boolean } {
    const owned = v.s.staff[def.id] ?? 0;
    const costMult = v.m.staffCostMult;
    if (def.id === 'chef' && hasTheOnlyCook(v.s)) {
      if (owned >= 1) return { n: 0, price: 0, ok: false };
      const price = staffPrice(def, 0, 1, costMult);
      return { n: 1, price, ok: v.s.cash >= price };
    }
    if (amount < 0) {
      const max = maxStaffAffordable(def, owned, v.s.cash, costMult);
      const n = Math.max(1, max);
      return { n, price: staffPrice(def, owned, n, costMult), ok: max > 0 };
    }
    const price = staffPrice(def, owned, amount, costMult);
    return { n: amount, price, ok: v.s.cash >= price };
  }

  function effectLines(def: StaffDef, hires: number): string[] {
    const power = staffPower(hires, game.view.m.staffMult[def.id] ?? 1, def.softCapFrom, def.softExponent);
    return def.effects.map((e) => STAT_DESCRIPTIONS[e.stat](effectAmount(e, power)));
  }

  function tip(def: StaffDef): TipContent {
    const { s } = game.view;
    const owned = s.staff[def.id] ?? 0;
    const step = amount > 0 ? amount : 1;
    const lines: TipContent['lines'] = [{ text: def.desc, tone: 'muted' }];
    if (owned > 0) {
      lines.push({ text: `With ${fmt(owned)}:`, tone: 'good' });
      for (const l of effectLines(def, owned)) lines.push({ text: `  ${l}`, tone: 'good' });
    }
    if (def.qol) {
      lines.push(
        owned > 0
          ? { text: `Tool: ${def.qol.name}. ${def.qol.desc}`, tone: 'gold' }
          : { text: `First hire brings a tool: ${def.qol.name}. ${def.qol.desc}`, tone: 'gold' },
      );
    }
    lines.push({ text: `With ${fmt(owned + step)}:`, tone: 'cyan' });
    for (const l of effectLines(def, owned + step)) lines.push({ text: `  ${l}`, tone: 'cyan' });
    // Some roles level off toward a limit. Say how close the team is, so a slowing return is never a surprise.
    const power = staffPower(owned, v.m.staffMult[def.id] ?? 1, def.softCapFrom, def.softExponent);
    for (const e of def.effects) {
      if (e.max === undefined || owned <= 0) continue;
      const now = effectAmount(e, power);
      lines.push({ text: `Levelling off: ${Math.round((now / e.max) * 100)}% of the most this can give (${STAT_DESCRIPTIONS[e.stat](e.max)}). It keeps climbing, more slowly.`, tone: 'muted' });
    }
    if (def.softCapFrom !== undefined && owned >= def.softCapFrom) {
      lines.push({ text: `Past ${def.softCapFrom} hires each new one helps much less, but never nothing.`, tone: 'muted' });
    }
    return { title: def.name, subtitle: `Employed: ${fmt(owned)}`, icon: def.icon, iconColor: countQuality(owned), lines, flavor: def.flavor };
  }
</script>

<div class="staff">
  <header class="head">
    <div>
      <h2 class="section-title">Staff <span class="dim">{fmt(totalStaff(v.s))} employed</span></h2>
      <p class="muted small">
        Staff work for every team at once. Each extra hire helps a little less than the last. Some roles level off toward a limit, and their tooltip shows how close you are; none ever stops helping.
      </p>
    </div>
  </header>

  {#if hasQol(v.s, 'advisor')}
    <Agenda />
  {:else if coach && isStaffUnlocked(v.s, coach)}
    <div class="plan-teaser">
      <Icon name="list-checks" size={18} />
      <span><b>Hire a Coach for a game plan.</b> <span class="muted">Your first Coach keeps a list of next steps here: the next goal, any team in trouble and the best opportunity.</span></span>
    </div>
  {/if}

  <div class="list-head">
    <h3 class="section-title">Hire</h3>
    <div class="seg" aria-label="How many to hire at once">
      {#each AMOUNTS as a (a.value)}
        {#if amounts.includes(a.value)}
          <button class:active={amount === a.value} onclick={() => game.setSetting('buyAmount', a.value)}>{a.label}</button>
        {:else}
          {@const src = AMOUNT_SOURCE[a.value]}
          <button
            class="locked"
            aria-disabled="true"
            use:tooltip={() => ({ title: src?.qol?.name ?? 'Locked', icon: 'lock', lines: [src?.qol?.desc ?? '', { text: `Comes with your first ${src?.name ?? 'hire'}.`, tone: 'cyan' as const }] })}
          ><Icon name="lock" size={10} /> {a.label}</button>
        {/if}
      {/each}
    </div>
  </div>

  <div class="list">
    {#each STAFF as def (def.id)}
      {#if isStaffUnlocked(v.s, def)}
        {@const i = info(def)}
        {@const owned = v.s.staff[def.id] ?? 0}
        <button
          class="row"
          class:tut-target={staffHint && def.id === 'coach' && owned === 0}
          class:no={!i.ok}
          class:elite={owned >= 200}
          style="--q:{countQuality(owned)}"
          onclick={() => game.hireStaff(def.id, amount)}
          use:tooltip={() => tip(def)}
        >
          <span class="icon portrait">
            <span class="face"><Avatar look={FACES[def.id]} gear={NO_GEAR} primary={v.s.org.primary} secondary={v.s.org.secondary} size={44} mode="bust" tag={def.name} /></span>
            <span class="role"><Icon name={def.icon} size={12} /></span>
          </span>
          <span class="main">
            <span class="name">
              {def.name}
              {#if def.qol}
                <span class="tool" class:have={owned > 0}><Icon name={owned > 0 ? def.qol.icon : 'lock'} size={10} /> {def.qol.name}</span>
              {/if}
            </span>
            <span class="effects">{owned > 0 ? effectLines(def, owned).join(' · ') : def.desc}</span>
          </span>
          <span class="price num">
            {money(i.price)}
            {#if i.n !== 1}<span class="qty">×{fmt(i.n)}</span>{/if}
          </span>
          <span class="owned num" class:none={owned === 0} title="{fmt(owned)} hired">{fmt(owned)}</span>
        </button>
      {:else if def.id === nextLocked?.id}
        <div class="row locked">
          <span class="icon"><Icon name="lock" size={22} /></span>
          <span class="main">
            <span class="name">???</span>
            <span class="effects">Unlocks when you: {def.requirement.toLowerCase()}</span>
          </span>
        </div>
      {/if}
    {/each}
  </div>

  <FrontOffice />
</div>

<style>
  .staff {
    display: flex;
    flex-direction: column;
    gap: 12px;
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
    max-width: 520px;
  }
  .seg {
    display: flex;
    border: 1px solid var(--line-2);
    border-radius: 6px;
    overflow: hidden;
    flex: none;
  }
  .seg button {
    border: none;
    background: var(--bg-2);
    color: var(--muted);
    padding: 4px 10px;
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 12px;
  }
  .seg button + button {
    border-left: 1px solid var(--line-2);
  }
  .seg button.active {
    background: color-mix(in srgb, var(--accent) 25%, transparent);
    color: var(--text);
  }
  .seg button.locked {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    color: var(--dim);
    opacity: 0.6;
    cursor: help;
  }
  /* The tool a role's first hire brings: dim and locked until then, gold once it is yours. */
  .tool {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    margin-left: 6px;
    padding: 1px 7px;
    border-radius: 999px;
    vertical-align: 2px;
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 10.5px;
    letter-spacing: 0.02em;
    color: var(--dim);
    border: 1px dashed var(--line-2);
  }
  .tool.have {
    color: var(--gold);
    border: 1px solid color-mix(in srgb, var(--gold) 45%, transparent);
    background: color-mix(in srgb, var(--gold) 9%, transparent);
  }
  .plan-teaser {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px dashed color-mix(in srgb, var(--accent) 40%, var(--line-2));
    background: color-mix(in srgb, var(--accent) 5%, transparent);
    font-size: 13px;
    color: var(--accent);
  }
  .plan-teaser b {
    color: var(--text);
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .row {
    --q: var(--dim);
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 8px 12px 8px 8px;
    border-radius: 10px;
    border: 1px solid color-mix(in srgb, var(--q) 34%, var(--line));
    background:
      linear-gradient(90deg, color-mix(in srgb, var(--q) 13%, transparent), transparent 70%),
      var(--bg-2);
    text-align: left;
  }
  .row.elite {
    box-shadow: inset 0 0 14px color-mix(in srgb, var(--q) 14%, transparent);
  }
  button.row:hover {
    border-color: var(--q);
  }
  button.row:active {
    transform: scale(0.995);
  }
  .row.no {
    filter: saturate(0.5) brightness(0.85);
  }
  .row.locked {
    opacity: 0.5;
    border-style: dashed;
  }
  .icon {
    display: grid;
    place-items: center;
    width: 46px;
    height: 46px;
    border-radius: 10px;
    flex: none;
    color: var(--q);
    border: 1.5px solid color-mix(in srgb, var(--q) 45%, transparent);
    background:
      linear-gradient(145deg, color-mix(in srgb, var(--q) 20%, transparent), transparent 60%),
      var(--bg-2);
  }
  .main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .name {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 17px;
  }
  .effects {
    font-size: 12px;
    color: var(--muted);
  }
  .price {
    font-family: var(--font-ui);
    font-weight: 700;
    color: var(--green);
    white-space: nowrap;
  }
  .row.no .price {
    color: var(--red);
  }
  .qty {
    color: var(--muted);
    margin-left: 3px;
  }
  .list-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .list-head .section-title {
    margin: 0;
  }
  /* The face is clipped to the frame; the role badge sits inside its bottom corner. */
  .portrait {
    position: relative;
    overflow: hidden;
  }
  .face {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: end center;
    overflow: hidden;
    border-radius: 8px;
  }
  .face :global(svg) {
    display: block;
  }
  .role {
    position: absolute;
    right: 1px;
    bottom: 1px;
    z-index: 1;
    display: grid;
    place-items: center;
    width: 17px;
    height: 17px;
    border-radius: 5px;
    color: var(--q);
    background: var(--bg);
    border: 1px solid color-mix(in srgb, var(--q) 55%, var(--line-2));
  }
  .owned.none {
    color: var(--dim);
    opacity: 0.5;
  }
  .owned {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 28px;
    min-width: 44px;
    text-align: right;
    color: rgba(196, 177, 255, 0.6);
  }
</style>
