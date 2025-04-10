import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { IMatchesRepository } from '@/repositories/matches/IMatchesRepository';
import { Match } from '@prisma/client';

interface GetMatchRequest {
  matchId: number;
}

export class GetMatchUseCase {
  constructor(private matchesRepository: IMatchesRepository) {}

  async execute({ matchId }: GetMatchRequest): Promise<Match> {
    // Get match with teams information
    const match = await this.matchesRepository.getMatchWithTeams(matchId);

    if (!match) {
      throw new ResourceNotFoundError('Match not found');
    }

    return match;
  }
}
