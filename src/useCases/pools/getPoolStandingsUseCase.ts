import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { PoolStandings } from '@/global/types/poolStandings';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { PoolAuthorizationService } from '@/services/pools/PoolAuthorizationService';

interface GetPoolStandingsRequest {
  poolId: number;
  userId: string;
}

interface GetPoolStandingsResponse {
  standings: PoolStandings[];
}

export class GetPoolStandingsUseCase {
  constructor(
    private poolsRepository: IPoolsRepository,
    private poolAuthorizationService: PoolAuthorizationService
  ) {}

  async execute({ poolId, userId }: GetPoolStandingsRequest): Promise<GetPoolStandingsResponse> {
    const pool = await this.poolsRepository.findById(poolId);
    if (!pool) {
      throw new ResourceNotFoundError('Pool not found');
    }

    // Validate user has access to the pool
    await this.poolAuthorizationService.validateUserPoolAccess(poolId, userId, pool.creatorId);

    const standings = await this.poolsRepository.getPoolStandings(poolId);

    return { standings };
  }
}
