import { PrismaMatchesRepository } from '@/repositories/matches/PrismaMatchesRepository';
import { PrismaTournamentsRepository } from '@/repositories/tournaments/PrismaTournamentsRepository';

import { UpdateMatchUseCase } from '../updateMatchUseCase';

export function makeUpdateMatchUseCase(): UpdateMatchUseCase {
  const matchesRepository = new PrismaMatchesRepository();
  const tournamentsRepository = new PrismaTournamentsRepository();
  const updateMatchUseCase = new UpdateMatchUseCase(matchesRepository, tournamentsRepository);

  return updateMatchUseCase;
}
