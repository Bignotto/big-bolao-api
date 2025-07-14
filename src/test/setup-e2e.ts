import { execSync } from 'node:child_process';

import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach } from 'vitest';

let prisma: PrismaClient;

beforeAll(() => {
  try {
    // Use db push instead of migrate deploy for tests
    // This pushes the schema without using migration history
    execSync('npx prisma db push --force-reset', {
      stdio: 'inherit',
    });

    // Initialize Prisma client
    prisma = new PrismaClient();

    console.log(`✅ Test database setup complete`);
  } catch (error) {
    console.error('❌ Failed to setup test database:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    await prisma.$disconnect();
    console.log(`✅ Test database cleanup complete`);
  } catch (error) {
    console.error('❌ Failed to cleanup test database:', error);
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
