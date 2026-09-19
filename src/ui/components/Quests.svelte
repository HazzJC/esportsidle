<script lang="ts">
  import { QUESTS, QUEST_MAP } from '../../data/quests';
  import { fmt } from '../../engine/format';
  import { describeReward, questProgress } from '../../engine/quests';
  import { game } from '../game.svelte';
  import Icon from './Icon.svelte';

  const v = $derived(game.view);
  const s = $derived(v.s);
  const ctx = $derived({ cps: v.r.cpsNoBuffs, fansPerSec: v.r.fansPerSec });
  const doneCount = $derived(QUESTS.filter((q) => s.quests.done[q.id] !== undefined).length);

  const REWARD_ICON: Record<string, string> = {
    cash: 'dollar-sign',
    fans: 'heart',
    trophies: 'trophy',
    levels: 'dumbbell',
    legacy: 'crown',
    buff: 'zap',
  };
</script>

{#if s.tutorial.step === 'done' && (s.quests.active.length > 0 || doneCount < QUESTS.length)}
  <section class="quests">
    <header>
      <h3 class="section-title">Quests <span class="dim">{doneCount}/{QUESTS.length}</span></h3>
      <span class="dim small">Two at a time. Finish one, then pick your reward.</span>
    </header>
    <div class="board">
      {#each s.quests.active as q (q.id)}
        {@const def = QUEST_MAP.get(q.id)}
        {@const p = questProgress(s, q)}
        {#if def}
          <article class="quest" class:complete={p.complete}>
            <div class="top">
              <span class="qicon"><Icon name={def.icon} size={18} /></span>
              <div class="text">
                <b>{def.title}</b>
                <span class="muted small">{def.desc}</span>
              </div>
              {#if p.target > 1 && !p.complete}<span class="count num">{fmt(p.value)}/{fmt(p.target)}</span>{/if}
            </div>
            {#if p.complete}
              <div class="choose">
                <span class="label">Choose your reward</span>
                <div class="rewards">
                  {#each def.rewards as r, i (i)}
                    <button class="reward" onclick={() => game.claimQuest(def.id, i as 0 | 1)}>
                      <Icon name={REWARD_ICON[r.kind] ?? 'flag'} size={14} />
                      <span>{describeReward(r, ctx)}</span>
                    </button>
                  {/each}
                </div>
              </div>
            {:else}
              <span class="bar"><i style="width:{(p.value / p.target) * 100}%"></i></span>
              <span class="dim small preview">Reward: {describeReward(def.rewards[0], ctx)} or {describeReward(def.rewards[1], ctx)}</span>
            {/if}
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
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
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
  .count {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 13px;
    color: var(--muted);
  }
  .preview {
    margin-top: -2px;
  }
  .choose {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .label {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--gold);
  }
  .rewards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  .reward {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 9px;
    border-radius: 9px;
    border: 1px solid color-mix(in srgb, var(--gold) 45%, transparent);
    background: color-mix(in srgb, var(--gold) 8%, var(--bg));
    color: var(--text);
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 13px;
    text-align: left;
  }
  .reward:hover {
    border-color: var(--gold);
    background: color-mix(in srgb, var(--gold) 16%, var(--bg));
  }
  .reward :global(svg) {
    flex: none;
    color: var(--gold);
  }
</style>
