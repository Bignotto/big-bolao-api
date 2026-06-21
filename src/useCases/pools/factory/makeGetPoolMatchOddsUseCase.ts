import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { PrismaPredictionsRepository } from '@/repositories/predictions/PrismaPredictionsRepository';
import { PoolAuthorizationService } from '@/services/pools/PoolAuthorizationService';

import { GetPoolMatchOddsUseCase } from '../getPoolMatchOddsUseCase';

export function makeGetPoolMatchOddsUseCase(): GetPoolMatchOddsUseCase {
  const poolsRepository = new PrismaPoolsRepository();
  const predictionsRepository = new PrismaPredictionsRepository();
  const poolAuthorizationService = new PoolAuthorizationService(poolsRepository);

  return new GetPoolMatchOddsUseCase(poolsRepository, predictionsRepository, poolAuthorizationService);
}
