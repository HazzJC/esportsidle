<script lang="ts">
  import { fly } from 'svelte/transition';
  import { fmtTime } from '../../engine/format';
  import Icon from '../components/Icon.svelte';
  import Modal from '../components/Modal.svelte';
  import NotifyToggles from '../components/NotifyToggles.svelte';
  import { game } from '../game.svelte';
  import { NOTIFY_CHANNELS } from '../notify';

  let renaming = $state(false);
  let draft = $state('');
  let bellOpen = $state(false);
  let bellWrap: HTMLDivElement | undefined = $state();

  const muted = $derived(NOTIFY_CHANNELS.filter((c) => !game.view.s.settings.notify[c.id]).length);

  function onWindowClick(e: MouseEvent) {
    if (bellOpen && bellWrap && !bellWrap.contains(e.target as Node)) bellOpen = false;
  }

  function onWindowKey(e: KeyboardEvent) {
    if (bellOpen && e.key === 'Escape') bellOpen = false;
  }

  const s = $derived(game.view.s);

  const savedLabel = $derived.by(() => {
    void game.view.frame;
    if (game.saveError) return 'Save failed';
    if (!game.lastSavedAt) return 'Not saved yet';
    const sec = Math.floor((Date.now() - game.lastSavedAt) / 1000);
    return sec < 5 ? 'Saved' : `Saved ${fmtTime(sec)} ago`;
  });

  function openRename() {
    draft = s.org.name;
    renaming = true;
  }

  function submit(e: SubmitEvent) {
    e.preventDefault();
    game.rename(draft);
    renaming = false;
  }

  function focusInput(node: HTMLInputElement) {
    node.focus();
    node.select();
  }
</script>

<header class="topbar panel">
  <div class="brand">
    <svg viewBox="0 0 64 64" width="26" height="26" aria-hidden="true">
      <defs>
        <linearGradient id="brand-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style="stop-color: var(--accent)" />
          <stop offset="1" style="stop-color: var(--gold)" />
        </linearGradient>
      </defs>
      <path
        d="M18 22h28a10 10 0 0 1 10 10v6a10 10 0 0 1-17 7l-3-3H28l-3 3a10 10 0 0 1-17-7v-6a10 10 0 0 1 10-10z"
        fill="url(#brand-g)"
      />
      <circle cx="44" cy="31" r="3" fill="#0e0e10" />
      <circle cx="50" cy="37" r="3" fill="#0e0e10" />
      <rect x="17" y="28" width="4" height="12" rx="1" fill="#0e0e10" />
      <rect x="13" y="32" width="12" height="4" rx="1" fill="#0e0e10" />
    </svg>
    <span class="wordmark">ESPORTS<b>IDLE</b></span>
  </div>

  <button class="org" onclick={openRename} title="Rename your org">
    <span class="org-name">{s.org.name}</span>
    <Icon name="pencil" size={12} />
  </button>

  <div class="ticker">
    {#if s.settings.newsTicker}
      <Icon name="newspaper" size={15} class="ticker-icon" />
      {#key game.news}
        <span class="news" in:fly={{ y: 14, duration: 350 }}>{game.news}</span>
      {/key}
    {/if}
  </div>

  <div class="bell-wrap" bind:this={bellWrap}>
    <button
      class="bell"
      class:muted={muted > 0}
      aria-expanded={bellOpen}
      aria-label={muted > 0 ? `Notifications: ${muted} kind${muted === 1 ? '' : 's'} muted` : 'Notifications'}
      title="Choose which popups to show"
      onclick={() => (bellOpen = !bellOpen)}
    >
      <Icon name={muted === NOTIFY_CHANNELS.length ? 'bell-off' : 'bell'} size={15} />
      {#if muted > 0 && muted < NOTIFY_CHANNELS.length}<span class="badge num">{muted}</span>{/if}
    </button>
    {#if bellOpen}
      <div class="bell-pop panel" role="dialog" aria-label="Notifications">
        <h3 class="section-title">Popups</h3>
        <NotifyToggles />
      </div>
    {/if}
  </div>

  <button class="save" class:error={!!game.saveError} onclick={() => game.save(true)} title="Save now (Ctrl+S)">
    <Icon name="save" size={15} />
    <span class="save-text">{savedLabel}</span>
  </button>
</header>

<svelte:window onclick={onWindowClick} onkeydown={onWindowKey} />

{#if renaming}
  <Modal title="Rename your org" onclose={() => (renaming = false)} width={380}>
    <form onsubmit={submit} class="rename">
      <input use:focusInput bind:value={draft} maxlength="24" placeholder="Org name" aria-label="Org name" />
      <div class="actions">
        <button type="button" class="btn" onclick={() => (renaming = false)}>Cancel</button>
        <button type="submit" class="btn primary" disabled={!draft.trim()}>Rename</button>
      </div>
    </form>
  </Modal>
{/if}

<style>
  /* Above the centre panel and the mobile nav, so the popups menu is never painted over. */
  .topbar {
    position: relative;
    z-index: 800;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 10px;
    min-height: 46px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: none;
  }
  .wordmark {
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 15px;
    letter-spacing: 0.12em;
  }
  .wordmark b {
    color: var(--accent);
    font-weight: 900;
  }
  .org {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid var(--line-2);
    background: var(--bg-2);
    color: var(--muted);
    max-width: 220px;
    flex: none;
  }
  .org:hover {
    color: var(--text);
    border-color: var(--accent);
  }
  .org-name {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 14px;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ticker {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    height: 30px;
    padding: 0 12px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid var(--line);
    overflow: hidden;
    color: var(--muted);
    font-size: 13px;
  }
  .ticker :global(.ticker-icon) {
    flex: none;
    color: var(--accent-2);
  }
  .news {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .bell-wrap {
    position: relative;
    flex: none;
  }
  .bell {
    position: relative;
    display: grid;
    place-items: center;
    width: 32px;
    height: 30px;
    border-radius: 8px;
    border: 1px solid var(--line-2);
    background: var(--bg-2);
    color: var(--muted);
  }
  .bell:hover,
  .bell[aria-expanded='true'] {
    color: var(--text);
    border-color: var(--accent);
  }
  .bell.muted {
    color: var(--dim);
  }
  .badge {
    position: absolute;
    top: -5px;
    right: -5px;
    min-width: 15px;
    height: 15px;
    padding: 0 3px;
    border-radius: 999px;
    background: var(--panel-3);
    border: 1px solid var(--line-2);
    color: var(--text);
    font-size: 10px;
    line-height: 13px;
    text-align: center;
  }
  .bell-pop {
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    z-index: 60;
    width: min(340px, calc(100vw - 32px));
    max-height: calc(100dvh - 72px);
    overflow-y: auto;
    padding: 10px 14px 12px;
    background: var(--panel-2);
    border-color: var(--line-2);
    box-shadow: var(--shadow);
  }
  .bell-pop .section-title {
    margin: 0 0 2px;
  }
  .save {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    border-radius: 8px;
    border: 1px solid var(--line-2);
    background: var(--bg-2);
    color: var(--muted);
    font-size: 12px;
    flex: none;
  }
  .save:hover {
    color: var(--text);
    border-color: var(--green);
  }
  .save.error {
    color: var(--red);
    border-color: var(--red);
  }
  .rename {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .rename input {
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid var(--line-2);
    background: var(--bg-2);
    font-size: 16px;
    font-family: var(--font-ui);
    font-weight: 700;
  }
  .rename input:focus {
    outline: none;
    border-color: var(--accent);
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  @media (max-width: 1000px) {
    .save-text {
      display: none;
    }
  }
  @media (max-width: 860px) {
    .wordmark {
      display: none;
    }
    .ticker {
      display: none;
    }
    .org {
      flex: 1;
      max-width: none;
    }
  }
</style>
