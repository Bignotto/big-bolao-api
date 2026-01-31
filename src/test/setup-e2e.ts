import { execSync } from 'node:child_process';

import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach } from 'vitest';

let prisma: PrismaClient;

beforeAll(() => {
  try {
    // Use db push instead of migrate deploy for tests
    // This pushes the schema without using migration history
    execSync('npx prisma db push --force-reset --skip-generate', {
      stdio: 'inherit',
    });

    // Executa o script SQL para criar as views
    execSync(
      'npx prisma db execute --file ./prisma/migrations/20250420092255_add_pool_standings_views/migration.sql',
      {
        stdio: 'inherit',
      }
    );

    // Initialize Prisma client
    prisma = new PrismaClient();

    process.stdout.write(`✅ Test database setup complete\n`);
  } catch (error) {
    process.stderr.write(`❌ Failed to setup test database: ${String(error)}\n`);
    throw error;
  }
});

afterAll(async () => {
  try {
    await prisma.$disconnect();
    process.stdout.write(`✅ Test database cleanup complete\n`);
  } catch (error) {
    process.stderr.write(`❌ Failed to cleanup test database: ${String(error)}\n`);
  }
});

beforeEach(async () => {
  // try {
  //   // Get all tables and truncate them
  //   const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
  //     SELECT tablename
  //     FROM pg_tables
  //     WHERE schemaname = 'public'
  //     AND tablename NOT LIKE '_prisma%'
  //   `;
  //   for (const table of tables) {
  //     await prisma.$executeRawUnsafe(
  //       `TRUNCATE TABLE "${table.tablename}" RESTART IDENTITY CASCADE`
  //     );
  //   }
  // } catch (error) {
  //   console.error('❌ Failed to clean database before test:', error);
  // }
});

export { prisma };
