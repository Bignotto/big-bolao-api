import { PrismaUsersRepository } from '../../../repositories/users/PrismaUsersRepository';
import { GetUserInfoUseCase } from '../getUserInfoUseCase';

export function makeGetUserInfoUseCase(): GetUserInfoUseCase {
  const usersRepository = new PrismaUsersRepository();
  const getUserInfoUseCase = new GetUserInfoUseCase(usersRepository);

  return getUserInfoUseCase;
}
