import { PrismaMatchesRepository } from '@/repositories/matches/PrismaMatchesRepository';
import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { PrismaPredictionsRepository } from '@/repositories/predictions/PrismaPredictionsRepository';
import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';
import { UpdatePredictionUseCase } from '../updatePredictionUseCase';

export function makeUpdatePredictionUseCase() {
  const predictionsRepository = new PrismaPredictionsRepository();
  const poolsRepository = new PrismaPoolsRepository();
  const usersRepository = new PrismaUsersRepository();
  const matchesRepository = new PrismaMatchesRepository();

  const updatePredictionUseCase = new UpdatePredictionUseCase(
    predictionsRepository,
    poolsRepository,
    usersRepository,
    matchesRepository
  );

  return updatePredictionUseCase;
}
