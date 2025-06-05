import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { PrismaPredictionsRepository } from '@/repositories/predictions/PrismaPredictionsRepository';
import { GetPoolPredictionsUseCase } from '../getPoolsPredictionsUseCase';

export function makeGetPoolPredictionsUseCase() {
  const predictionsRepository = new PrismaPredictionsRepository();
  const poolsRepository = new PrismaPoolsRepository();
  const useCase = new GetPoolPredictionsUseCase(predictionsRepository, poolsRepository);

  return useCase;
}
