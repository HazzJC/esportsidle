<script lang="ts">
  import { fly, slide } from 'svelte/transition';
  import { game } from '../game.svelte';
  import type { GuidePage } from '../guides';
  import Icon from './Icon.svelte';

  /**
   * A short paged explainer. It shows until the player closes it, and a help button elsewhere can
   * bring it back with game.showGuide(id).
   */
  let { id, title, pages }: { id: string; title: string; pages: GuidePage[] } = $props();

  let index = $state(0);
  const open = $derived(!game.view.s.guides[id] || game.guideOpen === id);
  const page = $derived(pages[Math.min(index, pages.length - 1)]);
  const last = $derived(index >= pages.length - 1);

  function close() {
    index = 0;
    game.dismissGuide(id);
  }
</script>

{#if open && page}
  <section class="guide" aria-label={title} transition:slide={{ duration: 200 }}>
    <header>
      <span class="eyebrow"><Icon name="help" size={13} /> {title} · {index + 1} of {pages.length}</span>
      <button class="close" onclick={close} aria-label="Close the guide"><Icon name="x" size={15} /></button>
    </header>
    {#key index}
      <div class="page" in:fly={{ x: 14, duration: 200 }}>
        <h3><Icon name={page.icon} size={18} /> {page.title}</h3>
        {#if page.intro}<p class="intro">{page.intro}</p>{/if}
        <ul>
          {#each page.points as pt, i (i)}
            <li>
              {#if pt.icon}<span class="pi"><Icon name={pt.icon} size={14} /></span>{/if}
              <span>{#if pt.term}<b>{pt.term}.</b>{' '}{/if}{pt.text}</span>
            </li>
          {/each}
        </ul>
      </div>
    {/key}
    <footer>
      <span class="dots" aria-hidden="true">
        {#each pages as _, i (i)}<i class:now={i === index}></i>{/each}
      </span>
      {#if index > 0}<button class="btn small" onclick={() => index--}>Back</button>{/if}
      {#if last}
        <button class="btn small primary" onclick={close}><Icon name="check" size={13} /> Got it</button>
      {:else}
        <button class="btn small primary" onclick={() => index++}>Next <Icon name="arrow-right" size={13} /></button>
      {/if}
    </footer>
  </section>
{/if}

<style>
  .guide {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, transparent), transparent 60%),
      var(--panel-2, var(--bg-2));
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .eyebrow {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--accent);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .close {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 7px;
    color: var(--muted);
  }
  .close:hover {
    color: var(--text);
    background: rgba(255, 255, 255, 0.06);
  }
  h3 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 4px;
    font-family: var(--font-display);
    font-size: 17px;
  }
  .intro {
    margin: 0 0 6px;
    color: var(--muted);
    font-size: 13px;
    line-height: 1.45;
  }
  ul {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    gap: 8px;
    font-size: 13px;
    line-height: 1.45;
  }
  .pi {
    flex: none;
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    margin-top: -1px;
    border-radius: 6px;
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, transparent);
  }
  b {
    color: var(--text);
  }
  footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
  }
  .dots {
    display: flex;
    gap: 5px;
    margin-right: auto;
  }
  .dots i {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--line-2);
  }
  .dots i.now {
    background: var(--accent);
  }
</style>
