import { execSync } from 'node:child_process';

import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach } from 'vitest';

let prisma: PrismaClient;

beforeAll(() => {
  try {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set. Make sure .env.test exists and is loaded.');
    }

    const isLocal =
      databaseUrl.includes('localhost') ||
      databaseUrl.includes('127.0.0.1') ||
      /192\.168\.\d+\.\d+/.test(databaseUrl) ||
      /10\.\d+\.\d+\.\d+/.test(databaseUrl) ||
      /172\.(1[6-9]|2\d|3[01])\.\d+\.\d+/.test(databaseUrl);

    if (!isLocal) {
      throw new Error(
        `Refusing to reset a non-local database: ${databaseUrl}\n` +
          'E2E tests must run against a local database. Check your .env.test file.'
      );
    }

    const execOptions = {
      stdio: 'pipe',
      env: { ...process.env, DATABASE_URL: databaseUrl },
    } satisfies Parameters<typeof execSync>[1];

    execSync('npx prisma db push --force-reset --skip-generate', execOptions);

    execSync(
      'npx prisma db execute --file ./prisma/migrations/20250420092255_add_pool_standings_views/migration.sql',
      execOptions
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
