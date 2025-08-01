import { Pool } from '@prisma/client';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';

import { UnauthorizedError } from './errors/UnauthorizedError';

interface IJoinPoolByIdRequest {
  poolId: number;
  userId: string;
}

export class JoinPoolByIdUseCase {
  constructor(
    private poolsRepository: IPoolsRepository,
    private usersRepository: IUsersRepository
  ) {}

  async execute({ poolId, userId }: IJoinPoolByIdRequest): Promise<Pool> {
    // Verify user exists
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new ResourceNotFoundError('User not found');
    }

    // Find pool by ID
    const pool = await this.poolsRepository.findById(poolId);
    if (!pool) {
      throw new ResourceNotFoundError('Pool not found');
    }

    // Check if pool is private (cannot join private pools by ID)
    if (pool.isPrivate) {
      throw new UnauthorizedError(
        'This pool is private and can only be joined with an invite code'
      );
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
    const isAlreadyParticipant = participants.some((participant) => participant.id === userId);

    if (isAlreadyParticipant) {
      throw new UnauthorizedError('User is already a participant in this pool');
    }

    // Add user as participant
    await this.poolsRepository.addParticipant({
      poolId: pool.id,
      userId,
    });

    return {
      ...pool,
      tournamentId: pool.tournamentId,
    };
  }
}
