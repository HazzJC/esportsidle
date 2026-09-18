<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { UI_TONES } from '../../data/palette';
  import { game } from '../game.svelte';
  import Icon from './Icon.svelte';
  import ToneSwatches from './ToneSwatches.svelte';

  let name = $state(game.view.s.org.name);
  const tone = $derived(game.view.s.settings.uiAccent);
  const clean = $derived(name.replace(/\s+/g, ' ').trim());

  function start(e: SubmitEvent) {
    e.preventDefault();
    if (clean) game.completeOnboarding(clean, tone);
  }
</script>

<div class="backdrop" in:fade={{ duration: 200 }}>
  <form class="card" in:fly={{ y: 16, duration: 260 }} onsubmit={start} aria-labelledby="onboarding-title">
    <p class="eyebrow">Found your org</p>
    <h1 id="onboarding-title">Every dynasty starts in a garage.</h1>
    <p class="lede">Name your org and choose how the interface looks. Both can be changed later.</p>

    <label class="field">
      <span class="label">Org name</span>
      <input bind:value={name} maxlength="24" autocomplete="off" spellcheck="false" placeholder="Garage Gamers" />
    </label>

    <div class="field">
      <span class="label">Interface tone</span>
      <span class="hint">The highlight colour for menus and buttons. Change it any time in Options.</span>
      <ToneSwatches value={tone} swatches={UI_TONES} onpick={(c) => game.setTone(c)} label="Interface tone" />
    </div>

    <div class="preview" aria-hidden="true">
      <span class="p-tab">Teams</span>
      <span class="p-tab off">Roster</span>
      <span class="p-bar"><i></i></span>
      <span class="p-btn">Sign player</span>
    </div>

    <p class="note">
      <Icon name="shirt" size={14} />
      Your teams start in this colour too. Pick proper team colours in the Studio whenever you like.
    </p>

    <button class="btn primary start" type="submit" disabled={!clean}>
      Found {clean || 'your org'}
      <Icon name="chevron-right" size={16} />
    </button>
  </form>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: grid;
    place-items: center;
    padding: 16px;
    background: color-mix(in srgb, var(--bg) 82%, transparent);
    backdrop-filter: blur(6px);
  }
  .card {
    width: min(520px, 100%);
    max-height: calc(100vh - 32px);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 26px 26px 22px;
    border-radius: 16px;
    border: 1px solid var(--line-2);
    background:
      radial-gradient(120% 60% at 0% 0%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 60%),
      var(--panel);
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55);
  }
  .eyebrow {
    margin: 0;
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--accent);
  }
  h1 {
    margin: -8px 0 0;
    font-family: var(--font-ui);
    font-size: 28px;
    line-height: 1.1;
  }
  .lede {
    margin: -8px 0 0;
    color: var(--muted);
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .label {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 13px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .hint {
    margin-top: -4px;
    font-size: 12.5px;
    color: var(--dim);
  }
  input {
    padding: 10px 12px;
    border-radius: 9px;
    border: 1px solid var(--line-2);
    background: var(--bg-2);
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 18px;
  }
  input:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: var(--glow-accent);
  }
  .preview {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px dashed var(--line-2);
    background: var(--bg-2);
  }
  .p-tab {
    padding: 3px 10px;
    border-radius: 6px;
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 13px;
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 14%, transparent);
    border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
  }
  .p-tab.off {
    color: var(--muted);
    background: none;
    border-color: transparent;
  }
  .p-bar {
    flex: 1;
    height: 6px;
    border-radius: 999px;
    background: var(--panel-3);
    overflow: hidden;
  }
  .p-bar i {
    display: block;
    width: 62%;
    height: 100%;
    background: var(--accent);
  }
  .p-btn {
    padding: 4px 10px;
    border-radius: 6px;
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 13px;
    color: var(--on-accent);
    background: var(--accent);
  }
  .note {
    display: flex;
    align-items: center;
    gap: 7px;
    margin: 0;
    font-size: 12.5px;
    color: var(--dim);
  }
  .start {
    align-self: stretch;
    padding: 11px 16px;
    font-size: 17px;
  }
</style>
