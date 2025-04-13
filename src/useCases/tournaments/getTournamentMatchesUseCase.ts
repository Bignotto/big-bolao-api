import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { IMatchesRepository } from '@/repositories/matches/IMatchesRepository';
import { ITournamentsRepository } from '@/repositories/tournaments/ITournamentsRepository';
import { Match } from '@prisma/client';

interface GetTournamentMatchesUseCaseRequest {
  tournamentId: number;
}

interface GetTournamentMatchesUseCaseResponse {
  matches: Match[];
}

export class GetTournamentMatchesUseCase {
  constructor(
    private matchesRepository: IMatchesRepository,
    private tournamentsRepository: ITournamentsRepository
  ) {}

  async execute({
    tournamentId,
  }: GetTournamentMatchesUseCaseRequest): Promise<GetTournamentMatchesUseCaseResponse> {
    // Check if tournament exists
    const tournament = await this.tournamentsRepository.findById(tournamentId);

    if (!tournament) {
      throw new ResourceNotFoundError('Tournament not found');
    }

    // Get all matches for the tournament
    const matches = await this.matchesRepository.findByTournamentId(tournamentId);

    return {
      matches,
    };
  }
}
