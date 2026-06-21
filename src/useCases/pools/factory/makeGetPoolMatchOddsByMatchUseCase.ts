import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { PrismaPredictionsRepository } from '@/repositories/predictions/PrismaPredictionsRepository';
import { PoolAuthorizationService } from '@/services/pools/PoolAuthorizationService';

import { GetPoolMatchOddsByMatchUseCase } from '../getPoolMatchOddsByMatchUseCase';

export function makeGetPoolMatchOddsByMatchUseCase(): GetPoolMatchOddsByMatchUseCase {
  const poolsRepository = new PrismaPoolsRepository();
  const predictionsRepository = new PrismaPredictionsRepository();
  const poolAuthorizationService = new PoolAuthorizationService(poolsRepository);

  return new GetPoolMatchOddsByMatchUseCase(
    poolsRepository,
    predictionsRepository,
    poolAuthorizationService
  );
}
