import { IMatchesRepository } from '@/repositories/matches/IMatchesRepository';
import { Match } from '@prisma/client';

interface GetTournamentMatchesUseCaseRequest {
  tournamentId: number;
}

interface GetTournamentMatchesUseCaseResponse {
  matches: Match[];
}

export class GetTournamentMatchesUseCase {
  constructor(private matchesRepository: IMatchesRepository) {}

  async execute({ tournamentId }: GetTournamentMatchesUseCaseRequest): Promise<GetTournamentMatchesUseCaseResponse> {
    const matches = await this.matchesRepository.findByTournamentId(tournamentId);

    return { matches };
  }
}