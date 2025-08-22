import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';

import { ListPublicPoolsUseCase } from '../listPublicPoolsUseCase';

export function makeListPublicPoolsUseCase() {
  const poolsRepository = new PrismaPoolsRepository();
  return new ListPublicPoolsUseCase(poolsRepository);
}
