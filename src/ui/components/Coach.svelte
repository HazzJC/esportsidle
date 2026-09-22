<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { fly } from 'svelte/transition';
  import { TUTORIAL_STEPS, type TutorialTarget } from '../../data/tutorial';
  import { OPERATIONS } from '../../data/operations';
  import { fmt } from '../../engine/format';
  import { unitPrice } from '../../engine/operations';
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
    if (target === 'logo') {
      // On a wide screen the logo sits beside the Teams page, where the first player waits.
      game.tab = 'teams';
      game.mobileView = 'clicker';
    } else if (target === 'store') game.mobileView = 'store';
    else {
      game.tab = 'teams';
      game.mobileView = 'center';
    }
    await tick();
    // The arrow sits just above its target, so showing the arrow brings the target along with it.
    const el = document.querySelector('.tut-arrow') ?? document.querySelector('.tut-target');
    if (el && el.getClientRects().length > 0) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // Each new step moves the player once; after that they are free to look around.
  let guided = '';
  /** Phones can fold the explanation away; every new step opens unfolded. */
  let folded = $state(false);
  $effect(() => {
    const id = active ? step?.id : undefined;
    if (!id || id === guided) return;
    guided = id;
    folded = false;
    untrack(() => {
      // Don't auto-redirect away from clicker on mobile when unlocking the first player
      if (step?.id === 'draft' && game.mobileView === 'clicker') {
        game.tab = 'teams';
        return;
      }
      guide(step!.target);
    });
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

  /** What the current step wants to buy, so "Keep clicking" only shows when the cash is not there yet. */
  const shortOfCash = $derived.by(() => {
    if (!step) return false;
    if (step.id === 'draft') return (s.draft?.[0]?.price ?? 0) > s.cash;
    if (step.id === 'grinder' || step.id === 'streamer') {
      const op = OPERATIONS.find((o) => o.id === step.id)!;
      return unitPrice(op, s.ops[op.id].owned, game.view.m.opCostMult) > s.cash;
    }
    return false;
  });

  const BACK_LABEL: Record<TutorialTarget, string> = {
    logo: 'Back to the logo',
    draft: 'Go to your first player',
    matches: 'Back to my team',
    store: 'Back to the store',
  };
</script>

{#if active && step}
  <aside class="coach" class:folded aria-live="polite" in:fly={{ y: -10, duration: 240 }}>
    <span class="icon"><Icon name={step.icon} size={26} /></span>
    <div class="head">
      <div class="eyebrow">
        <span><span class="wide-only">Getting started · </span>Step {index + 1} of {TUTORIAL_STEPS.length}</span>
        <span class="dots" aria-hidden="true">
          {#each TUTORIAL_STEPS as d, i (d.id)}
            <i class:done={i < index} class:now={i === index}></i>
          {/each}
        </span>
      </div>
      {#key step.id}
        <h2 in:fly={{ x: 12, duration: 220 }}>{step.title}</h2>
      {/key}
    </div>
    <div class="corner">
      <button class="skip" onclick={() => game.skipTutorial()} title="Skip the tutorial. Quests start straight away.">Skip<span class="wide-only">{' '}tutorial</span></button>
      <button class="fold phone-only" onclick={() => (folded = !folded)} aria-expanded={!folded} aria-label={folded ? 'Show the explanation' : 'Hide the explanation'}>
        <Icon name={folded ? 'chevron-down' : 'chevron-up'} size={16} />
      </button>
    </div>
    <p>{step.body}</p>
    <div class="foot">
      <span class="bar"><i style="width:{Math.min(100, (progress.value / progress.target) * 100)}%"></i></span>
      {#if progress.target > 1}<span class="num count">{fmt(Math.min(progress.value, progress.target))}/{fmt(progress.target)}</span>{/if}
      {#if targetHidden}
        <button class="back" onclick={() => guide(step.target)}><Icon name="arrow-right" size={14} /> {BACK_LABEL[step.target]}</button>
      {:else if shortOfCash}
        <!-- On phones the logo is on another screen: an easy way back to click for more cash. -->
        <button class="back phone-only" onclick={() => (game.mobileView = 'clicker')}><Icon name="mouse-pointer-click" size={14} /> Keep clicking</button>
      {/if}
    </div>
  </aside>
{/if}

<style>
  /* Icon on the left spanning the text on wide screens; on phones the text takes the full width. */
  .coach {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-areas:
      'icon head skip'
      'icon body body'
      'icon foot foot';
    column-gap: 14px;
    row-gap: 4px;
    padding: 14px 18px;
    border-radius: var(--radius);
    background:
      linear-gradient(100deg, color-mix(in srgb, var(--accent) 12%, transparent), transparent 55%),
      var(--panel-2);
    border: 1px solid color-mix(in srgb, var(--accent) 40%, var(--line-2));
    box-shadow: 0 0 22px color-mix(in srgb, var(--accent) 10%, transparent);
  }
  .icon {
    grid-area: icon;
    display: grid;
    place-items: center;
    flex: none;
    width: 52px;
    height: 52px;
    border-radius: 14px;
    color: var(--on-accent);
    background: var(--accent);
  }
  .head {
    grid-area: head;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
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
  .eyebrow > span:first-child {
    white-space: nowrap;
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
    grid-area: body;
    margin: 0;
    max-width: 880px;
    font-size: 15px;
    line-height: 1.45;
    color: var(--muted);
  }
  .foot {
    grid-area: foot;
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
  .corner {
    grid-area: skip;
    align-self: start;
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .fold {
    display: none;
    place-items: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--muted);
  }
  .skip {
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
  @media (max-width: 1023px) {
    .coach {
      grid-template-areas:
        'icon head skip'
        'body body body'
        'foot foot foot';
      column-gap: 10px;
      row-gap: 6px;
      padding: 10px 12px;
    }
    .wide-only {
      display: none;
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
    .fold {
      display: grid;
    }
    .dots {
      display: none;
    }
    .folded p {
      display: none;
    }
    .folded .icon {
      width: 32px;
      height: 32px;
    }
  }
</style>
