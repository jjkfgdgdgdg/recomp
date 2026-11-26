import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Chemins relatifs : l'appli marche dans n'importe quel sous-dossier (GitHub Pages, Netlify…)
  base: './',
  oxc: {
    jsx: { runtime: 'automatic', importSource: 'preact' },
  },
  build: {
    target: 'es2022',
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
