<script lang="ts">
  import { slide } from 'svelte/transition';
  import { QUEST_MAP } from '../../data/quests';
  import { TAB_INTRO_MAP, introKey } from '../../data/intros';
  import { tutorialActive } from '../../engine/tutorial';
  import { game } from '../game.svelte';
  import Icon from './Icon.svelte';

  /**
   * The short card a tab shows the first time it is opened: what it is for, the one thing to do
   * first (with "Show me", which lights up the same target the quests use), and a few words worth
   * knowing. "Got it" puts it away; the help button on the tab strip brings it back. Text lives in
   * data/intros.ts.
   */
  let { tab }: { tab: string } = $props();

  const s = $derived(game.view.s);
  const intro = $derived(TAB_INTRO_MAP.get(tab));
  const open = $derived(!!intro && !tutorialActive(s) && (!s.guides[introKey(tab)] || game.introOpen === tab));
  /** The live quest, when it is about this tab: the card's first step then names it. */
  const quest = $derived.by(() => {
    const live = s.quests.active[0];
    const def = live ? QUEST_MAP.get(live.id) : undefined;
    return def && intro?.hint && def.hint === intro.hint && !live?.ready ? def : undefined;
  });

  // The first step's target pulses for a few seconds when the card first appears.
  let flashed = '';
  $effect(() => {
    if (open && intro?.hint && flashed !== tab) {
      flashed = tab;
      game.flashHint(intro.hint);
    }
  });

  function close() {
    if (intro) game.dismissIntro(intro.id);
  }
</script>

{#if open && intro}
  <section class="intro" aria-label="About the {intro.title} tab" transition:slide={{ duration: 200 }}>
    <header>
      <span class="badge"><Icon name={intro.icon} size={22} /></span>
      <div class="heading">
        <span class="eyebrow">{s.guides[introKey(tab)] ? 'About this tab' : 'New here'}</span>
        <h3>{intro.title}</h3>
      </div>
      <button class="close" onclick={close} aria-label="Close"><Icon name="x" size={15} /></button>
    </header>
    <p class="lead">{intro.lead}</p>

    <div class="first">
      <span class="label"><Icon name="flag" size={12} /> Start here</span>
      <p>
        {#if quest}<b>{quest.title}:</b> {quest.desc}{:else}{intro.first}{/if}
      </p>
      {#if intro.hint}
        <button class="btn small" onclick={() => game.showQuestHint(intro.hint!)}><Icon name="eye" size={13} /> Show me</button>
      {/if}
    </div>

    <ul class="terms">
      {#each intro.terms as t (t.term)}
        <li>
          <span class="ti"><Icon name={t.icon} size={15} /></span>
          <span><b>{t.term}.</b> {t.text}</span>
        </li>
      {/each}
    </ul>

    <footer>
      {#if intro.guide}
        <button class="btn small" onclick={() => game.showGuide(intro.guide!)}><Icon name="help" size={13} /> The full guide</button>
      {/if}
      <button class="btn small primary" onclick={close}><Icon name="check" size={13} /> Got it</button>
    </footer>
  </section>
{/if}

<style>
  .intro {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 12px;
    padding: 14px 16px;
    border-radius: 12px;
    border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
    background:
      radial-gradient(90% 120% at 0% 0%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 60%),
      var(--bg-2);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
  }
  header {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .badge {
    display: grid;
    place-items: center;
    flex: none;
    width: 42px;
    height: 42px;
    border-radius: 11px;
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 16%, transparent);
    border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
  }
  .heading {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .eyebrow {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 10.5px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--accent);
  }
  h3 {
    margin: 0;
    font-family: var(--font-ui);
    font-size: 19px;
  }
  .close {
    flex: none;
    align-self: flex-start;
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 7px;
    border: 1px solid var(--line);
    background: transparent;
    color: var(--muted);
  }
  .close:hover {
    color: var(--text);
  }
  .lead {
    margin: 0;
    font-size: 14px;
    line-height: 1.45;
    color: var(--text);
  }
  /* The first step, set apart: what to do, and a button that lights it up. */
  .first {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px 12px;
    padding: 9px 12px;
    border-radius: 9px;
    border: 1px solid color-mix(in srgb, var(--gold) 40%, transparent);
    background: color-mix(in srgb, var(--gold) 8%, transparent);
  }
  .first .label {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    flex-basis: 100%;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--gold);
  }
  .first p {
    flex: 1 1 260px;
    margin: 0;
    font-size: 13.5px;
    line-height: 1.4;
  }
  .terms {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(230px, 100%), 1fr));
    gap: 8px 14px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .terms li {
    display: flex;
    gap: 8px;
    font-size: 13px;
    line-height: 1.4;
    color: var(--muted);
  }
  .terms b {
    color: var(--text);
  }
  .ti {
    flex: none;
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 7px;
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, transparent);
  }
  footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
</style>
