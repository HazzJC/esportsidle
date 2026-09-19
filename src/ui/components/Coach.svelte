<script lang="ts">
  import { fly } from 'svelte/transition';
  import { TUTORIAL_STEPS, type TutorialTarget } from '../../data/tutorial';
  import { currentStep } from '../../engine/tutorial';
  import { fmt } from '../../engine/format';
  import { game } from '../game.svelte';
  import Icon from './Icon.svelte';

  /** Narrow screens show a slim bar; tapping it opens the full card. */
  let open = $state(false);

  const s = $derived(game.view.s);
  const step = $derived(currentStep(s));
  const index = $derived(step ? TUTORIAL_STEPS.findIndex((d) => d.id === step.id) : -1);
  const progress = $derived(step ? step.progress(s) : { value: 0, target: 1 });

  const SHOW_LABEL: Record<TutorialTarget, string> = {
    logo: 'Show the logo',
    draft: 'Show the prospects',
    matches: 'Show my team',
    store: 'Open the store',
  };

  /** Brings the step's target into view, switching the mobile view or the centre tab as needed. */
  function show(target: TutorialTarget) {
    open = false;
    if (target === 'logo') game.mobileView = 'clicker';
    else if (target === 'store') game.mobileView = 'store';
    else {
      game.tab = target === 'draft' ? 'hq' : 'teams';
      game.mobileView = 'center';
    }
    requestAnimationFrame(() => document.querySelector('.tut-target')?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  }
</script>

{#if step && s.settings.onboarded}
  {#key step.id}
    <aside class="coach panel" class:open aria-live="polite" in:fly={{ y: 16, duration: 260 }}>
      <button class="compact" onclick={() => (open = !open)} aria-expanded={open}>
        <Icon name={step.icon} size={16} />
        <b>{step.title}</b>
        {#if progress.target > 1}<span class="num count">{fmt(Math.min(progress.value, progress.target))}/{fmt(progress.target)}</span>{/if}
        <span class="bar"><i style="width:{Math.min(100, (progress.value / progress.target) * 100)}%"></i></span>
        <Icon name={open ? 'chevron-down' : 'chevron-up'} size={16} />
      </button>
      <div class="head">
        <span class="icon"><Icon name={step.icon} size={20} /></span>
        <div class="titles">
          <span class="eyebrow">Getting started · {index + 1} of {TUTORIAL_STEPS.length}</span>
          <b>{step.title}</b>
        </div>
        <button class="skip" onclick={() => game.skipTutorial()} title="Skip the tutorial. Quests start straight away.">Skip</button>
      </div>
      <p>{step.body}</p>
      <div class="foot">
        <span class="bar"><i style="width:{Math.min(100, (progress.value / progress.target) * 100)}%"></i></span>
        {#if progress.target > 1}<span class="num count">{fmt(Math.min(progress.value, progress.target))}/{fmt(progress.target)}</span>{/if}
        <button class="btn small" onclick={() => show(step.target)}><Icon name="arrow-right" size={13} /> {SHOW_LABEL[step.target]}</button>
      </div>
    </aside>
  {/key}
{/if}

<style>
  .coach {
    position: fixed;
    left: 50%;
    bottom: 14px;
    transform: translateX(-50%);
    z-index: 750;
    width: min(460px, calc(100vw - 32px));
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 14px;
    background: var(--panel-2);
    border: 1px solid color-mix(in srgb, var(--accent) 45%, var(--line-2));
    box-shadow:
      var(--shadow),
      0 0 24px color-mix(in srgb, var(--accent) 16%, transparent);
  }
  .head {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .icon {
    display: grid;
    place-items: center;
    flex: none;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    color: var(--on-accent);
    background: var(--accent);
  }
  .titles {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .eyebrow {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .titles b {
    font-family: var(--font-ui);
    font-size: 17px;
  }
  .skip {
    align-self: flex-start;
    padding: 2px 8px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--dim);
    font-size: 12px;
  }
  .skip:hover {
    color: var(--text);
    background: var(--panel-3);
  }
  p {
    margin: 0;
    font-size: 13px;
    line-height: 1.4;
    color: var(--muted);
  }
  .foot {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .foot .bar {
    flex: 1;
  }
  .count {
    font-size: 12px;
    color: var(--muted);
  }
  .compact {
    display: none;
  }
  @media (max-width: 860px) {
    .coach {
      bottom: 80px;
      padding: 8px 12px;
    }
    .compact {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 0;
      border: none;
      background: transparent;
      color: var(--text);
      text-align: left;
    }
    .compact b {
      font-family: var(--font-ui);
      font-size: 14px;
      white-space: nowrap;
    }
    .compact .bar {
      flex: 1;
      min-width: 40px;
    }
    .coach:not(.open) .head,
    .coach:not(.open) p,
    .coach:not(.open) .foot {
      display: none;
    }
    .coach.open .compact {
      padding-bottom: 6px;
      border-bottom: 1px solid var(--line);
    }
    /* The bar already names the step, so the open card keeps only the step count and Skip. */
    .coach.open .head .icon,
    .coach.open .head .titles b {
      display: none;
    }
  }
</style>
