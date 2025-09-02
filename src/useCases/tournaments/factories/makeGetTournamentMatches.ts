import { PrismaMatchesRepository } from '@/repositories/matches/PrismaMatchesRepository';
import { PrismaTournamentsRepository } from '@/repositories/tournaments/PrismaTournamentsRepository';

import { GetTournamentMatchesUseCase } from '../getTournamentMatchesUseCase';

export function makeGetTournamentMatchesUseCase(): GetTournamentMatchesUseCase {
  const matchesRepository = new PrismaMatchesRepository();
  const tournamentsRepository = new PrismaTournamentsRepository();
  const useCase = new GetTournamentMatchesUseCase(matchesRepository, tournamentsRepository);

  return useCase;
}
