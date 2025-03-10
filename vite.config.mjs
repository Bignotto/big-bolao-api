import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    workspace: [
      {
        test: {
          name: 'controllers',
          include: ['src/http/controllers/**'],
          environment: 'prisma',
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['**/src/useCases/**/*'],
    },
  },
});
