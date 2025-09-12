import { PoolAuthorizationService } from '@/services/pools/PoolAuthorizationService';

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
    private usersRepository: IUsersRepository,
    private poolAuthorizationService: PoolAuthorizationService
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

    // Validate user can leave the pool (is participant but not creator)
    await this.poolAuthorizationService.validateParticipantCanLeave(poolId, userId, pool.creatorId);

    // Remove user from pool participants
    await this.poolsRepository.removeParticipant({
      poolId,
      userId,
    });

    return pool;
  }
}
