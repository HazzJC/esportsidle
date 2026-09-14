<script lang="ts">
  import { fly } from 'svelte/transition';
  import { fmtTime } from '../../engine/format';
  import Icon from '../components/Icon.svelte';
  import Modal from '../components/Modal.svelte';
  import { game } from '../game.svelte';

  let renaming = $state(false);
  let draft = $state('');

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
          <stop offset="0" stop-color="#22e4ff" />
          <stop offset="1" stop-color="#ff2bd6" />
        </linearGradient>
      </defs>
      <path
        d="M18 22h28a10 10 0 0 1 10 10v6a10 10 0 0 1-17 7l-3-3H28l-3 3a10 10 0 0 1-17-7v-6a10 10 0 0 1 10-10z"
        fill="url(#brand-g)"
      />
      <circle cx="44" cy="31" r="3" fill="#0b0e1f" />
      <circle cx="50" cy="37" r="3" fill="#0b0e1f" />
      <rect x="17" y="28" width="4" height="12" rx="1" fill="#0b0e1f" />
      <rect x="13" y="32" width="12" height="4" rx="1" fill="#0b0e1f" />
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

  <button class="save" class:error={!!game.saveError} onclick={() => game.save(true)} title="Save now (Ctrl+S)">
    <Icon name="save" size={15} />
    <span class="save-text">{savedLabel}</span>
  </button>
</header>

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
  .topbar {
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
    color: var(--cyan);
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
    border-color: var(--cyan);
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
    color: var(--magenta);
  }
  .news {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
    border-color: var(--cyan);
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
