import { PrismaMatchesRepository } from '@/repositories/matches/PrismaMatchesRepository';
import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { PrismaPredictionsRepository } from '@/repositories/predictions/PrismaPredictionsRepository';
import { PoolAuthorizationService } from '@/services/pools/PoolAuthorizationService';

import { GetPoolMatchPredictionsUseCase } from '../getPoolMatchPredictionsUseCase';

export function makeGetPoolMatchPredictionsUseCase(): GetPoolMatchPredictionsUseCase {
  const predictionsRepository = new PrismaPredictionsRepository();
  const poolsRepository = new PrismaPoolsRepository();
  const matchesRepository = new PrismaMatchesRepository();
  const poolAuthorizationService = new PoolAuthorizationService(poolsRepository);

  return new GetPoolMatchPredictionsUseCase(
    predictionsRepository,
    poolsRepository,
    matchesRepository,
    poolAuthorizationService
  );
}
