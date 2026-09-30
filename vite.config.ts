import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  // Relative base so the build works from GitHub Pages (/esportsidle/) or any static host.
  base: './',
  plugins: [svelte()],
  test: {
    environment: 'node',
    projects: [
      // `npm test`: fast unit and invariant tests.
      { extends: true, test: { name: 'unit', include: ['tests/**/*.test.ts'], exclude: ['tests/slow/**'] } },
      // `npm run test:slow`: suites built on big saves or long simulations.
      { extends: true, test: { name: 'slow', include: ['tests/slow/**/*.test.ts'], testTimeout: 120_000 } },
    ],
  },
});
