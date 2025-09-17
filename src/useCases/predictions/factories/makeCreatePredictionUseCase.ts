import { PrismaMatchesRepository } from '@/repositories/matches/PrismaMatchesRepository';
import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { PrismaPredictionsRepository } from '@/repositories/predictions/PrismaPredictionsRepository';
import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';

import { CreatePredictionUseCase } from '../createPredictionUseCase';

export function makeCreatePredictionUseCase(): CreatePredictionUseCase {
  const predictionsRepository = new PrismaPredictionsRepository();
  const poolsRepository = new PrismaPoolsRepository();
  const usersRepository = new PrismaUsersRepository();
  const matchesRepository = new PrismaMatchesRepository();

  const useCase = new CreatePredictionUseCase(
    predictionsRepository,
    poolsRepository,
    usersRepository,
    matchesRepository
  );

  return useCase;
}
