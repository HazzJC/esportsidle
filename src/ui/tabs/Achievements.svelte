<script lang="ts">
  import { ACHIEVEMENTS, type AchievementDef, type AchievementGroup } from '../../data/achievements';
  import { fmtPct } from '../../engine/format';
  import { cabinetIncomeMult, cabinetMarginalGain } from '../../engine/economy';
  import Icon from '../components/Icon.svelte';
  import TrophyCabinet from '../components/TrophyCabinet.svelte';
  import { game } from '../game.svelte';
  import type { TipContent } from '../tooltip.svelte';
  import { tooltip } from '../tooltip.svelte';
  import { RARITY_BANDS, rarityColor, rarityName } from '../theme';

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
    { id: 'events', label: 'Events & Tournaments' },
    { id: 'business', label: 'Sponsors & Merch' },
    { id: 'legacy', label: 'Legacy' },
    { id: 'misc', label: 'Miscellaneous' },
    { id: 'secrets', label: 'Secrets' },
  ];

  const BY_GROUP = GROUPS.map((g) => ({ ...g, list: ACHIEVEMENTS.filter((a) => a.group === g.id) })).filter(
    (g) => g.list.length > 0,
  );

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
          <div class="ach" class:got class:shadow={a.shadow} style="--c:{rarityColor(a.rarity)}" use:tooltip={() => tip(a)}>
            <Icon name={got || !a.secret ? a.icon : 'lock'} size={20} />
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
  /* Shadow achievements do not count towards the cabinet: same rarity colour, dashed frame. */
  .ach.shadow {
    border-style: dashed;
  }
</style>
