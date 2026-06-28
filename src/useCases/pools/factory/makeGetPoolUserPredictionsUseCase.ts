import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { PrismaPredictionsRepository } from '@/repositories/predictions/PrismaPredictionsRepository';
import { PoolAuthorizationService } from '@/services/pools/PoolAuthorizationService';

import { GetPoolUserPredictionsUseCase } from '../getPoolUserPredictionsUseCase';

export function makeGetPoolUserPredictionsUseCase(): GetPoolUserPredictionsUseCase {
  const predictionsRepository = new PrismaPredictionsRepository();
  const poolsRepository = new PrismaPoolsRepository();
  const poolAuthorizationService = new PoolAuthorizationService(poolsRepository);
  return new GetPoolUserPredictionsUseCase(
    predictionsRepository,
    poolsRepository,
    poolAuthorizationService
  );
}
