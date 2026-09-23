<script lang="ts">
  import { QUESTS, QUEST_MAP, type QuestReward } from '../../data/quests';
  import { fmt } from '../../engine/format';
  import { describeReward, nextQuest, questPerkSources, questProgress, rewardDetail } from '../../engine/quests';
  import { tooltip } from '../tooltip.svelte';
  import { game } from '../game.svelte';
  import Icon from './Icon.svelte';

  const v = $derived(game.view);
  const s = $derived(v.s);
  const ctx = $derived({ cps: v.r.cpsNoBuffs, fansPerSec: v.r.fansPerSec });
  const doneCount = $derived(QUESTS.filter((q) => s.quests.done[q.id] !== undefined).length);
  const perks = $derived(questPerkSources(s));
  const upNext = $derived(nextQuest(s));
  /** A window of the quest line around where the player is: two behind, the current ones, two ahead. */
  const road = $derived.by(() => {
    const active = new Set(s.quests.active.map((q) => q.id));
    const at = QUESTS.findIndex((q) => active.has(q.id) || s.quests.done[q.id] === undefined);
    const from = Math.max(0, Math.min(QUESTS.length - 5, (at < 0 ? QUESTS.length : at) - 2));
    return QUESTS.slice(from, from + 5).map((q, i) => ({
      def: q,
      n: from + i + 1,
      state: s.quests.done[q.id] !== undefined ? 'done' : active.has(q.id) ? 'live' : 'ahead',
    }));
  });

  const REWARD_ICON: Record<QuestReward['kind'], string> = {
    cash: 'dollar-sign',
    fans: 'heart',
    trophies: 'trophy',
    levels: 'dumbbell',
    legacy: 'crown',
    perk: 'sparkles',
  };
</script>

{#snippet rewardBody(r: QuestReward)}
  <span class="ricon"><Icon name={REWARD_ICON[r.kind]} size={15} /></span>
  <span class="rtext">
    <b>{describeReward(r, ctx)}</b>
    <span class="rdetail">{rewardDetail(r, ctx)}</span>
  </span>
{/snippet}

{#if s.tutorial.step === 'done' && (s.quests.active.length > 0 || doneCount < QUESTS.length)}
  <section class="quests">
    <header>
      <h3 class="section-title">Quests <span class="dim">{doneCount}/{QUESTS.length}</span></h3>
      <span class="dim small">Follow the quest line in order. Perks last for the rest of this run.</span>
    </header>
    <div class="board">
      {#each s.quests.active as q (q.id)}
        {@const def = QUEST_MAP.get(q.id)}
        {@const p = questProgress(s, q)}
        {#if def}
          {@const choice = def.rewards.length > 1}
          <article class="quest" class:complete={p.complete}>
            <div class="top">
              <span class="qicon"><Icon name={def.icon} size={18} /></span>
              <div class="text">
                <b>{def.title}</b>
                <span class="muted small">{def.desc}</span>
              </div>
              <div class="side">
                {#if p.target > 1 && !p.complete}<span class="count num">{fmt(p.value)}/{fmt(p.target)}</span>{/if}
              </div>
            </div>
            {#if !p.complete}<span class="bar"><i style="width:{(p.value / p.target) * 100}%"></i></span>{/if}

            <span class="label">{p.complete ? (choice ? 'Choose your reward' : 'Your reward') : choice ? 'Reward: pick one of' : 'Reward'}</span>
            <div class="rewards" class:two={choice}>
              {#each def.rewards as r, i (i)}
                {#if p.complete}
                  <button class="reward ready" onclick={() => game.claimQuest(def.id, i)}>
                    {@render rewardBody(r)}
                    <span class="take">{choice ? 'Take' : 'Claim'}</span>
                  </button>
                {:else}
                  <div class="reward">{@render rewardBody(r)}</div>
                {/if}
              {/each}
            </div>
          </article>
        {/if}
      {/each}
      {#if s.quests.active.length === 0}
        <article class="quest empty">
          <Icon name="clock" size={16} />
          <span class="muted small">{upNext ? `Next: ${upNext.title}. It opens as your org grows.` : 'More quests appear as your org grows.'}</span>
        </article>
      {:else}
        <article class="quest road" aria-label="The quest line">
          <span class="label">The quest line</span>
          <ol class="track">
            {#each road as step (step.def.id)}
              <li class="step {step.state}" use:tooltip={() => ({ title: `${step.n}. ${step.def.title}`, icon: step.def.icon, lines: [step.def.desc, step.state === 'done' ? { text: 'Done', tone: 'good' as const } : step.state === 'live' ? { text: 'In progress', tone: 'gold' as const } : { text: 'Still to come', tone: 'muted' as const }] })}>
                <span class="medal">
                  {#if step.state === 'done'}<Icon name="check" size={16} />{:else}<Icon name={step.def.icon} size={16} />{/if}
                </span>
                <span class="sname">{step.def.title}</span>
              </li>
            {/each}
          </ol>
          {#if upNext}<span class="dim small">Up next · <b class="next-name">{upNext.title}</b></span>{/if}
        </article>
      {/if}
    </div>
    {#if perks.length > 0}
      <p class="perks small">
        <Icon name="sparkles" size={12} />
        <span class="muted">Your perks this run:</span>
        {#each perks as perk, i (i)}
          <span
            class="perk"
            use:tooltip={() => ({
              title: perk.label,
              icon: perk.icon,
              iconColor: 'var(--gold)',
              lines: [`From the quest “${perk.quest}”.`, { text: 'Lasts until you sell the org.', tone: 'muted' }],
            })}>{perk.label}</span
          >
        {/each}
      </p>
    {/if}
  </section>
{/if}

<style>
  .quests {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }
  header .section-title {
    margin: 0;
  }
  .small {
    font-size: 12px;
  }
  .perk {
    padding: 1px 7px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--gold) 40%, transparent);
    background: color-mix(in srgb, var(--gold) 10%, transparent);
    cursor: help;
  }
  .perks {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;
  }
  /* The quest line as a road of medallions: done, live, still ahead. */
  .road {
    justify-content: space-between;
    background:
      radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--accent) 8%, transparent), transparent 70%),
      var(--bg-2);
  }
  .track {
    position: relative;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    margin: 4px 0 0;
    padding: 0;
    list-style: none;
  }
  .track::before {
    content: '';
    position: absolute;
    left: 10%;
    right: 10%;
    top: 19px;
    height: 3px;
    border-radius: 2px;
    background: repeating-linear-gradient(90deg, var(--line-2) 0 6px, transparent 6px 10px);
  }
  .step {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    min-width: 0;
    cursor: help;
  }
  .medal {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    color: var(--dim);
    background: radial-gradient(circle at 35% 30%, var(--panel-2), var(--bg));
    border: 2px solid var(--line-2);
    box-shadow: inset 0 -3px 0 rgba(0, 0, 0, 0.3);
  }
  .step.done .medal {
    color: #1a1406;
    border-color: color-mix(in srgb, var(--gold) 70%, #000);
    background: radial-gradient(circle at 35% 30%, #fff1bf, var(--gold) 55%, #9a6a10);
  }
  .step.live .medal {
    color: var(--accent);
    border-color: var(--accent);
    background: radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--accent) 35%, var(--panel-2)), var(--bg));
    box-shadow:
      inset 0 -3px 0 rgba(0, 0, 0, 0.3),
      0 0 14px color-mix(in srgb, var(--accent) 45%, transparent);
    animation: live-pulse 1.8s ease-in-out infinite;
  }
  .sname {
    max-width: 100%;
    font-size: 10.5px;
    line-height: 1.15;
    text-align: center;
    color: var(--dim);
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .step.done .sname {
    color: var(--muted);
  }
  .step.live .sname {
    color: var(--text);
    font-weight: 700;
  }
  .next-name {
    color: var(--text);
  }
  @keyframes live-pulse {
    50% {
      box-shadow:
        inset 0 -3px 0 rgba(0, 0, 0, 0.3),
        0 0 22px color-mix(in srgb, var(--accent) 65%, transparent);
    }
  }
  .board {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 8px;
  }
  .quest {
    display: flex;
    flex-direction: column;
    gap: 7px;
    padding: 10px 12px;
    border-radius: 11px;
    border: 1px solid var(--line);
    background: var(--bg-2);
  }
  .quest.complete {
    border-color: color-mix(in srgb, var(--gold) 55%, transparent);
    background: linear-gradient(135deg, color-mix(in srgb, var(--gold) 12%, transparent), transparent 60%), var(--bg-2);
    box-shadow: 0 0 14px color-mix(in srgb, var(--gold) 14%, transparent);
  }
  .quest.empty {
    flex-direction: row;
    align-items: center;
    color: var(--dim);
    border-style: dashed;
  }
  .top {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }
  .qicon {
    display: grid;
    place-items: center;
    flex: none;
    width: 34px;
    height: 34px;
    border-radius: 9px;
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, transparent);
  }
  .quest.complete .qicon {
    color: var(--gold);
    background: color-mix(in srgb, var(--gold) 16%, transparent);
  }
  .text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .text b {
    font-family: var(--font-ui);
    font-size: 15px;
  }
  .side {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }
  .count {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 13px;
    color: var(--muted);
  }
  .label {
    margin-top: 2px;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .quest.complete .label {
    color: var(--gold);
  }
  .rewards {
    display: grid;
    gap: 6px;
  }
  .rewards.two {
    grid-template-columns: 1fr 1fr;
  }
  .reward {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 9px;
    border-radius: 9px;
    border: 1px solid var(--line-2);
    background: var(--bg);
    color: var(--text);
    text-align: left;
    min-width: 0;
  }
  .reward.ready {
    border-color: color-mix(in srgb, var(--gold) 45%, transparent);
    background: color-mix(in srgb, var(--gold) 8%, var(--bg));
  }
  .reward.ready:hover {
    border-color: var(--gold);
    background: color-mix(in srgb, var(--gold) 16%, var(--bg));
  }
  .ricon {
    display: grid;
    place-items: center;
    flex: none;
    width: 26px;
    height: 26px;
    border-radius: 7px;
    color: var(--gold);
    background: color-mix(in srgb, var(--gold) 12%, transparent);
  }
  .rtext {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .rtext b {
    font-family: var(--font-ui);
    font-size: 13.5px;
    line-height: 1.2;
  }
  .rdetail {
    font-size: 11.5px;
    line-height: 1.25;
    color: var(--muted);
  }
  .take {
    flex: none;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--gold);
    color: #1a1406;
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 12px;
  }
  .perks {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 4px;
    margin: 2px 0 0;
    color: var(--text);
  }
  .perks :global(svg) {
    color: var(--gold);
    align-self: center;
  }
  @media (max-width: 520px) {
    .rewards.two {
      grid-template-columns: 1fr;
    }
  }
</style>
