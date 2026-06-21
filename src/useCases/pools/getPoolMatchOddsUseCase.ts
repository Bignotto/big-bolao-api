import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { MatchOdds } from '@/global/types/matchOdds';
import { mapRawToMatchOdds } from '@/global/utils/matchOddsMapper';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { IPredictionsRepository } from '@/repositories/predictions/IPredictionsRepository';
import { PoolAuthorizationService } from '@/services/pools/PoolAuthorizationService';

interface GetPoolMatchOddsRequest {
  poolId: number;
  userId: string;
}

interface GetPoolMatchOddsResponse {
  odds: MatchOdds[];
}

export class GetPoolMatchOddsUseCase {
  constructor(
    private poolsRepository: IPoolsRepository,
    private predictionsRepository: IPredictionsRepository,
    private poolAuthorizationService: PoolAuthorizationService
  ) {}

  async execute({ poolId, userId }: GetPoolMatchOddsRequest): Promise<GetPoolMatchOddsResponse> {
    const pool = await this.poolsRepository.findById(poolId);
    if (!pool) throw new ResourceNotFoundError('Pool not found');

    await this.poolAuthorizationService.validateUserPoolAccess(poolId, userId, pool.creatorId);

    const raw = await this.predictionsRepository.getMatchOdds(poolId, pool.tournamentId);
    const odds = raw.map(mapRawToMatchOdds);

    return { odds };
  }
}
