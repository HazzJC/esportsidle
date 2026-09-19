<script lang="ts">
  import { game } from '../game.svelte';
  import { NOTIFY_CHANNELS } from '../notify';
  import Icon from './Icon.svelte';
  import Toggle from './Toggle.svelte';

  const notify = $derived(game.view.s.settings.notify);
  const allOn = $derived(NOTIFY_CHANNELS.every((c) => notify[c.id]));

  function setAll(on: boolean) {
    for (const c of NOTIFY_CHANNELS) game.setNotify(c.id, on);
  }
</script>

<div class="notify">
  {#each NOTIFY_CHANNELS as c (c.id)}
    <div class="row">
      <span class="ic" class:off={!notify[c.id]}><Icon name={c.icon} size={15} /></span>
      <Toggle checked={notify[c.id]} label={c.label} description={c.desc} onchange={(on) => game.setNotify(c.id, on)} />
    </div>
  {/each}
  <button class="btn small all" onclick={() => setAll(!allOn)}>
    <Icon name={allOn ? 'bell-off' : 'bell'} size={13} />
    {allOn ? 'Mute all' : 'Show all'}
  </button>
  <p class="dim note">Your own actions, like purchases and signings, always show.</p>
</div>

<style>
  .notify {
    display: flex;
    flex-direction: column;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .row :global(.toggle) {
    flex: 1;
  }
  .ic {
    display: grid;
    place-items: center;
    flex: none;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, transparent);
  }
  .ic.off {
    color: var(--dim);
    background: var(--bg-2);
  }
  .all {
    align-self: flex-start;
    margin-top: 6px;
  }
  .note {
    margin: 6px 0 0;
    font-size: 12px;
  }
</style>
