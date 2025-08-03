import { PoolParticipant } from '@/global/types/poolParticipant';
import { PoolAuthorizationService } from '@/services/pools/PoolAuthorizationService';

import { ResourceNotFoundError } from '../../global/errors/ResourceNotFoundError';
import { IPoolsRepository } from '../../repositories/pools/IPoolsRepository';
import { IUsersRepository } from '../../repositories/users/IUsersRepository';

interface IGetPoolUsersRequest {
  poolId: number;
  userId: string; // The user requesting the information (for authorization)
}

interface ExtendedPoolParticipant extends PoolParticipant {
  isOwner: boolean;
}

export class GetPoolUsersUseCase {
  constructor(
    private poolsRepository: IPoolsRepository,
    private usersRepository: IUsersRepository,
    private poolAuthorizationService: PoolAuthorizationService
  ) {}

  async execute({ poolId, userId }: IGetPoolUsersRequest): Promise<ExtendedPoolParticipant[]> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new ResourceNotFoundError(`User with ID ${userId} not found`);
    }

    const pool = await this.poolsRepository.findById(poolId);
    if (!pool) {
      throw new ResourceNotFoundError('Pool not found');
    }

    await this.poolAuthorizationService.validateUserPoolAccess(poolId, userId, pool.creatorId);

    const participants = await this.poolsRepository.getPoolParticipants(poolId);

    return participants.map((participant) => {
      return {
        ...participant,
        isOwner: participant.id === pool.creatorId, // Check if the participant is the owner
      };
    });
  }
}
