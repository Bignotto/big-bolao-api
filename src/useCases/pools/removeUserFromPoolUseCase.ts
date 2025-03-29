import { ResourceNotFoundError } from '../../global/errors/ResourceNotFoundError';
import { IPoolsRepository } from '../../repositories/pools/IPoolsRepository';
import { IUsersRepository } from '../../repositories/users/IUsersRepository';

interface IRemoveUserFromPoolRequest {
  poolId: number;
  userIdToRemove: string;
  creatorId: string;
}

export class RemoveUserFromPoolUseCase {
  constructor(
    private poolsRepository: IPoolsRepository,
    private usersRepository: IUsersRepository
  ) {}

  async execute({ poolId, userIdToRemove, creatorId }: IRemoveUserFromPoolRequest) {
    // Verify pool exists
    const pool = await this.poolsRepository.findById(poolId);
    if (!pool) {
      throw new ResourceNotFoundError('Pool not found');
    }

    // Verify the requester is the pool creator
    if (pool.creatorId !== creatorId) {
      throw new Error('Only the pool creator can remove users');
    }

    // Verify user to remove exists
    const userToRemove = await this.usersRepository.findById(userIdToRemove);
    if (!userToRemove) {
      throw new ResourceNotFoundError('User to remove not found');
    }

    // Check if user is a participant
    const participants = await this.poolsRepository.getPoolParticipants(poolId);
    const isParticipant = participants.some((participant) => participant.userId === userIdToRemove);

    if (!isParticipant) {
      throw new Error('User is not a participant in this pool');
    }

    // Remove user from pool participants
    await this.poolsRepository.removeParticipant({
      poolId,
      userId: userIdToRemove,
    });

    return pool;
  }
}
