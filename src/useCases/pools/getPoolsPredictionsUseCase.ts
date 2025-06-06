import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { IPredictionsRepository } from '@/repositories/predictions/IPredictionsRepository';
import { Prediction } from '@prisma/client';
import { NotParticipantError } from './errors/NotParticipantError';

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
    private poolsRepository: IPoolsRepository
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

    // Check if user is the creator or a participant in the pool
    const participants = await this.poolsRepository.getPoolParticipants(poolId);
    const isParticipant = participants.some((participant) => participant.userId === userId);
    const isCreator = pool.creatorId === userId;

    if (!isParticipant && !isCreator) {
      throw new NotParticipantError('You must be a participant in this pool to view predictions');
    }
    // Get all predictions for the pool
    const predictions = await this.predictionsRepository.findByPoolId(poolId);

    return {
      predictions,
    };
  }
}
