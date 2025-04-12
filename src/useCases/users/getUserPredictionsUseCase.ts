import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
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
    private usersRepository: IUsersRepository
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

    // Get all predictions for the user, optionally filtered by pool
    const predictions = await this.predictionsRepository.findByUserId(userId, poolId);

    return {
      predictions,
    };
  }
}
