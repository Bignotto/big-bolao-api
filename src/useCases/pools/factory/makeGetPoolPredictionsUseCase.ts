import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { PrismaPredictionsRepository } from '@/repositories/predictions/PrismaPredictionsRepository';
import { PoolAuthorizationService } from '@/services/pools/PoolAuthorizationService';

import { GetPoolPredictionsUseCase } from '../getPoolsPredictionsUseCase';

export function makeGetPoolPredictionsUseCase() {
  const predictionsRepository = new PrismaPredictionsRepository();
  const poolsRepository = new PrismaPoolsRepository();
  const poolAuthorizationService = new PoolAuthorizationService(poolsRepository);
  const useCase = new GetPoolPredictionsUseCase(
    predictionsRepository,
    poolsRepository,
    poolAuthorizationService
  );
  return useCase;
}
