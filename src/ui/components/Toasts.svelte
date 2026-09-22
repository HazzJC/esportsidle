<script lang="ts">
  import { fly } from 'svelte/transition';
  import { cabinetMarginalGain } from '../../engine/economy';
  import { game, type Toast } from '../game.svelte';
  import { NOTIFY_LABEL } from '../notify';
  import { rarityColor } from '../theme';
  import Icon from './Icon.svelte';

  /** Inline popups sit inside the clicker column; the floating copy covers the page on phones. */
  let { inline = false }: { inline?: boolean } = $props();

  /** Achievements named in a batched popup before collapsing into "and N more". */
  const MAX_LISTED = 3;
  /** Popups on screen at once when they float over a phone or tablet; older ones wait. */
  const MAX_FLOATING = 3;

  /**
   * The clicker column only has room for one popup, so it shows the newest in full and counts the
   * rest, instead of clipping a stack of them mid-sentence.
   */
  const shown = $derived(inline ? game.toasts.slice(-1) : game.toasts.slice(-MAX_FLOATING));
  const hidden = $derived(game.toasts.length - shown.length);
  /** The income the achievements in a popup are worth through Superfan upgrades. */
  const cabinetGain = (t: Toast) => {
    const counted = (t.achievements ?? []).filter((a) => a.cabinet).length;
    const each = cabinetMarginalGain(game.view.r.cabinetCount, game.view.m.superfanFactors);
    return counted * each * 100;
  };
</script>

<!--
  Popups sit over the top-left corner and never take the pointer: clicks pass straight through to
  whatever is underneath, so a popup can never block a purchase. Only its small buttons are clickable.
  Entry-only transitions, because outros never finish in a background tab and would leave stale cards.
-->
<div class="toasts" class:inline aria-live="polite">
  {#if hidden > 0}<span class="more-toasts">+{hidden} more</span>{/if}
  {#each shown as t (t.id)}
    <div
      class="toast {t.tone}"
      class:ach={t.achievements}
      style="--life:{t.duration}ms; {t.achievements ? `--ac:${rarityColor(t.achievements[0].rarity)}` : ''}"
      in:fly={{ x: inline ? -28 : 0, y: inline ? 0 : 18, duration: 260 }}
    >
      {#if t.achievements}
        {@const list = t.achievements}
        <span class="medal" aria-hidden="true">
          <span class="burst"></span>
          <Icon name={list.length === 1 ? list[0].icon : 'trophy'} size={22} />
        </span>
        <span class="text">
          <span class="eyebrow">{t.title}</span>
          {#if list.length === 1}
            <span class="name">{list[0].name}</span>
            <span class="desc">{list[0].desc}</span>
          {:else}
            <span class="names">
              {#each list.slice(0, MAX_LISTED) as a, i (i)}
                <span class="row" style="--rc:{rarityColor(a.rarity)}"><Icon name={a.icon} size={13} /><span>{a.name}</span></span>
              {/each}
              {#if list.length > MAX_LISTED}<span class="more">and {list.length - MAX_LISTED} more</span>{/if}
            </span>
          {/if}
          {#if cabinetGain(t) > 0}
            <span class="reward"><Icon name="trophy" size={12} /> +{cabinetGain(t).toFixed(1)}% income</span>
          {/if}
        </span>
        <i class="shine" aria-hidden="true"></i>
      {:else}
        {#if t.icon}<span class="icon"><Icon name={t.icon} size={18} /></span>{/if}
        <span class="text">
          <span class="title">{t.title}</span>
          {#if t.body}<span class="body">{t.body}</span>{/if}
          {#if t.action}
            {@const action = t.action}
            <button class="go" onclick={() => (game.openTab(action.tab), game.dismissToast(t.id))}>
              {action.label} <Icon name="arrow-right" size={12} />
            </button>
          {/if}
        </span>
      {/if}
      <button class="close" onclick={() => game.dismissToast(t.id)} aria-label="Dismiss notification">
        <Icon name="x" size={13} />
      </button>
      {#if t.channel}
        {@const channel = t.channel}
        <button class="mute" onclick={() => game.setNotify(channel, false)} aria-label="Mute {NOTIFY_LABEL[channel].toLowerCase()} popups" title="Stop showing {NOTIFY_LABEL[channel].toLowerCase()}. Turn them back on from the bell.">
          <Icon name="bell-off" size={12} />
        </button>
      {/if}
      <i class="life" aria-hidden="true"></i>
    </div>
  {/each}
</div>

<style>
  /* On phones and tablets popups rise from just above the bottom bar, clear of the tabs up top. */
  .toasts {
    position: fixed;
    left: 8px;
    bottom: calc(76px + env(safe-area-inset-bottom, 0px));
    z-index: 900;
    width: min(340px, calc(100vw - 16px));
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  }
  .more-toasts {
    align-self: flex-start;
    padding: 1px 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    color: var(--muted);
    background: color-mix(in srgb, var(--panel) 90%, transparent);
    border: 1px solid var(--line-2);
  }
  /* In the clicker column: part of the page, newest at the bottom, clipped to the gap. */
  .toasts.inline {
    position: static;
    width: 100%;
    justify-content: flex-end;
    max-height: 100%;
    overflow: hidden;
  }
  @media (min-width: 1024px) {
    .toasts:not(.inline) {
      display: none;
    }
  }
  .toast {
    --c: var(--accent);
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 10px 34px 12px 12px;
    border-radius: 12px;
    border: 1px solid color-mix(in srgb, var(--c) 30%, var(--line-2));
    background:
      linear-gradient(100deg, color-mix(in srgb, var(--c) 12%, transparent), transparent 55%),
      color-mix(in srgb, var(--panel-2) 97%, transparent);
    box-shadow: var(--shadow);
    backdrop-filter: blur(8px);
    pointer-events: none;
  }
  .toast.good {
    --c: var(--green);
  }
  .toast.bad {
    --c: var(--red);
  }
  .toast.gold {
    --c: var(--gold);
  }
  .icon {
    display: grid;
    place-items: center;
    flex: none;
    width: 32px;
    height: 32px;
    border-radius: 9px;
    color: var(--c);
    background: color-mix(in srgb, var(--c) 14%, transparent);
  }
  .text {
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 1px;
  }
  .title {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 15px;
    line-height: 1.2;
  }
  .body {
    font-size: 12.5px;
    color: var(--muted);
  }
  /* In the clicker column a long popup gives up its tail rather than being cut in half. */
  .inline .body {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Achievement card */
  /* Tinted by the rarest achievement in the popup, on the shared rarity ladder. */
  .ach {
    --c: var(--ac);
    padding: 12px 34px 14px 12px;
    border-color: color-mix(in srgb, var(--ac) 45%, transparent);
    background:
      radial-gradient(120% 140% at 0% 0%, color-mix(in srgb, var(--ac) 16%, transparent), transparent 60%),
      color-mix(in srgb, var(--panel-2) 97%, transparent);
  }
  .medal {
    position: relative;
    display: grid;
    place-items: center;
    flex: none;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    color: color-mix(in srgb, var(--ac) 22%, #0c0c0e);
    background: radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--ac) 30%, #fff), var(--ac) 45%, color-mix(in srgb, var(--ac) 70%, #000));
    box-shadow:
      0 0 0 2px color-mix(in srgb, var(--ac) 35%, transparent),
      0 0 18px color-mix(in srgb, var(--ac) 40%, transparent);
  }
  .burst {
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    border: 2px solid var(--ac);
    opacity: 0;
    animation: burst 0.9s ease-out 0.1s 1;
  }
  .eyebrow {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ac);
  }
  .name {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 17px;
    line-height: 1.15;
  }
  .desc {
    font-size: 12.5px;
    color: var(--muted);
    line-height: 1.3;
  }
  .names {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 2px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 14px;
    color: var(--text);
  }
  .row :global(svg) {
    flex: none;
    color: var(--rc);
  }
  .row span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .more {
    font-size: 12px;
    color: var(--dim);
  }
  .reward {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 12px;
    color: var(--gold);
  }
  /* One sweep of light across the card as it arrives. */
  .shine {
    position: absolute;
    inset: 0;
    background: linear-gradient(105deg, transparent 35%, rgba(255, 255, 255, 0.14) 50%, transparent 65%);
    transform: translateX(-100%);
    animation: shine 1.2s ease-out 0.2s 1;
    pointer-events: none;
  }

  .go {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
    padding: 3px 9px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--c) 60%, transparent);
    background: color-mix(in srgb, var(--c) 16%, transparent);
    color: var(--text);
    font-size: 12px;
    font-weight: 700;
    pointer-events: auto;
  }
  .go:hover {
    background: color-mix(in srgb, var(--c) 30%, transparent);
  }
  .close {
    position: absolute;
    top: 6px;
    right: 6px;
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--dim);
    pointer-events: auto;
  }
  .close:hover,
  .mute:hover {
    color: var(--text);
    background: var(--panel-3);
  }
  .mute {
    position: absolute;
    top: 30px;
    right: 6px;
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--dim);
    opacity: 0.7;
    pointer-events: auto;
  }
  /* Countdown to auto-dismiss. */
  .life {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 2px;
    background: var(--c);
    opacity: 0.7;
    transform-origin: left;
    animation: life var(--life) linear forwards;
  }

  @keyframes life {
    from {
      transform: scaleX(1);
    }
    to {
      transform: scaleX(0);
    }
  }
  @keyframes shine {
    to {
      transform: translateX(100%);
    }
  }
  @keyframes burst {
    0% {
      opacity: 0.9;
      transform: scale(0.8);
    }
    100% {
      opacity: 0;
      transform: scale(1.5);
    }
  }
</style>
