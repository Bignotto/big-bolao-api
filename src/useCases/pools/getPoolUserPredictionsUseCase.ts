import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { IPredictionsRepository, UserPredictionWithPoints } from '@/repositories/predictions/IPredictionsRepository';
import { PoolAuthorizationService } from '@/services/pools/PoolAuthorizationService';

interface GetPoolUserPredictionsUseCaseRequest {
  poolId: number;
  requesterId: string;
  targetUserId: string;
}

interface GetPoolUserPredictionsUseCaseResponse {
  predictions: UserPredictionWithPoints[];
}

export class GetPoolUserPredictionsUseCase {
  constructor(
    private predictionsRepository: IPredictionsRepository,
    private poolsRepository: IPoolsRepository,
    private poolAuthorizationService: PoolAuthorizationService
  ) {}

  async execute({
    poolId,
    requesterId,
    targetUserId,
  }: GetPoolUserPredictionsUseCaseRequest): Promise<GetPoolUserPredictionsUseCaseResponse> {
    const pool = await this.poolsRepository.findById(poolId);

    if (!pool) {
      throw new ResourceNotFoundError('Pool not found');
    }

    await this.poolAuthorizationService.validateUserPoolAccess(poolId, requesterId, pool.creatorId);

    const participants = await this.poolsRepository.getPoolParticipants(poolId);
    const targetIsParticipant =
      participants.some((p) => p.id === targetUserId) || pool.creatorId === targetUserId;

    if (!targetIsParticipant) {
      throw new ResourceNotFoundError('User not found in pool');
    }

    const predictions = await this.predictionsRepository.findCompletedWithPointsByUserAndPool(
      targetUserId,
      poolId
    );

    return { predictions };
  }
}
