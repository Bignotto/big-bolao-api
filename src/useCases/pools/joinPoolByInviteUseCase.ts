import { Pool } from '@prisma/client';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';

import { DeadlineError } from './errors/DeadlineError';
import { MaxParticipantsError } from './errors/MaxParticipantsError';
import { UnauthorizedError } from './errors/UnauthorizedError';

interface IJoinPoolByInviteRequest {
  inviteCode: string;
  userId: string;
}

export class JoinPoolByInviteUseCase {
  constructor(
    private poolsRepository: IPoolsRepository,
    private usersRepository: IUsersRepository
  ) {}

  async execute({ inviteCode, userId }: IJoinPoolByInviteRequest): Promise<Pool> {
    // Verify user exists
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new ResourceNotFoundError('User not found');
    }

    // Find pool by invite code
    const pool = await this.poolsRepository.findByInviteCode(inviteCode);
    if (!pool) {
      throw new ResourceNotFoundError('Pool not found with this invite code');
    }

    // Validate invite code (additional security check)
    if (inviteCode !== pool.inviteCode) {
      throw new UnauthorizedError('Invalid invite code');
    }

    const participants = await this.poolsRepository.getPoolParticipants(pool.id);

    // Check if pool has a maximum number of participants
    if (pool.maxParticipants && participants.length >= pool.maxParticipants) {
      throw new MaxParticipantsError(`${pool.maxParticipants}`);
    }

    // Check if registration deadline has passed
    if (pool.registrationDeadline && new Date() > pool.registrationDeadline) {
      throw new DeadlineError(`${pool.registrationDeadline.toDateString()}`);
    }

    // Check if user is already a participant
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
