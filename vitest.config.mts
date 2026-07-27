import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// esbuild's automatic JSX runtime — no React import needed, and avoids pulling in
// the ESM-only @vitejs/plugin-react (this project is CommonJS). Tests don't need
// fast-refresh, so plain esbuild transform is enough.
export default defineConfig({
  esbuild: { jsx: 'automatic' },
  resolve: {
    // mirror tsconfig "@/*": ["./*"] so components using the alias resolve under test
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', '.next/**'],
  },
});
