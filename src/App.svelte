<script lang="ts">
  import { onMount } from 'svelte';
  import { money } from './engine/format';
  import ChoicePanel from './ui/components/ChoicePanel.svelte';
  import Coach from './ui/components/Coach.svelte';
  import DropLayer from './ui/components/DropLayer.svelte';
  import HypeChain from './ui/components/HypeChain.svelte';
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

<div class="app" class:reduced-motion={s.settings.reducedMotion} data-view={game.mobileView}>
  <TopBar />
  <Coach />
  <div class="columns">
    <aside class="col col-left"><ClickerPanel /></aside>
    <main class="col col-center"><CenterPanel /></main>
    <aside class="col col-right"><Store /></aside>
  </div>
  <MobileNav />
  <DropLayer />
  <HypeChain />
  <ChoicePanel />
  <TournamentModal />
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
  /* Between a laptop and a wide screen the side columns give ground so the centre stays readable. */
  @media (max-width: 1180px) {
    .columns {
      grid-template-columns: 250px minmax(0, 1fr) 300px;
    }
  }
  @media (max-width: 1023px) {
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
  /*
   * Tablets and small laptops: the clicker stays in a column on the left and the bottom bar switches
   * the right-hand side between Manage and Store, instead of blowing the clicker up to full screen.
   */
  @media (min-width: 768px) and (max-width: 1023px) {
    .columns {
      grid-template-columns: 240px minmax(0, 1fr);
    }
    .app .col-left,
    .app[data-view='clicker'] .col-center {
      display: block;
    }
  }
</style>
