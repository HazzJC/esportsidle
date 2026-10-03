<script lang="ts">
  import { DECOR, ROOMS } from '../../data/decor';
  import { money } from '../../engine/format';
  import { sectionOpen } from '../../engine/sections';
  import { game } from '../game.svelte';
  import { roomWallBackground } from '../roomArt';
  import { rarityName, roomColor } from '../theme';
  import Icon from './Icon.svelte';
  import Modal from './Modal.svelte';

  /**
   * Moving house is a milestone, so it gets a card of its own: the new place, what it changes (every
   * team's room is redecorated, and better decor fits) and a way to go and look.
   */
  const s = $derived(game.view.s);
  const level = $derived(game.houseMove);
  const room = $derived(level !== null ? ROOMS[level] : undefined);
  const next = $derived(level !== null ? ROOMS[level + 1] : undefined);
  const fits = $derived(level !== null ? DECOR.filter((d) => d.room === level) : []);
  const houseOpen = $derived(sectionOpen(s, 'house'));

  function close() {
    game.houseMove = null;
  }

  function look() {
    game.tab = houseOpen ? 'house' : 'teams';
    game.mobileView = 'center';
    close();
  }
</script>

{#if level !== null && room}
  <Modal title="New house" onclose={close} width={500}>
    <div class="move" style="--rc:{roomColor(level)}">
      <div class="view" style="background-image:{roomWallBackground(level, s.org.primary)}">
        <span class="keys"><Icon name="house" size={22} /></span>
      </div>
      <p class="eyebrow">You moved into</p>
      <h3>{room.name} <span class="rar">{rarityName(level)}</span></h3>
      <p class="muted">{room.desc}</p>
      <ul>
        <li><Icon name="swords" size={14} /> Every team's room is redecorated to match.</li>
        {#if fits.length > 0}
          <li><Icon name="sparkles" size={14} /> {fits.length} new decor piece{fits.length === 1 ? '' : 's'} fit here{houseOpen ? '' : ', once the House tab opens with your second team'}.</li>
        {/if}
        {#if next}
          <li class="dim"><Icon name="trending-up" size={14} /> Next: the {next.name}, at {money(next.threshold)} earned this run.</li>
        {/if}
      </ul>
    </div>
    {#snippet footer()}
      <button class="btn" onclick={close}>Later</button>
      <button class="btn primary" onclick={look}><Icon name="house" size={14} /> {houseOpen ? 'Visit the House' : 'See the new rooms'}</button>
    {/snippet}
  </Modal>
{/if}

<style>
  .move {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .view {
    position: relative;
    height: 120px;
    margin-bottom: 6px;
    border-radius: 10px;
    border: 1px solid color-mix(in srgb, var(--rc) 50%, var(--line));
    background-size: auto 240px;
    background-position: center top;
    background-repeat: repeat-x;
    box-shadow: inset 0 -30px 40px rgba(0, 0, 0, 0.55);
    animation: reveal 0.9s ease-out;
  }
  .keys {
    position: absolute;
    right: 10px;
    bottom: 10px;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    color: #1a1406;
    background: var(--rc);
    box-shadow: 0 0 18px color-mix(in srgb, var(--rc) 60%, transparent);
  }
  .eyebrow {
    margin: 0;
    font-family: var(--font-display);
    font-size: 11px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--muted);
  }
  h3 {
    margin: 0;
    font-family: var(--font-ui);
    font-size: 26px;
    color: var(--rc);
  }
  .rar {
    font-size: 12px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
  }
  p {
    margin: 0;
  }
  ul {
    list-style: none;
    margin: 6px 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
    font-size: 13.5px;
  }
  li {
    display: flex;
    align-items: center;
    gap: 7px;
  }
  @keyframes reveal {
    from {
      clip-path: inset(0 50% 0 50%);
    }
    to {
      clip-path: inset(0 0 0 0);
    }
  }
</style>
