import { ResourceNotFoundError } from '../../global/errors/ResourceNotFoundError';
import { IPoolsRepository } from '../../repositories/pools/IPoolsRepository';
import { IUsersRepository } from '../../repositories/users/IUsersRepository';
import { NotPoolCreatorError } from './errors/NotPoolCreatorError';

interface IUpdatePoolRequest {
  poolId: number;
  userId: string; // User requesting the update (for authorization)
  name?: string;
  description?: string;
  isPrivate?: boolean;
  maxParticipants?: number;
  registrationDeadline?: Date;
}

export class UpdatePoolUseCase {
  constructor(
    private poolsRepository: IPoolsRepository,
    private usersRepository: IUsersRepository
  ) {}

  async execute({
    poolId,
    userId,
    name,
    description,
    isPrivate,
    maxParticipants,
    registrationDeadline,
  }: IUpdatePoolRequest) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new ResourceNotFoundError('User not found');
    }

    const pool = await this.poolsRepository.findById(poolId);
    if (!pool) {
      throw new ResourceNotFoundError('Pool not found');
    }

    if (pool.creatorId !== userId) {
      throw new NotPoolCreatorError(`User ${userId} is not the creator of pool ${poolId}`);
    }
    const updatedPool = await this.poolsRepository.update(poolId, {
      name,
      description,
      isPrivate,
      maxParticipants,
      registrationDeadline,
    });

    return updatedPool;
  }
}
