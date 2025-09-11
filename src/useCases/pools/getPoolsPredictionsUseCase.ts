import { Prediction } from '@prisma/client';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { IPredictionsRepository } from '@/repositories/predictions/IPredictionsRepository';
import { PoolAuthorizationService } from '@/services/pools/PoolAuthorizationService';

interface GetPoolPredictionsUseCaseRequest {
  poolId: number;
  userId: string;
}

interface GetPoolPredictionsUseCaseResponse {
  predictions: Prediction[];
}

export class GetPoolPredictionsUseCase {
  constructor(
    private predictionsRepository: IPredictionsRepository,
    private poolsRepository: IPoolsRepository,
    private poolAuthorizationService: PoolAuthorizationService
  ) {}

  async execute({
    poolId,
    userId,
  }: GetPoolPredictionsUseCaseRequest): Promise<GetPoolPredictionsUseCaseResponse> {
    // Check if pool exists
    const pool = await this.poolsRepository.findById(poolId);

    if (!pool) {
      throw new ResourceNotFoundError('Pool not found');
    }

    // Validate user has access to the pool
    await this.poolAuthorizationService.validateUserPoolAccess(poolId, userId, pool.creatorId);

    // Get all predictions for the pool
    const predictions = await this.predictionsRepository.findByPoolId(poolId);

    return {
      predictions,
    };
  }
}
