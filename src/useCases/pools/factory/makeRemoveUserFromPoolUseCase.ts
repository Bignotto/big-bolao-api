import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';

import { RemoveUserFromPoolUseCase } from '../removeUserFromPoolUseCase';

export function makeRemoveUserFromPoolUseCase(): RemoveUserFromPoolUseCase {
  const poolsRepository = new PrismaPoolsRepository();
  const usersRepository = new PrismaUsersRepository();
  const removeUserFromPoolUseCase = new RemoveUserFromPoolUseCase(poolsRepository, usersRepository);

  return removeUserFromPoolUseCase;
}
