import { Prediction } from '@prisma/client';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { IMatchesRepository } from '@/repositories/matches/IMatchesRepository';
import { IPredictionsRepository } from '@/repositories/predictions/IPredictionsRepository';

interface GetMatchPredictionsRequest {
  matchId: number;
}

export class GetMatchPredictionsUseCase {
  constructor(
    private predictionsRepository: IPredictionsRepository,
    private matchesRepository: IMatchesRepository
  ) {}

  async execute({ matchId }: GetMatchPredictionsRequest): Promise<Prediction[]> {
    // Check if match exists
    const match = await this.matchesRepository.findById(matchId);

    if (!match) {
      throw new ResourceNotFoundError('Match not found');
    }

    // Get all predictions for the match
    const predictions = await this.predictionsRepository.findByMatchId(matchId);

    return predictions;
  }
}
