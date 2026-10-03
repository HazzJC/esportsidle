<script lang="ts">
  import { QUESTS, QUEST_MAP, type QuestDef, type QuestReward } from '../../data/quests';
  import { fmt } from '../../engine/format';
  import { describeReward, nextQuest, questPerkSources, questProgress, rewardDetail } from '../../engine/quests';
  import { tooltip } from '../tooltip.svelte';
  import { game } from '../game.svelte';
  import { questColor, questEmblemSvg, rewardArtSvg } from '../questArt';
  import Icon from './Icon.svelte';

  /** Cells in the screen's progress meter. */
  const SEGMENTS = 24;
  /** A perk claimed this recently (simulated seconds) flickers on as its niche lights. */
  const FRESH_SECONDS = 6;

  const v = $derived(game.view);
  const s = $derived(v.s);
  const ctx = $derived({ cps: v.r.cpsNoBuffs, fansPerSec: v.r.fansPerSec, state: s });
  const doneCount = $derived(QUESTS.filter((q) => s.quests.done[q.id] !== undefined).length);
  const perks = $derived(questPerkSources(s));
  const upNext = $derived(nextQuest(s));
  /** One lamp per quest in the line: lit when done, pulsing while live, dark still to come. */
  const rail = $derived.by(() => {
    const active = new Set(s.quests.active.map((q) => q.id));
    return QUESTS.map((q, i) => ({
      def: q,
      n: i + 1,
      state: s.quests.done[q.id] !== undefined ? 'done' : active.has(q.id) ? 'live' : 'ahead',
    }));
  });

</script>

<!-- Every drawing below comes from ui/questArt.ts, built from constants only, so {@html} is safe. -->
{#snippet rewardBody(r: QuestReward, def: QuestDef)}
  <span class="kicon">{@html rewardArtSvg(r, def)}</span>
  <span class="ktext">
    <b>{describeReward(r, ctx)}</b>
    <span class="kdetail">{rewardDetail(r, ctx)}</span>
  </span>
{/snippet}

{#if s.tutorial.step === 'done' && (s.quests.active.length > 0 || doneCount < QUESTS.length)}
  <section class="console" aria-label="Quests">
    <span class="screw tl"></span><span class="screw tr"></span><span class="screw bl"></span><span class="screw br"></span>

    <header class="faceplate">
      <h3 class="plate">Quests</h3>
      <span
        class="lcd num"
        use:tooltip={() => ({ title: 'The quest line', icon: 'flag', lines: [`${doneCount} of ${QUESTS.length} done this run.`, { text: 'Follow it in order. Perks last for the rest of this run.', tone: 'muted' }] })}
        aria-label="{doneCount} of {QUESTS.length} quests done">{String(doneCount).padStart(2, '0')}<i>/</i>{QUESTS.length}</span
      >
      <ol class="rail" aria-label="The quest line">
        {#each rail as step (step.def.id)}
          <li
            class="led {step.state}"
            aria-label="{step.n}. {step.def.title}: {step.state === 'done' ? 'done' : step.state === 'live' ? 'in progress' : 'still to come'}"
            use:tooltip={() => ({ title: `${step.n}. ${step.def.title}`, icon: step.def.icon, lines: [step.def.desc, step.state === 'done' ? { text: 'Done', tone: 'good' as const } : step.state === 'live' ? { text: 'In progress', tone: 'gold' as const } : { text: 'Still to come', tone: 'muted' as const }] })}
          ></li>
        {/each}
      </ol>
    </header>

    {#each s.quests.active as q (q.id)}
      {@const def = QUEST_MAP.get(q.id)}
      {@const p = questProgress(s, q)}
      {#if def}
        {@const choice = def.rewards.length > 1}
        {@const lit = Math.round(Math.min(1, p.value / p.target) * SEGMENTS)}
        <div class="deck" class:complete={p.complete}>
          <div class="bezel">
            <div class="screen">
              <div class="sline">
                <span class="sicon" style="--c:{questColor(def.id)}">{@html questEmblemSvg(def)}</span>
                <b class="stitle">{def.title}</b>
                {#if p.complete}
                  <span class="readout ready">Ready</span>
                {:else if p.target > 1}
                  <span class="readout num">{fmt(p.value)}/{fmt(p.target)}</span>
                {/if}
              </div>
              <p class="sdesc">{def.desc}</p>
              <span class="meter" aria-hidden="true">
                {#each { length: SEGMENTS } as _, i (i)}<i class:on={p.complete || i < lit}></i>{/each}
              </span>
              {#if upNext && upNext.id !== def.id}<span class="snext">Next <Icon name="chevron-right" size={11} /> {upNext.title}</span>{/if}
            </div>
          </div>

          <div class="keys">
            <span class="engrave">{p.complete ? (choice ? 'Press one to claim' : 'Press to claim') : choice ? 'Reward · pick one' : 'Reward'}</span>
            {#each def.rewards as r, i (i)}
              {#if p.complete}
                <button class="key ready" onclick={() => game.claimQuest(def.id, i)}>
                  {@render rewardBody(r, def)}
                  <span class="take">{choice ? 'Take' : 'Claim'}</span>
                </button>
              {:else}
                <div class="key">{@render rewardBody(r, def)}</div>
              {/if}
            {/each}
          </div>
        </div>
      {/if}
    {/each}

    {#if s.quests.active.length === 0}
      <div class="bezel">
        <div class="screen standby">
          <Icon name="clock" size={16} />
          <span>{upNext ? `Next: ${upNext.title}. It opens as your org grows.` : 'More quests appear as your org grows.'}</span>
        </div>
      </div>
    {/if}

    {#if perks.length > 0}
      <div class="perks">
        <span class="engrave"><Icon name="sparkles" size={11} /> Run perks · {perks.length}</span>
        <ul class="shelf">
          {#each perks as perk, i (i)}
            {@const def = QUEST_MAP.get(perk.id)}
            <li
              class="plaque"
              class:fresh={s.time - perk.claimedAt < FRESH_SECONDS}
              style="--c:{questColor(perk.id)}"
              use:tooltip={() => ({
                title: perk.label,
                icon: perk.icon,
                iconColor: questColor(perk.id),
                lines: [`From the quest “${perk.quest}”.`, { text: 'Lasts until you sell the org.', tone: 'muted' }],
              })}
            >
              <span class="niche">{#if def}{@html questEmblemSvg(def)}{/if}</span>
              <span class="ptext">
                <b>{perk.label}</b>
                <span class="from">{perk.quest}</span>
              </span>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </section>
{/if}

<style>
  /* The quest board as a piece of kit on the HQ desk: a brushed-metal console with a lamp rail for the
     quest line, a CRT for the live quest, hardware keys for its rewards and a trophy shelf of perks. */
  .console {
    --metal-hi: color-mix(in srgb, var(--accent) 5%, #2c2d32);
    --metal-lo: color-mix(in srgb, var(--accent) 3%, #18191c);
    --well: #070709;
    container-type: inline-size;
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    max-width: 760px;
    margin-inline: auto;
    padding: 10px 16px 14px;
    border-radius: 14px;
    border: 1px solid #000;
    background:
      repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.014) 0 1px, transparent 1px 3px),
      linear-gradient(180deg, var(--metal-hi), var(--metal-lo));
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.13),
      inset 0 -2px 0 rgba(0, 0, 0, 0.5),
      0 1px 0 rgba(255, 255, 255, 0.04),
      0 8px 22px rgba(0, 0, 0, 0.45);
  }
  .screw {
    position: absolute;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background:
      linear-gradient(var(--tilt, 45deg), transparent 42%, rgba(0, 0, 0, 0.75) 42% 58%, transparent 58%),
      radial-gradient(circle at 35% 30%, #9b9ea6, #45474e 60%, #1b1c20);
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 0 0 0.5px rgba(0, 0, 0, 0.6);
  }
  .screw.tl {
    top: 6px;
    left: 6px;
  }
  .screw.tr {
    top: 6px;
    right: 6px;
    --tilt: 120deg;
  }
  .screw.bl {
    bottom: 6px;
    left: 6px;
    --tilt: 80deg;
  }
  .screw.br {
    bottom: 6px;
    right: 6px;
    --tilt: 20deg;
  }

  /* Lettering stamped into the metal: dark above, a highlight below. */
  .plate,
  .engrave {
    font-family: var(--font-display);
    font-weight: 700;
    text-transform: uppercase;
    color: #8d9097;
    text-shadow:
      0 -1px 0 rgba(0, 0, 0, 0.7),
      0 1px 0 rgba(255, 255, 255, 0.07);
  }
  .engrave {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 9.5px;
    letter-spacing: 0.16em;
  }

  .faceplate {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px 10px;
  }
  .plate {
    margin: 0;
    font-size: 13px;
    letter-spacing: 0.18em;
  }
  /* A little backlit LCD counter. */
  .lcd {
    padding: 1px 7px;
    border-radius: 4px;
    border: 1px solid #000;
    background: linear-gradient(180deg, #050607, color-mix(in srgb, var(--accent) 10%, #0a0c0d));
    box-shadow:
      inset 0 1px 3px rgba(0, 0, 0, 0.9),
      0 1px 0 rgba(255, 255, 255, 0.07);
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 13px;
    letter-spacing: 0.06em;
    color: color-mix(in srgb, var(--accent) 70%, #fff);
    text-shadow: 0 0 6px color-mix(in srgb, var(--accent) 70%, transparent);
    cursor: help;
  }
  .lcd i {
    font-style: normal;
    opacity: 0.5;
    margin: 0 1px;
  }
  /* The quest line as a slot of lamps, one per quest. */
  .rail {
    display: flex;
    align-items: center;
    gap: 4px;
    margin: 0 0 0 auto;
    padding: 4px 7px;
    list-style: none;
    border-radius: 999px;
    background: var(--well);
    box-shadow:
      inset 0 1px 3px rgba(0, 0, 0, 0.9),
      0 1px 0 rgba(255, 255, 255, 0.07);
  }
  .led {
    flex: none;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    cursor: help;
    background: radial-gradient(circle at 35% 30%, #4b4d54, #1d1e22 70%);
    box-shadow: inset 0 -1px 1px rgba(0, 0, 0, 0.6);
  }
  .led.done {
    background: radial-gradient(circle at 35% 30%, #fff6d4, var(--gold) 45%, #8d600c);
    box-shadow: 0 0 6px color-mix(in srgb, var(--gold) 70%, transparent);
  }
  .led.live {
    background: radial-gradient(circle at 35% 30%, #fff, var(--accent) 45%, color-mix(in srgb, var(--accent) 45%, #000));
    box-shadow: 0 0 8px var(--accent);
    animation: blink 1.4s ease-in-out infinite;
  }

  /* Screen on the left, reward keys on the right; stacked when the console is narrow. */
  .deck {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(200px, 250px);
    gap: 12px;
    align-items: stretch;
  }
  @container (max-width: 540px) {
    .deck {
      grid-template-columns: minmax(0, 1fr);
      gap: 10px;
    }
    .rail {
      margin-left: 0;
    }
  }
  .bezel {
    padding: 5px;
    border-radius: 12px;
    background: linear-gradient(180deg, #0c0c0e, #1f2024);
    box-shadow:
      inset 0 1px 2px rgba(0, 0, 0, 0.8),
      0 1px 0 rgba(255, 255, 255, 0.08);
  }
  /* The glass: a phosphor glow in the interface tone, scanlines, and a glare across the top. */
  .screen {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 6px;
    height: 100%;
    padding: 9px 12px 10px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #000;
    color: color-mix(in srgb, var(--accent) 35%, #c9cdd0);
    background: radial-gradient(130% 150% at 50% 0%, color-mix(in srgb, var(--accent) 15%, #07090a), #030405 78%);
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, var(--accent) 10%, transparent),
      inset 0 0 22px rgba(0, 0, 0, 0.75);
  }
  .screen::before,
  .screen::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .screen::before {
    background: repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.22) 0 1px, transparent 1px 3px);
  }
  .screen::after {
    background: linear-gradient(165deg, rgba(255, 255, 255, 0.075), transparent 38%);
  }
  .sline {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  /* The quest's emblem on the screen, on a lit pad in its colour. */
  .sicon {
    flex: none;
    width: 38px;
    height: 38px;
    padding: 2px;
    border-radius: 7px;
    border: 1px solid color-mix(in srgb, var(--c) 35%, transparent);
    background: radial-gradient(70% 60% at 50% 85%, color-mix(in srgb, var(--c) 30%, transparent), transparent 75%);
  }
  .stitle {
    flex: 1;
    min-width: 0;
    font-family: var(--font-ui);
    font-size: 16px;
    letter-spacing: 0.02em;
    color: color-mix(in srgb, var(--accent) 22%, #fff);
    text-shadow: 0 0 8px color-mix(in srgb, var(--accent) 45%, transparent);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .readout {
    flex: none;
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 14px;
    letter-spacing: 0.06em;
    color: var(--accent);
    text-shadow: 0 0 8px color-mix(in srgb, var(--accent) 60%, transparent);
  }
  .readout.ready {
    font-family: var(--font-display);
    font-size: 10.5px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--gold);
    text-shadow: 0 0 8px color-mix(in srgb, var(--gold) 70%, transparent);
    animation: blink 1.1s steps(2, jump-none) infinite;
  }
  .sdesc {
    margin: 0;
    font-size: 12.5px;
    line-height: 1.35;
  }
  /* A segmented meter, like a level display: cells light up as the quest fills. */
  .meter {
    display: flex;
    gap: 2px;
    margin-top: auto;
    padding-top: 2px;
  }
  .meter i {
    flex: 1;
    height: 7px;
    border-radius: 1px;
    background: color-mix(in srgb, var(--accent) 9%, #101214);
  }
  .meter i.on {
    background: var(--accent);
    box-shadow: 0 0 5px color-mix(in srgb, var(--accent) 65%, transparent);
  }
  .deck.complete .meter i.on {
    background: var(--gold);
    box-shadow: 0 0 5px color-mix(in srgb, var(--gold) 65%, transparent);
  }
  .snext {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 10.5px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--accent) 30%, #6f7377);
  }
  .screen.standby {
    flex-direction: row;
    align-items: center;
    gap: 8px;
    font-size: 12.5px;
  }

  /* Reward keys: chunky caps that sit proud of the panel and press down when they can be claimed. */
  .keys {
    display: flex;
    flex-direction: column;
    gap: 7px;
    min-width: 0;
  }
  .keys .engrave {
    margin-bottom: -1px;
  }
  .key {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
    padding: 7px 9px;
    border-radius: 9px;
    border: 1px solid #000;
    color: var(--text);
    text-align: left;
    background: linear-gradient(180deg, #33353b, #222328);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.11),
      inset 0 -1px 0 rgba(0, 0, 0, 0.45),
      0 3px 0 #0a0a0c,
      0 4px 8px rgba(0, 0, 0, 0.45);
    transition:
      transform 0.06s,
      box-shadow 0.06s;
  }
  /* Not claimable yet: the cap is unlit, its legend shows what it will pay. */
  div.key {
    opacity: 0.82;
  }
  .key.ready {
    cursor: pointer;
    background: linear-gradient(180deg, color-mix(in srgb, var(--gold) 30%, #3a3426), color-mix(in srgb, var(--gold) 13%, #1e1a11));
    box-shadow:
      inset 0 1px 0 color-mix(in srgb, var(--gold) 45%, transparent),
      inset 0 -1px 0 rgba(0, 0, 0, 0.45),
      0 3px 0 color-mix(in srgb, var(--gold) 25%, #0a0a0c),
      0 4px 14px color-mix(in srgb, var(--gold) 22%, transparent);
  }
  .key.ready:hover {
    background: linear-gradient(180deg, color-mix(in srgb, var(--gold) 40%, #3a3426), color-mix(in srgb, var(--gold) 18%, #1e1a11));
  }
  .key.ready:active {
    transform: translateY(2px);
    box-shadow:
      inset 0 1px 0 color-mix(in srgb, var(--gold) 35%, transparent),
      inset 0 -1px 0 rgba(0, 0, 0, 0.45),
      0 1px 0 color-mix(in srgb, var(--gold) 25%, #0a0a0c),
      0 2px 6px color-mix(in srgb, var(--gold) 18%, transparent);
  }
  .kicon {
    flex: none;
    width: 34px;
    height: 34px;
    padding: 2px;
    border-radius: 6px;
    background: #0d0d0f;
    box-shadow:
      inset 0 1px 2px rgba(0, 0, 0, 0.9),
      0 1px 0 rgba(255, 255, 255, 0.06);
  }
  .ktext {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .ktext b {
    font-family: var(--font-ui);
    font-size: 13.5px;
    line-height: 1.2;
  }
  .kdetail {
    font-size: 11px;
    line-height: 1.25;
    color: var(--muted);
  }
  .take {
    flex: none;
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--gold);
    color: #1a1406;
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 12px;
    box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.25);
  }

  /* Perks as a trophy shelf: a recessed tray of plaques, each with its quest's emblem lit in a niche. */
  .perks {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-top: 10px;
    border-top: 1px solid rgba(0, 0, 0, 0.55);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }
  .perks .engrave :global(svg) {
    color: color-mix(in srgb, var(--gold) 60%, #8d9097);
  }
  .shelf {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(196px, 1fr));
    gap: 6px;
    margin: 0;
    padding: 6px;
    list-style: none;
    border-radius: 9px;
    background: var(--well);
    box-shadow:
      inset 0 1px 4px rgba(0, 0, 0, 0.9),
      0 1px 0 rgba(255, 255, 255, 0.07);
  }
  .plaque {
    display: flex;
    align-items: center;
    gap: 9px;
    min-width: 0;
    padding: 3px 10px 3px 3px;
    border-radius: 8px;
    border: 1px solid #000;
    background: linear-gradient(180deg, #2b2c31, #1b1c20);
    box-shadow:
      inset 0 1px 0 color-mix(in srgb, var(--c) 30%, rgba(255, 255, 255, 0.08)),
      inset 0 -1px 0 rgba(0, 0, 0, 0.45),
      0 2px 0 #050506;
    cursor: help;
  }
  .plaque:hover {
    background: linear-gradient(180deg, #313238, #1f2024);
  }
  /* The niche the emblem stands in, lit from below in the quest's colour. */
  .niche {
    flex: none;
    width: 38px;
    height: 38px;
    padding: 2px;
    border-radius: 6px;
    background:
      radial-gradient(70% 60% at 50% 85%, color-mix(in srgb, var(--c) 35%, transparent), transparent 75%),
      #0b0b0d;
    box-shadow:
      inset 0 2px 4px rgba(0, 0, 0, 0.9),
      inset 0 -1px 0 color-mix(in srgb, var(--c) 35%, transparent),
      0 1px 0 rgba(255, 255, 255, 0.06);
  }
  .niche :global(svg),
  .sicon :global(svg),
  .kicon :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
  }
  .ptext {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .ptext b {
    font-family: var(--font-ui);
    font-size: 13px;
    line-height: 1.15;
    color: var(--text);
  }
  .from {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--c) 55%, #8d9097);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .plaque.fresh .niche {
    animation: lamp-on 0.9s ease-out;
  }

  @keyframes blink {
    50% {
      opacity: 0.45;
    }
  }
  @keyframes lamp-on {
    0%,
    20%,
    40% {
      filter: brightness(0.35);
    }
    10%,
    30% {
      filter: brightness(1.4);
    }
    100% {
      filter: none;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .led.live,
    .readout.ready,
    .plaque.fresh .niche {
      animation: none;
    }
  }
  @media (max-width: 520px) {
    .console {
      padding: 10px 12px 12px;
    }
    .shelf {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 5px;
      padding: 5px;
    }
    .plaque {
      gap: 6px;
      padding-right: 6px;
    }
    .niche {
      width: 32px;
      height: 32px;
    }
    .ptext b {
      font-size: 12px;
    }
    .from {
      display: none;
    }
  }
</style>
