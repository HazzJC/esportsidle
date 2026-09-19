<script lang="ts">
  import { onMount } from 'svelte';
  import { money } from './engine/format';
  import ChoicePanel from './ui/components/ChoicePanel.svelte';
  import Coach from './ui/components/Coach.svelte';
  import DropLayer from './ui/components/DropLayer.svelte';
  import Onboarding from './ui/components/Onboarding.svelte';
  import Toasts from './ui/components/Toasts.svelte';
  import TournamentModal from './ui/components/TournamentModal.svelte';
  import Tooltip from './ui/components/Tooltip.svelte';
  import WelcomeBack from './ui/components/WelcomeBack.svelte';
  import { game } from './ui/game.svelte';
  import { applyTone } from './ui/tone';
  import CenterPanel from './ui/layout/CenterPanel.svelte';
  import ClickerPanel from './ui/layout/ClickerPanel.svelte';
  import MobileNav from './ui/layout/MobileNav.svelte';
  import Store from './ui/layout/Store.svelte';
  import TopBar from './ui/layout/TopBar.svelte';

  onMount(() => {
    game.start();
    return () => game.stop();
  });

  const s = $derived(game.view.s);

  $effect(() => applyTone(s.settings.uiAccent));

  $effect(() => {
    document.title = `${money(s.cash)} · Esports Idle`;
  });
</script>

<div class="app" class:reduced-motion={s.settings.reducedMotion} class:tutoring={s.settings.onboarded && s.tutorial.step !== 'done'} data-view={game.mobileView}>
  <TopBar />
  <div class="columns">
    <aside class="col col-left"><ClickerPanel /></aside>
    <main class="col col-center"><CenterPanel /></main>
    <aside class="col col-right"><Store /></aside>
  </div>
  <MobileNav />
  <DropLayer />
  <ChoicePanel />
  <TournamentModal />
  <Coach />
  <Toasts />
  <Tooltip />
  {#if !s.settings.onboarded}
    <Onboarding />
  {:else if game.offlineReport}
    <WelcomeBack />
  {/if}
</div>

<style>
  .app {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
  }
  .columns {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(270px, 320px) minmax(0, 1fr) minmax(310px, 380px);
    gap: 8px;
  }
  .col {
    min-height: 0;
    min-width: 0;
  }
  /* The tutorial coach floats over the bottom of the screen; let scrolling content clear it. */
  .tutoring :global(.center .body),
  .tutoring :global(.op-list) {
    padding-bottom: 190px;
  }
  @media (max-width: 860px) {
    .tutoring :global(.center .body),
    .tutoring :global(.op-list) {
      padding-bottom: 70px;
    }
  }
  @media (max-width: 1100px) {
    .columns {
      grid-template-columns: 270px minmax(0, 1fr) 320px;
    }
  }
  @media (max-width: 860px) {
    .app {
      padding-bottom: 72px;
    }
    .columns {
      grid-template-columns: minmax(0, 1fr);
    }
    .col {
      display: none;
    }
    .app[data-view='clicker'] .col-left,
    .app[data-view='center'] .col-center,
    .app[data-view='store'] .col-right {
      display: block;
    }
  }
</style>
