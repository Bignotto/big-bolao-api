import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { NotParticipantError } from '@/useCases/pools/errors/NotParticipantError';

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
}
