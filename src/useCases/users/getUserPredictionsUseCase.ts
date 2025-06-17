import { NotParticipantError } from '@/global/errors/NotParticipantError';
import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { IPredictionsRepository } from '@/repositories/predictions/IPredictionsRepository';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';
import { Prediction } from '@prisma/client';

interface GetUserPredictionsUseCaseRequest {
  userId: string;
  poolId?: number;
}

interface GetUserPredictionsUseCaseResponse {
  predictions: Prediction[];
}

export class GetUserPredictionsUseCase {
  constructor(
    private predictionsRepository: IPredictionsRepository,
    private usersRepository: IUsersRepository,
    private poolsRepository: IPoolsRepository
  ) {}

  async execute({
    userId,
    poolId,
  }: GetUserPredictionsUseCaseRequest): Promise<GetUserPredictionsUseCaseResponse> {
    // Check if user exists
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new ResourceNotFoundError('User not found');
    }

    // If poolId is provided, validate that the pool exists and user is a participant
    if (poolId) {
      const pool = await this.poolsRepository.findById(poolId);
      if (!pool) {
        throw new ResourceNotFoundError('Pool not found');
      }

      // Check if user is a participant in the specified pool
      const participants = await this.poolsRepository.getPoolParticipants(poolId);
      const isParticipant = participants.some((participant) => participant.userId === userId);
      const isCreator = pool.creatorId === userId;

      if (!isParticipant && !isCreator) {
        throw new NotParticipantError('User is not a participant in this pool');
      }
    }

    // Get all predictions for the user, optionally filtered by pool
    const predictions = await this.predictionsRepository.findByUserId(userId, poolId);

    return {
      predictions,
    };
  }
}
