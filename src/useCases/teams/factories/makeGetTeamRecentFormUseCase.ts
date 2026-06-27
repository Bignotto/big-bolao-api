import { PrismaMatchesRepository } from '@/repositories/matches/PrismaMatchesRepository';

import { GetTeamRecentFormUseCase } from '../getTeamRecentFormUseCase';

export function makeGetTeamRecentFormUseCase(): GetTeamRecentFormUseCase {
  const matchesRepository = new PrismaMatchesRepository();
  return new GetTeamRecentFormUseCase(matchesRepository);
}
