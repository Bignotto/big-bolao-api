import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { MatchOdds } from '@/global/types/matchOdds';
import { mapRawToMatchOdds } from '@/global/utils/matchOddsMapper';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { IPredictionsRepository } from '@/repositories/predictions/IPredictionsRepository';
import { PoolAuthorizationService } from '@/services/pools/PoolAuthorizationService';

interface GetPoolMatchOddsByMatchRequest {
  poolId: number;
  matchId: number;
  userId: string;
}

interface GetPoolMatchOddsByMatchResponse {
  odds: MatchOdds;
}

export class GetPoolMatchOddsByMatchUseCase {
  constructor(
    private poolsRepository: IPoolsRepository,
    private predictionsRepository: IPredictionsRepository,
    private poolAuthorizationService: PoolAuthorizationService
  ) {}

  async execute({
    poolId,
    matchId,
    userId,
  }: GetPoolMatchOddsByMatchRequest): Promise<GetPoolMatchOddsByMatchResponse> {
    const pool = await this.poolsRepository.findById(poolId);
    if (!pool) throw new ResourceNotFoundError('Pool not found');

    await this.poolAuthorizationService.validateUserPoolAccess(poolId, userId, pool.creatorId);

    const raw = await this.predictionsRepository.getMatchOddsByMatchId(
      poolId,
      pool.tournamentId,
      matchId
    );
    if (!raw) throw new ResourceNotFoundError('Match not found');

    return { odds: mapRawToMatchOdds(raw) };
  }
}
