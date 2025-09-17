import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';

import { ListPublicPoolsUseCase } from '../listPublicPoolsUseCase';

export function makeListPublicPoolsUseCase(): ListPublicPoolsUseCase {
  const poolsRepository = new PrismaPoolsRepository();
  return new ListPublicPoolsUseCase(poolsRepository);
}
