import { PrismaMatchesRepository } from '@/repositories/matches/PrismaMatchesRepository';

import { GetTournamentMatchesUseCase } from '../getTournamentMatchesUseCase';

export function makeGetTournamentMatchesUseCase(): GetTournamentMatchesUseCase {
  const matchesRepository = new PrismaMatchesRepository();
  const useCase = new GetTournamentMatchesUseCase(matchesRepository);

  return useCase;
}
