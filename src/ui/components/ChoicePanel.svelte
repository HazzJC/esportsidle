<script lang="ts">
  import { fly } from 'svelte/transition';
  import { fmtTime } from '../../engine/format';
  import { CHOICE_LIFETIME } from '../../engine/worldEvents';
  import { game } from '../game.svelte';
  import Icon from './Icon.svelte';

  const s = $derived(game.view.s);
  const choice = $derived(s.events.pending[0]);
</script>

{#if choice}
  {#key choice.id}
    <div class="choice panel" role="dialog" aria-label={choice.title} transition:fly={{ y: 30, duration: 220 }}>
      <div class="top">
        <span class="icon"><Icon name={choice.icon} size={20} /></span>
        <div class="text">
          <div class="title">{choice.title}</div>
          <div class="body muted">{choice.body}</div>
        </div>
      </div>
      <div class="options">
        {#each choice.options as option, i (i)}
          <button class="option {option.tone}" onclick={() => game.resolveChoice(choice.id, i)}>
            <span class="label">{option.label}</span>
            <span class="desc">{option.desc}</span>
          </button>
        {/each}
      </div>
      <div class="foot">
        <span class="bar"><i style="width:{Math.max(0, (choice.expiresAt - s.time) / CHOICE_LIFETIME) * 100}%"></i></span>
        <span class="dim small num">
          {fmtTime(choice.expiresAt - s.time)} to decide
          {#if s.events.pending.length > 1}· {s.events.pending.length - 1} more waiting{/if}
        </span>
      </div>
    </div>
  {/key}
{/if}

<style>
  .choice {
    position: fixed;
    left: 14px;
    bottom: 14px;
    z-index: 780;
    width: min(360px, calc(100vw - 28px));
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    border-color: var(--gold);
    box-shadow:
      var(--shadow),
      0 0 24px rgba(255, 200, 61, 0.2);
  }
  .top {
    display: flex;
    gap: 10px;
  }
  .icon {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 9px;
    color: var(--gold);
    background: rgba(255, 200, 61, 0.14);
    flex: none;
  }
  .title {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 16px;
    line-height: 1.15;
  }
  .body {
    font-size: 12.5px;
    margin-top: 2px;
  }
  .options {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .option {
    --c: var(--cyan);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 6px 10px;
    border-radius: 8px;
    border: 1px solid color-mix(in srgb, var(--c) 45%, var(--line));
    background: color-mix(in srgb, var(--c) 8%, var(--bg-2));
    text-align: left;
  }
  .option:hover {
    border-color: var(--c);
  }
  .option.good {
    --c: var(--green);
  }
  .option.bad {
    --c: var(--red);
  }
  .option.gold {
    --c: var(--gold);
  }
  .label {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 14px;
  }
  .desc {
    font-size: 11.5px;
    color: var(--muted);
  }
  .foot {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .foot .bar i {
    background: var(--gold);
  }
  .small {
    font-size: 11.5px;
  }
  @media (max-width: 860px) {
    .choice {
      left: 8px;
      right: 8px;
      bottom: 72px;
      width: auto;
    }
  }
</style>
