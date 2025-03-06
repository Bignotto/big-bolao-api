import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environmentMatchGlobs: [['src/http/controllers/**', 'prisma']],
    coverage: {
      provider: 'v8',
      include: ['**/src/useCases/**/*'],
    },
    // reporters: ["default", "html"],
  },
});
