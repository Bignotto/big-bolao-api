import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { IMatchesRepository } from '@/repositories/matches/IMatchesRepository';
import { IPoolsRepository, PoolPredictionEntry } from '@/repositories/pools/IPoolsRepository';

interface GetMyMatchPredictionsUseCaseRequest {
  matchId: number;
  userId: string;
}

interface GetMyMatchPredictionsUseCaseResponse {
  predictions: PoolPredictionEntry[];
}

export class GetMyMatchPredictionsUseCase {
  constructor(
    private matchesRepository: IMatchesRepository,
    private poolsRepository: IPoolsRepository
  ) {}

  async execute({
    matchId,
    userId,
  }: GetMyMatchPredictionsUseCaseRequest): Promise<GetMyMatchPredictionsUseCaseResponse> {
    const match = await this.matchesRepository.findById(matchId);

    if (!match) {
      throw new ResourceNotFoundError('Match not found');
    }

    const predictions = await this.poolsRepository.getPoolsWithUserPredictionForMatch({
      tournamentId: match.tournamentId,
      matchId,
      userId,
    });

    return { predictions };
  }
}
