import { PoolAuthorizationService } from '@/services/pools/PoolAuthorizationService';
import { ResourceNotFoundError } from '../../global/errors/ResourceNotFoundError';
import { IPoolsRepository } from '../../repositories/pools/IPoolsRepository';
import { IUsersRepository } from '../../repositories/users/IUsersRepository';

interface IGetPoolUsersRequest {
  poolId: number;
  userId: string; // The user requesting the information (for authorization)
}

export class GetPoolUsersUseCase {
  constructor(
    private poolsRepository: IPoolsRepository,
    private usersRepository: IUsersRepository,
    private poolAuthorizationService: PoolAuthorizationService
  ) {}

  async execute({ poolId, userId }: IGetPoolUsersRequest) {
    // Verify if the user exists
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new ResourceNotFoundError(`User with ID ${userId} not found`);
    }

    // Verify if the pool exists
    const pool = await this.poolsRepository.findById(poolId);
    if (!pool) {
      throw new ResourceNotFoundError('Pool not found');
    }

    // Validate user has access to the pool
    await this.poolAuthorizationService.validateUserPoolAccess(poolId, userId, pool.creatorId);

    // Get all participants
    const participants = await this.poolsRepository.getPoolParticipants(poolId);
    const participantIds = participants.map((participant) => participant.userId);

    // Fetch all user details for the participants
    const users = await Promise.all(participantIds.map((id) => this.usersRepository.findById(id)));

    // Filter out any null values (in case a user was deleted)
    const validUsers = users.filter((user) => user !== null);

    return validUsers;
  }
}
