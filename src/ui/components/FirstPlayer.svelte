<script lang="ts">
  import { getGame } from '../../data/games';
  import { tierName } from '../../data/leagues';
  import { TRAIT_MAP } from '../../data/traits';
  import { MAX_NAME, MAX_TAG, draftOutlook } from '../../engine/draft';
  import { fmt, money } from '../../engine/format';
  import { RARITY_MAP, skillRating } from '../../engine/players';
  import { teamKit } from '../../engine/teams';
  import { game } from '../game.svelte';
  import { tooltip } from '../tooltip.svelte';
  import Avatar from './Avatar.svelte';
  import Icon from './Icon.svelte';
  import LookEditor from './LookEditor.svelte';

  let editing = $state(false);

  const v = $derived(game.view);
  const s = $derived(v.s);
  const pick = $derived(s.draft?.[0]);
  const founding = $derived(!s.players.founder);
  const clickValue = $derived(Math.max(1e-9, v.r.click));
</script>

{#if pick}
  {@const p = pick.player}
  {@const g = getGame(p.gameId)}
  {@const kit = teamKit(s, p.gameId)}
  {@const rarity = RARITY_MAP.get(p.rarity)!}
  {@const outlook = draftOutlook(s, p, v.m)}
  {@const short = Math.max(0, pick.price - s.cash)}
  <section class="first" style="--rc:{rarity.color}">
    <header>
      <h2 class="section-title">Sign your first player</h2>
      <p class="muted small">
        {p.first} "{p.tag}" {p.last} wants to play {g.name} for {s.org.name}. Signing them founds your first team.
        {#if founding}Make them yours: your first player is your founding player and stays with the org for good.{/if}
      </p>
    </header>

    <div class="body">
      <div class="portrait">
        <Avatar look={p.look} gear={p.gear} primary={kit.primary} secondary={kit.secondary} size={132} number={p.jersey} />
        <button class="btn small" onclick={() => game.randomiseDraftLook()}><Icon name="shuffle" size={13} /> New look</button>
      </div>

      <div class="details">
        <div class="names">
          <label class="tag">
            <span>Gamer tag</span>
            <input value={p.tag} maxlength={MAX_TAG} spellcheck="false" onchange={(e) => game.customiseDraft({ tag: e.currentTarget.value })} />
          </label>
          <label>
            <span>First name</span>
            <input value={p.first} maxlength={MAX_NAME} onchange={(e) => game.customiseDraft({ first: e.currentTarget.value })} />
          </label>
          <label>
            <span>Last name</span>
            <input value={p.last} maxlength={MAX_NAME} onchange={(e) => game.customiseDraft({ last: e.currentTarget.value })} />
          </label>
        </div>

        <div class="facts">
          <span class="chip rarity">{rarity.name}</span>
          <span use:tooltip={() => ({ title: 'Rating', lines: ['How good they are right now. Levels, gear and staff all raise it.'] })}>
            <b class="num">{fmt(skillRating(p, g))}</b> rating
          </span>
          <span use:tooltip={() => ({ title: 'Win chance', lines: [`In the ${tierName(0)}, the bottom league, before any gear or staff.`] })}>
            <b class="num">{Math.round(outlook.win * 100)}%</b> to win
          </span>
          <span>{g.name} · {g.roles[p.role]}</span>
          {#each p.traits as id (id)}
            {@const t = TRAIT_MAP.get(id)}
            {#if t}<span class="trait {t.tone}" use:tooltip={() => ({ title: t.name, icon: t.icon, lines: [t.desc] })}><Icon name={t.icon} size={12} /> {t.name}</span>{/if}
          {/each}
        </div>

        <div class="actions">
          <button class="btn small" onclick={() => (editing = !editing)} aria-expanded={editing}>
            <Icon name="palette" size={13} />
            {editing ? 'Done customising' : 'Customise look'}
          </button>
          <span class="spacer"></span>
          <span class="small {short === 0 ? 'good' : 'muted'}">
            {#if short === 0}Ready to sign{:else}{fmt(Math.ceil(short / clickValue))} more click{Math.ceil(short / clickValue) === 1 ? '' : 's'}{/if}
          </span>
          <button class="btn primary sign" class:tut-target={s.tutorial.step === 'draft' && short === 0} disabled={short > 0} onclick={() => game.signDraft(p.id)}>
            <Icon name="user-plus" size={15} /> Sign {p.tag} · {money(pick.price)}
          </button>
        </div>
        <span class="bar" aria-hidden="true"><i style="width:{Math.min(100, (s.cash / pick.price) * 100)}%"></i></span>
      </div>
    </div>

    {#if editing}
      <div class="editor">
        <LookEditor look={p.look} compact onchange={(patch) => game.customiseDraft({ look: patch })} />
      </div>
    {/if}
  </section>
{/if}

<style>
  .first {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px;
    border-radius: 12px;
    border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--line));
    background: linear-gradient(160deg, color-mix(in srgb, var(--accent) 8%, transparent), transparent 60%), var(--bg-2);
  }
  header .section-title {
    margin: 0;
  }
  .small {
    font-size: 12.5px;
    margin: 2px 0 0;
  }
  .body {
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }
  .portrait {
    flex: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 8px 10px 10px;
    border-radius: 12px;
    border: 1px solid color-mix(in srgb, var(--rc) 40%, var(--line));
    background: radial-gradient(circle at 50% 35%, rgba(255, 255, 255, 0.07), rgba(0, 0, 0, 0.25));
  }
  .details {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .names {
    display: grid;
    grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr) minmax(0, 1fr);
    gap: 8px;
  }
  .names label {
    display: flex;
    flex-direction: column;
    gap: 3px;
    font-size: 11px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .names input {
    width: 100%;
    padding: 7px 9px;
    border-radius: 8px;
    border: 1px solid var(--line-2);
    background: var(--bg);
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 15px;
    letter-spacing: normal;
    text-transform: none;
    color: var(--text);
  }
  .names .tag input {
    font-size: 17px;
  }
  .names input:focus {
    outline: none;
    border-color: var(--accent);
  }
  .facts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
    font-size: 12.5px;
    color: var(--muted);
  }
  .facts b {
    font-family: var(--font-ui);
    font-size: 15px;
    color: var(--text);
  }
  .rarity {
    color: var(--rc);
    border-color: color-mix(in srgb, var(--rc) 50%, transparent);
  }
  .trait {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 1px 7px;
    border-radius: 999px;
    font-size: 11px;
    border: 1px solid var(--line-2);
  }
  .trait.good {
    color: var(--green);
  }
  .trait.bad {
    color: var(--red);
  }
  .trait.mixed {
    color: var(--gold);
  }
  .actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  .spacer {
    flex: 1;
  }
  .actions .small {
    margin: 0;
  }
  .sign {
    font-size: 15px;
  }
  .editor {
    padding-top: 10px;
    border-top: 1px solid var(--line);
  }
  @media (max-width: 640px) {
    .body {
      flex-direction: column;
      align-items: stretch;
    }
    .portrait {
      flex-direction: row;
      justify-content: center;
    }
    .names {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }
    .names .tag {
      grid-column: 1 / -1;
    }
  }
</style>
