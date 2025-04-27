import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { GetPoolStandingsUseCase } from '../getPoolStandingsUseCase';

export function makeGetPoolStandingsUseCase() {
  const poolsRepository = new PrismaPoolsRepository();
  const useCase = new GetPoolStandingsUseCase(poolsRepository);

  return useCase;
}
