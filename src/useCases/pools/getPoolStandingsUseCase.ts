import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { PoolStandings } from '@/global/types/poolStandings';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { NotParticipantError } from './errors/NotParticipantError';

interface GetPoolStandingsRequest {
  poolId: number;
  userId: string;
}

interface GetPoolStandingsResponse {
  standings: PoolStandings[];
}

export class GetPoolStandingsUseCase {
  constructor(private poolsRepository: IPoolsRepository) {}

  async execute({ poolId, userId }: GetPoolStandingsRequest): Promise<GetPoolStandingsResponse> {
    const pool = await this.poolsRepository.findById(poolId);
    if (!pool) {
      throw new ResourceNotFoundError('Pool not found');
    }

    // Check authorization
    const participants = await this.poolsRepository.getPoolParticipants(poolId);
    const isParticipant = participants.some((participant) => participant.userId === userId);
    const isCreator = pool.creatorId === userId;

    if (!isParticipant && !isCreator) {
      throw new NotParticipantError('User is not a participant or the creator of the pool');
    }

    const standings = await this.poolsRepository.getPoolStandings(poolId);

    return { standings };
  }
}
