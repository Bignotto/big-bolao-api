import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';
import { NotParticipantError } from './errors/NotParticipantError';

interface IGetPoolRequest {
  poolId: number;
  userId: string; // User requesting the pool info (for authorization checks if needed)
}

export class GetPoolUseCase {
  constructor(
    private poolsRepository: IPoolsRepository,
    private usersRepository: IUsersRepository
  ) {}

  async execute({ poolId, userId }: IGetPoolRequest) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new ResourceNotFoundError('User not found');
    }

    const pool = await this.poolsRepository.getPool(poolId);
    if (!pool) {
      throw new ResourceNotFoundError('Pool not found');
    }

    // Check if the user is a participant in the pool or the creator
    const participants = await this.poolsRepository.getPoolParticipants(poolId);
    const isParticipant = participants.some((participant) => participant.userId === user.id);

    if (!isParticipant && pool.creatorId !== user.id) {
      throw new NotParticipantError('User is not a participant or the creator of the pool');
    }

    if (!pool.scoringRules) {
      throw new ResourceNotFoundError('Scoring rules not found for this pool');
    }

    return pool;
  }
}
