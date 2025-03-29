import { ResourceNotFoundError } from '../../global/errors/ResourceNotFoundError';
import { IPoolsRepository } from '../../repositories/pools/IPoolsRepository';
import { IUsersRepository } from '../../repositories/users/IUsersRepository';

interface ILeavePoolRequest {
  poolId: number;
  userId: string;
}

export class LeavePoolUseCase {
  constructor(
    private poolsRepository: IPoolsRepository,
    private usersRepository: IUsersRepository
  ) {}

  async execute({ poolId, userId }: ILeavePoolRequest) {
    // Verify user exists
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new ResourceNotFoundError('User not found');
    }

    // Verify pool exists
    const pool = await this.poolsRepository.findById(poolId);
    if (!pool) {
      throw new ResourceNotFoundError('Pool not found');
    }

    // Check if user is a participant
    const participants = await this.poolsRepository.getPoolParticipants(poolId);
    const isParticipant = participants.some((participant) => participant.userId === userId);

    if (!isParticipant) {
      throw new Error('User is not a participant in this pool');
    }

    // Check if user is the creator (creators cannot leave their own pools)
    if (pool.creatorId === userId) {
      throw new Error('Pool creator cannot leave their own pool');
    }

    // Remove user from pool participants
    await this.poolsRepository.removeParticipant({
      poolId,
      userId,
    });

    return pool;
  }
}
