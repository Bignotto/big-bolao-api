import { Tournament } from '@prisma/client';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { ITournamentsRepository } from '@/repositories/tournaments/ITournamentsRepository';

interface GetTournamentDetailUseCaseRequest {
  tournamentId: number;
}

export type TournamentWithStats = Tournament & {
  totalMatches: number;
  completedMatches: number;
  totalTeams: number;
  totalPools: number;
};

interface GetTournamentDetailUseCaseResponse {
  tournament: TournamentWithStats;
}

export class GetTournamentDetailUseCase {
  constructor(private tournamentsRepository: ITournamentsRepository) {}

  async execute({
    tournamentId,
  }: GetTournamentDetailUseCaseRequest): Promise<GetTournamentDetailUseCaseResponse> {
    const tournament = await this.tournamentsRepository.getDetails(tournamentId);

    if (!tournament) {
      throw new ResourceNotFoundError('Tournament not found');
    }

    return { tournament };
  }
}

