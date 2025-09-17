import { PrismaMatchesRepository } from '@/repositories/matches/PrismaMatchesRepository';
import { PrismaPredictionsRepository } from '@/repositories/predictions/PrismaPredictionsRepository';

import { GetMatchPredictionsUseCase } from '../getMatchPredictionsUseCase';

export function makeGetMatchPredictionsUseCase(): GetMatchPredictionsUseCase {
  const predictionsRepository = new PrismaPredictionsRepository();
  const matchesRepository = new PrismaMatchesRepository();
  const useCase = new GetMatchPredictionsUseCase(predictionsRepository, matchesRepository);

  return useCase;
}
