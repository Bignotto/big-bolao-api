import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { PoolStandings } from '@/global/types/poolStandings';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';

interface GetPoolStandingsRequest {
  poolId: number;
}

interface GetPoolStandingsResponse {
  standings: PoolStandings[];
}

export class GetPoolStandingsUseCase {
  constructor(private poolsRepository: IPoolsRepository) {}

  async execute({ poolId }: GetPoolStandingsRequest): Promise<GetPoolStandingsResponse> {
    const pool = await this.poolsRepository.findById(poolId);
    if (!pool) {
      throw new ResourceNotFoundError('Pool not found');
    }

    const standings = await this.poolsRepository.getPoolStandings(poolId);

    return { standings };
  }
}
