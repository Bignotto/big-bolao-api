import { PrismaClient } from '@prisma/client';

import { env } from '../env/config';

export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'dev' ? ['query'] : [],
});
