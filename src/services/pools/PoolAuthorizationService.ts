import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { NotParticipantError } from '@/useCases/pools/errors/NotParticipantError';
import { NotPoolCreatorError } from '@/useCases/pools/errors/NotPoolCreatorError';
import { UnauthorizedError } from '@/useCases/pools/errors/UnauthorizedError';

interface IPoolAuthorizationResult {
  isCreator: boolean;
  isParticipant: boolean;
  hasAccess: boolean;
}

export class PoolAuthorizationService {
  constructor(private poolsRepository: IPoolsRepository) {}

  async checkUserPoolAccess(
    poolId: number,
    userId: string,
    creatorId: string
  ): Promise<IPoolAuthorizationResult> {
    const participants = await this.poolsRepository.getPoolParticipants(poolId);

    const isParticipant = participants.some((participant) => participant.userId === userId);
    const isCreator = creatorId === userId;
    const hasAccess = isParticipant || isCreator;

    return {
      isCreator,
      isParticipant,
      hasAccess,
    };
  }

  async validateUserPoolAccess(
    poolId: number,
    userId: string,
    creatorId: string
  ): Promise<IPoolAuthorizationResult> {
    const result = await this.checkUserPoolAccess(poolId, userId, creatorId);

    if (!result.hasAccess) {
      throw new NotParticipantError('User is not a participant or the creator of the pool');
    }

    return result;
  }

  async validatePoolCreatorAccess(
    poolId: number,
    userId: string,
    creatorId: string
  ): Promise<void> {
    if (creatorId !== userId) {
      throw new NotPoolCreatorError(`User ${userId} is not the creator of pool ${poolId}`);
    }
  }

  async validateParticipantAccess(poolId: number, userId: string): Promise<void> {
    const participants = await this.poolsRepository.getPoolParticipants(poolId);
    const isParticipant = participants.some((participant) => participant.userId === userId);

    if (!isParticipant) {
      throw new NotParticipantError('User is not a participant in this pool');
    }
  }

  async validateParticipantCanLeave(
    poolId: number,
    userId: string,
    creatorId: string
  ): Promise<void> {
    // First check if user is a participant
    await this.validateParticipantAccess(poolId, userId);

    // Then check if user is not the creator (creators cannot leave their own pools)
    if (creatorId === userId) {
      throw new UnauthorizedError('Pool creator cannot leave their own pool');
    }
  }
}
