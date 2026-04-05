import { PrismaMatchesRepository } from '@/repositories/matches/PrismaMatchesRepository';
import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';

import { GetMyMatchPredictionsUseCase } from '../getMyMatchPredictionsUseCase';

export function makeGetMyMatchPredictionsUseCase(): GetMyMatchPredictionsUseCase {
  const matchesRepository = new PrismaMatchesRepository();
  const poolsRepository = new PrismaPoolsRepository();

  return new GetMyMatchPredictionsUseCase(matchesRepository, poolsRepository);
}
