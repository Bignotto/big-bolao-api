import { PrismaMatchesRepository } from '@/repositories/matches/PrismaMatchesRepository';

import { GetMatchUseCase } from '../getMatchUseCase';

export function makeGetMatchUseCase(): GetMatchUseCase {
  const matchesRepository = new PrismaMatchesRepository();
  const getMatchUseCase = new GetMatchUseCase(matchesRepository);

  return getMatchUseCase;
}
