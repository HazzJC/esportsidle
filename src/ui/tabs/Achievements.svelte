<script lang="ts">
  import { ACHIEVEMENTS, type AchievementDef, type AchievementGroup } from '../../data/achievements';
  import { fmtPct } from '../../engine/format';
  import { cabinetIncomeMult, cabinetMarginalGain } from '../../engine/economy';
  import Icon from '../components/Icon.svelte';
  import TrophyCabinet from '../components/TrophyCabinet.svelte';
  import { game } from '../game.svelte';
  import type { TipContent } from '../tooltip.svelte';
  import { tooltip } from '../tooltip.svelte';
  import { RARITY_BANDS, opColor, rarityColor, rarityName } from '../theme';
  import { OPERATIONS } from '../../data/operations';
  import { opSpriteSvg } from '../opsArt';

  const GROUPS: { id: AchievementGroup; label: string }[] = [
    { id: 'earnings', label: 'Earnings' },
    { id: 'income', label: 'Income' },
    { id: 'clicks', label: 'Clicking' },
    { id: 'operations', label: 'Operations' },
    { id: 'upgrades', label: 'Upgrades' },
    { id: 'fans', label: 'Fans' },
    { id: 'hype', label: 'Hype' },
    { id: 'teams', label: 'Teams & Leagues' },
    { id: 'players', label: 'Players & Gear' },
    { id: 'staff', label: 'Staff & House' },
    { id: 'events', label: 'Events & Invitationals' },
    { id: 'business', label: 'Sponsors & Merch' },
    { id: 'legacy', label: 'Legacy' },
    { id: 'misc', label: 'Miscellaneous' },
    { id: 'secrets', label: 'Secrets' },
  ];

  const BY_GROUP = GROUPS.map((g) => ({ ...g, list: ACHIEVEMENTS.filter((a) => a.group === g.id) })).filter(
    (g) => g.list.length > 0,
  );

  const OP_INDEX = new Map(OPERATIONS.map((o) => [o.id, o.index]));
  /** Built from constants in opsArt.ts, so {@html} is safe. */
  const opArt = (id: string) => opSpriteSvg(id, opColor(OP_INDEX.get(id) ?? 0));

  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];
  /**
   * Achievements that share a picture form a ladder (earn $1K, $1M, $1B…). Each gets its rung number,
   * so a row of identical icons still reads as steps, and a one-off gets none.
   */
  const RUNG = new Map<string, string>();
  for (const g of BY_GROUP) {
    const byIcon = new Map<string, AchievementDef[]>();
    for (const a of g.list) byIcon.set(a.icon, [...(byIcon.get(a.icon) ?? []), a]);
    for (const ladder of byIcon.values()) {
      if (ladder.length < 2) continue;
      ladder.forEach((a, i) => RUNG.set(a.id, ROMAN[i] ?? String(i + 1)));
    }
  }
  const LADDER_OF = new Map<string, string>();
  for (const g of BY_GROUP) for (const a of g.list) LADDER_OF.set(a.id, `${g.id}:${a.icon}`);

  /** The first locked rung of every ladder: the next thing to aim for. */
  const nextUp = $derived.by(() => {
    const seen = new Set<string>();
    const next = new Set<string>();
    for (const g of BY_GROUP) {
      for (const a of g.list) {
        if (a.secret || s.achievements[a.id] !== undefined) continue;
        const key = LADDER_OF.get(a.id)!;
        if (seen.has(key)) continue;
        seen.add(key);
        next.add(a.id);
      }
    }
    return next;
  });

  const s = $derived(game.view.s);
  const unlocked = $derived(Object.keys(s.achievements).length);
  const factors = $derived(game.view.m.superfanFactors);
  const counted = $derived(ACHIEVEMENTS.filter((a) => !a.shadow && s.achievements[a.id] !== undefined).length);
  const superfanMult = $derived(cabinetIncomeMult(counted, factors));
  const marginal = $derived(cabinetMarginalGain(counted, factors));
  /** Unlocked / total per rarity band, for the summary strip. */
  const byRarity = $derived(
    Array.from({ length: RARITY_BANDS }, (_, b) => {
      const list = ACHIEVEMENTS.filter((a) => a.rarity === b);
      return { band: b, total: list.length, got: list.filter((a) => s.achievements[a.id] !== undefined).length };
    }),
  );

  /** What holding this achievement is worth, once Superfans are turning the cabinet into income. */
  function worth(a: AchievementDef): string | null {
    if (a.shadow || marginal <= 0) return null;
    return `Worth about +${fmtPct(marginal, false, 1)} income through your Superfan upgrades.`;
  }

  function tip(a: AchievementDef): TipContent {
    const at = game.view.s.achievements[a.id];
    const got = at !== undefined;
    const hidden = !got && a.secret;
    return {
      title: hidden ? '???' : a.name,
      subtitle: `${rarityName(a.rarity)} · ${got ? 'Unlocked' : 'Locked'}`,
      icon: hidden ? 'lock' : a.icon,
      iconColor: got ? rarityColor(a.rarity) : 'var(--dim)',
      lines: [
        hidden ? { text: a.hint ? `"${a.hint}"` : 'A secret achievement.', tone: 'muted' } : a.desc(),
        ...(hidden && a.hint ? [{ text: 'A secret achievement.', tone: 'muted' as const }] : []),
        ...(got ? [{ text: `Unlocked ${new Date(at).toLocaleString()}`, tone: 'muted' as const }] : []),
        ...(a.shadow ? [{ text: 'Shadow achievement: does not count towards the cabinet.', tone: 'muted' as const }] : []),
        ...(() => {
          const line = worth(a);
          return line ? [{ text: line, tone: got ? ('good' as const) : ('muted' as const) }] : [];
        })(),
      ],
    };
  }
</script>

<div class="achievements">
  <div class="summary">
    <Icon name="trophy" size={28} color="var(--gold)" />
    <div>
      <div class="big num">{unlocked} / {ACHIEVEMENTS.length}</div>
      <div class="muted">
        {#if superfanMult > 1}
          Superfans turn your cabinet into <b class="gold-text">×{superfanMult.toFixed(2)} income</b> · the next achievement adds
          <b class="gold-text">+{fmtPct(marginal, false, 1)}</b>
        {:else}
          Superfan upgrades in the store turn these into income. Each achievement you hold makes them stronger.
        {/if}
      </div>
    </div>
    <div class="rarities">
      {#each byRarity as r (r.band)}
        <span class="rar num" style="--c:{rarityColor(r.band)}" title="{rarityName(r.band)}: {r.got} of {r.total}">
          <i></i>{r.got}/{r.total}
        </span>
      {/each}
    </div>
  </div>

  <TrophyCabinet />

  {#each BY_GROUP as g (g.id)}
    {@const count = g.list.filter((a) => s.achievements[a.id] !== undefined).length}
    <section>
      <h3 class="section-title">{g.label} <span class="dim">{count}/{g.list.length}</span></h3>
      <div class="grid">
        {#each g.list as a (a.id)}
          {@const got = s.achievements[a.id] !== undefined}
          <div class="ach" class:got class:next={nextUp.has(a.id)} class:shadow={a.shadow} style="--c:{rarityColor(a.rarity)}" use:tooltip={() => tip(a)}>
            {#if a.art}
              <span class="art">{@html opArt(a.art)}</span>
            {:else}
              <span class="coin"><Icon name={got || !a.secret ? a.icon : 'lock'} size={17} /></span>
            {/if}
            {#if RUNG.has(a.id)}<span class="rung" aria-hidden="true">{RUNG.get(a.id)}</span>{/if}
          </div>
        {/each}
      </div>
    </section>
  {/each}
</div>

<style>
  .achievements {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .summary {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 10px;
    background: linear-gradient(90deg, color-mix(in srgb, var(--gold) 12%, transparent), transparent);
    border: 1px solid color-mix(in srgb, var(--gold) 30%, transparent);
  }
  .big {
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 20px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
    gap: 5px;
  }
  .summary {
    flex-wrap: wrap;
  }
  .rarities {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 10px;
    margin-left: auto;
    font-size: 12px;
    color: var(--muted);
  }
  .rar {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .rar i {
    width: 9px;
    height: 9px;
    border-radius: 3px;
    background: var(--c);
  }
  /* Locked tiles keep a faint rarity edge, so you can see what kind of prize is left. */
  .ach {
    position: relative;
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    border-radius: 8px;
    background: var(--bg-2);
    border: 1px solid var(--line);
    border-bottom: 2px solid color-mix(in srgb, var(--c) 35%, var(--line));
    color: var(--dim);
    opacity: 0.55;
  }
  .ach.got {
    opacity: 1;
    color: var(--c);
    border-color: color-mix(in srgb, var(--c) 55%, transparent);
    background: linear-gradient(180deg, color-mix(in srgb, var(--c) 18%, transparent), color-mix(in srgb, var(--c) 4%, transparent));
    box-shadow: 0 0 10px color-mix(in srgb, var(--c) 15%, transparent);
  }
  /* The next rung of each ladder stands out from the rest of the locked ones. */
  .ach.next {
    opacity: 0.9;
    color: var(--muted);
    border-color: color-mix(in srgb, var(--c) 45%, var(--line));
    border-style: dashed;
  }
  .art {
    display: block;
    width: 72%;
    height: 72%;
  }
  .art :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
  }
  /* Each achievement is struck as a coin in its rarity colour: lit from the top left, rim shaded. */
  .coin {
    display: grid;
    place-items: center;
    width: 78%;
    height: 78%;
    border-radius: 50%;
    color: var(--dim);
    background: radial-gradient(circle at 35% 30%, var(--panel-2), var(--bg) 75%);
    box-shadow:
      inset 0 -2px 0 rgba(0, 0, 0, 0.35),
      inset 0 0 0 1.5px var(--line-2);
  }
  .ach.got .coin {
    color: #111;
    background: radial-gradient(circle at 34% 28%, color-mix(in srgb, var(--c) 30%, #fff) 0 12%, var(--c) 48%, color-mix(in srgb, var(--c) 55%, #000) 100%);
    box-shadow:
      inset 0 -2px 0 rgba(0, 0, 0, 0.3),
      inset 0 0 0 1.5px color-mix(in srgb, var(--c) 60%, #000),
      0 2px 4px rgba(0, 0, 0, 0.45);
  }
  .ach.got .coin :global(svg) {
    filter: drop-shadow(0 1px 0 rgba(255, 255, 255, 0.35));
  }
  .ach:not(.got) .art {
    filter: grayscale(1) brightness(0.7);
  }
  .rung {
    position: absolute;
    left: 3px;
    top: 1px;
    font-family: var(--font-display);
    font-size: 8.5px;
    font-weight: 800;
    color: var(--c);
    opacity: 0.8;
  }
  .ach:not(.got) .rung {
    color: var(--dim);
  }
  /* Shadow achievements do not count towards the cabinet: same rarity colour, dashed frame. */
  .ach.shadow {
    border-style: dashed;
  }
</style>
