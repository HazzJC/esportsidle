<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getGame } from '../../data/games';
  import { fmt, fmtTime } from '../../engine/format';
  import { RARITY_MAP, isAvailable, skillRating } from '../../engine/players';
  import type { Player } from '../../engine/types';
  import { teamKit } from '../../engine/teams';
  import { game } from '../game.svelte';
  import Avatar from './Avatar.svelte';
  import Icon from './Icon.svelte';

  let {
    player,
    onclick,
    children,
    showCondition = true,
  }: { player: Player; onclick?: () => void; children?: Snippet; showCondition?: boolean } = $props();

  const title = $derived(getGame(player.gameId));
  const rarity = $derived(RARITY_MAP.get(player.rarity)!);
  // Market players wear the kit of the team they would join.
  const kit = $derived(teamKit(game.view.s, player.gameId));
  const out = $derived(!isAvailable(player, game.view.s.time));

  function onKey(e: KeyboardEvent) {
    if (onclick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onclick();
    }
  }
</script>

{#snippet body()}
  <div class="portrait">
    <Avatar look={player.look} gear={player.gear} primary={kit.primary} secondary={kit.secondary} size={50} mode="bust" tag={player.tag} />
    {#if out}
      <span class="status" title="{player.status.reason} (Recovers in {fmtTime(Math.max(0, player.status.until - game.view.s.time))} · purely time-based)">
        <Icon name="thermometer" size={12} />
      </span>
    {/if}
  </div>
  <div class="info">
    <div class="top">
      <span class="tag">{player.tag}</span>
      <span class="rarity">{player.founder ? 'Founder' : rarity.name}</span>
    </div>
    <div class="sub muted">{player.founder ? 'Org founder' : `${player.first} ${player.last}`} · {player.nation}</div>
    <div class="meta">
      <span class="game-badge" style="color: {title.color}">
        <Icon name={title.icon} size={12} color={title.color} />
        <b>{title.name}</b>
      </span>
      <span class="dim">·</span>
      <span>{title.roles[player.role]}</span>
      <span class="dim">·</span>
      <span>Lv {player.level}</span>
    </div>
    {#if showCondition}
      <div class="bars" title="Energy {Math.round(player.energy)} · Morale {Math.round(player.morale)}">
        <i class="energy"><b style="width:{player.energy}%"></b></i>
        <i class="morale"><b style="width:{player.morale}%"></b></i>
      </div>
    {/if}
  </div>
  <div class="rating">
    <span class="num">{fmt(skillRating(player, title))}</span>
    <span class="label">RTG</span>
  </div>
  {#if children}<div class="extra">{@render children()}</div>{/if}
{/snippet}

{#if onclick}
  <div class="card clickable" style="--rc:{rarity.color}" role="button" tabindex="0" {onclick} onkeydown={onKey}>
    {@render body()}
  </div>
{:else}
  <div class="card" style="--rc:{rarity.color}">
    {@render body()}
  </div>
{/if}

<style>
  .card {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 10px 6px 6px;
    border-radius: 10px;
    border: 1px solid color-mix(in srgb, var(--rc) 35%, var(--line));
    background:
      linear-gradient(90deg, color-mix(in srgb, var(--rc) 12%, transparent), transparent 60%),
      var(--bg-2);
    min-width: 0;
  }
  .card.clickable {
    cursor: pointer;
  }
  .card.clickable:hover {
    border-color: var(--rc);
  }
  .card:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .portrait {
    position: relative;
    flex: none;
    width: 50px;
    height: 50px;
    border-radius: 8px;
    overflow: hidden;
    background: radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.08), rgba(0, 0, 0, 0.25));
    border: 1px solid color-mix(in srgb, var(--rc) 45%, transparent);
  }
  .status {
    position: absolute;
    right: 2px;
    top: 2px;
    display: grid;
    place-items: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--red);
    color: #fff;
  }
  .info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .top {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .tag {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 16px;
    line-height: 1.1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .rarity {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--rc);
  }
  .sub {
    font-size: 11.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .meta {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11.5px;
    color: var(--muted);
  }
  .game-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-weight: 600;
  }
  .bars {
    display: flex;
    gap: 4px;
    margin-top: 3px;
  }
  .bars i {
    flex: 1;
    height: 3px;
    border-radius: 2px;
    background: rgba(0, 0, 0, 0.4);
    overflow: hidden;
  }
  .bars b {
    display: block;
    height: 100%;
  }
  .energy b {
    background: var(--lime);
  }
  .morale b {
    background: var(--accent-2);
  }
  .rating {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex: none;
  }
  .rating .num {
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 18px;
    color: var(--rc);
  }
  .rating .label {
    font-size: 9px;
    color: var(--dim);
    letter-spacing: 0.12em;
  }
  .extra {
    flex: none;
  }
</style>
