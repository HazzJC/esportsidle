<script lang="ts">
  import { fly } from 'svelte/transition';
  import { EVENT_INTROS, firstKey, type EventIntro } from '../../data/intros';
  import { game } from '../game.svelte';
  import Icon from './Icon.svelte';

  /**
   * A one-time explainer for something that arrives by itself (the first Drama Drop, decision or
   * Invitational): what it is and what the options do. Inline inside the panel it explains, or
   * floating near the top of the screen. "Got it" puts it away for good. Text lives in data/intros.ts.
   */
  let { id, floating = false }: { id: EventIntro['id']; floating?: boolean } = $props();

  const intro = $derived(EVENT_INTROS[id]);
</script>

<aside class="note" class:floating aria-label={intro.title} in:fly={{ y: floating ? -16 : 8, duration: 220 }}>
  <span class="nicon"><Icon name={intro.icon} size={18} /></span>
  <div class="nbody">
    <span class="nlabel">First time</span>
    <b>{intro.title}</b>
    <p>{intro.text}</p>
    <ul>
      {#each intro.points as point (point)}<li>{point}</li>{/each}
    </ul>
  </div>
  <button class="btn small primary" onclick={() => game.dismissGuide(firstKey(id))}><Icon name="check" size={13} /> Got it</button>
</aside>

<style>
  .note {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 4px 10px;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid color-mix(in srgb, var(--accent) 50%, transparent);
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--accent) 14%, transparent), transparent 70%),
      var(--bg-2);
    text-align: left;
  }
  .floating {
    position: fixed;
    top: 64px;
    left: 50%;
    z-index: 1001;
    width: min(440px, calc(100vw - 24px));
    transform: translateX(-50%);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.55);
  }
  .nicon {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 9px;
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 15%, transparent);
  }
  .nbody {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .nlabel {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 9.5px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--accent);
  }
  b {
    font-family: var(--font-ui);
    font-size: 15px;
  }
  p {
    margin: 0;
    font-size: 13px;
    line-height: 1.4;
    color: var(--text);
  }
  ul {
    margin: 2px 0 0;
    padding-left: 16px;
    font-size: 12.5px;
    line-height: 1.4;
    color: var(--muted);
  }
  .btn {
    grid-column: 2;
    justify-self: end;
  }
</style>
