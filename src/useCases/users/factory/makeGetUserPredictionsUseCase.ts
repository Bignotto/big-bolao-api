import { PrismaPoolsRepository } from '../../../repositories/pools/PrismaPoolsRepository';
import { PrismaPredictionsRepository } from '../../../repositories/predictions/PrismaPredictionsRepository';
import { PrismaUsersRepository } from '../../../repositories/users/PrismaUsersRepository';
import { GetUserPredictionsUseCase } from '../getUserPredictionsUseCase';

export function makeGetUserPredictionsUseCase() {
  const predictionsRepository = new PrismaPredictionsRepository();
  const usersRepository = new PrismaUsersRepository();
  const poolsRepository = new PrismaPoolsRepository();
  const getUserPredictionsUseCase = new GetUserPredictionsUseCase(
    predictionsRepository,
    usersRepository,
    poolsRepository
  );

  return getUserPredictionsUseCase;
}
