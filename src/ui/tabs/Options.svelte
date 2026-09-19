<script lang="ts">
  import type { NumberFormat } from '../../engine/format';
  import { GAME_VERSION } from '../../engine/state';
  import Icon from '../components/Icon.svelte';
  import Modal from '../components/Modal.svelte';
  import NotifyToggles from '../components/NotifyToggles.svelte';
  import { UI_TONES } from '../../data/palette';
  import ToneSwatches from '../components/ToneSwatches.svelte';
  import Toggle from '../components/Toggle.svelte';
  import { game } from '../game.svelte';

  let exportText = $state('');
  let importText = $state('');
  let copied = $state(false);
  let resetOpen = $state(false);
  let resetConfirm = $state('');
  let fileInput: HTMLInputElement | undefined = $state();

  const settings = $derived(game.view.s.settings);

  function doExport() {
    exportText = game.exportSave();
    copied = false;
  }

  async function copyExport() {
    try {
      await navigator.clipboard.writeText(exportText);
      copied = true;
    } catch {
      copied = false;
      game.toast({ title: 'Copy failed', body: 'Select the text and copy it manually.', icon: 'copy', tone: 'bad' });
    }
  }

  function doImport() {
    if (game.importSave(importText)) importText = '';
  }

  async function onFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (file) await game.uploadSave(file);
    input.value = '';
  }

  function doReset() {
    if (resetConfirm.trim().toUpperCase() !== 'RESET') return;
    game.hardReset();
    resetOpen = false;
    resetConfirm = '';
  }

  function selectAll(e: Event) {
    (e.currentTarget as HTMLTextAreaElement).select();
  }
</script>

<div class="options">
  <section>
    <h3 class="section-title">Save data</h3>
    <p class="muted small">
      Your game autosaves in this browser every {settings.autosaveSeconds} seconds. Export regularly to back up your progress or move
      it to another device.
    </p>
    <div class="row">
      <button class="btn primary" onclick={() => game.save(true)}><Icon name="save" size={15} /> Save now</button>
      <button class="btn" onclick={doExport}><Icon name="copy" size={15} /> Export text</button>
      <button class="btn" onclick={() => game.downloadSave()}><Icon name="download" size={15} /> Download file</button>
      <button class="btn" onclick={() => fileInput?.click()}><Icon name="upload" size={15} /> Load file</button>
      <input bind:this={fileInput} type="file" accept=".txt,text/plain" hidden onchange={onFile} />
    </div>

    {#if exportText}
      <div class="box">
        <textarea readonly rows="4" value={exportText} onfocus={selectAll} aria-label="Exported save"></textarea>
        <button class="btn small" onclick={copyExport}><Icon name={copied ? 'check' : 'copy'} size={13} /> {copied ? 'Copied' : 'Copy'}</button>
      </div>
    {/if}

    <div class="box">
      <textarea rows="3" bind:value={importText} placeholder="Paste a save string here…" aria-label="Import save"></textarea>
      <button class="btn small" disabled={!importText.trim()} onclick={doImport}><Icon name="upload" size={13} /> Import</button>
    </div>
  </section>

  <section>
    <h3 class="section-title">Interface tone</h3>
    <p class="muted small">The highlight colour for menus and buttons. This only changes the interface; your team colours are set in the Studio.</p>
    <ToneSwatches value={settings.uiAccent} swatches={UI_TONES} onpick={(c) => game.setTone(c)} label="Interface tone" />
  </section>

  <section>
    <h3 class="section-title">Popups</h3>
    <p class="muted small">Late in a run, several teams can finish matches every few seconds. Mute the kinds you do not need. The bell in the top bar has the same switches, and every popup has its own mute button.</p>
    <NotifyToggles />
  </section>

  <section>
    <h3 class="section-title">Display</h3>
    <label class="select-row">
      <span>Number format</span>
      <select value={settings.numberFormat} onchange={(e) => game.setSetting('numberFormat', e.currentTarget.value as NumberFormat)}>
        <option value="short">Short (1.23 M)</option>
        <option value="long">Long (1.23 million)</option>
        <option value="scientific">Scientific (1.23e6)</option>
        <option value="power">Powers of ten (1.23 × 10⁶)</option>
      </select>
    </label>
    <label class="select-row">
      <span>Sound effects</span>
      <span class="volume">
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={settings.volume}
          disabled={settings.muted}
          aria-label="Sound volume"
          oninput={(e) => game.setSetting('volume', Number(e.currentTarget.value))}
          onchange={() => game.sfx('buy')}
        />
        <button class="btn small" onclick={() => game.setSetting('muted', !settings.muted)} aria-label={settings.muted ? 'Unmute' : 'Mute'}>
          <Icon name={settings.muted ? 'volume-x' : 'volume-2'} size={14} />
        </button>
      </span>
    </label>
    <label class="select-row">
      <span>Music</span>
      <span class="volume">
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={settings.musicVolume}
          disabled={!settings.musicOn}
          aria-label="Music volume"
          oninput={(e) => game.setSetting('musicVolume', Number(e.currentTarget.value))}
        />
        <button class="btn small" onclick={() => game.setSetting('musicOn', !settings.musicOn)} aria-label={settings.musicOn ? 'Turn music off' : 'Turn music on'}>
          <Icon name={settings.musicOn ? 'volume-2' : 'volume-x'} size={14} />
        </button>
      </span>
    </label>
    <p class="muted small">"Night Shift", an original track generated live in your browser: industrial half-time drums, a growling reese bass and a slow build. It never loops quite the same way.</p>
    <Toggle checked={settings.newsTicker} label="News ticker" onchange={(v) => game.setSetting('newsTicker', v)} />
    <Toggle checked={settings.floatingText} label="Floating numbers" description="Show cash popping out when you click." onchange={(v) => game.setSetting('floatingText', v)} />
    <Toggle checked={settings.particles} label="Particles" onchange={(v) => game.setSetting('particles', v)} />
    <Toggle checked={settings.reducedMotion} label="Reduced motion" description="Turns off most animations." onchange={(v) => game.setSetting('reducedMotion', v)} />
  </section>

  <section>
    <h3 class="section-title">Gameplay</h3>
    <label class="select-row">
      <span>Autosave every</span>
      <select value={settings.autosaveSeconds} onchange={(e) => game.setSetting('autosaveSeconds', Number(e.currentTarget.value))}>
        <option value={10}>10 seconds</option>
        <option value={30}>30 seconds</option>
        <option value={60}>1 minute</option>
        <option value={120}>2 minutes</option>
      </select>
    </label>
    <Toggle
      checked={settings.offlineProgress}
      label="Offline progress"
      description="Keep earning (at reduced efficiency) while the game is closed."
      onchange={(v) => game.setSetting('offlineProgress', v)}
    />
  </section>

  <section class="danger">
    <h3 class="section-title">Danger zone</h3>
    <div class="row">
      <button class="btn danger" onclick={() => (resetOpen = true)}><Icon name="skull" size={15} /> Hard reset</button>
      <span class="muted small">Wipes everything, including achievements. There is no undo.</span>
    </div>
  </section>

  <p class="dim small about">
    Esports Idle v{GAME_VERSION} · <a href="https://github.com/HazzJC/esportsidle" target="_blank" rel="noreferrer">GitHub</a>
  </p>
</div>

{#if resetOpen}
  <Modal title="Hard reset" onclose={() => (resetOpen = false)} width={400}>
    <p>This deletes your org, all progress and all achievements. Consider exporting your save first.</p>
    <p>Type <b>RESET</b> to confirm.</p>
    <input class="confirm" bind:value={resetConfirm} aria-label="Type RESET to confirm" />
    {#snippet footer()}
      <button class="btn" onclick={() => (resetOpen = false)}>Cancel</button>
      <button class="btn danger" disabled={resetConfirm.trim().toUpperCase() !== 'RESET'} onclick={doReset}>Delete everything</button>
    {/snippet}
  </Modal>
{/if}

<style>
  .options {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 640px;
  }
  section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .small {
    font-size: 12.5px;
    margin: 0;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .box {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
    margin-top: 6px;
  }
  textarea,
  select,
  .confirm {
    width: 100%;
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid var(--line-2);
    background: var(--bg-2);
    font-family: ui-monospace, 'Cascadia Code', Consolas, monospace;
    font-size: 12px;
    resize: vertical;
  }
  select {
    width: auto;
    font-family: var(--font-body);
    font-size: 13px;
  }
  textarea:focus,
  select:focus,
  .confirm:focus {
    outline: none;
    border-color: var(--accent);
  }
  .volume {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .volume input {
    width: 130px;
    accent-color: var(--accent);
  }
  .select-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 6px 0;
    font-weight: 600;
  }
  .danger .section-title {
    color: var(--red);
  }
  .about a {
    color: var(--accent);
  }
</style>
