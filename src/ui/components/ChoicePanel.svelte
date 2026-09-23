<script lang="ts">
  import { fly } from 'svelte/transition';
  import { fmtTime, money } from '../../engine/format';
  import { CHOICE_LIFETIME } from '../../engine/worldEvents';
  import { game } from '../game.svelte';
  import { orgLogoSvg } from '../orgArt';
  import Avatar from './Avatar.svelte';
  import Icon from './Icon.svelte';

  const s = $derived(game.view.s);
  const choice = $derived(s.events.pending[0]);
  const player = $derived(choice && typeof choice.data.playerId === 'string' ? s.players[choice.data.playerId] : undefined);
  const rival = $derived(choice && typeof choice.data.rival === 'string' ? choice.data.rival : undefined);

  /** Hand-drawn props for the events that don't star a player. Built from constants, so {@html} is safe. */
  const PROPS: Record<string, string> = {
    investor: `<svg viewBox="0 0 64 48" aria-hidden="true">
      <ellipse cx="32" cy="44" rx="26" ry="3" fill="#000" opacity=".35"/>
      <rect x="6" y="30" width="20" height="12" rx="2" fill="#2f8f5a"/><rect x="6" y="30" width="20" height="3" rx="1" fill="#6fe0a0" opacity=".7"/>
      <rect x="8" y="24" width="20" height="10" rx="2" fill="#35a567"/><rect x="8" y="24" width="20" height="3" rx="1" fill="#8ff0b8" opacity=".7"/>
      <circle cx="18" cy="29" r="3" fill="none" stroke="#1d5c39" stroke-width="1.4"/>
      <rect x="28" y="16" width="30" height="26" rx="4" fill="#5b3a22"/><rect x="28" y="16" width="30" height="7" rx="3" fill="#7a5032"/>
      <rect x="38" y="11" width="10" height="6" rx="2" fill="none" stroke="#3b2414" stroke-width="2.4"/>
      <rect x="40" y="26" width="6" height="5" rx="1" fill="#ffc83d"/><rect x="28" y="36" width="30" height="6" rx="3" fill="#000" opacity=".22"/>
      <path d="M31 19h10" stroke="#fff" stroke-opacity=".25" stroke-width="1.4" stroke-linecap="round"/>
    </svg>`,
    charity: `<svg viewBox="0 0 64 48" aria-hidden="true">
      <ellipse cx="32" cy="44" rx="24" ry="3" fill="#000" opacity=".35"/>
      <rect x="10" y="24" width="24" height="18" rx="2" fill="#8b5cff"/><rect x="8" y="19" width="28" height="7" rx="2" fill="#a37bff"/>
      <rect x="20" y="19" width="4" height="23" fill="#ffc83d"/><path d="M22 19c-6-8-12-4-8 0M22 19c6-8 12-4 8 0" fill="none" stroke="#ffc83d" stroke-width="2.4"/>
      <rect x="10" y="36" width="24" height="6" fill="#000" opacity=".18"/>
      <path d="M46 40c-9-6-14-10-14-16a7 7 0 0 1 14-2 7 7 0 0 1 14 2c0 6-5 10-14 16z" fill="#ff4d6d"/>
      <path d="M38 20a4 4 0 0 1 5 1" stroke="#fff" stroke-opacity=".55" stroke-width="2" stroke-linecap="round" fill="none"/>
    </svg>`,
    contract: `<svg viewBox="0 0 64 48" aria-hidden="true">
      <ellipse cx="32" cy="44" rx="22" ry="3" fill="#000" opacity=".35"/>
      <path d="M14 6h28l8 8v30H14z" fill="#e9ecff"/><path d="M42 6v8h8" fill="#b9bfe0"/>
      <path d="M19 16h18M19 21h24M19 26h22M19 31h14" stroke="#8d95c9" stroke-width="2" stroke-linecap="round"/>
      <path d="M20 39c3-4 5 2 8-1s4-3 7 0" stroke="#1d2347" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <path d="M50 44 58 20l4 2-8 24z" fill="#ffc83d"/><path d="M58 20l4 2 1-3-4-2z" fill="#ff4d6d"/>
    </svg>`,
  };
  const prop = $derived(choice ? (PROPS[choice.eventId] ?? (player ? PROPS.contract : undefined)) : undefined);
</script>

{#if choice}
  {#key choice.id}
    <div class="choice" role="dialog" aria-label={choice.title} transition:fly={{ y: 30, duration: 220 }}>
      <div class="banner">
        <span class="spot" aria-hidden="true"></span>
        {#if player}
          <span class="bust">
            <Avatar look={player.look} gear={player.gear} primary={s.org.primary} secondary={s.org.secondary} size={78} mode="bust" tag={player.tag} />
          </span>
        {:else}
          <span class="medal"><Icon name={choice.icon} size={26} /></span>
        {/if}
        <div class="headline">
          <span class="kicker"><Icon name={choice.icon} size={12} /> Decision</span>
          <div class="title">{choice.title}</div>
        </div>
        {#if rival}
          <span class="crest" title={rival}>{@html orgLogoSvg(rival)}</span>
        {:else if prop}
          <span class="prop">{@html prop}</span>
        {/if}
      </div>
      <div class="content">
        <div class="body muted">{choice.body}</div>
        <div class="options">
          {#each choice.options as option, i (i)}
            {@const cost = option.cash ?? 0}
            {@const tooDear = cost > 0 && s.cash < cost}
            <button class="option {option.tone}" class:too-dear={tooDear} disabled={tooDear} onclick={() => game.resolveChoice(choice.id, i)}>
              <span class="label">
                {option.label}
                {#if cost > 0}<span class="money out num">−{money(cost)}</span>
                {:else if cost < 0}<span class="money in num">+{money(-cost)}</span>{/if}
              </span>
              <span class="desc">{option.desc}{tooDear ? ` · you have ${money(s.cash)}` : ''}</span>
            </button>
          {/each}
        </div>
        <div class="foot">
          <span class="bar"><i style="width:{Math.max(0, (choice.expiresAt - s.time) / CHOICE_LIFETIME) * 100}%"></i></span>
          <span class="dim small num">
            {fmtTime(choice.expiresAt - s.time)} to decide
            {#if s.events.pending.length > 1}· {s.events.pending.length - 1} more waiting{/if}
          </span>
        </div>
      </div>
    </div>
  {/key}
{/if}

<style>
  .money {
    margin-left: 6px;
    font-weight: 800;
  }
  .money.in {
    color: var(--green);
  }
  .money.out {
    color: var(--gold);
  }
  .option.too-dear {
    opacity: 0.5;
  }
  /* A solid card at the bottom of the centre, clear of the logo and the store. */
  .choice {
    position: fixed;
    left: 50%;
    bottom: 14px;
    translate: -50% 0;
    z-index: 1000;
    width: min(440px, calc(100vw - 28px));
    max-height: calc(100dvh - 90px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 14px;
    border: 1px solid color-mix(in srgb, var(--gold) 70%, var(--line));
    background: var(--panel);
    box-shadow:
      0 18px 50px rgba(0, 0, 0, 0.6),
      0 0 30px color-mix(in srgb, var(--gold) 18%, transparent);
  }
  .banner {
    position: relative;
    display: flex;
    align-items: flex-end;
    gap: 10px;
    min-height: 88px;
    padding: 10px 14px 0;
    overflow: hidden;
    background:
      linear-gradient(180deg, transparent 62%, rgba(0, 0, 0, 0.35) 62%, rgba(0, 0, 0, 0.5)),
      repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.035) 0 1px, transparent 1px 22px),
      linear-gradient(160deg, color-mix(in srgb, var(--gold) 30%, #1a1406), #120f1c 70%);
    border-bottom: 1px solid color-mix(in srgb, var(--gold) 40%, transparent);
  }
  .spot {
    position: absolute;
    left: 10px;
    top: -30px;
    width: 120px;
    height: 150px;
    background: radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--gold) 40%, transparent), transparent 70%);
    pointer-events: none;
  }
  .bust {
    position: relative;
    flex: none;
    width: 78px;
    height: 78px;
    filter: drop-shadow(0 3px 3px rgba(0, 0, 0, 0.6));
  }
  .medal {
    position: relative;
    flex: none;
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    margin-bottom: 12px;
    border-radius: 50%;
    color: #1a1406;
    background: radial-gradient(circle at 35% 30%, #ffe9a8, var(--gold) 55%, #9a6a10);
    box-shadow:
      inset 0 -3px 0 rgba(0, 0, 0, 0.25),
      0 4px 10px rgba(0, 0, 0, 0.5);
  }
  .headline {
    position: relative;
    flex: 1;
    min-width: 0;
    padding: 10px 0 12px;
    align-self: center;
  }
  .kicker {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: var(--font-display);
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--gold);
  }
  .title {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 17px;
    line-height: 1.15;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
  }
  .crest,
  .prop {
    position: relative;
    flex: none;
    align-self: center;
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.55));
  }
  .crest :global(svg) {
    display: block;
    width: 50px;
    height: 50px;
  }
  .prop :global(svg) {
    display: block;
    width: 72px;
    height: 54px;
  }
  .content {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px 12px 12px;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .body {
    font-size: 12.5px;
  }
  .options {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .option {
    --c: var(--accent);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 6px 10px;
    border-radius: 8px;
    border: 1px solid color-mix(in srgb, var(--c) 45%, var(--line));
    background: color-mix(in srgb, var(--c) 10%, var(--bg-2));
    text-align: left;
  }
  .option:hover {
    border-color: var(--c);
  }
  .option.good {
    --c: var(--green);
  }
  .option.bad {
    --c: var(--red);
  }
  .option.gold {
    --c: var(--gold);
  }
  .label {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 14px;
  }
  .desc {
    font-size: 11.5px;
    color: var(--muted);
  }
  .foot {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .foot .bar i {
    background: var(--gold);
  }
  .small {
    font-size: 11.5px;
  }
  @media (max-width: 1023px) {
    .choice {
      bottom: 76px;
      max-height: calc(100dvh - 150px);
    }
  }
</style>
