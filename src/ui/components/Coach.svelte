<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { fly } from 'svelte/transition';
  import { TUTORIAL_STEPS, type TutorialTarget } from '../../data/tutorial';
  import { fmt } from '../../engine/format';
  import { currentStep } from '../../engine/tutorial';
  import { game } from '../game.svelte';
  import Icon from './Icon.svelte';

  const s = $derived(game.view.s);
  const step = $derived(currentStep(s));
  const index = $derived(step ? TUTORIAL_STEPS.findIndex((d) => d.id === step.id) : -1);
  const progress = $derived(step ? step.progress(s) : { value: 0, target: 1 });
  const active = $derived(!!step && s.settings.onboarded);

  /**
   * Takes the player to the screen a step needs: the right centre tab, and on phones the right view.
   * On a wide screen the logo and the store are always visible, so only the highlight changes.
   */
  async function guide(target: TutorialTarget) {
    if (target === 'logo') game.mobileView = 'clicker';
    else if (target === 'store') game.mobileView = 'store';
    else {
      game.tab = target === 'draft' ? 'hq' : 'teams';
      game.mobileView = 'center';
    }
    await tick();
    const el = document.querySelector('.tut-target');
    if (el && el.getClientRects().length > 0) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // Each new step moves the player once; after that they are free to look around.
  let guided = '';
  $effect(() => {
    const id = active ? step?.id : undefined;
    if (!id || id === guided) return;
    guided = id;
    untrack(() => guide(step!.target));
  });

  /** Whether the highlighted target is on screen, so a way back only appears when it is needed. */
  const targetHidden = $derived.by(() => {
    void game.view.frame;
    void game.tab;
    void game.mobileView;
    if (typeof document === 'undefined') return false;
    const el = document.querySelector('.tut-target');
    return !el || el.getClientRects().length === 0;
  });

  const BACK_LABEL: Record<TutorialTarget, string> = {
    logo: 'Back to the logo',
    draft: 'Back to the prospects',
    matches: 'Back to my team',
    store: 'Back to the store',
  };
</script>

{#if active && step}
  <aside class="coach" aria-live="polite" in:fly={{ y: -10, duration: 240 }}>
    <span class="icon"><Icon name={step.icon} size={26} /></span>
    <div class="main">
      <div class="eyebrow">
        <span>Getting started · step {index + 1} of {TUTORIAL_STEPS.length}</span>
        <span class="dots" aria-hidden="true">
          {#each TUTORIAL_STEPS as d, i (d.id)}
            <i class:done={i < index} class:now={i === index}></i>
          {/each}
        </span>
      </div>
      {#key step.id}
        <h2 in:fly={{ x: 12, duration: 220 }}>{step.title}</h2>
      {/key}
      <p>{step.body}</p>
      <div class="foot">
        <span class="bar"><i style="width:{Math.min(100, (progress.value / progress.target) * 100)}%"></i></span>
        {#if progress.target > 1}<span class="num count">{fmt(Math.min(progress.value, progress.target))}/{fmt(progress.target)}</span>{/if}
        {#if targetHidden}
          <button class="back" onclick={() => guide(step.target)}><Icon name="arrow-right" size={14} /> {BACK_LABEL[step.target]}</button>
        {:else if step.id === 'draft' || step.target === 'store'}
          <!-- On phones the logo is on another screen: an easy way back to click for more cash. -->
          <button class="back phone-only" onclick={() => (game.mobileView = 'clicker')}><Icon name="mouse-pointer-click" size={14} /> Keep clicking</button>
        {/if}
      </div>
    </div>
    <button class="skip" onclick={() => game.skipTutorial()} title="Skip the tutorial. Quests start straight away.">Skip tutorial</button>
  </aside>
{/if}

<style>
  .coach {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 14px 18px;
    border-radius: var(--radius);
    background:
      linear-gradient(100deg, color-mix(in srgb, var(--accent) 12%, transparent), transparent 55%),
      var(--panel-2);
    border: 1px solid color-mix(in srgb, var(--accent) 40%, var(--line-2));
    box-shadow: 0 0 22px color-mix(in srgb, var(--accent) 10%, transparent);
  }
  .icon {
    display: grid;
    place-items: center;
    flex: none;
    width: 52px;
    height: 52px;
    border-radius: 14px;
    color: var(--on-accent);
    background: var(--accent);
  }
  .main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .eyebrow {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .dots {
    display: inline-flex;
    gap: 4px;
  }
  .dots i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--line-2);
  }
  .dots i.done {
    background: color-mix(in srgb, var(--accent) 55%, var(--line-2));
  }
  .dots i.now {
    background: var(--accent);
    box-shadow: 0 0 6px var(--accent);
  }
  h2 {
    margin: 0;
    font-family: var(--font-ui);
    font-size: 22px;
    line-height: 1.15;
  }
  p {
    margin: 0;
    max-width: 880px;
    font-size: 15px;
    line-height: 1.45;
    color: var(--muted);
  }
  .foot {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 4px;
  }
  .foot .bar {
    flex: 1;
    max-width: 420px;
    height: 8px;
  }
  .count {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 14px;
    color: var(--muted);
  }
  .back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
    background: color-mix(in srgb, var(--accent) 10%, transparent);
    color: var(--text);
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 13px;
  }
  .back:hover {
    border-color: var(--accent);
  }
  .phone-only {
    display: none;
  }
  .skip {
    flex: none;
    padding: 4px 10px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--dim);
    font-size: 12.5px;
  }
  .skip:hover {
    color: var(--text);
    background: var(--panel-3);
  }
  @media (max-width: 860px) {
    .coach {
      gap: 10px;
      padding: 10px 12px;
    }
    .icon {
      width: 40px;
      height: 40px;
      border-radius: 11px;
    }
    h2 {
      font-size: 18px;
    }
    p {
      font-size: 14px;
    }
    .skip {
      padding: 2px 6px;
      font-size: 12px;
    }
    .phone-only {
      display: inline-flex;
    }
  }
</style>
