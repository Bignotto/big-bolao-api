import { ResourceNotFoundError } from '../../global/errors/ResourceNotFoundError';
import { IPoolsRepository } from '../../repositories/pools/IPoolsRepository';
import { IUsersRepository } from '../../repositories/users/IUsersRepository';
import { UnauthorizedError } from './errors/UnauthorizedError';

interface IJoinPoolRequest {
  poolId?: number;
  inviteCode?: string;
  userId: string;
}

export class JoinPoolUseCase {
  constructor(
    private poolsRepository: IPoolsRepository,
    private usersRepository: IUsersRepository
  ) {}

  async execute({ poolId, inviteCode, userId }: IJoinPoolRequest) {
    // Verify user exists
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new ResourceNotFoundError('User not found');
    }

    let pool;

    // Find pool by ID or invite code
    if (poolId) {
      pool = await this.poolsRepository.findById(poolId);
    } else if (inviteCode) {
      pool = await this.poolsRepository.findByInviteCode(inviteCode, poolId!);
    } else {
      throw new ResourceNotFoundError('Either poolId or inviteCode must be provided');
    }

    if (!pool) {
      throw new ResourceNotFoundError('Pool not found');
    }

    // Check if pool is private and user has the correct invite code
    if (pool.isPrivate && !inviteCode) {
      throw new UnauthorizedError('This pool is private and requires an invite code');
    }

    if (pool.isPrivate && inviteCode !== pool.inviteCode) {
      throw new UnauthorizedError('Invalid invite code');
    }

    // Check if pool has a maximum number of participants
    if (pool.maxParticipants) {
      const participants = await this.poolsRepository.getPoolParticipants(pool.id);
      if (participants.length >= pool.maxParticipants) {
        throw new Error('Pool has reached maximum number of participants');
      }
    }

    // Check if registration deadline has passed
    if (pool.registrationDeadline && new Date() > pool.registrationDeadline) {
      throw new Error('Registration deadline has passed');
    }

    // Check if user is already a participant
    const participants = await this.poolsRepository.getPoolParticipants(pool.id);
    const isAlreadyParticipant = participants.some((participant) => participant.userId === userId);

    if (isAlreadyParticipant) {
      throw new UnauthorizedError('User is already a participant in this pool');
    }

    // Add user as participant
    await this.poolsRepository.addParticipant({
      poolId: pool.id,
      userId,
    });

    return pool;
  }
}
