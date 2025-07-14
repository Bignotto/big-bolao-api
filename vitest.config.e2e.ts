// vitest.config.e2e.ts
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ['src/http/**/*.{test,spec}.{js,ts}'],
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup-e2e.ts'],
    testTimeout: 30000, // Reduzido de 60000
    hookTimeout: 30000, // Reduzido de 60000
    teardownTimeout: 30000, // Reduzido de 60000
    maxConcurrency: 1,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
        isolate: true, // Adiciona isolamento
      },
    },
    // Configurações para evitar memory leaks
    maxWorkers: 1,
    minWorkers: 1,
    // Executa testes sequencialmente para evitar problemas de concorrência
    sequence: {
      concurrent: false,
      shuffle: false,
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/server.ts',
        'build/**',
        'node_modules/**',
      ],
    },
  },
});
