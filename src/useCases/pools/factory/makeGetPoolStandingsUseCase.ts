import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { PoolAuthorizationService } from '@/services/pools/PoolAuthorizationService';

import { GetPoolStandingsUseCase } from '../getPoolStandingsUseCase';

export function makeGetPoolStandingsUseCase(): GetPoolStandingsUseCase {
  const poolsRepository = new PrismaPoolsRepository();
  const poolAuthorizationService = new PoolAuthorizationService(poolsRepository);
  const getPoolStandingsUseCase = new GetPoolStandingsUseCase(
    poolsRepository,
    poolAuthorizationService
  );

  return getPoolStandingsUseCase;
}
