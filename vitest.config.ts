// vitest.config.ts
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ['src/useCases/**/*.{test,spec}.{js,ts}'],
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/useCases/**/*.ts'],
      exclude: ['src/useCases/**/*.test.ts', 'src/useCases/**/*.spec.ts', 'node_modules/**'],
    },
  },
});
