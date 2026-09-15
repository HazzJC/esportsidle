<script lang="ts">
  import { ACHIEVEMENTS, type AchievementDef, type AchievementGroup } from '../../data/achievements';
  import { fmtPct } from '../../engine/format';
  import Icon from '../components/Icon.svelte';
  import { game } from '../game.svelte';
  import type { TipContent } from '../tooltip.svelte';
  import { tooltip } from '../tooltip.svelte';

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
  ];

  const BY_GROUP = GROUPS.map((g) => ({ ...g, list: ACHIEVEMENTS.filter((a) => a.group === g.id) })).filter(
    (g) => g.list.length > 0,
  );

  const s = $derived(game.view.s);
  const unlocked = $derived(Object.keys(s.achievements).length);

  function tip(a: AchievementDef): TipContent {
    const at = game.view.s.achievements[a.id];
    const got = at !== undefined;
    const hidden = !got && a.secret;
    return {
      title: hidden ? '???' : a.name,
      subtitle: got ? 'Unlocked' : 'Locked',
      icon: hidden ? 'lock' : a.icon,
      iconColor: got ? 'var(--gold)' : 'var(--dim)',
      lines: [
        hidden ? { text: 'A secret achievement.', tone: 'muted' } : a.desc(),
        ...(got ? [{ text: `Unlocked ${new Date(at).toLocaleString()}`, tone: 'muted' as const }] : []),
        ...(a.shadow ? [{ text: 'Shadow achievement: does not count towards the cabinet.', tone: 'muted' as const }] : []),
      ],
    };
  }
</script>

<div class="achievements">
  <div class="summary">
    <Icon name="trophy" size={28} color="var(--gold)" />
    <div>
      <div class="big num">{unlocked} / {ACHIEVEMENTS.length}</div>
      <div class="muted">Trophy Cabinet {fmtPct(game.view.r.cabinet)} · every achievement adds 4%</div>
    </div>
  </div>

  {#each BY_GROUP as g (g.id)}
    {@const count = g.list.filter((a) => s.achievements[a.id] !== undefined).length}
    <section>
      <h3 class="section-title">{g.label} <span class="dim">{count}/{g.list.length}</span></h3>
      <div class="grid">
        {#each g.list as a (a.id)}
          {@const got = s.achievements[a.id] !== undefined}
          <div class="ach" class:got class:shadow={a.shadow} use:tooltip={() => tip(a)}>
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
    background: linear-gradient(90deg, rgba(255, 200, 61, 0.12), transparent);
    border: 1px solid rgba(255, 200, 61, 0.3);
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
  .ach {
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    border-radius: 8px;
    background: var(--bg-2);
    border: 1px solid var(--line);
    color: var(--dim);
    opacity: 0.55;
  }
  .ach.got {
    opacity: 1;
    color: var(--gold);
    border-color: rgba(255, 200, 61, 0.55);
    background: linear-gradient(180deg, rgba(255, 200, 61, 0.18), rgba(255, 200, 61, 0.04));
    box-shadow: 0 0 10px rgba(255, 200, 61, 0.15);
  }
  .ach.got.shadow {
    color: var(--violet);
    border-color: rgba(139, 92, 255, 0.55);
    background: linear-gradient(180deg, rgba(139, 92, 255, 0.18), rgba(139, 92, 255, 0.04));
  }
</style>
