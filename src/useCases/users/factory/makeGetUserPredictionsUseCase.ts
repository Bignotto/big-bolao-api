import { PrismaPredictionsRepository } from '../../../repositories/predictions/PrismaPredictionsRepository';
import { PrismaUsersRepository } from '../../../repositories/users/PrismaUsersRepository';
import { GetUserPredictionsUseCase } from '../getUserPredictionsUseCase';

export function makeGetUserPredictionsUseCase() {
  const predictionsRepository = new PrismaPredictionsRepository();
  const usersRepository = new PrismaUsersRepository();
  const getUserPredictionsUseCase = new GetUserPredictionsUseCase(
    predictionsRepository,
    usersRepository
  );

  return getUserPredictionsUseCase;
}
