<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { DEFAULT_EMBLEM, type Emblem } from '../../data/emblems';
  import { DEFAULT_KIT, UI_TONES } from '../../data/palette';
  import { kitForTone } from '../../engine/org';
  import { game } from '../game.svelte';
  import EmblemPicker from './EmblemPicker.svelte';
  import Icon from './Icon.svelte';
  import OrgLogo from './OrgLogo.svelte';
  import ToneSwatches from './ToneSwatches.svelte';

  let name = $state(game.view.s.org.name);
  let emblem = $state<Emblem>({ ...(game.view.s.org.emblem ?? DEFAULT_EMBLEM) });
  const s = $derived(game.view.s);
  const tone = $derived(s.settings.uiAccent);
  const clean = $derived(name.replace(/\s+/g, ' ').trim());
  /** Teams start in the chosen colour unless the player has already picked a kit of their own. */
  const kit = $derived(s.org.primary === DEFAULT_KIT.primary && s.org.secondary === DEFAULT_KIT.secondary ? kitForTone(tone) : s.org);

  function start(e: SubmitEvent) {
    e.preventDefault();
    if (clean) game.completeOnboarding(clean, tone, emblem);
  }
</script>

<div class="backdrop" in:fade={{ duration: 200 }}>
  <form class="card" in:fly={{ y: 16, duration: 260 }} onsubmit={start} aria-labelledby="onboarding-title">
    <div class="intro">
      <p class="eyebrow">Found your org</p>
      <h1 id="onboarding-title">Every dynasty starts in a garage.</h1>
      <p class="lede">Name your org, pick its colour and design its logo. You can change all of it later.</p>
    </div>

    <div class="layout">
      <div class="preview">
        <OrgLogo name={clean || 'Org'} primary={kit.primary} secondary={kit.secondary} size={168} shape={emblem.shape} mark={emblem.mark} />
        <b class="pname">{clean || 'Your org'}</b>
      </div>

      <div class="fields">
        <label class="field">
          <span class="label">Name</span>
          <input bind:value={name} maxlength="24" autocomplete="off" spellcheck="false" placeholder="Garage Gamers" />
        </label>

        <div class="field">
          <span class="label">Colour</span>
          <span class="hint">Your team kit and the interface highlight. Fine-tune team colours in the Studio later.</span>
          <ToneSwatches value={tone} swatches={UI_TONES} onpick={(c) => game.setTone(c)} label="Org colour" />
        </div>

        <div class="field">
          <span class="label">Logo</span>
          <EmblemPicker {emblem} name={clean} primary={kit.primary} secondary={kit.secondary} onchange={(next) => (emblem = next)} />
          <span class="hint">Or draw your own pixel logo in the Studio once it opens.</span>
        </div>
      </div>
    </div>

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
    width: min(720px, 100%);
    max-height: calc(100vh - 32px);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 26px 26px 22px;
    border-radius: 16px;
    border: 1px solid var(--line-2);
    background:
      radial-gradient(120% 60% at 0% 0%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 60%),
      var(--panel);
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55);
  }
  .intro {
    display: flex;
    flex-direction: column;
    gap: 6px;
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
    margin: 0;
    font-family: var(--font-ui);
    font-size: 28px;
    line-height: 1.1;
  }
  .lede {
    margin: 0;
    color: var(--muted);
  }
  .layout {
    display: grid;
    grid-template-columns: 200px minmax(0, 1fr);
    gap: 20px;
    align-items: start;
  }
  .preview {
    position: sticky;
    top: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 14px 10px;
    border-radius: 14px;
    border: 1px solid var(--line);
    background: radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 70%), var(--bg-2);
  }
  .pname {
    font-family: var(--font-ui);
    font-size: 16px;
    text-align: center;
    word-break: break-word;
  }
  .fields {
    display: flex;
    flex-direction: column;
    gap: 16px;
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
  .start {
    align-self: stretch;
    padding: 11px 16px;
    font-size: 17px;
  }
  @media (max-width: 620px) {
    .layout {
      grid-template-columns: minmax(0, 1fr);
    }
    .preview {
      position: static;
      flex-direction: row;
      justify-content: center;
    }
  }
</style>
