import { mount } from 'svelte';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/rajdhani/500.css';
import '@fontsource/rajdhani/700.css';
import '@fontsource/orbitron/700.css';
import '@fontsource/orbitron/900.css';
import './styles/global.css';
import App from './App.svelte';
import { game } from './ui/game.svelte';
import { applyTone } from './ui/tone';

// Apply the saved tone before the first paint so the interface never flashes the default.
applyTone(game.state.settings.uiAccent);

const app = mount(App, { target: document.getElementById('app')! });

if (import.meta.env.DEV) {
  const w = window as unknown as Record<string, unknown>;
  w.__esi = game;
  // Dev-only hooks for forcing events while testing.
  void Promise.all([import('./engine/drops'), import('./engine/worldEvents'), import('./engine/economy'), import('./engine/rng')]).then(
    ([drops, events, economy, rng]) => {
      const ctx = () => {
        const mods = economy.computeMods(game.state);
        return { rng: new rng.Rng(game.state), mods, rates: economy.computeRates(game.state, mods) };
      };
      w.__esiDev = {
        outcome: (id: string) => {
          const r = drops.applyDropOutcome(game.state, id, ctx());
          game.refresh();
          return r;
        },
        event: (id: string) => {
          const ok = events.fireEvent(game.state, id, ctx());
          game.refresh();
          return ok;
        },
        spawnDrop: () => {
          drops.spawnDrop(game.state, ctx());
          game.refresh();
        },
      };
    },
  );
}

export default app;
