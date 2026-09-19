<script lang="ts">
  import { QUESTS, QUEST_MAP, type QuestReward } from '../../data/quests';
  import { fmt } from '../../engine/format';
  import { describeReward, questPerkLabels, questProgress, rewardDetail } from '../../engine/quests';
  import { game } from '../game.svelte';
  import Icon from './Icon.svelte';

  const v = $derived(game.view);
  const s = $derived(v.s);
  const ctx = $derived({ cps: v.r.cpsNoBuffs, fansPerSec: v.r.fansPerSec });
  const doneCount = $derived(QUESTS.filter((q) => s.quests.done[q.id] !== undefined).length);
  const perks = $derived(questPerkLabels(s));

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
      <span class="dim small">Finish a quest to earn its reward. Perks last forever.</span>
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
                {#if !p.complete}
                  <button class="later" onclick={() => game.skipQuest(def.id)} title="Set this quest aside. The next quest takes its place, and this one comes back later.">Later</button>
                {/if}
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
      {#if s.quests.active.length < 2}
        <article class="quest empty">
          <Icon name="clock" size={16} />
          <span class="muted small">More quests appear as your org grows.</span>
        </article>
      {/if}
    </div>
    {#if perks.length > 0}
      <p class="perks small"><Icon name="sparkles" size={12} /> <span class="muted">Your perks:</span> {perks.join(' · ')}</p>
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
  .later {
    padding: 1px 7px;
    border: 1px solid var(--line-2);
    border-radius: 999px;
    background: transparent;
    color: var(--dim);
    font-size: 11px;
  }
  .later:hover {
    color: var(--text);
    border-color: var(--muted);
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
